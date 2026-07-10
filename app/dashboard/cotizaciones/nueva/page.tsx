"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
type ClienteModo = "buscar" | "nuevo"
type VehiculoModo = "buscar" | "nuevo"

type ClienteForm = {
  tipoDocumento: TipoDoc
  numDocumento: string
  nombres: string
  apPaterno: string
  apMaterno: string
  celular: string
  correo: string
  direccion: string
  fecNacimiento: string
  ingresosMens: number
  monedaIngres: Moneda
  situacionLab: string
  empresaEmpl: string
}

type ClienteListaItem = {
  id: string
  tipoDocumento: TipoDoc
  numDocumento: string
  nombres: string
  apPaterno: string
  apMaterno?: string | null
  celular: string
  correo: string
  estado: string
  cotizacionesCount?: number
}

type VehiculoForm = {
  marca: string
  modelo: string
  version: string
  anio: number
  precioLista: number
  monedaPrecio: Moneda
  concesionario: string
  valResidEst: number
  tipoValResid: "MONTO" | "PORCENTAJE"
  tipoVehiculo: string
  transmision: string
  combustible: string
}

type VehiculoListaItem = {
  id: string
  marca: string
  modelo: string
  version?: string | null
  anio: number
  precioLista: number
  monedaPrecio: Moneda
  concesionario: string
  valResidEst?: number | null
  estado: string
  cotizacionesCount?: number
}

const pasos = ["Cliente", "Vehículo", "Parámetros", "Confirmación"]

const emptyCliente = (): ClienteForm => ({
  tipoDocumento: "DNI",
  numDocumento: "",
  nombres: "",
  apPaterno: "",
  apMaterno: "",
  celular: "",
  correo: "",
  direccion: "",
  fecNacimiento: "",
  ingresosMens: 0,
  monedaIngres: "PEN",
  situacionLab: "",
  empresaEmpl: "",
})

const emptyVehiculo = (): VehiculoForm => ({
  marca: "",
  modelo: "",
  version: "",
  anio: new Date().getFullYear(),
  precioLista: 0,
  monedaPrecio: "PEN",
  concesionario: "",
  valResidEst: 0,
  tipoValResid: "MONTO",
  tipoVehiculo: "",
  transmision: "",
  combustible: "",
})

function pctCuotaFinalPorPlazo(plazoMeses: number): number | null {
  return pctCuotaFinalInterbank(plazoMeses)
}

function mapApiClienteToForm(c: any): ClienteForm {
  const fec = c.fecNacimiento ? new Date(c.fecNacimiento).toISOString().slice(0, 10) : ""
  return {
    tipoDocumento: (c.tipoDocumento as TipoDoc) || "DNI",
    numDocumento: c.numDocumento || "",
    nombres: c.nombres || "",
    apPaterno: c.apPaterno || "",
    apMaterno: c.apMaterno || "",
    celular: c.celular || "",
    correo: c.correo || "",
    direccion: c.direccion || "",
    fecNacimiento: fec,
    ingresosMens: Number(c.ingresosMens || 0),
    monedaIngres: (c.monedaIngres as Moneda) || "PEN",
    situacionLab: c.situacionLab || "",
    empresaEmpl: c.empresaEmpl || "",
  }
}

function mapApiVehiculoToForm(v: any): VehiculoForm {
  return {
    marca: v.marca || "",
    modelo: v.modelo || "",
    version: v.version || "",
    anio: Number(v.anio || new Date().getFullYear()),
    precioLista: Number(v.precioLista || 0),
    monedaPrecio: (v.monedaPrecio as Moneda) || "PEN",
    concesionario: v.concesionario || "",
    valResidEst: Number(v.valResidEst || 0),
    tipoValResid: (v.tipoValResid as "MONTO" | "PORCENTAJE") || "MONTO",
    tipoVehiculo: v.tipoVehiculo || "",
    transmision: v.transmision || "",
    combustible: v.combustible || "",
  }
}

export default function NuevaCotizacionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paso, setPaso] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [selectedClienteId, setSelectedClienteId] = useState<number | null>(null)
  const [selectedVehiculoId, setSelectedVehiculoId] = useState<number | null>(null)
  const [clienteModo, setClienteModo] = useState<ClienteModo>("buscar")
  const [clienteSearch, setClienteSearch] = useState("")
  const [clienteResultados, setClienteResultados] = useState<ClienteListaItem[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [clienteBusquedaError, setClienteBusquedaError] = useState("")
  const [clienteDocWarning, setClienteDocWarning] = useState<string | null>(null)

  const [vehiculoModo, setVehiculoModo] = useState<VehiculoModo>("buscar")
  const [vehiculoSearch, setVehiculoSearch] = useState("")
  const [vehiculoResultados, setVehiculoResultados] = useState<VehiculoListaItem[]>([])
  const [buscandoVehiculos, setBuscandoVehiculos] = useState(false)
  const [vehiculoBusquedaError, setVehiculoBusquedaError] = useState("")

  const [cliente, setCliente] = useState<ClienteForm>(emptyCliente)

  const [vehiculo, setVehiculo] = useState<VehiculoForm>(emptyVehiculo)

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

  const buscarClientes = async (term?: string) => {
    setBuscandoClientes(true)
    setClienteBusquedaError("")
    try {
      const qs = new URLSearchParams({ estado: "ACTIVO" })
      const q = (term ?? clienteSearch).trim()
      if (q) qs.set("search", q)
      const res = await fetch(`/api/clientes?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo buscar clientes")
      setClienteResultados(data.clientes || [])
    } catch (e: any) {
      setClienteResultados([])
      setClienteBusquedaError(e.message || "Error buscando clientes")
    } finally {
      setBuscandoClientes(false)
    }
  }

  const seleccionarClientePorId = async (id: string | number) => {
    setError("")
    setClienteBusquedaError("")
    try {
      const res = await fetch(`/api/clientes/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el cliente")
      const form = mapApiClienteToForm(data.cliente)
      setSelectedClienteId(Number(id))
      setCliente(form)
      setClienteModo("buscar")
    } catch (e: any) {
      setError(e.message || "Error seleccionando cliente")
    }
  }

  const limpiarClienteSeleccionado = () => {
    setSelectedClienteId(null)
    setCliente(emptyCliente())
  }

  const irAModoNuevo = () => {
    setClienteModo("nuevo")
    setSelectedClienteId(null)
    setCliente(emptyCliente())
    setClienteDocWarning(null)
    setError("")
  }

  const irAModoBuscar = () => {
    setClienteModo("buscar")
    setError("")
    if (!selectedClienteId) {
      setCliente(emptyCliente())
    }
    void buscarClientes("")
  }

  const verificarDocumentoCliente = async () => {
    const doc = cliente.numDocumento.trim()
    if (!doc) {
      setClienteDocWarning(null)
      return
    }
    try {
      const res = await fetch(`/api/clientes?search=${encodeURIComponent(doc)}`)
      const data = await res.json()
      if (!res.ok) return
      const match = (data.clientes || []).find((c: ClienteListaItem) => c.numDocumento === doc)
      if (match) {
        setClienteDocWarning(
          `Ya existe un cliente con este documento: ${match.nombres} ${match.apPaterno} (${match.tipoDocumento} ${match.numDocumento}). Usá «Buscar existente».`
        )
      } else {
        setClienteDocWarning(null)
      }
    } catch {
      // no-op
    }
  }

  const sincronizarParametrosDesdeVehiculo = (v: VehiculoForm) => {
    setParametros((p) => {
      const precio = v.precioLista
      const residualMonto =
        v.tipoValResid === "MONTO" && v.valResidEst > 0
          ? v.valResidEst
          : v.tipoValResid === "PORCENTAJE" && v.valResidEst > 0
            ? (precio * v.valResidEst) / 100
            : precio * (p.pctCuotaFinal || 0.4)
      const pctCuotaFinal = precio > 0 ? residualMonto / precio : p.pctCuotaFinal
      return {
        ...p,
        monedaOp: v.monedaPrecio,
        precioVehiculo: precio,
        cuotaIniMnt: (precio * p.cuotaIniPct) / 100,
        residualFlag: true,
        residualMonto,
        pctCuotaFinal,
      }
    })
  }

  const buscarVehiculos = async (term?: string) => {
    setBuscandoVehiculos(true)
    setVehiculoBusquedaError("")
    try {
      const qs = new URLSearchParams({ estado: "DISPONIBLE" })
      const q = (term ?? vehiculoSearch).trim()
      if (q) qs.set("search", q)
      const res = await fetch(`/api/vehiculos?${qs.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo buscar vehículos")
      setVehiculoResultados(data.vehiculos || [])
    } catch (e: any) {
      setVehiculoResultados([])
      setVehiculoBusquedaError(e.message || "Error buscando vehículos")
    } finally {
      setBuscandoVehiculos(false)
    }
  }

  const seleccionarVehiculoPorId = async (id: string | number) => {
    setError("")
    setVehiculoBusquedaError("")
    try {
      const res = await fetch(`/api/vehiculos/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "No se pudo cargar el vehículo")
      const form = mapApiVehiculoToForm(data.vehiculo)
      setSelectedVehiculoId(Number(id))
      setVehiculo(form)
      setVehiculoModo("buscar")
      sincronizarParametrosDesdeVehiculo(form)
    } catch (e: any) {
      setError(e.message || "Error seleccionando vehículo")
    }
  }

  const limpiarVehiculoSeleccionado = () => {
    setSelectedVehiculoId(null)
    setVehiculo(emptyVehiculo())
  }

  const irAModoVehiculoNuevo = () => {
    setVehiculoModo("nuevo")
    setSelectedVehiculoId(null)
    setVehiculo(emptyVehiculo())
    setError("")
  }

  const irAModoVehiculoBuscar = () => {
    setVehiculoModo("buscar")
    setError("")
    if (!selectedVehiculoId) {
      setVehiculo(emptyVehiculo())
    }
    void buscarVehiculos("")
  }

  useEffect(() => {
    const clienteId = searchParams.get("clienteId")
    const vehiculoId = searchParams.get("vehiculoId")
    if (clienteId) void seleccionarClientePorId(clienteId)
    else void buscarClientes("")
    if (vehiculoId) void seleccionarVehiculoPorId(vehiculoId)
    else void buscarVehiculos("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validarPasoCliente = (): string | null => {
    if (clienteModo === "buscar" || selectedClienteId) {
      if (!selectedClienteId) return "Seleccioná un cliente existente o registrá uno nuevo."
      return null
    }
    if (!cliente.numDocumento.trim()) return "Ingresá el número de documento."
    if (cliente.tipoDocumento === "DNI" && cliente.numDocumento.trim().length !== 8) {
      return "El DNI debe tener 8 dígitos."
    }
    if (cliente.nombres.trim().length < 2) return "Ingresá los nombres del cliente."
    if (cliente.apPaterno.trim().length < 2) return "Ingresá el apellido paterno."
    if (!/^\d{9}$/.test(cliente.celular.trim())) return "El celular debe tener 9 dígitos."
    if (!cliente.correo.trim().includes("@")) return "Ingresá un correo válido."
    if (cliente.direccion.trim().length < 5) return "Ingresá la dirección del cliente."
    return null
  }

  const validarPasoVehiculo = (): string | null => {
    if (vehiculoModo === "buscar" || selectedVehiculoId) {
      if (!selectedVehiculoId) return "Seleccioná un vehículo del catálogo o registrá uno nuevo."
      return null
    }
    if (vehiculo.marca.trim().length < 2) return "Seleccioná la marca del vehículo."
    if (vehiculo.modelo.trim().length < 2) return "Seleccioná el modelo del vehículo."
    if (!vehiculo.precioLista || vehiculo.precioLista <= 0) return "Ingresá el precio de lista."
    if (vehiculo.concesionario.trim().length < 2) return "Ingresá el concesionario."
    return null
  }

  const siguiente = () => {
    if (paso === 0) {
      const msg = validarPasoCliente()
      if (msg) {
        setError(msg)
        return
      }
    }
    if (paso === 1) {
      const msg = validarPasoVehiculo()
      if (msg) {
        setError(msg)
        return
      }
    }
    setError("")
    setPaso((p) => Math.min(p + 1, pasos.length - 1))
  }
  const anterior = () => setPaso((p) => Math.max(p - 1, 0))

  const syncGracia = (total: number, parcial: number) => ({
    graciaTotalMeses: total,
    graciaParcialMeses: parcial,
    graciaFlag: total + parcial > 0,
    graciaTipo: (total > 0 ? "TOTAL" : "PARCIAL") as "TOTAL" | "PARCIAL",
    graciaMeses: total > 0 ? total : parcial,
  })

  /** Rellena con perfil Interbank Compra Inteligente (Plan 36). */
  const rellenarDemo = async () => {
    const hoy = new Date()
    const fecDesembolso = hoy.toISOString().slice(0, 10)
    const fec1era = new Date(hoy)
    fec1era.setDate(fec1era.getDate() + 30)
    const cuotaIniPct = interbankOperacionDemo.cuotaIniPct

    setClienteModo("buscar")
    setVehiculoModo("buscar")
    setError("")
    setPaso(0)

    setParametros({
      monedaOp: interbankOperacionDemo.monedaOp,
      ...interbankProductoDefaults,
      tasaIngresada: INTERBANK_TEA_PLAN36,
      precioVehiculo: 0,
      cuotaIniPct,
      cuotaIniMnt: 0,
      plazoMeses: interbankOperacionDemo.plazoMeses,
      fecDesembolso,
      fec1eraCuota: fec1era.toISOString().slice(0, 10),
      ...syncGracia(
        interbankOperacionDemo.graciaTotalMeses,
        interbankOperacionDemo.graciaParcialMeses
      ),
      motivoEdicion: "",
    })

    // Cliente + vehículo: seleccionar del directorio/catálogo
    try {
      const [resClientes, resVehiculos] = await Promise.all([
        fetch("/api/clientes?estado=ACTIVO"),
        fetch("/api/vehiculos?estado=DISPONIBLE"),
      ])
      const dataClientes = await resClientes.json()
      const dataVehiculos = await resVehiculos.json()
      if (!resClientes.ok) throw new Error(dataClientes.error || "No se pudo cargar clientes demo")
      if (!resVehiculos.ok) throw new Error(dataVehiculos.error || "No se pudo cargar vehículos demo")

      const listaClientes: ClienteListaItem[] = dataClientes.clientes || []
      const listaVehiculos: VehiculoListaItem[] = dataVehiculos.vehiculos || []

      if (listaClientes.length === 0) {
        setSelectedClienteId(null)
        setCliente(emptyCliente())
        setError("No hay clientes en el directorio. Registrá uno o ejecutá el seed demo.")
        return
      }
      if (listaVehiculos.length === 0) {
        setSelectedVehiculoId(null)
        setVehiculo(emptyVehiculo())
        setError("No hay vehículos en el catálogo. Registrá uno o ejecutá el seed demo.")
        return
      }

      const clientePreferido =
        listaClientes.find((c) => c.numDocumento === "48291736") ||
        listaClientes.find((c) => /quispe/i.test(`${c.nombres} ${c.apPaterno}`)) ||
        listaClientes[0]

      const vehiculoPreferido =
        listaVehiculos.find(
          (v) =>
            v.marca.toLowerCase() === interbankOperacionDemo.marca.toLowerCase() &&
            v.modelo.toLowerCase().includes(interbankOperacionDemo.modelo.toLowerCase().split(" ")[0])
        ) ||
        listaVehiculos.find((v) => v.precioLista >= 80000) ||
        listaVehiculos[0]

      setClienteResultados(listaClientes)
      setVehiculoResultados(listaVehiculos)
      await seleccionarClientePorId(clientePreferido.id)
      await seleccionarVehiculoPorId(vehiculoPreferido.id)
    } catch (e: any) {
      setError(e.message || "No se pudo cargar la demo Interbank")
    }
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
        cliente: selectedClienteId
          ? undefined
          : {
              ...cliente,
              apMaterno: cliente.apMaterno || undefined,
              fecNacimiento: cliente.fecNacimiento || undefined,
              ingresosMens: cliente.ingresosMens > 0 ? cliente.ingresosMens : undefined,
              situacionLab: cliente.situacionLab || undefined,
              empresaEmpl: cliente.empresaEmpl || undefined,
            },
        vehiculo: selectedVehiculoId
          ? undefined
          : {
              ...vehiculo,
              version: vehiculo.version || undefined,
              valResidEst: vehiculo.valResidEst > 0 ? vehiculo.valResidEst : undefined,
              tipoValResid: vehiculo.valResidEst > 0 ? vehiculo.tipoValResid : undefined,
              tipoVehiculo: vehiculo.tipoVehiculo || undefined,
              transmision: vehiculo.transmision || undefined,
              combustible: vehiculo.combustible || undefined,
            },
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
                Usa «Rellenar demo Interbank» para elegir cliente y vehículo del catálogo + Plan 36.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void rellenarDemo()}
              className="shrink-0 px-3 py-2 text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
              title="Selecciona un cliente existente y carga perfil Interbank Compra Inteligente Plan 36"
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
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Paso 1: Cliente</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Buscá un cliente del directorio o registrá uno nuevo solo si aún no existe.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={irAModoBuscar}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      clienteModo === "buscar"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Buscar existente
                  </button>
                  <button
                    type="button"
                    onClick={irAModoNuevo}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      clienteModo === "nuevo"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Registrar nuevo
                  </button>
                </div>
              </div>

              {clienteModo === "buscar" && (
                <div className="space-y-3">
                  {selectedClienteId ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Cliente seleccionado
                          </p>
                          <p className="text-base font-semibold text-slate-900 mt-1">
                            {cliente.nombres} {cliente.apPaterno} {cliente.apMaterno}
                          </p>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {cliente.tipoDocumento} {cliente.numDocumento}
                            {cliente.celular ? ` · ${cliente.celular}` : ""}
                          </p>
                          {cliente.correo ? (
                            <p className="text-sm text-slate-500">{cliente.correo}</p>
                          ) : null}
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/clientes/${selectedClienteId}`}
                            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white"
                          >
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            onClick={limpiarClienteSeleccionado}
                            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
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
                        <button
                          type="button"
                          onClick={() => void buscarClientes()}
                          disabled={buscandoClientes}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60"
                        >
                          {buscandoClientes ? "Buscando..." : "Buscar"}
                        </button>
                      </div>

                      {clienteBusquedaError && (
                        <p className="text-sm text-red-600">{clienteBusquedaError}</p>
                      )}

                      <div className="border rounded-lg overflow-hidden">
                        {buscandoClientes ? (
                          <p className="p-4 text-sm text-slate-500">Cargando clientes...</p>
                        ) : clienteResultados.length === 0 ? (
                          <div className="p-4 text-sm text-slate-600 space-y-2">
                            <p>No se encontraron clientes activos.</p>
                            <button
                              type="button"
                              onClick={irAModoNuevo}
                              className="text-blue-600 hover:underline"
                            >
                              Registrar nuevo cliente
                            </button>
                          </div>
                        ) : (
                          <ul className="divide-y max-h-72 overflow-y-auto">
                            {clienteResultados.map((c) => (
                              <li key={c.id}>
                                <button
                                  type="button"
                                  onClick={() => void seleccionarClientePorId(c.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                                >
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {[c.nombres, c.apPaterno, c.apMaterno].filter(Boolean).join(" ")}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {c.tipoDocumento} {c.numDocumento}
                                      {c.celular ? ` · ${c.celular}` : ""}
                                    </p>
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">
                                    {c.cotizacionesCount ?? 0} cotiz.
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        ¿No está en la lista?{" "}
                        <button type="button" onClick={irAModoNuevo} className="text-blue-600 hover:underline">
                          Registrar nuevo
                        </button>
                        {" · "}
                        <Link href="/dashboard/clientes" className="text-blue-600 hover:underline">
                          Ir a Clientes
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              )}

              {clienteModo === "nuevo" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 rounded-lg border bg-slate-50 p-3">
                    Se creará un cliente nuevo al guardar la cotización. Si ya existe en el directorio, usá{" "}
                    <button type="button" onClick={irAModoBuscar} className="text-blue-600 hover:underline">
                      Buscar existente
                    </button>
                    .
                  </p>

                  {clienteDocWarning && (
                    <div className="p-3 border border-amber-200 bg-amber-50 text-amber-800 rounded text-sm">
                      {clienteDocWarning}
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Datos de identificación</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1">
                        <span className="text-sm inline-flex items-center gap-1">
                          Tipo de documento <HelpTooltip {...ayudaCamposCotizacion.tipoDocumento} />
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
                          Número de documento <HelpTooltip {...ayudaCamposCotizacion.numDocumento} />
                        </span>
                        <input
                          className="w-full border rounded p-2"
                          value={cliente.numDocumento}
                          onChange={(e) => setCliente((c) => ({ ...c, numDocumento: e.target.value }))}
                          onBlur={() => void verificarDocumentoCliente()}
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
                          Correo electrónico <HelpTooltip {...ayudaCamposCotizacion.correo} />
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
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="font-semibold text-slate-900">Datos complementarios (opcionales)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="space-y-1">
                        <span className="text-sm">Fecha nacimiento</span>
                        <input
                          type="date"
                          className="w-full border rounded p-2"
                          value={cliente.fecNacimiento}
                          onChange={(e) => setCliente((c) => ({ ...c, fecNacimiento: e.target.value }))}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Ingresos mensuales</span>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          value={cliente.ingresosMens || ""}
                          onChange={(e) =>
                            setCliente((c) => ({ ...c, ingresosMens: Number(e.target.value) || 0 }))
                          }
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Moneda ingresos</span>
                        <select
                          className="w-full border rounded p-2"
                          value={cliente.monedaIngres}
                          onChange={(e) =>
                            setCliente((c) => ({ ...c, monedaIngres: e.target.value as Moneda }))
                          }
                        >
                          <option value="PEN">PEN</option>
                          <option value="USD">USD</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Situación laboral</span>
                        <select
                          className="w-full border rounded p-2"
                          value={cliente.situacionLab}
                          onChange={(e) => setCliente((c) => ({ ...c, situacionLab: e.target.value }))}
                        >
                          <option value="">Seleccionar</option>
                          <option value="DEPENDIENTE">DEPENDIENTE</option>
                          <option value="INDEPENDIENTE">INDEPENDIENTE</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                      </label>
                      <label className="space-y-1 md:col-span-2">
                        <span className="text-sm">Empresa empleadora</span>
                        <input
                          className="w-full border rounded p-2"
                          value={cliente.empresaEmpl}
                          onChange={(e) => setCliente((c) => ({ ...c, empresaEmpl: e.target.value }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {paso === 1 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Paso 2: Vehículo</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    Buscá un vehículo del catálogo o registrá uno nuevo solo si aún no existe.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={irAModoVehiculoBuscar}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      vehiculoModo === "buscar"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Buscar existente
                  </button>
                  <button
                    type="button"
                    onClick={irAModoVehiculoNuevo}
                    className={`px-3 py-1.5 text-sm rounded-lg border ${
                      vehiculoModo === "nuevo"
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Registrar nuevo
                  </button>
                </div>
              </div>

              {vehiculoModo === "buscar" && (
                <div className="space-y-3">
                  {selectedVehiculoId ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Vehículo seleccionado
                          </p>
                          <p className="text-base font-semibold text-slate-900 mt-1">
                            {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio}
                          </p>
                          <p className="text-sm text-slate-600 mt-0.5">
                            {vehiculo.monedaPrecio} {fmtMoney(Number(vehiculo.precioLista))}
                            {vehiculo.concesionario ? ` · ${vehiculo.concesionario}` : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Link
                            href={`/dashboard/vehiculos/${selectedVehiculoId}`}
                            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white"
                          >
                            Ver ficha
                          </Link>
                          <button
                            type="button"
                            onClick={limpiarVehiculoSeleccionado}
                            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white"
                          >
                            Cambiar
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          className="flex-1 border rounded-lg p-2"
                          placeholder="Buscar por marca, modelo, versión o concesionario"
                          value={vehiculoSearch}
                          onChange={(e) => setVehiculoSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              void buscarVehiculos()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => void buscarVehiculos()}
                          disabled={buscandoVehiculos}
                          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-60"
                        >
                          {buscandoVehiculos ? "Buscando..." : "Buscar"}
                        </button>
                      </div>

                      {vehiculoBusquedaError && (
                        <p className="text-sm text-red-600">{vehiculoBusquedaError}</p>
                      )}

                      <div className="border rounded-lg overflow-hidden">
                        {buscandoVehiculos ? (
                          <p className="p-4 text-sm text-slate-500">Cargando vehículos...</p>
                        ) : vehiculoResultados.length === 0 ? (
                          <div className="p-4 text-sm text-slate-600 space-y-2">
                            <p>No se encontraron vehículos disponibles.</p>
                            <button
                              type="button"
                              onClick={irAModoVehiculoNuevo}
                              className="text-blue-600 hover:underline"
                            >
                              Registrar nuevo vehículo
                            </button>
                          </div>
                        ) : (
                          <ul className="divide-y max-h-72 overflow-y-auto">
                            {vehiculoResultados.map((v) => (
                              <li key={v.id}>
                                <button
                                  type="button"
                                  onClick={() => void seleccionarVehiculoPorId(v.id)}
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-3"
                                >
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {v.marca} {v.modelo} {v.anio}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {v.monedaPrecio} {fmtMoney(Number(v.precioLista))}
                                      {v.concesionario ? ` · ${v.concesionario}` : ""}
                                    </p>
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">
                                    {v.cotizacionesCount ?? 0} cotiz.
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        ¿No está en la lista?{" "}
                        <button
                          type="button"
                          onClick={irAModoVehiculoNuevo}
                          className="text-blue-600 hover:underline"
                        >
                          Registrar nuevo
                        </button>
                        {" · "}
                        <Link href="/dashboard/vehiculos" className="text-blue-600 hover:underline">
                          Ir a Vehículos
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              )}

              {vehiculoModo === "nuevo" && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600 rounded-lg border bg-slate-50 p-3">
                    Se creará un vehículo nuevo al guardar la cotización. Si ya existe en el catálogo, usá{" "}
                    <button type="button" onClick={irAModoVehiculoBuscar} className="text-blue-600 hover:underline">
                      Buscar existente
                    </button>
                    .
                  </p>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900">Identificación del vehículo</h3>
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
                          Versión / Trim <HelpTooltip {...ayudaCamposCotizacion.version} />
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
                          value={vehiculo.precioLista || ""}
                          onChange={(e) => {
                            const precio = Number(e.target.value) || 0
                            const next = { ...vehiculo, precioLista: precio }
                            setVehiculo(next)
                            sincronizarParametrosDesdeVehiculo(next)
                          }}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm inline-flex items-center gap-1">
                          Moneda precio <HelpTooltip {...ayudaCamposCotizacion.monedaPrecio} />
                        </span>
                        <select
                          className="w-full border rounded p-2"
                          value={vehiculo.monedaPrecio}
                          onChange={(e) => {
                            const monedaPrecio = e.target.value as Moneda
                            const next = { ...vehiculo, monedaPrecio }
                            setVehiculo(next)
                            sincronizarParametrosDesdeVehiculo(next)
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
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="font-semibold text-slate-900">Compra Inteligente</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="space-y-1">
                        <span className="text-sm">Valor residual estimado</span>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          value={vehiculo.valResidEst || ""}
                          onChange={(e) => {
                            const next = { ...vehiculo, valResidEst: Number(e.target.value) || 0 }
                            setVehiculo(next)
                            sincronizarParametrosDesdeVehiculo(next)
                          }}
                        />
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Tipo de valor residual</span>
                        <select
                          className="w-full border rounded p-2"
                          value={vehiculo.tipoValResid}
                          onChange={(e) => {
                            const next = {
                              ...vehiculo,
                              tipoValResid: e.target.value as "MONTO" | "PORCENTAJE",
                            }
                            setVehiculo(next)
                            sincronizarParametrosDesdeVehiculo(next)
                          }}
                        >
                          <option value="MONTO">Monto fijo</option>
                          <option value="PORCENTAJE">Porcentaje</option>
                        </select>
                      </label>
                    </div>
                    <p className="text-xs text-slate-600">
                      Es el monto que el cliente pagará al final del plazo para conservar el vehículo.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t">
                    <h3 className="font-semibold text-slate-900">Información adicional</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="space-y-1">
                        <span className="text-sm">Tipo vehículo</span>
                        <select
                          className="w-full border rounded p-2"
                          value={vehiculo.tipoVehiculo}
                          onChange={(e) => setVehiculo((v) => ({ ...v, tipoVehiculo: e.target.value }))}
                        >
                          <option value="">(opcional)</option>
                          <option value="SEDAN">SEDAN</option>
                          <option value="SUV">SUV</option>
                          <option value="CAMIONETA">CAMIONETA</option>
                          <option value="PICKUP">PICKUP</option>
                          <option value="HATCHBACK">HATCHBACK</option>
                          <option value="COUPE">COUPE</option>
                          <option value="STATION_WAGON">STATION_WAGON</option>
                          <option value="VAN">VAN</option>
                          <option value="OTRO">OTRO</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Transmisión</span>
                        <select
                          className="w-full border rounded p-2"
                          value={vehiculo.transmision}
                          onChange={(e) => setVehiculo((v) => ({ ...v, transmision: e.target.value }))}
                        >
                          <option value="">(opcional)</option>
                          <option value="MANUAL">MANUAL</option>
                          <option value="AUTOMATICA">AUTOMATICA</option>
                          <option value="CVT">CVT</option>
                          <option value="DUAL">DUAL</option>
                        </select>
                      </label>
                      <label className="space-y-1">
                        <span className="text-sm">Combustible</span>
                        <select
                          className="w-full border rounded p-2"
                          value={vehiculo.combustible}
                          onChange={(e) => setVehiculo((v) => ({ ...v, combustible: e.target.value }))}
                        >
                          <option value="">(opcional)</option>
                          <option value="GASOLINA">GASOLINA</option>
                          <option value="DIESEL">DIESEL</option>
                          <option value="HIBRIDO">HIBRIDO</option>
                          <option value="ELECTRICO">ELECTRICO</option>
                          <option value="GLP">GLP</option>
                        </select>
                      </label>
                    </div>
                  </div>
                </div>
              )}
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
                      onChange={(e) => {
                        const cuotaIniMnt = Number(e.target.value)
                        setParametros((p) => ({
                          ...p,
                          cuotaIniMnt,
                          cuotaIniPct:
                            p.precioVehiculo > 0
                              ? Math.round(((cuotaIniMnt / p.precioVehiculo) * 100) * 10000) / 10000
                              : 0,
                        }))
                      }}
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
                  <p className="text-xs text-slate-500 mb-1">
                    {selectedClienteId ? "Cliente existente del directorio" : "Cliente nuevo (se creará al guardar)"}
                  </p>
                  <p>
                    {[cliente.nombres, cliente.apPaterno, cliente.apMaterno].filter(Boolean).join(" ")}
                  </p>
                  <p>
                    {cliente.tipoDocumento}: {cliente.numDocumento}
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Vehículo</h3>
                  <p className="text-xs text-slate-500 mb-1">
                    {selectedVehiculoId
                      ? "Vehículo existente del catálogo"
                      : "Vehículo nuevo (se creará al guardar)"}
                  </p>
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
