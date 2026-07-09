export type HelpFieldContent = {
  title: string
  definition: string
  /** Expresión(es) LaTeX para KaTeX (sin delimitadores $$) */
  formula?: string | string[]
  example?: string
  normativa?: string
  sectionSlug: string
}

export const ayudaCamposCotizacion: Record<string, HelpFieldContent> = {
  tipoDocumento: {
    title: "Tipo de documento",
    definition: "Identificación del cliente: DNI, CE o pasaporte. Obligatorio para registrar la operación en BD.",
    normativa: "Enunciado SI642 — alta de cliente",
    sectionSlug: "glosario-financiero",
  },
  numDocumento: {
    title: "Número de documento",
    definition: "Número único de identidad del cliente. Permite trazabilidad y evitar duplicados.",
    sectionSlug: "glosario-financiero",
  },
  nombres: {
    title: "Nombres",
    definition: "Nombres del titular del crédito. Se muestran en la hoja resumen y en el portal del cliente.",
    sectionSlug: "glosario-financiero",
  },
  apPaterno: {
    title: "Apellido paterno",
    definition: "Apellido paterno del titular. Campo obligatorio en el registro del cliente.",
    sectionSlug: "glosario-financiero",
  },
  apMaterno: {
    title: "Apellido materno",
    definition: "Apellido materno del titular. Recomendado para identificación completa.",
    sectionSlug: "glosario-financiero",
  },
  celular: {
    title: "Celular",
    definition: "Teléfono de contacto del cliente (9 dígitos en Perú).",
    sectionSlug: "glosario-financiero",
  },
  correo: {
    title: "Correo electrónico",
    definition: "Email del cliente para comunicaciones y acceso al portal de cotización.",
    sectionSlug: "glosario-financiero",
  },
  direccion: {
    title: "Dirección",
    definition: "Domicilio del cliente. Requerido para el expediente de la operación.",
    sectionSlug: "glosario-financiero",
  },
  marca: {
    title: "Marca del vehículo",
    definition:
      "Fabricante del vehículo a financiar (garantía del crédito). Elige del catálogo o «Otra marca…» para texto libre. No cambia la fórmula del crédito; es dato de identificación.",
    sectionSlug: "compra-inteligente-residual",
  },
  modelo: {
    title: "Modelo",
    definition:
      "Modelo comercial del vehículo. Tras elegir marca, selecciona del listado o «Otro modelo…». Influye en precio/residual estimado, no en el método francés.",
    sectionSlug: "compra-inteligente-residual",
  },
  version: {
    title: "Versión / trim",
    definition: "Versión específica del modelo (opcional). Ayuda a precisar la oferta.",
    sectionSlug: "compra-inteligente-residual",
  },
  anio: {
    title: "Año del vehículo",
    definition: "Año de fabricación. Afecta depreciación y residual Compra Inteligente.",
    sectionSlug: "compra-inteligente-residual",
  },
  precioLista: {
    title: "Precio de lista",
    definition: "Precio de venta del vehículo. Se usa como PV del plan de pagos.",
    sectionSlug: "compra-inteligente-residual",
  },
  monedaPrecio: {
    title: "Moneda del precio",
    definition: "PEN o USD del precio de lista. Debe coincidir con la moneda de la operación.",
    normativa: "Enunciado SI642 — soles o dólares",
    sectionSlug: "formulas-cronograma",
  },
  concesionario: {
    title: "Concesionario",
    definition: "Dealer o punto de venta del vehículo financiado.",
    sectionSlug: "compra-inteligente-residual",
  },
  monedaOp: {
    title: "Moneda de la operación",
    definition: "Moneda del crédito (PEN o USD). El motor calcula indistintamente; no convierte tipo de cambio.",
    sectionSlug: "formulas-cronograma",
  },
  tipoTasa: {
    title: "Tipo de tasa",
    definition:
      "En esta versión del curso el ingreso es solo TEA (indicación del profesor). El motor usa la TEA para obtener la TEM.",
    formula: String.raw`TEM = (1 + TEA)^{30/360} - 1`,
    example: "TEA 16.18% → TEM ≈ 1.2576%",
    normativa: "Indicación docente SI642 — parametrizar solo TEA",
    sectionSlug: "formulas-cronograma",
  },
  capitalizacion: {
    title: "Capitalización",
    definition:
      "No se usa en el formulario actual (solo TEA). Queda como referencia si se convierte una TNA externa.",
    formula: String.raw`TEA = \left(1 + \dfrac{TNA}{360/d}\right)^{360/d} - 1`,
    sectionSlug: "formulas-cronograma",
  },
  tasaIngresada: {
    title: "TEA (%)",
    definition: "Tasa Efectiva Anual en porcentaje. Es el único parámetro de tasa que se ingresa en la cotización.",
    formula: String.raw`TEM = (1 + TEA)^{30/360} - 1`,
    example: "Demo Interbank Plan 36: TEA ≈ 16.18%.",
    sectionSlug: "formulas-cronograma",
  },
  precioVehiculo: {
    title: "Precio del vehículo",
    definition: "Precio de venta (PV) usado en el plan de pagos Compra Inteligente.",
    sectionSlug: "compra-inteligente-residual",
  },
  cuotaInicial: {
    title: "Cuota inicial",
    definition: "Aporte inicial del cliente. Reduce el préstamo: Préstamo = PV − CI + costos iniciales financiados.",
    formula: String.raw`\text{Préstamo} = PV - CI + \sum \text{costos iniciales}`,
    example: "PV 16,000; CI 20%; notarial+registral 175 → préstamo 12,975",
    sectionSlug: "compra-inteligente-residual",
  },
  plazoMeses: {
    title: "Plazo (meses)",
    definition: "N cuotas regulares. Compra Inteligente típico: Plan 24 o Plan 36. El balón se paga en N+1.",
    example: "Plan 36 → 36 cuotas + 1 período de cuota final",
    sectionSlug: "formulas-cronograma",
  },
  fecDesembolso: {
    title: "Fecha de desembolso",
    definition: "Fecha en que se entrega el financiamiento al cliente.",
    sectionSlug: "formulas-cronograma",
  },
  fec1eraCuota: {
    title: "Fecha de primera cuota",
    definition: "Vencimiento de la cuota 1. Las siguientes suman 30 días (año comercial 360).",
    sectionSlug: "formulas-cronograma",
  },
  graciaTotalMeses: {
    title: "Gracia total (meses)",
    definition: "Meses iniciales PG=T: no se paga cuota regular; el interés capitaliza al saldo.",
    formula: String.raw`S_k = S_{k-1} + I_k`,
    sectionSlug: "periodos-gracia",
  },
  graciaParcialMeses: {
    title: "Gracia parcial (meses)",
    definition: "Meses PG=P tras la gracia total: se paga solo interés (sin amortización).",
    sectionSlug: "periodos-gracia",
  },
  graciaTipo: {
    title: "Tipo de gracia (compat)",
    definition: "Modo simple: TOTAL o PARCIAL. Preferir gracia total + parcial separadas.",
    sectionSlug: "periodos-gracia",
  },
  graciaMeses: {
    title: "Meses de gracia (compat)",
    definition: "Meses del modo simple de gracia. Preferir graciaTotalMeses / graciaParcialMeses.",
    sectionSlug: "periodos-gracia",
  },
  pctCuotaFinal: {
    title: "% Cuota final",
    definition: "Porcentaje del PV que queda como balón Compra Inteligente. Plan 24→50%, Plan 36→40%.",
    formula: [
      String.raw`CF = p_{CF} \times PV`,
      String.raw`K_{\text{activo}} = P - \dfrac{CF}{(1 + TEM + p_{\text{SegDes}})^{N+1}}`,
    ],
    sectionSlug: "compra-inteligente-residual",
  },
  residualMonto: {
    title: "Valor residual (monto)",
    definition: "Monto de la cuota final/balón. Si se deja 0, se calcula con % cuota final.",
    sectionSlug: "compra-inteligente-residual",
  },
  segDesgrav: {
    title: "Seguro de desgravamen (período)",
    definition: "Tasa periódica sobre saldo (ej. 0.00049). Entra en PMT(TEM+pSegDes) y en TCEA.",
    example: "Referencia producto: 0.00049 por período de 30 días",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  pctSegRie: {
    title: "% Seguro riesgo anual",
    definition: "Porcentaje anual sobre PV. Se convierte a prima periódica: (pct×PV)/12.",
    example: "0.003 × 16000 / 12 = 4 por período",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  segVehicular: {
    title: "Seguro vehicular (prima anual)",
    definition: "Alternativa en monto anual. Preferir % riesgo anual del modelo IB cuando esté disponible.",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  gastoGps: {
    title: "GPS (período)",
    definition: "Gasto periódico de GPS incluido en cada cuota (y en el balón N+1).",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  portesPer: {
    title: "Portes (período)",
    definition: "Gasto periódico de portes/envío de estado de cuenta físico, si aplica.",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  gasAdmPer: {
    title: "Gastos de administración (período)",
    definition: "Gasto administrativo periódico del modelo IB.",
    sectionSlug: "beneficios-riesgos-condiciones",
  },
  gastoNotarial: {
    title: "Costes notariales",
    definition: "Gasto inicial. Si se financia, se suma al préstamo.",
    sectionSlug: "formulas-cronograma",
  },
  costeRegistral: {
    title: "Costes registrales",
    definition: "Gasto inicial de registro. Si se financia, se suma al préstamo.",
    sectionSlug: "formulas-cronograma",
  },
  costeTasacion: {
    title: "Tasación",
    definition: "Gasto inicial de tasación (0 si no aplica).",
    sectionSlug: "formulas-cronograma",
  },
  comisionEstudio: {
    title: "Comisión de estudio",
    definition: "Solo si es un servicio efectivamente prestado y permitido. No confundir con evaluación crediticia prohibida.",
    normativa: "Res. SBS 8181-2012 — cargos prohibidos",
    sectionSlug: "marco-legal",
  },
  comisionActivacion: {
    title: "Comisión de activación",
    definition: "Solo si corresponde a servicio real permitido. No usar como cargo de desembolso prohibido.",
    normativa: "Res. SBS 8181-2012",
    sectionSlug: "marco-legal",
  },
  cokAnual: {
    title: "COK / tasa de descuento del VAN",
    definition:
      "Tasa de descuento (i) para calcular el VAN del deudor. No se le pregunta al cliente en ventanilla: la fija el asesor para el análisis. No es la TEA ni la TCEA del banco. Default 8% ≈ costo de oportunidad de mercado (depósitos/inversiones accesibles).",
    formula: [
      String.raw`COK_i = (1 + COK)^{30/360} - 1`,
      String.raw`VAN = P_0 + \sum_{k=1}^{n} \dfrac{F_k}{(1 + COK_i)^k}`,
    ],
    example: "Default demo: 8%. Un COK más alto suele reducir el VAN; no altera cuota ni TCEA.",
    normativa: "Enunciado SI642 — VAN del deudor obligatorio",
    sectionSlug: "van-tir",
  },
  tcea: {
    title: "TCEA",
    definition: "Costo real anual: (1+IRR)^(360/30)-1 sobre el flujo del deudor.",
    formula: String.raw`TCEA = (1 + TIR_{\text{mensual}})^{12} - 1`,
    normativa: "Res. SBS 8181-2012",
    sectionSlug: "tcea",
  },
}
