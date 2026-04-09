"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [search, setSearch] = useState("")
  const [estado, setEstado] = useState("TODOS")
  const [situacionLab, setSituacionLab] = useState("TODOS")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  async function cargarClientes() {
    setLoading(true)
    setError("")
    try {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set("search", search.trim())
      if (estado !== "TODOS") qs.set("estado", estado)
      if (situacionLab !== "TODOS") qs.set("situacionLab", situacionLab)
      if (fechaDesde) qs.set("fechaDesde", fechaDesde)
      if (fechaHasta) qs.set("fechaHasta", fechaHasta)

      const res = await fetch(`/api/clientes?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar clientes")
      setClientes(data.clientes || [])
    } catch (e: any) {
      setError(e.message || "Error cargando clientes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
            <p className="text-sm text-slate-600">Gestión de clientes (Backoffice)</p>
          </div>
          <Link
            href="/dashboard/clientes/nuevo"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Nuevo cliente
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}

        <section className="bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-6 gap-3">
          <input
            className="md:col-span-2 border rounded p-2"
            placeholder="Buscar por nombre, documento, correo, celular"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="border rounded p-2" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="TODOS">Estado: Todos</option>
            <option value="ACTIVO">Activo</option>
            <option value="ARCHIVADO">Archivado</option>
          </select>
          <select className="border rounded p-2" value={situacionLab} onChange={(e) => setSituacionLab(e.target.value)}>
            <option value="TODOS">Situación: Todas</option>
            <option value="DEPENDIENTE">Dependiente</option>
            <option value="INDEPENDIENTE">Independiente</option>
            <option value="OTRO">Otro</option>
          </select>
          <input type="date" className="border rounded p-2" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
          <input type="date" className="border rounded p-2" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />

          <div className="md:col-span-6 flex gap-2">
            <button onClick={cargarClientes} className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800">
              Buscar
            </button>
            <button
              onClick={() => {
                setSearch("")
                setEstado("TODOS")
                setSituacionLab("TODOS")
                setFechaDesde("")
                setFechaHasta("")
                setTimeout(() => cargarClientes(), 0)
              }}
              className="px-4 py-2 border rounded hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-6 text-slate-600">Cargando clientes...</div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-lg font-medium text-slate-800">📋 No hay clientes registrados</p>
              <p className="text-sm text-slate-600 mt-1">Registrá tu primer cliente para comenzar.</p>
              <Link
                href="/dashboard/clientes/nuevo"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                + Registrar cliente
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left p-3">N°</th>
                  <th className="text-left p-3">Documento</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Celular</th>
                  <th className="text-left p-3">Cotizaciones</th>
                  <th className="text-left p-3">Estado</th>
                  <th className="text-left p-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c, idx) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{String(idx + 1).padStart(3, "0")}</td>
                    <td className="p-3">{c.tipoDocumento} {c.numDocumento}</td>
                    <td className="p-3">{c.nombres} {c.apPaterno}</td>
                    <td className="p-3">{c.celular}</td>
                    <td className="p-3">{c.cotizacionesCount}</td>
                    <td className="p-3">{c.estado}</td>
                    <td className="p-3">
                      <div className="flex gap-3">
                        <Link className="text-blue-600 hover:underline" href={`/dashboard/clientes/${c.id}`}>
                          Ver perfil
                        </Link>
                        <Link className="text-green-600 hover:underline" href={`/dashboard/clientes/${c.id}?edit=1`}>
                          Editar
                        </Link>
                        <Link
                          className="text-purple-600 hover:underline"
                          href={`/dashboard/cotizaciones/nueva?clienteId=${c.id}`}
                        >
                          Nueva cotización
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
