import { isMarcaCatalogada, isModeloCatalogado } from "./vehiculos-catalog"

/**
 * Inventario corto de demo — marca/modelo exactos del selector (`VEHICULOS_CATALOG`).
 * La versión es texto libre (trim/acabado); no forma parte del select.
 */
export type VehiculoDemoItem = {
  marca: string
  modelo: string
  version: string
  anio: number
  precioLista: number
  monedaPrecio: "PEN" | "USD"
  concesionario: string
  tipoVehiculo: string
  transmision: string
  combustible: string
  /** % residual / balón Compra Inteligente sobre PV (Plan 36 ≈ 40%). */
  pctResidual: number
}

export const VEHICULOS_DEMO_INVENTARIO: readonly VehiculoDemoItem[] = [
  {
    marca: "Toyota",
    modelo: "Yaris",
    version: "1.5",
    anio: 2026,
    // Precio referencial PE (~USD 17,860 × TC demo).
    precioLista: 67_290,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SEDAN",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Toyota",
    modelo: "Corolla Cross",
    version: "SEG 1.8 CVT",
    anio: 2026,
    precioLista: 98_490,
    monedaPrecio: "PEN",
    concesionario: "Concesionario afiliado Interbank — Toyota del Perú (Surco)",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Toyota",
    modelo: "Corolla",
    version: "XEI",
    anio: 2025,
    precioLista: 109_290,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SEDAN",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Hyundai",
    modelo: "Creta",
    version: "GLS",
    anio: 2025,
    precioLista: 94_500,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Kia",
    modelo: "Seltos",
    version: "EX",
    anio: 2026,
    precioLista: 102_500,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Mazda",
    modelo: "CX-30",
    version: "Touring",
    anio: 2026,
    precioLista: 123_000,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Chevrolet",
    modelo: "Onix",
    version: "Premier",
    anio: 2025,
    precioLista: 69_800,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SEDAN",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Nissan",
    modelo: "Kicks",
    version: "Advance",
    anio: 2026,
    precioLista: 89_900,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Suzuki",
    modelo: "Swift",
    version: "GLX",
    anio: 2025,
    precioLista: 62_500,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "HATCHBACK",
    transmision: "MANUAL",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
  {
    marca: "Honda",
    modelo: "HR-V",
    version: "EXL",
    anio: 2026,
    precioLista: 118_000,
    monedaPrecio: "PEN",
    concesionario: "Concesionario Demo — Lima",
    tipoVehiculo: "SUV",
    transmision: "AUTOMATICA",
    combustible: "GASOLINA",
    pctResidual: 0.4,
  },
] as const

/** Garantiza que el inventario demo no se desvíe del selector. */
export function assertInventarioAlineadoAlCatalogo(): void {
  for (const v of VEHICULOS_DEMO_INVENTARIO) {
    if (!isMarcaCatalogada(v.marca) || !isModeloCatalogado(v.marca, v.modelo)) {
      throw new Error(
        `Inventario demo fuera del selector: ${v.marca} / ${v.modelo}. Actualiza VEHICULOS_DEMO_INVENTARIO o VEHICULOS_CATALOG.`
      )
    }
  }
}

export function residualEstimado(item: VehiculoDemoItem): number {
  return Math.round(item.precioLista * item.pctResidual)
}
