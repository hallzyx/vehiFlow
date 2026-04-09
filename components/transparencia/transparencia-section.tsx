import Link from "next/link"
import { getTransparenciaSection, transparenciaSections } from "@/lib/transparencia-content"

const contentBySlug: Record<string, { intro: string; formula?: string; ejemplo?: string; normativa?: string }> = {
  "formulas-cronograma": {
    intro:
      "El cronograma usa sistema francés vencido ordinario. Las cuotas son constantes en su componente base y se descomponen en interés + amortización.",
    formula: "C = (P×TEM) / (1 - (1+TEM)^(-n))",
    ejemplo:
      "Ejemplo: P=45,000; TEA=18%; TEM=1.3936%; n=36. Se obtiene una cuota base aproximada y luego se desagrega por período.",
    normativa: "Base: Resolución SBS 8181-2012 (año 360 días).",
  },
  tcea: {
    intro:
      "La TCEA es el indicador oficial del costo real del crédito. Incluye no solo interés, también seguros y gastos trasladables.",
    formula: "P = Σ Flujo_k / (1 + r/360×30)^k",
    ejemplo:
      "El motor calcula r numéricamente sobre todos los flujos del cronograma, y la reporta como tasa efectiva anual.",
    normativa: "Base: Resolución SBS 8181-2012, Reglamento de Transparencia.",
  },
  "van-tir": {
    intro:
      "VAN y TIR se calculan desde la perspectiva del deudor, como exige el curso y el enfoque de transparencia financiera.",
    formula: "VAN = P - Σ Cuota_k/(1+i)^k; TIR: tasa que hace VAN=0",
    ejemplo:
      "Si VAN es negativo, el crédito tiene costo en valor presente para el deudor.",
    normativa: "Base académica + trazabilidad auditable del motor financiero.",
  },
  "periodos-gracia": {
    intro:
      "La gracia total difiere el pago y capitaliza interés; la parcial paga solo interés y no amortiza capital durante la gracia.",
    formula: "Gracia total: Saldo_post = Capital×(1+TEM)^g; Gracia parcial: Cuota_gracia = Saldo×TEM",
    ejemplo: "Con 2 meses de gracia total, el saldo base para amortización crece antes de iniciar cuotas normales.",
  },
  "compra-inteligente-residual": {
    intro:
      "El valor residual (cuota balón) reduce las cuotas periódicas y se paga al final como flujo adicional.",
    formula: "Capital activo = Financ - (Residual/(1+TEM)^n)",
    ejemplo: "El residual se incluye en TCEA porque es un pago real del deudor.",
  },
  "pago-anticipado": {
    intro:
      "El cliente puede adelantar pagos sin penalidad ni comisión. El sistema recalcula cronograma según su decisión.",
    formula: "Interés al día = Saldo×TEM×(días/30)",
    ejemplo: "Modalidades: REDUCIR_PLAZO (mantiene cuota) o REDUCIR_CUOTA (mantiene plazo).",
    normativa: "Ley 29571 Art. 85 y Res. SBS 8181-2012.",
  },
  "glosario-financiero": {
    intro: "Glosario de términos clave del sistema para asesor y cliente final.",
  },
  "marco-legal": {
    intro:
      "Compendio de normas aplicables: Ley 28587, Ley 29571, Ley 26702, Res. SBS 8181-2012, Res. SBS 3274-2017, Circular BCRP 0008-2021.",
  },
  "beneficios-riesgos-condiciones": {
    intro:
      "Se presenta información clara sobre ventajas del producto, riesgos de incumplimiento, seguros, y condiciones operativas.",
  },
  "canal-reclamos": {
    intro:
      "Canales de atención de reclamos, trazabilidad de atención y referencia al Libro de Reclamaciones.",
  },
}

export function TransparenciaSection({
  slug,
  basePath,
  indexPath,
}: {
  slug: string
  basePath: string
  indexPath: string
}) {
  const section = getTransparenciaSection(slug)

  if (!section) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-700">
          Sección no encontrada. <Link href={indexPath} className="text-blue-600 hover:underline">Volver</Link>
        </div>
      </div>
    )
  }

  const content = contentBySlug[slug] || { intro: section.summary }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Sección {section.id}</p>
          <h1 className="text-3xl font-bold text-slate-900 mt-1">{section.title}</h1>
          <p className="text-slate-600 mt-2">{section.summary}</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="bg-white rounded-xl border p-6 space-y-4">
          <p className="text-slate-800">{content.intro}</p>

          {content.formula && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Fórmula</h2>
              <pre className="bg-slate-100 rounded p-3 text-sm overflow-x-auto">{content.formula}</pre>
            </div>
          )}

          {content.ejemplo && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Ejemplo</h2>
              <p className="text-slate-700">{content.ejemplo}</p>
            </div>
          )}

          {content.normativa && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Base normativa</h2>
              <p className="text-slate-700">{content.normativa}</p>
            </div>
          )}

          <div>
            <h2 className="font-semibold text-slate-900 mb-2">Puntos clave</h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              {section.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Otras secciones</h3>
          <div className="flex flex-wrap gap-2">
            {transparenciaSections
              .filter((s) => s.slug !== slug)
              .map((s) => (
                <Link key={s.slug} href={`${basePath}/${s.slug}`} className="text-sm px-3 py-1 border rounded hover:bg-slate-50">
                  {s.id}. {s.title}
                </Link>
              ))}
          </div>
          <Link href={indexPath} className="inline-block mt-4 text-blue-600 hover:underline text-sm">
            ← Volver al índice
          </Link>
        </section>
      </main>
    </div>
  )
}
