"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { HelpTooltip } from "@/components/transparencia/help-tooltip"
import { ayudaCamposCotizacion } from "@/lib/transparencia-help"

type TipoDoc = "DNI" | "CE" | "PASAPORTE"
type Moneda = "PEN" | "USD"
type TipoTasa = "EFECTIVA" | "NOMINAL"
type Capitalizacion =
  | "DIARIA"
  | "SEMANAL"
  | "QUINCENAL"
  | "MENSUAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL"

const pasos = ["Cliente", "Vehículo", "Parámetros", "Confirmación"]

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
    tipoTasa: "EFECTIVA" as TipoTasa,
    tasaIngresada: 18,
    capitalizacion: "MENSUAL" as Capitalizacion,
    precioVehiculo: 0,
    cuotaIniPct: 20,
    cuotaIniMnt: 0,
    plazoMeses: 36,
    fecDesembolso: new Date().toISOString().slice(0, 10),
    fec1eraCuota: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    graciaFlag: false,
    graciaTipo: "PARCIAL" as "TOTAL" | "PARCIAL",
    graciaMeses: 0,
    residualFlag: false,
    residualMonto: 0,
    segDesgrav: 0.04,
    segVehicular: 1200,
    gastoGps: 150,
    gastoNotarial: 80,
    motivoEdicion: "",
  })

  const montoFinanciadoPreview = useMemo(() => {
    return Math.max(0, parametros.precioVehiculo - parametros.cuotaIniMnt)
  }, [parametros.precioVehiculo, parametros.cuotaIniMnt])

  const siguiente = () => setPaso((p) => Math.min(p + 1, pasos.length - 1))
  const anterior = () => setPaso((p) => Math.max(p - 1, 0))

  const guardar = async () => {
    setLoading(true)
    setError("")
    try {
      const payload: any = {
        selectedClienteId: selectedClienteId ?? undefined,
        selectedVehiculoId: selectedVehiculoId ?? undefined,
        cliente: selectedClienteId ? undefined : cliente,
        vehiculo: selectedVehiculoId ? undefined : vehiculo,
        parametros,
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Nueva Cotización</h1>
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
                  <span className="text-sm">Tipo documento</span>
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
                  <span className="text-sm">N° documento</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.numDocumento}
                    onChange={(e) => setCliente((c) => ({ ...c, numDocumento: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Nombres</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.nombres}
                    onChange={(e) => setCliente((c) => ({ ...c, nombres: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Apellido paterno</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.apPaterno}
                    onChange={(e) => setCliente((c) => ({ ...c, apPaterno: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Apellido materno</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.apMaterno}
                    onChange={(e) => setCliente((c) => ({ ...c, apMaterno: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Celular</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.celular}
                    onChange={(e) => setCliente((c) => ({ ...c, celular: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">Correo</span>
                  <input
                    className="w-full border rounded p-2"
                    value={cliente.correo}
                    onChange={(e) => setCliente((c) => ({ ...c, correo: e.target.value }))}
                  />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">Dirección</span>
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
                <label className="space-y-1">
                  <span className="text-sm">Marca</span>
                  <input
                    className="w-full border rounded p-2"
                    value={vehiculo.marca}
                    onChange={(e) => setVehiculo((v) => ({ ...v, marca: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Modelo</span>
                  <input
                    className="w-full border rounded p-2"
                    value={vehiculo.modelo}
                    onChange={(e) => setVehiculo((v) => ({ ...v, modelo: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Versión</span>
                  <input
                    className="w-full border rounded p-2"
                    value={vehiculo.version}
                    onChange={(e) => setVehiculo((v) => ({ ...v, version: e.target.value }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Año</span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={vehiculo.anio}
                    onChange={(e) => setVehiculo((v) => ({ ...v, anio: Number(e.target.value) }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Precio lista</span>
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
                  <span className="text-sm">Moneda</span>
                  <select
                    className="w-full border rounded p-2"
                    value={vehiculo.monedaPrecio}
                    onChange={(e) => setVehiculo((v) => ({ ...v, monedaPrecio: e.target.value as Moneda }))}
                  >
                    <option value="PEN">PEN</option>
                    <option value="USD">USD</option>
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm">Concesionario</span>
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
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">Paso 3: Parámetros financieros</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1">
                  <span className="text-sm">Moneda operación</span>
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
                    Tipo tasa
                    <HelpTooltip {...ayudaCamposCotizacion.tipoTasa} />
                  </span>
                  <select
                    className="w-full border rounded p-2"
                    value={parametros.tipoTasa}
                    onChange={(e) => setParametros((p) => ({ ...p, tipoTasa: e.target.value as TipoTasa }))}
                  >
                    <option value="EFECTIVA">EFECTIVA</option>
                    <option value="NOMINAL">NOMINAL</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm flex items-center">
                    Tasa ingresada (%)
                    <HelpTooltip {...ayudaCamposCotizacion.tasaIngresada} />
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full border rounded p-2"
                    value={parametros.tasaIngresada}
                    onChange={(e) => setParametros((p) => ({ ...p, tasaIngresada: Number(e.target.value) }))}
                  />
                </label>

                {parametros.tipoTasa === "NOMINAL" && (
                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Capitalización
                      <HelpTooltip {...ayudaCamposCotizacion.capitalizacion} />
                    </span>
                    <select
                      className="w-full border rounded p-2"
                      value={parametros.capitalizacion}
                      onChange={(e) => setParametros((p) => ({ ...p, capitalizacion: e.target.value as Capitalizacion }))}
                    >
                      <option value="DIARIA">DIARIA</option>
                      <option value="SEMANAL">SEMANAL</option>
                      <option value="QUINCENAL">QUINCENAL</option>
                      <option value="MENSUAL">MENSUAL</option>
                      <option value="BIMESTRAL">BIMESTRAL</option>
                      <option value="TRIMESTRAL">TRIMESTRAL</option>
                      <option value="SEMESTRAL">SEMESTRAL</option>
                      <option value="ANUAL">ANUAL</option>
                    </select>
                  </label>
                )}

                <label className="space-y-1">
                  <span className="text-sm">Precio vehículo</span>
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
                  <span className="text-sm">Cuota inicial (monto)</span>
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
                    onChange={(e) => setParametros((p) => ({ ...p, plazoMeses: Number(e.target.value) }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm">Fecha desembolso</span>
                  <input
                    type="date"
                    className="w-full border rounded p-2"
                    value={parametros.fecDesembolso}
                    onChange={(e) => setParametros((p) => ({ ...p, fecDesembolso: e.target.value }))}
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-sm">Fecha 1ra cuota</span>
                  <input
                    type="date"
                    className="w-full border rounded p-2"
                    value={parametros.fec1eraCuota}
                    onChange={(e) => setParametros((p) => ({ ...p, fec1eraCuota: e.target.value }))}
                  />
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={parametros.graciaFlag}
                    onChange={(e) => setParametros((p) => ({ ...p, graciaFlag: e.target.checked }))}
                  />
                  <span>Incluir período de gracia</span>
                </label>

                {parametros.graciaFlag && (
                  <>
                    <label className="space-y-1">
                      <span className="text-sm flex items-center">
                        Tipo de gracia
                        <HelpTooltip {...ayudaCamposCotizacion.graciaTipo} />
                      </span>
                      <select
                        className="w-full border rounded p-2"
                        value={parametros.graciaTipo}
                        onChange={(e) =>
                          setParametros((p) => ({
                            ...p,
                            graciaTipo: e.target.value as "TOTAL" | "PARCIAL",
                          }))
                        }
                      >
                        <option value="TOTAL">TOTAL</option>
                        <option value="PARCIAL">PARCIAL</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-sm flex items-center">
                        Meses de gracia
                        <HelpTooltip {...ayudaCamposCotizacion.graciaMeses} />
                      </span>
                      <input
                        type="number"
                        className="w-full border rounded p-2"
                        value={parametros.graciaMeses}
                        onChange={(e) => setParametros((p) => ({ ...p, graciaMeses: Number(e.target.value) }))}
                      />
                    </label>
                  </>
                )}

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={parametros.residualFlag}
                    onChange={(e) => setParametros((p) => ({ ...p, residualFlag: e.target.checked }))}
                  />
                  <span>Incluir valor residual (Compra Inteligente)</span>
                </label>

                {parametros.residualFlag && (
                  <label className="space-y-1">
                    <span className="text-sm flex items-center">
                      Monto residual
                      <HelpTooltip {...ayudaCamposCotizacion.residualMonto} />
                    </span>
                    <input
                      type="number"
                      className="w-full border rounded p-2"
                      value={parametros.residualMonto}
                      onChange={(e) => setParametros((p) => ({ ...p, residualMonto: Number(e.target.value) }))}
                    />
                  </label>
                )}

                <label className="space-y-1">
                  <span className="text-sm flex items-center">
                    Seguro desgravamen mensual (%)
                    <HelpTooltip {...ayudaCamposCotizacion.segDesgrav} />
                  </span>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full border rounded p-2"
                    value={parametros.segDesgrav}
                    onChange={(e) => setParametros((p) => ({ ...p, segDesgrav: Number(e.target.value) }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm flex items-center">
                    Seguro vehicular anual
                    <HelpTooltip {...ayudaCamposCotizacion.segVehicular} />
                  </span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={parametros.segVehicular}
                    onChange={(e) => setParametros((p) => ({ ...p, segVehicular: Number(e.target.value) }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Gasto GPS</span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={parametros.gastoGps}
                    onChange={(e) => setParametros((p) => ({ ...p, gastoGps: Number(e.target.value) }))}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-sm">Gasto notarial</span>
                  <input
                    type="number"
                    className="w-full border rounded p-2"
                    value={parametros.gastoNotarial}
                    onChange={(e) => setParametros((p) => ({ ...p, gastoNotarial: Number(e.target.value) }))}
                  />
                </label>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-slate-100 text-sm">
                <p className="font-semibold mb-1">Vista previa rápida</p>
                <p>Monto financiado: {parametros.monedaOp} {montoFinanciadoPreview.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                <p className="text-slate-600 mt-1">La TCEA, VAN y TIR finales se calculan al guardar y generar cronograma.</p>
                <p className="text-slate-600 mt-2">
                  ¿Necesitás detalle de fórmulas? <Link href="/transparencia" className="text-blue-600 hover:underline">Ir al módulo de transparencia</Link>
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
                  <p>{cliente.nombres} {cliente.apPaterno}</p>
                  <p>{cliente.tipoDocumento}: {cliente.numDocumento}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Vehículo</h3>
                  <p>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}</p>
                  <p>{vehiculo.monedaPrecio} {Number(vehiculo.precioLista).toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-4 border rounded-lg md:col-span-2">
                  <h3 className="font-semibold mb-2">Parámetros financieros</h3>
                  <p>Tipo tasa: {parametros.tipoTasa}</p>
                  <p>Tasa: {parametros.tasaIngresada}%</p>
                  <p>Plazo: {parametros.plazoMeses} meses</p>
                  <p>Monto financiado: {parametros.monedaOp} {montoFinanciadoPreview.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                  <p>Residual: {parametros.residualFlag ? "Sí" : "No"}</p>
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
