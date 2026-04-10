import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { Prisma } from "@prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { inferirRolDesdeEmail, obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value)
}

export async function GET(req: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const rol = inferirRolDesdeEmail(session.user?.email)
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()
    const estado = (searchParams.get("estado") || "TODOS").trim()
    const moneda = (searchParams.get("moneda") || "TODOS").trim()
    const tipoTasa = (searchParams.get("tipoTasa") || "TODOS").trim()
    const fechaDesde = searchParams.get("fechaDesde")
    const fechaHasta = searchParams.get("fechaHasta")

    const where: Prisma.CotizacionWhereInput = {}

    if (rol === "ASESOR") {
      where.idUsuario = await obtenerUsuarioInternoDesdeSesion(session.user)
    }

    if (estado !== "TODOS") where.estado = estado as any
    if (moneda !== "TODOS") where.monedaOp = moneda as any
    if (tipoTasa !== "TODOS") where.tipoTasa = tipoTasa as any

    if (fechaDesde || fechaHasta) {
      where.creadoEn = {}
      if (fechaDesde) where.creadoEn.gte = new Date(fechaDesde)
      if (fechaHasta) {
        const f = new Date(fechaHasta)
        f.setHours(23, 59, 59, 999)
        where.creadoEn.lte = f
      }
    }

    if (search) {
      where.OR = [
        { cliente: { nombres: { contains: search } } },
        { cliente: { apPaterno: { contains: search } } },
        { cliente: { apMaterno: { contains: search } } },
        { cliente: { numDocumento: { contains: search } } },
        { vehiculo: { marca: { contains: search } } },
        { vehiculo: { modelo: { contains: search } } },
        { vehiculo: { version: { contains: search } } },
      ]
    }

    const cotizaciones = await prisma.cotizacion.findMany({
      where,
      include: {
        cliente: true,
        vehiculo: true,
        usuario: true,
      },
      orderBy: { creadoEn: "desc" },
      take: 10_000,
    })

    const columns = [
      "id",
      "version",
      "estado",
      "fecha_creacion",
      "asesor",
      "cliente",
      "documento",
      "vehiculo",
      "moneda",
      "monto_financiado",
      "plazo_meses",
      "tcea_pct",
      "tir_anual_pct",
      "van_deudor",
    ]

    const rows = cotizaciones.map((c) => {
      const cliente = `${c.cliente.nombres} ${c.cliente.apPaterno} ${c.cliente.apMaterno ?? ""}`.trim()
      const vehiculo = `${c.vehiculo.marca} ${c.vehiculo.modelo} ${c.vehiculo.version ?? ""} ${c.vehiculo.anio}`
        .replace(/\s+/g, " ")
        .trim()

      return [
        c.id.toString(),
        String(c.version),
        c.estado,
        formatDate(c.creadoEn),
        c.usuario.nombreCompleto,
        cliente,
        `${c.cliente.tipoDocumento} ${c.cliente.numDocumento}`,
        vehiculo,
        c.monedaOp,
        Number(c.montoFinanc).toFixed(2),
        String(c.plazoMeses),
        Number(c.tcea).toFixed(4),
        Number(c.tirAnual).toFixed(4),
        Number(c.vanDeudor).toFixed(2),
      ]
    })

    const csv = [columns, ...rows]
      .map((row) => row.map((cell) => escapeCsvValue(cell)).join(","))
      .join("\n")

    const filename = `cotizaciones_${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: "Error exportando cotizaciones" }, { status: 500 })
  }
}
