import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { buildParametrosCredito, mapCuotaToPrisma } from "@/lib/cotizacion-params"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

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

    // Get current cotizacion
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

    // Only allow editing SIMULADA or PRESENTADA
    if (!['SIMULADA', 'PRESENTADA'].includes(cotizacionActual.estado)) {
      return NextResponse.json({ error: "Solo se pueden editar cotizaciones en estado SIMULADA o PRESENTADA" }, { status: 400 })
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Archive current version
      await tx.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          estado: 'ARCHIVADA_VERSION',
          motivoEdicion: motivo || 'Edición sin motivo especificado',
        },
      })

      // 2. Update cliente if modified
      if (formData.cliente) {
        await tx.cliente.update({
          where: { id: cotizacionActual.idCliente },
          data: formData.cliente,
        })
      }

      // 3. Update vehiculo if modified
      if (formData.vehiculo) {
        await tx.vehiculo.update({
          where: { id: cotizacionActual.idVehiculo },
          data: formData.vehiculo,
        })
      }

      const fp = formData.parametros || {}

      // Formulario actual envía TEA. Si no viene tasa y la cotización era TNA, el motor convierte.
      const tasaIngresada = Number(fp.tasaIngresada ?? cotizacionActual.tasaIngresada)
      const tipoTasaCalc = fp.tasaIngresada != null ? "TEA" : (cotizacionActual.tipoTasa ?? "TEA")
      const capitalizacionCalc =
        tipoTasaCalc === "TNA" ? cotizacionActual.capitalizacion : null

      // 4. Recalculate financials
      const resultadoFinanciero = calcularCredito(
        buildParametrosCredito({
          tasaIngresada,
          tipoTasa: tipoTasaCalc,
          capitalizacion: capitalizacionCalc,
          precioVehiculo: Number(cotizacionActual.vehiculo.precioLista),
          cuotaIniMnt: Number(fp.cuotaInicialMonto ?? cotizacionActual.cuotaIniMnt),
          plazoMeses: Number(fp.plazoMeses ?? cotizacionActual.plazoMeses),
          fecDesembolso: cotizacionActual.fecDesembolso,
          fec1eraCuota: fp.fecPrimeraCuota ?? cotizacionActual.fec1eraCuota,
          graciaFlag: cotizacionActual.graciaFlag,
          graciaTipo: (cotizacionActual.graciaTipo as "TOTAL" | "PARCIAL" | undefined) ?? undefined,
          graciaMeses: Number(fp.periodoGracia ?? cotizacionActual.graciaMeses ?? 0),
          graciaTotalMeses: Number(fp.graciaTotalMeses ?? cotizacionActual.graciaTotalMeses ?? 0) || undefined,
          graciaParcialMeses: Number(fp.graciaParcialMeses ?? cotizacionActual.graciaParcialMeses ?? 0) || undefined,
          residualFlag: cotizacionActual.residualFlag,
          residualMonto: Number(fp.valorResidual ?? cotizacionActual.residualMonto ?? 0),
          pctCuotaFinal: fp.pctCuotaFinal != null ? Number(fp.pctCuotaFinal) : (cotizacionActual.pctCuotaFinal != null ? Number(cotizacionActual.pctCuotaFinal) : undefined),
          segDesgrav: Number(fp.segDesgravamen ?? cotizacionActual.segDesgrav ?? 0),
          segVehicular: Number(fp.segVehicular ?? cotizacionActual.segVehicular ?? 0),
          gastoGps: Number(fp.otrosGastos ?? cotizacionActual.gastoGps ?? 0),
          gastoNotarial: Number(cotizacionActual.gastoNotarial ?? 0),
          costeRegistral: Number(fp.costeRegistral ?? cotizacionActual.costeRegistral ?? 0) || undefined,
          costeTasacion: Number(fp.costeTasacion ?? cotizacionActual.costeTasacion ?? 0) || undefined,
          comisionEstudio: Number(fp.comisionEstudio ?? cotizacionActual.comisionEstudio ?? 0) || undefined,
          comisionActivacion: Number(fp.comisionActivacion ?? cotizacionActual.comisionActivacion ?? 0) || undefined,
          portesPer: Number(fp.portesPer ?? cotizacionActual.portesPer ?? 0) || undefined,
          gasAdmPer: Number(fp.gasAdmPer ?? cotizacionActual.gasAdmPer ?? 0) || undefined,
          pctSegRie: Number(fp.pctSegRie ?? cotizacionActual.pctSegRie ?? 0) || undefined,
          cokAnual: Number(fp.cokAnual ?? cotizacionActual.cokAnual ?? 0) || undefined,
        })
      )

      // 5. Create new version
      const nuevaCotizacion = await tx.cotizacion.create({
        data: {
          idCliente: cotizacionActual.idCliente,
          idVehiculo: cotizacionActual.idVehiculo,
          idUsuario: cotizacionActual.idUsuario,
          version: cotizacionActual.version + 1,
          estado: 'SIMULADA',
          monedaOp: fp.moneda || cotizacionActual.monedaOp,
          tipoTasa: "TEA",
          capitalizacion: null,
          // Persistir siempre la TEA en % (resultado.tea está en decimal)
          tasaIngresada: Number((resultadoFinanciero.tea * 100).toFixed(6)),
          tea: resultadoFinanciero.tea,
          tem: resultadoFinanciero.tem,
          precioVeh: cotizacionActual.vehiculo.precioLista,
          cuotaIniPct: cotizacionActual.cuotaIniPct,
          cuotaIniMnt: fp.cuotaInicialMonto ?? cotizacionActual.cuotaIniMnt,
          montoFinanc: resultadoFinanciero.montoFinanciado,
          plazoMeses: fp.plazoMeses ?? cotizacionActual.plazoMeses,
          fecDesembolso: cotizacionActual.fecDesembolso,
          fec1eraCuota: fp.fecPrimeraCuota ?? cotizacionActual.fec1eraCuota,
          graciaFlag: cotizacionActual.graciaFlag,
          graciaTipo: (cotizacionActual.graciaTipo as any) as "TOTAL" | "PARCIAL" | undefined,
          graciaMeses: fp.periodoGracia ?? cotizacionActual.graciaMeses,
          graciaTotalMeses: fp.graciaTotalMeses ?? cotizacionActual.graciaTotalMeses,
          graciaParcialMeses: fp.graciaParcialMeses ?? cotizacionActual.graciaParcialMeses,
          residualFlag: cotizacionActual.residualFlag,
          residualMonto: fp.valorResidual ?? cotizacionActual.residualMonto,
          pctCuotaFinal: fp.pctCuotaFinal ?? cotizacionActual.pctCuotaFinal,
          segDesgrav: fp.segDesgravamen ?? cotizacionActual.segDesgrav,
          segVehicular: fp.segVehicular ?? cotizacionActual.segVehicular,
          gastoGps: fp.otrosGastos ?? cotizacionActual.gastoGps,
          gastoNotarial: cotizacionActual.gastoNotarial,
          costeRegistral: fp.costeRegistral ?? cotizacionActual.costeRegistral,
          costeTasacion: fp.costeTasacion ?? cotizacionActual.costeTasacion,
          comisionEstudio: fp.comisionEstudio ?? cotizacionActual.comisionEstudio,
          comisionActivacion: fp.comisionActivacion ?? cotizacionActual.comisionActivacion,
          portesPer: fp.portesPer ?? cotizacionActual.portesPer,
          gasAdmPer: fp.gasAdmPer ?? cotizacionActual.gasAdmPer,
          pctSegRie: fp.pctSegRie ?? cotizacionActual.pctSegRie,
          cokAnual: fp.cokAnual ?? cotizacionActual.cokAnual,
          tcea: resultadoFinanciero.tcea,
          vanDeudor: resultadoFinanciero.vanDeudor,
          tirMensual: resultadoFinanciero.tirMensual,
          tirAnual: resultadoFinanciero.tirAnual,
          totPagado: resultadoFinanciero.totalPagado,
          costoCredito: resultadoFinanciero.costoCredito,
          motivoEdicion: motivo || null,
        },
      })

      // 6. Create new cuotas
      await tx.cuota.createMany({
        data: resultadoFinanciero.cronograma.map((cuota) =>
          mapCuotaToPrisma(cuota, nuevaCotizacion.id)
        ),
      })

      // 7. Create audit log
      await tx.auditLog.create({
        data: {
          entidad: 'COTIZACION',
          idEntidad: nuevaCotizacion.id,
          accion: 'EDICION',
          camposAnteriores: {
            version: cotizacionActual.version,
            tasaIngresada: cotizacionActual.tasaIngresada,
            plazoMeses: cotizacionActual.plazoMeses,
          },
          camposNuevos: {
            version: nuevaCotizacion.version,
            tasaIngresada: nuevaCotizacion.tasaIngresada,
            plazoMeses: nuevaCotizacion.plazoMeses,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return nuevaCotizacion
    })

    return NextResponse.json({
      success: true,
      nuevaCotizacion: result,
      message: `Nueva versión v${result.version} guardada exitosamente`,
    })

  } catch (error) {
    console.error("Error saving edited cotizacion:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
