import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { generarTokenEnlaceCotizacion } from "@/lib/public-link"

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const { token, exp } = generarTokenEnlaceCotizacion(id)

    return NextResponse.json({
      token,
      exp,
      publicUrl: `/portal/cotizaciones/${id}?token=${encodeURIComponent(token)}`,
    })
  } catch {
    return NextResponse.json({ error: "No se pudo generar enlace público" }, { status: 500 })
  }
}
