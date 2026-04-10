type PrimitiveId = string | number | bigint

type Versionable = {
  id: PrimitiveId
  version: number
  creadoEn: Date | string
}

export type FamiliaVersiones<T extends Versionable> = {
  familyId: string
  versiones: T[]
  latestVersion: number
  startedAt: Date
  updatedAt: Date
}

function toIdString(id: PrimitiveId) {
  return typeof id === "bigint" ? id.toString() : String(id)
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function toMs(value: Date | string) {
  return toDate(value).getTime()
}

export function agruparFamiliasVersiones<T extends Versionable>(
  items: T[]
): FamiliaVersiones<T>[] {
  if (items.length === 0) return []

  const sorted = [...items].sort((a, b) => {
    const byDate = toMs(a.creadoEn) - toMs(b.creadoEn)
    if (byDate !== 0) return byDate
    return Number(a.version) - Number(b.version)
  })

  const families: FamiliaVersiones<T>[] = []

  for (const item of sorted) {
    const version = Number(item.version) || 1

    if (version <= 1 || families.length === 0) {
      families.push({
        familyId: toIdString(item.id),
        versiones: [item],
        latestVersion: version,
        startedAt: toDate(item.creadoEn),
        updatedAt: toDate(item.creadoEn),
      })
      continue
    }

    let selectedIndex = -1
    for (let i = families.length - 1; i >= 0; i -= 1) {
      const family = families[i]
      const nextExpected = family.latestVersion + 1
      if (nextExpected !== version) continue
      if (toMs(item.creadoEn) < family.updatedAt.getTime()) continue
      selectedIndex = i
      break
    }

    if (selectedIndex === -1) {
      families.push({
        familyId: toIdString(item.id),
        versiones: [item],
        latestVersion: version,
        startedAt: toDate(item.creadoEn),
        updatedAt: toDate(item.creadoEn),
      })
      continue
    }

    const family = families[selectedIndex]
    family.versiones.push(item)
    family.latestVersion = Math.max(family.latestVersion, version)
    family.updatedAt = toDate(item.creadoEn)
  }

  return families
}

export function obtenerFamiliaPorCotizacionId<T extends Versionable>(
  items: T[],
  targetId: PrimitiveId
) {
  const target = toIdString(targetId)
  const families = agruparFamiliasVersiones(items)
  return families.find((family) =>
    family.versiones.some((item) => toIdString(item.id) === target)
  )
}
