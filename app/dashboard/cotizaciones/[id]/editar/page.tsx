'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HelpTooltip } from "@/components/transparencia/help-tooltip"
import { ayudaCamposCotizacion } from "@/lib/transparencia-help"
import { calcularTEA } from "@/lib/motor-financiero"

export const dynamic = "force-dynamic"

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
      original = original[keys[i]]
    }
    if (original[keys[keys.length - 1]] !== value) {
      setModifiedFields(prev => new Set([...prev, field]))
    } else {
      setModifiedFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(field)
        return newSet
      })
    }
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
    // Si la cotización vieja guardó TNA, mostrar la TEA equivalente (no el 15 nominal).
    let tasaTeaPct = rawTasa
    if (rawTipo === "TNA") {
      try {
        tasaTeaPct =
          calcularTEA(rawTasa, "TNA", cotizacion.capitalizacion === "MENSUAL" ? "MENSUAL" : "DIARIA") *
          100
      } catch {
        // Fallback: tea en BD suele estar en decimal
        const teaStored = Number(cotizacion.tea)
        tasaTeaPct = teaStored > 0 && teaStored < 2 ? teaStored * 100 : rawTasa
      }
    }

    setFormData({
      cliente: { ...cotizacion.cliente },
      vehiculo: { ...cotizacion.vehiculo },
      parametros: {
        monedaOp: cotizacion.monedaOp ?? cotizacion.moneda ?? "PEN",
        tipoTasa: "TEA",
        capitalizacion: null,
        tasaIngresada: Number(tasaTeaPct.toFixed(6)),
        precioVehiculo: Number(cotizacion.precioVehiculo ?? cotizacion.vehiculo?.precioLista ?? 0),
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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Editando: COT-{c.id}</h1>
              <p className="text-sm text-slate-600">
                Cliente: {c.cliente.nombres} {c.cliente.apPaterno} | Versión actual: v{c.version} | Estado: {c.estado}
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
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Datos del cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombres">Nombres</Label>
                  <Input
                    id="nombres"
                    value={formData.cliente?.nombres || ""}
                    onChange={(e) => handleFieldChange("cliente.nombres", e.target.value)}
                    className={modifiedFields.has("cliente.nombres") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="apPaterno">Apellido Paterno</Label>
                  <Input
                    id="apPaterno"
                    value={formData.cliente?.apPaterno || ""}
                    onChange={(e) => handleFieldChange("cliente.apPaterno", e.target.value)}
                    className={modifiedFields.has("cliente.apPaterno") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="apMaterno">Apellido Materno</Label>
                  <Input
                    id="apMaterno"
                    value={formData.cliente?.apMaterno || ""}
                    onChange={(e) => handleFieldChange("cliente.apMaterno", e.target.value)}
                    className={modifiedFields.has("cliente.apMaterno") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="tipoDocumento">Tipo Documento</Label>
                  <Select
                    value={formData.cliente?.tipoDocumento || ""}
                    onValueChange={(value) => handleFieldChange("cliente.tipoDocumento", value)}
                  >
                    <SelectTrigger className={modifiedFields.has("cliente.tipoDocumento") ? "border-blue-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">CE</SelectItem>
                      <SelectItem value="RUC">RUC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="numDocumento">Número Documento</Label>
                  <Input
                    id="numDocumento"
                    value={formData.cliente?.numDocumento || ""}
                    onChange={(e) => handleFieldChange("cliente.numDocumento", e.target.value)}
                    className={modifiedFields.has("cliente.numDocumento") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="celular">Celular</Label>
                  <Input
                    id="celular"
                    value={formData.cliente?.celular || ""}
                    onChange={(e) => handleFieldChange("cliente.celular", e.target.value)}
                    className={modifiedFields.has("cliente.celular") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.cliente?.correo || ""}
                    onChange={(e) => handleFieldChange("cliente.correo", e.target.value)}
                    className={modifiedFields.has("cliente.correo") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.cliente?.direccion || ""}
                    onChange={(e) => handleFieldChange("cliente.direccion", e.target.value)}
                    className={modifiedFields.has("cliente.direccion") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="ingresosMensuales">Ingresos Mensuales</Label>
                  <Input
                    id="ingresosMensuales"
                    type="number"
                    value={formData.cliente?.ingresosMensuales || ""}
                    onChange={(e) => handleFieldChange("cliente.ingresosMensuales", e.target.value)}
                    className={modifiedFields.has("cliente.ingresosMensuales") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="situacionLaboral">Situación Laboral</Label>
                  <Select
                    value={formData.cliente?.situacionLaboral || ""}
                    onValueChange={(value) => handleFieldChange("cliente.situacionLaboral", value)}
                  >
                    <SelectTrigger className={modifiedFields.has("cliente.situacionLaboral") ? "border-blue-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DEPENDIENTE">Dependiente</SelectItem>
                      <SelectItem value="INDEPENDIENTE">Independiente</SelectItem>
                      <SelectItem value="JUBILADO">Jubilado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline">Cambiar cliente</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vehiculo" className="mt-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-semibold mb-4">Datos del vehículo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="marca">Marca</Label>
                  <Input
                    id="marca"
                    value={formData.vehiculo?.marca || ""}
                    onChange={(e) => handleFieldChange("vehiculo.marca", e.target.value)}
                    className={modifiedFields.has("vehiculo.marca") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="modelo">Modelo</Label>
                  <Input
                    id="modelo"
                    value={formData.vehiculo?.modelo || ""}
                    onChange={(e) => handleFieldChange("vehiculo.modelo", e.target.value)}
                    className={modifiedFields.has("vehiculo.modelo") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="anio">Año</Label>
                  <Input
                    id="anio"
                    type="number"
                    value={formData.vehiculo?.anio || ""}
                    onChange={(e) => handleFieldChange("vehiculo.anio", e.target.value)}
                    className={modifiedFields.has("vehiculo.anio") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="precioLista">Precio de Lista</Label>
                  <Input
                    id="precioLista"
                    type="number"
                    value={formData.vehiculo?.precioLista || ""}
                    onChange={(e) => handleFieldChange("vehiculo.precioLista", e.target.value)}
                    className={modifiedFields.has("vehiculo.precioLista") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="concesionario">Concesionario</Label>
                  <Input
                    id="concesionario"
                    value={formData.vehiculo?.concesionario || ""}
                    onChange={(e) => handleFieldChange("vehiculo.concesionario", e.target.value)}
                    className={modifiedFields.has("vehiculo.concesionario") ? "border-blue-500" : ""}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button variant="outline">Cambiar vehículo</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parametros" className="mt-6">
            <div className="bg-white rounded-xl border p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Parámetros financieros</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Configuración desde la entidad. TEA, seguros y gastos son de tarifario/producto; el{" "}
                  <strong>COK</strong> es la tasa de descuento del VAN del deudor (default mercado 8%; no se pregunta
                  al cliente).
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monedaOp" className="inline-flex items-center gap-1">
                    Moneda <HelpTooltip {...ayudaCamposCotizacion.monedaOp} />
                  </Label>
                  <Select
                    value={formData.parametros?.monedaOp || "PEN"}
                    onValueChange={(value) => handleFieldChange("parametros.monedaOp", value)}
                  >
                    <SelectTrigger className={modifiedFields.has("parametros.monedaOp") ? "border-blue-500" : ""}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PEN">PEN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tasaIngresada" className="inline-flex items-center gap-1">
                    TEA % <HelpTooltip {...ayudaCamposCotizacion.tasaIngresada} />
                  </Label>
                  <Input
                    id="tasaIngresada"
                    type="number"
                    step="0.0001"
                    value={formData.parametros?.tasaIngresada ?? ""}
                    onChange={(e) => {
                      handleFieldChange("parametros.tipoTasa", "TEA")
                      handleFieldChange("parametros.capitalizacion", null)
                      handleFieldChange("parametros.tasaIngresada", Number(e.target.value))
                    }}
                    className={modifiedFields.has("parametros.tasaIngresada") ? "border-blue-500" : ""}
                  />
                  <p className="text-xs text-slate-500 mt-1">Solo TEA (indicación del curso).</p>
                </div>
                <div>
                  <Label htmlFor="plazoMeses" className="inline-flex items-center gap-1">
                    Plazo (meses) <HelpTooltip {...ayudaCamposCotizacion.plazoMeses} />
                  </Label>
                  <Input
                    id="plazoMeses"
                    type="number"
                    value={formData.parametros?.plazoMeses ?? ""}
                    onChange={(e) => {
                      const plazoMeses = Number(e.target.value)
                      handleFieldChange("parametros.plazoMeses", plazoMeses)
                      if (plazoMeses === 24) handleFieldChange("parametros.pctCuotaFinal", 0.5)
                      if (plazoMeses === 36) handleFieldChange("parametros.pctCuotaFinal", 0.4)
                    }}
                    className={modifiedFields.has("parametros.plazoMeses") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="pctCuotaFinal" className="inline-flex items-center gap-1">
                    % Cuota final <HelpTooltip {...ayudaCamposCotizacion.pctCuotaFinal} />
                  </Label>
                  <Input
                    id="pctCuotaFinal"
                    type="number"
                    step="0.01"
                    value={
                      formData.parametros?.pctCuotaFinal != null
                        ? Number((Number(formData.parametros.pctCuotaFinal) * 100).toFixed(4))
                        : ""
                    }
                    onChange={(e) =>
                      handleFieldChange("parametros.pctCuotaFinal", Number(e.target.value) / 100)
                    }
                    className={modifiedFields.has("parametros.pctCuotaFinal") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="graciaTotalMeses" className="inline-flex items-center gap-1">
                    Gracia total (meses) <HelpTooltip {...ayudaCamposCotizacion.graciaTotalMeses} />
                  </Label>
                  <Input
                    id="graciaTotalMeses"
                    type="number"
                    value={formData.parametros?.graciaTotalMeses ?? 0}
                    onChange={(e) => {
                      const graciaTotalMeses = Number(e.target.value)
                      handleFieldChange("parametros.graciaTotalMeses", graciaTotalMeses)
                      const parcial = Number(formData.parametros?.graciaParcialMeses ?? 0)
                      handleFieldChange("parametros.graciaFlag", graciaTotalMeses + parcial > 0)
                    }}
                    className={modifiedFields.has("parametros.graciaTotalMeses") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="graciaParcialMeses" className="inline-flex items-center gap-1">
                    Gracia parcial (meses) <HelpTooltip {...ayudaCamposCotizacion.graciaParcialMeses} />
                  </Label>
                  <Input
                    id="graciaParcialMeses"
                    type="number"
                    value={formData.parametros?.graciaParcialMeses ?? 0}
                    onChange={(e) => {
                      const graciaParcialMeses = Number(e.target.value)
                      handleFieldChange("parametros.graciaParcialMeses", graciaParcialMeses)
                      const total = Number(formData.parametros?.graciaTotalMeses ?? 0)
                      handleFieldChange("parametros.graciaFlag", total + graciaParcialMeses > 0)
                    }}
                    className={modifiedFields.has("parametros.graciaParcialMeses") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="segDesgrav" className="inline-flex items-center gap-1">
                    Seg. desgravamen (período) <HelpTooltip {...ayudaCamposCotizacion.segDesgrav} />
                  </Label>
                  <Input
                    id="segDesgrav"
                    type="number"
                    step="0.00001"
                    value={formData.parametros?.segDesgrav ?? ""}
                    onChange={(e) => handleFieldChange("parametros.segDesgrav", Number(e.target.value))}
                    className={modifiedFields.has("parametros.segDesgrav") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="pctSegRie" className="inline-flex items-center gap-1">
                    % Seguro riesgo anual <HelpTooltip {...ayudaCamposCotizacion.pctSegRie} />
                  </Label>
                  <Input
                    id="pctSegRie"
                    type="number"
                    step="0.0001"
                    value={formData.parametros?.pctSegRie ?? ""}
                    onChange={(e) => handleFieldChange("parametros.pctSegRie", Number(e.target.value))}
                    className={modifiedFields.has("parametros.pctSegRie") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="gastoGps" className="inline-flex items-center gap-1">
                    GPS (período) <HelpTooltip {...ayudaCamposCotizacion.gastoGps} />
                  </Label>
                  <Input
                    id="gastoGps"
                    type="number"
                    value={formData.parametros?.gastoGps ?? ""}
                    onChange={(e) => handleFieldChange("parametros.gastoGps", Number(e.target.value))}
                    className={modifiedFields.has("parametros.gastoGps") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="portesPer" className="inline-flex items-center gap-1">
                    Portes (período) <HelpTooltip {...ayudaCamposCotizacion.portesPer} />
                  </Label>
                  <Input
                    id="portesPer"
                    type="number"
                    value={formData.parametros?.portesPer ?? ""}
                    onChange={(e) => handleFieldChange("parametros.portesPer", Number(e.target.value))}
                    className={modifiedFields.has("parametros.portesPer") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="gasAdmPer" className="inline-flex items-center gap-1">
                    Gastos adm. (período) <HelpTooltip {...ayudaCamposCotizacion.gasAdmPer} />
                  </Label>
                  <Input
                    id="gasAdmPer"
                    type="number"
                    value={formData.parametros?.gasAdmPer ?? ""}
                    onChange={(e) => handleFieldChange("parametros.gasAdmPer", Number(e.target.value))}
                    className={modifiedFields.has("parametros.gasAdmPer") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="gastoNotarial" className="inline-flex items-center gap-1">
                    Notarial <HelpTooltip {...ayudaCamposCotizacion.gastoNotarial} />
                  </Label>
                  <Input
                    id="gastoNotarial"
                    type="number"
                    value={formData.parametros?.gastoNotarial ?? ""}
                    onChange={(e) => handleFieldChange("parametros.gastoNotarial", Number(e.target.value))}
                    className={modifiedFields.has("parametros.gastoNotarial") ? "border-blue-500" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="costeRegistral" className="inline-flex items-center gap-1">
                    Registral <HelpTooltip {...ayudaCamposCotizacion.costeRegistral} />
                  </Label>
                  <Input
                    id="costeRegistral"
                    type="number"
                    value={formData.parametros?.costeRegistral ?? ""}
                    onChange={(e) => handleFieldChange("parametros.costeRegistral", Number(e.target.value))}
                    className={modifiedFields.has("parametros.costeRegistral") ? "border-blue-500" : ""}
                  />
                </div>
                <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
                  <Label htmlFor="cokAnual" className="inline-flex items-center gap-1">
                    COK / tasa de descuento anual (%) — VAN deudor
                    <HelpTooltip {...ayudaCamposCotizacion.cokAnual} />
                  </Label>
                  <Input
                    id="cokAnual"
                    type="number"
                    step="0.01"
                    value={
                      formData.parametros?.cokAnual != null
                        ? Number((Number(formData.parametros.cokAnual) * 100).toFixed(4))
                        : ""
                    }
                    onChange={(e) =>
                      handleFieldChange("parametros.cokAnual", Number(e.target.value) / 100)
                    }
                    className={`mt-1 max-w-xs ${modifiedFields.has("parametros.cokAnual") ? "border-blue-500" : ""}`}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Default sugerido 8% (costo de oportunidad de mercado). Editable según el perfil de análisis.
                  </p>
                </div>
              </div>
              <div className="mt-6">
                <Button onClick={handleRecalculate} disabled={isRecalculating}>
                  {isRecalculating ? 'Recalculando...' : 'Recalcular ahora'}
                </Button>
              </div>

              {isRecalculating && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-1 text-sm text-blue-800">
                    <div>Recalculando cronograma...</div>
                    {/* Loading steps would be shown here */}
                  </div>
                </div>
              )}

              {recalculationResult && (
                <div className="mt-6 space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">Indicadores recalculados</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">TCEA</p>
                        <p className="font-medium">{recalculationResult.indicadores.tcea.toFixed(4)}%</p>
                      </div>
                      <div>
                        <p className="text-slate-500">VAN Deudor</p>
                        <p className="font-medium">{c.moneda} {recalculationResult.indicadores.vanDeudor.toLocaleString("es-PE", { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">TIR Anual</p>
                        <p className="font-medium">{recalculationResult.indicadores.tirAnual.toFixed(4)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Nuevo cronograma ({recalculationResult.cronograma.length} cuotas)</h3>
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
                              <td className="p-2">{new Date(q.fechaVencimiento).toLocaleDateString("es-PE")}</td>
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