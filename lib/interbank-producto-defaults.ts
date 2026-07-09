/**
 * Parámetros de producto / tarifario — Compra Inteligente Interbank (demo).
 *
 * Alineado a prácticas públicas de crédito vehicular Compra Inteligente:
 * - Cuota inicial típica ≥ 20%
 * - Cuota final / balón (Plan 24 ≈ 50%, Plan 36 ≈ 40% del PV)
 * - Ingreso mínimo referencial ~ S/ 1,500
 *
 * Estos valores NO los “elige” el cliente en ventanilla: los carga el sistema
 * de la entidad (asesor). El COK es la tasa de descuento del VAN del deudor
 * (enunciado SI642); default de mercado ~8%.
 */

/** TEA de referencia para demo Plan 36 Compra Inteligente. */
export const INTERBANK_TEA_PLAN36 = 16.17979460574055

/**
 * COK por defecto en formulario / demo: ~8% anual.
 * Referencia de costo de oportunidad del deudor (depósitos / inversiones accesibles en Perú).
 * No es un dato que se le pregunta al cliente en ventanilla; lo fija el asesor para el VAN.
 */
export const COK_DEFAULT_MERCADO = 0.08

export const interbankProductoDefaults = {
  /** TEA % — tarifario / evaluación (demo Plan 36) */
  tasaIngresada: INTERBANK_TEA_PLAN36,
  tipoTasa: "TEA" as const,
  capitalizacion: null as null,

  /** Compra Inteligente: residual / balón */
  residualFlag: true,
  /** Plan 36 → 40% del PV. Plan 24 → 50%. */
  pctCuotaFinal: 0.4,
  residualMonto: 0,

  /** Seguro desgravamen periódico sobre saldo */
  segDesgrav: 0.00049,
  /** % anual seguro de riesgo / vehicular sobre PV → prima / 12 */
  pctSegRie: 0.003,
  segVehicular: 0,

  /** Gastos periódicos típicos del producto (S/) */
  gastoGps: 20,
  portesPer: 3.5,
  gasAdmPer: 3.5,

  /** Costos iniciales financiables */
  gastoNotarial: 100,
  costeRegistral: 75,
  costeTasacion: 0,
  /** Cargos tipo evaluación/desembolso: 0 (alineado a SBS) */
  comisionEstudio: 0,
  comisionActivacion: 0,

  /** Tasa de descuento del VAN del deudor (default mercado). */
  cokAnual: COK_DEFAULT_MERCADO,
} as const

/** Defaults de negociación típicos Interbank Compra Inteligente (cliente + producto). */
export const interbankOperacionDemo = {
  monedaOp: "PEN" as const,
  precioVehiculo: 80_000,
  cuotaIniPct: 20,
  plazoMeses: 36,
  graciaTotalMeses: 0,
  graciaParcialMeses: 0,
  concesionario: "Concesionario afiliado Interbank — Toyota del Perú (Surco)",
  marca: "Toyota",
  modelo: "Corolla Cross",
  version: "SEG 1.8 CVT",
  /** Ingreso neto demo > mínimo referencial Interbank (~S/ 1,500) */
  ingresosMens: 6_500,
}

export function pctCuotaFinalInterbank(plazoMeses: number): number | null {
  if (plazoMeses === 24) return 0.5
  if (plazoMeses === 36) return 0.4
  return null
}
