import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { analizarPagoExtraordinario, normalizarCuotas, resolverContextoOperacion } from "@/lib/pago-anticipado"

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

    if (!montoPago || montoPago <= 0) {
      return NextResponse.json({ error: "El monto del pago debe ser mayor a 0" }, { status: 400 })
    }

    const hoy = new Date()
    hoy.setHours(23, 59, 59, 999)
    if (isNaN(fechaPago.getTime()) || fechaPago > hoy) {
      return NextResponse.json({ error: "La fecha de pago no puede ser futura" }, { status: 400 })
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
    const saldoActual = Number(operacion.saldoActual)

    const analisis = analizarPagoExtraordinario({
      saldoActual,
      cuotaExigible: contexto.cuotaExigible,
      temPct: Number(operacion.cotizacion.tem),
      fechaUltimaCuota: contexto.fechaUltimaCuota,
      fechaPago,
      montoPago,
    })

    if (analisis.tipoPago === "CUOTA_NORMAL" && montoPago < contexto.cuotaExigible) {
      return NextResponse.json(
        {
          error:
            "El monto ingresado es menor a la cuota exigible. Registra el pago como cuota normal o ingresa un monto mayor.",
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      analisis,
      contexto: {
        cuotaExigible: contexto.cuotaExigible,
        cuotasRestantes: contexto.cuotasRestantes,
        interesesRestantes: contexto.interesesRestantes,
        fechaUltimaCuota: contexto.fechaUltimaCuota,
      },
      normativa: {
        penalidadPermitida: 0,
        mensaje:
          "No se aplicará ninguna penalidad ni comisión por pago anticipado (Ley 29571 Art. 85 y Res. SBS 8181-2012).",
      },
    })
  } catch (error) {
    console.error("Error verificando pago anticipado:", error)
    return NextResponse.json({ error: "Error verificando pago anticipado" }, { status: 500 })
  }
}
