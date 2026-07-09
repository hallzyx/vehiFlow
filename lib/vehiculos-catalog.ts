/** Catálogo de marcas/modelos frecuentes en crédito vehicular Perú (demo UX).
 *  No altera el motor financiero: marca/modelo son solo datos del vehículo.
 *  Incluye opción "Otra…" para valores custom.
 *  El inventario corto de BD demo vive en `vehiculos-demo-inventario.ts`
 *  y debe usar solo pares marca/modelo de este catálogo.
 */

export const MARCA_OTRA = "__OTRA__"
export const MODELO_OTRO = "__OTRO__"

export const VEHICULOS_CATALOG: Record<string, string[]> = {
  Toyota: ["Yaris", "Corolla", "Corolla Cross", "RAV4", "Hilux", "Fortuner", "Rush"],
  Hyundai: ["Accent", "Elantra", "Tucson", "Creta", "Santa Fe", "Staria"],
  Kia: ["Rio", "Soluto", "Sportage", "Seltos", "Sorento", "Carnival"],
  Chevrolet: ["Onix", "Tracker", "Captiva", "Silverado", "Colorado"],
  Nissan: ["Versa", "Sentra", "Kicks", "X-Trail", "Frontier", "NP300"],
  Suzuki: ["Swift", "Baleno", "Vitara", "S-Cross", "Jimny", "Dzire"],
  Mazda: ["Mazda2", "Mazda3", "CX-30", "CX-5", "CX-50"],
  Honda: ["City", "Civic", "HR-V", "CR-V", "Pilot"],
  Volkswagen: ["Polo", "Virtus", "T-Cross", "Taos", "Amarok"],
  Ford: ["Territory", "Escape", "Ranger", "Explorer", "Bronco Sport"],
  Mitsubishi: ["Mirage", "Xpander", "Outlander", "L200", "Montero Sport"],
  Subaru: ["Impreza", "Crosstrek", "Forester", "Outback"],
  BMW: ["Serie 1", "Serie 3", "X1", "X3", "X5"],
  "Mercedes-Benz": ["Clase A", "Clase C", "GLA", "GLC", "GLE"],
  Audi: ["A3", "A4", "Q3", "Q5", "Q7"],
  Jeep: ["Renegade", "Compass", "Wrangler", "Grand Cherokee"],
  Changan: ["Alsvin", "CS35 Plus", "CS55 Plus", "Hunter"],
  BYD: ["Dolphin", "Seal", "Song Plus", "Tang"],
  MG: ["MG3", "ZS", "HS", "RX5"],
  Chery: ["Arrizo 5", "Tiggo 2 Pro", "Tiggo 4 Pro", "Tiggo 7 Pro", "Tiggo 8"],
  "Great Wall": ["Poer", "Haval Jolion", "Haval H6"],
  Geely: ["Coolray", "Okavango", "Geometry C"],
}

export const MARCAS_CATALOG = Object.keys(VEHICULOS_CATALOG).sort((a, b) =>
  a.localeCompare(b, "es")
)

export function modelosDeMarca(marca: string): string[] {
  return VEHICULOS_CATALOG[marca] ?? []
}

export function isMarcaCatalogada(marca: string): boolean {
  return Boolean(marca && VEHICULOS_CATALOG[marca])
}

export function isModeloCatalogado(marca: string, modelo: string): boolean {
  return Boolean(modelo && modelosDeMarca(marca).includes(modelo))
}

/** Valor del <select> de marca a partir del texto guardado. */
export function marcaSelectValue(marca: string): string {
  if (!marca) return ""
  return isMarcaCatalogada(marca) ? marca : MARCA_OTRA
}

/** Valor del <select> de modelo a partir del texto guardado. */
export function modeloSelectValue(marca: string, modelo: string): string {
  if (!modelo) return ""
  if (isModeloCatalogado(marca, modelo)) return modelo
  return MODELO_OTRO
}
