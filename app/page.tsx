import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (session) {
    redirect("/dashboard")
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center space-y-8 p-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Compra Inteligente
          </h1>
          <p className="text-xl text-slate-300 max-w-md mx-auto">
            Sistema de Gestión de Créditos Vehiculares - Perú
          </p>
        </div>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/sign-in"
            className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/sign-up"
            className="px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
          >
            Registrarse
          </Link>
          <Link
            href="/transparencia"
            className="px-8 py-4 border-2 border-cyan-300 text-cyan-100 font-semibold rounded-lg hover:bg-cyan-500/10 transition-colors"
          >
            Centro de Transparencia
          </Link>
        </div>
        
        <p className="text-sm text-slate-400">
          © 2026 UPC - SI642 Finanzas e Ingeniería Económica
        </p>
      </div>
    </div>
  )
}
