"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

type Modalidad = "REDUCIR_PLAZO" | "REDUCIR_CUOTA"
type CanalPago = "VENTANILLA" | "TRANSFERENCIA" | "APP" | "DEBITO_AUTOMATICO" | "OTRO"

export default function PagosAnticipadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
          Cargando pagos anticipados...
        </div>
      }
    >
      <PagosAnticipadosContent />
    </Suspense>
  )
}

function PagosAnticipadosContent() {
  const searchParams = useSearchParams()
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
    modalidad: null as Modalidad | null,
    observaciones: "",
  })

  const [verificacion, setVerificacion] = useState<any>(null)
  const [recalculo, setRecalculo] = useState<any>(null)
  const [guardando, setGuardando] = useState(false)
  const [recalculando, setRecalculando] = useState(false)
  const [constancia, setConstancia] = useState<any>(null)

  const hoyIso = new Date().toISOString().slice(0, 10)

  const nombreCliente = (c: any) =>
    [c?.nombres, c?.apPaterno, c?.apMaterno].filter(Boolean).join(" ") || "Cliente"

  const volverHref = useMemo(() => {
    const cotizacionId = operacion?.cotizacion?.id
    if (cotizacionId) return `/dashboard/cotizaciones/${cotizacionId}`
    return "/dashboard/cotizaciones"
  }, [operacion?.cotizacion?.id])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      try {
        const res = await fetch("/api/operaciones")
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "No se pudo cargar operaciones")
        if (cancelled) return

        const list = data.operaciones || []
        setOperaciones(list)
        if (list.length > 0) {
          const requestedOperacionId = searchParams.get("operacionId")
          const exists = requestedOperacionId
            ? list.some((op: any) => String(op.id) === String(requestedOperacionId))
            : false
          setSelectedOperacionId(exists ? String(requestedOperacionId) : String(list[0].id))
        } else {
          setSelectedOperacionId("")
        }
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error cargando operaciones")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedOperacionId) {
      setOperacion(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setError("")
      try {
        const res = await fetch(`/api/operaciones/${selectedOperacionId}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "No se pudo cargar operación")
        if (cancelled) return
        setOperacion(data.operacion)
        setVerificacion(null)
        setRecalculo(null)
        setStep(1)
        setSuccess("")
        setConstancia(null)
      } catch (e: any) {
        if (!cancelled) setError(e.message || "Error cargando operación")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedOperacionId])

  function invalidarAnalisisPago() {
    setVerificacion(null)
    setRecalculo(null)
    setStep(1)
    setForm((prev) => ({ ...prev, modalidad: null }))
    setError("")
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
      setRecalculo(null)
      setForm((prev) => ({ ...prev, modalidad: null }))
      setStep(2)
    } catch (e: any) {
      setError(e.message || "Error verificando pago")
    }
  }

  function elegirModalidad(modalidad: Modalidad) {
    setError("")
    setRecalculo(null)
    setForm((prev) => ({
      ...prev,
      // Clic en la misma opción la deselecciona
      modalidad: prev.modalidad === modalidad ? null : modalidad,
    }))
    if (step === 3) setStep(2)
  }

  async function confirmarModalidad() {
    if (!selectedOperacionId || !form.modalidad) {
      setError("Seleccione una modalidad (reducir plazo o reducir cuota) antes de continuar.")
      return
    }
    setError("")
    setRecalculando(true)
    try {
      const res = await fetch(`/api/operaciones/${selectedOperacionId}/pago-anticipado/recalcular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          montoPago: Number(form.montoPago),
          fechaPago: form.fechaPago,
          modalidad: form.modalidad,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo recalcular")
      setRecalculo(data)
      setStep(3)
    } catch (e: any) {
      setError(e.message || "Error recalculando")
    } finally {
      setRecalculando(false)
    }
  }

  async function confirmarPago() {
    if (!selectedOperacionId || !form.modalidad) return
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
        `Pago anticipado registrado. Constancia ${data.constancia.id}. Penalidad aplicada: S/ 0.00 (Ley 29571 Art. 85).`
      )
      setConstancia(data.constancia)
      setStep(1)
      setVerificacion(null)
      setRecalculo(null)
      setForm((prev) => ({
        ...prev,
        montoPago: "",
        referencia: "",
        observaciones: "",
        modalidad: null,
      }))
      const refresh = await fetch(`/api/operaciones/${selectedOperacionId}`)
      const refreshData = await refresh.json()
      if (refresh.ok) setOperacion(refreshData.operacion)
    } catch (e: any) {
      setError(e.message || "Error confirmando pago")
    } finally {
      setGuardando(false)
    }
  }

  const moneda = operacion?.cotizacion?.monedaOp || "PEN"

  const cronogramaCompleto = recalculo?.seleccionado?.cronograma ?? []
  const totalCuotasCronograma =
    Number(recalculo?.seleccionado?.totalCuotas) ||
    Number(recalculo?.seleccionado?.nuevoPlazoMeses) ||
    cronogramaCompleto.length

  const cronogramaPreview = useMemo(() => {
    const rows = recalculo?.seleccionado?.cronograma
    if (!rows?.length) return []
    if (rows.length <= 6) return rows
    return [
      ...rows.slice(0, 3),
      { __ellipsis: true, numero: "…" },
      ...rows.slice(-2),
    ]
  }, [recalculo])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">
        Cargando pagos anticipados...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pagos anticipados</h1>
            <p className="text-sm text-slate-600">
              Derecho del cliente a pagar por encima de la cuota exigible, con reducción de intereses al
              día de pago y <strong>sin penalidad</strong> (Ley 29571 Art. 85° / SBS).
            </p>
          </div>
          <Link href={volverHref} className="shrink-0 text-blue-600 hover:underline text-sm">
            Volver a la cotización
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <strong>Penalidad / comisión por anticipado: S/ 0.00</strong> — valor fijo no negociable. El
          sistema diferencia cuota normal, anticipado parcial y cancelación total; la modalidad de
          recalculo (plazo o cuota) la elige el cliente y queda registrada en base de datos.
        </div>

        {error && <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700">{error}</div>}
        {success && <div className="p-3 rounded border border-green-200 bg-green-50 text-green-700">{success}</div>}
        {constancia && (
          <div className="p-3 rounded border border-slate-200 bg-white text-sm text-slate-700">
            <p className="font-medium text-slate-900">Constancia de decisión del cliente</p>
            <p>
              ID: <strong>{constancia.id}</strong> · Modalidad: <strong>{constancia.modalidad}</strong> ·
              Monto: {moneda} {Number(constancia.montoPago).toLocaleString("es-PE", { minimumFractionDigits: 2 })} ·
              Penalidad: S/ {Number(constancia.penalidad).toFixed(2)}
            </p>
          </div>
        )}

        <section className="bg-white rounded-xl border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-sm">Operación activa</span>
              <select
                value={selectedOperacionId}
                onChange={(e) => setSelectedOperacionId(e.target.value)}
                className="w-full border rounded p-2"
                disabled={operaciones.length === 0}
              >
                {operaciones.length === 0 ? (
                  <option value="">No hay operaciones activas</option>
                ) : (
                  operaciones.map((op) => (
                    <option key={op.id} value={op.id}>
                      OPE #{op.id} — {nombreCliente(op.cliente)} — {op.vehiculo.marca} {op.vehiculo.modelo}
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
                    {moneda}{" "}
                    {Number(operacion.saldoActual).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </strong>
                </p>
                <p>
                  <span className="text-slate-500">Cuota exigible: </span>
                  <strong>
                    {moneda}{" "}
                    {Number(operacion.contexto.cuotaExigible).toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                    })}
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
              <h2 className="text-lg font-semibold mb-1">Paso 1 — Verificación del pago extraordinario</h2>
              <p className="text-sm text-slate-600 mb-4">
                Clasifica el monto frente a la cuota exigible (cuota normal, anticipado parcial o cancelación
                total) y calcula intereses al día de pago.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <label className="space-y-1">
                  <span className="text-sm" title="Fecha real del abono. No puede ser futura.">
                    Fecha pago
                  </span>
                  <input
                    type="date"
                    max={hoyIso}
                    className="w-full border rounded p-2"
                    value={form.fechaPago}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, fechaPago: e.target.value }))
                      invalidarAnalisisPago()
                    }}
                  />
                </label>
                <label className="space-y-1">
                  <span
                    className="text-sm"
                    title="Si supera la cuota exigible, el excedente es pago anticipado de capital."
                  >
                    Monto pago
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="w-full border rounded p-2"
                    placeholder="8000"
                    value={form.montoPago}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, montoPago: e.target.value }))
                      invalidarAnalisisPago()
                    }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm" title="Canal por el que ingresó el pago al banco.">
                    Canal pago
                  </span>
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
                  <span className="text-sm" title="Número de operación o referencia bancaria del abono.">
                    Referencia
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    placeholder="TRF-00982341"
                    value={form.referencia}
                    onChange={(e) => setForm((p) => ({ ...p, referencia: e.target.value }))}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={verificarPago}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Verificar pago
                </button>
                <span className="text-xs text-slate-600">
                  Penalidad: <strong>S/ 0.00</strong> (Art. 85° — no negociable)
                </span>
              </div>

              {verificacion && (
                <div className="mt-4 p-4 border rounded-lg bg-slate-50 text-sm space-y-1">
                  <p className="font-medium mb-2">Análisis del pago (rúbrica / SBS)</p>
                  <p>
                    Tipo: <strong>{verificacion.analisis.tipoPago}</strong>
                  </p>
                  <p>
                    Cuota exigible: {moneda} {Number(verificacion.contexto.cuotaExigible).toFixed(2)}
                  </p>
                  <p>
                    Excedente (capital anticipado): {moneda}{" "}
                    {Number(verificacion.analisis.excedente).toFixed(2)}
                  </p>
                  <p>
                    Interés al día ({verificacion.analisis.diasDevengados} días): {moneda}{" "}
                    {Number(verificacion.analisis.interesDia).toFixed(2)}
                  </p>
                  <p>
                    Capital amortizado: {moneda} {Number(verificacion.analisis.capitalAmortizado).toFixed(2)}
                  </p>
                  <p>
                    Saldo nuevo estimado: {moneda} {Number(verificacion.analisis.saldoNuevo).toFixed(2)}
                  </p>
                  <p className="pt-2 text-emerald-800">
                    {verificacion.normativa?.mensaje ||
                      "No se aplicará ninguna penalidad ni comisión por pago anticipado."}
                  </p>
                </div>
              )}
            </section>

            {step >= 2 && verificacion && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-1">Paso 2 — Elección del cliente (modalidad)</h2>
                <p className="text-sm text-slate-600 mb-4">
                  La SBS exige que el cliente elija cómo aplicar el excedente. La decisión queda registrada
                  en la constancia y en el historial de la operación.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => elegirModalidad("REDUCIR_PLAZO")}
                    className={`text-left border rounded-lg p-4 hover:border-blue-500 ${
                      form.modalidad === "REDUCIR_PLAZO" ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <p className="font-semibold">Opción A: Reducir plazo</p>
                    <p className="text-sm text-slate-600">Mantiene el monto de cuota y termina antes</p>
                    {recalculo?.previewOpciones?.REDUCIR_PLAZO && (
                      <p className="mt-2 text-xs text-slate-500">
                        Plazo → {recalculo.previewOpciones.REDUCIR_PLAZO.plazoMeses} meses · Ahorro intereses{" "}
                        {moneda}{" "}
                        {Number(recalculo.previewOpciones.REDUCIR_PLAZO.ahorroIntereses).toFixed(2)}
                      </p>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => elegirModalidad("REDUCIR_CUOTA")}
                    className={`text-left border rounded-lg p-4 hover:border-blue-500 ${
                      form.modalidad === "REDUCIR_CUOTA" ? "border-blue-600 bg-blue-50" : "border-slate-200"
                    }`}
                  >
                    <p className="font-semibold">Opción B: Reducir cuota</p>
                    <p className="text-sm text-slate-600">Mantiene el plazo y baja la cuota mensual</p>
                    {recalculo?.previewOpciones?.REDUCIR_CUOTA && (
                      <p className="mt-2 text-xs text-slate-500">
                        Plazo → {recalculo.previewOpciones.REDUCIR_CUOTA.plazoMeses} meses · Cuota →{" "}
                        {moneda} {Number(recalculo.previewOpciones.REDUCIR_CUOTA.cuota).toFixed(2)} ·
                        Ahorro intereses {moneda}{" "}
                        {Number(recalculo.previewOpciones.REDUCIR_CUOTA.ahorroIntereses).toFixed(2)}
                      </p>
                    )}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Ninguna opción viene preseleccionada. Elija A o B (clic de nuevo para deseleccionar) y
                  confirme para ver el cronograma.
                </p>

                <label className="block mt-4 space-y-1">
                  <span className="text-sm">Observaciones / declaración de voluntad (opcional)</span>
                  <textarea
                    className="w-full border rounded p-2"
                    rows={3}
                    value={form.observaciones}
                    onChange={(e) => setForm((p) => ({ ...p, observaciones: e.target.value }))}
                    placeholder="Ej.: Cliente elige reducir plazo según Art. 85°"
                  />
                </label>

                {step === 2 && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={confirmarModalidad}
                      disabled={!form.modalidad || recalculando}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {recalculando ? "Calculando..." : "Confirmar modalidad y ver cronograma"}
                    </button>
                    {!form.modalidad && (
                      <span className="text-sm text-slate-500">Seleccione Opción A o B para continuar.</span>
                    )}
                  </div>
                )}
              </section>
            )}

            {step >= 3 && recalculo && (
              <section className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-semibold mb-4">Paso 3 — Cronograma recalculado y confirmación</h2>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Modalidad elegida</p>
                    <p className="font-semibold">{recalculo.seleccionado.modalidad}</p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Plazo / cuotas</p>
                    <p className="font-semibold">
                      {recalculo.seleccionado.nuevoPlazoMeses ?? totalCuotasCronograma} meses
                      <span className="block text-xs font-normal text-slate-500">
                        {totalCuotasCronograma} fila(s) en cronograma
                      </span>
                    </p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">Nueva cuota</p>
                    <p className="font-semibold">
                      {moneda}{" "}
                      {Number(recalculo.seleccionado.nuevaCuotaBase ?? 0).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">TCEA</p>
                    <p className="font-semibold">
                      {Number(recalculo.seleccionado.indicadores.tcea).toFixed(4)}%
                    </p>
                  </div>
                  <div className="p-3 rounded border bg-slate-50">
                    <p className="text-slate-500">VAN / TIR / Ahorro</p>
                    <p className="font-semibold text-xs leading-relaxed">
                      VAN {moneda}{" "}
                      {Number(recalculo.seleccionado.indicadores.vanDeudor).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                      <br />
                      TIR{" "}
                      {recalculo.seleccionado.indicadores.tirAnual != null
                        ? `${Number(recalculo.seleccionado.indicadores.tirAnual).toFixed(4)}%`
                        : "—"}
                      <br />
                      Ahorro {moneda}{" "}
                      {Number(recalculo.seleccionado.indicadores.ahorroIntereses).toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                {recalculo.comparativa && (
                  <div className="mt-4 overflow-x-auto">
                    <p className="text-sm font-medium text-slate-800 mb-2">
                      Comparativa antes vs. después del pago anticipado
                    </p>
                    <table className="w-full text-sm border rounded overflow-hidden">
                      <thead className="bg-slate-100">
                        <tr>
                          <th className="text-left p-2">Indicador</th>
                          <th className="text-right p-2">Antes</th>
                          <th className="text-right p-2">Después</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t">
                          <td className="p-2">Saldo capital</td>
                          <td className="p-2 text-right">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.saldoAntes).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.saldoDespues).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Cuotas restantes</td>
                          <td className="p-2 text-right">{recalculo.comparativa.cuotasAntes}</td>
                          <td className="p-2 text-right font-medium">
                            {recalculo.comparativa.cuotasDespues}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Cuota mensual</td>
                          <td className="p-2 text-right">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.cuotaMensualAntes).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.cuotaMensualDespues).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Fecha de término</td>
                          <td className="p-2 text-right">
                            {new Date(
                              recalculo.comparativa.fechaTerminoAntes + "T12:00:00"
                            ).toLocaleDateString("es-PE")}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {new Date(
                              recalculo.comparativa.fechaTerminoDespues + "T12:00:00"
                            ).toLocaleDateString("es-PE")}
                          </td>
                        </tr>
                        <tr className="border-t">
                          <td className="p-2">Interés residual (cuota regular)</td>
                          <td className="p-2 text-right">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.interesResidualAntes).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-2 text-right font-medium">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.interesResidualDespues).toLocaleString(
                              "es-PE",
                              { minimumFractionDigits: 2 }
                            )}
                          </td>
                        </tr>
                        <tr className="border-t bg-emerald-50">
                          <td className="p-2 font-medium">Ahorro en intereses</td>
                          <td className="p-2 text-right text-slate-400">—</td>
                          <td className="p-2 text-right font-semibold text-emerald-800">
                            {moneda}{" "}
                            {Number(recalculo.comparativa.ahorroIntereses).toLocaleString("es-PE", {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-slate-500">
                      El ahorro compara solo intereses de cuota regular (no el interés contable del
                      valor residual / balón). Penalidad: S/ 0.00.
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-600">
                  Penalidad a registrar: <strong>S/ 0.00</strong>. Al confirmar se guarda el pago, la
                  modalidad del cliente y el nuevo cronograma (Art. 86° — cronograma actualizado).
                </p>

                {recalculo.seleccionado.indicadores.tirNoConverge && (
                  <div className="mt-3 p-3 rounded border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                    La TIR no convergió para este recalculo residual. Se permite guardar igual y queda trazado en
                    auditoría.
                  </div>
                )}

                <div className="mt-4 overflow-x-auto">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">Cronograma recalculado</p>
                    <p className="text-xs text-slate-500">
                      {cronogramaCompleto.length > 6
                        ? `Vista previa: 3 primeras + 2 últimas de ${cronogramaCompleto.length} cuotas`
                        : `${cronogramaCompleto.length} cuota(s)`}
                    </p>
                  </div>
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
                      {cronogramaPreview.map((q: any, idx: number) =>
                        q.__ellipsis ? (
                          <tr key={`ellipsis-${idx}`} className="border-t bg-slate-50">
                            <td colSpan={8} className="p-2 text-center text-xs text-slate-500">
                              … {cronogramaCompleto.length - 5} cuotas intermedias omitidas en la vista
                              previa …
                            </td>
                          </tr>
                        ) : (
                          <tr key={q.numero} className="border-t">
                            <td className="p-2">{q.numero}</td>
                            <td className="p-2">{q.tipoCuota}</td>
                            <td className="p-2">
                              {new Date(q.fechaVencimiento).toLocaleDateString("es-PE")}
                            </td>
                            <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                            <td className="p-2 text-right">{Math.abs(Number(q.interes)).toFixed(2)}</td>
                            <td className="p-2 text-right">{Math.abs(Number(q.amortizacion)).toFixed(2)}</td>
                            <td className="p-2 text-right font-medium">{Number(q.cuotaTotal).toFixed(2)}</td>
                            <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                          </tr>
                        )
                      )}
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
                    type="button"
                    onClick={() => {
                      setStep(2)
                      setRecalculo(null)
                    }}
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
