import { prisma } from "@/lib/db"

function limpiarUsuario(valor: string) {
  const limpio = valor
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
  return limpio.slice(0, 40) || "asesor"
}

export async function obtenerUsuarioInternoDesdeSesion(sessionUser: {
  id?: string | null
  email?: string | null
  name?: string | null
}) {
  const base =
    sessionUser.email?.split("@")[0] ||
    sessionUser.name ||
    `user_${sessionUser.id || "anon"}`

  const usuarioBase = limpiarUsuario(base)

  const existente = await prisma.usuario.findFirst({
    where: { usuario: usuarioBase },
  })

  if (existente) return existente.id

  let intento = 0
  while (intento < 20) {
    const sufijo = intento === 0 ? "" : `_${intento}`
    const username = `${usuarioBase}${sufijo}`.slice(0, 50)

    try {
      const creado = await prisma.usuario.create({
        data: {
          usuario: username,
          contrasena: "better_auth_managed",
          nombreCompleto: sessionUser.name || sessionUser.email || "Asesor",
          rol: "ASESOR",
          estado: "ACTIVO",
        },
      })

      return creado.id
    } catch {
      intento += 1
    }
  }

  throw new Error("No se pudo crear o resolver usuario interno")
}
