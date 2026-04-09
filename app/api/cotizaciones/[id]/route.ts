import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params
    const cotizacionId = BigInt(id)

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        cliente: true,
        vehiculo: true,
        operacion: true,
        cuotas: {
          orderBy: { numero: "asc" },
        },
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ cotizacion })
  } catch {
    return NextResponse.json({ error: "Error consultando cotización" }, { status: 500 })
  }
}
