"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("TODOS")
  const [marca, setMarca] = useState("TODOS")
  const [moneda, setMoneda] = useState("TODOS")

  async function cargarVehiculos() {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set("search", search.trim())
      if (estado !== "TODOS") qs.set("estado", estado)
      if (marca !== "TODOS") qs.set("marca", marca)
      if (moneda !== "TODOS") qs.set("moneda", moneda)

      const res = await fetch(`/api/vehiculos?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar vehículos")
      setVehiculos(data.vehiculos || [])
    } catch (e: any) {
      setError(e.message || "Error cargando vehículos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarVehiculos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const marcas = Array.from(new Set(vehiculos.map((v) => v.marca))).sort()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catálogo de Vehículos</h1>
            <p className="text-sm text-slate-600">Gestión de vehículos (Backoffice)</p>
          </div>
          <Link
            href="/dashboard/vehiculos/nuevo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nuevo vehículo
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}

        <section className="bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="md:col-span-2 border rounded p-2"
            placeholder="Buscar por marca, modelo, versión o concesionario"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border rounded p-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="TODOS">Estado: Todos</option>
            <option value="DISPONIBLE">Disponible</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>
          <select className="border rounded p-2" value={marca} onChange={(e) => setMarca(e.target.value)}>
            <option value="TODOS">Marca: Todas</option>
            {marcas.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select className="border rounded p-2" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
            <option value="TODOS">Moneda: Todas</option>
            <option value="PEN">PEN</option>
            <option value="USD">USD</option>
          </select>

          <div className="md:col-span-5 flex gap-2">
            <button onClick={cargarVehiculos} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">
              Buscar
            </button>
            <button
              onClick={() => {
                setSearch("")
                setEstado("TODOS")
                setMarca("TODOS")
                setMoneda("TODOS")
                setTimeout(() => cargarVehiculos(), 0)
              }}
              className="px-4 py-2 border rounded hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-600">Cargando vehículos...</div>
          ) : vehiculos.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium text-slate-800">🚗 No hay vehículos registrados</p>
              <p className="text-sm text-slate-600 mt-1">Registrá tu primer vehículo para empezar a simular.</p>
              <Link href="/dashboard/vehiculos/nuevo" className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                + Registrar vehículo
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left p-3">Marca</th>
                  <th className="text-left p-3">Modelo</th>
                  <th className="text-left p-3">Año</th>
                  <th className="text-right p-3">Precio</th>
                  <th className="text-right p-3">Val. residual</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-3">{v.marca}</td>
                    <td className="p-3">{v.modelo} {v.version || ""}</td>
                    <td className="p-3">{v.anio}</td>
                    <td className="p-3 text-right">{v.monedaPrecio} {Number(v.precioLista).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                    <td className="p-3 text-right">{v.valResidEst ? `${v.monedaPrecio} ${Number(v.valResidEst).toFixed(2)}` : "—"}</td>
                    <td className="p-3">{v.estado}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <Link className="text-blue-600 hover:underline" href={`/dashboard/vehiculos/${v.id}`}>Ver ficha</Link>
                        <Link className="text-green-600 hover:underline" href={`/dashboard/vehiculos/${v.id}?edit=1`}>Editar</Link>
                        <Link className="text-purple-600 hover:underline" href={`/dashboard/cotizaciones/nueva?vehiculoId=${v.id}`}>
                          Simular crédito
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  )
}
