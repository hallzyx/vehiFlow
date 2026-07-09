import Link from "next/link"
import { FormulaBlock } from "@/components/transparencia/math-formula"
import { getTransparenciaSection, transparenciaSections } from "@/lib/transparencia-content"

type SectionBody = {
  intro: string
  /** Fórmulas LaTeX (sin $$); se renderizan con KaTeX */
  formulas?: string[]
  formulasCaption?: string
  ejemplo?: string
  normativa?: string
}

const contentBySlug: Record<string, SectionBody> = {
  "formulas-cronograma": {
    intro:
      "El motor Compra Inteligente sigue el enunciado SI642 y el modelo de plan de pagos ordinario: sistema francés vencido ordinario (meses de 30 días / año comercial 360) con doble cronograma (cuota regular + cuota final/balón). En la aplicación se ingresa solo la TEA (indicación docente); a partir de ella se obtiene la TEM y la cuota con PMT sobre TEM más la tasa periódica de desgravamen.",
    formulasCaption: "TEA → TEM y cuota francesa",
    formulas: [
      String.raw`TEM = (1 + TEA)^{30/360} - 1 = (1 + TEA)^{1/12} - 1`,
      String.raw`C = PMT\!\left(TEM + p_{\text{SegDes}},\, n,\, -K_{\text{activo}}\right)`,
      String.raw`I_k = S_{k-1}\cdot TEM \qquad SegDes_k = S_{k-1}\cdot p_{\text{SegDes}}`,
      String.raw`A_k = C - I_k - SegDes_k \qquad S_k = S_{k-1} - A_k`,
    ],
    ejemplo:
      "Ejemplo: TEA ≈ 16,18% → TEM ≈ 1,2576%. Con pSegDes periódico = 0,00049, la tasa de PMT es TEM + pSegDes. En un Plan 36 hay 36 cuotas regulares y el balón (residual) en el período 37.",
    normativa: "Base: Resolución SBS 8181-2012 (año comercial 360 días) + enunciado SI642.",
  },
  tcea: {
    intro:
      "La TCEA es el indicador oficial del costo real del crédito. Incluye intereses, seguros y gastos trasladables al deudor. En este sistema se obtiene a partir de la TIR mensual (IRR) de los flujos del cronograma del deudor.",
    formulasCaption: "De la TIR periódica a la TCEA anual",
    formulas: [
      String.raw`TIR_{\text{mensual}} = IRR\!\left(F_0, F_1, \ldots, F_n\right)`,
      String.raw`TCEA = \left(1 + TIR_{\text{mensual}}\right)^{12} - 1`,
    ],
    ejemplo:
      "Si la TIR mensual del cronograma es ≈ 1,35%, entonces TCEA = (1,0135)^12 − 1 ≈ 17,5%. Con seguros y gastos, la TCEA es siempre ≥ TEA.",
    normativa: "Resolución SBS 8181-2012 — Reglamento de Transparencia (TCEA y cronograma desagregado).",
  },
  "van-tir": {
    intro:
      "VAN y TIR se calculan desde la perspectiva del deudor (obligatorio en el enunciado SI642). El VAN descuenta los flujos con el COK (costo de oportunidad del capital) del cliente, no con la TEM del crédito.",
    formulasCaption: "VAN @ COK y TIR del deudor",
    formulas: [
      String.raw`COK_i = (1 + COK)^{30/360} - 1`,
      String.raw`VAN = P_0 + \sum_{k=1}^{n} \dfrac{F_k}{(1 + COK_i)^k}`,
      String.raw`TIR:\quad 0 = P_0 + \sum_{k=1}^{n} \dfrac{F_k}{(1 + TIR)^k}`,
      String.raw`TCEA = (1 + TIR)^{12} - 1`,
    ],
    ejemplo:
      "Default de la app: COK 8% (oportunidad de mercado). Un VAN positivo indica que, a esa tasa de descuento, el valor presente de los pagos es menor que el préstamo recibido (beneficio neto en valor presente para el deudor).",
    normativa: "Enunciado SI642 (VAN y TIR del deudor) + trazabilidad auditable del motor financiero.",
  },
  "periodos-gracia": {
    intro:
      "La gracia total difiere el pago y capitaliza el interés sobre el saldo. La gracia parcial cobra solo el interés del período y no amortiza capital durante esos meses.",
    formulasCaption: "Efecto de la gracia sobre el saldo y la cuota",
    formulas: [
      String.raw`\text{Gracia total (}g\text{ meses):}\quad S_{\text{post}} = K\cdot(1 + TEM)^g`,
      String.raw`\text{Gracia parcial:}\quad C_{\text{gracia}} = S\cdot TEM \quad (A = 0)`,
    ],
    ejemplo:
      "Con 2 meses de gracia total, el saldo base para amortización crece antes de iniciar las cuotas normales. En gracia parcial, durante esos meses solo se paga interés.",
    normativa: "Enunciado SI642 — configuración de plazos de gracia total o parcial al inicio de la operación.",
  },
  "compra-inteligente-residual": {
    intro:
      "El valor residual (cuota balón) reduce las cuotas periódicas porque parte del capital se difiere al final. En el doble cronograma, el balón aparece como flujo adicional al cierre del plan.",
    formulasCaption: "Capital activo y cuota balón",
    formulas: [
      String.raw`VP_{\text{residual}} = \dfrac{R}{(1 + TEM + p_{\text{SegDes}})^{N+1}}`,
      String.raw`K_{\text{activo}} = P - VP_{\text{residual}}`,
      String.raw`\text{Balón en } k = N+1:\quad F_{N+1} \approx R`,
    ],
    ejemplo:
      "Plan 36 con residual 40%: las cuotas mensuales son menores que un francés al 100% del capital; al período 37 se paga el balón. Ese flujo entra en la TCEA.",
    normativa: "Producto Compra Inteligente + enunciado SI642 (crédito vehicular con plan francés).",
  },
  "pago-anticipado": {
    intro:
      "El cliente puede adelantar pagos sin penalidad ni comisión. El sistema recalcula el cronograma según la decisión del usuario (reducir plazo o reducir cuota).",
    formulasCaption: "Interés al día del anticipo",
    formulas: [
      String.raw`I_{\text{día}} = S \cdot TEM \cdot \dfrac{d}{30}`,
      String.raw`\text{Penalidad} = 0`,
    ],
    ejemplo:
      "Modalidades: REDUCIR_PLAZO (mantiene el monto de cuota) o REDUCIR_CUOTA (mantiene el número de cuotas restantes).",
    normativa: "Ley 29571 Art. 85 y Res. SBS 8181-2012.",
  },
  "glosario-financiero": {
    intro:
      "Glosario de términos clave del sistema para asesor y cliente final. Las definiciones operativas se alinean al motor y a la norma de transparencia.",
    formulasCaption: "Relaciones básicas entre tasas",
    formulas: [
      String.raw`TEM = (1 + TEA)^{1/12} - 1`,
      String.raw`TCEA \ge TEA \quad (\text{con seguros/gastos})`,
    ],
  },
  "marco-legal": {
    intro:
      "Marco normativo peruano aplicable al crédito vehicular Compra Inteligente. Resumen por norma y artículo:\n\n" +
      "• Ley 26702 Art. 9 — Libertad para fijar intereses, comisiones y tarifas dentro del límite del BCRP.\n" +
      "• Ley 28587 Art. 2 — Transparencia previa: beneficios, riesgos y condiciones del producto.\n" +
      "• Ley 28587 Art. 6 — Difusión constante de tasas, comisiones y gastos; tasas dentro del tope BCRP.\n" +
      "• Ley 28587 Art. 7 — Prohíbe cargos por conceptos que no correspondan a servicios efectivamente prestados.\n" +
      "• Ley 29571 Art. 85 — Pago anticipado total/parcial sin penalidad; intereses solo al día de pago.\n" +
      "• Ley 29571 Art. 86 — Derecho a conocer el saldo deudor y recibir cronograma actualizado.\n" +
      "• Ley 29571 Art. 87 — Información mínima en contratos: monto, TEA, TCEA, comisiones, gastos, cuotas y cronograma.\n" +
      "• Ley 29571 Art. 88 — Prohibición de cobros no pactados o no informados al contratar.\n" +
      "• Ley 31143 — El BCRP fija semestralmente la tasa máxima de interés convencional compensatorio (créditos de consumo).\n" +
      "• Res. SBS 8181-2012 — TCEA, cronograma desagregado, hoja resumen, difusión de fórmulas y cargos prohibidos (evaluación, desembolso, administración, garantía, cancelación anticipada).\n" +
      "• Res. SBS 3274-2017 — Conducta de mercado: oferta veraz, canales de reclamos y capacitación del personal.\n" +
      "• Circular BCRP 0008-2021 — Topes máximos de tasa compensatoria y moratoria para créditos de consumo.",
    formulasCaption: "Indicadores de transparencia (expresión matemática)",
    formulas: [
      String.raw`TEM = (1 + TEA)^{30/360} - 1`,
      String.raw`TCEA = (1 + IRR)^{12} - 1`,
    ],
    ejemplo:
      "En la hoja resumen el cliente debe ver TEA, TCEA, cronograma desglosado, seguros, gastos permitidos y la leyenda de penalidad S/ 0,00 en pago anticipado. Cargos como evaluación crediticia o desembolso no pueden trasladarse al usuario.",
    normativa:
      "Ley 26702; Ley 28587 (mod. Ley 31143); Ley 29571 Arts. 85–88; Ley 31143; Res. SBS 8181-2012; Res. SBS 3274-2017; Circular BCRP 0008-2021-BCRP.",
  },
  "beneficios-riesgos-condiciones": {
    intro:
      "Información mínima de transparencia del producto Compra Inteligente (Ley 28587 Art. 2 y Res. SBS 8181-2012 Anexo 4).\n\n" +
      "Beneficios:\n" +
      "• Cuotas mensuales más bajas que un crédito convencional al diferir parte del capital en el valor residual (cuota balón).\n" +
      "• Flexibilidad al final del plazo: pagar el residual, refinanciar o devolver el vehículo según la oferta pactada.\n" +
      "• Simulación transparente con TEA/TCEA, cronograma desagregado y VAN/TIR del deudor.\n" +
      "• Derecho a pago anticipado sin penalidad ni comisión.\n\n" +
      "Riesgos:\n" +
      "• Mora: intereses moratorios y afectación crediticia si no se pagan las cuotas a tiempo.\n" +
      "• El residual es un pago real al final; si no se planifica, eleva la carga financiera del último período.\n" +
      "• Seguros (desgravamen y vehicular) incrementan la cuota y la TCEA.\n" +
      "• Variación de condiciones solo aplica si fueron informadas y pactadas; cobros no informados están prohibidos.\n\n" +
      "Condiciones:\n" +
      "• Cuota inicial, plazo (p. ej. 24/36), tasa (TEA o TNA con capitalización), gracia y % de cuota final según simulación.\n" +
      "• Seguros exigidos por la entidad o póliza propia equivalente informada al cliente.\n" +
      "• Gastos permitidos solo por servicios efectivamente prestados; cargos SBS prohibidos bloqueados en el sistema.\n" +
      "• Reclamos: Libro de reclamaciones y canal interno; escalamiento a Indecopi/SBS cuando corresponda.",
    formulasCaption: "Estructura de cuota baja + balón",
    formulas: [
      String.raw`C \approx PMT\!\left(TEM + p_{\text{SegDes}},\, n,\, -(P - VP(R))\right)`,
      String.raw`F_{N+1} \approx R`,
    ],
    ejemplo:
      "Plan 36 con residual 40%: cuotas mensuales menores que un francés puro al 100% del capital; al mes 37 se paga el balón. La TCEA refleja ese flujo completo.",
    normativa: "Ley 28587 Art. 2; Res. SBS 8181-2012 Anexo 4 (Beneficios, Riesgos y Condiciones).",
  },
  "canal-reclamos": {
    intro:
      "Canales de atención de reclamos para el usuario del crédito vehicular, alineados a conducta de mercado y protección al consumidor.\n\n" +
      "1) Libro de reclamaciones — Disponible en el establecimiento y/o canal digital de la entidad. Todo reclamo debe registrarse con fecha, datos del usuario, detalle del hecho y pedido.\n\n" +
      "2) Canal interno — Atención por la entidad (ventanilla, correo o mesa de ayuda del sistema académico/comercial). Se registra trazabilidad: número de ticket, plazo de respuesta y resultado.\n\n" +
      "3) Escalamiento regulatorio — Si no hay respuesta oportuna o la solución es insatisfactoria, el usuario puede acudir a:\n" +
      "   • Indecopi (Código del Consumidor — Ley 29571)\n" +
      "   • SBS (supervisión de conducta de mercado y transparencia — Res. 3274-2017 / 8181-2012)",
    ejemplo:
      "El cliente registra un reclamo por TCEA no informada en la hoja resumen. La entidad responde por el canal interno; si no se resuelve, escala a Indecopi y puede informar a la SBS.",
    normativa:
      "Res. SBS 3274-2017 (canales de reclamos); Res. SBS 8181-2012; Ley 29571; Libro de reclamaciones (normativa de protección al consumidor).",
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
          Sección no encontrada.{" "}
          <Link href={indexPath} className="text-blue-600 hover:underline">
            Volver
          </Link>
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
          <p className="text-slate-800 whitespace-pre-line">{content.intro}</p>

          {content.formulas && content.formulas.length > 0 && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Fórmulas</h2>
              <FormulaBlock formulas={content.formulas} caption={content.formulasCaption} />
            </div>
          )}

          {content.ejemplo && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-2">Ejemplo</h2>
              <p className="text-slate-700 whitespace-pre-line">{content.ejemplo}</p>
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
                <Link
                  key={s.slug}
                  href={`${basePath}/${s.slug}`}
                  className="text-sm px-3 py-1 border rounded hover:bg-slate-50"
                >
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
