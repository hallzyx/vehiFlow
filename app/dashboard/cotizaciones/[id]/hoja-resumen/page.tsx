'use client'

import { useEffect, useState } from "react"
import Link from "next/link"

function fmtMoney(n: number, moneda = "PEN") {
  return `${moneda} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtPct(n: number, digits = 4) {
  return `${Number(n).toFixed(digits)}%`
}

export default function HojaResumenPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState("")
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId)
      fetch(`/api/cotizaciones/${paramId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setCotizacion(data?.cotizacion ?? null))
        .catch(() => setCotizacion(null))
        .finally(() => setLoading(false))
    })
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">Cargando hoja resumen...</p>
      </div>
    )
  }

  if (!cotizacion) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-600">Cotización no encontrada</p>
      </div>
    )
  }

  const moneda = cotizacion.monedaOp || "PEN"
  const graciaTotal = Number(cotizacion.graciaTotalMeses || 0)
  const graciaParcial = Number(cotizacion.graciaParcialMeses || 0)
  const graciaTxt =
    graciaTotal + graciaParcial > 0
      ? `Total ${graciaTotal} / Parcial ${graciaParcial} meses`
      : "Sin gracia"

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style jsx global>{`
        @media print {
          aside,
          header.fixed,
          .no-print,
          nav {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
        }
      `}</style>

      <div className="no-print border-b bg-slate-50 px-4 py-3 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/cotizaciones/${id}`}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Volver a cotización
          </Link>
          <h1 className="text-lg font-semibold">Hoja resumen — Cotización #{cotizacion.id}</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm"
        >
          Imprimir
        </button>
      </div>

      <article className="max-w-4xl mx-auto px-6 py-8 space-y-8 print:max-w-none print:px-0 print:py-4">
        <header className="border-b pb-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Crédito Vehicular — Compra Inteligente (IB)
          </p>
          <h2 className="text-2xl font-bold mt-1">Hoja Resumen</h2>
          <p className="text-sm text-slate-600 mt-1">
            Cotización #{cotizacion.id} · Versión {cotizacion.version} · Estado {cotizacion.estado}
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Cliente</h3>
            <p>
              {cotizacion.cliente.nombres} {cotizacion.cliente.apPaterno}{" "}
              {cotizacion.cliente.apMaterno || ""}
            </p>
            <p>
              {cotizacion.cliente.tipoDocumento}: {cotizacion.cliente.numDocumento}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Vehículo</h3>
            <p>
              {cotizacion.vehiculo.marca} {cotizacion.vehiculo.modelo} {cotizacion.vehiculo.anio}
            </p>
            <p>{cotizacion.vehiculo.concesionario}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Moneda</h3>
            <p className="text-lg font-medium">{moneda}</p>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Indicadores</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
            <div className="border rounded p-3">
              <p className="text-slate-500">TEA</p>
              <p className="font-semibold">{fmtPct(cotizacion.tea)}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">TEM</p>
              <p className="font-semibold">{fmtPct(cotizacion.tem, 6)}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">TCEA</p>
              <p className="font-semibold">{fmtPct(cotizacion.tcea)}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">VAN deudor</p>
              <p className="font-semibold">{fmtMoney(Number(cotizacion.vanDeudor), moneda)}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">TIR anual</p>
              <p className="font-semibold">{fmtPct(cotizacion.tirAnual)}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Condiciones del crédito</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div className="border rounded p-3">
              <p className="text-slate-500">Monto financiado</p>
              <p className="font-semibold">{fmtMoney(Number(cotizacion.montoFinanc), moneda)}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">Plazo</p>
              <p className="font-semibold">{cotizacion.plazoMeses} meses</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">Cuota inicial</p>
              <p className="font-semibold">
                {fmtMoney(Number(cotizacion.cuotaIniMnt), moneda)} ({Number(cotizacion.cuotaIniPct).toFixed(2)}%)
              </p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">Residual / cuota final</p>
              <p className="font-semibold">
                {cotizacion.residualFlag
                  ? fmtMoney(Number(cotizacion.residualMonto || 0), moneda)
                  : "No aplica"}
              </p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">Gracia</p>
              <p className="font-semibold">{graciaTxt}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-slate-500">Tipo tasa + capitalización</p>
              <p className="font-semibold">
                {cotizacion.tipoTasa || "TEA"}
                {cotizacion.capitalizacion ? ` · ${cotizacion.capitalizacion}` : ""}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-3">Cronograma simplificado</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700">
                  <th className="text-left p-2 border">N°</th>
                  <th className="text-left p-2 border">Fecha</th>
                  <th className="text-right p-2 border">Interés</th>
                  <th className="text-right p-2 border">Amort.</th>
                  <th className="text-right p-2 border">Cuota total</th>
                  <th className="text-right p-2 border">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {(cotizacion.cuotas || []).map((q: any) => (
                  <tr key={q.id} className="border-t">
                    <td className="p-2 border">{q.numero}</td>
                    <td className="p-2 border">
                      {new Date(q.fecVencimiento).toLocaleDateString("es-PE")}
                    </td>
                    <td className="p-2 border text-right">{Number(q.interes).toFixed(2)}</td>
                    <td className="p-2 border text-right">{Number(q.amortizacion).toFixed(2)}</td>
                    <td className="p-2 border text-right font-medium">
                      {Number(q.cuotaTotal).toFixed(2)}
                    </td>
                    <td className="p-2 border text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border-t pt-4 text-sm text-slate-700 space-y-2">
          <p>
            <strong>Nota legal:</strong> El cliente tiene derecho a efectuar pagos anticipados
            totales o parciales sin penalidad ni comisión, conforme a la Ley N.° 29571 (Código de
            Protección y Defensa del Consumidor) y la normativa SBS de transparencia.
          </p>
          <p className="text-xs text-slate-500">
            Sistema de amortización: francés vencido ordinario (Compra Inteligente IB). Año comercial
            360 días · frecuencia mensual 30 días.
          </p>
        </section>
      </article>
    </div>
  )
}
