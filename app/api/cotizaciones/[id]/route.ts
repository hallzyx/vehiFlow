import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { toJsonSafe } from "@/lib/json-safe"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"
import { archivarCotizacionesVencidas } from "@/lib/cotizacion-vencimiento"

interface Params {
  params: Promise<{ id: string }>
}

const TRANSICIONES: Record<string, string[]> = {
  SIMULADA: ["PRESENTADA", "ARCHIVADA"],
  // Rechazo = decisión del cliente tras ver la oferta
  PRESENTADA: ["RECHAZADA", "ARCHIVADA"],
  // APROBADA se alcanza vía POST /api/operaciones (Activar)
}

export async function GET(_: Request, { params }: Params) {
  try {
    await archivarCotizacionesVencidas()

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

    return NextResponse.json({ cotizacion: toJsonSafe(cotizacion) })
  } catch (error) {
    console.error("Error GET /api/cotizaciones/[id]:", error)
    return NextResponse.json({ error: "Error consultando cotización" }, { status: 500 })
  }
}

/** Cambia estado de cotización (Presentar / Rechazar / Archivar). */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const cotizacionId = BigInt(id)
    const body = await req.json()
    const nuevoEstado = String(body.estado || "").toUpperCase()

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      select: { id: true, estado: true, version: true },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    const permitidos = TRANSICIONES[cotizacion.estado] || []
    if (!permitidos.includes(nuevoEstado)) {
      return NextResponse.json(
        {
          error: `No se puede pasar de ${cotizacion.estado} a ${nuevoEstado}. Transiciones válidas: ${
            permitidos.join(", ") || "ninguna (use Activar operación para APROBADA)"
          }`,
        },
        { status: 400 }
      )
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)
    const ahora = new Date()

    const actualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.cotizacion.update({
        where: { id: cotizacionId },
        data: {
          estado: nuevoEstado as any,
          estadoDesde: ahora,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "COTIZACION",
          idEntidad: cotizacionId,
          accion: "CAMBIO_ESTADO",
          camposAnteriores: { estado: cotizacion.estado },
          camposNuevos: { estado: nuevoEstado },
          idUsuario: usuarioInternoId,
        },
      })

      return updated
    })

    return NextResponse.json(
      toJsonSafe({
        success: true,
        cotizacion: actualizada,
        message: `Estado actualizado a ${nuevoEstado}`,
      })
    )
  } catch (error) {
    console.error("Error PATCH /api/cotizaciones/[id]:", error)
    return NextResponse.json({ error: "Error actualizando estado" }, { status: 500 })
  }
}
