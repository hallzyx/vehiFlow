"use client"

import { useState } from "react"
import Link from "next/link"

type Props = {
  title: string
  definition: string
  formula?: string
  example?: string
  normativa?: string
  sectionSlug: string
}

export function HelpTooltip({ title, definition, formula, example, normativa, sectionSlug }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        className="ml-1 w-5 h-5 rounded-full border border-slate-300 text-xs text-slate-700 hover:bg-slate-100"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Ayuda de ${title}`}
      >
        ?
      </button>

      {open && (
        <div className="absolute z-50 top-7 left-0 w-[340px] max-w-[90vw] bg-white border rounded-lg shadow-lg p-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900">{title}</p>
            <button className="text-slate-500 hover:text-slate-800" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>

          <p className="text-slate-700 mt-2">{definition}</p>

          {formula && (
            <div className="mt-2">
              <p className="font-medium text-slate-800">Fórmula</p>
              <pre className="bg-slate-100 p-2 rounded mt-1 overflow-x-auto">{formula}</pre>
            </div>
          )}

          {example && (
            <div className="mt-2">
              <p className="font-medium text-slate-800">Ejemplo</p>
              <p className="text-slate-700">{example}</p>
            </div>
          )}

          {normativa && (
            <p className="mt-2 text-slate-600">Base normativa: {normativa}</p>
          )}

          <Link href={`/transparencia/${sectionSlug}`} className="mt-3 inline-block text-blue-600 hover:underline">
            Ver más en Transparencia
          </Link>
        </div>
      )}
    </span>
  )
}
