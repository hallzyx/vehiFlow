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

interface Params {
  params: Promise<{ id: string }>
}

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
    const modalidadRaw = body.modalidad as ModalidadAnticipado | undefined
    const modalidad: ModalidadAnticipado = modalidadRaw === "REDUCIR_CUOTA" ? "REDUCIR_CUOTA" : "REDUCIR_PLAZO"

    if (!montoPago || montoPago <= 0) {
      return NextResponse.json({ error: "El monto del pago debe ser mayor a 0" }, { status: 400 })
    }

    const operacion = await prisma.operacion.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizacion: {
          include: {
            cuotas: { orderBy: { numero: "asc" } },
          },
        },
      },
    })

    if (!operacion) {
      return NextResponse.json({ error: "Operación no encontrada" }, { status: 404 })
    }

    if (operacion.estadoOp !== "ACTIVA") {
      return NextResponse.json({ error: "Solo se permiten pagos sobre operaciones activas" }, { status: 400 })
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
              ? "El monto ingresado corresponde a cancelación total anticipada"
              : "El monto corresponde a pago de cuota normal, no a pago anticipado parcial",
          analisis,
        },
        { status: 400 }
      )
    }

    const cuotaBaseOriginal = round2(contexto.cuotaReferencia.interes + contexto.cuotaReferencia.amortizacion)
    const fechaPrimeraCuotaNueva = new Date(fechaPago)
    fechaPrimeraCuotaNueva.setDate(fechaPrimeraCuotaNueva.getDate() + 30)

    const opcionA = recalcularCronogramaPorAnticipado({
      modalidad: "REDUCIR_PLAZO",
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

    const opcionB = recalcularCronogramaPorAnticipado({
      modalidad: "REDUCIR_CUOTA",
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

    const seleccionado = modalidad === "REDUCIR_PLAZO" ? opcionA : opcionB

    return NextResponse.json({
      success: true,
      analisis,
      previewOpciones: {
        REDUCIR_PLAZO: {
          cuota: opcionA.nuevaCuotaBase,
          plazoMeses: opcionA.nuevoPlazoMeses,
          ahorroIntereses: opcionA.ahorroIntereses,
          fechaTermino: opcionA.fechaTermino,
        },
        REDUCIR_CUOTA: {
          cuota: opcionB.nuevaCuotaBase,
          plazoMeses: opcionB.nuevoPlazoMeses,
          ahorroIntereses: opcionB.ahorroIntereses,
          fechaTermino: opcionB.fechaTermino,
        },
      },
      seleccionado: {
        modalidad: seleccionado.modalidad,
        indicadores: {
          tcea: seleccionado.tcea,
          vanDeudor: seleccionado.vanDeudor,
          tirAnual: seleccionado.tirAnualPct,
          tirNoConverge: seleccionado.tirNoConverge,
          interesResidual: seleccionado.totalIntereses,
          ahorroIntereses: seleccionado.ahorroIntereses,
        },
        cronograma: seleccionado.cronograma,
      },
    })
  } catch (error) {
    console.error("Error recalculando pago anticipado:", error)
    return NextResponse.json({ error: "Error recalculando pago anticipado" }, { status: 500 })
  }
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}
