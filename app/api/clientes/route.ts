import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

const clienteSchema = z.object({
  tipoDocumento: z.enum(["DNI", "CE", "PASAPORTE"]),
  numDocumento: z.string().min(5).max(15),
  nombres: z.string().min(2),
  apPaterno: z.string().min(2),
  apMaterno: z.string().max(100).optional().nullable(),
  celular: z.string().min(9).max(9),
  correo: z.string().email(),
  direccion: z.string().min(5),
  fecNacimiento: z.string().optional().nullable(),
  ingresosMens: z.number().positive().optional().nullable(),
  monedaIngres: z.enum(["PEN", "USD"]).optional().nullable(),
  situacionLab: z.string().max(20).optional().nullable(),
  empresaEmpl: z.string().max(150).optional().nullable(),
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
    const situacionLab = (searchParams.get("situacionLab") || "TODOS").trim()
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const where: any = {}

    if (estado !== "TODOS") {
      where.estado = estado
    }

    if (situacionLab !== "TODOS") {
      where.situacionLab = situacionLab
    }

    if (search) {
      where.OR = [
        { nombres: { contains: search } },
        { apPaterno: { contains: search } },
        { apMaterno: { contains: search } },
        { numDocumento: { contains: search } },
        { correo: { contains: search } },
        { celular: { contains: search } },
      ]
    }

    if (fechaDesde || fechaHasta) {
      where.creadoEn = {}
      if (fechaDesde) where.creadoEn.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const f = new Date(fechaHasta)
        f.setHours(23, 59, 59, 999)
        where.creadoEn.lte = f
      }
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: { select: { cotizaciones: true } },
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json({
      clientes: clientes.map((c) => ({
        id: c.id.toString(),
        tipoDocumento: c.tipoDocumento,
        numDocumento: c.numDocumento,
        nombres: c.nombres,
        apPaterno: c.apPaterno,
        apMaterno: c.apMaterno,
        celular: c.celular,
        correo: c.correo,
        estado: c.estado,
        situacionLab: c.situacionLab,
        creadoEn: c.creadoEn,
        cotizacionesCount: c._count.cotizaciones,
      })),
    })
  } catch (error) {
    console.error("Error listando clientes:", error)
    return NextResponse.json({ error: "Error listando clientes" }, { status: 500 })
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
    const parsed = clienteSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    if (data.tipoDocumento === "DNI" && data.numDocumento.length !== 8) {
      return NextResponse.json({ error: "El DNI debe tener 8 dígitos" }, { status: 400 })
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const cliente = await prisma.$transaction(async (tx) => {
      const nuevo = await tx.cliente.create({
        data: {
          tipoDocumento: data.tipoDocumento,
          numDocumento: data.numDocumento,
          nombres: data.nombres,
          apPaterno: data.apPaterno,
          apMaterno: data.apMaterno || null,
          celular: data.celular,
          correo: data.correo,
          direccion: data.direccion,
          fecNacimiento: data.fecNacimiento ? new Date(data.fecNacimiento) : null,
          ingresosMens: data.ingresosMens ?? null,
          monedaIngres: data.monedaIngres ?? null,
          situacionLab: data.situacionLab || null,
          empresaEmpl: data.empresaEmpl || null,
          estado: "ACTIVO",
          creadoPor: usuarioInternoId,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "CLIENTE",
          idEntidad: nuevo.id,
          accion: "CREACION",
          camposAnteriores: {},
          camposNuevos: {
            tipoDocumento: nuevo.tipoDocumento,
            numDocumento: nuevo.numDocumento,
            nombres: nuevo.nombres,
            apPaterno: nuevo.apPaterno,
            correo: nuevo.correo,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return nuevo
    })

    return NextResponse.json({
      success: true,
      cliente: {
        id: cliente.id.toString(),
        tipoDocumento: cliente.tipoDocumento,
        numDocumento: cliente.numDocumento,
        nombres: cliente.nombres,
        apPaterno: cliente.apPaterno,
      },
      message: "Cliente registrado exitosamente",
    })
  } catch (error: any) {
    if (String(error?.code) === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese documento o correo" },
        { status: 409 }
      )
    }

    console.error("Error creando cliente:", error)
    return NextResponse.json({ error: "Error creando cliente" }, { status: 500 })
  }
}
