import { describe, expect, it } from "vitest"
import { calcularCredito, calcularTEA, calcularTEM } from "./motor-financiero"

/**
 * Golden values — Plan 36 Compra Inteligente
 * (doble cronograma, gracia 3T+3P, cuota final 40%)
 */
const GOLDEN = {
  pv: 16000,
  pCI: 0.2,
  pCF: 0.4,
  tasaTNA: 15, // %
  tea: 0.1617979460574055,
  tem: 0.012575815353265574,
  prestamo: 12975,
  saldo: 9015.99070298918,
  cuotaRegularAbs: 379.15843387799924,
  tcea: 0.207856362664806,
  van: 4436.183165604902,
  tirMensual: 0.01586174852778721,
  notarial: 100,
  registral: 75,
  gpsPer: 20,
  portesPer: 3.5,
  gasAdmPer: 3.5,
  pSegDes: 0.00049,
  pSegRie: 0.003,
  cok: 0.5,
  graciaTotal: 3,
  graciaParcial: 3,
}

describe("Motor — conversión de tasas", () => {
  it("TNA 15% diaria → TEA", () => {
    const tea = calcularTEA(GOLDEN.tasaTNA, "TNA", "DIARIA")
    expect(tea).toBeCloseTo(GOLDEN.tea, 12)
  })

  it("TEM desde TEA", () => {
    const tem = calcularTEM(GOLDEN.tea)
    expect(tem).toBeCloseTo(GOLDEN.tem, 12)
  })
})

describe("Motor — golden Plan 36", () => {
  const r = calcularCredito({
    tasaIngresada: GOLDEN.tasaTNA,
    tipoTasa: "TNA",
    capitalizacion: "DIARIA",
    precioVehiculo: GOLDEN.pv,
    cuotaInicial: GOLDEN.pv * GOLDEN.pCI,
    plazoMeses: 36,
    fechaDesembolso: new Date("2026-01-01"),
    fechaPrimeraCuota: new Date("2026-02-01"),
    graciaTotalMeses: GOLDEN.graciaTotal,
    graciaParcialMeses: GOLDEN.graciaParcial,
    residualFlag: true,
    pctCuotaFinal: GOLDEN.pCF,
    costosIniciales: {
      notarial: GOLDEN.notarial,
      registral: GOLDEN.registral,
    },
    costosPeriodicos: {
      gpsPer: GOLDEN.gpsPer,
      portesPer: GOLDEN.portesPer,
      gasAdmPer: GOLDEN.gasAdmPer,
      pctSegDesPer: GOLDEN.pSegDes,
      pctSegRieAnual: GOLDEN.pSegRie,
    },
    cokAnual: GOLDEN.cok,
  })

  it("préstamo = PV - CI + costos iniciales", () => {
    expect(r.montoFinanciado).toBeCloseTo(GOLDEN.prestamo, 2)
  })

  it("cuota final 40% PV", () => {
    expect(r.cuotaFinal).toBeCloseTo(6400, 2)
  })

  it("saldo regular tras separar cuota final", () => {
    expect(r.saldoRegular).toBeCloseTo(GOLDEN.saldo, 4)
  })

  it("cronograma tiene N+1 = 37 períodos", () => {
    expect(r.cronograma).toHaveLength(37)
  })

  it("patrón gracia 3T + 3P + 31S", () => {
    const pgs = r.cronograma.map((c) => c.pg).join("")
    expect(pgs).toBe("TTT" + "PPP" + "S".repeat(31))
  })

  it("cuota regular período 7", () => {
    const c7 = r.cronograma[6]
    expect(Math.abs(c7.cuota)).toBeCloseTo(GOLDEN.cuotaRegularAbs, 4)
  })

  it("TCEA ≈ 20.7856%", () => {
    expect(r.tcea / 100).toBeCloseTo(GOLDEN.tcea, 5)
  })

  it("TIR mensual", () => {
    expect(r.tirMensual / 100).toBeCloseTo(GOLDEN.tirMensual, 5)
  })

  it("VAN con COK 50%", () => {
    expect(r.vanDeudor).toBeCloseTo(GOLDEN.van, 1)
  })

  it("saldo final regular cierra ~0 en período 36", () => {
    expect(r.cronograma[35].saldoFinal).toBeCloseTo(0, 4)
  })

  it("balón período 37 liquida cuota final", () => {
    const balon = r.cronograma[36]
    expect(balon.tipoCuota).toBe("RESIDUAL")
    expect(Math.abs(balon.amortCF)).toBeCloseTo(6400, 1)
    expect(balon.saldoFinCF).toBeCloseTo(0, 4)
  })
})

describe("Enunciado — TEA directa Plan 24 sin gracia", () => {
  const r = calcularCredito({
    tasaIngresada: 18,
    tipoTasa: "TEA",
    precioVehiculo: 50000,
    cuotaInicial: 50000 * 0.2,
    plazoMeses: 24,
    fechaDesembolso: new Date("2026-01-01"),
    fechaPrimeraCuota: new Date("2026-02-01"),
    graciaTotalMeses: 0,
    graciaParcialMeses: 0,
    residualFlag: true,
    pctCuotaFinal: 0.5,
    costosIniciales: {
      notarial: 0,
      registral: 0,
    },
    costosPeriodicos: {
      gpsPer: 0,
      portesPer: 0,
      gasAdmPer: 0,
      pctSegDesPer: 0,
      pctSegRieAnual: 0,
    },
    cokAnual: 0.4,
  })

  it("cronograma tiene N+1 = 25 períodos", () => {
    expect(r.cronograma).toHaveLength(25)
  })

  it("TEA ≈ 18%", () => {
    expect(r.tea).toBeCloseTo(18, 4)
  })

  it("TCEA >= TEA", () => {
    expect(r.tcea).toBeGreaterThanOrEqual(r.tea)
  })

  it("saldo final regular cierra ~0 en período 24", () => {
    expect(r.cronograma[23].saldoFinal).toBeCloseTo(0, 4)
  })
})
