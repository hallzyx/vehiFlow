"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

type Moneda = "PEN" | "USD"

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    marca: "",
    modelo: "",
    version: "",
    anio: new Date().getFullYear(),
    precioLista: "",
    monedaPrecio: "PEN" as Moneda,
    concesionario: "",
    valResidEst: "",
    tipoValResid: "MONTO" as "MONTO" | "PORCENTAJE",
    tipoVehiculo: "",
    transmision: "",
    combustible: "",
  })

  async function guardar(guardarYSimular: boolean) {
    setLoading(true)
    setError("")
    try {
      const payload: any = {
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        version: form.version.trim() || null,
        anio: Number(form.anio),
        precioLista: Number(form.precioLista),
        monedaPrecio: form.monedaPrecio,
        concesionario: form.concesionario.trim(),
        valResidEst: form.valResidEst ? Number(form.valResidEst) : null,
        tipoValResid: form.valResidEst ? form.tipoValResid : null,
        tipoVehiculo: form.tipoVehiculo || null,
        transmision: form.transmision || null,
        combustible: form.combustible || null,
      }

      const res = await fetch("/api/vehiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo guardar")

      if (guardarYSimular) {
        router.push(`/dashboard/cotizaciones/nueva?vehiculoId=${data.vehiculo.id}`)
      } else {
        router.push(`/dashboard/vehiculos/${data.vehiculo.id}`)
      }
    } catch (e: any) {
      setError(e.message || "Error guardando vehículo")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nuevo vehículo</h1>
            <p className="text-sm text-slate-600">Registrar ficha de vehículo</p>
          </div>
          <Link href="/dashboard/vehiculos" className="text-blue-600 hover:underline">
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {error && <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded">{error}</div>}

        <section className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Identificación del vehículo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Marca" value={form.marca} onChange={(v) => setForm((p) => ({ ...p, marca: v }))} />
            <Input label="Modelo" value={form.modelo} onChange={(v) => setForm((p) => ({ ...p, modelo: v }))} />
            <Input label="Versión / Trim" value={form.version} onChange={(v) => setForm((p) => ({ ...p, version: v }))} />
            <Input label="Año" type="number" value={String(form.anio)} onChange={(v) => setForm((p) => ({ ...p, anio: Number(v) }))} />
            <Input label="Precio lista" type="number" value={form.precioLista} onChange={(v) => setForm((p) => ({ ...p, precioLista: v }))} />
            <label className="space-y-1">
              <span className="text-sm">Moneda precio</span>
              <select className="w-full border rounded p-2" value={form.monedaPrecio} onChange={(e) => setForm((p) => ({ ...p, monedaPrecio: e.target.value as Moneda }))}>
                <option value="PEN">PEN</option>
                <option value="USD">USD</option>
              </select>
            </label>
            <Input label="Concesionario" value={form.concesionario} onChange={(v) => setForm((p) => ({ ...p, concesionario: v }))} className="md:col-span-2" />
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Compra Inteligente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Valor residual estimado" type="number" value={form.valResidEst} onChange={(v) => setForm((p) => ({ ...p, valResidEst: v }))} />
            <label className="space-y-1">
              <span className="text-sm">Tipo de valor residual</span>
              <select className="w-full border rounded p-2" value={form.tipoValResid} onChange={(e) => setForm((p) => ({ ...p, tipoValResid: e.target.value as "MONTO" | "PORCENTAJE" }))}>
                <option value="MONTO">Monto fijo</option>
                <option value="PORCENTAJE">Porcentaje</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-slate-600">
            Es el monto que el cliente pagará al final del plazo para conservar el vehículo.
          </p>
        </section>

        <section className="bg-white rounded-xl border p-6 space-y-4">
          <h2 className="text-lg font-semibold">Información adicional</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="space-y-1">
              <span className="text-sm">Tipo vehículo</span>
              <select className="w-full border rounded p-2" value={form.tipoVehiculo} onChange={(e) => setForm((p) => ({ ...p, tipoVehiculo: e.target.value }))}>
                <option value="">(opcional)</option>
                <option value="SEDAN">SEDAN</option>
                <option value="SUV">SUV</option>
                <option value="CAMIONETA">CAMIONETA</option>
                <option value="PICKUP">PICKUP</option>
                <option value="HATCHBACK">HATCHBACK</option>
                <option value="COUPE">COUPE</option>
                <option value="STATION_WAGON">STATION_WAGON</option>
                <option value="VAN">VAN</option>
                <option value="OTRO">OTRO</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm">Transmisión</span>
              <select className="w-full border rounded p-2" value={form.transmision} onChange={(e) => setForm((p) => ({ ...p, transmision: e.target.value }))}>
                <option value="">(opcional)</option>
                <option value="MANUAL">MANUAL</option>
                <option value="AUTOMATICA">AUTOMATICA</option>
                <option value="CVT">CVT</option>
                <option value="DUAL">DUAL</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm">Combustible</span>
              <select className="w-full border rounded p-2" value={form.combustible} onChange={(e) => setForm((p) => ({ ...p, combustible: e.target.value }))}>
                <option value="">(opcional)</option>
                <option value="GASOLINA">GASOLINA</option>
                <option value="DIESEL">DIESEL</option>
                <option value="HIBRIDO">HIBRIDO</option>
                <option value="ELECTRICO">ELECTRICO</option>
                <option value="GLP">GLP</option>
              </select>
            </label>
          </div>
        </section>

        <div className="flex gap-3">
          <button onClick={() => guardar(false)} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60">
            {loading ? "Guardando..." : "Guardar vehículo"}
          </button>
          <button onClick={() => guardar(true)} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60">
            Guardar y simular crédito
          </button>
          <Link href="/dashboard/vehiculos" className="px-4 py-2 border rounded hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </main>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  className?: string
}) {
  return (
    <label className={`space-y-1 ${className}`}>
      <span className="text-sm">{label}</span>
      <input type={type} className="w-full border rounded p-2" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}
