import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })
  
  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Compra Inteligente</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{session.user?.email}</span>
            <form action="/api/auth/sign-out" method="POST">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Nueva Cotización */}
          <Link
            href="/dashboard/cotizaciones/nueva"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nueva Cotización</h3>
            <p className="text-slate-600 text-sm">Crear una nueva simulación de crédito vehicular</p>
          </Link>

          {/* Lista de Cotizaciones */}
          <Link
            href="/dashboard/cotizaciones"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Mis Cotizaciones</h3>
            <p className="text-slate-600 text-sm">Ver y gestionar cotizaciones guardadas</p>
          </Link>

          {/* Clientes */}
          <Link
            href="/dashboard/clientes"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Clientes (Paso 1)</h3>
            <p className="text-slate-600 text-sm">Gestión de clientes: registro, edición y perfil</p>
          </Link>

          {/* Vehículos */}
          <Link
            href="/dashboard/vehiculos"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Vehículos (Paso 2)</h3>
            <p className="text-slate-600 text-sm">Catálogo de vehículos y simulación rápida</p>
          </Link>

          {/* Transparencia */}
          <Link
            href="/transparencia"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-cyan-200 transition">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Transparencia</h3>
            <p className="text-slate-600 text-sm">Fórmulas y ejemplos de cálculo</p>
          </Link>

          {/* Pagos Anticipados */}
          <Link
            href="/dashboard/pagos"
            className="p-6 bg-white rounded-xl shadow-sm border hover:shadow-md transition group"
          >
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-200 transition">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Pagos Anticipados</h3>
            <p className="text-slate-600 text-sm">Registrar pagos anticipados de clientes</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
