"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Printer, ArrowLeft } from "lucide-react"

interface CronogramaItem {
  numero: number
  tipo: string
  fechaVencimiento: string
  saldoInicial: string
  interes: string
  amortizacion: string
  desgravamen: string
  vehicular: string
  otrosGastos: string
  cuotaTotal: string
  saldoFinal: string
}

interface HojaResumen {
  metadata: { idCotizacion: string; estado: string; fechaGeneracion: string; versionCotizacion: number }
  entidad: { nombre: string; ruc: string; direccion: string }
  cliente: { nombre: string; tipoDocumento: string; numeroDocumento: string; direccion: string; telefono: string; correo: string }
  vehiculo: { marca: string; modelo: string; version: string; anio: number; precioLista: string; moneda: string; concesionario: string }
  condiciones: Record<string, string>
  segurosGastos: {
    desgravamen: { tipo: string; tasaMensual: string; compania: string; poliza: string; totalPagado: string }
    vehicular: { tipo: string; primaAnual: string; compania: string; poliza: string; totalPagado: string }
    gastos: { gps: string; notarial: string; totalPagado: string }
  }
  indicadores: Record<string, string>
  descomposicionTCEA: Record<string, string>
  cronograma: CronogramaItem[]
  totalesCronograma: Record<string, string>
  beneficiosRiesgos: { beneficios: string[]; riesgos: string[]; condiciones: string[] }
  formulas: Record<string, string>
}

type Props = {
  params: Promise<{ id: string }>
}

export default function HojaResumenPage({ params }: Props) {
  const [hoja, setHoja] = useState<HojaResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    params.then(({ id }) => fetchHoja(id))
  }, [params])

  const fetchHoja = async (id: string) => {
    try {
      const res = await fetch(`/api/cotizaciones/${id}/hoja-resumen`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar")
      setHoja(data.hojaResumen)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const printPage = () => window.print()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Generando hoja resumen...</div>
      </div>
    )
  }

  if (error || !hoja) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No disponible</h2>
          <p className="text-slate-600">{error || "Hoja resumen no encontrada"}</p>
          <Link href="/dashboard/cotizaciones" className="mt-4 inline-block text-blue-600 hover:underline">
            Volver al listado
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white print:bg-white">
      {/* Header con botones (no se imprime) */}
      <header className="bg-slate-900 text-white p-4 print:hidden">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/cotizaciones/${hoja.metadata.idCotizacion}`} className="hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Hoja Resumen - Cotización #{hoja.metadata.idCotizacion}</h1>
            <span className="px-2 py-0.5 text-xs rounded bg-emerald-600">{hoja.metadata.estado}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={printPage} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Imprimir / PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 print:p-0 space-y-6" style={{ fontSize: "12px", lineHeight: "1.5" }}>
        {/* ENTIDAD */}
        <section className="border-b-2 border-slate-900 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">1. Datos de la Entidad</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-slate-500">Entidad</p><p className="font-medium">{hoja.entidad.nombre}</p></div>
            <div><p className="text-slate-500">RUC</p><p className="font-medium">{hoja.entidad.ruc}</p></div>
            <div><p className="text-slate-500">Dirección</p><p className="font-medium">{hoja.entidad.direccion}</p></div>
          </div>
        </section>

        {/* CLIENTE */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">2. Datos del Cliente</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div><p className="text-slate-500">Nombre</p><p className="font-medium">{hoja.cliente.nombre}</p></div>
            <div><p className="text-slate-500">Documento</p><p className="font-medium">{hoja.cliente.tipoDocumento}: {hoja.cliente.numeroDocumento}</p></div>
            <div className="col-span-3"><p className="text-slate-500">Dirección</p><p className="font-medium">{hoja.cliente.direccion}</p></div>
            <div><p className="text-slate-500">Teléfono</p><p className="font-medium">{hoja.cliente.telefono}</p></div>
            <div><p className="text-slate-500">Correo</p><p className="font-medium">{hoja.cliente.correo}</p></div>
          </div>
        </section>

        {/* VEHÍCULO */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">3. Datos del Vehículo</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-500">Marca/Modelo</p><p className="font-medium">{hoja.vehiculo.marca} {hoja.vehiculo.modelo}</p></div>
            <div><p className="text-slate-500">Versión/Año</p><p className="font-medium">{hoja.vehiculo.version} / {hoja.vehiculo.anio}</p></div>
            <div><p className="text-slate-500">Precio Lista</p><p className="font-medium">{hoja.vehiculo.moneda} {hoja.vehiculo.precioLista}</p></div>
            <div><p className="text-slate-500">Concesionario</p><p className="font-medium">{hoja.vehiculo.concesionario}</p></div>
          </div>
        </section>

        {/* CONDICIONES */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">4. Condiciones de la Operación</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><p className="text-slate-500">Moneda</p><p className="font-medium">{hoja.condiciones.moneda}</p></div>
            <div><p className="text-slate-500">TEA</p><p className="font-medium">{hoja.condiciones.tea}</p></div>
            <div><p className="text-slate-500">TEM</p><p className="font-medium">{hoja.condiciones.tem}</p></div>
            <div><p className="text-slate-500">TCEA</p><p className="font-medium text-blue-700">{hoja.condiciones.tcea}</p></div>
            <div><p className="text-slate-500">Precio Vehículo</p><p className="font-medium">{hoja.condiciones.moneda} {hoja.condiciones.precioVehiculo}</p></div>
            <div><p className="text-slate-500">Cuota Inicial</p><p className="font-medium">{hoja.condiciones.cuotaInicialPct} ({hoja.condiciones.moneda} {hoja.condiciones.cuotaInicialMnt})</p></div>
            <div><p className="text-slate-500">Monto Financiado</p><p className="font-medium">{hoja.condiciones.moneda} {hoja.condiciones.montoFinanciado}</p></div>
            <div><p className="text-slate-500">Plazo</p><p className="font-medium">{hoja.condiciones.plazoMeses} meses</p></div>
            <div><p className="text-slate-500">Desembolso</p><p className="font-medium">{hoja.condiciones.fechaDesembolso}</p></div>
            <div><p className="text-slate-500">1ra Cuota</p><p className="font-medium">{hoja.condiciones.fechaPrimeraCuota}</p></div>
            <div><p className="text-slate-500">Gracia</p><p className="font-medium">{hoja.condiciones.gracia}</p></div>
            <div><p className="text-slate-500">Residual</p><p className="font-medium">{hoja.condiciones.residual}</p></div>
          </div>
        </section>

        {/* SEGUROS Y GASTOS */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">5. Seguros y Gastos (Res. SBS 8181-2012 Anexo 4)</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {/* Desgravamen */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-2">Seguro Desgravamen</h3>
              <div className="space-y-1">
                <p><span className="text-slate-500">Tipo: </span><span className="font-medium">{hoja.segurosGastos.desgravamen.tipo}</span></p>
                <p><span className="text-slate-500">Tasa mensual: </span><span className="font-medium">{hoja.segurosGastos.desgravamen.tasaMensual}</span></p>
                <p><span className="text-slate-500">Compañía: </span><span className="font-medium">{hoja.segurosGastos.desgravamen.compania}</span></p>
                <p><span className="text-slate-500">Póliza: </span><span className="font-medium">{hoja.segurosGastos.desgravamen.poliza}</span></p>
                <p className="border-t pt-1"><span className="text-slate-500">Total pagado: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.desgravamen.totalPagado}</span></p>
              </div>
            </div>
            {/* Vehicular */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-2">Seguro Vehicular</h3>
              <div className="space-y-1">
                <p><span className="text-slate-500">Tipo: </span><span className="font-medium">{hoja.segurosGastos.vehicular.tipo}</span></p>
                <p><span className="text-slate-500">Prima anual: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.vehicular.primaAnual}</span></p>
                <p><span className="text-slate-500">Compañía: </span><span className="font-medium">{hoja.segurosGastos.vehicular.compania}</span></p>
                <p><span className="text-slate-500">Póliza: </span><span className="font-medium">{hoja.segurosGastos.vehicular.poliza}</span></p>
                <p className="border-t pt-1"><span className="text-slate-500">Total pagado: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.vehicular.totalPagado}</span></p>
              </div>
            </div>
            {/* Gastos */}
            <div className="border rounded-lg p-3 bg-slate-50">
              <h3 className="font-semibold text-slate-900 mb-2">Gastos Administrativos</h3>
              <div className="space-y-1">
                <p><span className="text-slate-500">GPS: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.gastos.gps}</span></p>
                <p><span className="text-slate-500">Notarial: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.gastos.notarial}</span></p>
                <p className="border-t pt-1"><span className="text-slate-500">Total pagado: </span><span className="font-medium">{hoja.condiciones.moneda} {hoja.segurosGastos.gastos.totalPagado}</span></p>
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-600 italic">
            ✓ El cliente tiene derecho a contratar póliza externa que cumpla las condiciones informadas (Res. SBS 8181-2012 Art. Seguros)
          </p>
        </section>

        {/* INDICADORES */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">6. Indicadores Financieros</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="border rounded-lg p-3 bg-blue-50"><p className="text-slate-500">TEA</p><p className="font-bold text-blue-900">{hoja.indicadores.tea}</p></div>
            <div className="border rounded-lg p-3 bg-emerald-50"><p className="text-slate-500">TCEA</p><p className="font-bold text-emerald-900">{hoja.indicadores.tcea}</p></div>
            <div className="border rounded-lg p-3 bg-amber-50"><p className="text-slate-500">VAN Deudor</p><p className="font-bold text-amber-900">{hoja.condiciones.moneda} {hoja.indicadores.vanDeudor}</p></div>
            <div className="border rounded-lg p-3 bg-violet-50"><p className="text-slate-500">TIR Anual</p><p className="font-bold text-violet-900">{hoja.indicadores.tirAnual}</p></div>
            <div className="col-span-2 border rounded-lg p-3 bg-red-50"><p className="text-slate-500">Costo Total del Crédito</p><p className="font-bold text-red-900">{hoja.condiciones.moneda} {hoja.indicadores.costoTotalCredito}</p></div>
            <div className="col-span-2 border rounded-lg p-3 bg-slate-50"><p className="text-slate-500">Total a Pagar (Capital + Intereses + Seguros + Gastos)</p><p className="font-bold text-slate-900">{hoja.condiciones.moneda} {hoja.indicadores.totalPagado}</p></div>
          </div>
        </section>

        {/* DESCOMPOSICIÓN TCEA */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">7. Descomposición TCEA (Transparencia SBS)</h2>
          <div className="grid grid-cols-5 gap-4 text-sm">
            <div className="border rounded-lg p-3 bg-slate-50 text-center"><p className="text-slate-500">TEA Base</p><p className="font-bold text-slate-900">{hoja.descomposicionTCEA.teaBase}</p></div>
            <div className="border rounded-lg p-3 bg-amber-50 text-center"><p className="text-slate-500">+ Desgravamen</p><p className="font-bold text-amber-900">{hoja.descomposicionTCEA.efectoDesgravamen}</p></div>
            <div className="border rounded-lg p-3 bg-blue-50 text-center"><p className="text-slate-500">+ Vehicular</p><p className="font-bold text-blue-900">{hoja.descomposicionTCEA.efectoVehicular}</p></div>
            <div className="border rounded-lg p-3 bg-emerald-50 text-center"><p className="text-slate-500">+ Gastos</p><p className="font-bold text-emerald-900">{hoja.descomposicionTCEA.efectoGastos}</p></div>
            <div className="border rounded-lg p-3 bg-red-50 text-center"><p className="text-slate-500">= TCEA Final</p><p className="font-bold text-red-900">{hoja.descomposicionTCEA.tceaFinal}</p></div>
          </div>
        </section>

        {/* CRONOGRAMA */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">8. Cronograma de Pagos (Método Francés Vencido - Meses 30 días / Año 360)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border border-slate-300">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="border p-1">N°</th>
                  <th className="border p-1">Tipo</th>
                  <th className="border p-1">Fecha</th>
                  <th className="border p-1 text-right">Saldo Inicial</th>
                  <th className="border p-1 text-right">Interés</th>
                  <th className="border p-1 text-right">Amort.</th>
                  <th className="border p-1 text-right">Desgravamen</th>
                  <th className="border p-1 text-right">Vehicular</th>
                  <th className="border p-1 text-right">Gastos</th>
                  <th className="border p-1 text-right font-medium">Cuota Total</th>
                  <th className="border p-1 text-right">Saldo Final</th>
                </tr>
              </thead>
              <tbody>
                {hoja.cronograma.map((q: CronogramaItem) => (
                  <tr key={q.numero} className="border-t">
                    <td className="border p-1">{q.numero}</td>
                    <td className="border p-1">{q.tipo}</td>
                    <td className="border p-1">{q.fechaVencimiento}</td>
                    <td className="border p-1 text-right">{q.saldoInicial}</td>
                    <td className="border p-1 text-right">{q.interes}</td>
                    <td className="border p-1 text-right">{q.amortizacion}</td>
                    <td className="border p-1 text-right">{q.desgravamen}</td>
                    <td className="border p-1 text-right">{q.vehicular}</td>
                    <td className="border p-1 text-right">{q.otrosGastos}</td>
                    <td className="border p-1 text-right font-medium">{q.cuotaTotal}</td>
                    <td className="border p-1 text-right">{q.saldoFinal}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold">
                <tr>
                  <td className="border p-1" colSpan={3}>TOTALES</td>
                  <td className="border p-1 text-right">—</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.intereses}</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.intereses}</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.desgravamen}</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.vehicular}</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.gastos}</td>
                  <td className="border p-1 text-right">{hoja.totalesCronograma.totalPagado}</td>
                  <td className="border p-1 text-right">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* BENEFICIOS, RIESGOS, CONDICIONES */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">9. Beneficios, Riesgos y Condiciones (Anexo 4 Res. SBS 8181-2012)</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="border-l-4 border-emerald-500 pl-3">
              <h3 className="font-semibold text-emerald-800 mb-2">Beneficios</h3>
              <ul className="space-y-1 list-disc list-inside">
                {hoja.beneficiosRiesgos.beneficios.map((b: string, i: number) => <li key={i}>{b}</li>)}
              </ul>
            </div>
            <div className="border-l-4 border-red-500 pl-3">
              <h3 className="font-semibold text-red-800 mb-2">Riesgos</h3>
              <ul className="space-y-1 list-disc list-inside">
                {hoja.beneficiosRiesgos.riesgos.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
            <div className="border-l-4 border-blue-500 pl-3">
              <h3 className="font-semibold text-blue-800 mb-2">Condiciones</h3>
              <ul className="space-y-1 list-disc list-inside">
                {hoja.beneficiosRiesgos.condiciones.map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* FÓRMULAS */}
        <section className="border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide mb-2">10. Fórmulas de Cálculo (Res. SBS 8181-2012 - Difusión Programas)</h2>
          <div className="grid grid-cols-2 gap-4 text-sm font-mono text-slate-700 bg-slate-50 p-3 rounded">
            {Object.entries(hoja.formulas).map(([key, formula]) => (
              <div key={key} className="space-y-1">
                <p className="font-semibold text-slate-900">{key.toUpperCase()}</p>
                <p className="text-slate-600">{formula}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="text-xs text-slate-500 text-center border-t pt-4 print:hidden">
          <p>Generado el {hoja.metadata.fechaGeneracion} | Cotización v{hoja.metadata.versionCotizacion} | VehiFlow - Compra Inteligente Perú</p>
          <p>Este documento es informativo. La contratación está sujeta a evaluación crediticia y condiciones de la entidad.</p>
        </footer>
      </main>
    </div>
  )
}