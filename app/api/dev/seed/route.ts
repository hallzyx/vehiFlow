import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { ensureDemoUsers, seedSyntheticOperationsIfNeeded } from "@/lib/demo-seed"

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url)
    let force = url.searchParams.get("force") === "1" || url.searchParams.get("force") === "true"
    try {
      const body = await req.json()
      if (body?.force === true || body?.force === "1") force = true
    } catch {
      // body vacío o no JSON — ok
    }

    await ensureDemoUsers()
    await seedSyntheticOperationsIfNeeded({ force })

    const referenceIso = new Date().toISOString()
    return NextResponse.json({
      success: true,
      message: force
        ? `Data demo regenerada con fechas ancladas a hoy (${new Date().toLocaleDateString("es-PE")})`
        : `Data demo lista (referencia: ${new Date().toLocaleDateString("es-PE")})`,
      force,
      referenceDate: referenceIso,
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
