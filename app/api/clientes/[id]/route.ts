import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

const clienteUpdateSchema = z.object({
  tipoDocumento: z.enum(["DNI", "CE", "PASAPORTE"]).optional(),
  numDocumento: z.string().min(5).max(15).optional(),
  nombres: z.string().min(2).optional(),
  apPaterno: z.string().min(2).optional(),
  apMaterno: z.string().max(100).optional().nullable(),
  celular: z.string().min(9).max(9).optional(),
  correo: z.string().email().optional(),
  direccion: z.string().min(5).optional(),
  fecNacimiento: z.string().optional().nullable(),
  ingresosMens: z.number().positive().optional().nullable(),
  monedaIngres: z.enum(["PEN", "USD"]).optional().nullable(),
  situacionLab: z.string().max(20).optional().nullable(),
  empresaEmpl: z.string().max(150).optional().nullable(),
  estado: z.enum(["ACTIVO", "ARCHIVADO"]).optional(),
})

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizaciones: {
          include: {
            vehiculo: true,
          },
          orderBy: { creadoEn: "desc" },
        },
      },
    })

    if (!cliente) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    const operaciones = await prisma.operacion.findMany({
      where: {
        cotizacion: {
          idCliente: cliente.id,
        },
      },
      include: {
        cotizacion: {
          include: { vehiculo: true },
        },
      },
      orderBy: { creadoEn: "desc" },
    })

    const audit = await prisma.auditLog.findMany({
      where: {
        entidad: "CLIENTE",
        idEntidad: cliente.id,
      },
      include: {
        usuario: {
          select: {
            usuario: true,
            nombreCompleto: true,
          },
        },
      },
      orderBy: { fechaHora: "desc" },
    })

    return NextResponse.json({
      cliente: {
        id: cliente.id.toString(),
        tipoDocumento: cliente.tipoDocumento,
        numDocumento: cliente.numDocumento,
        nombres: cliente.nombres,
        apPaterno: cliente.apPaterno,
        apMaterno: cliente.apMaterno,
        celular: cliente.celular,
        correo: cliente.correo,
        direccion: cliente.direccion,
        fecNacimiento: cliente.fecNacimiento,
        ingresosMens: cliente.ingresosMens ? Number(cliente.ingresosMens) : null,
        monedaIngres: cliente.monedaIngres,
        situacionLab: cliente.situacionLab,
        empresaEmpl: cliente.empresaEmpl,
        estado: cliente.estado,
        creadoEn: cliente.creadoEn,
      },
      cotizaciones: cliente.cotizaciones.map((c) => ({
        id: c.id.toString(),
        version: c.version,
        estado: c.estado,
        monedaOp: c.monedaOp,
        montoFinanc: Number(c.montoFinanc),
        tcea: Number(c.tcea),
        creadoEn: c.creadoEn,
        vehiculo: `${c.vehiculo.marca} ${c.vehiculo.modelo} ${c.vehiculo.anio}`,
      })),
      operaciones: operaciones.map((o) => ({
        id: o.id.toString(),
        estadoOp: o.estadoOp,
        saldoActual: Number(o.saldoActual),
        fecInicio: o.fecInicio,
        fecTermino: o.fecTermino,
        vehiculo: `${o.cotizacion.vehiculo.marca} ${o.cotizacion.vehiculo.modelo} ${o.cotizacion.vehiculo.anio}`,
      })),
      historial: audit.map((a) => ({
        id: a.id.toString(),
        fechaHora: a.fechaHora,
        accion: a.accion,
        usuario: a.usuario?.usuario || a.usuario?.nombreCompleto || "sistema",
        camposAnteriores: a.camposAnteriores,
        camposNuevos: a.camposNuevos,
      })),
    })
  } catch (error) {
    console.error("Error obteniendo cliente:", error)
    return NextResponse.json({ error: "Error obteniendo cliente" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const payload = await req.json()
    const parsed = clienteUpdateSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const clienteId = BigInt(id)

    const actual = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: {
        _count: { select: { cotizaciones: true } },
      },
    })

    if (!actual) {
      return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
    }

    if ((data.tipoDocumento || data.numDocumento) && actual._count.cotizaciones > 0) {
      return NextResponse.json(
        {
          error:
            "El documento no puede modificarse porque este cliente tiene cotizaciones asociadas.",
        },
        { status: 400 }
      )
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const actualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.cliente.update({
        where: { id: clienteId },
        data: {
          tipoDocumento: data.tipoDocumento,
          numDocumento: data.numDocumento,
          nombres: data.nombres,
          apPaterno: data.apPaterno,
          apMaterno: data.apMaterno,
          celular: data.celular,
          correo: data.correo,
          direccion: data.direccion,
          fecNacimiento: data.fecNacimiento ? new Date(data.fecNacimiento) : data.fecNacimiento === null ? null : undefined,
          ingresosMens: data.ingresosMens,
          monedaIngres: data.monedaIngres,
          situacionLab: data.situacionLab,
          empresaEmpl: data.empresaEmpl,
          estado: data.estado,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "CLIENTE",
          idEntidad: updated.id,
          accion: data.estado === "ARCHIVADO" ? "ARCHIVADO" : "EDICION",
          camposAnteriores: {
            tipoDocumento: actual.tipoDocumento,
            numDocumento: actual.numDocumento,
            nombres: actual.nombres,
            apPaterno: actual.apPaterno,
            celular: actual.celular,
            correo: actual.correo,
            estado: actual.estado,
          },
          camposNuevos: {
            tipoDocumento: updated.tipoDocumento,
            numDocumento: updated.numDocumento,
            nombres: updated.nombres,
            apPaterno: updated.apPaterno,
            celular: updated.celular,
            correo: updated.correo,
            estado: updated.estado,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return updated
    })

    return NextResponse.json({
      success: true,
      cliente: {
        id: actualizado.id.toString(),
        estado: actualizado.estado,
      },
      message: "Cliente actualizado exitosamente",
    })
  } catch (error: any) {
    if (String(error?.code) === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese documento o correo" },
        { status: 409 }
      )
    }

    console.error("Error actualizando cliente:", error)
    return NextResponse.json({ error: "Error actualizando cliente" }, { status: 500 })
  }
}
