import Link from "next/link"
import { transparenciaSections } from "@/lib/transparencia-content"

export function TransparenciaIndex({ basePath }: { basePath: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Centro de Transparencia e Información Financiera</h1>
          <p className="text-slate-600 mt-2">Conocé cómo calculamos tu crédito vehicular.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {transparenciaSections.map((section) => (
            <Link
              key={section.id}
              href={`${basePath}/${section.slug}`}
              className="bg-white rounded-xl border p-5 hover:shadow-sm transition"
            >
              <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Sección {section.id}</p>
              <h2 className="text-lg font-semibold text-slate-900 mt-1">{section.title}</h2>
              <p className="text-sm text-slate-600 mt-2">{section.summary}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
