'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { HelpTooltip } from "@/components/transparencia/help-tooltip"
import { ayudaCamposCotizacion } from "@/lib/transparencia-help"
import { calcularTEA } from "@/lib/motor-financiero"

export const dynamic = "force-dynamic"

type ClienteListaItem = {
  id: string
  tipoDocumento: string
  numDocumento: string
  nombres: string
  apPaterno: string
  apMaterno?: string | null
  celular?: string
  correo?: string
  cotizacionesCount?: number
}

type VehiculoListaItem = {
  id: string
  marca: string
  modelo: string
  anio: number
  precioLista: number
  monedaPrecio: string
  concesionario?: string
  cotizacionesCount?: number
}

export default function EditCotizacionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string>("")
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  const [recalculationResult, setRecalculationResult] = useState<any>(null)
  const [isRecalculating, setIsRecalculating] = useState(false)

  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null)
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<string | null>(null)
  const [cambiandoCliente, setCambiandoCliente] = useState(false)
  const [cambiandoVehiculo, setCambiandoVehiculo] = useState(false)
  const [clienteSearch, setClienteSearch] = useState("")
  const [vehiculoSearch, setVehiculoSearch] = useState("")
  const [clienteResultados, setClienteResultados] = useState<ClienteListaItem[]>([])
  const [vehiculoResultados, setVehiculoResultados] = useState<VehiculoListaItem[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [buscandoVehiculos, setBuscandoVehiculos] = useState(false)

  const fmtMoney = (n: number) =>
    n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleRecalculate = async () => {
    setIsRecalculating(true)
    try {
      const p = formData.parametros || {}
      const graciaTotalMeses = Number(p.graciaTotalMeses ?? 0)
      const graciaParcialMeses = Number(p.graciaParcialMeses ?? 0)
      const parametros = {
        ...p,
        graciaFlag: graciaTotalMeses + graciaParcialMeses > 0,
        graciaTotalMeses,
        graciaParcialMeses,
      }
      const response = await fetch(`/api/cotizaciones/${id}/recalcular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parametros }),
      })
      if (response.ok) {
        const result = await response.json()
        setRecalculationResult(result)
      }
    } catch (error) {
      console.error('Error recalculating:', error)
    } finally {
      setIsRecalculating(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const newData = { ...prev }
      const keys = field.split('.')
      let current = newData
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      return newData
    })

    // Check if field changed from original
    const keys = field.split('.')
    let original = cotizacion
    for (let i = 0; i < keys.length - 1; i++) {
      original = original?.[keys[i]]
    }
    if (original?.[keys[keys.length - 1]] !== value) {
      setModifiedFields(prev => new Set([...prev, field]))
    } else {
      setModifiedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
  }

  const buscarClientes = async (term?: string) => {
    setBuscandoClientes(true)
    try {
      const qs = new URLSearchParams({ estado: "ACTIVO" })
      const q = (term ?? clienteSearch).trim()
      if (q) qs.set("search", q)
      const res = await fetch(`/api/clientes?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo buscar clientes")
      setClienteResultados(data.clientes || [])
    } catch {
      setClienteResultados([])
    } finally {
      setBuscandoClientes(false)
    }
  }

  const buscarVehiculos = async (term?: string) => {
    setBuscandoVehiculos(true)
    try {
      const qs = new URLSearchParams({ estado: "DISPONIBLE" })
      const q = (term ?? vehiculoSearch).trim()
      if (q) qs.set("search", q)
      const res = await fetch(`/api/vehiculos?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo buscar vehículos")
      setVehiculoResultados(data.vehiculos || [])
    } catch {
      setVehiculoResultados([])
    } finally {
      setBuscandoVehiculos(false)
    }
  }

  const seleccionarCliente = async (clienteId: string) => {
    const res = await fetch(`/api/clientes/${clienteId}`)
    const data = await res.json()
    if (!res.ok) return
    setSelectedClienteId(clienteId)
    setFormData((prev: any) => ({ ...prev, cliente: data.cliente, selectedClienteId: Number(clienteId) }))
    setModifiedFields((prev) => new Set([...prev, "selectedClienteId"]))
    setCambiandoCliente(false)
  }

  const seleccionarVehiculo = async (vehiculoId: string) => {
    const res = await fetch(`/api/vehiculos/${vehiculoId}`)
    const data = await res.json()
    if (!res.ok) return
    const v = data.vehiculo
    setSelectedVehiculoId(vehiculoId)
    setFormData((prev: any) => ({
      ...prev,
      vehiculo: v,
      selectedVehiculoId: Number(vehiculoId),
      parametros: {
        ...prev.parametros,
        precioVehiculo: Number(v.precioLista || 0),
        monedaOp: v.monedaPrecio || prev.parametros?.monedaOp || "PEN",
        cuotaIniMnt:
          (Number(v.precioLista || 0) * Number(prev.parametros?.cuotaIniPct ?? 20)) / 100,
        residualMonto:
          v.valResidEst != null
            ? Number(v.valResidEst)
            : Number(v.precioLista || 0) * Number(prev.parametros?.pctCuotaFinal ?? 0.4),
      },
    }))
    setModifiedFields((prev) => new Set([...prev, "selectedVehiculoId", "parametros.precioVehiculo"]))
    setCambiandoVehiculo(false)
  }

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId)
      fetchCotizacion(paramId)
    })
  }, [params])

  useEffect(() => {
    if (!cotizacion) return
    const rawTipo = cotizacion.tipoTasa ?? "TEA"
    const rawTasa = Number(cotizacion.tasaIngresada ?? 16.1798)
    const teaStored = Number(cotizacion.tea)
    const teaAsPct = teaStored > 0 && teaStored < 2 ? teaStored * 100 : teaStored
    // Si la cotización vieja guardó TNA, mostrar la TEA equivalente (no el 15 nominal).
    let tasaTeaPct = rawTasa
    if (rawTipo === "TNA") {
      try {
        tasaTeaPct =
          calcularTEA(rawTasa, "TNA", cotizacion.capitalizacion === "MENSUAL" ? "MENSUAL" : "DIARIA") *
          100
      } catch {
        tasaTeaPct = Number.isFinite(teaAsPct) && teaAsPct > 0 ? teaAsPct : rawTasa
      }
    } else if (rawTasa > 100 && Number.isFinite(teaAsPct) && teaAsPct > 0 && teaAsPct <= 100) {
      // Bug legacy: tasaIngresada se guardó como tea*100 (ej. 1617). Usar tea %.
      tasaTeaPct = teaAsPct
    }

    setSelectedClienteId(String(cotizacion.cliente?.id ?? cotizacion.idCliente))
    setSelectedVehiculoId(String(cotizacion.vehiculo?.id ?? cotizacion.idVehiculo))
    setCambiandoCliente(false)
    setCambiandoVehiculo(false)

    setFormData({
      selectedClienteId: Number(cotizacion.cliente?.id ?? cotizacion.idCliente),
      selectedVehiculoId: Number(cotizacion.vehiculo?.id ?? cotizacion.idVehiculo),
      cliente: { ...cotizacion.cliente },
      vehiculo: { ...cotizacion.vehiculo },
      parametros: {
        monedaOp: cotizacion.monedaOp ?? cotizacion.moneda ?? "PEN",
        tipoTasa: "TEA",
        capitalizacion: null,
        tasaIngresada: Number(tasaTeaPct.toFixed(6)),
        precioVehiculo: Number(cotizacion.precioVeh ?? cotizacion.precioVehiculo ?? cotizacion.vehiculo?.precioLista ?? 0),
        cuotaIniPct: Number(cotizacion.cuotaIniPct ?? cotizacion.cuotaInicialPct ?? 20),
        cuotaIniMnt: Number(cotizacion.cuotaIniMnt ?? cotizacion.cuotaInicialMonto ?? 0),
        plazoMeses: Number(cotizacion.plazoMeses ?? 36),
        fecDesembolso: cotizacion.fecDesembolso
          ? new Date(cotizacion.fecDesembolso).toISOString().slice(0, 10)
          : "",
        fec1eraCuota: (cotizacion.fec1eraCuota ?? cotizacion.fecPrimeraCuota)
          ? new Date(cotizacion.fec1eraCuota ?? cotizacion.fecPrimeraCuota).toISOString().slice(0, 10)
          : "",
        graciaFlag: Boolean(cotizacion.graciaFlag),
        graciaTipo: cotizacion.graciaTipo ?? "PARCIAL",
        graciaMeses: Number(cotizacion.graciaMeses ?? 0),
        graciaTotalMeses: Number(cotizacion.graciaTotalMeses ?? 0),
        graciaParcialMeses: Number(cotizacion.graciaParcialMeses ?? 0),
        residualFlag: cotizacion.residualFlag ?? true,
        pctCuotaFinal: Number(cotizacion.pctCuotaFinal ?? 0.4),
        residualMonto: Number(cotizacion.residualMonto ?? cotizacion.valorResidual ?? 0),
        segDesgrav: Number(cotizacion.segDesgrav ?? cotizacion.segDesgravamen ?? 0.00049),
        pctSegRie: Number(cotizacion.pctSegRie ?? 0.003),
        segVehicular: Number(cotizacion.segVehicular ?? 0),
        gastoGps: Number(cotizacion.gastoGps ?? 20),
        portesPer: Number(cotizacion.portesPer ?? 3.5),
        gasAdmPer: Number(cotizacion.gasAdmPer ?? 3.5),
        gastoNotarial: Number(cotizacion.gastoNotarial ?? 100),
        costeRegistral: Number(cotizacion.costeRegistral ?? 75),
        costeTasacion: Number(cotizacion.costeTasacion ?? 0),
        comisionEstudio: Number(cotizacion.comisionEstudio ?? 0),
        comisionActivacion: Number(cotizacion.comisionActivacion ?? 0),
        cokAnual: Number(cotizacion.cokAnual ?? 0.08),
      },
    })
  }, [cotizacion])

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

  if (loading) {
    return <div className="p-8">Cargando...</div>
  }

  if (!cotizacion) {
    return (
      <div className="p-8">
        <p>Cotización no encontrada.</p>
        <Link href="/dashboard/cotizaciones" className="text-blue-600 underline">
          Volver
        </Link>
      </div>
    )
  }

  const c = cotizacion
  const cliente = formData.cliente || c.cliente
  const vehiculo = formData.vehiculo || c.vehiculo

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Editando: COT-{c.id}</h1>
              <p className="text-sm text-slate-600">
                Cliente: {cliente?.nombres} {cliente?.apPaterno} | Versión actual: v{c.version} | Estado: {c.estado}
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href={`/dashboard/cotizaciones/${c.id}`}
                className="text-blue-600 hover:underline"
              >
                Cancelar
              </Link>
            </div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠ Los cambios generarán una nueva versión (v{c.version + 1})
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="cliente" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
            <TabsTrigger value="vehiculo">Vehículo</TabsTrigger>
            <TabsTrigger value="parametros">Parámetros financieros</TabsTrigger>
          </TabsList>

          <TabsContent value="cliente" className="mt-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Cliente de la cotización</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Seleccioná un cliente del directorio. Para editar su ficha, usá la pestaña Clientes.
                  </p>
                </div>
                {!cambiandoCliente && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCambiandoCliente(true)
                      void buscarClientes("")
                    }}
                  >
                    Cambiar cliente
                  </Button>
                )}
              </div>

              {!cambiandoCliente ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Cliente seleccionado
                  </p>
                  <p className="text-base font-semibold text-slate-900 mt-1">
                    {cliente?.nombres} {cliente?.apPaterno} {cliente?.apMaterno}
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {cliente?.tipoDocumento} {cliente?.numDocumento}
                    {cliente?.celular ? ` · ${cliente.celular}` : ""}
                  </p>
                  {cliente?.correo ? <p className="text-sm text-slate-500">{cliente.correo}</p> : null}
                  {selectedClienteId && (
                    <Link
                      href={`/dashboard/clientes/${selectedClienteId}`}
                      className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Ver ficha en Clientes
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-1 border rounded-lg p-2"
                      placeholder="Buscar por DNI, nombre, correo o celular"
                      value={clienteSearch}
                      onChange={(e) => setClienteSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          void buscarClientes()
                        }
                      }}
                    />
                    <Button onClick={() => void buscarClientes()} disabled={buscandoClientes}>
                      {buscandoClientes ? "Buscando..." : "Buscar"}
                    </Button>
                    <Button variant="outline" onClick={() => setCambiandoCliente(false)}>
                      Cancelar
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    {buscandoClientes ? (
                      <p className="p-4 text-sm text-slate-500">Cargando clientes...</p>
                    ) : clienteResultados.length === 0 ? (
                      <p className="p-4 text-sm text-slate-600">
                        No se encontraron clientes.{" "}
                        <Link href="/dashboard/clientes/nuevo" className="text-blue-600 hover:underline">
                          Registrar en Clientes
                        </Link>
                      </p>
                    ) : (
                      <ul className="divide-y max-h-72 overflow-y-auto">
                        {clienteResultados.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => void seleccionarCliente(item.id)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="font-medium text-slate-900">
                                  {[item.nombres, item.apPaterno, item.apMaterno].filter(Boolean).join(" ")}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.tipoDocumento} {item.numDocumento}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500">{item.cotizacionesCount ?? 0} cotiz.</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="vehiculo" className="mt-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Vehículo de la cotización</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Seleccioná un vehículo del catálogo. Para editar su ficha, usá la pestaña Vehículos.
                  </p>
                </div>
                {!cambiandoVehiculo && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCambiandoVehiculo(true)
                      void buscarVehiculos("")
                    }}
                  >
                    Cambiar vehículo
                  </Button>
                )}
              </div>

              {!cambiandoVehiculo ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    Vehículo seleccionado
                  </p>
                  <p className="text-base font-semibold text-slate-900 mt-1">
                    {vehiculo?.marca} {vehiculo?.modelo} {vehiculo?.anio}
                  </p>
                  <p className="text-sm text-slate-600 mt-0.5">
                    {vehiculo?.monedaPrecio} {fmtMoney(Number(vehiculo?.precioLista || 0))}
                    {vehiculo?.concesionario ? ` · ${vehiculo.concesionario}` : ""}
                  </p>
                  {selectedVehiculoId && (
                    <Link
                      href={`/dashboard/vehiculos/${selectedVehiculoId}`}
                      className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                    >
                      Ver ficha en Vehículos
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      className="flex-1 border rounded-lg p-2"
                      placeholder="Buscar por marca, modelo o concesionario"
                      value={vehiculoSearch}
                      onChange={(e) => setVehiculoSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          void buscarVehiculos()
                        }
                      }}
                    />
                    <Button onClick={() => void buscarVehiculos()} disabled={buscandoVehiculos}>
                      {buscandoVehiculos ? "Buscando..." : "Buscar"}
                    </Button>
                    <Button variant="outline" onClick={() => setCambiandoVehiculo(false)}>
                      Cancelar
                    </Button>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    {buscandoVehiculos ? (
                      <p className="p-4 text-sm text-slate-500">Cargando vehículos...</p>
                    ) : vehiculoResultados.length === 0 ? (
                      <p className="p-4 text-sm text-slate-600">
                        No se encontraron vehículos.{" "}
                        <Link href="/dashboard/vehiculos/nuevo" className="text-blue-600 hover:underline">
                          Registrar en Vehículos
                        </Link>
                      </p>
                    ) : (
                      <ul className="divide-y max-h-72 overflow-y-auto">
                        {vehiculoResultados.map((item) => (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => void seleccionarVehiculo(item.id)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                            >
                              <div>
                                <p className="font-medium text-slate-900">
                                  {item.marca} {item.modelo} {item.anio}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {item.monedaPrecio} {fmtMoney(Number(item.precioLista))}
                                </p>
                              </div>
                              <span className="text-xs text-slate-500">{item.cotizacionesCount ?? 0} cotiz.</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="parametros" className="mt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Parámetros financieros</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Vista de la <strong>entidad</strong> (enunciado SI642): el asesor configura la operación.
                  Agrupamos lo que negocia el cliente, lo que viene del tarifario/producto y el COK solo para el VAN académico.
                </p>
              </div>

              {(() => {
                const p = formData.parametros || {}
                const mod = (field: string) =>
                  modifiedFields.has(field) ? "border-blue-500" : ""
                const costosIniciales =
                  Number(p.gastoNotarial || 0) +
                  Number(p.costeRegistral || 0) +
                  Number(p.costeTasacion || 0) +
                  Number(p.comisionEstudio || 0) +
                  Number(p.comisionActivacion || 0)
                const prestamoEstimado = Math.max(
                  0,
                  Number(p.precioVehiculo || 0) - Number(p.cuotaIniMnt || 0) + costosIniciales
                )
                let teaDecimal: number | null = null
                try {
                  teaDecimal = calcularTEA(Number(p.tasaIngresada || 0), "TEA", null)
                } catch {
                  teaDecimal = null
                }

                return (
                  <>
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
                            Moneda operación <HelpTooltip {...ayudaCamposCotizacion.monedaOp} />
                          </span>
                          <select
                            className={`w-full border rounded p-2 ${mod("parametros.monedaOp")}`}
                            value={p.monedaOp || "PEN"}
                            onChange={(e) => handleFieldChange("parametros.monedaOp", e.target.value)}
                          >
                            <option value="PEN">PEN</option>
                            <option value="USD">USD</option>
                          </select>
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Precio vehículo <HelpTooltip {...ayudaCamposCotizacion.precioVehiculo} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 ${mod("parametros.precioVehiculo")}`}
                            value={p.precioVehiculo ?? ""}
                            onChange={(e) => {
                              const precioVehiculo = Number(e.target.value)
                              handleFieldChange("parametros.precioVehiculo", precioVehiculo)
                              handleFieldChange(
                                "parametros.cuotaIniMnt",
                                (precioVehiculo * Number(p.cuotaIniPct ?? 20)) / 100
                              )
                            }}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Cuota inicial (%) <HelpTooltip {...ayudaCamposCotizacion.cuotaInicial} />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            className={`w-full border rounded p-2 ${mod("parametros.cuotaIniPct")}`}
                            value={p.cuotaIniPct ?? ""}
                            onChange={(e) => {
                              const pct = Number(e.target.value)
                              handleFieldChange("parametros.cuotaIniPct", pct)
                              handleFieldChange(
                                "parametros.cuotaIniMnt",
                                (Number(p.precioVehiculo || 0) * pct) / 100
                              )
                            }}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Cuota inicial (monto) <HelpTooltip {...ayudaCamposCotizacion.cuotaInicial} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 ${mod("parametros.cuotaIniMnt")}`}
                            value={p.cuotaIniMnt ?? ""}
                            onChange={(e) => {
                              const cuotaIniMnt = Number(e.target.value)
                              const precio = Number(p.precioVehiculo || 0)
                              handleFieldChange("parametros.cuotaIniMnt", cuotaIniMnt)
                              handleFieldChange(
                                "parametros.cuotaIniPct",
                                precio > 0
                                  ? Math.round(((cuotaIniMnt / precio) * 100) * 10000) / 10000
                                  : 0
                              )
                            }}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Plazo (meses) <HelpTooltip {...ayudaCamposCotizacion.plazoMeses} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 ${mod("parametros.plazoMeses")}`}
                            value={p.plazoMeses ?? ""}
                            onChange={(e) => {
                              const plazoMeses = Number(e.target.value)
                              handleFieldChange("parametros.plazoMeses", plazoMeses)
                              if (plazoMeses === 24) handleFieldChange("parametros.pctCuotaFinal", 0.5)
                              if (plazoMeses === 36) handleFieldChange("parametros.pctCuotaFinal", 0.4)
                            }}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Fecha desembolso <HelpTooltip {...ayudaCamposCotizacion.fecDesembolso} />
                          </span>
                          <input
                            type="date"
                            className={`w-full border rounded p-2 ${mod("parametros.fecDesembolso")}`}
                            value={p.fecDesembolso || ""}
                            onChange={(e) => handleFieldChange("parametros.fecDesembolso", e.target.value)}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Fecha 1ra cuota <HelpTooltip {...ayudaCamposCotizacion.fec1eraCuota} />
                          </span>
                          <input
                            type="date"
                            className={`w-full border rounded p-2 ${mod("parametros.fec1eraCuota")}`}
                            value={p.fec1eraCuota || ""}
                            onChange={(e) => handleFieldChange("parametros.fec1eraCuota", e.target.value)}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Gracia total (meses) <HelpTooltip {...ayudaCamposCotizacion.graciaTotalMeses} />
                          </span>
                          <input
                            type="number"
                            min={0}
                            className={`w-full border rounded p-2 ${mod("parametros.graciaTotalMeses")}`}
                            value={p.graciaTotalMeses ?? 0}
                            onChange={(e) => {
                              const graciaTotalMeses = Number(e.target.value)
                              const parcial = Number(p.graciaParcialMeses ?? 0)
                              handleFieldChange("parametros.graciaTotalMeses", graciaTotalMeses)
                              handleFieldChange("parametros.graciaFlag", graciaTotalMeses + parcial > 0)
                              handleFieldChange(
                                "parametros.graciaTipo",
                                graciaTotalMeses > 0 ? "TOTAL" : "PARCIAL"
                              )
                              handleFieldChange(
                                "parametros.graciaMeses",
                                graciaTotalMeses > 0 ? graciaTotalMeses : parcial
                              )
                            }}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Gracia parcial (meses) <HelpTooltip {...ayudaCamposCotizacion.graciaParcialMeses} />
                          </span>
                          <input
                            type="number"
                            min={0}
                            className={`w-full border rounded p-2 ${mod("parametros.graciaParcialMeses")}`}
                            value={p.graciaParcialMeses ?? 0}
                            onChange={(e) => {
                              const graciaParcialMeses = Number(e.target.value)
                              const total = Number(p.graciaTotalMeses ?? 0)
                              handleFieldChange("parametros.graciaParcialMeses", graciaParcialMeses)
                              handleFieldChange("parametros.graciaFlag", total + graciaParcialMeses > 0)
                              handleFieldChange(
                                "parametros.graciaTipo",
                                total > 0 ? "TOTAL" : "PARCIAL"
                              )
                              handleFieldChange(
                                "parametros.graciaMeses",
                                total > 0 ? total : graciaParcialMeses
                              )
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
                            Tasa Efectiva Anual (TEA %) <HelpTooltip {...ayudaCamposCotizacion.tasaIngresada} />
                          </span>
                          <input
                            type="number"
                            step="0.0001"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.tasaIngresada")}`}
                            value={p.tasaIngresada ?? ""}
                            onChange={(e) => {
                              handleFieldChange("parametros.tipoTasa", "TEA")
                              handleFieldChange("parametros.capitalizacion", null)
                              handleFieldChange("parametros.tasaIngresada", Number(e.target.value))
                            }}
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
                            checked={p.residualFlag ?? true}
                            onChange={(e) => handleFieldChange("parametros.residualFlag", e.target.checked)}
                          />
                          <span className="text-sm flex items-center">
                            Incluir valor residual (Compra Inteligente)
                            <HelpTooltip {...ayudaCamposCotizacion.pctCuotaFinal} />
                          </span>
                        </label>

                        {(p.residualFlag ?? true) && (
                          <>
                            <label className="space-y-1">
                              <span className="text-sm flex items-center">
                                % Cuota final <HelpTooltip {...ayudaCamposCotizacion.pctCuotaFinal} />
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                className={`w-full border rounded p-2 bg-white ${mod("parametros.pctCuotaFinal")}`}
                                value={
                                  p.pctCuotaFinal != null
                                    ? Number((Number(p.pctCuotaFinal) * 100).toFixed(4))
                                    : ""
                                }
                                onChange={(e) =>
                                  handleFieldChange("parametros.pctCuotaFinal", Number(e.target.value) / 100)
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
                                className={`w-full border rounded p-2 bg-white ${mod("parametros.residualMonto")}`}
                                value={p.residualMonto ?? ""}
                                onChange={(e) =>
                                  handleFieldChange("parametros.residualMonto", Number(e.target.value))
                                }
                              />
                            </label>
                          </>
                        )}

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Seguro desgravamen (período) <HelpTooltip {...ayudaCamposCotizacion.segDesgrav} />
                          </span>
                          <input
                            type="number"
                            step="0.00001"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.segDesgrav")}`}
                            value={p.segDesgrav ?? ""}
                            onChange={(e) => handleFieldChange("parametros.segDesgrav", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            % Seguro riesgo anual <HelpTooltip {...ayudaCamposCotizacion.pctSegRie} />
                          </span>
                          <input
                            type="number"
                            step="0.0001"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.pctSegRie")}`}
                            value={p.pctSegRie ?? ""}
                            onChange={(e) => handleFieldChange("parametros.pctSegRie", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            GPS (período) <HelpTooltip {...ayudaCamposCotizacion.gastoGps} />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.gastoGps")}`}
                            value={p.gastoGps ?? ""}
                            onChange={(e) => handleFieldChange("parametros.gastoGps", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Portes (período) <HelpTooltip {...ayudaCamposCotizacion.portesPer} />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.portesPer")}`}
                            value={p.portesPer ?? ""}
                            onChange={(e) => handleFieldChange("parametros.portesPer", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Gastos administración (período) <HelpTooltip {...ayudaCamposCotizacion.gasAdmPer} />
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.gasAdmPer")}`}
                            value={p.gasAdmPer ?? ""}
                            onChange={(e) => handleFieldChange("parametros.gasAdmPer", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Costes notariales <HelpTooltip {...ayudaCamposCotizacion.gastoNotarial} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.gastoNotarial")}`}
                            value={p.gastoNotarial ?? ""}
                            onChange={(e) => handleFieldChange("parametros.gastoNotarial", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Costes registrales <HelpTooltip {...ayudaCamposCotizacion.costeRegistral} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.costeRegistral")}`}
                            value={p.costeRegistral ?? ""}
                            onChange={(e) => handleFieldChange("parametros.costeRegistral", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Tasación <HelpTooltip {...ayudaCamposCotizacion.costeTasacion} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.costeTasacion")}`}
                            value={p.costeTasacion ?? ""}
                            onChange={(e) => handleFieldChange("parametros.costeTasacion", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Comisión de estudio <HelpTooltip {...ayudaCamposCotizacion.comisionEstudio} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.comisionEstudio")}`}
                            value={p.comisionEstudio ?? ""}
                            onChange={(e) => handleFieldChange("parametros.comisionEstudio", Number(e.target.value))}
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-sm flex items-center">
                            Comisión de activación <HelpTooltip {...ayudaCamposCotizacion.comisionActivacion} />
                          </span>
                          <input
                            type="number"
                            className={`w-full border rounded p-2 bg-white ${mod("parametros.comisionActivacion")}`}
                            value={p.comisionActivacion ?? ""}
                            onChange={(e) =>
                              handleFieldChange("parametros.comisionActivacion", Number(e.target.value))
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
                          <strong>8%</strong> ≈ costo de oportunidad de mercado. Cambiar el COK modifica el VAN; no cambia
                          la cuota ni la TCEA.
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
                          className={`w-full border rounded p-2 bg-white ${mod("parametros.cokAnual")}`}
                          value={
                            p.cokAnual != null ? Number((Number(p.cokAnual) * 100).toFixed(4)) : ""
                          }
                          onChange={(e) =>
                            handleFieldChange("parametros.cokAnual", Number(e.target.value) / 100)
                          }
                        />
                      </label>
                    </div>

                    <div className="p-4 rounded-lg bg-slate-100 text-sm space-y-1">
                      <p className="font-semibold mb-1">Vista previa rápida</p>
                      <p>Tipo de tasa: TEA</p>
                      {teaDecimal != null && <p>TEA: {(teaDecimal * 100).toFixed(4)}%</p>}
                      <p>
                        Préstamo estimado: {p.monedaOp || "PEN"} {fmtMoney(prestamoEstimado)}
                      </p>
                      <p>
                        % Cuota final: {((Number(p.pctCuotaFinal) || 0) * 100).toFixed(0)}%
                        {p.residualFlag === false ? " (residual off)" : ""}
                      </p>
                      <p>COK (descuento VAN): {((Number(p.cokAnual) || 0) * 100).toFixed(0)}%</p>
                      <p className="text-slate-600 mt-1">
                        Usá «Recalcular ahora» para ver TCEA, VAN y TIR antes de guardar la nueva versión.
                      </p>
                      <p className="text-slate-600 mt-2">
                        ¿Necesitás detalle de fórmulas?{" "}
                        <Link href="/transparencia" className="text-blue-600 hover:underline">
                          Ir al módulo de transparencia
                        </Link>
                      </p>
                    </div>
                  </>
                )
              })()}

              <div>
                <Button onClick={handleRecalculate} disabled={isRecalculating}>
                  {isRecalculating ? "Recalculando..." : "Recalcular ahora"}
                </Button>
              </div>

              {isRecalculating && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">Recalculando cronograma...</div>
                </div>
              )}

              {recalculationResult && (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Indicadores recalculados</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">TCEA</p>
                        <p className="font-medium">{recalculationResult.indicadores.tcea.toFixed(4)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">VAN Deudor</p>
                        <p className="font-medium">
                          {formData.parametros?.monedaOp || c.monedaOp || "PEN"}{" "}
                          {recalculationResult.indicadores.vanDeudor.toLocaleString("es-PE", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">TIR Anual</p>
                        <p className="font-medium">{recalculationResult.indicadores.tirAnual.toFixed(4)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">
                      Nuevo cronograma ({recalculationResult.cronograma.length} cuotas)
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-slate-700">
                          <tr>
                            <th className="text-left p-2">N°</th>
                            <th className="text-left p-2">Fecha</th>
                            <th className="text-right p-2">Cuota Total</th>
                            <th className="text-right p-2">Saldo Final</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recalculationResult.cronograma.slice(0, 5).map((q: any) => (
                            <tr key={q.numero} className="border-t">
                              <td className="p-2">{q.numero}</td>
                              <td className="p-2">
                                {new Date(q.fechaVencimiento).toLocaleDateString("es-PE")}
                              </td>
                              <td className="p-2 text-right">{Number(q.cuotaTotal).toFixed(2)}</td>
                              <td className="p-2 text-right">{Number(q.saldoFinal).toFixed(2)}</td>
                            </tr>
                          ))}
                          {recalculationResult.cronograma.length > 5 && (
                            <tr>
                              <td colSpan={4} className="p-2 text-center text-slate-500">
                                ... y {recalculationResult.cronograma.length - 5} cuotas más
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-4">
          <Link href={`/dashboard/cotizaciones/${id}/editar/confirmar`}>
            <Button onClick={() => {
              const p = formData.parametros || {}
              const graciaTotalMeses = Number(p.graciaTotalMeses ?? 0)
              const graciaParcialMeses = Number(p.graciaParcialMeses ?? 0)
              const payload = {
                ...formData,
                parametros: {
                  ...p,
                  graciaFlag: graciaTotalMeses + graciaParcialMeses > 0,
                  graciaTotalMeses,
                  graciaParcialMeses,
                },
              }
              localStorage.setItem('editFormData', JSON.stringify(payload))
              localStorage.setItem('editModifiedFields', JSON.stringify(Array.from(modifiedFields)))
            }}>Guardar cambios</Button>
          </Link>
          <Link href={`/dashboard/cotizaciones/${id}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}