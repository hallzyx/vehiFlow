export type HelpFieldContent = {
  title: string
  definition: string
  formula?: string
  example?: string
  normativa?: string
  sectionSlug: string
}

export const ayudaCamposCotizacion: Record<string, HelpFieldContent> = {
  tipoTasa: {
    title: "Tipo de tasa",
    definition:
      "La tasa puede ser efectiva (TEA) o nominal (TNA). Si es nominal, debe indicarse la capitalización para convertirla correctamente.",
    formula: "TEA = (1 + TNA/m)^m - 1",
    example: "TNA 18% capitalizable mensual (m=12) equivale a TEA 19.5618%.",
    normativa: "Res. SBS 8181-2012 (tasas efectivas y transparencia)",
    sectionSlug: "formulas-cronograma",
  },
  capitalizacion: {
    title: "Capitalización",
    definition:
      "Es la frecuencia con que la tasa nominal acumula intereses durante el año (mensual, trimestral, etc.).",
    formula: "TEA = (1 + TNA/m)^m - 1",
    example: "A mayor frecuencia de capitalización, mayor TEA equivalente.",
    sectionSlug: "formulas-cronograma",
  },
  tasaIngresada: {
    title: "Tasa ingresada",
    definition: "Tasa anual ingresada por el asesor. El motor la normaliza y calcula la TEM mensual.",
    formula: "TEM = (1 + TEA)^(30/360) - 1",
    example: "TEA 18% → TEM 1.3936%",
    sectionSlug: "formulas-cronograma",
  },
  cuotaInicial: {
    title: "Cuota inicial",
    definition: "Monto que aporta el cliente al inicio y que reduce el capital financiado.",
    formula: "Monto financiado = Precio vehículo - Cuota inicial",
    example: "Precio 85,990 y cuota inicial 20% → financiado 68,792",
    sectionSlug: "compra-inteligente-residual",
  },
  plazoMeses: {
    title: "Plazo (meses)",
    definition:
      "Número de meses para amortizar la deuda. Más plazo baja la cuota mensual, pero eleva el costo total.",
    sectionSlug: "formulas-cronograma",
  },
  graciaTipo: {
    title: "Tipo de gracia",
    definition: "Gracia total: no paga cuota. Gracia parcial: paga solo interés.",
    formula: "Gracia total: Saldo_post = Capital×(1+TEM)^g",
    sectionSlug: "periodos-gracia",
  },
  graciaMeses: {
    title: "Meses de gracia",
    definition: "Meses iniciales en los que se aplica el tipo de gracia elegido.",
    sectionSlug: "periodos-gracia",
  },
  residualMonto: {
    title: "Valor residual",
    definition: "Monto final (cuota balón) para conservar el vehículo en Compra Inteligente.",
    formula: "Capital activo = Financ - VP(Residual)",
    example: "Se incluye en la TCEA por ser flujo real de pago.",
    sectionSlug: "compra-inteligente-residual",
  },
  segDesgrav: {
    title: "Seguro de desgravamen",
    definition: "Prima mensual aplicada sobre saldo del crédito.",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  segVehicular: {
    title: "Seguro vehicular",
    definition: "Prima anual del seguro del vehículo. Se mensualiza en el cronograma.",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  tcea: {
    title: "TCEA",
    definition: "Costo real anual del crédito incluyendo interés, seguros y gastos.",
    formula: "P = Σ Flujo_k / (1 + r/360×30)^k",
    normativa: "Res. SBS 8181-2012",
    sectionSlug: "tcea",
  },
}
