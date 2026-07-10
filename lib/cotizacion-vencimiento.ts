import { prisma } from "@/lib/db"

/** Días sin cambio de estado en SIMULADA/PRESENTADA antes de pasar a ARCHIVADA. */
export const DIAS_ARCHIVO_COTIZACION = 30

/**
 * Archiva cotizaciones en SIMULADA o PRESENTADA cuyo estado no cambió
 * en más de `dias` días (campo estadoDesde).
 * Se ejecuta de forma lazy al listar/consultar cotizaciones (sin cron).
 */
export async function archivarCotizacionesVencidas(
  dias: number = DIAS_ARCHIVO_COTIZACION
): Promise<number> {
  const limite = new Date()
  limite.setDate(limite.getDate() - dias)

  const result = await prisma.cotizacion.updateMany({
    where: {
      estado: { in: ["SIMULADA", "PRESENTADA"] },
      estadoDesde: { lt: limite },
    },
    data: {
      estado: "ARCHIVADA",
      estadoDesde: new Date(),
    },
  })

  return result.count
}
