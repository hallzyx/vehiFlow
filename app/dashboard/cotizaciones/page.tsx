"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

export default function CotizacionesPage() {
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("TODOS")
  const [moneda, setMoneda] = useState("TODOS")
  const [tipoTasa, setTipoTasa] = useState("TODOS")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  async function cargarCotizaciones(pageParam?: number) {
    setLoading(true)
    setError("")
    try {
      const currentPage = pageParam ?? pagination.page
      const qs = new URLSearchParams()
      if (search.trim()) qs.set("search", search.trim())
      if (estado !== "TODOS") qs.set("estado", estado)
      if (moneda !== "TODOS") qs.set("moneda", moneda)
      if (tipoTasa !== "TODOS") qs.set("tipoTasa", tipoTasa)
      if (fechaDesde) qs.set("fechaDesde", fechaDesde)
      if (fechaHasta) qs.set("fechaHasta", fechaHasta)
      qs.set("page", String(currentPage))
      qs.set("pageSize", String(pagination.pageSize))

      const res = await fetch(`/api/cotizaciones?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar cotizaciones")
      setCotizaciones(data.cotizaciones || [])
      setPagination(data.pagination || { page: currentPage, pageSize: pagination.pageSize, total: 0, totalPages: 1 })
    } catch (e: any) {
      setError(e.message || "Error cargando cotizaciones")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarCotizaciones()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ordenadas = useMemo(() => cotizaciones, [cotizaciones])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <header className="bg-white border rounded-xl p-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
          <p className="text-sm text-slate-600">Historial de simulaciones guardadas</p>
        </div>
        <Link
          href="/dashboard/cotizaciones/nueva"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Nueva Cotización
        </Link>
      </header>

      {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}

      <section className="bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
        <input
          className="md:col-span-2 border rounded p-2"
          placeholder="Buscar por cliente, doc, marca, modelo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="border rounded p-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="TODOS">Estado: Todos</option>
          <option value="SIMULADA">SIMULADA</option>
          <option value="PRESENTADA">PRESENTADA</option>
          <option value="APROBADA">APROBADA</option>
          <option value="RECHAZADA">RECHAZADA</option>
          <option value="ARCHIVADA">ARCHIVADA</option>
          <option value="ARCHIVADA_VERSION">ARCHIVADA_VERSION</option>
        </select>
        <select className="border rounded p-2" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
          <option value="TODOS">Moneda: Todas</option>
          <option value="PEN">PEN</option>
          <option value="USD">USD</option>
        </select>
        <select className="border rounded p-2" value={tipoTasa} onChange={(e) => setTipoTasa(e.target.value)}>
          <option value="TODOS">Tipo tasa: Todos</option>
          <option value="EFECTIVA">EFECTIVA</option>
          <option value="NOMINAL">NOMINAL</option>
        </select>
        <input type="date" className="border rounded p-2" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
        <input type="date" className="border rounded p-2" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />

        <div className="md:col-span-6 flex gap-2">
          <button onClick={() => cargarCotizaciones(1)} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">
            Buscar
          </button>
          <button
            onClick={() => {
              setSearch("")
              setEstado("TODOS")
              setMoneda("TODOS")
              setTipoTasa("TODOS")
              setFechaDesde("")
              setFechaHasta("")
              setPagination((p) => ({ ...p, page: 1 }))
              setTimeout(() => cargarCotizaciones(1), 0)
            }}
            className="px-4 py-2 border rounded hover:bg-slate-50"
          >
            Limpiar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-600">Cargando cotizaciones...</div>
        ) : ordenadas.length === 0 ? (
          <div className="p-6 text-slate-500">No hay cotizaciones registradas todavía.</div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Documento</th>
                  <th className="text-left p-3">Vehículo</th>
                  <th className="text-left p-3">Monto</th>
                  <th className="text-left p-3">TCEA</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Fecha</th>
                  <th className="text-left p-3">Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">#{c.id}</td>
                    <td className="p-3">{c.cliente}</td>
                    <td className="p-3">{c.documento}</td>
                    <td className="p-3">{c.vehiculo}</td>
                    <td className="p-3">
                      {c.moneda} {Number(c.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">{Number(c.tcea).toFixed(4)}%</td>
                    <td className="p-3">{c.estado}</td>
                    <td className="p-3">{new Date(c.creadoEn).toLocaleDateString("es-PE")}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link className="text-blue-600 hover:underline" href={`/dashboard/cotizaciones/${c.id}`}>
                          Ver detalle
                        </Link>
                        {(c.estado === "SIMULADA" || c.estado === "PRESENTADA") && (
                          <Link className="text-green-600 hover:underline" href={`/dashboard/cotizaciones/${c.id}/editar`}>
                            Editar
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-3 border-t flex items-center justify-between text-sm">
              <p className="text-slate-600">
                Mostrando página {pagination.page} de {pagination.totalPages} · Total: {pagination.total}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const prev = Math.max(1, pagination.page - 1)
                    if (prev !== pagination.page) cargarCotizaciones(prev)
                  }}
                  disabled={pagination.page <= 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => {
                    const next = Math.min(pagination.totalPages, pagination.page + 1)
                    if (next !== pagination.page) cargarCotizaciones(next)
                  }}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
