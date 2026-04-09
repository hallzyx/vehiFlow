export function toJsonSafe<T>(input: T): T {
  return sanitize(input) as T
}

function sanitize(value: any): any {
  if (typeof value === "bigint") {
    return value.toString()
  }

  if (value === null || value === undefined) {
    return value
  }

  if (value instanceof Date) {
    return value
  }

  // Prisma Decimal exposes keys like { s, e, d, ... }
  if (
    typeof value === "object" &&
    value !== null &&
    "s" in value &&
    "e" in value &&
    "d" in value &&
    typeof (value as any).toString === "function"
  ) {
    const asNumber = Number((value as any).toString())
    return Number.isNaN(asNumber) ? (value as any).toString() : asNumber
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item))
  }

  if (typeof value === "object") {
    const ctor = value.constructor?.name
    if (ctor === "Decimal") {
      const asNumber = Number(value)
      return Number.isNaN(asNumber) ? String(value) : asNumber
    }

    const out: Record<string, any> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitize(v)
    }
    return out
  }

  return value
}
