import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { normalizarCuotas, resolverContextoOperacion } from "@/lib/pago-anticipado"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

export async function GET() {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const operaciones = await prisma.operacion.findMany({
      include: {
        cotizacion: {
          include: {
            cliente: true,
            vehiculo: true,
            cuotas: { orderBy: { numero: "asc" } },
          },
        },
        pagos: {
          orderBy: { creadoEn: "desc" },
          take: 1,
        },
      },
      orderBy: { creadoEn: "desc" },
    })

    const data = operaciones.map((op) => {
      const cuotas = normalizarCuotas(op.cotizacion.cuotas as any[])
      const contexto = resolverContextoOperacion(cuotas, Number(op.saldoActual))

      return {
        id: op.id.toString(),
        estadoOp: op.estadoOp,
        saldoActual: Number(op.saldoActual),
        versionCrono: op.versionCrono,
        fecInicio: op.fecInicio,
        fecTermino: op.fecTermino,
        cuotaExigible: contexto.cuotaExigible,
        cuotasRestantes: contexto.cuotasRestantes,
        cotizacion: {
          id: op.cotizacion.id.toString(),
          version: op.cotizacion.version,
          estado: op.cotizacion.estado,
          monedaOp: op.cotizacion.monedaOp,
          tem: Number(op.cotizacion.tem),
          tcea: Number(op.cotizacion.tcea),
        },
        cliente: {
          nombres: op.cotizacion.cliente.nombres,
          apPaterno: op.cotizacion.cliente.apPaterno,
          numDocumento: op.cotizacion.cliente.numDocumento,
        },
        vehiculo: {
          marca: op.cotizacion.vehiculo.marca,
          modelo: op.cotizacion.vehiculo.modelo,
          anio: op.cotizacion.vehiculo.anio,
        },
      }
    })

    return NextResponse.json({ operaciones: data })
  } catch (error) {
    console.error("Error listando operaciones:", error)
    return NextResponse.json({ error: "Error listando operaciones" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { cotizacionId } = await req.json()
    if (!cotizacionId) {
      return NextResponse.json({ error: "cotizacionId es requerido" }, { status: 400 })
    }

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: BigInt(cotizacionId) },
      include: {
        cuotas: { orderBy: { numero: "asc" } },
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
    }

    const existente = await prisma.operacion.findUnique({
      where: { idCotizacion: cotizacion.id },
    })

    if (existente) {
      return NextResponse.json({
        success: true,
        operacion: {
          id: existente.id.toString(),
          idCotizacion: existente.idCotizacion.toString(),
          saldoActual: Number(existente.saldoActual),
          estadoOp: existente.estadoOp,
          versionCrono: existente.versionCrono,
        },
        message: "La operación ya estaba activa",
      })
    }

    if (cotizacion.cuotas.length === 0) {
      return NextResponse.json(
        { error: "La cotización no tiene cronograma. No se puede activar operación." },
        { status: 400 }
      )
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)
    const primerSaldo = Number(cotizacion.cuotas[0].saldoInicial)
    const fechaTermino = cotizacion.cuotas[cotizacion.cuotas.length - 1]?.fecVencimiento ?? null

    const operacion = await prisma.$transaction(async (tx) => {
      const op = await tx.operacion.create({
        data: {
          idCotizacion: cotizacion.id,
          estadoOp: "ACTIVA",
          fecInicio: new Date(),
          fecTermino: fechaTermino,
          saldoActual: primerSaldo,
          versionCrono: cotizacion.version,
        },
      })

      await tx.cotizacion.update({
        where: { id: cotizacion.id },
        data: {
          estado: "APROBADA",
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "OPERACION",
          idEntidad: op.id,
          accion: "CREACION",
          camposAnteriores: {},
          camposNuevos: {
            idCotizacion: cotizacion.id.toString(),
            saldoActual: primerSaldo,
            versionCrono: cotizacion.version,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return op
    })

    return NextResponse.json({
      success: true,
      operacion: {
        id: operacion.id.toString(),
        idCotizacion: operacion.idCotizacion.toString(),
        estadoOp: operacion.estadoOp,
        saldoActual: Number(operacion.saldoActual),
        versionCrono: operacion.versionCrono,
        fecInicio: operacion.fecInicio,
        fecTermino: operacion.fecTermino,
      },
      message: "Operación activada exitosamente",
    })
  } catch (error) {
    console.error("Error activando operación:", error)
    return NextResponse.json({ error: "Error activando operación" }, { status: 500 })
  }
}
