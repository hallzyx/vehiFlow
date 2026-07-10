import { describe, expect, it } from "vitest"
import {
  analizarPagoExtraordinario,
  construirComparativa,
  recalcularCronogramaPorAnticipado,
  resolverContextoOperacion,
  type CuotaOperacionLike,
} from "./pago-anticipado"

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Cronograma sintético sin residual: 6 cuotas francesas simplificadas. */
function cuotasSinResidual(): CuotaOperacionLike[] {
  const tem = 0.01257581535
  let saldo = 10000
  const cuota = 1750
  const rows: CuotaOperacionLike[] = []
  const base = new Date("2026-08-08")

  for (let i = 1; i <= 6; i++) {
    const interes = round2(saldo * tem)
    const amort = round2(Math.min(cuota - interes, saldo))
    const cuotaTotal = round2(interes + amort)
    const saldoFinal = round2(Math.max(0, saldo - amort))
    const fec = new Date(base)
    fec.setMonth(fec.getMonth() + (i - 1))
    rows.push({
      numero: i,
      tipoCuota: "NORMAL",
      fecVencimiento: fec,
      saldoInicial: round2(saldo),
      interes,
      amortizacion: amort,
      segDesgravamen: 0,
      segVehicular: 0,
      otrosGastos: 0,
      cuotaTotal,
      saldoFinal,
    })
    saldo = saldoFinal
  }
  return rows
}

describe("analizarPagoExtraordinario", () => {
  it("desglosa cuota + excedente y deja penalidad en 0", () => {
    const a = analizarPagoExtraordinario({
      saldoActual: 10000,
      cuotaExigible: 1750,
      temPct: 1.257581535,
      fechaUltimaCuota: new Date("2026-07-10"),
      fechaPago: new Date("2026-07-10"),
      montoPago: 5000,
    })
    expect(a.tipoPago).toBe("ANTICIPADO_PARCIAL")
    expect(a.cuotaAplicada).toBe(1750)
    expect(a.excedente).toBe(3250)
    expect(a.capitalAmortizado).toBe(3250)
    expect(a.saldoNuevo).toBe(6750)
    expect(a.penalidad).toBe(0)
    expect(a.interesDia).toBe(0)
  })
})

describe("construirComparativa + recalculo", () => {
  const cuotas = cuotasSinResidual()
  const saldoActual = cuotas[0].saldoInicial
  const ctx = resolverContextoOperacion(cuotas, saldoActual)
  const montoPago = 5000
  const fechaPago = new Date("2026-07-10")

  const analisis = analizarPagoExtraordinario({
    saldoActual,
    cuotaExigible: ctx.cuotaExigible,
    temPct: 1.257581535,
    fechaUltimaCuota: ctx.fechaUltimaCuota,
    fechaPago,
    montoPago,
  })

  const cuotaBaseOriginal = round2(
    Math.abs(ctx.cuotaReferencia.interes) + Math.abs(ctx.cuotaReferencia.amortizacion)
  )

  it("REDUCIR_PLAZO: acorta plazo, ahorro = intereses antes − después", () => {
    const r = recalcularCronogramaPorAnticipado({
      modalidad: "REDUCIR_PLAZO",
      saldoNuevo: analisis.saldoNuevo,
      cuotaBaseOriginal,
      cuotasRestantes: ctx.cuotasRestantes,
      residualFlag: false,
      residualMonto: 0,
      temPct: 1.257581535,
      segDesgravamenPct: 0,
      segVehicularAnual: 0,
      fechaPrimeraCuotaNueva: new Date("2026-08-09"),
      interesesRestantesOriginales: ctx.interesesRestantes,
    })

    const comp = construirComparativa({ analisis, contexto: ctx, resultado: r })

    expect(comp.saldoAntes).toBe(analisis.saldoAnterior)
    expect(comp.saldoDespues).toBe(analisis.saldoNuevo)
    expect(comp.saldoDespues).toBeLessThan(comp.saldoAntes)
    expect(comp.cuotasDespues).toBeLessThanOrEqual(comp.cuotasAntes)
    expect(comp.cuotaMensualDespues).toBeLessThanOrEqual(comp.cuotaMensualAntes + 0.02)
    expect(comp.ahorroIntereses).toBe(
      round2(comp.interesResidualAntes - comp.interesResidualDespues)
    )
    expect(comp.ahorroIntereses).toBeGreaterThan(0)
    expect(r.nuevoPlazoMeses).toBe(comp.cuotasDespues)
  })

  it("REDUCIR_CUOTA: mantiene plazo y baja la cuota; ahorro positivo", () => {
    const r = recalcularCronogramaPorAnticipado({
      modalidad: "REDUCIR_CUOTA",
      saldoNuevo: analisis.saldoNuevo,
      cuotaBaseOriginal,
      cuotasRestantes: ctx.cuotasRestantes,
      residualFlag: false,
      residualMonto: 0,
      temPct: 1.257581535,
      segDesgravamenPct: 0,
      segVehicularAnual: 0,
      fechaPrimeraCuotaNueva: new Date("2026-08-09"),
      interesesRestantesOriginales: ctx.interesesRestantes,
    })

    const comp = construirComparativa({ analisis, contexto: ctx, resultado: r })

    expect(comp.cuotasDespues).toBe(comp.cuotasAntes)
    expect(comp.cuotaMensualDespues).toBeLessThan(comp.cuotaMensualAntes)
    expect(comp.ahorroIntereses).toBe(
      round2(comp.interesResidualAntes - comp.interesResidualDespues)
    )
    expect(comp.ahorroIntereses).toBeGreaterThan(0)
  })

  it("con residual Compra Inteligente: ahorro no usa interesCF", () => {
    const temPct = 1.257581535
    const tem = temPct / 100
    const saldo = 48794.92
    const residual = 35196
    // Intereses regulares restantes simulados (sin CF)
    const interesesReg = 12208.78

    const analisisCI = analizarPagoExtraordinario({
      saldoActual: saldo,
      cuotaExigible: 1756.76,
      temPct,
      fechaUltimaCuota: new Date("2026-07-10"),
      fechaPago: new Date("2026-07-10"),
      montoPago: 10000,
    })
    expect(analisisCI.saldoNuevo).toBe(40551.68)

    const r = recalcularCronogramaPorAnticipado({
      modalidad: "REDUCIR_CUOTA",
      saldoNuevo: analisisCI.saldoNuevo,
      cuotaBaseOriginal: 1683.85,
      cuotasRestantes: 36,
      residualFlag: true,
      residualMonto: residual,
      temPct,
      segDesgravamenPct: 0,
      segVehicularAnual: 0,
      fechaPrimeraCuotaNueva: new Date("2026-08-09"),
      interesesRestantesOriginales: interesesReg,
    })

    // Ahorro debe ser positivo (bug histórico: interesCF lo volvía negativo)
    expect(r.ahorroIntereses).toBeGreaterThan(0)
    expect(r.totalIntereses).toBeLessThan(interesesReg)
    expect(r.nuevoPlazoMeses).toBe(36)
    expect(r.nuevaCuotaBase).toBeLessThan(1683.85)

    // TEM sanity: interés 1er mes ≈ capitalActivo * TEM
    const q1 = r.cronograma.find((c) => c.tipoCuota === "NORMAL")!
    expect(Math.abs(q1.interes)).toBeCloseTo(q1.saldoInicial * tem, 1)
  })
})
