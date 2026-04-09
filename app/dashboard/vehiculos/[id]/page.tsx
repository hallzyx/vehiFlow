"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type Tab = "datos" | "simulacion" | "cotizaciones" | "historial"

export default function VehiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [id, setId] = useState("")
  const [vehiculo, setVehiculo] = useState<any>(null)
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState("")
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<Tab>("datos")

  const [sim, setSim] = useState({
    cuotaIniPct: 20,
    plazoMeses: 36,
    tasaIngresada: 18,
    monedaOp: "PEN",
  })
  const [preview, setPreview] = useState<any>(null)

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId)
      cargar(resolvedId)
      if (searchParams.get("edit") === "1") setEditing(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function cargar(vehiculoId: string) {
    setLoading(true)
    setError("")
    setWarning("")
    try {
      const res = await fetch(`/api/vehiculos/${vehiculoId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar vehículo")
      setVehiculo(data.vehiculo)
      setCotizaciones(data.cotizaciones || [])
      setHistorial(data.historial || [])
      setForm(data.vehiculo)
      setPreview(null)
    } catch (e: any) {
      setError(e.message || "Error cargando vehículo")
    } finally {
      setLoading(false)
    }
  }

  async function guardar() {
    if (!id || !form) return
    setSaving(true)
    setError("")
    setWarning("")
    try {
      const payload: any = {
        ...form,
        precioLista: Number(form.precioLista),
        valResidEst: form.valResidEst ? Number(form.valResidEst) : null,
      }

      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar")
      if (data.warning) setWarning(data.warning)
      await cargar(id)
      setEditing(false)
    } catch (e: any) {
      setError(e.message || "Error guardando cambios")
    } finally {
      setSaving(false)
    }
  }

  async function archivar() {
    if (!id) return
    if (!window.confirm("¿Archivar vehículo?")) return
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "ARCHIVADO" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo archivar")
      await cargar(id)
    } catch (e: any) {
      setError(e.message || "Error archivando")
    }
  }

  async function simularRapido() {
    if (!id) return
    setError("")
    try {
      const res = await fetch(`/api/vehiculos/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sim),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo simular")
      setPreview(data.preview)
    } catch (e: any) {
      setError(e.message || "Error en simulación")
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Cargando vehículo...</div>
  }

  if (!vehiculo) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Vehículo no encontrado</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{vehiculo.marca} {vehiculo.modelo} {vehiculo.version || ""} {vehiculo.anio}</h1>
            <p className="text-sm text-slate-600">
              Precio: {vehiculo.monedaPrecio} {Number(vehiculo.precioLista).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
              {" | "}
              Valor residual: {vehiculo.valResidEst ? `${vehiculo.monedaPrecio} ${Number(vehiculo.valResidEst).toFixed(2)}` : "—"}
            </p>
            <p className="text-xs text-slate-500">Concesionario: {vehiculo.concesionario} | Estado: {vehiculo.estado}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing((v) => !v)} className="px-3 py-2 border rounded hover:bg-slate-50">
              {editing ? "Cancelar edición" : "Editar"}
            </button>
            {vehiculo.estado !== "ARCHIVADO" && (
              <button onClick={archivar} className="px-3 py-2 border border-amber-300 text-amber-700 rounded hover:bg-amber-50">
                Archivar
              </button>
            )}
            <Link href="/dashboard/vehiculos" className="px-3 py-2 border rounded hover:bg-slate-50">Volver</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}
        {warning && <div className="p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded">{warning}</div>}

        <div className="flex gap-2 flex-wrap">
          <TabBtn current={tab} value="datos" onClick={setTab}>Datos del vehículo</TabBtn>
          <TabBtn current={tab} value="simulacion" onClick={setTab}>Simulación rápida</TabBtn>
          <TabBtn current={tab} value="cotizaciones" onClick={setTab}>Cotizaciones asociadas</TabBtn>
          <TabBtn current={tab} value="historial" onClick={setTab}>Historial</TabBtn>
        </div>

        {tab === "datos" && (
          <section className="bg-white rounded-xl border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Marca" editing={editing} value={form.marca || ""} onChange={(v) => setForm((p: any) => ({ ...p, marca: v }))} />
              <Field label="Modelo" editing={editing} value={form.modelo || ""} onChange={(v) => setForm((p: any) => ({ ...p, modelo: v }))} />
              <Field label="Versión" editing={editing} value={form.version || ""} onChange={(v) => setForm((p: any) => ({ ...p, version: v }))} />
              <Field label="Año" type="number" editing={editing} value={String(form.anio || "")} onChange={(v) => setForm((p: any) => ({ ...p, anio: Number(v) }))} />
              <Field label="Precio lista" type="number" editing={editing} value={String(form.precioLista || "")} onChange={(v) => setForm((p: any) => ({ ...p, precioLista: Number(v) }))} />
              <Field label="Concesionario" editing={editing} value={form.concesionario || ""} onChange={(v) => setForm((p: any) => ({ ...p, concesionario: v }))} />
              <Field label="Valor residual" type="number" editing={editing} value={String(form.valResidEst || "")} onChange={(v) => setForm((p: any) => ({ ...p, valResidEst: v ? Number(v) : null }))} />
              <label className="space-y-1">
                <span className="text-sm">Estado</span>
                {editing ? (
                  <select className="w-full border rounded p-2" value={form.estado || "DISPONIBLE"} onChange={(e) => setForm((p: any) => ({ ...p, estado: e.target.value }))}>
                    <option value="DISPONIBLE">DISPONIBLE</option>
                    <option value="ARCHIVADO">ARCHIVADO</option>
                  </select>
                ) : (
                  <p className="font-medium">{form.estado}</p>
                )}
              </label>
            </div>

            {editing && (
              <div className="flex gap-2">
                <button onClick={guardar} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button onClick={() => { setForm(vehiculo); setEditing(false) }} className="px-4 py-2 border rounded hover:bg-slate-50">Cancelar</button>
              </div>
            )}
          </section>
        )}

        {tab === "simulacion" && (
          <section className="bg-white rounded-xl border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Simulación rápida</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="space-y-1">
                <span className="text-sm">Cuota inicial (%)</span>
                <input type="number" className="w-full border rounded p-2" value={sim.cuotaIniPct} onChange={(e) => setSim((p) => ({ ...p, cuotaIniPct: Number(e.target.value) }))} />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Plazo (meses)</span>
                <input type="number" className="w-full border rounded p-2" value={sim.plazoMeses} onChange={(e) => setSim((p) => ({ ...p, plazoMeses: Number(e.target.value) }))} />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Tasa TEA (%)</span>
                <input type="number" className="w-full border rounded p-2" value={sim.tasaIngresada} onChange={(e) => setSim((p) => ({ ...p, tasaIngresada: Number(e.target.value) }))} />
              </label>
              <label className="space-y-1">
                <span className="text-sm">Moneda</span>
                <select className="w-full border rounded p-2" value={sim.monedaOp} onChange={(e) => setSim((p) => ({ ...p, monedaOp: e.target.value }))}>
                  <option value="PEN">PEN</option>
                  <option value="USD">USD</option>
                </select>
              </label>
            </div>

            <button onClick={simularRapido} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Calcular simulación
            </button>

            {preview && (
              <div className="p-4 border rounded-lg bg-slate-50 space-y-1 text-sm">
                <p>Monto financiado: <strong>{preview.monedaOp} {Number(preview.montoFinanciado).toFixed(2)}</strong></p>
                <p>Cuota estimada: <strong>{preview.monedaOp} {Number(preview.cuotaBase).toFixed(2)}</strong></p>
                <p>TCEA estimada: <strong>{Number(preview.tcea).toFixed(4)}%</strong></p>
                <Link href={`/dashboard/cotizaciones/nueva?vehiculoId=${id}`} className="inline-block mt-2 text-blue-600 hover:underline">
                  Usar estos datos en cotización formal →
                </Link>
              </div>
            )}
          </section>
        )}

        {tab === "cotizaciones" && (
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Cotizaciones asociadas</h2>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Cliente</th>
                  <th className="text-right p-2">Monto financ.</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-2">
                      <Link className="text-blue-600 hover:underline" href={`/dashboard/cotizaciones/${c.id}`}>
                        COT-{c.id}
                      </Link>
                    </td>
                    <td className="p-2">{c.cliente}</td>
                    <td className="p-2 text-right">{Number(c.montoFinanc).toFixed(2)}</td>
                    <td className="p-2">{c.estado}</td>
                    <td className="p-2">{new Date(c.creadoEn).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "historial" && (
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Historial de cambios</h2>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">Fecha/Hora</th>
                  <th className="text-left p-2">Usuario</th>
                  <th className="text-left p-2">Acción</th>
                  <th className="text-left p-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((h) => (
                  <tr key={h.id} className="border-t align-top">
                    <td className="p-2">{new Date(h.fechaHora).toLocaleString("es-PE")}</td>
                    <td className="p-2">{h.usuario}</td>
                    <td className="p-2">{h.accion}</td>
                    <td className="p-2">
                      <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto">{JSON.stringify(h.camposNuevos || {}, null, 2)}</pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  )
}

function TabBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: Tab
  value: Tab
  onClick: (v: Tab) => void
  children: React.ReactNode
}) {
  return (
    <button
      className={`px-3 py-2 rounded text-sm ${current === value ? "bg-blue-600 text-white" : "bg-white border"}`}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  editing,
  value,
  onChange,
  type = "text",
}: {
  label: string
  editing: boolean
  value: any
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm">{label}</span>
      {editing ? (
        <input type={type} className="w-full border rounded p-2" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <p className="font-medium">{value || "—"}</p>
      )}
    </label>
  )
}
