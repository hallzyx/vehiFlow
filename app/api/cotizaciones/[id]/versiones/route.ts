import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { toJsonSafe } from "@/lib/json-safe"
import { agruparFamiliasVersiones, obtenerFamiliaPorCotizacionId } from "@/lib/versionado-cotizaciones"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // First get the current cotizacion
    const currentCotizacion = await prisma.cotizacion.findUnique({
      where: { id: BigInt(id) },
      select: { idCliente: true, idVehiculo: true }
    })

    if (!currentCotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    // Obtener candidatas de familia por cliente + vehículo
    const candidatas = await prisma.cotizacion.findMany({
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
      orderBy: [{ creadoEn: "asc" }, { version: "asc" }]
    })

    const familias = agruparFamiliasVersiones(candidatas)
    const familiaActiva = obtenerFamiliaPorCotizacionId(candidatas, id)

    if (!familiaActiva) {
      return NextResponse.json({ error: "No se pudo resolver la familia de versiones" }, { status: 404 })
    }

    const versiones = [...familiaActiva.versiones].sort((a, b) => Number(b.version) - Number(a.version))

    return NextResponse.json({
      versiones: toJsonSafe(versiones),
      familia: toJsonSafe({
        id: familiaActiva.familyId,
        totalVersiones: familiaActiva.versiones.length,
        latestVersion: familiaActiva.latestVersion,
        startedAt: familiaActiva.startedAt,
        updatedAt: familiaActiva.updatedAt,
        familiasDetectadas: familias.length,
      }),
    })

  } catch (error) {
    console.error("Error getting versiones:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
