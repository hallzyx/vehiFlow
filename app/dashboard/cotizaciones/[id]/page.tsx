'use client'

import { use, useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: paramId } = use(params)
  const router = useRouter()
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [versiones, setVersiones] = useState<any[]>([])
  const [familia, setFamilia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comparisonModal, setComparisonModal] = useState<{open: boolean, version?: any}>({open: false})
  const [publicLink, setPublicLink] = useState<string>("")
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkMessage, setLinkMessage] = useState("")
  const [viewMode, setViewMode] = useState<"comercial" | "academica">("comercial")
  const [activando, setActivando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)

  async function generarEnlaceCliente() {
    setGeneratingLink(true)
    setLinkMessage("")
    setMenuMasAbierto(false)
    try {
      const res = await fetch(`/api/cotizaciones/${paramId}/public-link`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo generar enlace")

      const absoluteUrl = `${window.location.origin}${data.publicUrl}`
      setPublicLink(absoluteUrl)
      await navigator.clipboard.writeText(absoluteUrl)
      setLinkMessage("Enlace público generado y copiado.")
    } catch (e: any) {
      setLinkMessage(e?.message || "Error generando enlace público")
    } finally {
      setGeneratingLink(false)
    }
  }

  async function activarOperacion() {
    setActivando(true)
    try {
      const res = await fetch("/api/operaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cotizacionId: paramId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "No se pudo activar operación")
      }
      const operacionId = data.operacion?.id
      router.push(
        operacionId ? `/dashboard/pagos?operacionId=${operacionId}` : "/dashboard/pagos"
      )
      router.refresh()
    } catch (e: any) {
      alert(e.message || "Error activando operación")
    } finally {
      setActivando(false)
    }
  }

  async function cambiarEstado(nuevoEstado: "PRESENTADA" | "RECHAZADA" | "ARCHIVADA") {
    const labels: Record<string, string> = {
      PRESENTADA: "presentar esta cotización al cliente",
      RECHAZADA: "marcarla como rechazada",
      ARCHIVADA: "archivarla",
    }
    if (!confirm(`¿Confirmas ${labels[nuevoEstado]}?`)) return

    setCambiandoEstado(true)
    try {
      const res = await fetch(`/api/cotizaciones/${paramId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cambiar el estado")
      setCotizacion((prev: any) => (prev ? { ...prev, estado: nuevoEstado } : prev))
      router.refresh()
    } catch (e: any) {
      alert(e.message || "Error cambiando estado")
    } finally {
      setCambiandoEstado(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [cotRes, verRes] = await Promise.all([
          fetch(`/api/cotizaciones/${paramId}`),
          fetch(`/api/cotizaciones/${paramId}/versiones`),
        ])
        if (cancelled) return
        if (cotRes.ok) {
          const data = await cotRes.json()
          setCotizacion(data.cotizacion)
        } else {
          setCotizacion(null)
        }
        if (verRes.ok) {
          const data = await verRes.json()
          setVersiones(data.versiones || [])
          setFamilia(data.familia || null)
        }
      } catch (error) {
        console.error("Error fetching cotizacion:", error)
        if (!cancelled) setCotizacion(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [paramId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Cotización no encontrada</div>
      </div>
    )
  }

  const esVersionActiva = familia ? Number(cotizacion.version) === Number(familia.latestVersion) : true
  const totalVersiones = familia?.totalVersiones ?? versiones.length
  const puedeEditar = cotizacion.estado === "SIMULADA" || cotizacion.estado === "PRESENTADA"
  const puedeActivar = !cotizacion.operacion && cotizacion.estado === "PRESENTADA"

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link
                href="/dashboard/cotizaciones"
                className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
              >
                ← Volver al listado
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Cotización #{cotizacion.id}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    cotizacion.estado === "SIMULADA"
                      ? "bg-sky-100 text-sky-800"
                      : cotizacion.estado === "PRESENTADA"
                        ? "bg-indigo-100 text-indigo-800"
                        : cotizacion.estado === "APROBADA"
                          ? "bg-emerald-100 text-emerald-800"
                          : cotizacion.estado === "RECHAZADA"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {cotizacion.estado}
                </span>
                <span>
                  Familia #{familia?.id ?? "—"} · v{cotizacion.version}
                  {esVersionActiva ? " (activa)" : " (histórica)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("comercial")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "comercial"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Comercial
              </button>
              <button
                type="button"
                onClick={() => setViewMode("academica")}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "academica"
                    ? "bg-white text-slate-900 shadow"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Académica
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/dashboard/cotizaciones/${cotizacion.id}/hoja-resumen`}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Hoja resumen
              </Link>
              {puedeEditar && (
                <Link
                  href={`/dashboard/cotizaciones/${cotizacion.id}/editar`}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Editar
                </Link>
              )}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuMasAbierto((v) => !v)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  aria-expanded={menuMasAbierto}
                >
                  Más ▾
                </button>
                {menuMasAbierto && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-10 cursor-default"
                      aria-label="Cerrar menú"
                      onClick={() => setMenuMasAbierto(false)}
                    />
                    <div className="absolute left-0 z-20 mt-1 min-w-[14rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                      <button
                        type="button"
                        onClick={() => void generarEnlaceCliente()}
                        disabled={generatingLink}
                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {generatingLink ? "Generando enlace…" : "Generar enlace cliente"}
                      </button>
                      {cotizacion.operacion && (
                        <Link
                          href={`/dashboard/pagos?operacionId=${cotizacion.operacion.id}`}
                          className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          onClick={() => setMenuMasAbierto(false)}
                        >
                          Ir a pagos anticipados
                        </Link>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {cotizacion.estado === "PRESENTADA" && (
                <button
                  type="button"
                  onClick={() => cambiarEstado("RECHAZADA")}
                  disabled={cambiandoEstado}
                  className="rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                >
                  Rechazar
                </button>
              )}
              {cotizacion.estado === "SIMULADA" && (
                <button
                  type="button"
                  onClick={() => cambiarEstado("PRESENTADA")}
                  disabled={cambiandoEstado}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  Presentar al cliente
                </button>
              )}
              {puedeActivar && (
                <button
                  type="button"
                  onClick={() => void activarOperacion()}
                  disabled={activando}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {activando ? "Activando…" : "Activar operación"}
                </button>
              )}
              {cotizacion.operacion && cotizacion.estado === "APROBADA" && (
                <Link
                  href={`/dashboard/pagos?operacionId=${cotizacion.operacion.id}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Ir a pagos anticipados
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {(publicLink || linkMessage) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-white border rounded-xl p-4 space-y-2">
            {linkMessage && <p className="text-sm text-slate-700">{linkMessage}</p>}
            {publicLink && (
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <input
                  readOnly
                  value={publicLink}
                  className="flex-1 border rounded p-2 text-sm"
                />
                <a
                  href={publicLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border rounded text-sm hover:bg-slate-50"
                >
                  Abrir portal cliente
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {viewMode === "comercial" && (
        <>
        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Control de versionado</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-6">
            <div className="rounded-lg border p-3 bg-slate-50">
              <p className="text-slate-500">Familia</p>
              <p className="font-semibold">{familia?.id ? `#${familia.id}` : "—"}</p>
            </div>
            <div className="rounded-lg border p-3 bg-slate-50">
              <p className="text-slate-500">Total de versiones</p>
              <p className="font-semibold">{totalVersiones}</p>
            </div>
            <div className="rounded-lg border p-3 bg-slate-50">
              <p className="text-slate-500">Versión activa</p>
              <p className="font-semibold">v{familia?.latestVersion ?? cotizacion.version}</p>
            </div>
            <div className="rounded-lg border p-3 bg-slate-50">
              <p className="text-slate-500">Versión abierta</p>
              <p className="font-semibold">
                v{cotizacion.version} {esVersionActiva ? "(actual)" : "(histórica)"}
              </p>
            </div>
          </div>

          {!esVersionActiva && (
            <div className="mb-6 p-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-sm">
              Estás viendo una versión histórica. La versión vigente de esta familia es la v{familia?.latestVersion}.
            </div>
          )}

          <h2 className="text-lg font-semibold mb-4">Resumen de operación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Cliente</p>
              <p className="font-medium">{cotizacion.cliente.nombres} {cotizacion.cliente.apPaterno}</p>
              <p>{cotizacion.cliente.tipoDocumento}: {cotizacion.cliente.numDocumento}</p>
            </div>
            <div>
              <p className="text-slate-500">Vehículo</p>
              <p className="font-medium">{cotizacion.vehiculo.marca} {cotizacion.vehiculo.modelo} {cotizacion.vehiculo.anio}</p>
              <p>{cotizacion.vehiculo.concesionario}</p>
            </div>
            <div>
              <p className="text-slate-500">Indicadores</p>
              <p>TCEA: <span className="font-medium">{Number(cotizacion.tcea).toFixed(4)}%</span></p>
              <p>VAN: <span className="font-medium">{Number(cotizacion.vanDeudor).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span></p>
              <p>TIR anual: <span className="font-medium">{Number(cotizacion.tirAnual).toFixed(4)}%</span></p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Cronograma de pagos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <CronoTh align="left" label="Número de cuota">N°</CronoTh>
                  <CronoTh align="center" label="Periodo de gracia (T = total, P = parcial, S = sin gracia)">PG</CronoTh>
                  <CronoTh align="left" label="Tipo de cuota">Tipo</CronoTh>
                  <CronoTh align="left" label="Fecha de vencimiento">Fecha</CronoTh>
                  <CronoTh label="Saldo inicial">Saldo inicial</CronoTh>
                  <CronoTh label="Interés del período">Interés</CronoTh>
                  <CronoTh label="Amortización de capital">Amort.</CronoTh>
                  <CronoTh label="Seguros (desgravamen + vehicular)">Seguros</CronoTh>
                  <CronoTh label="GPS, portes y gastos administrativos">GPS/Portes/Adm</CronoTh>
                  <CronoTh label="Cuota total del período">Cuota total</CronoTh>
                  <CronoTh label="Saldo final">Saldo final</CronoTh>
                </tr>
              </thead>
              <tbody>
                {cotizacion.cuotas.map((q: any) => (
                  <tr key={q.id} className="border-t">
                    <td className="p-2">{q.numero}</td>
                    <td className="p-2 text-center">{q.pg || "—"}</td>
                    <td className="p-2">{q.tipoCuota}</td>
                    <td className="p-2">{new Date(q.fecVencimiento).toLocaleDateString("es-PE")}</td>
                    <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                    <td className="p-2 text-right">{(Number(q.segDesgravamen) + Number(q.segVehicular)).toFixed(2)}</td>
                    <td className="p-2 text-right">{(Number(q.gps || 0) + Number(q.portes || 0) + Number(q.gasAdm || 0) || Number(q.otrosGastos || 0)).toFixed(2)}</td>
                    <td className="p-2 text-right font-medium">{Number(q.cuotaTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Historial de versiones</h2>
          <p className="text-sm text-slate-600 mb-4">
            Cada edición crea una nueva versión y la anterior queda archivada para auditoría. Así mantenemos trazabilidad completa.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left p-2">Versión</th>
                  <th className="text-left p-2">Fecha Creación</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-right p-2">Monto Solicitado</th>
                  <th className="text-right p-2">Plazo</th>
                  <th className="text-right p-2">TCEA</th>
                  <th className="text-left p-2">Motivo</th>
                  <th className="text-left p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {versiones.map((v: any) => (
                  <tr key={v.id} className="border-t">
                    <td className="p-2 font-medium">v{v.version}</td>
                    <td className="p-2">{new Date(v.creadoEn || v.createdAt).toLocaleDateString("es-PE")}</td>
                    <td className="p-2">
                      {v.estado}
                      {familia && Number(v.version) === Number(familia.latestVersion) && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Activa</span>
                      )}
                    </td>
                    <td className="p-2 text-right">{Number(v.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</td>
                    <td className="p-2 text-right">{v.plazoMeses} meses</td>
                    <td className="p-2 text-right">{Number(v.tcea).toFixed(4)}%</td>
                    <td className="p-2">{labelMotivo(v.motivoEdicion)}</td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/cotizaciones/${v.id}`}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Ver
                        </Link>
                        {v.id !== cotizacion.id && (
                          <button
                            className="text-green-600 hover:underline text-xs"
                            onClick={() => setComparisonModal({open: true, version: v})}
                          >
                            Comparar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        </>
        )}

        {viewMode === "academica" && cotizacion && (
          <>
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-1">DATOS — Método francés Compra Inteligente (IB)</h2>
              <p className="text-xs text-slate-500 mb-4">
                Frecuencia mensual · 30 días · año 360 ·{" "}
                {cotizacion.tipoTasa || "TEA"}
                {cotizacion.capitalizacion ? ` / ${cotizacion.capitalizacion}` : ""}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Precio de venta (PV)</p>
                  <p className="font-semibold">{Number(cotizacion.precioVeh).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">% Cuota inicial</p>
                  <p className="font-semibold">{Number(cotizacion.cuotaIniPct).toFixed(2)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">% Cuota final</p>
                  <p className="font-semibold">
                    {cotizacion.pctCuotaFinal != null
                      ? `${(Number(cotizacion.pctCuotaFinal) * 100).toFixed(1)}%`
                      : cotizacion.residualMonto
                        ? ((Number(cotizacion.residualMonto) / Number(cotizacion.precioVeh)) * 100).toFixed(1) + "%"
                        : "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Préstamo</p>
                  <p className="font-semibold">{Number(cotizacion.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Frecuencia</p>
                  <p className="font-semibold">Mensual (30 días)</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">N° de años</p>
                  <p className="font-semibold">{(Number(cotizacion.plazoMeses) / 12).toFixed(1)}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">N° cuotas (N)</p>
                  <p className="font-semibold">{cotizacion.plazoMeses}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Periodos cronograma</p>
                  <p className="font-semibold">{cotizacion.cuotas?.length ?? 0}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">TEA</p>
                  <p className="font-semibold">{Number(cotizacion.tea).toFixed(4)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">TEM</p>
                  <p className="font-semibold">{Number(cotizacion.tem).toFixed(6)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">TCEA</p>
                  <p className="font-semibold">{Number(cotizacion.tcea).toFixed(4)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">VAN (COK)</p>
                  <p className="font-semibold">{Number(cotizacion.vanDeudor).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">TIR mensual</p>
                  <p className="font-semibold">{Number(cotizacion.tirMensual).toFixed(4)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">TIR / TCEA anual</p>
                  <p className="font-semibold">{Number(cotizacion.tirAnual).toFixed(4)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Cuota final (balón)</p>
                  <p className="font-semibold">
                    {cotizacion.residualMonto != null
                      ? Number(cotizacion.residualMonto).toLocaleString("es-PE", { minimumFractionDigits: 2 })
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">COK anual</p>
                  <p className="font-semibold">
                    {cotizacion.cokAnual != null ? `${(Number(cotizacion.cokAnual) * 100).toFixed(2)}%` : "—"}
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Cronograma dual (cuota regular + cuota final)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <CronoTh align="left" label="Número de cuota / período">N°</CronoTh>
                      <CronoTh align="center" label="Periodo de gracia (T = total, P = parcial, S = sin gracia)">PG</CronoTh>
                      <CronoTh label="Saldo inicial de la cuota final (balón)">SI CF</CronoTh>
                      <CronoTh label="Interés de la cuota final (balón)">I CF</CronoTh>
                      <CronoTh label="Amortización de la cuota final (balón)">A CF</CronoTh>
                      <CronoTh label="Saldo final de la cuota final (balón)">SF CF</CronoTh>
                      <CronoTh label="Saldo inicial (cuota regular)">SI</CronoTh>
                      <CronoTh label="Interés del período (cuota regular)">Interés</CronoTh>
                      <CronoTh label="Cuota periódica (método francés)">Cuota</CronoTh>
                      <CronoTh label="Amortización de capital">Amort.</CronoTh>
                      <CronoTh label="Seguro de desgravamen">SegDes</CronoTh>
                      <CronoTh label="Seguro de riesgo / vehicular">SegRie</CronoTh>
                      <CronoTh label="Gasto GPS">GPS</CronoTh>
                      <CronoTh label="Portes">Portes</CronoTh>
                      <CronoTh label="Gastos administrativos">GasAdm</CronoTh>
                      <CronoTh label="Saldo final (cuota regular)">SF</CronoTh>
                      <CronoTh label="Flujo de caja del deudor">Flujo</CronoTh>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizacion.cuotas.map((q: any) => (
                      <tr key={q.id} className="border-t">
                        <td className="p-2">{q.numero}</td>
                        <td className="p-2 text-center font-medium">{q.pg || (q.tipoCuota?.startsWith("GRACIA") ? (q.tipoCuota === "GRACIA_TOTAL" ? "T" : "P") : "S")}</td>
                        <td className="p-2 text-right">{Number(q.saldoIniCF || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.interesCF || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.amortCF || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.saldoFinCF || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">{Number(q.cuota ?? (Number(q.interes) + Number(q.amortizacion))).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.segDesgravamen).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.segVehicular).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.gps || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.portes || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.gasAdm || 0).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                        <td className="p-2 text-right">{Number(q.flujo ?? -Number(q.cuotaTotal)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Comparison Modal */}
      {comparisonModal.open && comparisonModal.version && (
        <VersionComparisonModal
          actual={cotizacion}
          anterior={comparisonModal.version}
          onClose={() => setComparisonModal({ open: false })}
        />
      )}
    </div>
  )
}

const MOTIVO_LABELS: Record<string, string> = {
  cliente: "Solicitud del cliente",
  comercial: "Ajuste de condiciones comerciales",
  datos: "Corrección de datos",
  comparativa: "Comparativa de escenarios",
  otro: "Otro",
}

function labelMotivo(raw: string | null | undefined) {
  if (!raw) return "Sin motivo"
  return MOTIVO_LABELS[raw] ?? raw
}

function fmtMoney(value: unknown) {
  return Number(value ?? 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** TEA/TCEA/TIR: si viene en decimal (0.18) → %, si ya viene en % lo deja. */
function fmtRatePct(value: unknown, digits = 4) {
  const n = Number(value ?? 0)
  const pct = Math.abs(n) > 0 && Math.abs(n) < 1 ? n * 100 : n
  return `${pct.toFixed(digits)}%`
}

function num(value: unknown) {
  return Number(value ?? 0)
}

type CompareRow = {
  label: string
  anterior: string
  actual: string
  delta: number | null
  /** lowerIsBetter: ↓ verde cuando baja (TCEA, cuota, etc.) */
  lowerIsBetter?: boolean
}

function VersionComparisonModal({
  actual,
  anterior,
  onClose,
}: {
  actual: any
  anterior: any
  onClose: () => void
}) {
  const rows: CompareRow[] = [
    {
      label: "TEA",
      anterior: fmtRatePct(anterior.tea ?? anterior.tasaIngresada),
      actual: fmtRatePct(actual.tea ?? actual.tasaIngresada),
      delta: num(actual.tea ?? actual.tasaIngresada) - num(anterior.tea ?? anterior.tasaIngresada),
      lowerIsBetter: true,
    },
    {
      label: "TCEA",
      anterior: fmtRatePct(anterior.tcea),
      actual: fmtRatePct(actual.tcea),
      delta: num(actual.tcea) - num(anterior.tcea),
      lowerIsBetter: true,
    },
    {
      label: "Cuota inicial (%)",
      anterior: `${num(anterior.cuotaIniPct).toFixed(2)}%`,
      actual: `${num(actual.cuotaIniPct).toFixed(2)}%`,
      delta: num(actual.cuotaIniPct) - num(anterior.cuotaIniPct),
    },
    {
      label: "Cuota inicial (monto)",
      anterior: fmtMoney(anterior.cuotaIniMnt),
      actual: fmtMoney(actual.cuotaIniMnt),
      delta: num(actual.cuotaIniMnt) - num(anterior.cuotaIniMnt),
    },
    {
      label: "Monto financiado",
      anterior: fmtMoney(anterior.montoFinanc),
      actual: fmtMoney(actual.montoFinanc),
      delta: num(actual.montoFinanc) - num(anterior.montoFinanc),
    },
    {
      label: "Plazo",
      anterior: `${anterior.plazoMeses} meses`,
      actual: `${actual.plazoMeses} meses`,
      delta: num(actual.plazoMeses) - num(anterior.plazoMeses),
    },
    {
      label: "Total a pagar",
      anterior: fmtMoney(anterior.totPagado),
      actual: fmtMoney(actual.totPagado),
      delta: num(actual.totPagado) - num(anterior.totPagado),
      lowerIsBetter: true,
    },
    {
      label: "Costo del crédito",
      anterior: fmtMoney(anterior.costoCredito),
      actual: fmtMoney(actual.costoCredito),
      delta: num(actual.costoCredito) - num(anterior.costoCredito),
      lowerIsBetter: true,
    },
    {
      label: "VAN deudor",
      anterior: fmtMoney(anterior.vanDeudor),
      actual: fmtMoney(actual.vanDeudor),
      delta: num(actual.vanDeudor) - num(anterior.vanDeudor),
      lowerIsBetter: false,
    },
    {
      label: "TIR anual",
      anterior: fmtRatePct(anterior.tirAnual),
      actual: fmtRatePct(actual.tirAnual),
      delta: num(actual.tirAnual) - num(anterior.tirAnual),
      lowerIsBetter: true,
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-6">
          <h3 className="text-lg font-semibold">
            Comparación: v{actual.version} vs v{anterior.version}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Versión actual</p>
              <p className="font-semibold">v{actual.version}</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-sm text-slate-500">Valor anterior</p>
              <p className="font-semibold">v{anterior.version}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm text-slate-500">Motivo del cambio (v{actual.version})</p>
              <p className="font-semibold">{labelMotivo(actual.motivoEdicion)}</p>
              {anterior.motivoEdicion && (
                <p className="mt-1 text-xs text-slate-500">
                  Anterior (v{anterior.version}): {labelMotivo(anterior.motivoEdicion)}
                </p>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="p-3 text-left font-medium">Indicador</th>
                  <th className="p-3 text-right font-medium">
                    Anterior (v{anterior.version})
                  </th>
                  <th className="p-3 text-right font-medium">
                    Actual (v{actual.version})
                  </th>
                  <th className="p-3 text-center font-medium">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const changed = row.delta != null && Math.abs(row.delta) > 1e-9
                  const favorable =
                    changed && row.lowerIsBetter != null
                      ? row.lowerIsBetter
                        ? row.delta! < 0
                        : row.delta! > 0
                      : null
                  return (
                    <tr key={row.label} className="border-t">
                      <td className="p-3 text-slate-700">{row.label}</td>
                      <td className="p-3 text-right text-slate-600 tabular-nums">
                        {row.anterior}
                      </td>
                      <td className="p-3 text-right font-medium tabular-nums">
                        {row.actual}
                      </td>
                      <td className="p-3 text-center">
                        {!changed ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <span
                            className={
                              favorable === true
                                ? "font-medium text-emerald-600"
                                : favorable === false
                                  ? "font-medium text-red-600"
                                  : "font-medium text-slate-600"
                            }
                          >
                            {row.delta! > 0 ? "↑" : "↓"}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function CronoTh({
  children,
  label,
  align = "right",
}: {
  children: ReactNode
  label: string
  align?: "left" | "center" | "right"
}) {
  const alignClass =
    align === "left" ? "text-left" : align === "center" ? "text-center" : "text-right"

  return (
    <th className={`${alignClass} p-2 cursor-help`} title={label}>
      <span className="border-b border-dotted border-slate-400">{children}</span>
    </th>
  )
}
