'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

/** Etiquetas legibles para claves técnicas guardadas en editModifiedFields */
const FIELD_LABELS: Record<string, string> = {
  selectedClienteId: "Cliente",
  selectedVehiculoId: "Vehículo",
  "parametros.monedaOp": "Moneda de operación",
  "parametros.precioVehiculo": "Precio del vehículo",
  "parametros.cuotaIniPct": "Cuota inicial (%)",
  "parametros.cuotaIniMnt": "Cuota inicial (monto)",
  "parametros.plazoMeses": "Plazo (meses)",
  "parametros.fecDesembolso": "Fecha de desembolso",
  "parametros.fec1eraCuota": "Fecha de 1ra cuota",
  "parametros.graciaTotalMeses": "Gracia total (meses)",
  "parametros.graciaParcialMeses": "Gracia parcial (meses)",
  "parametros.graciaFlag": "Periodo de gracia",
  "parametros.graciaTipo": "Tipo de gracia",
  "parametros.graciaMeses": "Meses de gracia",
  "parametros.tipoTasa": "Tipo de tasa",
  "parametros.capitalizacion": "Capitalización",
  "parametros.tasaIngresada": "TEA (%)",
  "parametros.residualFlag": "Cuota final / residual",
  "parametros.pctCuotaFinal": "% cuota final",
  "parametros.residualMonto": "Monto residual",
  "parametros.segDesgrav": "Seguro desgravamen",
  "parametros.pctSegRie": "% seguro de riesgo",
  "parametros.gastoGps": "GPS",
  "parametros.portesPer": "Portes",
  "parametros.gasAdmPer": "Gastos administrativos",
  "parametros.gastoNotarial": "Costes notariales",
  "parametros.costeRegistral": "Costes registrales",
  "parametros.costeTasacion": "Tasación",
  "parametros.comisionEstudio": "Comisión de estudio",
  "parametros.comisionActivacion": "Comisión de activación",
  "parametros.cokAnual": "COK / tasa de descuento",
}

/** Campos derivados que no aportan al resumen del asesor */
const HIDDEN_FIELDS = new Set([
  "parametros.graciaFlag",
  "parametros.graciaTipo",
  "parametros.graciaMeses",
  "parametros.tipoTasa",
  "parametros.capitalizacion",
])

function labelForField(field: string): string {
  return FIELD_LABELS[field] ?? field
}

export default function ConfirmarEdicionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [id, setId] = useState<string>("")
  const [cotizacion, setCotizacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [motivo, setMotivo] = useState("")
  const [formData, setFormData] = useState<any>(null)
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set())
  const [motivoOtro, setMotivoOtro] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    params.then(({ id: paramId }) => {
      setId(paramId)
      fetchCotizacion(paramId)
    })

    // Load data from localStorage
    const storedFormData = localStorage.getItem('editFormData')
    const storedModifiedFields = localStorage.getItem('editModifiedFields')
    if (storedFormData) {
      setFormData(JSON.parse(storedFormData))
    }
    if (storedModifiedFields) {
      setModifiedFields(new Set(JSON.parse(storedModifiedFields)))
    }
  }, [params])

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

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/cotizaciones/${id}/editar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData,
          motivo: motivo === "otro" ? motivoOtro : motivo,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        router.push(`/dashboard/cotizaciones/${data.nuevaCotizacion.id}`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error saving:", error)
      alert("Error al guardar los cambios")
    } finally {
      setIsSaving(false)
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
  const yaArchivada = c.estado === "ARCHIVADA_VERSION" || c.estado === "ARCHIVADA"
  const estadoLabel =
    c.estado === "ARCHIVADA_VERSION"
      ? "versión anterior (archivada)"
      : c.estado === "SIMULADA"
        ? "simulada"
        : c.estado === "PRESENTADA"
          ? "presentada"
          : c.estado

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Confirmar cambios — COT-{c.id} → v{c.version + 1}
            </h1>
            <p className="text-sm text-slate-600">
              Base: v{c.version} · Estado actual de esta cotización: {estadoLabel}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {yaArchivada && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Esta versión ya fue archivada</p>
            <p className="mt-1">
              Al guardar una edición, la cotización base pasa a <code>ARCHIVADA_VERSION</code> y se
              crea una nueva en estado <strong>SIMULADA</strong>. Si viste un error al guardar pero
              el estado cambió, la nueva versión probablemente ya existe: ábrela desde el listado o
              el historial de versiones.
            </p>
            <Link
              href={`/dashboard/cotizaciones/${id}`}
              className="mt-2 inline-block text-amber-950 underline"
            >
              Ver detalle / historial de COT-{id}
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen de modificaciones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Cliente y vehículo</h3>
              <p className="text-sm text-slate-700">
                {formData?.cliente?.nombres} {formData?.cliente?.apPaterno}
                {formData?.cliente?.numDocumento
                  ? ` · ${formData.cliente.tipoDocumento} ${formData.cliente.numDocumento}`
                  : ""}
              </p>
              <p className="text-sm text-slate-700 mt-1">
                {formData?.vehiculo?.marca} {formData?.vehiculo?.modelo} {formData?.vehiculo?.anio}
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Campos / vínculos modificados</h3>
              <ul className="text-sm space-y-1">
                {(() => {
                  const visible = Array.from(modifiedFields).filter((f) => !HIDDEN_FIELDS.has(f))
                  if (visible.length === 0) {
                    return (
                      <li className="text-slate-500">
                        Sin cambios marcados (se recalculará con parámetros actuales)
                      </li>
                    )
                  }
                  return visible.map((field) => (
                    <li key={field}>• {labelForField(field)}</li>
                  ))
                })()}
              </ul>
            </div>
          </div>

          <div className="mt-6 max-w-lg">
            <Label htmlFor="motivo">Motivo del cambio</Label>
            <Select value={motivo} onValueChange={(value) => setMotivo(value || "")}>
              <SelectTrigger className="mt-1 w-full min-w-[20rem]">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent
                align="start"
                alignItemWithTrigger={false}
                className="min-w-(--anchor-width) w-auto max-w-[min(100vw-2rem,28rem)]"
              >
                <SelectItem value="cliente">Solicitud del cliente</SelectItem>
                <SelectItem value="comercial">Ajuste de condiciones comerciales</SelectItem>
                <SelectItem value="datos">Corrección de datos</SelectItem>
                <SelectItem value="comparativa">Comparativa de escenarios</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            {motivo === "otro" && (
              <Input
                className="mt-2"
                placeholder="Especificar motivo"
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
              />
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button onClick={handleSave} disabled={isSaving || yaArchivada}>
            {isSaving ? "Guardando..." : `Guardar como versión v${c.version + 1}`}
          </Button>
          {!yaArchivada && (
            <Link href={`/dashboard/cotizaciones/${id}/editar`}>
              <Button variant="outline">Seguir editando</Button>
            </Link>
          )}
          <Link href={`/dashboard/cotizaciones/${id}`}>
            <Button variant="outline">{yaArchivada ? "Ir al detalle" : "Descartar cambios"}</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}