import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { toJsonSafe } from "@/lib/json-safe"
import { descomponerTCEA, type Cuota as CuotaMF } from "@/lib/motor-financiero"

interface Cuota {
  numero: number
  tipoCuota: string
  fecVencimiento: Date | string
  saldoInicial: number | string
  interes: number | string
  amortizacion: number | string
  segDesgravamen: number | string
  segVehicular: number | string
  otrosGastos: number | string
  cuotaTotal: number | string
  saldoFinal: number | string
}

interface Cotizacion {
  id: bigint
  version: number
  estado: string
  monedaOp: string
  tea: number | string
  tem: number | string
  tcea: number | string
  precioVeh: number | string
  cuotaIniPct: number | string
  cuotaIniMnt: number | string
  montoFinanc: number | string
  plazoMeses: number
  fecDesembolso: Date | string
  fec1eraCuota: Date | string
  graciaFlag: boolean
  graciaTipo: string | null
  graciaMeses: number | null
  residualFlag: boolean
  residualMonto: number | string | null
  segDesgrav: number | string | null
  segVehicular: number | string | null
  gastoGps: number | string | null
  gastoNotarial: number | string | null
  vanDeudor: number | string
  tirMensual: number | string
  tirAnual: number | string
  totPagado: number | string
  costoCredito: number | string
  segDesgravTipo: string | null
  segDesgravCia: string | null
  segDesgravPoliza: string | null
  segVehicularTipo: string | null
  segVehicularCia: string | null
  segVehicularPoliza: string | null
  cliente: {
    nombres: string
    apPaterno: string
    apMaterno: string | null
    tipoDocumento: string
    numDocumento: string
    direccion: string
    celular: string
    correo: string
  }
  vehiculo: {
    marca: string
    modelo: string
    version: string | null
    anio: number
    precioLista: number | string
    monedaPrecio: string
    concesionario: string
  }
  cuotas: Cuota[]
}

interface Params {
  params: Promise<{ id: string }>
}

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params
    const cotizacionId = BigInt(id)

    const cotizacion = await prisma.cotizacion.findUnique({
      where: { id: cotizacionId },
      include: {
        cliente: true,
        vehiculo: true,
        cuotas: {
          orderBy: { numero: "asc" },
        },
      },
    })

    if (!cotizacion) {
      return NextResponse.json({ error: "Cotizaci\u00f3n no encontrada" }, { status: 404 })
    }

    const cot = toJsonSafe(cotizacion) as unknown as Cotizacion

    // Mapear cuotas de Prisma → formato motor-financiero
    const cuotasMF: CuotaMF[] = cot.cuotas.map((q: Cuota) => ({
      numero: Number(q.numero),
      tipoCuota: q.tipoCuota as CuotaMF['tipoCuota'],
      fechaVencimiento: new Date(q.fecVencimiento),
      saldoInicial: Number(q.saldoInicial),
      interes: Number(q.interes),
      amortizacion: Number(q.amortizacion),
      segDesgravamen: Number(q.segDesgravamen),
      segVehicular: Number(q.segVehicular),
      otrosGastos: Number(q.otrosGastos),
      cuotaTotal: Number(q.cuotaTotal),
      saldoFinal: Number(q.saldoFinal),
    }))

    // Calcular descomposición TCEA para transparencia
    const descomposicion = descomponerTCEA(
      Number(cot.montoFinanc),
      cuotasMF,
      Number(cot.tem) / 100
    )

    // Totales por concepto
    const totales = {
      intereses: cot.cuotas.reduce((a: number, q: Cuota) => a + Number(q.interes), 0),
      desgravamen: cot.cuotas.reduce((a: number, q: Cuota) => a + Number(q.segDesgravamen), 0),
      vehicular: cot.cuotas.reduce((a: number, q: Cuota) => a + Number(q.segVehicular), 0),
      gastos: cot.cuotas.reduce((a: number, q: Cuota) => a + Number(q.otrosGastos), 0),
      totalPagado: cot.cuotas.reduce((a: number, q: Cuota) => a + Number(q.cuotaTotal), 0),
    }

    // Formato moneda
    const fmt = (v: number) => Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    const hojaResumen = {
      // 1. DATOS DE LA ENTIDAD Y OPERACIÓN
      entidad: {
        nombre: "VehiFlow - Entidad Financiera Demo",
        ruc: "20123456789",
        direccion: "Av. Principal 123, Lima, Per\u00fa",
      },
      // 2. DATOS DEL CLIENTE
      cliente: {
        nombre: `${cot.cliente.nombres} ${cot.cliente.apPaterno} ${cot.cliente.apMaterno || ""}`.trim(),
        tipoDocumento: cot.cliente.tipoDocumento,
        numeroDocumento: cot.cliente.numDocumento,
        direccion: cot.cliente.direccion,
        telefono: cot.cliente.celular,
        correo: cot.cliente.correo,
      },
      // 3. DATOS DEL VEHÍCULO
      vehiculo: {
        marca: cot.vehiculo.marca,
        modelo: cot.vehiculo.modelo,
        version: cot.vehiculo.version || "-",
        anio: cot.vehiculo.anio,
        precioLista: fmt(Number(cot.vehiculo.precioLista)),
        moneda: cot.vehiculo.monedaPrecio,
        concesionario: cot.vehiculo.concesionario,
      },
      // 4. CONDICIONES DE LA OPERACIÓN
      condiciones: {
        moneda: cot.monedaOp,
        tea: `${Number(cot.tea).toFixed(4)}%`,
        tem: `${Number(cot.tem).toFixed(6)}%`,
        tcea: `${Number(cot.tcea).toFixed(4)}%`,
        precioVehiculo: fmt(Number(cot.precioVeh)),
        cuotaInicialPct: `${Number(cot.cuotaIniPct).toFixed(2)}%`,
        cuotaInicialMnt: fmt(Number(cot.cuotaIniMnt)),
        montoFinanciado: fmt(Number(cot.montoFinanc)),
        plazoMeses: cot.plazoMeses,
        fechaDesembolso: new Date(cot.fecDesembolso).toLocaleDateString("es-PE"),
        fechaPrimeraCuota: new Date(cot.fec1eraCuota).toLocaleDateString("es-PE"),
        gracia: cot.graciaFlag ? `${cot.graciaTipo} (${cot.graciaMeses} meses)` : "Sin gracia",
        residual: cot.residualFlag ? `S\u00ed - ${fmt(Number(cot.residualMonto || 0))}` : "No",
      },
      // 5. SEGUROS Y GASTOS
      segurosGastos: {
        desgravamen: {
          tipo: cot.segDesgravTipo || "ENTIDAD",
          tasaMensual: `${Number(cot.segDesgrav || 0).toFixed(4)}%`,
          compania: cot.segDesgravCia || "-",
          poliza: cot.segDesgravPoliza || "-",
          totalPagado: fmt(totales.desgravamen),
        },
        vehicular: {
          tipo: cot.segVehicularTipo || "ENTIDAD",
          primaAnual: fmt(Number(cot.segVehicular || 0)),
          compania: cot.segVehicularCia || "-",
          poliza: cot.segVehicularPoliza || "-",
          totalPagado: fmt(totales.vehicular),
        },
        gastos: {
          gps: fmt(Number(cot.gastoGps || 0)),
          notarial: fmt(Number(cot.gastoNotarial || 0)),
          totalPagado: fmt(totales.gastos),
        },
      },
      // 6. INDICADORES FINANCIEROS
      indicadores: {
        tea: `${Number(cot.tea).toFixed(4)}%`,
        tcea: `${Number(cot.tcea).toFixed(4)}%`,
        vanDeudor: fmt(Number(cot.vanDeudor)),
        tirMensual: `${Number(cot.tirMensual).toFixed(6)}%`,
        tirAnual: `${Number(cot.tirAnual).toFixed(4)}%`,
        costoTotalCredito: fmt(Number(cot.costoCredito)),
        totalPagado: fmt(Number(cot.totPagado)),
      },
      // 7. DESCOMPOSICIÓN TCEA (Transparencia SBS)
      descomposicionTCEA: {
        teaBase: `${descomposicion.teaBase.toFixed(4)}%`,
        efectoDesgravamen: `${descomposicion.efectoDesgravamen >= 0 ? "+" : ""}${descomposicion.efectoDesgravamen.toFixed(4)}%`,
        efectoVehicular: `${descomposicion.efectoVehicular >= 0 ? "+" : ""}${descomposicion.efectoVehicular.toFixed(4)}%`,
        efectoGastos: `${descomposicion.efectoGastos >= 0 ? "+" : ""}${descomposicion.efectoGastos.toFixed(4)}%`,
        tceaFinal: `${descomposicion.tceaFinal.toFixed(4)}%`,
      },
      // 8. CRONOGRAMA DE PAGOS (Desglose completo)
      cronograma: cot.cuotas.map((q: Cuota) => ({
        numero: q.numero,
        tipo: q.tipoCuota,
        fechaVencimiento: new Date(q.fecVencimiento).toLocaleDateString("es-PE"),
        saldoInicial: fmt(Number(q.saldoInicial)),
        interes: fmt(Number(q.interes)),
        amortizacion: fmt(Number(q.amortizacion)),
        desgravamen: fmt(Number(q.segDesgravamen)),
        vehicular: fmt(Number(q.segVehicular)),
        otrosGastos: fmt(Number(q.otrosGastos)),
        cuotaTotal: fmt(Number(q.cuotaTotal)),
        saldoFinal: fmt(Number(q.saldoFinal)),
      })),
      // 9. TOTALES DEL CRONOGRAMA
      totalesCronograma: {
        intereses: fmt(totales.intereses),
        desgravamen: fmt(totales.desgravamen),
        vehicular: fmt(totales.vehicular),
        gastos: fmt(totales.gastos),
        totalPagado: fmt(totales.totalPagado),
      },
      // 10. BENEFICIOS, RIESGOS Y CONDICIONES (Anexo 4 SBS)
      beneficiosRiesgos: {
        beneficios: [
          "Cuotas menores gracias al valor residual (Compra Inteligente)",
          "Opción al finalizar: renovar vehículo, conservarlo o devolverlo",
          "Seguro de desgravamen incluido (cubre saldo en caso de fallecimiento)",
          "Seguro vehicular todo riesgo incluido",
          "Sin penalidad por pago anticipado (Ley 29571 Art. 85°)",
        ],
        riesgos: [
          "Tasa de interés compensatoria variable según condiciones de mercado",
          "Interés moratorio por pagos fuera de fecha (máximo = tasa compensatoria BCRP)",
          "En caso de incumplimiento: cobranza judicial/extrajudicial, reporte a centrales de riesgo",
          "El valor residual es estimado; el vehículo real puede valer menos al final",
          "Si el cliente no ejerce opción de compra, debe devolver vehículo en buen estado",
        ],
        condiciones: [
          "El cliente puede contratar póliza de seguro externa que cumpla condiciones informadas (Res. SBS 8181-2012)",
          "El cronograma usa meses de 30 días y año comercial de 360 días (Res. SBS 8181-2012)",
          "La TCEA incluye todos los costos: interés, seguros, gastos",
          "Derecho a recibir cronograma actualizado tras pago anticipado (Ley 29571 Art. 86°)",
          "Canal de reclamos: Libro de Reclamaciones virtual y físico / SBS / INDECOPI",
        ],
      },
      // 11. FÓRMULAS (Res. SBS 8181-2012 - Difusión programas de cálculo)
      formulas: {
        tem: "TEM = (1 + TEA)^(30/360) - 1",
        cuotaFrances: "Cuota = Capital × TEM / [1 - (1 + TEM)^-n]",
        interesPeriodo: "Interés_k = Saldo_(k-1) × TEM",
        amortizacion: "Amortización_k = Cuota - Interés_k",
        tcea: "TCEA: tasa 'r' que iguala VPN(flujos totales) = Monto financiado (Newton-Raphson)",
        van: "VAN = Monto financiado - Σ[CuotaTotal_k / (1+TEM)^k]",
        tir: "TIR: tasa 'r' que hace VAN = 0 (Newton-Raphson)",
      },
      // Metadatos
      metadata: {
        fechaGeneracion: new Date().toLocaleString("es-PE"),
        versionCotizacion: cot.version,
        estado: cot.estado,
        idCotizacion: cot.id,
      },
    }

    return NextResponse.json({ hojaResumen })
  } catch (error) {
    console.error("Error GET /api/cotizaciones/[id]/hoja-resumen:", error)
    return NextResponse.json({ error: "Error generando hoja resumen" }, { status: 500 })
  }
}