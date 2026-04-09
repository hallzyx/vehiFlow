import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"

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
    const body = await req.json()
    const { formData, motivo } = body

    // Get current cotizacion
    const cotizacionActual = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
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
        where: { id: parseInt(id) },
        data: {
          estado: 'ARCHIVADA_VERSION',
          motivoEdicion: motivo || 'Edición sin motivo especificado',
          creadoEn: new Date(),
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

      // 4. Recalculate financials
      const paramsCredito = {
        tipoTasa: formData.parametros?.tipoTasa || cotizacionActual.tipoTasa,
        tasaIngresada: Number(formData.parametros?.tasaIngresada || cotizacionActual.tasaIngresada),
        capitalizacion: formData.parametros?.capitalizacion || cotizacionActual.capitalizacion,
        precioVehiculo: Number(cotizacionActual.vehiculo.precioLista),
        cuotaInicial: Number(formData.parametros?.cuotaInicialMonto || cotizacionActual.cuotaIniMnt),
        plazoMeses: formData.parametros?.plazoMeses || cotizacionActual.plazoMeses,
        fechaDesembolso: new Date(cotizacionActual.fecDesembolso),
        fechaPrimeraCuota: new Date(formData.parametros?.fecPrimeraCuota || cotizacionActual.fec1eraCuota),
        graciaFlag: cotizacionActual.graciaFlag,
        graciaTipo: cotizacionActual.graciaTipo,
        graciaMeses: formData.parametros?.periodoGracia || cotizacionActual.graciaMeses || 0,
        residualFlag: cotizacionActual.residualFlag,
        residualMonto: Number(formData.parametros?.valorResidual || cotizacionActual.residualMonto || 0),
        segDesgravamenPct: Number(formData.parametros?.segDesgravamen || cotizacionActual.segDesgrav || 0),
        segVehicularAnual: Number(formData.parametros?.segVehicular || cotizacionActual.segVehicular || 0),
        gastoGps: Number(formData.parametros?.otrosGastos || cotizacionActual.gastoGps || 0),
        gastoNotarial: Number(cotizacionActual.gastoNotarial || 0),
      }

      // @ts-ignore - Type issue with GraciaTipo null handling
      const resultadoFinanciero = calcularCredito(paramsCredito)

      // 5. Create new version
      const nuevaCotizacion = await tx.cotizacion.create({
        data: {
          idCliente: cotizacionActual.idCliente,
          idVehiculo: cotizacionActual.idVehiculo,
          idUsuario: cotizacionActual.idUsuario,
          version: cotizacionActual.version + 1,
          estado: 'SIMULADA',
          monedaOp: formData.parametros?.moneda || cotizacionActual.monedaOp,
          tipoTasa: formData.parametros?.tipoTasa || cotizacionActual.tipoTasa,
          tasaIngresada: formData.parametros?.tasaIngresada || cotizacionActual.tasaIngresada,
          capitalizacion: formData.parametros?.capitalizacion || cotizacionActual.capitalizacion,
          tea: resultadoFinanciero.tea,
          tem: resultadoFinanciero.tem,
          precioVeh: cotizacionActual.vehiculo.precioLista,
          cuotaIniPct: cotizacionActual.cuotaIniPct,
          cuotaIniMnt: formData.parametros?.cuotaInicialMonto || cotizacionActual.cuotaIniMnt,
          montoFinanc: resultadoFinanciero.montoFinanciado,
          plazoMeses: formData.parametros?.plazoMeses || cotizacionActual.plazoMeses,
          fecDesembolso: cotizacionActual.fecDesembolso,
          fec1eraCuota: formData.parametros?.fecPrimeraCuota || cotizacionActual.fec1eraCuota,
          graciaFlag: cotizacionActual.graciaFlag,
        graciaTipo: (cotizacionActual.graciaTipo as any) as "TOTAL" | "PARCIAL" | undefined,
          graciaMeses: formData.parametros?.periodoGracia || cotizacionActual.graciaMeses,
          residualFlag: cotizacionActual.residualFlag,
          residualMonto: formData.parametros?.valorResidual || cotizacionActual.residualMonto,
          segDesgrav: formData.parametros?.segDesgravamen || cotizacionActual.segDesgrav,
          segVehicular: formData.parametros?.segVehicular || cotizacionActual.segVehicular,
          gastoGps: formData.parametros?.otrosGastos || cotizacionActual.gastoGps,
          gastoNotarial: cotizacionActual.gastoNotarial,
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
      const cuotasData = resultadoFinanciero.cronograma.map((cuota: any) => ({
        idCotizacion: nuevaCotizacion.id,
        numero: cuota.numero,
        tipoCuota: cuota.tipoCuota,
        fecVencimiento: cuota.fechaVencimiento,
        saldoInicial: cuota.saldoInicial,
        interes: cuota.interes,
        amortizacion: cuota.amortizacion,
        segDesgravamen: cuota.segDesgravamen,
        segVehicular: cuota.segVehicular,
        otrosGastos: cuota.otrosGastos,
        cuotaTotal: cuota.cuotaTotal,
        saldoFinal: cuota.saldoFinal,
      }))

      await tx.cuota.createMany({
        data: cuotasData,
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
          idUsuario: parseInt(session.user.id),
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