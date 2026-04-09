import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { normalizarCuotas, resolverContextoOperacion } from "@/lib/pago-anticipado"
import { toJsonSafe } from "@/lib/json-safe"

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
    const operacion = await prisma.operacion.findUnique({
      where: { id: BigInt(id) },
      include: {
        cotizacion: {
          include: {
            cliente: true,
            vehiculo: true,
            cuotas: {
              orderBy: { numero: "asc" },
            },
          },
        },
        pagos: {
          orderBy: { creadoEn: "desc" },
        },
      },
    })

    if (!operacion) {
      return NextResponse.json({ error: "Operación no encontrada" }, { status: 404 })
    }

    const cuotas = normalizarCuotas(operacion.cotizacion.cuotas as any[])
    const contexto = resolverContextoOperacion(cuotas, Number(operacion.saldoActual))

    return NextResponse.json(toJsonSafe({
      operacion: {
        id: operacion.id.toString(),
        estadoOp: operacion.estadoOp,
        saldoActual: Number(operacion.saldoActual),
        versionCrono: operacion.versionCrono,
        fecInicio: operacion.fecInicio,
        fecTermino: operacion.fecTermino,
        cotizacion: {
          id: operacion.cotizacion.id.toString(),
          version: operacion.cotizacion.version,
          monedaOp: operacion.cotizacion.monedaOp,
          tea: Number(operacion.cotizacion.tea),
          tem: Number(operacion.cotizacion.tem),
          tcea: Number(operacion.cotizacion.tcea),
          tirAnual: Number(operacion.cotizacion.tirAnual),
          residualFlag: operacion.cotizacion.residualFlag,
          residualMonto: Number(operacion.cotizacion.residualMonto || 0),
          segDesgrav: Number(operacion.cotizacion.segDesgrav || 0),
          segVehicular: Number(operacion.cotizacion.segVehicular || 0),
          plazoMeses: operacion.cotizacion.plazoMeses,
        },
        cliente: operacion.cotizacion.cliente,
        vehiculo: operacion.cotizacion.vehiculo,
        contexto: {
          cuotaExigible: contexto.cuotaExigible,
          cuotasRestantes: contexto.cuotasRestantes,
          interesesRestantes: contexto.interesesRestantes,
          fechaUltimaCuota: contexto.fechaUltimaCuota,
          cuotaReferencia: contexto.cuotaReferencia,
        },
        cuotas: cuotas,
        pagos: operacion.pagos.map((p) => ({
          id: p.id.toString(),
          fechaPago: p.fechaPago,
          montoTotal: Number(p.montoTotal),
          tipoPago: p.tipoPago,
          cuotaAplicada: Number(p.cuotaAplicada),
          interesDia: Number(p.interesDia),
          capitalAmort: Number(p.capitalAmort),
          saldoAnterior: Number(p.saldoAnterior),
          saldoNuevo: Number(p.saldoNuevo),
          modalidad: p.modalidad,
          penalidad: Number(p.penalidad),
          canalPago: p.canalPago,
          referencia: p.referencia,
          creadoEn: p.creadoEn,
        })),
      },
    }))
  } catch (error) {
    console.error("Error obteniendo operación:", error)
    return NextResponse.json({ error: "Error obteniendo operación" }, { status: 500 })
  }
}
