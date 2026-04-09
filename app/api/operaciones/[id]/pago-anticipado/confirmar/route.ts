import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import {
  analizarPagoExtraordinario,
  normalizarCuotas,
  recalcularCronogramaPorAnticipado,
  resolverContextoOperacion,
  type ModalidadAnticipado,
} from "@/lib/pago-anticipado"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

interface Params {
  params: Promise<{ id: string }>
}

const CANALES_VALIDOS = ["VENTANILLA", "TRANSFERENCIA", "APP", "DEBITO_AUTOMATICO", "OTRO"] as const

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const montoPago = Number(body.montoPago)
    const fechaPago = new Date(body.fechaPago)
    const modalidad = body.modalidad as ModalidadAnticipado
    const canalPago = body.canalPago as (typeof CANALES_VALIDOS)[number]
    const referencia = String(body.referencia || "").trim()
    const observaciones = String(body.observaciones || "").trim()

    if (!montoPago || montoPago <= 0) {
      return NextResponse.json({ error: "El monto del pago debe ser mayor a 0" }, { status: 400 })
    }

    if (isNaN(fechaPago.getTime())) {
      return NextResponse.json({ error: "Fecha de pago inválida" }, { status: 400 })
    }

    if (!["REDUCIR_PLAZO", "REDUCIR_CUOTA"].includes(modalidad)) {
      return NextResponse.json({ error: "Debes seleccionar la modalidad del cliente" }, { status: 400 })
    }

    if (!CANALES_VALIDOS.includes(canalPago)) {
      return NextResponse.json({ error: "Canal de pago inválido" }, { status: 400 })
    }

    if (referencia.length < 4) {
      return NextResponse.json({ error: "La referencia de pago debe tener al menos 4 caracteres" }, { status: 400 })
    }

    const operacion = await prisma.operacion.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizacion: {
          include: {
            cuotas: { orderBy: { numero: "asc" } },
            cliente: true,
            vehiculo: true,
          },
        },
      },
    })

    if (!operacion) {
      return NextResponse.json({ error: "Operación no encontrada" }, { status: 404 })
    }

    if (operacion.estadoOp !== "ACTIVA") {
      return NextResponse.json({ error: "Solo se pueden registrar pagos en operaciones activas" }, { status: 400 })
    }

    const cuotas = normalizarCuotas(operacion.cotizacion.cuotas as any[])
    const contexto = resolverContextoOperacion(cuotas, Number(operacion.saldoActual))

    const analisis = analizarPagoExtraordinario({
      saldoActual: Number(operacion.saldoActual),
      cuotaExigible: contexto.cuotaExigible,
      temPct: Number(operacion.cotizacion.tem),
      fechaUltimaCuota: contexto.fechaUltimaCuota,
      fechaPago,
      montoPago,
    })

    if (analisis.tipoPago !== "ANTICIPADO_PARCIAL") {
      return NextResponse.json(
        {
          error:
            analisis.tipoPago === "CANCELACION_TOTAL"
              ? "Este monto corresponde a cancelación total anticipada"
              : "Este monto corresponde a pago normal de cuota",
        },
        { status: 400 }
      )
    }

    const cuotaBaseOriginal = round2(contexto.cuotaReferencia.interes + contexto.cuotaReferencia.amortizacion)
    const fechaPrimeraCuotaNueva = new Date(fechaPago)
    fechaPrimeraCuotaNueva.setDate(fechaPrimeraCuotaNueva.getDate() + 30)

    const recalculo = recalcularCronogramaPorAnticipado({
      modalidad,
      saldoNuevo: analisis.saldoNuevo,
      cuotaBaseOriginal,
      cuotasRestantes: contexto.cuotasRestantes,
      residualFlag: operacion.cotizacion.residualFlag,
      residualMonto: Number(operacion.cotizacion.residualMonto || 0),
      temPct: Number(operacion.cotizacion.tem),
      segDesgravamenPct: Number(operacion.cotizacion.segDesgrav || 0),
      segVehicularAnual: Number(operacion.cotizacion.segVehicular || 0),
      fechaPrimeraCuotaNueva,
      interesesRestantesOriginales: contexto.interesesRestantes,
    })

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const result = await prisma.$transaction(async (tx) => {
      const pago = await tx.pago.create({
        data: {
          idOperacion: operacion.id,
          fechaPago,
          montoTotal: montoPago,
          tipoPago: "ANTICIPADO_PARCIAL",
          cuotaAplicada: analisis.cuotaAplicada,
          interesDia: analisis.interesDia,
          capitalAmort: analisis.capitalAmortizado,
          saldoAnterior: analisis.saldoAnterior,
          saldoNuevo: analisis.saldoNuevo,
          modalidad,
          penalidad: 0,
          canalPago,
          referencia,
          idUsuario: usuarioInternoId,
        },
      })

      await tx.cotizacion.update({
        where: { id: operacion.cotizacion.id },
        data: {
          estado: "ARCHIVADA_VERSION",
          motivoEdicion: `Pago anticipado ${modalidad}${observaciones ? `: ${observaciones}` : ""}`,
        },
      })

      const nuevaCotizacion = await tx.cotizacion.create({
        data: {
          idCliente: operacion.cotizacion.idCliente,
          idVehiculo: operacion.cotizacion.idVehiculo,
          idUsuario: usuarioInternoId,
          version: operacion.cotizacion.version + 1,
          estado: "APROBADA",
          monedaOp: operacion.cotizacion.monedaOp,
          tipoTasa: operacion.cotizacion.tipoTasa,
          tasaIngresada: operacion.cotizacion.tasaIngresada,
          capitalizacion: operacion.cotizacion.capitalizacion,
          tea: operacion.cotizacion.tea,
          tem: operacion.cotizacion.tem,
          precioVeh: operacion.cotizacion.precioVeh,
          cuotaIniPct: operacion.cotizacion.cuotaIniPct,
          cuotaIniMnt: operacion.cotizacion.cuotaIniMnt,
          montoFinanc: analisis.saldoNuevo,
          plazoMeses: recalculo.nuevoPlazoMeses,
          fecDesembolso: operacion.cotizacion.fecDesembolso,
          fec1eraCuota: fechaPrimeraCuotaNueva,
          graciaFlag: false,
          graciaTipo: null,
          graciaMeses: null,
          residualFlag: operacion.cotizacion.residualFlag,
          residualMonto: operacion.cotizacion.residualMonto,
          segDesgrav: operacion.cotizacion.segDesgrav,
          segVehicular: operacion.cotizacion.segVehicular,
          gastoGps: 0,
          gastoNotarial: 0,
          tcea: recalculo.tcea,
          vanDeudor: recalculo.vanDeudor,
          tirMensual: recalculo.tirMensualPct ?? 0,
          tirAnual: recalculo.tirAnualPct ?? 0,
          totPagado: recalculo.totalPagado,
          costoCredito: recalculo.totalPagado - analisis.saldoNuevo,
          motivoEdicion: `Pago anticipado ${modalidad}`,
        },
      })

      await tx.cuota.createMany({
        data: recalculo.cronograma.map((q) => ({
          idCotizacion: nuevaCotizacion.id,
          numero: q.numero,
          tipoCuota: q.tipoCuota,
          fecVencimiento: q.fechaVencimiento,
          saldoInicial: q.saldoInicial,
          interes: q.interes,
          amortizacion: q.amortizacion,
          segDesgravamen: q.segDesgravamen,
          segVehicular: q.segVehicular,
          otrosGastos: q.otrosGastos,
          cuotaTotal: q.cuotaTotal,
          saldoFinal: q.saldoFinal,
        })),
      })

      await tx.operacion.update({
        where: { id: operacion.id },
        data: {
          idCotizacion: nuevaCotizacion.id,
          saldoActual: analisis.saldoNuevo,
          versionCrono: operacion.versionCrono + 1,
          fecTermino: recalculo.fechaTermino,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "OPERACION",
          idEntidad: operacion.id,
          accion: "EDICION",
          camposAnteriores: {
            idCotizacion: operacion.cotizacion.id.toString(),
            saldoActual: analisis.saldoAnterior,
            versionCrono: operacion.versionCrono,
          },
          camposNuevos: {
            idCotizacion: nuevaCotizacion.id.toString(),
            saldoActual: analisis.saldoNuevo,
            versionCrono: operacion.versionCrono + 1,
            modalidad,
            montoPago,
            penalidad: 0,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return { pago, nuevaCotizacion }
    })

    const constanciaId = `CONST-${id}-${result.pago.id.toString()}`

    return NextResponse.json({
      success: true,
      message: "Pago anticipado registrado correctamente",
      constancia: {
        id: constanciaId,
        fechaPago,
        montoPago,
        modalidad,
        penalidad: 0,
      },
      operacion: {
        id,
        saldoNuevo: analisis.saldoNuevo,
        versionCrono: operacion.versionCrono + 1,
        proximaCuota: recalculo.cronograma[0]?.cuotaTotal ?? 0,
        fechaProximaCuota: recalculo.cronograma[0]?.fechaVencimiento ?? null,
      },
      cronograma: recalculo.cronograma,
      indicadores: {
        tcea: recalculo.tcea,
        vanDeudor: recalculo.vanDeudor,
        tirAnual: recalculo.tirAnualPct,
        tirNoConverge: recalculo.tirNoConverge,
        ahorroIntereses: recalculo.ahorroIntereses,
      },
    })
  } catch (error) {
    console.error("Error confirmando pago anticipado:", error)
    return NextResponse.json({ error: "Error confirmando pago anticipado" }, { status: 500 })
  }
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
