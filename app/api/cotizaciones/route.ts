import { Prisma } from "@prisma/client"
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { inferirRolDesdeEmail, obtenerUsuarioInternoDesdeSesion } from "@/lib/usuario-interno"
import { z } from "zod"

const capitalizacionMap: Record<string, number> = {
  DIARIA: 360,
  SEMANAL: 52,
  QUINCENAL: 24,
  MENSUAL: 12,
  BIMESTRAL: 6,
  TRIMESTRAL: 4,
  SEMESTRAL: 2,
  ANUAL: 1,
}

const schemaCrearCotizacion = z.object({
  selectedClienteId: z.number().optional(),
  selectedVehiculoId: z.number().optional(),
  cliente: z
    .object({
      tipoDocumento: z.enum(["DNI", "CE", "PASAPORTE"]),
      numDocumento: z.string().min(5),
      nombres: z.string().min(2),
      apPaterno: z.string().min(2),
      apMaterno: z.string().optional(),
      celular: z.string().min(9),
      correo: z.string().email(),
      direccion: z.string().min(5),
      ingresosMens: z.number().optional(),
      monedaIngres: z.enum(["PEN", "USD"]).optional(),
      situacionLab: z.string().optional(),
      empresaEmpl: z.string().optional(),
    })
    .optional(),
  vehiculo: z
    .object({
      marca: z.string().min(2),
      modelo: z.string().min(2),
      version: z.string().optional(),
      anio: z.number().int().min(2000),
      precioLista: z.number().positive(),
      monedaPrecio: z.enum(["PEN", "USD"]),
      concesionario: z.string().min(2),
      valResidEst: z.number().optional(),
      tipoValResid: z.enum(["MONTO", "PORCENTAJE"]).optional(),
    })
    .optional(),
  parametros: z.object({
    monedaOp: z.enum(["PEN", "USD"]),
    tipoTasa: z.enum(["EFECTIVA", "NOMINAL"]),
    tasaIngresada: z.number().positive(),
    capitalizacion: z
      .enum([
        "DIARIA",
        "SEMANAL",
        "QUINCENAL",
        "MENSUAL",
        "BIMESTRAL",
        "TRIMESTRAL",
        "SEMESTRAL",
        "ANUAL",
      ])
      .optional(),
    precioVehiculo: z.number().positive(),
    cuotaIniPct: z.number().min(0).max(99.99),
    cuotaIniMnt: z.number().min(0),
    plazoMeses: z.number().int().min(6).max(84),
    fecDesembolso: z.string(),
    fec1eraCuota: z.string(),
    graciaFlag: z.boolean(),
    graciaTipo: z.enum(["TOTAL", "PARCIAL"]).optional(),
    graciaMeses: z.number().int().min(0).max(6).optional(),
    residualFlag: z.boolean(),
    residualMonto: z.number().optional(),
    segDesgrav: z.number().min(0).optional(),
    segVehicular: z.number().min(0).optional(),
    gastoGps: z.number().min(0).optional(),
    gastoNotarial: z.number().min(0).optional(),
    motivoEdicion: z.string().optional(),
  }),
})

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
    const page = Math.max(1, Number(searchParams.get("page") || 1))
    const pageSize = Math.min(100, Math.max(5, Number(searchParams.get("pageSize") || 10)))

    const where: Prisma.CotizacionWhereInput = {}

    if (rol === "ASESOR") {
      const asesorId = await obtenerUsuarioInternoDesdeSesion(session.user)
      where.idUsuario = asesorId
    }

    if (estado !== "TODOS") {
      where.estado = estado as any
    }

    if (moneda !== "TODOS") {
      where.monedaOp = moneda as any
    }

    if (tipoTasa !== "TODOS") {
      where.tipoTasa = tipoTasa as any
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

    const total = await prisma.cotizacion.count({ where })

    const data = await prisma.cotizacion.findMany({
      where,
      include: {
        cliente: true,
        vehiculo: true,
      },
      orderBy: { creadoEn: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    const cotizaciones = data.map((c) => ({
      id: c.id.toString(),
      cliente: `${c.cliente.nombres} ${c.cliente.apPaterno}`,
      documento: c.cliente.numDocumento,
      vehiculo: `${c.vehiculo.marca} ${c.vehiculo.modelo} ${c.vehiculo.anio}`,
      moneda: c.monedaOp,
      montoFinanc: Number(c.montoFinanc),
      tcea: Number(c.tcea),
      estado: c.estado,
      creadoEn: c.creadoEn,
    }))

    return NextResponse.json({
      cotizaciones,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Cliente duplicado: documento o correo ya registrado" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Error listando cotizaciones" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })
    if (!session) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = schemaCrearCotizacion.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const input = parsed.data
    const asesorId = await obtenerUsuarioInternoDesdeSesion(session.user)

    let clienteId = input.selectedClienteId
    if (!clienteId) {
      if (!input.cliente) {
        return NextResponse.json({ error: "Debes seleccionar o crear cliente" }, { status: 400 })
      }

      const cliente = await prisma.cliente.create({
        data: {
          tipoDocumento: input.cliente.tipoDocumento,
          numDocumento: input.cliente.numDocumento,
          nombres: input.cliente.nombres,
          apPaterno: input.cliente.apPaterno,
          apMaterno: input.cliente.apMaterno,
          celular: input.cliente.celular,
          correo: input.cliente.correo,
          direccion: input.cliente.direccion,
          ingresosMens: input.cliente.ingresosMens,
          monedaIngres: input.cliente.monedaIngres,
          situacionLab: input.cliente.situacionLab,
          empresaEmpl: input.cliente.empresaEmpl,
          estado: "ACTIVO",
          creadoPor: asesorId,
        },
      })
      clienteId = Number(cliente.id)
    }

    let vehiculoId = input.selectedVehiculoId
    if (!vehiculoId) {
      if (!input.vehiculo) {
        return NextResponse.json({ error: "Debes seleccionar o crear vehículo" }, { status: 400 })
      }

      const vehiculo = await prisma.vehiculo.create({
        data: {
          marca: input.vehiculo.marca,
          modelo: input.vehiculo.modelo,
          version: input.vehiculo.version,
          anio: input.vehiculo.anio,
          precioLista: input.vehiculo.precioLista,
          monedaPrecio: input.vehiculo.monedaPrecio,
          concesionario: input.vehiculo.concesionario,
          valResidEst: input.vehiculo.valResidEst,
          tipoValResid: input.vehiculo.tipoValResid,
          estado: "DISPONIBLE",
          creadoPor: asesorId,
        },
      })
      vehiculoId = Number(vehiculo.id)
    }

    const p = input.parametros
    const resultado = calcularCredito({
      tipoTasa: p.tipoTasa,
      tasaIngresada: p.tasaIngresada,
      capitalizacion:
        p.tipoTasa === "NOMINAL" && p.capitalizacion
          ? capitalizacionMap[p.capitalizacion]
          : undefined,
      precioVehiculo: p.precioVehiculo,
      cuotaInicial: p.cuotaIniMnt,
      plazoMeses: p.plazoMeses,
      fechaDesembolso: new Date(p.fecDesembolso),
      fechaPrimeraCuota: new Date(p.fec1eraCuota),
      graciaFlag: p.graciaFlag,
      graciaTipo: p.graciaTipo,
      graciaMeses: p.graciaMeses,
      residualFlag: p.residualFlag,
      residualMonto: p.residualMonto,
      segDesgravamenPct: p.segDesgrav,
      segVehicularAnual: p.segVehicular,
      gastoGps: p.gastoGps,
      gastoNotarial: p.gastoNotarial,
    })

    const cotizacion = await prisma.cotizacion.create({
      data: {
        idCliente: BigInt(clienteId),
        idVehiculo: BigInt(vehiculoId),
        idUsuario: asesorId,
        version: 1,
        estado: "SIMULADA",
        monedaOp: p.monedaOp,
        tipoTasa: p.tipoTasa,
        tasaIngresada: p.tasaIngresada,
        capitalizacion: p.capitalizacion,
        tea: resultado.tea,
        tem: resultado.tem,
        precioVeh: p.precioVehiculo,
        cuotaIniPct: p.cuotaIniPct,
        cuotaIniMnt: p.cuotaIniMnt,
        montoFinanc: resultado.montoFinanciado,
        plazoMeses: p.plazoMeses,
        fecDesembolso: new Date(p.fecDesembolso),
        fec1eraCuota: new Date(p.fec1eraCuota),
        graciaFlag: p.graciaFlag,
        graciaTipo: p.graciaTipo,
        graciaMeses: p.graciaMeses,
        residualFlag: p.residualFlag,
        residualMonto: p.residualMonto,
        segDesgrav: p.segDesgrav,
        segVehicular: p.segVehicular,
        gastoGps: p.gastoGps,
        gastoNotarial: p.gastoNotarial,
        tcea: resultado.tcea,
        vanDeudor: resultado.vanDeudor,
        tirMensual: resultado.tirMensual,
        tirAnual: resultado.tirAnual,
        totPagado: resultado.totalPagado,
        costoCredito: resultado.costoCredito,
        motivoEdicion: p.motivoEdicion,
      },
    })

    if (resultado.cronograma.length > 0) {
      await prisma.cuota.createMany({
        data: resultado.cronograma.map((q) => ({
          idCotizacion: cotizacion.id,
          numero: q.numero,
          tipoCuota: q.tipoCuota,
          fecVencimiento: q.fechaVencimiento,
          saldoInicial: q.saldoInicial,
          interes: q.interes,
          amortizacion: q.amortizacion,
          segDesgravamen: q.segDesgravamen,
          segVehicular: q.segVehicular,
          otrosGastos: q.otrosGastos,
          cuotaTotal: q.cuotaTotal,
          saldoFinal: q.saldoFinal,
        })),
      })
    }

    return NextResponse.json({
      id: cotizacion.id.toString(),
      message: "Cotización creada exitosamente",
    })
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Registro duplicado: documento/correo/relación única" },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: error?.message || "Error creando cotización" },
      { status: 500 }
    )
  }
}
