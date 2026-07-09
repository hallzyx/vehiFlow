export type TransparenciaSection = {
  id: number
  slug: string
  title: string
  summary: string
  bullets: string[]
}

export const transparenciaSections: TransparenciaSection[] = [
  {
    id: 1,
    slug: "formulas-cronograma",
    title: "Fórmulas del cronograma",
    summary: "Francés vencido ordinario (30/360), TEA→TEM, PMT y doble cronograma Compra Inteligente.",
    bullets: [
      "Ingreso de tasa: solo TEA (indicación del curso)",
      "TEM = (1+TEA)^(30/360) − 1",
      "Cuota = PMT(TEM + pSegDes, n, −K activo)",
      "Interés, desgravamen y amortización por período",
    ],
  },
  {
    id: 2,
    slug: "tcea",
    title: "Cálculo de la TCEA",
    summary: "Indicador de costo real exigido por la SBS (transparencia del sistema financiero).",
    bullets: [
      "Incluye intereses, seguros y gastos trasladables",
      "TCEA = (1 + TIR mensual)^12 − 1",
      "Siempre es mayor o igual que la TEA cuando hay costos adicionales",
    ],
  },
  {
    id: 3,
    slug: "van-tir",
    title: "VAN y TIR del deudor",
    summary: "Indicadores obligatorios del enunciado SI642, desde la perspectiva del cliente.",
    bullets: [
      "VAN descontado al COK del deudor",
      "TIR: tasa que hace VAN = 0",
      "Se calculan sobre el flujo real de pagos del cronograma",
    ],
  },
  {
    id: 4,
    slug: "periodos-gracia",
    title: "Períodos de gracia",
    summary: "Diferencias entre gracia total y parcial al inicio de la operación.",
    bullets: [
      "Gracia total: no se paga cuota y el interés capitaliza",
      "Gracia parcial: se paga solo interés (amortización = 0)",
      "Configurable en la cotización según el enunciado",
    ],
  },
  {
    id: 5,
    slug: "compra-inteligente-residual",
    title: "Compra Inteligente y valor residual",
    summary: "Lógica de cuota balón y decisión final del cliente.",
    bullets: [
      "Cuotas mensuales más bajas durante el plazo",
      "Valor residual como último flujo (período N+1)",
      "Impacta directamente en la TCEA",
    ],
  },
  {
    id: 6,
    slug: "pago-anticipado",
    title: "Pago anticipado",
    summary: "Derecho del cliente sin penalidad ni comisión.",
    bullets: [
      "Penalidad obligatoria: S/ 0,00",
      "Cliente elige reducir plazo o cuota",
      "Se emite cronograma actualizado",
    ],
  },
  {
    id: 7,
    slug: "glosario-financiero",
    title: "Glosario financiero",
    summary: "Definiciones en lenguaje claro para asesores y clientes.",
    bullets: ["TEA", "TEM", "TCEA", "VAN", "TIR", "Residual", "Gracia", "COK"],
  },
  {
    id: 8,
    slug: "marco-legal",
    title: "Marco legal y normativo",
    summary: "Leyes y resoluciones SBS/BCRP aplicables al producto.",
    bullets: [
      "Ley 26702 Art. 9 — libertad de tasas dentro del límite BCRP",
      "Ley 28587 Arts. 2/6/7 — transparencia, difusión y cargos no permitidos",
      "Ley 29571 Arts. 85–88 — anticipado, cronograma e información mínima",
      "Ley 31143 — tope de usura / tasa máxima BCRP",
      "Resolución SBS 8181-2012 — TCEA, cronograma y cargos prohibidos",
      "Resolución SBS 3274-2017 — conducta de mercado y reclamos",
      "Circular BCRP 0008-2021 — topes compensatorio y moratorio",
    ],
  },
  {
    id: 9,
    slug: "beneficios-riesgos-condiciones",
    title: "Beneficios, riesgos y condiciones",
    summary: "Información mínima de transparencia para oferta del crédito.",
    bullets: [
      "Beneficios del esquema Compra Inteligente",
      "Riesgos de incumplimiento y mora",
      "Condiciones del producto y seguros",
    ],
  },
  {
    id: 10,
    slug: "canal-reclamos",
    title: "Canal de reclamos",
    summary: "Procedimiento y medios para registrar reclamos.",
    bullets: [
      "Libro de Reclamaciones",
      "Canal interno de atención",
      "Escalamiento regulatorio cuando aplique",
    ],
  },
]

export function getTransparenciaSection(slug: string) {
  return transparenciaSections.find((s) => s.slug === slug)
}
