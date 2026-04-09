import { prisma } from "@/lib/db"
import type { RolUsuario } from "@prisma/client"

function limpiarUsuario(valor: string) {
  const limpio = valor
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
  return limpio.slice(0, 40) || "asesor"
}

function resolverUsuarioBaseDesdeSesion(sessionUser: {
  id?: string | null
  email?: string | null
  name?: string | null
}) {
  const email = (sessionUser.email || "").toLowerCase()
  const localPart = email.split("@")[0]

  // Mapeo estable para cuentas demo por rol
  if (["admin", "asesor", "analista", "auditor"].includes(localPart)) {
    return `${localPart}_demo`
  }

  return (
    sessionUser.email?.split("@")[0] ||
    sessionUser.name ||
    `user_${sessionUser.id || "anon"}`
  )
}

export async function obtenerUsuarioInternoDesdeSesion(sessionUser: {
  id?: string | null
  email?: string | null
  name?: string | null
}) {
  const contexto = await obtenerContextoUsuarioInternoDesdeSesion(sessionUser)
  return contexto.id
}

export function inferirRolDesdeEmail(email?: string | null): RolUsuario {
  const e = (email || "").toLowerCase()
  if (e.includes("admin")) return "ADMIN"
  if (e.includes("analista")) return "ANALISTA"
  if (e.includes("auditor")) return "AUDITOR"
  return "ASESOR"
}

export async function obtenerContextoUsuarioInternoDesdeSesion(sessionUser: {
  id?: string | null
  email?: string | null
  name?: string | null
}) {
  const base = resolverUsuarioBaseDesdeSesion(sessionUser)

  const rolInferido = inferirRolDesdeEmail(sessionUser.email)

  const usuarioBase = limpiarUsuario(base)

  const existente = await prisma.usuario.findFirst({
    where: { usuario: usuarioBase },
  })

  if (existente) {
    // Mantener rol sincronizado para cuentas demo por correo
    if (existente.rol !== rolInferido) {
      const actualizado = await prisma.usuario.update({
        where: { id: existente.id },
        data: { rol: rolInferido },
      })
      return {
        id: actualizado.id,
        usuario: actualizado.usuario,
        rol: actualizado.rol,
        nombreCompleto: actualizado.nombreCompleto,
      }
    }

    return {
      id: existente.id,
      usuario: existente.usuario,
      rol: existente.rol,
      nombreCompleto: existente.nombreCompleto,
    }
  }

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
          rol: rolInferido,
          estado: "ACTIVO",
        },
      })

      return {
        id: creado.id,
        usuario: creado.usuario,
        rol: creado.rol,
        nombreCompleto: creado.nombreCompleto,
      }
    } catch {
      intento += 1
    }
  }

  throw new Error("No se pudo crear o resolver usuario interno")
}
