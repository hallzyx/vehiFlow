import { NextResponse } from "next/server"
import { ensureDemoUsers, seedSyntheticOperationsIfNeeded } from "@/lib/demo-seed"

export async function POST() {
  try {
    await ensureDemoUsers()
    await seedSyntheticOperationsIfNeeded()

    return NextResponse.json({
      success: true,
      message: "Seed sintético ejecutado correctamente",
    })
  } catch (error) {
    console.error("Error ejecutando seed sintético:", error)
    return NextResponse.json({ error: "No se pudo ejecutar seed" }, { status: 500 })
  }
}
