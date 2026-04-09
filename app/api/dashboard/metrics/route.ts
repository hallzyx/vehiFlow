import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { inferirRolDesdeEmail, obtenerContextoUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"
import { seedSyntheticOperationsIfNeeded } from "@/lib/demo-seed"

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function subMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function toNumber(v: any) {
  return Number(v || 0)
}

const colorMapByEstado: Record<string, string> = {
  SIMULADA: "#3b82f6",
  PRESENTADA: "#f59e0b",
  APROBADA: "#10b981",
  RECHAZADA: "#ef4444",
  ARCHIVADA: "#6b7280",
  ARCHIVADA_VERSION: "#8b5cf6",
  BORRADOR: "#94a3b8",
}

export async function GET() {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rolInferido = inferirRolDesdeEmail(session.user?.email)
    const usuarioInterno = await obtenerContextoUsuarioInternoDesdeSesion(session.user)

    await seedSyntheticOperationsIfNeeded()

    const scopedAsesorIds = rolInferido === "ASESOR" ? [usuarioInterno.id] : []

    const now = new Date()
    const inicioMes = startOfMonth(now)
    const finMes = endOfMonth(now)
    const inicioMesPasado = startOfMonth(subMonths(now, 1))
    const finMesPasado = endOfMonth(subMonths(now, 1))

    const baseWhereCotizacion: any = {}
    if (rolInferido === "ASESOR") {
      baseWhereCotizacion.idUsuario = usuarioInterno.id
    }

    const baseWhereOperacion: any = {}
    if (rolInferido === "ASESOR") {
      baseWhereOperacion.cotizacion = {
        idUsuario: usuarioInterno.id,
      }
    }

    const [
      cotizacionesTotales,
      cotizacionesMes,
      cotizacionesMesPasado,
      aprobadasMes,
      operacionesActivas,
      operacionesCerradas,
      pagosMes,
      pagosAnticipadosMes,
      carteraActiva,
      costoPromedio,
      tceaPromedio,
      distribucionEstado,
      rankingVehiculos,
      volumenMensualRaw,
      clientesNuevosMes,
      auditMes,
    ] = await Promise.all([
      prisma.cotizacion.count({ where: baseWhereCotizacion }),
      prisma.cotizacion.count({
        where: { ...baseWhereCotizacion, creadoEn: { gte: inicioMes, lte: finMes } },
      }),
      prisma.cotizacion.count({
        where: { ...baseWhereCotizacion, creadoEn: { gte: inicioMesPasado, lte: finMesPasado } },
      }),
      prisma.cotizacion.count({
        where: {
          ...baseWhereCotizacion,
          estado: "APROBADA",
          creadoEn: { gte: inicioMes, lte: finMes },
        },
      }),
      prisma.operacion.count({ where: { ...baseWhereOperacion, estadoOp: "ACTIVA" } }),
      prisma.operacion.count({ where: { ...baseWhereOperacion, estadoOp: "CERRADA" } }),
      prisma.pago.aggregate({
        where: {
          ...(rolInferido === "ASESOR" ? { idUsuario: usuarioInterno.id } : {}),
          fechaPago: { gte: inicioMes, lte: finMes },
        },
        _sum: { montoTotal: true },
      }),
      prisma.pago.count({
        where: {
          ...(rolInferido === "ASESOR" ? { idUsuario: usuarioInterno.id } : {}),
          tipoPago: { in: ["ANTICIPADO_PARCIAL", "CANCELACION_TOTAL"] },
          fechaPago: { gte: inicioMes, lte: finMes },
        },
      }),
      prisma.operacion.aggregate({
        where: { ...baseWhereOperacion, estadoOp: "ACTIVA" },
        _sum: { saldoActual: true },
      }),
      prisma.cotizacion.aggregate({
        where: {
          ...baseWhereCotizacion,
          creadoEn: { gte: inicioMes, lte: finMes },
        },
        _avg: { costoCredito: true },
      }),
      prisma.cotizacion.aggregate({
        where: {
          ...baseWhereCotizacion,
          creadoEn: { gte: inicioMes, lte: finMes },
        },
        _avg: { tcea: true },
      }),
      prisma.cotizacion.groupBy({
        by: ["estado"],
        where: baseWhereCotizacion,
        _count: { estado: true },
      }),
      prisma.cotizacion.groupBy({
        by: ["idVehiculo"],
        where: {
          ...baseWhereCotizacion,
          creadoEn: { gte: inicioMes, lte: finMes },
        },
        _count: { idVehiculo: true },
      }),
      prisma.cotizacion.findMany({
        where: {
          ...baseWhereCotizacion,
          creadoEn: { gte: startOfMonth(subMonths(now, 5)), lte: finMes },
        },
        select: {
          creadoEn: true,
          montoFinanc: true,
          estado: true,
        },
      }),
      prisma.cliente.count({
        where: {
          ...(rolInferido === "ASESOR"
            ? {
                cotizaciones: {
                  some: { idUsuario: usuarioInterno.id },
                },
              }
            : {}),
          creadoEn: { gte: inicioMes, lte: finMes },
        },
      }),
      prisma.auditLog.count({
        where: {
          ...(rolInferido === "ASESOR" ? { idUsuario: usuarioInterno.id } : {}),
          fechaHora: { gte: inicioMes, lte: finMes },
        },
      }),
    ])

    const conversionRate = cotizacionesMes > 0 ? (aprobadasMes / cotizacionesMes) * 100 : 0
    const variacionCotizaciones =
      cotizacionesMesPasado > 0
        ? ((cotizacionesMes - cotizacionesMesPasado) / cotizacionesMesPasado) * 100
        : cotizacionesMes > 0
          ? 100
          : 0

    const pieEstado = distribucionEstado.map((row) => ({
      name: row.estado,
      value: row._count.estado,
      color: colorMapByEstado[row.estado] || "#64748b",
    }))

    const vehiculoIds = rankingVehiculos.slice(0, 5).map((r) => r.idVehiculo)
    const vehiculosMap = new Map<string, string>()
    if (vehiculoIds.length > 0) {
      const vehiculos = await prisma.vehiculo.findMany({
        where: { id: { in: vehiculoIds } },
        select: { id: true, marca: true, modelo: true, anio: true },
      })
      for (const v of vehiculos) {
        vehiculosMap.set(v.id.toString(), `${v.marca} ${v.modelo} ${v.anio}`)
      }
    }

    const topVehiculos = rankingVehiculos.slice(0, 5).map((r) => ({
      name: vehiculosMap.get(r.idVehiculo.toString()) || `Vehículo ${r.idVehiculo.toString()}`,
      value: r._count.idVehiculo,
    }))

    const buckets: Record<string, { month: string; monto: number; cotizaciones: number; aprobadas: number }> = {}
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      buckets[key] = { month: key, monto: 0, cotizaciones: 0, aprobadas: 0 }
    }

    for (const c of volumenMensualRaw) {
      const d = new Date(c.creadoEn)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      if (!buckets[key]) continue
      buckets[key].monto += toNumber(c.montoFinanc)
      buckets[key].cotizaciones += 1
      if (c.estado === "APROBADA") buckets[key].aprobadas += 1
    }

    const volumenMensual = Object.values(buckets).map((b) => ({
      month: b.month,
      monto: round2(b.monto),
      cotizaciones: b.cotizaciones,
      aprobadas: b.aprobadas,
      conversion: b.cotizaciones > 0 ? round2((b.aprobadas / b.cotizaciones) * 100) : 0,
    }))

    const kpis = {
      cotizacionesMes,
      variacionCotizaciones: round2(variacionCotizaciones),
      conversionRate: round2(conversionRate),
      operacionesActivas,
      carteraActiva: round2(toNumber(carteraActiva._sum.saldoActual)),
      pagosMes: round2(toNumber(pagosMes._sum.montoTotal)),
      pagosAnticipadosMes,
      clientesNuevosMes,
      tceaPromedio: round2(toNumber(tceaPromedio._avg.tcea)),
      costoPromedio: round2(toNumber(costoPromedio._avg.costoCredito)),
      operacionesCerradas,
      auditMes,
      cotizacionesTotales,
    }

    const dashboardPorRol = {
      ADMIN: {
        roleTitle: "Administrador",
        objective: "Control integral del negocio y productividad operativa",
        primaryKpis: [
          "cotizacionesMes",
          "conversionRate",
          "carteraActiva",
          "pagosMes",
          "tceaPromedio",
        ],
      },
      ASESOR: {
        roleTitle: "Asesor",
        objective: "Mejorar conversión de cotizaciones y atención al cliente",
        primaryKpis: [
          "cotizacionesMes",
          "variacionCotizaciones",
          "conversionRate",
          "clientesNuevosMes",
          "pagosAnticipadosMes",
        ],
      },
      ANALISTA: {
        roleTitle: "Analista",
        objective: "Monitorear riesgo, costo y calidad financiera del portafolio",
        primaryKpis: [
          "tceaPromedio",
          "costoPromedio",
          "carteraActiva",
          "operacionesActivas",
          "conversionRate",
        ],
      },
      AUDITOR: {
        roleTitle: "Auditor",
        objective: "Supervisar trazabilidad, transparencia y cumplimiento normativo",
        primaryKpis: [
          "auditMes",
          "cotizacionesTotales",
          "operacionesActivas",
          "pagosAnticipadosMes",
          "tceaPromedio",
        ],
      },
    } as const

    return NextResponse.json({
      role: rolInferido,
      profile: dashboardPorRol[rolInferido],
      kpis,
      charts: {
        estadoCotizaciones: pieEstado,
        topVehiculos,
        volumenMensual,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error obteniendo métricas dashboard:", error)
    return NextResponse.json({ error: "Error obteniendo métricas" }, { status: 500 })
  }
}
