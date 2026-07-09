import { prisma } from "@/lib/db"
import { calcularCredito } from "@/lib/motor-financiero"
import { buildParametrosCredito, mapCuotaToPrisma } from "@/lib/cotizacion-params"
import {
  VEHICULOS_DEMO_INVENTARIO,
  assertInventarioAlineadoAlCatalogo,
  residualEstimado,
} from "@/lib/vehiculos-demo-inventario"

/** Ancla temporal del seed: día/hora en que se ejecuta el botón (now). */
function seedNow(): Date {
  return new Date()
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function subMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}

function clampToReference(date: Date, reference: Date) {
  return date > reference ? new Date(reference) : date
}

/** Fechas de creación repartidas en los últimos 6 meses respecto a `reference` (now). */
function buildCreatedAt(index: number, reference: Date) {
  const monthOffset = index % 6
  const base = subMonths(reference, monthOffset)
  const isCurrentMonth = monthOffset === 0
  const maxDay = isCurrentMonth ? Math.max(1, reference.getDate()) : 26
  const day = randomInt(1, maxDay)
  const date = new Date(
    base.getFullYear(),
    base.getMonth(),
    day,
    randomInt(8, 18),
    randomInt(0, 59),
    0,
    0
  )
  return clampToReference(date, reference)
}

const ROLES_DEMO = [
  { usuario: "admin_demo", nombreCompleto: "Admin Demo", rol: "ADMIN" as const },
  { usuario: "asesor_demo", nombreCompleto: "Asesor Demo", rol: "ASESOR" as const },
  { usuario: "analista_demo", nombreCompleto: "Analista Demo", rol: "ANALISTA" as const },
  { usuario: "auditor_demo", nombreCompleto: "Auditor Demo", rol: "AUDITOR" as const },
]

export async function ensureDemoUsers() {
  for (const u of ROLES_DEMO) {
    await prisma.usuario.upsert({
      where: { usuario: u.usuario },
      update: { nombreCompleto: u.nombreCompleto, rol: u.rol, estado: "ACTIVO" },
      create: {
        usuario: u.usuario,
        contrasena: "better_auth_managed",
        nombreCompleto: u.nombreCompleto,
        rol: u.rol,
        estado: "ACTIVO",
      },
    })
  }
}

/** Borra cotizaciones/operaciones/pagos del asesor demo para regenerar data demo */
async function wipeAsesorDemoCotizaciones(asesorId: bigint) {
  const cots = await prisma.cotizacion.findMany({
    where: { idUsuario: asesorId },
    select: { id: true },
  })
  const ids = cots.map((c) => c.id)
  if (ids.length === 0) return

  const ops = await prisma.operacion.findMany({
    where: { idCotizacion: { in: ids } },
    select: { id: true },
  })
  const opIds = ops.map((o) => o.id)
  if (opIds.length > 0) {
    await prisma.pago.deleteMany({ where: { idOperacion: { in: opIds } } })
    await prisma.operacion.deleteMany({ where: { id: { in: opIds } } })
  }
  await prisma.cuota.deleteMany({ where: { idCotizacion: { in: ids } } })
  await prisma.cotizacion.deleteMany({ where: { id: { in: ids } } })
}

/** Inventario demo alineado al selector de marca/modelo. Con force, reemplaza huérfanos. */
async function syncDemoVehiculos(asesorId: bigint, options?: { force?: boolean }) {
  assertInventarioAlineadoAlCatalogo()

  const force = options?.force === true
  if (force) {
    // Tras wipe de cotizaciones, quitar vehículos sin vínculos y recrear inventario
    await prisma.vehiculo.deleteMany({ where: { cotizaciones: { none: {} } } })
  }

  const existentes = await prisma.vehiculo.findMany({ orderBy: { id: "asc" } })
  if (!force && existentes.length > 0) return

  for (const item of VEHICULOS_DEMO_INVENTARIO) {
    const match = await prisma.vehiculo.findFirst({
      where: {
        marca: item.marca,
        modelo: item.modelo,
        precioLista: item.precioLista,
      },
    })

    if (match) {
      await prisma.vehiculo.update({
        where: { id: match.id },
        data: {
          version: item.version,
          anio: item.anio,
          monedaPrecio: item.monedaPrecio,
          concesionario: item.concesionario,
          valResidEst: residualEstimado(item),
          tipoValResid: "MONTO",
          tipoVehiculo: item.tipoVehiculo as any,
          transmision: item.transmision as any,
          combustible: item.combustible as any,
          estado: "DISPONIBLE",
        },
      })
      continue
    }

    await prisma.vehiculo.create({
      data: {
        marca: item.marca,
        modelo: item.modelo,
        version: item.version,
        anio: item.anio,
        precioLista: item.precioLista,
        monedaPrecio: item.monedaPrecio,
        concesionario: item.concesionario,
        valResidEst: residualEstimado(item),
        tipoValResid: "MONTO",
        tipoVehiculo: item.tipoVehiculo as any,
        transmision: item.transmision as any,
        combustible: item.combustible as any,
        estado: "DISPONIBLE",
        creadoPor: asesorId,
      },
    })
  }
}

async function ensureSeedBase() {
  await ensureDemoUsers()

  const asesor = await prisma.usuario.findFirst({ where: { usuario: "asesor_demo" } })
  if (!asesor) return

  const anyCliente = await prisma.cliente.count()
  if (anyCliente === 0) {
    const clientes = [
      ["DNI", "72182937", "Luis", "Paredes", "Rojas", "987456123", "luis.paredes@example.com"],
      ["DNI", "48291736", "María", "Quispe", "Cano", "982113445", "maria.quispe@example.com"],
      ["CE", "CE0098123", "Kevin", "Arias", "Mejía", "978001122", "kevin.arias@example.com"],
      ["DNI", "71900321", "Carla", "Huamán", "Soto", "961220088", "carla.huaman@example.com"],
      ["PASAPORTE", "P1299081", "Jorge", "Díaz", "Nina", "956310044", "jorge.diaz@example.com"],
    ] as const

    for (const c of clientes) {
      await prisma.cliente.create({
        data: {
          tipoDocumento: c[0],
          numDocumento: c[1],
          nombres: c[2],
          apPaterno: c[3],
          apMaterno: c[4],
          celular: c[5],
          correo: c[6],
          direccion: "Lima, Perú",
          ingresosMens: randomInt(2800, 9500),
          monedaIngres: "PEN",
          situacionLab: Math.random() > 0.5 ? "DEPENDIENTE" : "INDEPENDIENTE",
          empresaEmpl: "Empresa Demo SAC",
          estado: "ACTIVO",
          creadoPor: asesor.id,
        },
      })
    }
  }
}

type SeedScenario = {
  label: string
  precio: number
  cuotaIniPct: number
  plazoMeses: 24 | 36
  tipoTasa: "TNA" | "TEA"
  tasaIngresada: number
  capitalizacion?: "DIARIA" | "MENSUAL"
  monedaOp?: "PEN" | "USD"
  graciaTotalMeses: number
  graciaParcialMeses: number
  pctCuotaFinal: number
  segDesgrav: number
  pctSegRie: number
  gastoGps: number
  portesPer: number
  gasAdmPer: number
  gastoNotarial: number
  costeRegistral: number
  cokAnual: number
}

/** Escenarios demo Compra Inteligente (el primero es el caso Plan 36 de referencia). */
const SCENARIOS: SeedScenario[] = [
  {
    label: "Plan 36 Compra Inteligente",
    precio: 16000,
    cuotaIniPct: 20,
    plazoMeses: 36,
    tipoTasa: "TEA",
    tasaIngresada: 16.17979460574055,
    graciaTotalMeses: 3,
    graciaParcialMeses: 3,
    pctCuotaFinal: 0.4,
    segDesgrav: 0.00049,
    pctSegRie: 0.003,
    gastoGps: 20,
    portesPer: 3.5,
    gasAdmPer: 3.5,
    gastoNotarial: 100,
    costeRegistral: 75,
    cokAnual: 0.08,
  },
  {
    label: "Plan 24 Compra Inteligente",
    precio: 87990,
    cuotaIniPct: 20,
    plazoMeses: 24,
    tipoTasa: "TEA",
    tasaIngresada: 15.024249,
    graciaTotalMeses: 0,
    graciaParcialMeses: 2,
    pctCuotaFinal: 0.5,
    segDesgrav: 0.00049,
    pctSegRie: 0.003,
    gastoGps: 25,
    portesPer: 3.5,
    gasAdmPer: 3.5,
    gastoNotarial: 120,
    costeRegistral: 80,
    cokAnual: 0.08,
  },
  {
    label: "Plan 36 TEA directa",
    precio: 94500,
    cuotaIniPct: 25,
    plazoMeses: 36,
    tipoTasa: "TEA",
    tasaIngresada: 16.5,
    graciaTotalMeses: 0,
    graciaParcialMeses: 0,
    pctCuotaFinal: 0.4,
    segDesgrav: 0.0005,
    pctSegRie: 0.0028,
    gastoGps: 20,
    portesPer: 3.5,
    gasAdmPer: 3.5,
    gastoNotarial: 100,
    costeRegistral: 75,
    cokAnual: 0.08,
  },
  {
    label: "Plan 36 con gracia total",
    precio: 102500,
    cuotaIniPct: 18,
    plazoMeses: 36,
    tipoTasa: "TEA",
    tasaIngresada: 17.346916,
    graciaTotalMeses: 2,
    graciaParcialMeses: 0,
    pctCuotaFinal: 0.4,
    segDesgrav: 0.00049,
    pctSegRie: 0.003,
    gastoGps: 22,
    portesPer: 3.5,
    gasAdmPer: 3.5,
    gastoNotarial: 110,
    costeRegistral: 70,
    cokAnual: 0.08,
  },
  {
    label: "Plan 24 TEA SUV",
    precio: 123000,
    cuotaIniPct: 30,
    plazoMeses: 24,
    tipoTasa: "TEA",
    tasaIngresada: 15.2,
    graciaTotalMeses: 1,
    graciaParcialMeses: 1,
    pctCuotaFinal: 0.45,
    segDesgrav: 0.00045,
    pctSegRie: 0.0032,
    gastoGps: 30,
    portesPer: 4,
    gasAdmPer: 4,
    gastoNotarial: 150,
    costeRegistral: 90,
    cokAnual: 0.08,
  },
  {
    label: "Enunciado USD Plan 24",
    precio: 25000,
    cuotaIniPct: 20,
    plazoMeses: 24,
    tipoTasa: "TEA",
    tasaIngresada: 18,
    monedaOp: "USD",
    graciaTotalMeses: 0,
    graciaParcialMeses: 0,
    pctCuotaFinal: 0.5,
    segDesgrav: 0.00049,
    pctSegRie: 0.003,
    gastoGps: 20,
    portesPer: 3.5,
    gasAdmPer: 3.5,
    gastoNotarial: 100,
    costeRegistral: 75,
    cokAnual: 0.08,
  },
]

function scenarioForIndex(i: number): SeedScenario {
  if (i < SCENARIOS.length) return SCENARIOS[i]
  const base = SCENARIOS[i % SCENARIOS.length]
  const plazo = (i % 2 === 0 ? 36 : 24) as 24 | 36
  return {
    ...base,
    label: `Variante Plan ${plazo} #${i + 1}`,
    precio: Math.round(base.precio * randomBetween(0.85, 1.15)),
    cuotaIniPct: randomBetween(15, 30),
    plazoMeses: plazo,
    pctCuotaFinal: plazo === 24 ? 0.5 : 0.4,
    tasaIngresada: randomBetween(13, 20),
    graciaTotalMeses: i % 4 === 0 ? 2 : i % 4 === 1 ? 3 : 0,
    graciaParcialMeses: i % 4 === 1 ? 3 : i % 4 === 2 ? 2 : 0,
    cokAnual: 0.08,
  }
}

export async function seedSyntheticOperationsIfNeeded(options?: { force?: boolean }) {
  const reference = endOfDay(seedNow())
  const force = options?.force === true

  await ensureDemoUsers()

  const asesor = await prisma.usuario.findFirst({ where: { usuario: "asesor_demo" } })
  if (!asesor) return

  // Clientes base (solo si no hay ninguno)
  await ensureSeedBase()

  if (force) {
    await wipeAsesorDemoCotizaciones(asesor.id)
  }

  // Inventario demo alineado al selector (reemplaza huérfanos si force)
  await syncDemoVehiculos(asesor.id, { force })

  const clientes = await prisma.cliente.findMany({ take: 5, orderBy: { id: "asc" } })
  const vehiculos = await prisma.vehiculo.findMany({
    where: { estado: "DISPONIBLE" },
    orderBy: { id: "asc" },
  })
  if (clientes.length === 0 || vehiculos.length === 0) return

  const asesorCotizacionesCount = await prisma.cotizacion.count({
    where: { idUsuario: asesor.id },
  })

  const targetCotizacionesAsesor = 24
  const missing = force ? targetCotizacionesAsesor : Math.max(0, targetCotizacionesAsesor - asesorCotizacionesCount)
  if (missing === 0) return

  const estados: Array<"SIMULADA" | "PRESENTADA" | "APROBADA" | "RECHAZADA"> = [
    "SIMULADA",
    "PRESENTADA",
    "APROBADA",
    "RECHAZADA",
  ]

  for (let i = 0; i < missing; i++) {
    const scenario = scenarioForIndex(i)
    const cliente = clientes[i % clientes.length]
    const vehiculo =
      scenario.precio === 16000
        ? vehiculos.find((v) => Number(v.precioLista) === 16000) || vehiculos[0]
        : vehiculos[i % vehiculos.length]

    const precio = scenario.precio
    const cuotaIniPct = scenario.cuotaIniPct
    const cuotaIniMnt = Math.round(((precio * cuotaIniPct) / 100) * 100) / 100
    const residualMonto = Math.round(precio * scenario.pctCuotaFinal * 100) / 100
    const createdAt = buildCreatedAt(i, reference)
    const estado = estados[i % estados.length]
    // Desembolso y 1era cuota relativos a createdAt, sin pasar del "hoy" del seed
    const fecDesembolso = clampToReference(addDays(createdAt, 1), reference)
    // Primera cuota: +30 días desde desembolso (puede quedar en el futuro respecto a hoy — correcto para cronograma)
    const fec1eraCuota = addDays(fecDesembolso, 30)
    const graciaFlag = scenario.graciaTotalMeses + scenario.graciaParcialMeses > 0

    const params = buildParametrosCredito({
      tasaIngresada: scenario.tasaIngresada,
      tipoTasa: "TEA",
      capitalizacion: null,
      precioVehiculo: precio,
      cuotaIniMnt,
      plazoMeses: scenario.plazoMeses,
      fecDesembolso,
      fec1eraCuota,
      graciaFlag,
      graciaTotalMeses: scenario.graciaTotalMeses,
      graciaParcialMeses: scenario.graciaParcialMeses,
      residualFlag: true,
      residualMonto,
      pctCuotaFinal: scenario.pctCuotaFinal,
      segDesgrav: scenario.segDesgrav,
      pctSegRie: scenario.pctSegRie,
      gastoGps: scenario.gastoGps,
      portesPer: scenario.portesPer,
      gasAdmPer: scenario.gasAdmPer,
      gastoNotarial: scenario.gastoNotarial,
      costeRegistral: scenario.costeRegistral,
      costeTasacion: 0,
      comisionEstudio: 0,
      comisionActivacion: 0,
      cokAnual: scenario.cokAnual,
    })

    const resultado = calcularCredito(params)

    const cot = await prisma.cotizacion.create({
      data: {
        idCliente: cliente.id,
        idVehiculo: vehiculo.id,
        idUsuario: asesor.id,
        version: 1,
        estado,
        monedaOp: scenario.monedaOp ?? "PEN",
        tipoTasa: "TEA",
        capitalizacion: null,
        tasaIngresada: scenario.tasaIngresada,
        tea: resultado.tea,
        tem: resultado.tem,
        precioVeh: precio,
        cuotaIniPct,
        cuotaIniMnt,
        montoFinanc: resultado.montoFinanciado,
        plazoMeses: scenario.plazoMeses,
        fecDesembolso,
        fec1eraCuota,
        graciaFlag,
        graciaTipo: scenario.graciaTotalMeses > 0 ? "TOTAL" : scenario.graciaParcialMeses > 0 ? "PARCIAL" : null,
        graciaMeses: scenario.graciaTotalMeses + scenario.graciaParcialMeses || null,
        graciaTotalMeses: scenario.graciaTotalMeses || null,
        graciaParcialMeses: scenario.graciaParcialMeses || null,
        residualFlag: true,
        residualMonto,
        pctCuotaFinal: scenario.pctCuotaFinal,
        segDesgrav: scenario.segDesgrav,
        segVehicular: null,
        gastoGps: scenario.gastoGps,
        gastoNotarial: scenario.gastoNotarial,
        costeRegistral: scenario.costeRegistral,
        costeTasacion: 0,
        comisionEstudio: 0,
        comisionActivacion: 0,
        portesPer: scenario.portesPer,
        gasAdmPer: scenario.gasAdmPer,
        pctSegRie: scenario.pctSegRie,
        cokAnual: scenario.cokAnual,
        tcea: resultado.tcea,
        vanDeudor: resultado.vanDeudor,
        tirMensual: resultado.tirMensual,
        tirAnual: resultado.tirAnual,
        totPagado: resultado.totalPagado,
        costoCredito: resultado.costoCredito,
        motivoEdicion: scenario.label,
        creadoEn: createdAt,
      },
    })

    if (resultado.cronograma.length > 0) {
      await prisma.cuota.createMany({
        data: resultado.cronograma.map((q) => mapCuotaToPrisma(q, cot.id)),
      })
    }

    if (estado === "APROBADA" && i % 2 === 0) {
      const fecInicio = clampToReference(addDays(cot.creadoEn, 3), reference)
      // Término operativo puede quedar en el futuro (plazo del crédito)
      const fecTermino = addDays(fecInicio, i % 6 === 0 ? 180 : 360)
      const saldoActual = Number(resultado.cronograma[0]?.saldoInicial ?? resultado.montoFinanciado)

      const op = await prisma.operacion.create({
        data: {
          idCotizacion: cot.id,
          estadoOp: i % 6 === 0 ? "CERRADA" : "ACTIVA",
          fecInicio,
          fecTermino,
          saldoActual,
          versionCrono: 1,
          creadoEn: fecInicio,
        },
      })

      const numPagos = randomInt(1, 3)
      let saldo = saldoActual
      for (let p = 0; p < numPagos; p++) {
        const tipoPago = p % 3 === 0 ? "ANTICIPADO_PARCIAL" : "CUOTA_NORMAL"
        const cuotaRef = resultado.cronograma.find((c) => c.pg === "S" && c.tipoCuota === "NORMAL")
        const monto = cuotaRef ? Math.abs(cuotaRef.cuotaTotal) : randomBetween(800, 4200)
        const capitalAmort = tipoPago === "ANTICIPADO_PARCIAL" ? monto * 0.7 : monto * 0.45
        const saldoNuevo = Math.max(0, saldo - capitalAmort)
        const fechaPago = clampToReference(addDays(op.fecInicio, p * 35), reference)

        await prisma.pago.create({
          data: {
            idOperacion: op.id,
            fechaPago,
            montoTotal: monto,
            tipoPago,
            cuotaAplicada: monto * 0.35,
            interesDia: monto * 0.03,
            capitalAmort,
            saldoAnterior: saldo,
            saldoNuevo,
            modalidad: tipoPago === "ANTICIPADO_PARCIAL" ? (Math.random() > 0.5 ? "REDUCIR_PLAZO" : "REDUCIR_CUOTA") : null,
            penalidad: 0,
            canalPago: "TRANSFERENCIA",
            referencia: `DEMO-IB-${op.id.toString()}-${p + 1}`,
            idUsuario: asesor.id,
            creadoEn: fechaPago,
          },
        })
        saldo = saldoNuevo
      }
    }
  }
}
