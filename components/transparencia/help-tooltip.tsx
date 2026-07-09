"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { MathFormula } from "@/components/transparencia/math-formula"

type Props = {
  title: string
  definition: string
  /** Una o más expresiones LaTeX (sin $$) */
  formula?: string | string[]
  example?: string
  normativa?: string
  sectionSlug: string
}

export function HelpTooltip({ title, definition, formula, example, normativa, sectionSlug }: Props) {
  const [open, setOpen] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const formulas = !formula ? [] : Array.isArray(formula) ? formula : [formula]

  const show = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    setOpen(true)
  }

  const hide = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(() => setOpen(false), 120)
  }

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <span
        className="ml-1 inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
        aria-label={`Ayuda de ${title}`}
        role="img"
      >
        ?
      </span>

      {open && (
        <div
          className="absolute z-50 top-7 left-0 w-[360px] max-w-[90vw] bg-white border rounded-lg shadow-lg p-3 text-xs pointer-events-auto"
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <p className="font-semibold text-slate-900">{title}</p>
          <p className="text-slate-700 mt-2">{definition}</p>

          {formulas.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-slate-800 mb-1">Fórmula</p>
              <div className="rounded bg-slate-50 border border-slate-100 px-2 py-1 space-y-1 overflow-x-auto">
                {formulas.map((tex) => (
                  <MathFormula key={tex} tex={tex} display className="text-[0.95em]" />
                ))}
              </div>
            </div>
          )}

          {example && (
            <div className="mt-2">
              <p className="font-medium text-slate-800">Ejemplo</p>
              <p className="text-slate-700">{example}</p>
            </div>
          )}

          {normativa && <p className="mt-2 text-slate-600">Base normativa: {normativa}</p>}

          <Link
            href={`/transparencia/${sectionSlug}`}
            className="mt-3 inline-block text-blue-600 hover:underline"
            onClick={() => setOpen(false)}
          >
            Ver más en Transparencia
          </Link>
        </div>
      )}
    </span>
  )
}
