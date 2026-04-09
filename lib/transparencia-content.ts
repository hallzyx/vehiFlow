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
    summary: "Sistema francés vencido ordinario con meses de 30 días.",
    bullets: [
      "Cuota fija: C = (P×TEM) / (1 - (1+TEM)^(-n))",
      "Interés de cada cuota: I_k = Saldo_(k-1) × TEM",
      "Amortización: A_k = C - I_k",
      "Saldo final: Saldo_k = Saldo_(k-1) - A_k",
    ],
  },
  {
    id: 2,
    slug: "tcea",
    title: "Cálculo de la TCEA",
    summary: "Indicador de costo real exigido por la SBS.",
    bullets: [
      "Incluye intereses, seguros y gastos trasladables",
      "Se calcula sobre base anual de 360 días",
      "Siempre es mayor o igual que la TEA",
    ],
  },
  {
    id: 3,
    slug: "van-tir",
    title: "VAN y TIR del deudor",
    summary: "Indicadores financieros desde la perspectiva del cliente.",
    bullets: [
      "VAN mide costo en valor presente",
      "TIR es la tasa que hace VAN = 0",
      "Se calculan sobre el flujo real de pagos",
    ],
  },
  {
    id: 4,
    slug: "periodos-gracia",
    title: "Períodos de gracia",
    summary: "Diferencias entre gracia total y parcial.",
    bullets: [
      "Gracia total: no se paga cuota y el interés capitaliza",
      "Gracia parcial: se paga solo interés",
      "El plazo de amortización no se reduce",
    ],
  },
  {
    id: 5,
    slug: "compra-inteligente-residual",
    title: "Compra Inteligente y valor residual",
    summary: "Lógica de cuota balón y decisión final del cliente.",
    bullets: [
      "Cuotas mensuales más bajas durante el plazo",
      "Valor residual como último flujo",
      "Impacta directamente en la TCEA",
    ],
  },
  {
    id: 6,
    slug: "pago-anticipado",
    title: "Pago anticipado",
    summary: "Derecho del cliente sin penalidad ni comisión.",
    bullets: [
      "Penalidad obligatoria: S/ 0.00",
      "Cliente elige reducir plazo o cuota",
      "Se emite cronograma actualizado",
    ],
  },
  {
    id: 7,
    slug: "glosario-financiero",
    title: "Glosario financiero",
    summary: "Definiciones en lenguaje claro para asesores y clientes.",
    bullets: ["TEA", "TEM", "TCEA", "VAN", "TIR", "Residual", "Gracia"],
  },
  {
    id: 8,
    slug: "marco-legal",
    title: "Marco legal y normativo",
    summary: "Leyes y resoluciones SBS/BCRP aplicables al producto.",
    bullets: [
      "Ley 28587 y Código del Consumidor",
      "Resolución SBS 8181-2012",
      "Resolución SBS 3274-2017",
      "Circular BCRP 0008-2021",
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
