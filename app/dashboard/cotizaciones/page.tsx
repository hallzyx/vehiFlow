import Link from "next/link"

export const dynamic = "force-dynamic"

async function getCotizaciones() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/cotizaciones`, {
    cache: "no-store",
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.cotizaciones ?? []
}

export default async function CotizacionesPage() {
  const cotizaciones = await getCotizaciones()

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Cotizaciones</h1>
            <p className="text-sm text-slate-600">Historial de simulaciones guardadas</p>
          </div>
          <Link
            href="/dashboard/cotizaciones/nueva"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Nueva Cotización
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Documento</th>
                <th className="text-left p-3">Vehículo</th>
                <th className="text-left p-3">Monto</th>
                <th className="text-left p-3">TCEA</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cotizaciones.length === 0 ? (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={8}>
                    No hay cotizaciones registradas todavía.
                  </td>
                </tr>
              ) : (
                cotizaciones.map((c: any) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">#{c.id}</td>
                    <td className="p-3">{c.cliente}</td>
                    <td className="p-3">{c.documento}</td>
                    <td className="p-3">{c.vehiculo}</td>
                    <td className="p-3">
                      {c.moneda} {Number(c.montoFinanc).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3">{Number(c.tcea).toFixed(4)}%</td>
                    <td className="p-3">{c.estado}</td>
                     <td className="p-3">
                       <div className="flex gap-2">
                         <Link
                           className="text-blue-600 hover:underline"
                           href={`/dashboard/cotizaciones/${c.id}`}
                         >
                           Ver detalle
                         </Link>
                         {(c.estado === 'SIMULADA' || c.estado === 'PRESENTADA') && (
                           <Link
                             className="text-green-600 hover:underline"
                             href={`/dashboard/cotizaciones/${c.id}/editar`}
                           >
                             Editar
                           </Link>
                         )}
                       </div>
                     </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
