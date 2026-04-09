'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Confirmar cambios — COT-{c.id} v{c.version + 1}</h1>
            <p className="text-sm text-slate-600">Versión anterior: v{c.version} | Estado: {c.estado}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Resumen de modificaciones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Parámetros modificados</h3>
              <ul className="text-sm space-y-1">
                {Array.from(modifiedFields).map(field => (
                  <li key={field}>• {field}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Impacto en indicadores</h3>
              <p className="text-sm">Los indicadores se recalcularán automáticamente.</p>
            </div>
          </div>

          <div className="mt-6">
            <Label htmlFor="motivo">Motivo del cambio</Label>
            <Select value={motivo} onValueChange={(value) => setMotivo(value || "")}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleccionar motivo" />
              </SelectTrigger>
              <SelectContent>
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
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Guardando..." : `Guardar como versión v${c.version + 1}`}
          </Button>
          <Link href={`/dashboard/cotizaciones/${id}/editar`}>
            <Button variant="outline">Seguir editando</Button>
          </Link>
          <Link href={`/dashboard/cotizaciones/${id}`}>
            <Button variant="outline">Descartar cambios</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}