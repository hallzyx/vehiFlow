"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type Tab = "datos" | "cotizaciones" | "operaciones" | "historial"

export default function ClienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const searchParams = useSearchParams()
  const [id, setId] = useState("")
  const [cliente, setCliente] = useState<any>(null)
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [operaciones, setOperaciones] = useState<any[]>([])
  const [historial, setHistorial] = useState<any[]>([])
  const [tab, setTab] = useState<Tab>("datos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    params.then(({ id: resolvedId }) => {
      setId(resolvedId)
      cargar(resolvedId)
      if (searchParams.get("edit") === "1") setEditing(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  async function cargar(clienteId: string) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/clientes/${clienteId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar cliente")
      setCliente(data.cliente)
      setCotizaciones(data.cotizaciones || [])
      setOperaciones(data.operaciones || [])
      setHistorial(data.historial || [])
      setForm(data.cliente)
    } catch (e: any) {
      setError(e.message || "Error cargando cliente")
    } finally {
      setLoading(false)
    }
  }

  const cambios = useMemo(() => {
    if (!cliente || !form) return []
    const entries: Array<{ campo: string; antes: any; despues: any }> = []
    const campos = [
      "nombres",
      "apPaterno",
      "apMaterno",
      "celular",
      "correo",
      "direccion",
      "ingresosMens",
      "monedaIngres",
      "situacionLab",
      "empresaEmpl",
    ]
    for (const key of campos) {
      const before = cliente[key] ?? null
      const after = form[key] ?? null
      if (String(before) !== String(after)) {
        entries.push({ campo: key, antes: before, despues: after })
      }
    }
    return entries
  }, [cliente, form])

  async function guardar() {
    if (!id || !form) return
    if (cambios.length === 0) {
      setEditing(false)
      return
    }

    const resumen = cambios
      .map((c) => `- ${c.campo}: ${c.antes ?? "(vacío)"} → ${c.despues ?? "(vacío)"}`)
      .join("\n")

    const ok = window.confirm(`Cambios detectados:\n${resumen}\n\n¿Confirmar cambios?`)
    if (!ok) return

    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar")
      await cargar(id)
      setEditing(false)
    } catch (e: any) {
      setError(e.message || "Error guardando cambios")
    } finally {
      setSaving(false)
    }
  }

  async function archivar() {
    if (!id || !cliente) return
    if (!window.confirm("¿Archivar cliente?")) return
    try {
      const res = await fetch(`/api/clientes/${id}`, {
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

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Cargando cliente...</div>
  }

  if (!cliente) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Cliente no encontrado</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cliente.nombres} {cliente.apPaterno}</h1>
            <p className="text-sm text-slate-600">
              {cliente.tipoDocumento} {cliente.numDocumento} | {cliente.celular} | {cliente.correo}
            </p>
            <p className="text-xs text-slate-500">
              Registrado: {new Date(cliente.creadoEn).toLocaleDateString("es-PE")} | Estado: {cliente.estado}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing((v) => !v)} className="px-3 py-2 border rounded hover:bg-slate-50">
              {editing ? "Cancelar edición" : "Editar"}
            </button>
            {cliente.estado !== "ARCHIVADO" && (
              <button onClick={archivar} className="px-3 py-2 border border-amber-300 text-amber-700 rounded hover:bg-amber-50">
                Archivar
              </button>
            )}
            <Link href="/dashboard/clientes" className="px-3 py-2 border rounded hover:bg-slate-50">
              Volver
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}

        <div className="flex gap-2 flex-wrap">
          <TabBtn current={tab} value="datos" onClick={setTab}>Datos personales</TabBtn>
          <TabBtn current={tab} value="cotizaciones" onClick={setTab}>Cotizaciones</TabBtn>
          <TabBtn current={tab} value="operaciones" onClick={setTab}>Operaciones</TabBtn>
          <TabBtn current={tab} value="historial" onClick={setTab}>Historial de cambios</TabBtn>
        </div>

        {tab === "datos" && (
          <section className="bg-white rounded-xl border p-6 space-y-4">
            {editing && cambios.length > 0 && (
              <div className="p-3 border border-blue-200 bg-blue-50 text-blue-800 rounded text-sm">
                {cambios.length} campo(s) modificado(s) antes de guardar.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nombres" editing={editing} changed={isChanged(cliente, form, "nombres")} value={form.nombres} onChange={(v) => setForm((p: any) => ({ ...p, nombres: v }))} />
              <Field label="Apellido paterno" editing={editing} changed={isChanged(cliente, form, "apPaterno")} value={form.apPaterno} onChange={(v) => setForm((p: any) => ({ ...p, apPaterno: v }))} />
              <Field label="Apellido materno" editing={editing} changed={isChanged(cliente, form, "apMaterno")} value={form.apMaterno || ""} onChange={(v) => setForm((p: any) => ({ ...p, apMaterno: v }))} />
              <Field label="Celular" editing={editing} changed={isChanged(cliente, form, "celular")} value={form.celular} onChange={(v) => setForm((p: any) => ({ ...p, celular: v }))} />
              <Field label="Correo" editing={editing} changed={isChanged(cliente, form, "correo")} value={form.correo} onChange={(v) => setForm((p: any) => ({ ...p, correo: v }))} />
              <Field label="Dirección" editing={editing} changed={isChanged(cliente, form, "direccion")} value={form.direccion} onChange={(v) => setForm((p: any) => ({ ...p, direccion: v }))} />
              <Field label="Ingresos mensuales" editing={editing} changed={isChanged(cliente, form, "ingresosMens")} value={form.ingresosMens ?? ""} onChange={(v) => setForm((p: any) => ({ ...p, ingresosMens: v ? Number(v) : null }))} type="number" />
              <label className="space-y-1">
                <span className="text-sm">Moneda ingresos</span>
                {editing ? (
                  <select className={`w-full border rounded p-2 ${isChanged(cliente, form, "monedaIngres") ? "border-blue-500" : ""}`} value={form.monedaIngres || ""} onChange={(e) => setForm((p: any) => ({ ...p, monedaIngres: e.target.value || null }))}>
                    <option value="">(vacío)</option>
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                  </select>
                ) : (
                  <p className="font-medium">{form.monedaIngres || "—"}</p>
                )}
              </label>
              <Field label="Situación laboral" editing={editing} changed={isChanged(cliente, form, "situacionLab")} value={form.situacionLab || ""} onChange={(v) => setForm((p: any) => ({ ...p, situacionLab: v }))} />
              <Field label="Empresa" editing={editing} changed={isChanged(cliente, form, "empresaEmpl")} value={form.empresaEmpl || ""} onChange={(v) => setForm((p: any) => ({ ...p, empresaEmpl: v }))} />
            </div>

            {editing && (
              <div className="flex gap-2">
                <button onClick={guardar} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
                <button onClick={() => { setForm(cliente); setEditing(false) }} className="px-4 py-2 border rounded hover:bg-slate-50">
                  Cancelar
                </button>
              </div>
            )}
          </section>
        )}

        {tab === "cotizaciones" && (
          <section className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Cotizaciones asociadas</h2>
              <Link href={`/dashboard/cotizaciones/nueva?clienteId=${id}`} className="text-blue-600 hover:underline text-sm">
                Nueva cotización para este cliente
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Vehículo</th>
                  <th className="text-right p-2">Monto financ.</th>
                  <th className="text-right p-2">TCEA</th>
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
                    <td className="p-2">{c.vehiculo}</td>
                    <td className="p-2 text-right">{Number(c.montoFinanc).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(c.tcea).toFixed(4)}%</td>
                    <td className="p-2">{c.estado}</td>
                    <td className="p-2">{new Date(c.creadoEn).toLocaleDateString("es-PE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {tab === "operaciones" && (
          <section className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Operaciones</h2>
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Vehículo</th>
                  <th className="text-right p-2">Saldo pendiente</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Próx. referencia</th>
                </tr>
              </thead>
              <tbody>
                {operaciones.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">OPE-{o.id}</td>
                    <td className="p-2">{o.vehiculo}</td>
                    <td className="p-2 text-right">{Number(o.saldoActual).toFixed(2)}</td>
                    <td className="p-2">{o.estadoOp}</td>
                    <td className="p-2">{o.fecTermino ? new Date(o.fecTermino).toLocaleDateString("es-PE") : "—"}</td>
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

function isChanged(original: any, form: any, key: string) {
  if (!original || !form) return false
  return String(original[key] ?? "") !== String(form[key] ?? "")
}

function Field({
  label,
  editing,
  changed,
  value,
  onChange,
  type = "text",
}: {
  label: string
  editing: boolean
  changed: boolean
  value: any
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="space-y-1">
      <span className="text-sm">{label}</span>
      {editing ? (
        <input
          type={type}
          className={`w-full border rounded p-2 ${changed ? "border-blue-500 bg-blue-50" : ""}`}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="font-medium">{value || "—"}</p>
      )}
    </label>
  )
}
