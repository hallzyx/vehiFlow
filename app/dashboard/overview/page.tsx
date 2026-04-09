"use client"

import { useEffect, useState } from "react"
import { RoleKpiDashboard } from "@/components/dashboard/role-kpi-dashboard"

export default function DashboardOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/dashboard/metrics", { cache: "no-store" })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || "No se pudo cargar dashboard")
      setData(d)
    } catch (e: any) {
      setError(e.message || "Error cargando dashboard")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard ejecutivo</h1>
          <p className="text-sm text-slate-600">
            KPI comerciales + métricas de transparencia SBS + desempeño operativo
          </p>
        </div>
        <button onClick={cargar} className="px-3 py-2 border rounded hover:bg-slate-50 text-sm">
          Refrescar
        </button>
      </div>

      {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>}

      {loading ? (
        <div className="bg-white border rounded-xl p-6 text-slate-600">Cargando métricas...</div>
      ) : data ? (
        <RoleKpiDashboard
          role={data.role}
          profile={data.profile}
          kpis={data.kpis}
          charts={data.charts}
        />
      ) : null}
    </div>
  )
}
