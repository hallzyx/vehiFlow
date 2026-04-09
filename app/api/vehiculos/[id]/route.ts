import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

const vehiculoUpdateSchema = z.object({
  marca: z.string().min(2).optional(),
  modelo: z.string().min(2).optional(),
  version: z.string().max(100).optional().nullable(),
  anio: z.number().int().min(2000).optional(),
  precioLista: z.number().positive().optional(),
  monedaPrecio: z.enum(["PEN", "USD"]).optional(),
  concesionario: z.string().min(2).optional(),
  valResidEst: z.number().positive().optional().nullable(),
  tipoValResid: z.enum(["MONTO", "PORCENTAJE"]).optional().nullable(),
  tipoVehiculo: z
    .enum(["SEDAN", "SUV", "CAMIONETA", "PICKUP", "HATCHBACK", "COUPE", "STATION_WAGON", "VAN", "OTRO"])
    .optional()
    .nullable(),
  transmision: z.enum(["MANUAL", "AUTOMATICA", "CVT", "DUAL"]).optional().nullable(),
  combustible: z.enum(["GASOLINA", "DIESEL", "HIBRIDO", "ELECTRICO", "GLP"]).optional().nullable(),
  estado: z.enum(["DISPONIBLE", "ARCHIVADO"]).optional(),
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
    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizaciones: {
          include: {
            cliente: true,
          },
          orderBy: { creadoEn: "desc" },
        },
      },
    })

    if (!vehiculo) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    const audit = await prisma.auditLog.findMany({
      where: { entidad: "VEHICULO", idEntidad: vehiculo.id },
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
      vehiculo: {
        id: vehiculo.id.toString(),
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        version: vehiculo.version,
        anio: vehiculo.anio,
        precioLista: Number(vehiculo.precioLista),
        monedaPrecio: vehiculo.monedaPrecio,
        concesionario: vehiculo.concesionario,
        valResidEst: vehiculo.valResidEst ? Number(vehiculo.valResidEst) : null,
        tipoValResid: vehiculo.tipoValResid,
        tipoVehiculo: vehiculo.tipoVehiculo,
        transmision: vehiculo.transmision,
        combustible: vehiculo.combustible,
        estado: vehiculo.estado,
        creadoEn: vehiculo.creadoEn,
      },
      cotizaciones: vehiculo.cotizaciones.map((c) => ({
        id: c.id.toString(),
        version: c.version,
        estado: c.estado,
        cliente: `${c.cliente.nombres} ${c.cliente.apPaterno}`,
        montoFinanc: Number(c.montoFinanc),
        tcea: Number(c.tcea),
        creadoEn: c.creadoEn,
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
    console.error("Error obteniendo vehículo:", error)
    return NextResponse.json({ error: "Error obteniendo vehículo" }, { status: 500 })
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
    const parsed = vehiculoUpdateSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const vehiculoId = BigInt(id)
    const actual = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } })

    if (!actual) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    const usuarioInternoId = await obtenerUsuarioInternoDesdeSesion(session.user)

    const cotizacionesActivas = await prisma.cotizacion.count({
      where: {
        idVehiculo: vehiculoId,
        estado: { in: ["SIMULADA", "PRESENTADA"] },
      },
    })

    const precioCambia = typeof data.precioLista === "number" && data.precioLista !== Number(actual.precioLista)
    const residualCambia =
      Object.prototype.hasOwnProperty.call(data, "valResidEst") &&
      Number(data.valResidEst ?? 0) !== Number(actual.valResidEst ?? 0)

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.vehiculo.update({
        where: { id: vehiculoId },
        data: {
          ...data,
        },
      })

      await tx.auditLog.create({
        data: {
          entidad: "VEHICULO",
          idEntidad: v.id,
          accion: data.estado === "ARCHIVADO" ? "ARCHIVADO" : "EDICION",
          camposAnteriores: {
            precioLista: actual.precioLista,
            valResidEst: actual.valResidEst,
            estado: actual.estado,
          },
          camposNuevos: {
            precioLista: v.precioLista,
            valResidEst: v.valResidEst,
            estado: v.estado,
            warningCotizacionesActivas: cotizacionesActivas,
          },
          idUsuario: usuarioInternoId,
        },
      })

      return v
    })

    return NextResponse.json({
      success: true,
      vehiculo: {
        id: updated.id.toString(),
        estado: updated.estado,
      },
      warning:
        cotizacionesActivas > 0 && (precioCambia || residualCambia)
          ? `Este vehículo tiene ${cotizacionesActivas} cotizaciones activas asociadas. Modificar el precio/residual no actualiza cotizaciones existentes.`
          : null,
      message: "Vehículo actualizado exitosamente",
    })
  } catch (error) {
    console.error("Error actualizando vehículo:", error)
    return NextResponse.json({ error: "Error actualizando vehículo" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const payload = await req.json()
    const cuotaIniPct = Number(payload.cuotaIniPct ?? 20)
    const plazoMeses = Number(payload.plazoMeses ?? 36)
    const tasaIngresada = Number(payload.tasaIngresada ?? 18)
    const monedaOp = (payload.monedaOp || "PEN") as "PEN" | "USD"

    const vehiculo = await prisma.vehiculo.findUnique({
      where: { id: BigInt(id) },
    })

    if (!vehiculo) {
      return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 })
    }

    const precio = Number(vehiculo.precioLista)
    const cuotaInicial = (precio * cuotaIniPct) / 100
    const residualMonto = Number(vehiculo.valResidEst || 0)

    const hoy = new Date()
    const primera = new Date(hoy)
    primera.setDate(primera.getDate() + 30)

    const resultado = calcularCredito({
      tipoTasa: "EFECTIVA",
      tasaIngresada,
      precioVehiculo: precio,
      cuotaInicial,
      plazoMeses,
      fechaDesembolso: hoy,
      fechaPrimeraCuota: primera,
      graciaFlag: false,
      residualFlag: residualMonto > 0,
      residualMonto,
      segDesgravamenPct: 0.04,
      segVehicularAnual: 1200,
      gastoGps: 0,
      gastoNotarial: 0,
    })

    return NextResponse.json({
      success: true,
      preview: {
        monedaOp,
        precio,
        cuotaInicial,
        montoFinanciado: resultado.montoFinanciado,
        cuotaBase: resultado.cuotaBase,
        tcea: resultado.tcea,
        totalPagado: resultado.totalPagado,
      },
    })
  } catch (error) {
    console.error("Error en simulación rápida:", error)
    return NextResponse.json({ error: "Error en simulación rápida" }, { status: 500 })
  }
}
