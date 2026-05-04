export type HelpFieldContent = {
  title: string
  definition: string
  formula?: string
  example?: string
  normativa?: string
  sectionSlug: string
}

export const ayudaCamposCotizacion: Record<string, HelpFieldContent> = {
  capitalizacion: {
    title: "Capitalización (no aplica)",
    definition: "Este campo ya no se utiliza. La tasa se ingresa directamente como Tasa Efectiva Anual (TEA), por lo que no requiere conversión ni capitalización.",
    formula: "—",
    sectionSlug: "formulas-cronograma",
  },
  tasaIngresada: {
    title: "Tasa Efectiva Anual (TEA)",
    definition: "Tasa efectiva anual ingresada por el asesor. El motor la usa directamente para calcular la TEM mensual sin necesidad de conversión.",
    formula: "TEA → TEM = (1 + TEA)^(30/360) - 1",
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
