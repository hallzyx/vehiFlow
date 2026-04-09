"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type TipoDoc = "DNI" | "CE" | "PASAPORTE"
type Moneda = "PEN" | "USD"

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [warning, setWarning] = useState<string | null>(null)

  const [form, setForm] = useState({
    tipoDocumento: "DNI" as TipoDoc,
    numDocumento: "",
    nombres: "",
    apPaterno: "",
    apMaterno: "",
    celular: "",
    correo: "",
    direccion: "",
    fecNacimiento: "",
    ingresosMens: "",
    monedaIngres: "PEN" as Moneda,
    situacionLab: "",
    empresaEmpl: "",
  })

  async function verificarDocumento() {
    if (!form.numDocumento.trim()) return
    try {
      const res = await fetch(`/api/clientes?search=${encodeURIComponent(form.numDocumento.trim())}`)
      const data = await res.json()
      if (!res.ok) return
      const match = (data.clientes || []).find((c: any) => c.numDocumento === form.numDocumento.trim())
      if (match) {
        setWarning(
          `Ya existe un cliente con este documento: ${match.nombres} ${match.apPaterno} (${match.tipoDocumento} ${match.numDocumento}).`
        )
      } else {
        setWarning(null)
      }
    } catch {
      // no-op
    }
  }

  async function guardar(guardarYCotizar: boolean) {
    setLoading(true)
    setError("")
    try {
      const payload: any = {
        tipoDocumento: form.tipoDocumento,
        numDocumento: form.numDocumento.trim(),
        nombres: form.nombres.trim(),
        apPaterno: form.apPaterno.trim(),
        apMaterno: form.apMaterno.trim() || null,
        celular: form.celular.trim(),
        correo: form.correo.trim(),
        direccion: form.direccion.trim(),
        fecNacimiento: form.fecNacimiento || null,
        ingresosMens: form.ingresosMens ? Number(form.ingresosMens) : null,
        monedaIngres: form.monedaIngres,
        situacionLab: form.situacionLab || null,
        empresaEmpl: form.empresaEmpl || null,
      }

      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar el cliente")

      if (guardarYCotizar) {
        router.push(`/dashboard/cotizaciones/nueva?clienteId=${data.cliente.id}`)
      } else {
        router.push(`/dashboard/clientes/${data.cliente.id}`)
      }
    } catch (e: any) {
      setError(e.message || "Error guardando cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nuevo cliente</h1>
            <p className="text-sm text-slate-600">Completá los datos del solicitante</p>
          </div>
          <Link href="/dashboard/clientes" className="text-blue-600 hover:underline">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}
        {warning && (
          <div className="p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded">
            {warning}
          </div>
        )}

        <section className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Datos de identificación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm">Tipo de documento</span>
              <select
                className="w-full border rounded p-2"
                value={form.tipoDocumento}
                onChange={(e) => setForm((p) => ({ ...p, tipoDocumento: e.target.value as TipoDoc }))}
              >
                <option value="DNI">DNI</option>
                <option value="CE">CE</option>
                <option value="PASAPORTE">PASAPORTE</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm">Número de documento</span>
              <input
                className="w-full border rounded p-2"
                value={form.numDocumento}
                onChange={(e) => setForm((p) => ({ ...p, numDocumento: e.target.value }))}
                onBlur={verificarDocumento}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Nombres</span>
              <input className="w-full border rounded p-2" value={form.nombres} onChange={(e) => setForm((p) => ({ ...p, nombres: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Apellido paterno</span>
              <input className="w-full border rounded p-2" value={form.apPaterno} onChange={(e) => setForm((p) => ({ ...p, apPaterno: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Apellido materno</span>
              <input className="w-full border rounded p-2" value={form.apMaterno} onChange={(e) => setForm((p) => ({ ...p, apMaterno: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Celular</span>
              <input className="w-full border rounded p-2" value={form.celular} onChange={(e) => setForm((p) => ({ ...p, celular: e.target.value }))} />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm">Correo electrónico</span>
              <input className="w-full border rounded p-2" value={form.correo} onChange={(e) => setForm((p) => ({ ...p, correo: e.target.value }))} />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm">Dirección</span>
              <input className="w-full border rounded p-2" value={form.direccion} onChange={(e) => setForm((p) => ({ ...p, direccion: e.target.value }))} />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Datos complementarios (opcionales)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm">Fecha nacimiento</span>
              <input type="date" className="w-full border rounded p-2" value={form.fecNacimiento} onChange={(e) => setForm((p) => ({ ...p, fecNacimiento: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Ingresos mensuales</span>
              <input type="number" className="w-full border rounded p-2" value={form.ingresosMens} onChange={(e) => setForm((p) => ({ ...p, ingresosMens: e.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-sm">Moneda ingresos</span>
              <select className="w-full border rounded p-2" value={form.monedaIngres} onChange={(e) => setForm((p) => ({ ...p, monedaIngres: e.target.value as Moneda }))}>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm">Situación laboral</span>
              <select className="w-full border rounded p-2" value={form.situacionLab} onChange={(e) => setForm((p) => ({ ...p, situacionLab: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="DEPENDIENTE">DEPENDIENTE</option>
                <option value="INDEPENDIENTE">INDEPENDIENTE</option>
                <option value="OTRO">OTRO</option>
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm">Empresa empleadora</span>
              <input className="w-full border rounded p-2" value={form.empresaEmpl} onChange={(e) => setForm((p) => ({ ...p, empresaEmpl: e.target.value }))} />
            </label>
          </div>
        </section>

        <div className="flex gap-3">
          <button onClick={() => guardar(false)} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Guardando..." : "Guardar cliente"}
          </button>
          <button onClick={() => guardar(true)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">
            Guardar y crear cotización
          </button>
          <Link href="/dashboard/clientes" className="px-4 py-2 border rounded hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </main>
    </div>
  )
}
