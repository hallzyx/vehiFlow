import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { buildParametrosCredito, mapCuotaToPrisma } from "@/lib/cotizacion-params"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"
import { toJsonSafe } from "@/lib/json-safe"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const cotizacionId = BigInt(id)
    const body = await req.json()
    const { formData, motivo } = body
    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const cotizacionActual = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        cliente: true,
        vehiculo: true,
        cuotas: true,
      },
    })

    if (!cotizacionActual) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    if (!["SIMULADA", "PRESENTADA"].includes(cotizacionActual.estado)) {
      return NextResponse.json(
        { error: "Solo se pueden editar cotizaciones en estado SIMULADA o PRESENTADA" },
        { status: 400 }
      )
    }

    const fp = formData?.parametros || {}
    const idCliente = formData?.selectedClienteId
      ? BigInt(formData.selectedClienteId)
      : cotizacionActual.idCliente
    const idVehiculo = formData?.selectedVehiculoId
      ? BigInt(formData.selectedVehiculoId)
      : cotizacionActual.idVehiculo

    const result = await prisma.$transaction(async (tx) => {
      await tx.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          estado: "ARCHIVADA_VERSION",
          motivoEdicion: motivo || "Edición sin motivo especificado",
          estadoDesde: new Date(),
        },
      })

      const vehiculo =
        idVehiculo === cotizacionActual.idVehiculo
          ? cotizacionActual.vehiculo
          : await tx.vehiculo.findUnique({ where: { id: idVehiculo } })

      if (!vehiculo) {
        throw new Error("Vehículo no encontrado")
      }

      // tasaIngresada y tea del motor van en % (ej. 16.18). Un bug previo guardó tea*100 (1617).
      const teaStoredPct = (() => {
        const t = Number(cotizacionActual.tea)
        if (!Number.isFinite(t) || t <= 0) return 16.1798
        return t > 0 && t < 2 ? t * 100 : t
      })()
      const tasaRaw = Number(fp.tasaIngresada ?? cotizacionActual.tasaIngresada ?? teaStoredPct)
      const tasaIngresada =
        Number.isFinite(tasaRaw) && tasaRaw > 100 ? teaStoredPct : tasaRaw
      const precioVehiculo = Number(
        fp.precioVehiculo ?? vehiculo.precioLista ?? cotizacionActual.precioVeh
      )
      const cuotaIniMnt = Number(fp.cuotaIniMnt ?? cotizacionActual.cuotaIniMnt)
      const cuotaIniPct =
        precioVehiculo > 0
          ? Number(fp.cuotaIniPct ?? (cuotaIniMnt / precioVehiculo) * 100)
          : Number(fp.cuotaIniPct ?? cotizacionActual.cuotaIniPct ?? 20)
      const graciaTotalMeses = Number(fp.graciaTotalMeses ?? cotizacionActual.graciaTotalMeses ?? 0)
      const graciaParcialMeses = Number(
        fp.graciaParcialMeses ?? cotizacionActual.graciaParcialMeses ?? 0
      )
      const graciaFlag =
        fp.graciaFlag != null
          ? Boolean(fp.graciaFlag)
          : graciaTotalMeses + graciaParcialMeses > 0
      const residualMonto = Number(fp.residualMonto ?? cotizacionActual.residualMonto ?? 0)
      const pctCuotaFinal =
        fp.pctCuotaFinal != null
          ? Number(fp.pctCuotaFinal)
          : cotizacionActual.pctCuotaFinal != null
            ? Number(cotizacionActual.pctCuotaFinal)
            : precioVehiculo > 0
              ? residualMonto / precioVehiculo
              : 0.4

      const fecDesembolso = fp.fecDesembolso
        ? new Date(fp.fecDesembolso)
        : cotizacionActual.fecDesembolso
      const fec1eraCuota = fp.fec1eraCuota
        ? new Date(fp.fec1eraCuota)
        : cotizacionActual.fec1eraCuota

      const resultadoFinanciero = calcularCredito(
        buildParametrosCredito({
          tasaIngresada,
          tipoTasa: "TEA",
          capitalizacion: null,
          precioVehiculo,
          cuotaIniMnt,
          plazoMeses: Number(fp.plazoMeses ?? cotizacionActual.plazoMeses),
          fecDesembolso,
          fec1eraCuota,
          graciaFlag,
          graciaTipo: graciaTotalMeses > 0 ? "TOTAL" : "PARCIAL",
          graciaMeses: graciaTotalMeses > 0 ? graciaTotalMeses : graciaParcialMeses,
          graciaTotalMeses: graciaTotalMeses || undefined,
          graciaParcialMeses: graciaParcialMeses || undefined,
          residualFlag: fp.residualFlag ?? cotizacionActual.residualFlag ?? true,
          residualMonto,
          pctCuotaFinal,
          segDesgrav: Number(fp.segDesgrav ?? cotizacionActual.segDesgrav ?? 0),
          segVehicular: Number(fp.segVehicular ?? cotizacionActual.segVehicular ?? 0),
          gastoGps: Number(fp.gastoGps ?? cotizacionActual.gastoGps ?? 0),
          gastoNotarial: Number(fp.gastoNotarial ?? cotizacionActual.gastoNotarial ?? 0),
          costeRegistral: Number(fp.costeRegistral ?? cotizacionActual.costeRegistral ?? 0) || undefined,
          costeTasacion: Number(fp.costeTasacion ?? cotizacionActual.costeTasacion ?? 0) || undefined,
          comisionEstudio:
            Number(fp.comisionEstudio ?? cotizacionActual.comisionEstudio ?? 0) || undefined,
          comisionActivacion:
            Number(fp.comisionActivacion ?? cotizacionActual.comisionActivacion ?? 0) || undefined,
          portesPer: Number(fp.portesPer ?? cotizacionActual.portesPer ?? 0) || undefined,
          gasAdmPer: Number(fp.gasAdmPer ?? cotizacionActual.gasAdmPer ?? 0) || undefined,
          pctSegRie: Number(fp.pctSegRie ?? cotizacionActual.pctSegRie ?? 0) || undefined,
          cokAnual: Number(fp.cokAnual ?? cotizacionActual.cokAnual ?? 0) || undefined,
        })
      )

      const nuevaCotizacion = await tx.cotizacion.create({
        data: {
          idCliente,
          idVehiculo,
          idUsuario: cotizacionActual.idUsuario,
          version: cotizacionActual.version + 1,
          estado: "SIMULADA",
          monedaOp: fp.monedaOp ?? cotizacionActual.monedaOp,
          tipoTasa: "TEA",
          capitalizacion: null,
          tasaIngresada: Number(Number(resultadoFinanciero.tea).toFixed(6)),
          tea: resultadoFinanciero.tea,
          tem: resultadoFinanciero.tem,
          precioVeh: precioVehiculo,
          cuotaIniPct,
          cuotaIniMnt,
          montoFinanc: resultadoFinanciero.montoFinanciado,
          plazoMeses: Number(fp.plazoMeses ?? cotizacionActual.plazoMeses),
          fecDesembolso,
          fec1eraCuota,
          graciaFlag,
          graciaTipo: graciaTotalMeses > 0 ? "TOTAL" : graciaParcialMeses > 0 ? "PARCIAL" : null,
          graciaMeses: graciaTotalMeses > 0 ? graciaTotalMeses : graciaParcialMeses || null,
          graciaTotalMeses: graciaTotalMeses || null,
          graciaParcialMeses: graciaParcialMeses || null,
          residualFlag: fp.residualFlag ?? cotizacionActual.residualFlag ?? true,
          residualMonto,
          pctCuotaFinal,
          segDesgrav: Number(fp.segDesgrav ?? cotizacionActual.segDesgrav ?? 0),
          segVehicular: Number(fp.segVehicular ?? cotizacionActual.segVehicular ?? 0),
          gastoGps: Number(fp.gastoGps ?? cotizacionActual.gastoGps ?? 0),
          gastoNotarial: Number(fp.gastoNotarial ?? cotizacionActual.gastoNotarial ?? 0),
          costeRegistral: Number(fp.costeRegistral ?? cotizacionActual.costeRegistral ?? 0),
          costeTasacion: Number(fp.costeTasacion ?? cotizacionActual.costeTasacion ?? 0),
          comisionEstudio: Number(fp.comisionEstudio ?? cotizacionActual.comisionEstudio ?? 0),
          comisionActivacion: Number(fp.comisionActivacion ?? cotizacionActual.comisionActivacion ?? 0),
          portesPer: Number(fp.portesPer ?? cotizacionActual.portesPer ?? 0),
          gasAdmPer: Number(fp.gasAdmPer ?? cotizacionActual.gasAdmPer ?? 0),
          pctSegRie: Number(fp.pctSegRie ?? cotizacionActual.pctSegRie ?? 0),
          cokAnual: Number(fp.cokAnual ?? cotizacionActual.cokAnual ?? 0),
          tcea: resultadoFinanciero.tcea,
          vanDeudor: resultadoFinanciero.vanDeudor,
          tirMensual: resultadoFinanciero.tirMensual,
          tirAnual: resultadoFinanciero.tirAnual,
          totPagado: resultadoFinanciero.totalPagado,
          costoCredito: resultadoFinanciero.costoCredito,
          motivoEdicion: motivo || null,
        },
      })

      await tx.cuota.createMany({
        data: resultadoFinanciero.cronograma.map((cuota) =>
          mapCuotaToPrisma(cuota, nuevaCotizacion.id)
        ),
      })

      await tx.auditLog.create({
        data: {
          entidad: "COTIZACION",
          idEntidad: nuevaCotizacion.id,
          accion: "EDICION",
          camposAnteriores: {
            version: cotizacionActual.version,
            idCliente: cotizacionActual.idCliente.toString(),
            idVehiculo: cotizacionActual.idVehiculo.toString(),
            tasaIngresada: cotizacionActual.tasaIngresada,
            plazoMeses: cotizacionActual.plazoMeses,
          },
          camposNuevos: {
            version: nuevaCotizacion.version,
            idCliente: idCliente.toString(),
            idVehiculo: idVehiculo.toString(),
            tasaIngresada: nuevaCotizacion.tasaIngresada,
            plazoMeses: nuevaCotizacion.plazoMeses,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return nuevaCotizacion
    })

    return NextResponse.json(
      toJsonSafe({
        success: true,
        nuevaCotizacion: result,
        message: `Nueva versión v${result.version} guardada exitosamente`,
      })
    )
  } catch (error) {
    console.error("Error saving edited cotizacion:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
