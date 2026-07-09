import type { Cuota, ParametrosCredito, TipoTasa, Capitalizacion } from "@/lib/motor-financiero"

/** Params del formulario / API → ParametrosCredito del motor IB */
export function buildParametrosCredito(p: {
  tasaIngresada: number
  tipoTasa?: string
  capitalizacion?: string | null
  precioVehiculo: number
  cuotaIniMnt: number
  plazoMeses: number
  fecDesembolso: string | Date
  fec1eraCuota: string | Date
  graciaFlag?: boolean
  graciaTipo?: "TOTAL" | "PARCIAL"
  graciaMeses?: number
  graciaTotalMeses?: number
  graciaParcialMeses?: number
  residualFlag?: boolean
  residualMonto?: number
  pctCuotaFinal?: number
  segDesgrav?: number
  segVehicular?: number
  gastoGps?: number
  gastoNotarial?: number
  costeRegistral?: number
  costeTasacion?: number
  comisionEstudio?: number
  comisionActivacion?: number
  portesPer?: number
  gasAdmPer?: number
  pctSegRie?: number
  cokAnual?: number
}): ParametrosCredito {
  // UI del curso: solo TEA. Si llega TNA (datos legacy), se convierte.
  const tipoTasa = (p.tipoTasa === "TNA" ? "TNA" : "TEA") as TipoTasa
  const capitalizacion =
    tipoTasa === "TNA"
      ? p.capitalizacion === "MENSUAL"
        ? ("MENSUAL" as Capitalizacion)
        : ("DIARIA" as Capitalizacion)
      : null

  // segDesgrav en UI: si > 1 asumir puntos porcentuales (0.049), si <= 1 asumir ya decimal periódico
  const pctSegDesPer =
    p.segDesgrav == null
      ? undefined
      : p.segDesgrav > 1
        ? p.segDesgrav / 100
        : p.segDesgrav > 0.01
          ? p.segDesgrav / 100
          : p.segDesgrav

  return {
    tasaIngresada: p.tasaIngresada,
    tipoTasa,
    capitalizacion,
    precioVehiculo: p.precioVehiculo,
    cuotaInicial: p.cuotaIniMnt,
    plazoMeses: p.plazoMeses,
    fechaDesembolso: new Date(p.fecDesembolso),
    fechaPrimeraCuota: new Date(p.fec1eraCuota),
    graciaFlag: p.graciaFlag,
    graciaTipo: p.graciaTipo,
    graciaMeses: p.graciaMeses,
    graciaTotalMeses: p.graciaTotalMeses,
    graciaParcialMeses: p.graciaParcialMeses,
    residualFlag: p.residualFlag ?? true,
    residualMonto: p.residualMonto,
    pctCuotaFinal: p.pctCuotaFinal,
    costosIniciales: {
      notarial: p.gastoNotarial,
      registral: p.costeRegistral,
      tasacion: p.costeTasacion,
      comisionEstudio: p.comisionEstudio,
      comisionActivacion: p.comisionActivacion,
    },
    costosPeriodicos: {
      gpsPer: p.gastoGps,
      portesPer: p.portesPer,
      gasAdmPer: p.gasAdmPer,
      pctSegDesPer,
      pctSegRieAnual: p.pctSegRie,
    },
    cokAnual: p.cokAnual != null ? (p.cokAnual > 1 ? p.cokAnual / 100 : p.cokAnual) : undefined,
    segDesgravamenPct: p.segDesgrav,
    segVehicularAnual: p.segVehicular,
    gastoGps: p.gastoGps,
    gastoNotarial: p.gastoNotarial,
  }
}

export function mapCuotaToPrisma(q: Cuota, idCotizacion: bigint) {
  const abs = (n: number) => Math.abs(n)
  return {
    idCotizacion,
    numero: q.numero,
    tipoCuota: q.tipoCuota,
    pg: q.pg,
    fecVencimiento: q.fechaVencimiento,
    saldoIniCF: abs(q.saldoIniCF),
    interesCF: abs(q.interesCF),
    amortCF: abs(q.amortCF),
    segDesCF: abs(q.segDesCF),
    saldoFinCF: abs(q.saldoFinCF),
    saldoInicial: abs(q.saldoInicial),
    interes: abs(q.interes),
    amortizacion: abs(q.amortizacion),
    cuota: abs(q.cuota),
    segDesgravamen: abs(q.segDesgravamen),
    segVehicular: abs(q.segVehicular),
    gps: abs(q.gps),
    portes: abs(q.portes),
    gasAdm: abs(q.gasAdm),
    otrosGastos: abs(q.otrosGastos),
    cuotaTotal: abs(q.cuotaTotal),
    saldoFinal: abs(q.saldoFinal),
    flujo: q.flujo,
  }
}
