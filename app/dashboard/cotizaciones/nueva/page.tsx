"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { HelpTooltip } from "@/components/transparencia/help-tooltip"
import { MarcaModeloFields } from "@/components/vehiculos/marca-modelo-fields"
import { ayudaCamposCotizacion } from "@/lib/transparencia-help"
import { calcularTEA } from "@/lib/motor-financiero"
import {
  INTERBANK_TEA_PLAN36,
  interbankOperacionDemo,
  interbankProductoDefaults,
  pctCuotaFinalInterbank,
} from "@/lib/interbank-producto-defaults"

type TipoDoc = "DNI" | "CE" | "PASAPORTE"
type Moneda = "PEN" | "USD"

const pasos = ["Cliente", "Vehículo", "Parámetros", "Confirmación"]

function pctCuotaFinalPorPlazo(plazoMeses: number): number | null {
  return pctCuotaFinalInterbank(plazoMeses)
}

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(null)

  const [cliente, setCliente] = useState({
    tipoDocumento: "DNI" as TipoDoc,
    numDocumento: "",
    nombres: "",
    apPaterno: "",
    apMaterno: "",
    celular: "",
    correo: "",
    direccion: "",
    ingresosMens: 0,
    monedaIngres: "PEN" as Moneda,
    situacionLab: "",
    empresaEmpl: "",
  })

  const [vehiculo, setVehiculo] = useState({
    marca: "",
    modelo: "",
    version: "",
    anio: new Date().getFullYear(),
    precioLista: 0,
    monedaPrecio: "PEN" as Moneda,
    concesionario: "",
    valResidEst: 0,
    tipoValResid: "MONTO" as "MONTO" | "PORCENTAJE",
  })

  const [parametros, setParametros] = useState({
    monedaOp: "PEN" as Moneda,
    ...interbankProductoDefaults,
    tasaIngresada: INTERBANK_TEA_PLAN36,
    precioVehiculo: 0,
    cuotaIniPct: 20,
    cuotaIniMnt: 0,
    plazoMeses: 36,
    fecDesembolso: new Date().toISOString().slice(0, 10),
    fec1eraCuota: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    graciaFlag: false,
    graciaTipo: "PARCIAL" as "TOTAL" | "PARCIAL",
    graciaMeses: 0,
    graciaTotalMeses: 0,
    graciaParcialMeses: 0,
    motivoEdicion: "",
  })

  const costosIniciales = useMemo(
    () =>
      parametros.gastoNotarial +
      parametros.costeRegistral +
      parametros.costeTasacion +
      parametros.comisionEstudio +
      parametros.comisionActivacion,
    [
      parametros.gastoNotarial,
      parametros.costeRegistral,
      parametros.costeTasacion,
      parametros.comisionEstudio,
      parametros.comisionActivacion,
    ]
  )

  const prestamoEstimado = useMemo(() => {
    return Math.max(0, parametros.precioVehiculo - parametros.cuotaIniMnt + costosIniciales)
  }, [parametros.precioVehiculo, parametros.cuotaIniMnt, costosIniciales])

  const teaDecimal = useMemo(() => {
    try {
      return calcularTEA(parametros.tasaIngresada, "TEA", null)
    } catch {
      return null
    }
  }, [parametros.tasaIngresada])

  const siguiente = () => setPaso((p) => Math.min(p + 1, pasos.length - 1))
  const anterior = () => setPaso((p) => Math.max(p - 1, 0))

  const syncGracia = (total: number, parcial: number) => ({
    graciaTotalMeses: total,
    graciaParcialMeses: parcial,
    graciaFlag: total + parcial > 0,
    graciaTipo: (total > 0 ? "TOTAL" : "PARCIAL") as "TOTAL" | "PARCIAL",
    graciaMeses: total > 0 ? total : parcial,
  })

  /** Rellena con perfil Interbank Compra Inteligente (Plan 36). */
  const rellenarDemo = () => {
    const hoy = new Date()
    const fecDesembolso = hoy.toISOString().slice(0, 10)
    const fec1era = new Date(hoy)
    fec1era.setDate(fec1era.getDate() + 30)
    const precio = interbankOperacionDemo.precioVehiculo
    const cuotaIniPct = interbankOperacionDemo.cuotaIniPct
    const cuotaIniMnt = (precio * cuotaIniPct) / 100
    const docSuffix = String(hoy.getTime()).slice(-8)

    setSelectedClienteId(null)
    setSelectedVehiculoId(null)
    setError("")

    setCliente({
      tipoDocumento: "DNI",
      numDocumento: docSuffix.padStart(8, "0").slice(0, 8),
      nombres: "María Elena",
      apPaterno: "Quispe",
      apMaterno: "Rojas",
      celular: "999888777",
      correo: "maria.quispe.demo@example.com",
      direccion: "Av. Javier Prado Este 4200, San Borja, Lima",
      ingresosMens: interbankOperacionDemo.ingresosMens,
      monedaIngres: "PEN",
      situacionLab: "DEPENDIENTE",
      empresaEmpl: "Cliente cuenta sueldo Interbank (demo)",
    })

    setVehiculo({
      marca: interbankOperacionDemo.marca,
      modelo: interbankOperacionDemo.modelo,
      version: interbankOperacionDemo.version,
      anio: hoy.getFullYear(),
      precioLista: precio,
      monedaPrecio: "PEN",
      concesionario: interbankOperacionDemo.concesionario,
      valResidEst: precio * interbankProductoDefaults.pctCuotaFinal,
      tipoValResid: "MONTO",
    })

    setParametros({
      monedaOp: interbankOperacionDemo.monedaOp,
      ...interbankProductoDefaults,
      tasaIngresada: INTERBANK_TEA_PLAN36,
      precioVehiculo: precio,
      cuotaIniPct,
      cuotaIniMnt,
      plazoMeses: interbankOperacionDemo.plazoMeses,
      fecDesembolso,
      fec1eraCuota: fec1era.toISOString().slice(0, 10),
      ...syncGracia(
        interbankOperacionDemo.graciaTotalMeses,
        interbankOperacionDemo.graciaParcialMeses
      ),
      motivoEdicion: "",
    })

    setPaso(0)
  }

  const onPlazoChange = (plazoMeses: number) => {
    const pct = pctCuotaFinalPorPlazo(plazoMeses)
    setParametros((p) => ({
      ...p,
      plazoMeses,
      ...(pct != null ? { pctCuotaFinal: pct } : {}),
    }))
  }

  const guardar = async () => {
    setLoading(true)
    setError("")
    try {
      const graciaFlag =
        parametros.graciaTotalMeses + parametros.graciaParcialMeses > 0
      const payload: any = {
        selectedClienteId: selectedClienteId ?? undefined,
        selectedVehiculoId: selectedVehiculoId ?? undefined,
        cliente: selectedClienteId ? undefined : cliente,
        vehiculo: selectedVehiculoId ? undefined : vehiculo,
        parametros: {
          ...parametros,
          graciaFlag,
          graciaTipo: parametros.graciaTotalMeses > 0 ? "TOTAL" : "PARCIAL",
          graciaMeses:
            parametros.graciaTotalMeses > 0
              ? parametros.graciaTotalMeses
              : parametros.graciaParcialMeses,
        },
      }

      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : "No se pudo crear la cotización")
      }

      router.push(`/dashboard/cotizaciones/${data.id}`)
    } catch (e: any) {
      setError(e.message || "Error guardando cotización")
    } finally {
      setLoading(false)
    }
  }

  const fmtMoney = (n: number) =>
    n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Nueva Cotización</h1>
              <p className="text-sm text-slate-500 mt-1">
                Usa «Rellenar demo Interbank» para cargar un caso Compra Inteligente Plan 36 (tarifario entidad).
              </p>
            </div>
            <button
              type="button"
              onClick={rellenarDemo}
              className="shrink-0 px-3 py-2 text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              title="Carga perfil Interbank Compra Inteligente Plan 36 (TEA ≈16.18%, residual 40%, tarifario IB)"
            >
              Rellenar demo Interbank
            </button>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            {pasos.map((p, i) => (
              <span
                key={p}
                className={`px-3 py-1 rounded-full text-sm ${
                  i === paso ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {i + 1}. {p}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

        <div className="bg-white rounded-xl border p-6 space-y-6">
          {paso === 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Paso 1: Cliente</h2>
              <p className="text-sm text-slate-600">
                Completá los datos del cliente. Si ya existe en BD, luego agregamos búsqueda avanzada.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Tipo documento <HelpTooltip {...ayudaCamposCotizacion.tipoDocumento} />
                  </span>
                  <select
                    className="w-full border rounded p-2"
                    value={cliente.tipoDocumento}
                    onChange={(e) => setCliente((c) => ({ ...c, tipoDocumento: e.target.value as TipoDoc }))}
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">PASAPORTE</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    N° documento <HelpTooltip {...ayudaCamposCotizacion.numDocumento} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.numDocumento}
                    onChange={(e) => setCliente((c) => ({ ...c, numDocumento: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Nombres <HelpTooltip {...ayudaCamposCotizacion.nombres} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.nombres}
                    onChange={(e) => setCliente((c) => ({ ...c, nombres: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Apellido paterno <HelpTooltip {...ayudaCamposCotizacion.apPaterno} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.apPaterno}
                    onChange={(e) => setCliente((c) => ({ ...c, apPaterno: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Apellido materno <HelpTooltip {...ayudaCamposCotizacion.apMaterno} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.apMaterno}
                    onChange={(e) => setCliente((c) => ({ ...c, apMaterno: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Celular <HelpTooltip {...ayudaCamposCotizacion.celular} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.celular}
                    onChange={(e) => setCliente((c) => ({ ...c, celular: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm inline-flex items-center gap-1">
                    Correo <HelpTooltip {...ayudaCamposCotizacion.correo} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.correo}
                    onChange={(e) => setCliente((c) => ({ ...c, correo: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm inline-flex items-center gap-1">
                    Dirección <HelpTooltip {...ayudaCamposCotizacion.direccion} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.direccion}
                    onChange={(e) => setCliente((c) => ({ ...c, direccion: e.target.value }))}
                  />
                </label>
              </div>
            </section>
          )}

          {paso === 1 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Paso 2: Vehículo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <MarcaModeloFields
                  marca={vehiculo.marca}
                  modelo={vehiculo.modelo}
                  onMarcaChange={(marca) => setVehiculo((v) => ({ ...v, marca }))}
                  onModeloChange={(modelo) => setVehiculo((v) => ({ ...v, modelo }))}
                  marcaLabel={
                    <>
                      Marca <HelpTooltip {...ayudaCamposCotizacion.marca} />
                    </>
                  }
                  modeloLabel={
                    <>
                      Modelo <HelpTooltip {...ayudaCamposCotizacion.modelo} />
                    </>
                  }
                />
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Versión <HelpTooltip {...ayudaCamposCotizacion.version} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={vehiculo.version}
                    onChange={(e) => setVehiculo((v) => ({ ...v, version: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Año <HelpTooltip {...ayudaCamposCotizacion.anio} />
                  </span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={vehiculo.anio}
                    onChange={(e) => setVehiculo((v) => ({ ...v, anio: Number(e.target.value) }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Precio lista <HelpTooltip {...ayudaCamposCotizacion.precioLista} />
                  </span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={vehiculo.precioLista}
                    onChange={(e) => {
                      const precio = Number(e.target.value)
                      setVehiculo((v) => ({ ...v, precioLista: precio }))
                      setParametros((p) => ({
                        ...p,
                        precioVehiculo: precio,
                        cuotaIniMnt: (precio * p.cuotaIniPct) / 100,
                      }))
                    }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm inline-flex items-center gap-1">
                    Moneda <HelpTooltip {...ayudaCamposCotizacion.monedaPrecio} />
                  </span>
                  <select
                    className="w-full border rounded p-2"
                    value={vehiculo.monedaPrecio}
                    onChange={(e) => {
                      const monedaPrecio = e.target.value as Moneda
                      setVehiculo((v) => ({ ...v, monedaPrecio }))
                      setParametros((p) => ({ ...p, monedaOp: monedaPrecio }))
                    }}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm inline-flex items-center gap-1">
                    Concesionario <HelpTooltip {...ayudaCamposCotizacion.concesionario} />
                  </span>
                  <input
                    className="w-full border rounded p-2"
                    value={vehiculo.concesionario}
                    onChange={(e) => setVehiculo((v) => ({ ...v, concesionario: e.target.value }))}
                  />
                </label>
              </div>
            </section>
          )}

          {paso === 2 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Paso 3: Parámetros financieros</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Vista de la <strong>entidad</strong> (enunciado SI642): el asesor configura la operación.
                  Agrupamos lo que negocia el cliente, lo que viene del tarifario/producto y el COK solo para el VAN académico.
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900">A. Datos de la operación (cliente / negociación)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lo que el cliente elige o acuerda con el asesor: moneda, precio, inicial, plazo, fechas y gracia.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Moneda operación
                      <HelpTooltip {...ayudaCamposCotizacion.monedaOp} />
                    </span>
                    <select
                      className="w-full border rounded p-2"
                      value={parametros.monedaOp}
                      onChange={(e) => setParametros((p) => ({ ...p, monedaOp: e.target.value as Moneda }))}
                    >
                      <option value="PEN">PEN</option>
                      <option value="USD">USD</option>
                    </select>
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Precio vehículo
                      <HelpTooltip {...ayudaCamposCotizacion.precioVehiculo} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={parametros.precioVehiculo}
                      onChange={(e) => {
                        const precioVehiculo = Number(e.target.value)
                        setParametros((p) => ({
                          ...p,
                          precioVehiculo,
                          cuotaIniMnt: (precioVehiculo * p.cuotaIniPct) / 100,
                        }))
                      }}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Cuota inicial (%)
                      <HelpTooltip {...ayudaCamposCotizacion.cuotaInicial} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded p-2"
                      value={parametros.cuotaIniPct}
                      onChange={(e) => {
                        const pct = Number(e.target.value)
                        setParametros((p) => ({
                          ...p,
                          cuotaIniPct: pct,
                          cuotaIniMnt: (p.precioVehiculo * pct) / 100,
                        }))
                      }}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Cuota inicial (monto)
                      <HelpTooltip {...ayudaCamposCotizacion.cuotaInicial} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={parametros.cuotaIniMnt}
                      onChange={(e) => setParametros((p) => ({ ...p, cuotaIniMnt: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Plazo (meses)
                      <HelpTooltip {...ayudaCamposCotizacion.plazoMeses} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={parametros.plazoMeses}
                      onChange={(e) => onPlazoChange(Number(e.target.value))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Fecha desembolso
                      <HelpTooltip {...ayudaCamposCotizacion.fecDesembolso} />
                    </span>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={parametros.fecDesembolso}
                      onChange={(e) => setParametros((p) => ({ ...p, fecDesembolso: e.target.value }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Fecha 1ra cuota
                      <HelpTooltip {...ayudaCamposCotizacion.fec1eraCuota} />
                    </span>
                    <input
                      type="date"
                      className="w-full border rounded p-2"
                      value={parametros.fec1eraCuota}
                      onChange={(e) => setParametros((p) => ({ ...p, fec1eraCuota: e.target.value }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Gracia total (meses)
                      <HelpTooltip {...ayudaCamposCotizacion.graciaTotalMeses} />
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded p-2"
                      value={parametros.graciaTotalMeses}
                      onChange={(e) => {
                        const graciaTotalMeses = Number(e.target.value)
                        setParametros((p) => ({
                          ...p,
                          ...syncGracia(graciaTotalMeses, p.graciaParcialMeses),
                        }))
                      }}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Gracia parcial (meses)
                      <HelpTooltip {...ayudaCamposCotizacion.graciaParcialMeses} />
                    </span>
                    <input
                      type="number"
                      min={0}
                      className="w-full border rounded p-2"
                      value={parametros.graciaParcialMeses}
                      onChange={(e) => {
                        const graciaParcialMeses = Number(e.target.value)
                        setParametros((p) => ({
                          ...p,
                          ...syncGracia(p.graciaTotalMeses, graciaParcialMeses),
                        }))
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900">B. Parámetros del producto / tarifario (Interbank)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Valores de producto Compra Inteligente Interbank (inicial ≥20%, balón 40%/50%, seguros y gastos del
                    plan). En producción los carga el sistema; aquí el asesor los puede ajustar para la simulación.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Tasa Efectiva Anual (TEA %)
                      <HelpTooltip {...ayudaCamposCotizacion.tasaIngresada} />
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.tasaIngresada}
                      onChange={(e) => setParametros((p) => ({ ...p, tasaIngresada: Number(e.target.value) }))}
                    />
                    <p className="text-xs text-slate-500">
                      Indicación del curso: solo TEA. TEM = (1+TEA)^(30/360)−1
                      {teaDecimal != null
                        ? ` · TEM ≈ ${(Math.pow(1 + teaDecimal, 1 / 12) * 100 - 100).toFixed(4)}%`
                        : ""}
                      .
                    </p>
                  </label>

                  <label className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      checked={parametros.residualFlag}
                      onChange={(e) => setParametros((p) => ({ ...p, residualFlag: e.target.checked }))}
                    />
                    <span className="text-sm flex items-center">
                      Incluir valor residual (Compra Inteligente)
                      <HelpTooltip {...ayudaCamposCotizacion.pctCuotaFinal} />
                    </span>
                  </label>

                  {parametros.residualFlag && (
                    <>
                      <label className="space-y-1">
                        <span className="text-sm flex items-center">
                          % Cuota final
                          <HelpTooltip {...ayudaCamposCotizacion.pctCuotaFinal} />
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          max={100}
                          className="w-full border rounded p-2 bg-white"
                          value={Number((parametros.pctCuotaFinal * 100).toFixed(4))}
                          onChange={(e) =>
                            setParametros((p) => ({
                              ...p,
                              pctCuotaFinal: Number(e.target.value) / 100,
                            }))
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm flex items-center">
                          Monto residual (0 = calcular con %)
                          <HelpTooltip {...ayudaCamposCotizacion.residualMonto} />
                        </span>
                        <input
                          type="number"
                          className="w-full border rounded p-2 bg-white"
                          value={parametros.residualMonto}
                          onChange={(e) =>
                            setParametros((p) => ({ ...p, residualMonto: Number(e.target.value) }))
                          }
                        />
                      </label>
                    </>
                  )}

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Seguro desgravamen (período)
                      <HelpTooltip {...ayudaCamposCotizacion.segDesgrav} />
                    </span>
                    <input
                      type="number"
                      step="0.00001"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.segDesgrav}
                      onChange={(e) => setParametros((p) => ({ ...p, segDesgrav: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      % Seguro riesgo anual
                      <HelpTooltip {...ayudaCamposCotizacion.pctSegRie} />
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.pctSegRie}
                      onChange={(e) => setParametros((p) => ({ ...p, pctSegRie: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      GPS (período)
                      <HelpTooltip {...ayudaCamposCotizacion.gastoGps} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.gastoGps}
                      onChange={(e) => setParametros((p) => ({ ...p, gastoGps: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Portes (período)
                      <HelpTooltip {...ayudaCamposCotizacion.portesPer} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.portesPer}
                      onChange={(e) => setParametros((p) => ({ ...p, portesPer: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Gastos administración (período)
                      <HelpTooltip {...ayudaCamposCotizacion.gasAdmPer} />
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.gasAdmPer}
                      onChange={(e) => setParametros((p) => ({ ...p, gasAdmPer: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Costes notariales
                      <HelpTooltip {...ayudaCamposCotizacion.gastoNotarial} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.gastoNotarial}
                      onChange={(e) => setParametros((p) => ({ ...p, gastoNotarial: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Costes registrales
                      <HelpTooltip {...ayudaCamposCotizacion.costeRegistral} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.costeRegistral}
                      onChange={(e) => setParametros((p) => ({ ...p, costeRegistral: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Tasación
                      <HelpTooltip {...ayudaCamposCotizacion.costeTasacion} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.costeTasacion}
                      onChange={(e) => setParametros((p) => ({ ...p, costeTasacion: Number(e.target.value) }))}
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Comisión de estudio
                      <HelpTooltip {...ayudaCamposCotizacion.comisionEstudio} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.comisionEstudio}
                      onChange={(e) =>
                        setParametros((p) => ({ ...p, comisionEstudio: Number(e.target.value) }))
                      }
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Comisión de activación
                      <HelpTooltip {...ayudaCamposCotizacion.comisionActivacion} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2 bg-white"
                      value={parametros.comisionActivacion}
                      onChange={(e) =>
                        setParametros((p) => ({ ...p, comisionActivacion: Number(e.target.value) }))
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-slate-900">C. Análisis — VAN del deudor (tasa de descuento)</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    El enunciado exige VAN y TIR del deudor. El <strong>COK</strong> es la tasa de descuento con la
                    que se traen los flujos a valor presente; lo fija el asesor (no se le pregunta al cliente). Default{" "}
                    <strong>8%</strong> ≈ costo de oportunidad de mercado (depósitos / inversiones accesibles). Cambiar
                    el COK modifica el VAN; no cambia la cuota ni la TCEA.
                  </p>
                </div>
                <label className="space-y-1 max-w-sm block">
                  <span className="text-sm flex items-center">
                    COK / tasa de descuento anual (%)
                    <HelpTooltip {...ayudaCamposCotizacion.cokAnual} />
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded p-2 bg-white"
                    value={Number((parametros.cokAnual * 100).toFixed(4))}
                    onChange={(e) =>
                      setParametros((p) => ({ ...p, cokAnual: Number(e.target.value) / 100 }))
                    }
                  />
                </label>
              </div>

              <div className="p-4 rounded-lg bg-slate-100 text-sm space-y-1">
                <p className="font-semibold mb-1">Vista previa rápida</p>
                <p>Tipo de tasa: TEA</p>
                {teaDecimal != null && <p>TEA: {(teaDecimal * 100).toFixed(4)}%</p>}
                <p>
                  Préstamo estimado: {parametros.monedaOp} {fmtMoney(prestamoEstimado)}
                </p>
                <p>
                  % Cuota final: {(parametros.pctCuotaFinal * 100).toFixed(0)}%
                  {parametros.residualFlag ? "" : " (residual off)"}
                </p>
                <p>COK (descuento VAN): {(parametros.cokAnual * 100).toFixed(0)}%</p>
                <p className="text-slate-600 mt-1">
                  La TCEA, VAN y TIR finales se calculan al guardar y generar cronograma.
                </p>
                <p className="text-slate-600 mt-2">
                  ¿Necesitás detalle de fórmulas?{" "}
                  <Link href="/transparencia" className="text-blue-600 hover:underline">
                    Ir al módulo de transparencia
                  </Link>
                </p>
              </div>
            </section>
          )}

          {paso === 3 && (
            <section className="space-y-4 text-sm">
              <h2 className="text-lg font-semibold">Paso 4: Confirmación</h2>
              <p className="text-slate-600">
                Revisá la información y guardá la cotización. Estado final: <strong>SIMULADA</strong>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Cliente</h3>
                  <p>
                    {cliente.nombres} {cliente.apPaterno}
                  </p>
                  <p>
                    {cliente.tipoDocumento}: {cliente.numDocumento}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Vehículo</h3>
                  <p>
                    {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                  </p>
                  <p>
                    {vehiculo.monedaPrecio} {fmtMoney(Number(vehiculo.precioLista))}
                  </p>
                </div>
                <div className="p-4 border rounded-lg md:col-span-2 space-y-1">
                  <h3 className="font-semibold mb-2">Parámetros financieros</h3>
                  <p>Tipo de tasa: TEA</p>
                  <p>
                    TEA: {parametros.tasaIngresada}%
                    {teaDecimal != null && (
                      <> · TEM ≈ {(Math.pow(1 + teaDecimal, 1 / 12) * 100 - 100).toFixed(4)}%</>
                    )}
                  </p>
                  <p>Plazo: {parametros.plazoMeses} meses</p>
                  <p>
                    Préstamo estimado: {parametros.monedaOp} {fmtMoney(prestamoEstimado)}
                    <span className="text-slate-500">
                      {" "}
                      (PV − CI + notarial + registral
                      {parametros.costeTasacion || parametros.comisionEstudio || parametros.comisionActivacion
                        ? " + otros costos iniciales"
                        : ""}
                      )
                    </span>
                  </p>
                  <p>
                    % Cuota final (CF): {(parametros.pctCuotaFinal * 100).toFixed(0)}%
                    {parametros.residualFlag ? " · residual activo" : " · residual off"}
                  </p>
                  <p>COK: {(parametros.cokAnual * 100).toFixed(0)}%</p>
                  <p>
                    Gracia: total {parametros.graciaTotalMeses} / parcial {parametros.graciaParcialMeses} meses
                  </p>
                </div>
              </div>
            </section>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={anterior}
              disabled={paso === 0 || loading}
              className="px-4 py-2 border rounded-lg disabled:opacity-50"
            >
              Anterior
            </button>

            {paso < pasos.length - 1 ? (
              <button
                type="button"
                onClick={siguiente}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                onClick={guardar}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Guardando..." : "Guardar cotización"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
