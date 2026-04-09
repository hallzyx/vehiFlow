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
  const [loading, setLoading] = useState(true)
  const [comparisonModal, setComparisonModal] = useState<{open: boolean, version?: any}>({open: false})

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cotización #{cotizacion.id}</h1>
            <p className="text-sm text-slate-600">Estado: {cotizacion.estado}</p>
          </div>
           <div className="flex gap-4">
              {(cotizacion.estado === 'SIMULADA' || cotizacion.estado === 'PRESENTADA') && (
                <Link
                  href={`/dashboard/cotizaciones/${cotizacion.id}/editar`}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Editar cotización
                </Link>
              )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="bg-white rounded-xl border p-6">
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
                  <th className="text-right p-2">Seguro</th>
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
                    <td className="p-2 text-right">{(Number(q.segDesgravamen) + Number(q.segVehicular)).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.otrosGastos).toFixed(2)}</td>
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
                    <td className="p-2">{v.estado}</td>
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
