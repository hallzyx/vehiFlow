/**
 * Motor financiero — Compra Inteligente (método francés vencido ordinario).
 *
 * Pipeline:
 *  TEA → TEM
 *  Préstamo = PV - CI + costos iniciales financiados
 *  Doble cronograma: cuota regular + cuota final (balón)
 *  PMT(TEM + pSegDesPer, …)
 *  TIR / TCEA / VAN(COK)
 */

const DIAS_MES = 30
const DIAS_ANIO = 360
const MAX_ITER = 1000
const TOL = 1e-10

export type TipoTasa = "TEA" | "TNA"
export type Capitalizacion = "DIARIA" | "MENSUAL"
export type PgTipo = "T" | "P" | "S"

export interface CostosIniciales {
  notarial?: number
  registral?: number
  tasacion?: number
  comisionEstudio?: number
  comisionActivacion?: number
}

export interface CostosPeriodicos {
  gpsPer?: number
  portesPer?: number
  gasAdmPer?: number
  /** Tasa de desgravamen por período (decimal, ej. 0.00049) */
  pctSegDesPer?: number
  /** % anual sobre PV para seguro riesgo (decimal, ej. 0.003) */
  pctSegRieAnual?: number
}

export interface ParametrosCredito {
  /** Valor de tasa en % (ej. 15 = 15%). Si tipoTasa=TEA es TEA; si TNA es TNA. */
  tasaIngresada: number
  tipoTasa?: TipoTasa
  capitalizacion?: Capitalizacion | null
  precioVehiculo: number
  cuotaInicial: number
  /** Plazo en meses N (24 o 36 típico Compra Inteligente) */
  plazoMeses: number
  fechaDesembolso: Date
  fechaPrimeraCuota: Date
  /** Meses de gracia total al inicio (PG=T) */
  graciaTotalMeses?: number
  /** Meses de gracia parcial tras la total (PG=P) */
  graciaParcialMeses?: number
  /** Compat: graciaFlag + graciaTipo + graciaMeses */
  graciaFlag?: boolean
  graciaTipo?: "TOTAL" | "PARCIAL"
  graciaMeses?: number
  residualFlag?: boolean
  /** Monto cuota final / balón. Si no se pasa, usa pctCuotaFinal * PV */
  residualMonto?: number
  /** % cuota final sobre PV (0.4 = 40%). Plan 24→0.5, Plan 36→0.4 */
  pctCuotaFinal?: number
  costosIniciales?: CostosIniciales
  costosPeriodicos?: CostosPeriodicos
  /** COK anual decimal (ej. 0.5 = 50%) para VAN */
  cokAnual?: number
  /** Compat legacy: % desgravamen mensual en puntos (0.049 → 0.00049) */
  segDesgravamenPct?: number
  /** Compat legacy: prima anual seguro vehicular (monto) */
  segVehicularAnual?: number
  gastoGps?: number
  gastoNotarial?: number
  frecDias?: number
}

export interface Cuota {
  numero: number
  tipoCuota: "GRACIA_TOTAL" | "GRACIA_PARCIAL" | "NORMAL" | "RESIDUAL"
  pg: PgTipo
  fechaVencimiento: Date
  // Cronograma cuota final (balón)
  saldoIniCF: number
  interesCF: number
  amortCF: number
  segDesCF: number
  saldoFinCF: number
  // Cronograma cuota regular
  saldoInicial: number
  interes: number
  amortizacion: number
  /** Cuota francesa (incluye seg. desgravamen en períodos normales) */
  cuota: number
  segDesgravamen: number
  segVehicular: number
  gps: number
  portes: number
  gasAdm: number
  /** Compat: gps + portes + gasAdm */
  otrosGastos: number
  /** Pago total del período (positivo) */
  cuotaTotal: number
  saldoFinal: number
  /** Flujo del deudor (negativo = egreso) */
  flujo: number
}

export interface ResultadoFinanciero {
  tea: number
  tem: number
  montoFinanciado: number
  cuotaInicial: number
  cuotaFinal: number
  saldoRegular: number
  cuotaBase: number
  cronograma: Cuota[]
  tcea: number
  vanDeudor: number
  tirMensual: number
  tirAnual: number
  cokPeriodico: number
  totalIntereses: number
  totalSeguros: number
  totalGastos: number
  totalPagado: number
  costoCredito: number
  /** Flujos firmados usados en IRR: [+préstamo, …pagos] */
  flujos: number[]
}

function redondear(valor: number, decimales: number): number {
  const factor = Math.pow(10, decimales)
  return Math.round((valor + Number.EPSILON) * factor) / factor
}

function abs(n: number): number {
  return Math.abs(n)
}

/** PMT(rate, nper, pv, 0, 0) — resultado negativo si pv > 0 */
function pmt(rate: number, nper: number, pv: number): number {
  if (nper <= 0) return 0
  if (Math.abs(rate) < TOL) return -pv / nper
  return (-pv * rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1)
}

export function normalizarTasa(teaPorcentaje: number): number {
  if (teaPorcentaje <= 0) throw new Error("La TEA debe ser mayor a cero")
  return teaPorcentaje / 100
}

/**
 * Convierte tasa ingresada a TEA decimal según tipo y capitalización.
 * J4: IF(TNA, (1+Tasa/(NDxA/div))^(NDxA/div)-1, Tasa)
 */
export function calcularTEA(
  tasaIngresadaPct: number,
  tipoTasa: TipoTasa = "TEA",
  capitalizacion: Capitalizacion | null | undefined = null,
  diasAnio: number = DIAS_ANIO
): number {
  const tasa = tasaIngresadaPct / 100
  if (tasa <= 0) throw new Error("La tasa debe ser mayor a cero")

  if (tipoTasa === "TEA") return tasa

  const div = capitalizacion === "MENSUAL" ? DIAS_MES : 1 // Diaria por defecto
  const m = diasAnio / div
  return Math.pow(1 + tasa / m, m) - 1
}

export function calcularTEM(tea: number, frecDias: number = DIAS_MES, diasAnio: number = DIAS_ANIO): number {
  return Math.pow(1 + tea, frecDias / diasAnio) - 1
}

export function calcularCOKi(cokAnual: number, frecDias: number = DIAS_MES, diasAnio: number = DIAS_ANIO): number {
  return Math.pow(1 + cokAnual, frecDias / diasAnio) - 1
}

function sumCostosIniciales(c?: CostosIniciales, legacyNotarial?: number): number {
  const notarial = c?.notarial ?? legacyNotarial ?? 0
  return (
    (notarial || 0) +
    (c?.registral || 0) +
    (c?.tasacion || 0) +
    (c?.comisionEstudio || 0) +
    (c?.comisionActivacion || 0)
  )
}

function resolverGraciaMeses(params: ParametrosCredito): { total: number; parcial: number } {
  if (params.graciaTotalMeses != null || params.graciaParcialMeses != null) {
    return {
      total: Math.max(0, params.graciaTotalMeses || 0),
      parcial: Math.max(0, params.graciaParcialMeses || 0),
    }
  }
  if (!params.graciaFlag || !params.graciaMeses) return { total: 0, parcial: 0 }
  if (params.graciaTipo === "TOTAL") return { total: params.graciaMeses, parcial: 0 }
  if (params.graciaTipo === "PARCIAL") return { total: 0, parcial: params.graciaMeses }
  return { total: 0, parcial: 0 }
}

function pgDePeriodo(k: number, n: number, graciaTotal: number, graciaParcial: number): PgTipo {
  if (k > n) return "S" // período balón
  if (k <= graciaTotal) return "T"
  if (k <= graciaTotal + graciaParcial) return "P"
  return "S"
}

function tipoDesdePg(pg: PgTipo, esBalon: boolean): Cuota["tipoCuota"] {
  if (esBalon) return "RESIDUAL"
  if (pg === "T") return "GRACIA_TOTAL"
  if (pg === "P") return "GRACIA_PARCIAL"
  return "NORMAL"
}

/** Compat: capital activo ≈ saldo a financiar con cuotas (Saldo) */
export function calcularCapitalActivo(
  financiado: number,
  tem: number,
  plazo: number,
  residualFlag: boolean,
  residualMonto?: number,
  pSegDesPer: number = 0
): number {
  if (!residualFlag || !residualMonto || residualMonto <= 0) return financiado
  if (residualMonto >= financiado) throw new Error("Residual no puede superar el financiado")
  const vp = residualMonto / Math.pow(1 + tem + pSegDesPer, plazo + 1)
  const saldo = financiado - vp
  if (saldo <= 0) throw new Error("Capital activo no puede ser negativo")
  return saldo
}

/** Compat: PMT francés puro (sin desgravamen en tasa) */
export function calcularCuotaBase(saldo: number, tem: number, n: number): number {
  if (saldo <= 0 || n <= 0) return 0
  return abs(pmt(tem, n, saldo))
}

export function resolverGracia(
  capitalActivo: number,
  tem: number,
  graciaTipo?: "TOTAL" | "PARCIAL",
  graciaMeses?: number
): { saldoAmortizacion: number; nAmortizacion: number; cuotaGracia: number } {
  if (!graciaMeses || graciaMeses === 0) {
    return { saldoAmortizacion: capitalActivo, nAmortizacion: 0, cuotaGracia: 0 }
  }
  if (graciaTipo === "PARCIAL") {
    return { saldoAmortizacion: capitalActivo, nAmortizacion: 0, cuotaGracia: capitalActivo * tem }
  }
  if (graciaTipo === "TOTAL") {
    return {
      saldoAmortizacion: capitalActivo * Math.pow(1 + tem, graciaMeses),
      nAmortizacion: 0,
      cuotaGracia: 0,
    }
  }
  return { saldoAmortizacion: capitalActivo, nAmortizacion: 0, cuotaGracia: 0 }
}

/**
 * IRR Newton-Raphson sobre flujos firmados (índice 0 = t0).
 * Retorna tasa periódica.
 */
export function calcularIRR(flujos: number[], semilla = 0.01): number {
  let r = semilla
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let f = 0
    let fp = 0
    for (let t = 0; t < flujos.length; t++) {
      const den = Math.pow(1 + r, t)
      f += flujos[t] / den
      if (t > 0) fp -= (t * flujos[t]) / Math.pow(1 + r, t + 1)
    }
    if (Math.abs(fp) < TOL) break
    const rNuevo = r - f / fp
    if (Math.abs(rNuevo - r) < TOL) return rNuevo
    if (rNuevo <= -0.9999) throw new Error("TIR inválida")
    r = rNuevo
  }
  return r
}

export function calcularTCEADesdeFlujos(flujos: number[], frecDias = DIAS_MES, diasAnio = DIAS_ANIO): number {
  const tir = calcularIRR(flujos)
  const tcea = Math.pow(1 + tir, diasAnio / frecDias) - 1
  return redondear(tcea * 100, 4)
}

/** VAN: Prestamo + NPV(COKi, Flujo_1..n) */
export function calcularVANConCOK(prestamo: number, flujosPeriodicos: number[], cokPeriodico: number): number {
  let npv = 0
  for (let i = 0; i < flujosPeriodicos.length; i++) {
    npv += flujosPeriodicos[i] / Math.pow(1 + cokPeriodico, i + 1)
  }
  return redondear(prestamo + npv, 2)
}

/** Compat legacy firmas usadas por pago-anticipado */
export function calcularTCEA(montoFinanciado: number, cronograma: Cuota[], semillaMensual: number): number {
  const flujos = [montoFinanciado, ...cronograma.map((c) => -abs(c.cuotaTotal))]
  void semillaMensual
  return calcularTCEADesdeFlujos(flujos)
}

export function calcularVAN(montoFinanciado: number, cronograma: Cuota[], tem: number): number {
  const flujos = cronograma.map((c) => -abs(c.cuotaTotal))
  return calcularVANConCOK(montoFinanciado, flujos, tem)
}

export function calcularTIR(montoFinanciado: number, cronograma: Cuota[], semillaMensual: number): number {
  const flujos = [montoFinanciado, ...cronograma.map((c) => -abs(c.cuotaTotal))]
  return calcularIRR(flujos, semillaMensual)
}

export function calcularTotales(cronograma: Cuota[], montoFinanciado: number) {
  let totalIntereses = 0
  let totalSeguros = 0
  let totalGastos = 0
  let totalPagado = 0
  for (const c of cronograma) {
    totalIntereses += abs(c.interes) + abs(c.interesCF)
    totalSeguros += abs(c.segDesgravamen) + abs(c.segDesCF) + abs(c.segVehicular)
    totalGastos += abs(c.gps) + abs(c.portes) + abs(c.gasAdm)
    totalPagado += abs(c.cuotaTotal)
  }
  return {
    totalIntereses: redondear(totalIntereses, 2),
    totalSeguros: redondear(totalSeguros, 2),
    totalGastos: redondear(totalGastos, 2),
    totalPagado: redondear(totalPagado, 2),
    costoCredito: redondear(totalPagado - montoFinanciado, 2),
  }
}

/**
 * Genera cronograma IB a partir de saldo regular ya calculado.
 * Usado por pago anticipado / recalculos parciales.
 */
export function generarCronograma(
  capitalActivo: number,
  tem: number,
  _cuotaBase: number,
  _cuotaGracia: number,
  graciaFlag: boolean,
  graciaTipo: "TOTAL" | "PARCIAL" | undefined,
  graciaMeses: number,
  nAmortizacion: number,
  residualFlag: boolean,
  residualMonto: number,
  segDesgravPct: number,
  segVehicularAnual: number,
  gastoGps: number,
  _gastoNotarial: number,
  fechaPrimeraCuota: Date,
  extras?: {
    pSegDesPer?: number
    portesPer?: number
    gasAdmPer?: number
    segRiePer?: number
    frecDias?: number
  }
): Cuota[] {
  const frec = extras?.frecDias ?? DIAS_MES
  const pSegDesPer = extras?.pSegDesPer ?? (segDesgravPct || 0) / 100
  const gpsPer = gastoGps || 0
  const portesPer = extras?.portesPer ?? 0
  const gasAdmPer = extras?.gasAdmPer ?? 0
  const segRiePer =
    extras?.segRiePer ?? (segVehicularAnual ? segVehicularAnual / (DIAS_ANIO / frec) : 0)

  let graciaTotal = 0
  let graciaParcial = 0
  if (graciaFlag && graciaMeses > 0) {
    if (graciaTipo === "TOTAL") graciaTotal = graciaMeses
    else if (graciaTipo === "PARCIAL") graciaParcial = graciaMeses
  }

  const n = nAmortizacion
  const residualActivo = residualFlag && residualMonto > 0
  const periodos = residualActivo ? n + 1 : n

  let sicf = residualActivo ? residualMonto / Math.pow(1 + tem + pSegDesPer, n + 1) : 0
  let si = capitalActivo
  const cronograma: Cuota[] = []

  for (let k = 1; k <= periodos; k++) {
    const esBalon = residualActivo && k === n + 1
    const pg = pgDePeriodo(k, n, graciaTotal, graciaParcial)

    const interesCF = residualActivo ? -sicf * tem : 0
    const segDesCF = residualActivo ? -sicf * pSegDesPer : 0
    const amortCF = esBalon && residualActivo ? -sicf + interesCF + segDesCF : 0
    const saldoFinCF = residualActivo ? sicf - interesCF - segDesCF + amortCF : 0

    const interes = !esBalon ? -si * tem : 0
    const segDes = !esBalon ? -si * pSegDesPer : 0
    let cuota = 0
    let amort = 0
    if (!esBalon) {
      if (pg === "T") {
        cuota = 0
        amort = 0
      } else if (pg === "P") {
        cuota = interes
        amort = 0
      } else {
        cuota = pmt(tem + pSegDesPer, n - k + 1, si)
        amort = cuota - interes - segDes
      }
    }

    const segRie = -segRiePer
    const gps = -gpsPer
    const portes = -portesPer
    const gasAdm = -gasAdmPer

    let saldoFin: number
    if (esBalon) saldoFin = 0
    else if (pg === "T") saldoFin = si - interes
    else saldoFin = si + amort

    const flujo =
      cuota + segRie + gps + portes + gasAdm + (pg === "T" || pg === "P" ? segDes : 0) + (esBalon ? amortCF : 0)

    const fechaVenc = new Date(fechaPrimeraCuota)
    fechaVenc.setDate(fechaVenc.getDate() + (k - 1) * frec)

    cronograma.push({
      numero: k,
      tipoCuota: tipoDesdePg(pg, esBalon),
      pg,
      fechaVencimiento: fechaVenc,
      saldoIniCF: sicf,
      interesCF,
      amortCF,
      segDesCF,
      saldoFinCF: Math.max(0, saldoFinCF),
      saldoInicial: si,
      interes,
      amortizacion: amort,
      cuota,
      segDesgravamen: segDes,
      segVehicular: segRie,
      gps,
      portes,
      gasAdm,
      otrosGastos: abs(gps) + abs(portes) + abs(gasAdm),
      cuotaTotal: abs(flujo),
      saldoFinal: Math.max(0, saldoFin),
      flujo,
    })

    sicf = saldoFinCF
    si = Math.max(0, saldoFin)
  }

  return cronograma
}

export function calcularCredito(params: ParametrosCredito): ResultadoFinanciero {
  const frec = params.frecDias ?? DIAS_MES
  const tipoTasa = params.tipoTasa ?? "TEA"
  const capitalizacion = params.capitalizacion ?? (tipoTasa === "TNA" ? "DIARIA" : null)

  const tea = calcularTEA(params.tasaIngresada, tipoTasa, capitalizacion)
  const tem = calcularTEM(tea, frec)
  const cokAnual = params.cokAnual ?? 0
  const cokPeriodico = cokAnual > 0 ? calcularCOKi(cokAnual, frec) : tem

  const pv = params.precioVehiculo
  const ci = params.cuotaInicial
  const n = params.plazoMeses
  if (n <= 0) throw new Error("Plazo inválido")
  if (ci < 0 || ci >= pv) throw new Error("Cuota inicial inválida")

  const costosIni = sumCostosIniciales(params.costosIniciales, params.gastoNotarial)
  const prestamo = pv - ci + costosIni
  if (prestamo <= 0) throw new Error("El monto financiado debe ser mayor a cero")

  const pctCF =
    params.pctCuotaFinal ??
    (params.residualFlag === false
      ? 0
      : params.residualMonto != null && params.residualMonto > 0
        ? params.residualMonto / pv
        : n <= 24
          ? 0.5
          : 0.4)

  const residualActivo = params.residualFlag !== false && pctCF > 0
  const cuotaFinal = residualActivo ? (params.residualMonto && params.residualMonto > 0 ? params.residualMonto : pctCF * pv) : 0

  const cp = params.costosPeriodicos ?? {}
  const pSegDesPer =
    cp.pctSegDesPer ??
    (params.segDesgravamenPct != null ? params.segDesgravamenPct / 100 : 0)
  const gpsPer = cp.gpsPer ?? params.gastoGps ?? 0
  const portesPer = cp.portesPer ?? 0
  const gasAdmPer = cp.gasAdmPer ?? 0
  const nCxA = DIAS_ANIO / frec
  const segRiePer =
    cp.pctSegRieAnual != null
      ? (cp.pctSegRieAnual * pv) / nCxA
      : params.segVehicularAnual != null
        ? params.segVehicularAnual / nCxA
        : 0

  const { total: graciaTotal, parcial: graciaParcial } = resolverGraciaMeses(params)

  // Saldo = Prestamo - CF/(1+TEM+pSegDes)^(N+1)
  const saldoRegular = residualActivo
    ? prestamo - cuotaFinal / Math.pow(1 + tem + pSegDesPer, n + 1)
    : prestamo

  const periodos = residualActivo ? n + 1 : n
  const cronograma: Cuota[] = []
  const flujosPeriodicos: number[] = []

  let sicf = residualActivo ? cuotaFinal / Math.pow(1 + tem + pSegDesPer, n + 1) : 0
  let si = saldoRegular

  for (let k = 1; k <= periodos; k++) {
    const esBalon = residualActivo && k === n + 1
    const pg = pgDePeriodo(k, n, graciaTotal, graciaParcial)

    // --- Cuota final track ---
    const interesCF = residualActivo ? -sicf * tem : 0
    const segDesCF = residualActivo ? -sicf * pSegDesPer : 0
    let amortCF = 0
    if (esBalon && residualActivo) {
      amortCF = -sicf + interesCF + segDesCF // -SICF+ICF+SegDesCF (liquida)
      // Wait: E = IF(NC=N+1, -SICF+ICF+SegDesCF, 0)
      // ICF and SegDesCF are already negative, so -SICF + (neg) + (neg) = -(SICF+|I|+|Seg|)
      // Actually at balón they amortize the full remaining CF balance including accrued.
      // G = SICF - ICF - SegDesCF + ACF → 0 when ACF = -SICF+ICF+SegDesCF
      amortCF = -sicf + interesCF + segDesCF
    }
    const saldoFinCF = residualActivo ? sicf - interesCF - segDesCF + amortCF : 0

    // --- Cuota regular track ---
    const interes = !esBalon ? -si * tem : 0
    const segDes = !esBalon ? -si * pSegDesPer : 0

    let cuota = 0
    let amort = 0
    if (!esBalon) {
      if (pg === "T") {
        cuota = 0
        amort = 0
      } else if (pg === "P") {
        cuota = interes // solo interés (negativo)
        amort = 0
      } else {
        // PMT(TEM+pSegDesPer, N-NC+1, SI)
        const remaining = n - k + 1
        cuota = pmt(tem + pSegDesPer, remaining, si)
        amort = cuota - interes - segDes
      }
    }

    const segRie = -segRiePer
    const gps = -gpsPer
    const portes = -portesPer
    const gasAdm = -gasAdmPer

    // Saldo final regular: Q = IF(PG="T", SI-I, SI+A)
    // I and A are signed (I neg, A typically neg for amortization of principal... wait)
    // K (A) = Cuota - I - SegDes. Cuota is neg, I is neg, SegDes is neg.
    // A = neg - neg - neg = neg - (neg) = could be negative meaning principal reduction
    // Q = SI + A when not T. Since A is negative, SI decreases.
    // For T: Q = SI - I. I is negative, so SI - (neg) = SI + |I| (capitaliza)
    let saldoFin: number
    if (esBalon) {
      saldoFin = 0
    } else if (pg === "T") {
      saldoFin = si - interes // capitaliza
    } else {
      saldoFin = si + amort
    }

    // Flujo R:
    // Cuota+SegRie+GPS+Portes+GasAdm+IF(OR(T,P),SegDes,0)+IF(NC=N+1,ACF,0)
    let flujo =
      cuota + segRie + gps + portes + gasAdm + (pg === "T" || pg === "P" ? segDes : 0) + (esBalon ? amortCF : 0)

    // En balón también se pagan costos periódicos (M/N/O/P hasta N+1)
    // ya incluidos arriba.

    const cuotaTotal = abs(flujo)
    const otrosGastos = abs(gps) + abs(portes) + abs(gasAdm)

    const fechaVenc = new Date(params.fechaPrimeraCuota)
    fechaVenc.setDate(fechaVenc.getDate() + (k - 1) * frec)

    cronograma.push({
      numero: k,
      tipoCuota: tipoDesdePg(pg, esBalon),
      pg,
      fechaVencimiento: fechaVenc,
      saldoIniCF: redondear(sicf, 10),
      interesCF: redondear(interesCF, 10),
      amortCF: redondear(amortCF, 10),
      segDesCF: redondear(segDesCF, 10),
      saldoFinCF: redondear(Math.max(0, saldoFinCF), 10),
      saldoInicial: redondear(si, 10),
      interes: redondear(interes, 10),
      amortizacion: redondear(amort, 10),
      cuota: redondear(cuota, 10),
      segDesgravamen: redondear(segDes, 10),
      segVehicular: redondear(segRie, 10),
      gps: redondear(gps, 10),
      portes: redondear(portes, 10),
      gasAdm: redondear(gasAdm, 10),
      otrosGastos: redondear(otrosGastos, 2),
      cuotaTotal: redondear(cuotaTotal, 2),
      saldoFinal: redondear(Math.max(0, saldoFin), 10),
      flujo: redondear(flujo, 10),
    })

    flujosPeriodicos.push(flujo)
    sicf = saldoFinCF
    si = Math.max(0, saldoFin)
  }

  const flujos = [prestamo, ...flujosPeriodicos]
  const tirMensual = calcularIRR(flujos)
  const tirAnual = Math.pow(1 + tirMensual, DIAS_ANIO / frec) - 1
  const tcea = redondear(tirAnual * 100, 4)
  const vanDeudor = calcularVANConCOK(prestamo, flujosPeriodicos, cokPeriodico)
  const totales = calcularTotales(cronograma, prestamo)

  // Cuota base referencial: primera cuota normal (S) en valor absoluto
  const primeraNormal = cronograma.find((c) => c.pg === "S" && c.tipoCuota === "NORMAL")
  const cuotaBase = primeraNormal ? abs(primeraNormal.cuota) : 0

  return {
    tea: redondear(tea * 100, 6),
    tem: redondear(tem * 100, 8),
    montoFinanciado: redondear(prestamo, 2),
    cuotaInicial: redondear(ci, 2),
    cuotaFinal: redondear(cuotaFinal, 2),
    saldoRegular: redondear(saldoRegular, 6),
    cuotaBase: redondear(cuotaBase, 2),
    cronograma,
    tcea,
    vanDeudor,
    tirMensual: redondear(tirMensual * 100, 6),
    tirAnual: redondear(tirAnual * 100, 4),
    cokPeriodico: redondear(cokPeriodico * 100, 6),
    totalIntereses: totales.totalIntereses,
    totalSeguros: totales.totalSeguros,
    totalGastos: totales.totalGastos,
    totalPagado: totales.totalPagado,
    costoCredito: totales.costoCredito,
    flujos,
  }
}
