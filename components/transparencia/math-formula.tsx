import katex from "katex"

type MathFormulaProps = {
  /** Expresión TeX/LaTeX (sin delimitadores $$) */
  tex: string
  /** display = bloque centrado; inline = en línea */
  display?: boolean
  className?: string
}

/** Renderiza una fórmula con KaTeX (SSR-safe vía renderToString). */
export function MathFormula({ tex, display = true, className = "" }: MathFormulaProps) {
  let html = tex
  try {
    html = katex.renderToString(tex, {
      throwOnError: false,
      displayMode: display,
      strict: "ignore",
      trust: false,
    })
  } catch {
    html = tex
  }

  return (
    <div
      className={`overflow-x-auto ${display ? "my-1 py-1" : "inline-block"} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

type FormulaBlockProps = {
  formulas: string[]
  caption?: string
}

/** Bloque de una o más fórmulas display para Transparencia. */
export function FormulaBlock({ formulas, caption }: FormulaBlockProps) {
  if (!formulas.length) return null

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
      {caption ? <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{caption}</p> : null}
      {formulas.map((tex) => (
        <MathFormula key={tex} tex={tex} display />
      ))}
    </div>
  )
}
