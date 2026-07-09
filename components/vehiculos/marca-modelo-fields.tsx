"use client"

import { useEffect, useState } from "react"
import {
  MARCAS_CATALOG,
  MARCA_OTRA,
  MODELO_OTRO,
  isMarcaCatalogada,
  isModeloCatalogado,
  modelosDeMarca,
} from "@/lib/vehiculos-catalog"

type Props = {
  marca: string
  modelo: string
  onMarcaChange: (marca: string) => void
  onModeloChange: (modelo: string) => void
  marcaLabel?: React.ReactNode
  modeloLabel?: React.ReactNode
}

/**
 * Select de marca/modelo con catálogo PE + "Otra…" / "Otro…" (texto libre).
 * Persiste siempre el texto final en marca/modelo (sin tokens internos).
 */
export function MarcaModeloFields({
  marca,
  modelo,
  onMarcaChange,
  onModeloChange,
  marcaLabel = "Marca",
  modeloLabel = "Modelo",
}: Props) {
  const [marcaCustom, setMarcaCustom] = useState(() => Boolean(marca) && !isMarcaCatalogada(marca))
  const [modeloCustom, setModeloCustom] = useState(
    () => Boolean(modelo) && !isModeloCatalogado(marca, modelo)
  )

  // Si llegan valores externos (edición / seed), alinear modo custom
  useEffect(() => {
    if (marca && !isMarcaCatalogada(marca)) setMarcaCustom(true)
    else if (isMarcaCatalogada(marca)) setMarcaCustom(false)
  }, [marca])

  useEffect(() => {
    if (!modelo) return
    if (marcaCustom || !isModeloCatalogado(marca, modelo)) setModeloCustom(true)
    else setModeloCustom(false)
  }, [marca, modelo, marcaCustom])

  const marcaSel = marcaCustom ? MARCA_OTRA : marca && isMarcaCatalogada(marca) ? marca : ""
  const modelos = marcaSel && marcaSel !== MARCA_OTRA ? modelosDeMarca(marcaSel) : []
  const modeloSel = modeloCustom
    ? MODELO_OTRO
    : modelo && isModeloCatalogado(marca, modelo)
      ? modelo
      : ""

  return (
    <>
      <label className="space-y-1">
        <span className="text-sm inline-flex items-center gap-1">{marcaLabel}</span>
        <select
          className="w-full border rounded p-2"
          value={marcaSel}
          onChange={(e) => {
            const v = e.target.value
            if (!v) {
              setMarcaCustom(false)
              setModeloCustom(false)
              onMarcaChange("")
              onModeloChange("")
              return
            }
            if (v === MARCA_OTRA) {
              setMarcaCustom(true)
              setModeloCustom(true)
              onMarcaChange("")
              onModeloChange("")
              return
            }
            setMarcaCustom(false)
            setModeloCustom(false)
            onMarcaChange(v)
            onModeloChange("")
          }}
        >
          <option value="">Seleccionar marca…</option>
          {MARCAS_CATALOG.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          <option value={MARCA_OTRA}>Otra marca…</option>
        </select>
        {marcaCustom && (
          <input
            className="w-full border rounded p-2 mt-1"
            placeholder="Escribe la marca"
            value={marca}
            onChange={(e) => {
              onMarcaChange(e.target.value)
              onModeloChange("")
            }}
          />
        )}
      </label>

      <label className="space-y-1">
        <span className="text-sm inline-flex items-center gap-1">{modeloLabel}</span>
        {!marcaCustom && marcaSel ? (
          <>
            <select
              className="w-full border rounded p-2"
              value={modeloSel}
              onChange={(e) => {
                const v = e.target.value
                if (!v) {
                  setModeloCustom(false)
                  onModeloChange("")
                  return
                }
                if (v === MODELO_OTRO) {
                  setModeloCustom(true)
                  onModeloChange("")
                  return
                }
                setModeloCustom(false)
                onModeloChange(v)
              }}
            >
              <option value="">Seleccionar modelo…</option>
              {modelos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
              <option value={MODELO_OTRO}>Otro modelo…</option>
            </select>
            {modeloCustom && (
              <input
                className="w-full border rounded p-2 mt-1"
                placeholder="Escribe el modelo"
                value={modelo}
                onChange={(e) => onModeloChange(e.target.value)}
              />
            )}
          </>
        ) : (
          <input
            className="w-full border rounded p-2"
            placeholder={
              marcaCustom || marca ? "Escribe el modelo" : "Primero elige una marca"
            }
            value={modelo}
            disabled={!marcaCustom && !marca}
            onChange={(e) => onModeloChange(e.target.value)}
          />
        )}
      </label>
    </>
  )
}
