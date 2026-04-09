import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito, type ParametrosCredito } from "@/lib/motor-financiero"

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

    // Merge current data with updated parameters
    const updatedParams: ParametrosCredito = {
      tipoTasa: body.parametros.tipoTasa || cotizacion.tipoTasa,
      tasaIngresada: Number(body.parametros.tasaIngresada || cotizacion.tasaIngresada),
      capitalizacion: body.parametros.capitalizacion || cotizacion.capitalizacion,
      precioVehiculo: Number(cotizacion.precioVeh),
      cuotaInicial: Number(cotizacion.cuotaIniMnt),
      plazoMeses: body.parametros.plazoMeses || cotizacion.plazoMeses,
      fechaDesembolso: new Date(cotizacion.fecDesembolso),
      fechaPrimeraCuota: new Date(body.parametros.fecPrimeraCuota || cotizacion.fec1eraCuota),
      graciaFlag: cotizacion.graciaFlag,
      graciaTipo: cotizacion.graciaTipo || undefined,
      graciaMeses: body.parametros.periodoGracia || cotizacion.graciaMeses || 0,
      residualFlag: cotizacion.residualFlag,
      residualMonto: Number(body.parametros.valorResidual || cotizacion.residualMonto || 0),
      segDesgravamenPct: Number(body.parametros.segDesgravamen || cotizacion.segDesgrav || 0),
      segVehicularAnual: Number(body.parametros.segVehicular || cotizacion.segVehicular || 0),
      gastoGps: Number(body.parametros.otrosGastos || cotizacion.gastoGps || 0),
      gastoNotarial: Number(cotizacion.gastoNotarial || 0),
    }

    // Recalculate financials
    const resultado = calcularCredito(updatedParams)

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