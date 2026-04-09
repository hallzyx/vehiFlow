import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const demoUsers = [
  { name: "Admin Demo", email: "admin@demo.pe", password: "12345678" },
  { name: "Asesor Demo", email: "asesor@demo.pe", password: "12345678" },
  { name: "Analista Demo", email: "analista@demo.pe", password: "12345678" },
  { name: "Auditor Demo", email: "auditor@demo.pe", password: "12345678" },
]

export async function POST() {
  try {
    for (const u of demoUsers) {
      try {
        await auth.api.signUpEmail({
          body: {
            name: u.name,
            email: u.email,
            password: u.password,
          },
        })
      } catch {
        // si ya existe, seguimos
      }
    }

    return NextResponse.json({
      success: true,
      users: demoUsers,
    })
  } catch (error) {
    console.error("Error setup demo auth:", error)
    return NextResponse.json({ error: "No se pudo crear auth demo" }, { status: 500 })
  }
}
