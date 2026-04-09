import {
  calcularCapitalActivo,
  calcularCuotaBase,
  calcularTCEA,
  calcularTIR,
  calcularTotales,
  calcularVAN,
  generarCronograma,
  type Cuota,
} from "@/lib/motor-financiero"

export type ModalidadAnticipado = "REDUCIR_PLAZO" | "REDUCIR_CUOTA"

export interface CuotaOperacionLike {
  numero: number
  tipoCuota: "GRACIA_TOTAL" | "GRACIA_PARCIAL" | "NORMAL" | "RESIDUAL"
  fecVencimiento: Date
  saldoInicial: number
  interes: number
  amortizacion: number
  segDesgravamen: number
  segVehicular: number
  otrosGastos: number
  cuotaTotal: number
  saldoFinal: number
}

export interface ContextoOperacion {
  cuotaReferencia: CuotaOperacionLike
  indiceCuotaReferencia: number
  cuotasRestantes: number
  cuotasPendientes: CuotaOperacionLike[]
  cuotaExigible: number
  interesesRestantes: number
  fechaUltimaCuota: Date
}

export interface AnalisisPago {
  tipoPago: "CUOTA_NORMAL" | "ANTICIPADO_PARCIAL" | "CANCELACION_TOTAL"
  diasDevengados: number
  interesDia: number
  cuotaAplicada: number
  excedente: number
  capitalAmortizado: number
  saldoAnterior: number
  saldoNuevo: number
  penalidad: number
}

export interface ResultadoRecalculo {
  modalidad: ModalidadAnticipado
  nuevaCuotaBase: number
  nuevoPlazoMeses: number
  cronograma: Cuota[]
  tcea: number
  vanDeudor: number
  tirMensualPct: number | null
  tirAnualPct: number | null
  tirNoConverge: boolean
  totalIntereses: number
  totalPagado: number
  ahorroIntereses: number
  fechaTermino: Date
}

function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function round4(value: number) {
  return Math.round((value + Number.EPSILON) * 10000) / 10000
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function normalizarCuotas(input: any[]): CuotaOperacionLike[] {
  return input
    .map((q) => ({
      numero: Number(q.numero),
      tipoCuota: q.tipoCuota,
      fecVencimiento: new Date(q.fecVencimiento),
      saldoInicial: Number(q.saldoInicial),
      interes: Number(q.interes),
      amortizacion: Number(q.amortizacion),
      segDesgravamen: Number(q.segDesgravamen),
      segVehicular: Number(q.segVehicular),
      otrosGastos: Number(q.otrosGastos),
      cuotaTotal: Number(q.cuotaTotal),
      saldoFinal: Number(q.saldoFinal),
    }))
    .sort((a, b) => a.numero - b.numero)
}

export function resolverContextoOperacion(cuotas: CuotaOperacionLike[], saldoActual: number): ContextoOperacion {
  if (cuotas.length === 0) {
    throw new Error("La operación no tiene cronograma de cuotas")
  }

  let indice = 0
  let mejorDiff = Number.POSITIVE_INFINITY

  for (let i = 0; i < cuotas.length; i++) {
    if (cuotas[i].tipoCuota === "GRACIA_TOTAL") continue
    const diff = Math.abs(cuotas[i].saldoInicial - saldoActual)
    if (diff < mejorDiff) {
      mejorDiff = diff
      indice = i
    }
  }

  const cuotasPendientes = cuotas.slice(indice)
  const cuotaReferencia = cuotasPendientes[0] ?? cuotas[0]
  const cuotaExigible = round2(cuotaReferencia.cuotaTotal)
  const interesesRestantes = round2(cuotasPendientes.reduce((acc, c) => acc + c.interes, 0))

  const fechaUltimaCuota =
    indice > 0 ? cuotas[indice - 1].fecVencimiento : addDays(cuotaReferencia.fecVencimiento, -30)

  return {
    cuotaReferencia,
    indiceCuotaReferencia: indice,
    cuotasRestantes: cuotasPendientes.filter((c) => c.tipoCuota !== "RESIDUAL").length,
    cuotasPendientes,
    cuotaExigible,
    interesesRestantes,
    fechaUltimaCuota,
  }
}

export function analizarPagoExtraordinario(params: {
  saldoActual: number
  cuotaExigible: number
  temPct: number
  fechaUltimaCuota: Date
  fechaPago: Date
  montoPago: number
}): AnalisisPago {
  const { saldoActual, cuotaExigible, temPct, fechaUltimaCuota, fechaPago, montoPago } = params

  const diasRaw = Math.floor((fechaPago.getTime() - fechaUltimaCuota.getTime()) / (1000 * 60 * 60 * 24))
  const diasDevengados = clamp(diasRaw, 0, 30)
  const temDecimal = temPct / 100

  const interesDia = round2(saldoActual * temDecimal * (diasDevengados / 30))
  const cuotaAplicada = round2(Math.min(montoPago, cuotaExigible))
  const excedente = round2(Math.max(0, montoPago - cuotaAplicada))
  const capitalAmortizado = round2(Math.max(0, excedente - interesDia))
  const saldoNuevo = round2(Math.max(0, saldoActual - capitalAmortizado))

  let tipoPago: AnalisisPago["tipoPago"] = "CUOTA_NORMAL"
  if (montoPago >= saldoActual + interesDia) {
    tipoPago = "CANCELACION_TOTAL"
  } else if (excedente > 0) {
    tipoPago = "ANTICIPADO_PARCIAL"
  }

  return {
    tipoPago,
    diasDevengados,
    interesDia,
    cuotaAplicada,
    excedente,
    capitalAmortizado,
    saldoAnterior: round2(saldoActual),
    saldoNuevo,
    penalidad: 0,
  }
}

export function recalcularCronogramaPorAnticipado(params: {
  modalidad: ModalidadAnticipado
  saldoNuevo: number
  cuotaBaseOriginal: number
  cuotasRestantes: number
  residualFlag: boolean
  residualMonto: number
  temPct: number
  segDesgravamenPct: number
  segVehicularAnual: number
  fechaPrimeraCuotaNueva: Date
  interesesRestantesOriginales: number
}): ResultadoRecalculo {
  const {
    modalidad,
    saldoNuevo,
    cuotaBaseOriginal,
    cuotasRestantes,
    residualFlag,
    residualMonto,
    temPct,
    segDesgravamenPct,
    segVehicularAnual,
    fechaPrimeraCuotaNueva,
    interesesRestantesOriginales,
  } = params

  if (saldoNuevo <= 0) {
    throw new Error("El saldo nuevo debe ser mayor a cero para recalcular")
  }

  const temDecimal = temPct / 100
  const plazoBase = Math.max(1, cuotasRestantes)

  let nuevoPlazoMeses = plazoBase

  if (modalidad === "REDUCIR_PLAZO") {
    let mejorPlazo = plazoBase
    for (let n = 1; n <= plazoBase; n++) {
      const capitalActivoN = residualFlag
        ? calcularCapitalActivo(saldoNuevo, temDecimal, n, true, residualMonto)
        : saldoNuevo

      const cuotaN = calcularCuotaBase(capitalActivoN, temDecimal, n)
      if (cuotaN <= cuotaBaseOriginal + 0.01) {
        mejorPlazo = n
        break
      }
    }
    nuevoPlazoMeses = mejorPlazo
  }

  const capitalActivo = residualFlag
    ? calcularCapitalActivo(saldoNuevo, temDecimal, nuevoPlazoMeses, true, residualMonto)
    : saldoNuevo

  const nuevaCuotaBase = round2(calcularCuotaBase(capitalActivo, temDecimal, nuevoPlazoMeses))

  const cronograma = generarCronograma(
    capitalActivo,
    temDecimal,
    nuevaCuotaBase,
    0,
    false,
    undefined,
    0,
    nuevoPlazoMeses,
    residualFlag,
    residualMonto,
    segDesgravamenPct,
    segVehicularAnual,
    0,
    0,
    fechaPrimeraCuotaNueva
  )

  const tcea = calcularTCEA(saldoNuevo, cronograma, temDecimal)
  const vanDeudor = calcularVAN(saldoNuevo, cronograma, temDecimal)
  let tirMensualPct: number | null = null
  let tirAnualPct: number | null = null
  let tirNoConverge = false

  try {
    const tirMensual = calcularTIR(saldoNuevo, cronograma, temDecimal)
    tirMensualPct = round4(tirMensual * 100)
    tirAnualPct = round4((Math.pow(1 + tirMensual, 12) - 1) * 100)
  } catch {
    tirNoConverge = true
  }

  const totales = calcularTotales(cronograma, saldoNuevo)
  const ahorroIntereses = round2(interesesRestantesOriginales - totales.totalIntereses)

  return {
    modalidad,
    nuevaCuotaBase,
    nuevoPlazoMeses,
    cronograma,
    tcea,
    vanDeudor,
    tirMensualPct,
    tirAnualPct,
    tirNoConverge,
    totalIntereses: totales.totalIntereses,
    totalPagado: totales.totalPagado,
    ahorroIntereses,
    fechaTermino: cronograma[cronograma.length - 1]?.fechaVencimiento ?? fechaPrimeraCuotaNueva,
  }
}
