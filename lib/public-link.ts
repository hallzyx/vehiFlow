import { createHmac, timingSafeEqual } from "crypto"

type PublicQuotePayload = {
  id: string
  exp: number
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 días

function getSecret() {
  return (
    process.env.PUBLIC_LINK_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "dev-public-link-secret"
  )
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url")
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", getSecret()).update(encodedPayload).digest("base64url")
}

function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

export function generarTokenEnlaceCotizacion(
  cotizacionId: string,
  ttlSeconds = DEFAULT_TTL_SECONDS
) {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payload: PublicQuotePayload = { id: cotizacionId, exp }
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signPayload(encodedPayload)

  return {
    token: `${encodedPayload}.${signature}`,
    exp,
  }
}

export function verificarTokenEnlaceCotizacion(token: string, cotizacionId: string) {
  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return { ok: false as const, reason: "Token inválido" }
  }

  const expectedSignature = signPayload(encodedPayload)
  if (!safeEqual(signature, expectedSignature)) {
    return { ok: false as const, reason: "Firma inválida" }
  }

  let payload: PublicQuotePayload
  try {
    payload = JSON.parse(decodeBase64Url(encodedPayload))
  } catch {
    return { ok: false as const, reason: "Token malformado" }
  }

  if (payload.id !== cotizacionId) {
    return { ok: false as const, reason: "Token no corresponde a la cotización" }
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp < now) {
    return { ok: false as const, reason: "Enlace expirado" }
  }

  return {
    ok: true as const,
    payload,
  }
}
