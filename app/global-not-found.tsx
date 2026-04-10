import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

export const metadata: Metadata = {
  title: "404 - Página no encontrada",
  description: "La página que buscas no existe.",
}

export default function GlobalNotFound() {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <main className="w-full max-w-xl bg-white border rounded-xl p-6 text-center space-y-3">
          <h1 className="text-2xl font-bold text-slate-900">404 - Página no encontrada</h1>
          <p className="text-slate-600">Esta ruta no existe en el sistema.</p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Volver al inicio
            </Link>
          </div>
        </main>
      </body>
    </html>
  )
}
