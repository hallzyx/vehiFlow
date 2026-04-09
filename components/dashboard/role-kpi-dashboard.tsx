"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Props = {
  role: "ADMIN" | "ASESOR" | "ANALISTA" | "AUDITOR"
  profile: {
    roleTitle: string
    objective: string
    primaryKpis: string[]
  }
  kpis: Record<string, number>
  charts: {
    estadoCotizaciones: Array<{ name: string; value: number; color: string }>
    topVehiculos: Array<{ name: string; value: number }>
    volumenMensual: Array<{ month: string; monto: number; cotizaciones: number; aprobadas: number; conversion: number }>
  }
}

const kpiMeta: Record<string, { label: string; format: "number" | "currency" | "percent"; help: string }> = {
  cotizacionesMes: {
    label: "Cotizaciones del mes",
    format: "number",
    help: "Mide productividad comercial y velocidad de originación.",
  },
  variacionCotizaciones: {
    label: "Variación mensual",
    format: "percent",
    help: "Compara cotizaciones del mes actual vs mes anterior.",
  },
  conversionRate: {
    label: "Conversión a aprobadas",
    format: "percent",
    help: "Porcentaje de cotizaciones que pasan a estado APROBADA.",
  },
  operacionesActivas: {
    label: "Operaciones activas",
    format: "number",
    help: "Base activa de créditos en seguimiento.",
  },
  carteraActiva: {
    label: "Cartera activa (saldo)",
    format: "currency",
    help: "Suma de saldo de capital pendiente en operaciones activas.",
  },
  pagosMes: {
    label: "Recaudación del mes",
    format: "currency",
    help: "Total pagado por clientes durante el mes actual.",
  },
  pagosAnticipadosMes: {
    label: "Pagos anticipados",
    format: "number",
    help: "Número de pagos anticipados registrados (sin penalidad).",
  },
  clientesNuevosMes: {
    label: "Clientes nuevos",
    format: "number",
    help: "Nuevos clientes ingresados al flujo comercial.",
  },
  tceaPromedio: {
    label: "TCEA promedio",
    format: "percent",
    help: "Promedio de TCEA de cotizaciones del mes (control de transparencia).",
  },
  costoPromedio: {
    label: "Costo crédito promedio",
    format: "currency",
    help: "Costo promedio para el deudor en cotizaciones del período.",
  },
  operacionesCerradas: {
    label: "Operaciones cerradas",
    format: "number",
    help: "Créditos finalizados o cancelados en histórico.",
  },
  auditMes: {
    label: "Eventos auditados",
    format: "number",
    help: "Volumen de eventos sensibles registrados en audit_log.",
  },
  cotizacionesTotales: {
    label: "Cotizaciones totales",
    format: "number",
    help: "Acumulado histórico de cotizaciones en el alcance del rol.",
  },
}

function formatValue(value: number, format: "number" | "currency" | "percent") {
  if (format === "currency") {
    return `S/ ${Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
  if (format === "percent") {
    return `${Number(value || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
  }
  return Number(value || 0).toLocaleString("es-PE")
}

export function RoleKpiDashboard({ role, profile, kpis, charts }: Props) {
  const primaryCards = profile.primaryKpis
    .map((key) => ({ key, ...kpiMeta[key], value: kpis[key] ?? 0 }))
    .filter((item) => !!item.label)

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border p-5">
        <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Vista por rol</p>
        <h2 className="text-xl font-bold text-slate-900 mt-1">{profile.roleTitle}</h2>
        <p className="text-slate-600 mt-1 text-sm">Objetivo: {profile.objective}</p>
        <p className="text-xs text-slate-500 mt-2">
          Dashboard diseñado para decisiones de negocio, cumplimiento SBS y seguimiento de cartera.
        </p>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {primaryCards.map((k) => (
          <article key={k.key} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{formatValue(k.value, k.format)}</p>
            <p className="text-xs text-slate-500 mt-2">{k.help}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <article className="bg-white rounded-xl border p-4 xl:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3">Volumen financiero (últimos 6 meses)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.volumenMensual}>
                <defs>
                  <linearGradient id="montoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`} />
                <Area type="monotone" dataKey="monto" stroke="#2563eb" fill="url(#montoGradient)" strokeWidth={2.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Estado de cotizaciones</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.estadoCotizaciones} dataKey="value" nameKey="name" outerRadius={95} innerRadius={45}>
                  {charts.estadoCotizaciones.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <article className="bg-white rounded-xl border p-4 xl:col-span-2">
          <h3 className="font-semibold text-slate-900 mb-3">Conversión mensual (cotizaciones vs aprobadas)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.volumenMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cotizaciones" fill="#93c5fd" name="Cotizaciones" radius={[6, 6, 0, 0]} />
                <Bar dataKey="aprobadas" fill="#10b981" name="Aprobadas" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="bg-white rounded-xl border p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Vehículos más cotizados</h3>
          <ul className="space-y-2">
            {charts.topVehiculos.length === 0 ? (
              <li className="text-sm text-slate-500">No hay datos todavía.</li>
            ) : (
              charts.topVehiculos.map((v, i) => (
                <li key={v.name} className="flex items-center justify-between text-sm border rounded p-2">
                  <span className="text-slate-700">#{i + 1} {v.name}</span>
                  <span className="font-semibold text-slate-900">{v.value}</span>
                </li>
              ))
            )}
          </ul>

          <div className="mt-4 p-3 rounded border bg-slate-50 text-xs text-slate-600">
            {role === "AUDITOR"
              ? "Enfoque auditor: validar trazabilidad entre estado de cotización, pagos y eventos de auditoría."
              : role === "ANALISTA"
                ? "Enfoque analista: contrastar costo de crédito, conversión y evolución del portafolio por mes."
                : role === "ASESOR"
                  ? "Enfoque asesor: mejorar tasa de cierre y productividad de cotizaciones con explicación transparente."
                  : "Enfoque admin: balance entre crecimiento comercial, control de riesgo y cumplimiento normativo."}
          </div>
        </article>
      </section>
    </div>
  )
}
