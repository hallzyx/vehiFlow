import { prisma } from "@/lib/db"

const REFERENCE_TODAY = new Date("2026-04-09T23:59:59.999Z")

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

function clampToReference(date: Date) {
  return date > REFERENCE_TODAY ? new Date(REFERENCE_TODAY) : date
}

function buildCreatedAt(index: number) {
  const monthOffset = index % 6 // 0..5 -> abril..noviembre
  const base = subMonths(REFERENCE_TODAY, monthOffset)
  const maxDay = monthOffset === 0 ? 8 : 26
  const day = randomInt(1, maxDay)
  const date = new Date(base.getFullYear(), base.getMonth(), day, randomInt(8, 18), randomInt(0, 59), 0, 0)
  return clampToReference(date)
}

async function capFutureDatesToReference() {
  await prisma.cotizacion.updateMany({
    where: { creadoEn: { gt: REFERENCE_TODAY } },
    data: { creadoEn: REFERENCE_TODAY },
  })

  await prisma.cotizacion.updateMany({
    where: { fecDesembolso: { gt: REFERENCE_TODAY } },
    data: { fecDesembolso: REFERENCE_TODAY },
  })

  await prisma.cotizacion.updateMany({
    where: { fec1eraCuota: { gt: REFERENCE_TODAY } },
    data: { fec1eraCuota: REFERENCE_TODAY },
  })

  await prisma.cuota.updateMany({
    where: { fecVencimiento: { gt: REFERENCE_TODAY } },
    data: { fecVencimiento: REFERENCE_TODAY },
  })

  await prisma.operacion.updateMany({
    where: { creadoEn: { gt: REFERENCE_TODAY } },
    data: { creadoEn: REFERENCE_TODAY },
  })

  await prisma.operacion.updateMany({
    where: { fecInicio: { gt: REFERENCE_TODAY } },
    data: { fecInicio: REFERENCE_TODAY },
  })

  await prisma.operacion.updateMany({
    where: { fecTermino: { gt: REFERENCE_TODAY } },
    data: { fecTermino: REFERENCE_TODAY },
  })

  await prisma.pago.updateMany({
    where: { fechaPago: { gt: REFERENCE_TODAY } },
    data: { fechaPago: REFERENCE_TODAY },
  })

  await prisma.pago.updateMany({
    where: { creadoEn: { gt: REFERENCE_TODAY } },
    data: { creadoEn: REFERENCE_TODAY },
  })
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

async function ensureSeedBase() {
  await ensureDemoUsers()

  const anyCliente = await prisma.cliente.count()
  const anyVehiculo = await prisma.vehiculo.count()
  if (anyCliente > 0 && anyVehiculo > 0) return

  const asesor = await prisma.usuario.findFirst({ where: { usuario: "asesor_demo" } })
  if (!asesor) return

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

  if (anyVehiculo === 0) {
    const vehiculos = [
      ["Toyota", "Corolla", "XEI", 2025, 87990],
      ["Kia", "Seltos", "EX", 2026, 102500],
      ["Hyundai", "Creta", "GLS", 2025, 94500],
      ["Mazda", "CX-30", "Touring", 2026, 123000],
      ["Chevrolet", "Onix", "Premier", 2025, 69800],
    ] as const

    for (const v of vehiculos) {
      const precio = v[4]
      const residual = Math.round(precio * randomBetween(0.28, 0.45))

      await prisma.vehiculo.create({
        data: {
          marca: v[0],
          modelo: v[1],
          version: v[2],
          anio: v[3],
          precioLista: precio,
          monedaPrecio: "PEN",
          concesionario: "Concesionario Demo",
          valResidEst: residual,
          tipoValResid: "MONTO",
          tipoVehiculo: "SEDAN",
          transmision: "AUTOMATICA",
          combustible: "GASOLINA",
          estado: "DISPONIBLE",
          creadoPor: asesor.id,
        },
      })
    }
  }
}

export async function seedSyntheticOperationsIfNeeded() {
  await ensureSeedBase()
  await capFutureDatesToReference()

  const asesor = await prisma.usuario.findFirst({ where: { usuario: "asesor_demo" } })
  const clientes = await prisma.cliente.findMany({ take: 5, orderBy: { id: "asc" } })
  const vehiculos = await prisma.vehiculo.findMany({ take: 5, orderBy: { id: "asc" } })
  if (!asesor || clientes.length === 0 || vehiculos.length === 0) return

  const asesorCotizacionesCount = await prisma.cotizacion.count({
    where: { idUsuario: asesor.id },
  })

  const targetCotizacionesAsesor = 24
  const missing = Math.max(0, targetCotizacionesAsesor - asesorCotizacionesCount)
  if (missing === 0) return

  const estados: Array<"SIMULADA" | "PRESENTADA" | "APROBADA" | "RECHAZADA"> = [
    "SIMULADA",
    "PRESENTADA",
    "APROBADA",
    "RECHAZADA",
  ]

  for (let i = 0; i < missing; i++) {
    const cliente = clientes[i % clientes.length]
    const vehiculo = vehiculos[i % vehiculos.length]
    const precio = Number(vehiculo.precioLista)
    const cuotaIniPct = randomBetween(15, 30)
    const cuotaIniMnt = (precio * cuotaIniPct) / 100
    const montoFinanc = precio - cuotaIniMnt
    const plazo = [24, 36, 48][i % 3]
    const tasa = randomBetween(11.5, 24.5)
    const tcea = tasa + randomBetween(2.5, 7.5)
    const createdAt = buildCreatedAt(i)
    const estado = estados[i % estados.length]

    const fecDesembolso = clampToReference(addDays(createdAt, 1))
    const fec1eraCuota = clampToReference(addDays(createdAt, 31))

    const cot = await prisma.cotizacion.create({
      data: {
        idCliente: cliente.id,
        idVehiculo: vehiculo.id,
        idUsuario: asesor.id,
        version: 1,
        estado,
        monedaOp: "PEN",
        tipoTasa: "EFECTIVA",
        tasaIngresada: tasa,
        capitalizacion: null,
        tea: tasa,
        tem: (Math.pow(1 + tasa / 100, 1 / 12) - 1) * 100,
        precioVeh: precio,
        cuotaIniPct,
        cuotaIniMnt,
        montoFinanc,
        plazoMeses: plazo,
        fecDesembolso,
        fec1eraCuota,
        graciaFlag: false,
        graciaTipo: null,
        graciaMeses: null,
        residualFlag: Math.random() > 0.5,
        residualMonto: Math.random() > 0.5 ? Number(vehiculo.valResidEst || 0) : 0,
        segDesgrav: 0.04,
        segVehicular: randomBetween(900, 1600),
        gastoGps: randomBetween(0, 220),
        gastoNotarial: randomBetween(0, 180),
        tcea,
        vanDeudor: randomBetween(-1300, 0),
        tirMensual: randomBetween(1.0, 2.4),
        tirAnual: randomBetween(12.5, 28.9),
        totPagado: montoFinanc * randomBetween(1.25, 1.9),
        costoCredito: montoFinanc * randomBetween(0.2, 0.8),
        motivoEdicion: null,
        creadoEn: createdAt,
      },
    })

    let saldo = montoFinanc
    const cuotaBase = montoFinanc / plazo
    for (let n = 1; n <= Math.min(plazo, 6); n++) {
      const interes = saldo * ((tasa / 100) / 12)
      const amort = Math.max(0, cuotaBase - interes)
      const cuota = interes + amort + 50
      const saldoFinal = Math.max(0, saldo - amort)

      await prisma.cuota.create({
        data: {
          idCotizacion: cot.id,
          numero: n,
          tipoCuota: "NORMAL",
          fecVencimiento: clampToReference(addDays(cot.fec1eraCuota, (n - 1) * 30)),
          saldoInicial: saldo,
          interes,
          amortizacion: amort,
          segDesgravamen: saldo * 0.0004,
          segVehicular: 25,
          otrosGastos: n === 1 ? 80 : 0,
          cuotaTotal: cuota,
          saldoFinal,
        },
      })

      saldo = saldoFinal
    }

    if (estado === "APROBADA" && i % 2 === 0) {
      const fecInicio = clampToReference(addDays(cot.creadoEn, 3))
      const fecTermino = clampToReference(addDays(cot.creadoEn, i % 6 === 0 ? 180 : 360))

      const op = await prisma.operacion.create({
        data: {
          idCotizacion: cot.id,
          estadoOp: i % 6 === 0 ? "CERRADA" : "ACTIVA",
          fecInicio,
          fecTermino,
          saldoActual: saldo,
          versionCrono: 1,
          creadoEn: fecInicio,
        },
      })

      const numPagos = randomInt(1, 4)
      for (let p = 0; p < numPagos; p++) {
        const tipoPago = p % 3 === 0 ? "ANTICIPADO_PARCIAL" : "CUOTA_NORMAL"
        const monto = randomBetween(800, 4200)
        const capitalAmort = tipoPago === "ANTICIPADO_PARCIAL" ? monto * randomBetween(0.65, 0.92) : monto * 0.45

        await prisma.pago.create({
          data: {
            idOperacion: op.id,
            fechaPago: clampToReference(addDays(op.fecInicio, p * 35)),
            montoTotal: monto,
            tipoPago,
            cuotaAplicada: monto * 0.35,
            interesDia: monto * 0.03,
            capitalAmort,
            saldoAnterior: Math.max(0, saldo + capitalAmort),
            saldoNuevo: Math.max(0, saldo),
            modalidad: tipoPago === "ANTICIPADO_PARCIAL" ? (Math.random() > 0.5 ? "REDUCIR_PLAZO" : "REDUCIR_CUOTA") : null,
            penalidad: 0,
            canalPago: "TRANSFERENCIA",
            referencia: `DEMO-${op.id.toString()}-${p + 1}`,
            idUsuario: asesor.id,
            creadoEn: clampToReference(addDays(op.fecInicio, p * 35)),
          },
        })
      }
    }
  }
}
