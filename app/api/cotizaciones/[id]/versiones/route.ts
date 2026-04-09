import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First get the current cotizacion
    const currentCotizacion = await prisma.cotizacion.findUnique({
      where: { id: parseInt(id) },
      select: { idCliente: true, idVehiculo: true }
    })

    if (!currentCotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    // Get all versions of this cotizacion
    const versiones = await prisma.cotizacion.findMany({
      where: {
        idCliente: currentCotizacion.idCliente,
        idVehiculo: currentCotizacion.idVehiculo
      },
      include: {
        usuario: {
          select: {
            nombreCompleto: true,
            usuario: true
          }
        }
      },
      orderBy: {
        version: 'desc'
      }
    })

    return NextResponse.json({ versiones })

  } catch (error) {
    console.error("Error getting versiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}