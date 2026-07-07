'use client'

import { useState, useEffect } from "react"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function getCotizacion(id: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/cotizaciones/${id}`,
    { cache: "no-store" }
  )

  if (!res.ok) return null
  const data = await res.json()
  return data.cotizacion
}

export default function CotizacionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string>("")
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [versiones, setVersiones] = useState<any[]>([])
  const [familia, setFamilia] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comparisonModal, setComparisonModal] = useState<{open: boolean, version?: any}>({open: false})
  const [publicLink, setPublicLink] = useState<string>("")
  const [generatingLink, setGeneratingLink] = useState(false)
  const [linkMessage, setLinkMessage] = useState("")
  const [viewMode, setViewMode] = useState<"comercial" | "academica">("comercial")

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId)
      fetchCotizacion(paramId)
      fetchVersiones(paramId)
    })
  }, [params])

  const fetchCotizacion = async (cotId: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${cotId}`)
      if (res.ok) {
        const data = await res.json()
        setCotizacion(data.cotizacion)
      }
    } catch (error) {
      console.error("Error fetching cotizacion:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVersiones = async (cotId: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${cotId}/versiones`)
      if (res.ok) {
        const data = await res.json()
        setVersiones(data.versiones)
        setFamilia(data.familia || null)
      }
    } catch (error) {
      console.error("Error fetching versiones:", error)
    }
  }

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cotización #{cotizacion.id}</h1>
            <p className="text-sm text-slate-600">Estado: {cotizacion.estado}</p>
            <p className="text-sm text-slate-600">
              Familia de versiones: {familia?.id ? `#${familia.id}` : "No identificada"} · Versión {cotizacion.version}
              {esVersionActiva ? " (activa)" : " (histórica)"}
            </p>
          </div>
           <div className="flex gap-4 items-center">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("comercial")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "comercial"
                      ? "bg-white shadow text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Vista Comercial
                </button>
                <button
                  onClick={() => setViewMode("academica")}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === "academica"
                      ? "bg-white shadow text-slate-900"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Vista Académica
                </button>
              </div>
              {(cotizacion.estado === 'SIMULADA' || cotizacion.estado === 'PRESENTADA') && (
                <Link
                  href={`/dashboard/cotizaciones/${cotizacion.id}/editar`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Editar cotización
                </Link>
              )}
              <Link
                href={`/dashboard/cotizaciones/${cotizacion.id}/hoja-resumen`}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800"
              >
                Ver Hoja Resumen (Anexo 3 SBS)
              </Link>
              <button
                onClick={async () => {
                  setGeneratingLink(true)
                  setLinkMessage("")
                  try {
                    const res = await fetch(`/api/cotizaciones/${cotizacion.id}/public-link`)
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
                }}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                disabled={generatingLink}
              >
                {generatingLink ? "Generando enlace..." : "Generar enlace cliente"}
              </button>
              {!cotizacion.operacion && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/operaciones', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ cotizacionId: cotizacion.id }),
                      })
                      if (!res.ok) {
                        const err = await res.json()
                        throw new Error(err.error || 'No se pudo activar operación')
                      }
                      window.location.href = '/dashboard/pagos'
                    } catch (e: any) {
                      alert(e.message || 'Error activando operación')
                    }
                  }}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Activar operación
                </button>
              )}
              {cotizacion.operacion && (
                <Link
                  href={`/dashboard/pagos?operacionId=${cotizacion.operacion.id}`}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Ir a pagos anticipados
                </Link>
              )}
              <Link href="/dashboard/cotizaciones" className="text-blue-600 hover:underline">
                Volver al listado
              </Link>
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
                  <th className="text-left p-2">N°</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Saldo inicial</th>
                  <th className="text-right p-2">Interés</th>
                  <th className="text-right p-2">Amort.</th>
                  <th className="text-right p-2">Desgravamen</th>
                  <th className="text-right p-2">Vehicular</th>
                  <th className="text-right p-2">Gastos</th>
                  <th className="text-right p-2">Cuota total</th>
                  <th className="text-right p-2">Saldo final</th>
                </tr>
              </thead>
              <tbody>
                {cotizacion.cuotas.map((q: any) => (
                  <tr key={q.id} className="border-t">
                    <td className="p-2">{q.numero}</td>
                    <td className="p-2">{q.tipoCuota}</td>
                    <td className="p-2">{new Date(q.fecVencimiento).toLocaleDateString("es-PE")}</td>
                    <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.segDesgravamen).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.segVehicular).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.otrosGastos).toFixed(2)}</td>
                    <td className="p-2 text-right font-medium">{Number(q.cuotaTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-semibold border-t-2">
                <tr>
                  <td className="p-2" colSpan={4}>TOTALES</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.interes), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.amortizacion), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.segDesgravamen), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.segVehicular), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.otrosGastos), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">{cotizacion.cuotas.reduce((a: number, q: any) => a + Number(q.cuotaTotal), 0).toFixed(2)}</td>
                  <td className="p-2 text-right">—</td>
                </tr>
              </tfoot>
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
                    <td className="p-2">{v.motivoEdicion || '-'}</td>
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
            {/* BLOQUE DATOS */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">DATOS</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Precio de venta</p>
                  <p className="font-semibold">{Number(cotizacion.precioVeh).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">% Cuota inicial</p>
                  <p className="font-semibold">{Number(cotizacion.cuotaIniPct).toFixed(2)}%</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Préstamo</p>
                  <p className="font-semibold">{Number(cotizacion.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">Frecuencia</p>
                  <p className="font-semibold">Semestral</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">N° de años</p>
                  <p className="font-semibold">{(cotizacion.plazoMeses / 12).toFixed(1)}</p>
                </div>
                <div className="rounded-lg border p-3 bg-slate-50">
                  <p className="text-slate-500">N° de periodos</p>
                  <p className="font-semibold">{Math.ceil(cotizacion.plazoMeses / 6)}</p>
                </div>
              </div>
            </section>

            {/* CRONOGRAMA ACADÉMICO */}
            <section className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Cronograma de pagos</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="text-left p-2">N°</th>
                      <th className="text-right p-2">TEA</th>
                      <th className="text-right p-2">TES</th>
                      <th className="text-right p-2">Saldo Inicial</th>
                      <th className="text-right p-2">Interés</th>
                      <th className="text-right p-2">Cuota</th>
                      <th className="text-right p-2">Amort.</th>
                      <th className="text-right p-2">Saldo Final</th>
                      <th className="text-center p-2">Plazo Gracia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cotizacion.cuotas.map((q: any, idx: number) => {
                      const tea = Number(cotizacion.tea) * 100
                      const tes = (Math.pow(1 + Number(cotizacion.tea), 6 / 12) - 1) * 100
                      const cuotaFinanciera = Number(q.interes) + Number(q.amortizacion)
                      const esGracia =
                        q.tipoCuota === "GRACIA_TOTAL" || q.tipoCuota === "GRACIA_PARCIAL"
                      return (
                        <tr key={q.id} className="border-t">
                          <td className="p-2">{q.numero}</td>
                          <td className="p-2 text-right">{tea.toFixed(4)}%</td>
                          <td className="p-2 text-right">{tes.toFixed(4)}%</td>
                          <td className="p-2 text-right">{Number(q.saldoInicial).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                          <td className="p-2 text-right font-medium">{cuotaFinanciera.toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                          <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                          <td className="p-2 text-center">{esGracia ? "S" : "N"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Comparison Modal */}
      {comparisonModal.open && comparisonModal.version && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Comparación: v{cotizacion.version} vs v{comparisonModal.version.version}
                </h3>
                <button
                  onClick={() => setComparisonModal({open: false})}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded">
                  <p className="text-sm text-slate-500">Versión Actual</p>
                  <p className="font-semibold">v{cotizacion.version}</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded">
                  <p className="text-sm text-slate-500">Comparando con</p>
                  <p className="font-semibold">v{comparisonModal.version.version}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded">
                  <p className="text-sm text-slate-500">Motivo de cambio</p>
                  <p className="font-semibold">{comparisonModal.version.motivoEdicion || 'Sin motivo'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Indicadores Financieros</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span>TCEA:</span>
                      <div className="flex items-center gap-2">
                        <span>{Number(cotizacion.tcea).toFixed(4)}%</span>
                        {cotizacion.tcea !== comparisonModal.version.tcea && (
                          <span className={cotizacion.tcea < comparisonModal.version.tcea ? 'text-green-600' : 'text-red-600'}>
                            {cotizacion.tcea < comparisonModal.version.tcea ? '↓' : '↑'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>vs {Number(comparisonModal.version.tcea).toFixed(4)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Parámetros</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Monto financiado:</span>
                      <span>{Number(cotizacion.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>vs {Number(comparisonModal.version.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Plazo:</span>
                      <div className="flex items-center gap-2">
                        <span>{cotizacion.plazoMeses} meses</span>
                        {cotizacion.plazoMeses !== comparisonModal.version.plazoMeses && (
                          <span className={cotizacion.plazoMeses > comparisonModal.version.plazoMeses ? 'text-green-600' : 'text-red-600'}>
                            {cotizacion.plazoMeses > comparisonModal.version.plazoMeses ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>vs {comparisonModal.version.plazoMeses} meses</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
