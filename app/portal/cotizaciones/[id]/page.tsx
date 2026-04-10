import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { toJsonSafe } from "@/lib/json-safe"
import { verificarTokenEnlaceCotizacion } from "@/lib/public-link"

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export const dynamic = "force-dynamic"

export default async function PortalCotizacionPage({ params, searchParams }: Props) {
  const { id } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border rounded-xl p-6 space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">Enlace incompleto</h1>
          <p className="text-slate-600">Necesitás un token válido para ver esta cotización pública.</p>
        </div>
      </main>
    )
  }

  const validacion = verificarTokenEnlaceCotizacion(token, id)
  if (!validacion.ok) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border rounded-xl p-6 space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">Enlace no válido</h1>
          <p className="text-slate-600">{validacion.reason}. Pedile a tu asesor que te comparta un enlace nuevo.</p>
        </div>
      </main>
    )
  }

  const cotizacionDb = await prisma.cotizacion.findUnique({
    where: { id: BigInt(id) },
    include: {
      cliente: true,
      vehiculo: true,
      cuotas: {
        orderBy: { numero: "asc" },
      },
    },
  })

  if (!cotizacionDb) {
    notFound()
  }

  const cotizacion = toJsonSafe(cotizacionDb)

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-white border rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Portal de cliente</p>
          <h1 className="text-2xl font-bold text-slate-900">Tu cotización de Compra Inteligente</h1>
          <p className="text-slate-600 mt-1">
            Cotización #{cotizacion.id} · Estado: {cotizacion.estado}
          </p>
        </header>

        <section className="bg-white border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-500">Cliente</p>
            <p className="font-medium text-slate-900">
              {cotizacion.cliente.nombres} {cotizacion.cliente.apPaterno}
            </p>
            <p>{cotizacion.cliente.tipoDocumento}: {cotizacion.cliente.numDocumento}</p>
          </div>
          <div>
            <p className="text-slate-500">Vehículo</p>
            <p className="font-medium text-slate-900">
              {cotizacion.vehiculo.marca} {cotizacion.vehiculo.modelo} {cotizacion.vehiculo.anio}
            </p>
            <p>{cotizacion.vehiculo.concesionario}</p>
          </div>
          <div>
            <p className="text-slate-500">Indicadores</p>
            <p>TCEA: <span className="font-medium text-slate-900">{Number(cotizacion.tcea).toFixed(4)}%</span></p>
            <p>TIR anual: <span className="font-medium text-slate-900">{Number(cotizacion.tirAnual).toFixed(4)}%</span></p>
            <p>VAN: <span className="font-medium text-slate-900">{Number(cotizacion.vanDeudor).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</span></p>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Cronograma de pagos</h2>
            <p className="text-xs text-slate-500">Meses de 30 días · Año comercial 360</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="text-left p-2">N°</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-right p-2">Interés</th>
                  <th className="text-right p-2">Amortización</th>
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
                    <td className="p-2 text-right">{Number(q.interes).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.amortizacion).toFixed(2)}</td>
                    <td className="p-2 text-right">{(Number(q.segDesgravamen) + Number(q.segVehicular)).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.otrosGastos).toFixed(2)}</td>
                    <td className="p-2 text-right font-semibold">{Number(q.cuotaTotal).toFixed(2)}</td>
                    <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="text-xs text-slate-500 text-center pb-4">
          Esta vista es informativa. Si querés una nueva simulación o resolver dudas, comunicate con tu asesor.
          <div className="mt-2">
            <Link href="/transparencia" className="text-blue-600 hover:underline">Ver módulo de transparencia</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
