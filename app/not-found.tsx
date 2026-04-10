import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <section className="w-full max-w-xl bg-white border rounded-xl p-6 text-center space-y-3">
        <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
        <p className="text-slate-600">
          La ruta que intentaste abrir no existe o fue movida.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  )
}
