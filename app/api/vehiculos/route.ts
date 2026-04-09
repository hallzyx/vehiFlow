import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

const vehiculoSchema = z.object({
  marca: z.string().min(2),
  modelo: z.string().min(2),
  version: z.string().max(100).optional().nullable(),
  anio: z.number().int().min(2000),
  precioLista: z.number().positive(),
  monedaPrecio: z.enum(["PEN", "USD"]),
  concesionario: z.string().min(2),
  valResidEst: z.number().positive().optional().nullable(),
  tipoValResid: z.enum(["MONTO", "PORCENTAJE"]).optional().nullable(),
  tipoVehiculo: z
    .enum(["SEDAN", "SUV", "CAMIONETA", "PICKUP", "HATCHBACK", "COUPE", "STATION_WAGON", "VAN", "OTRO"])
    .optional()
    .nullable(),
  transmision: z.enum(["MANUAL", "AUTOMATICA", "CVT", "DUAL"]).optional().nullable(),
  combustible: z.enum(["GASOLINA", "DIESEL", "HIBRIDO", "ELECTRICO", "GLP"]).optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()
    const estado = (searchParams.get("estado") || "TODOS").trim()
    const marca = (searchParams.get("marca") || "TODOS").trim()
    const moneda = (searchParams.get("moneda") || "TODOS").trim()

    const where: any = {}

    if (estado !== "TODOS") where.estado = estado
    if (marca !== "TODOS") where.marca = marca
    if (moneda !== "TODOS") where.monedaPrecio = moneda

    if (search) {
      where.OR = [
        { marca: { contains: search } },
        { modelo: { contains: search } },
        { version: { contains: search } },
        { concesionario: { contains: search } },
      ]
    }

    const vehiculos = await prisma.vehiculo.findMany({
      where,
      include: {
        _count: { select: { cotizaciones: true } },
      },
      orderBy: [{ marca: "asc" }, { modelo: "asc" }, { anio: "desc" }],
    })

    return NextResponse.json({
      vehiculos: vehiculos.map((v) => ({
        id: v.id.toString(),
        marca: v.marca,
        modelo: v.modelo,
        version: v.version,
        anio: v.anio,
        precioLista: Number(v.precioLista),
        monedaPrecio: v.monedaPrecio,
        concesionario: v.concesionario,
        valResidEst: v.valResidEst ? Number(v.valResidEst) : null,
        estado: v.estado,
        cotizacionesCount: v._count.cotizaciones,
      })),
    })
  } catch (error) {
    console.error("Error listando vehículos:", error)
    return NextResponse.json({ error: "Error listando vehículos" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const payload = await req.json()
    const parsed = vehiculoSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const d = parsed.data
    const yearMax = new Date().getFullYear() + 1
    if (d.anio > yearMax) {
      return NextResponse.json({ error: `El año no puede superar ${yearMax}` }, { status: 400 })
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const vehiculo = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.vehiculo.create({
        data: {
          marca: d.marca,
          modelo: d.modelo,
          version: d.version || null,
          anio: d.anio,
          precioLista: d.precioLista,
          monedaPrecio: d.monedaPrecio,
          concesionario: d.concesionario,
          valResidEst: d.valResidEst ?? null,
          tipoValResid: d.tipoValResid ?? null,
          tipoVehiculo: d.tipoVehiculo ?? null,
          transmision: d.transmision ?? null,
          combustible: d.combustible ?? null,
          estado: "DISPONIBLE",
          creadoPor: usuarioInternoId,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "VEHICULO",
          idEntidad: nuevo.id,
          accion: "CREACION",
          camposAnteriores: {},
          camposNuevos: {
            marca: nuevo.marca,
            modelo: nuevo.modelo,
            anio: nuevo.anio,
            precioLista: nuevo.precioLista,
            monedaPrecio: nuevo.monedaPrecio,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return nuevo
    })

    return NextResponse.json({
      success: true,
      vehiculo: {
        id: vehiculo.id.toString(),
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
      },
      message: "Vehículo registrado exitosamente",
    })
  } catch (error) {
    console.error("Error creando vehículo:", error)
    return NextResponse.json({ error: "Error creando vehículo" }, { status: 500 })
  }
}
