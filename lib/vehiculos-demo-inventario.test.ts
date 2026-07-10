import { describe, expect, it } from "vitest"
import { VEHICULOS_DEMO_INVENTARIO, assertInventarioAlineadoAlCatalogo } from "./vehiculos-demo-inventario"
import { isMarcaCatalogada, isModeloCatalogado } from "./vehiculos-catalog"

describe("Inventario demo vs selector", () => {
  it("todos los vehículos usan marca/modelo del catálogo", () => {
    expect(() => assertInventarioAlineadoAlCatalogo()).not.toThrow()
    expect(VEHICULOS_DEMO_INVENTARIO.length).toBeGreaterThanOrEqual(8)
    for (const v of VEHICULOS_DEMO_INVENTARIO) {
      expect(isMarcaCatalogada(v.marca)).toBe(true)
      expect(isModeloCatalogado(v.marca, v.modelo)).toBe(true)
    }
  })

  it("incluye Yaris y Corolla Cross con precios de lista realistas (PEN)", () => {
    const yaris = VEHICULOS_DEMO_INVENTARIO.find((v) => v.marca === "Toyota" && v.modelo === "Yaris")
    expect(yaris).toBeTruthy()
    expect(yaris!.precioLista).toBeGreaterThanOrEqual(50_000)
    expect(yaris!.pctResidual).toBeCloseTo(0.4, 5)

    expect(
      VEHICULOS_DEMO_INVENTARIO.some(
        (v) => v.marca === "Toyota" && v.modelo === "Corolla Cross" && v.precioLista === 98490
      )
    ).toBe(true)
  })
})
