"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

type Modalidad = "REDUCIR_PLAZO" | "REDUCIR_CUOTA"
type CanalPago = "VENTANILLA" | "TRANSFERENCIA" | "APP" | "DEBITO_AUTOMATICO" | "OTRO"

export default function PagosAnticipadosPage() {
  const [operaciones, setOperaciones] = useState<any[]>([])
  const [selectedOperacionId, setSelectedOperacionId] = useState<string>("")
  const [operacion, setOperacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    fechaPago: new Date().toISOString().slice(0, 10),
    montoPago: "",
    canalPago: "VENTANILLA" as CanalPago,
    referencia: "",
    modalidad: "REDUCIR_PLAZO" as Modalidad,
    observaciones: "",
  })

  const [verificacion, setVerificacion] = useState<any>(null)
  const [recalculo, setRecalculo] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarOperaciones()
  }, [])

  useEffect(() => {
    if (!selectedOperacionId) {
      setOperacion(null)
      return
    }
    cargarOperacion(selectedOperacionId)
  }, [selectedOperacionId])

  async function cargarOperaciones() {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/operaciones")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar operaciones")
      setOperaciones(data.operaciones || [])
      if ((data.operaciones || []).length > 0) {
        setSelectedOperacionId((data.operaciones[0] as any).id)
      }
    } catch (e: any) {
      setError(e.message || "Error cargando operaciones")
    } finally {
      setLoading(false)
    }
  }

  async function cargarOperacion(id: string) {
    setError("")
    try {
      const res = await fetch(`/api/operaciones/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar operación")
      setOperacion(data.operacion)
      setVerificacion(null)
      setRecalculo(null)
      setStep(1)
      setSuccess("")
    } catch (e: any) {
      setError(e.message || "Error cargando operación")
    }
  }

  async function verificarPago() {
    if (!selectedOperacionId) return
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/operaciones/${selectedOperacionId}/pago-anticipado/verificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoPago: Number(form.montoPago),
          fechaPago: form.fechaPago,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo verificar")
      setVerificacion(data)
      setStep(2)
    } catch (e: any) {
      setError(e.message || "Error verificando pago")
    }
  }

  async function recalcular(modalidad: Modalidad) {
    if (!selectedOperacionId) return
    setError("")
    setForm((prev) => ({ ...prev, modalidad }))
    try {
      const res = await fetch(`/api/operaciones/${selectedOperacionId}/pago-anticipado/recalcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoPago: Number(form.montoPago),
          fechaPago: form.fechaPago,
          modalidad,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo recalcular")
      setRecalculo(data)
      setStep(3)
    } catch (e: any) {
      setError(e.message || "Error recalculando")
    }
  }

  async function confirmarPago() {
    if (!selectedOperacionId) return
    setGuardando(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`/api/operaciones/${selectedOperacionId}/pago-anticipado/confirmar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoPago: Number(form.montoPago),
          fechaPago: form.fechaPago,
          canalPago: form.canalPago,
          referencia: form.referencia,
          modalidad: form.modalidad,
          observaciones: form.observaciones,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo confirmar")
      setSuccess(
        `✓ Pago anticipado registrado. Constancia: ${data.constancia.id}. Penalidad aplicada: S/ 0.00`
      )
      setStep(1)
      setForm((prev) => ({ ...prev, montoPago: "", referencia: "", observaciones: "" }))
      await cargarOperaciones()
      if (selectedOperacionId) {
        await cargarOperacion(selectedOperacionId)
      }
    } catch (e: any) {
      setError(e.message || "Error confirmando pago")
    } finally {
      setGuardando(false)
    }
  }

  const moneda = operacion?.cotizacion?.monedaOp || "PEN"

  const cronogramaPreview = useMemo(() => {
    if (!recalculo?.seleccionado?.cronograma) return []
    return recalculo.seleccionado.cronograma.slice(0, 5)
  }, [recalculo])

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pagos anticipados</h1>
            <p className="text-sm text-slate-600">Userflow 3 — Sin penalidad (Ley 29571 Art. 85)</p>
          </div>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Volver al dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>}
        {success && <div className="p-3 rounded border border-green-200 bg-green-50 text-green-700">{success}</div>}

        <section className="bg-white rounded-xl border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm">Operación activa</span>
              <select
                value={selectedOperacionId}
                onChange={(e) => setSelectedOperacionId(e.target.value)}
                className="w-full border rounded p-2"
                disabled={loading || operaciones.length === 0}
              >
                {operaciones.length === 0 ? (
                  <option value="">No hay operaciones activas</option>
                ) : (
                  operaciones.map((op) => (
                    <option key={op.id} value={op.id}>
                      OPE #{op.id} — {op.cliente.nombres} {op.cliente.apPaterno} — {op.vehiculo.marca} {op.vehiculo.modelo}
                    </option>
                  ))
                )}
              </select>
            </label>
            {operacion && (
              <div className="text-sm bg-slate-50 border rounded p-3">
                <p>
                  <span className="text-slate-500">Saldo capital: </span>
                  <strong>
                    {moneda} {Number(operacion.saldoActual).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Cuota exigible: </span>
                  <strong>
                    {moneda} {Number(operacion.contexto.cuotaExigible).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Cuotas restantes: </span>
                  <strong>{operacion.contexto.cuotasRestantes}</strong>
                </p>
              </div>
            )}
          </div>
        </section>

        {operacion && (
          <>
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Paso 1 — Verificación del pago extraordinario</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="space-y-1">
                  <span className="text-sm">Fecha pago</span>
                  <input
                    type="date"
                    className="w-full border rounded p-2"
                    value={form.fechaPago}
                    onChange={(e) => setForm((p) => ({ ...p, fechaPago: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Monto pago</span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    placeholder="8000"
                    value={form.montoPago}
                    onChange={(e) => setForm((p) => ({ ...p, montoPago: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Canal pago</span>
                  <select
                    className="w-full border rounded p-2"
                    value={form.canalPago}
                    onChange={(e) => setForm((p) => ({ ...p, canalPago: e.target.value as CanalPago }))}
                  >
                    <option value="VENTANILLA">Ventanilla</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="APP">App</option>
                    <option value="DEBITO_AUTOMATICO">Débito automático</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Referencia</span>
                  <input
                    className="w-full border rounded p-2"
                    placeholder="TRF-00982341"
                    value={form.referencia}
                    onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={verificarPago}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Verificar pago
                </button>
                <span className="text-xs text-slate-600">
                  Penalidad por anticipado: <strong>S/ 0.00</strong> (no negociable)
                </span>
              </div>

              {verificacion && (
                <div className="mt-4 p-4 border rounded-lg bg-slate-50 text-sm">
                  <p className="font-medium mb-2">Análisis del pago</p>
                  <p>Tipo: <strong>{verificacion.analisis.tipoPago}</strong></p>
                  <p>Cuota exigible: {moneda} {Number(verificacion.contexto.cuotaExigible).toFixed(2)}</p>
                  <p>Excedente: {moneda} {Number(verificacion.analisis.excedente).toFixed(2)}</p>
                  <p>Interés al día ({verificacion.analisis.diasDevengados} días): {moneda} {Number(verificacion.analisis.interesDia).toFixed(2)}</p>
                  <p>Capital amortizado: {moneda} {Number(verificacion.analisis.capitalAmortizado).toFixed(2)}</p>
                  <p>Saldo nuevo estimado: {moneda} {Number(verificacion.analisis.saldoNuevo).toFixed(2)}</p>
                </div>
              )}
            </section>

            {step >= 2 && verificacion && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Paso 2 — Elección del cliente (modalidad)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => recalcular("REDUCIR_PLAZO")}
                    className={`text-left border rounded-lg p-4 hover:border-blue-500 ${
                      form.modalidad === "REDUCIR_PLAZO" ? "border-blue-600 bg-blue-50" : ""
                    }`}
                  >
                    <p className="font-semibold">Opción A: Reducir plazo</p>
                    <p className="text-sm text-slate-600">Mantiene la cuota y termina antes</p>
                  </button>
                  <button
                    onClick={() => recalcular("REDUCIR_CUOTA")}
                    className={`text-left border rounded-lg p-4 hover:border-blue-500 ${
                      form.modalidad === "REDUCIR_CUOTA" ? "border-blue-600 bg-blue-50" : ""
                    }`}
                  >
                    <p className="font-semibold">Opción B: Reducir cuota</p>
                    <p className="text-sm text-slate-600">Mantiene plazo y baja la cuota mensual</p>
                  </button>
                </div>

                <label className="block mt-4 space-y-1">
                  <span className="text-sm">Observaciones (opcional)</span>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    value={form.observaciones}
                    onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                    placeholder="Comentario de la decisión del cliente"
                  />
                </label>
              </section>
            )}

            {step >= 3 && recalculo && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Paso 3 — Cronograma recalculado y confirmación</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Modalidad</p>
                    <p className="font-semibold">{recalculo.seleccionado.modalidad}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Nueva TCEA</p>
                    <p className="font-semibold">{Number(recalculo.seleccionado.indicadores.tcea).toFixed(4)}%</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Ahorro intereses</p>
                    <p className="font-semibold">
                      {moneda} {Number(recalculo.seleccionado.indicadores.ahorroIntereses).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {recalculo.seleccionado.indicadores.tirNoConverge && (
                  <div className="mt-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    La TIR no convergió para este recalculo residual. Se permite guardar igual y queda trazado en auditoría.
                  </div>
                )}

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-2">N°</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-right p-2">Saldo inicial</th>
                        <th className="text-right p-2">Interés</th>
                        <th className="text-right p-2">Amort.</th>
                        <th className="text-right p-2">Cuota total</th>
                        <th className="text-right p-2">Saldo final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cronogramaPreview.map((q: any) => (
                        <tr key={q.numero} className="border-t">
                          <td className="p-2">{q.numero}</td>
                          <td className="p-2">{q.tipoCuota}</td>
                          <td className="p-2">{new Date(q.fechaVencimiento).toLocaleDateString("es-PE")}</td>
                          <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">{Number(q.cuotaTotal).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={confirmarPago}
                    disabled={guardando}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-60"
                  >
                    {guardando ? "Guardando..." : "Confirmar y guardar"}
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="px-4 py-2 border rounded hover:bg-slate-50"
                  >
                    Cambiar modalidad
                  </button>
                </div>
              </section>
            )}

            {operacion?.pagos?.length > 0 && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-2">Fecha</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-right p-2">Monto</th>
                        <th className="text-right p-2">Capital aplicado</th>
                        <th className="text-left p-2">Modalidad</th>
                        <th className="text-right p-2">Penalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {operacion.pagos.map((p: any) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-2">{new Date(p.fechaPago).toLocaleDateString("es-PE")}</td>
                          <td className="p-2">{p.tipoPago}</td>
                          <td className="p-2 text-right">{Number(p.montoTotal).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(p.capitalAmort).toFixed(2)}</td>
                          <td className="p-2">{p.modalidad || "—"}</td>
                          <td className="p-2 text-right">{Number(p.penalidad).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  )
}
