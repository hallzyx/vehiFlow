import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { buildParametrosCredito } from "@/lib/cotizacion-params"

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

    // Get current cotizacion
    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      include: {
        cliente: true,
        vehiculo: true,
        cuotas: true,
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    const bp = body.parametros || {}

    // Si el body no trae tasa, respetar tipo guardado (legacy TNA) para no interpretar 15 como TEA.
    const tasaIngresada = Number(bp.tasaIngresada ?? cotizacion.tasaIngresada)
    const tipoTasaBody = bp.tipoTasa ?? (bp.tasaIngresada != null ? "TEA" : cotizacion.tipoTasa)
    const capitalizacionBody =
      bp.capitalizacion ?? (tipoTasaBody === "TNA" ? cotizacion.capitalizacion : null)

    // Merge current data with updated parameters
    const resultado = calcularCredito(
      buildParametrosCredito({
        tasaIngresada,
        tipoTasa: tipoTasaBody,
        capitalizacion: capitalizacionBody,
        precioVehiculo: Number(cotizacion.precioVeh),
        cuotaIniMnt: Number(cotizacion.cuotaIniMnt),
        plazoMeses: Number(bp.plazoMeses ?? cotizacion.plazoMeses),
        fecDesembolso: cotizacion.fecDesembolso,
        fec1eraCuota: bp.fecPrimeraCuota ?? cotizacion.fec1eraCuota,
        graciaFlag: cotizacion.graciaFlag,
        graciaTipo: (cotizacion.graciaTipo as "TOTAL" | "PARCIAL" | undefined) ?? undefined,
        graciaMeses: Number(bp.periodoGracia ?? cotizacion.graciaMeses ?? 0),
        graciaTotalMeses: Number(bp.graciaTotalMeses ?? cotizacion.graciaTotalMeses ?? 0) || undefined,
        graciaParcialMeses: Number(bp.graciaParcialMeses ?? cotizacion.graciaParcialMeses ?? 0) || undefined,
        residualFlag: cotizacion.residualFlag,
        residualMonto: Number(bp.valorResidual ?? cotizacion.residualMonto ?? 0),
        pctCuotaFinal: bp.pctCuotaFinal != null ? Number(bp.pctCuotaFinal) : (cotizacion.pctCuotaFinal != null ? Number(cotizacion.pctCuotaFinal) : undefined),
        segDesgrav: Number(bp.segDesgravamen ?? cotizacion.segDesgrav ?? 0),
        segVehicular: Number(bp.segVehicular ?? cotizacion.segVehicular ?? 0),
        gastoGps: Number(bp.otrosGastos ?? cotizacion.gastoGps ?? 0),
        gastoNotarial: Number(cotizacion.gastoNotarial ?? 0),
        costeRegistral: Number(bp.costeRegistral ?? cotizacion.costeRegistral ?? 0) || undefined,
        costeTasacion: Number(bp.costeTasacion ?? cotizacion.costeTasacion ?? 0) || undefined,
        comisionEstudio: Number(bp.comisionEstudio ?? cotizacion.comisionEstudio ?? 0) || undefined,
        comisionActivacion: Number(bp.comisionActivacion ?? cotizacion.comisionActivacion ?? 0) || undefined,
        portesPer: Number(bp.portesPer ?? cotizacion.portesPer ?? 0) || undefined,
        gasAdmPer: Number(bp.gasAdmPer ?? cotizacion.gasAdmPer ?? 0) || undefined,
        pctSegRie: Number(bp.pctSegRie ?? cotizacion.pctSegRie ?? 0) || undefined,
        cokAnual: Number(bp.cokAnual ?? cotizacion.cokAnual ?? 0) || undefined,
      })
    )

    // Return new calculations
    return NextResponse.json({
      cronograma: resultado.cronograma,
      indicadores: {
        tcea: resultado.tcea,
        vanDeudor: resultado.vanDeudor,
        tirAnual: resultado.tirAnual,
      },
      loadingSteps: [
        "✓ Conversión de tasa aplicada (TEM calculada)",
        "✓ Período de gracia procesado",
        `${resultado.cronograma.length} cuotas generadas`,
        "✓ Valor residual incluido",
        `✓ TCEA calculada (${resultado.tcea.toFixed(4)}%)`,
        `✓ VAN del deudor calculado (${resultado.vanDeudor.toFixed(2)})`,
        `✓ TIR del deudor calculada (${resultado.tirAnual.toFixed(4)}%)`,
        "Listo ✓"
      ]
    })

  } catch (error) {
    console.error("Error recalculating:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
