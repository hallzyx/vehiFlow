import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2021") {
        return NextResponse.json(
          {
            error: "No se pudo ejecutar seed",
            detail:
              "Falta aplicar el esquema de base de datos (tabla no encontrada). Ejecuta prisma db push en el servidor.",
          },
          { status: 500 }
        )
      }

      if (error.code === "P1001") {
        return NextResponse.json(
          {
            error: "No se pudo ejecutar seed",
            detail: "No hay conexión con la base de datos. Verifica DATABASE_URL y conectividad.",
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "No se pudo ejecutar seed",
        detail: "Revisa logs del servidor para más detalle.",
      },
      { status: 500 }
    )
  }
}
