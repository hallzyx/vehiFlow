/**
 * Motor Financiero - Compra Inteligente Perú
 * Sistema Francés Vencido Ordinario con soporte para:
 * - Tasa Efectiva Anual (TEA)
 * - Períodos de gracia (total y parcial)
 * - Valor residual (Compra Inteligente)
 * - Cálculo de TCEA, VAN, TIR
 */

const DIAS_MES = 30;
const DIAS_ANIO = 360;
const MAX_ITER = 1000;
const TOL = 0.0000001;

// ============================================
// TypeScript Types
// ============================================

export interface ParametrosCredito {
  tasaIngresada: number; // TEA en porcentaje (ej: 18.00)
  precioVehiculo: number;
  cuotaInicial: number;
  plazoMeses: number;
  fechaDesembolso: Date;
  fechaPrimeraCuota: Date;
  graciaFlag: boolean;
  graciaTipo?: 'TOTAL' | 'PARCIAL';
  graciaMeses?: number;
  residualFlag: boolean;
  residualMonto?: number;
  segDesgravamenPct?: number;
  segVehicularAnual?: number;
  gastoGps?: number;
  gastoNotarial?: number;
  
  // Campos para validar cargos NO permitidos (Ley 28587 Art. 7°, Res. SBS 8181-2012)
  // DEBEN SER 0 o undefined - el motor los rechaza si son > 0
  comisionDesembolso?: number;
  comisionEvaluacion?: number;
  comisionAdministracion?: number;
  gastoGarantiaVehicular?: number;
  penalidadAnticipado?: number;
}

export interface ResultadoFinanciero {
  tea: number;
  tem: number;
  montoFinanciado: number;
  cuotaBase: number;
  cronograma: Cuota[];
  tcea: number;
  vanDeudor: number;
  tirMensual: number;
  tirAnual: number;
  totalIntereses: number;
  totalSeguros: number;
  totalGastos: number;
  totalPagado: number;
  costoCredito: number;
  // Descomposición TCEA para transparencia SBS
  descomposicionTCEA?: DescomposicionTCEA;
}

export interface Cuota {
  numero: number;
  tipoCuota: 'GRACIA_TOTAL' | 'GRACIA_PARCIAL' | 'NORMAL' | 'RESIDUAL';
  fechaVencimiento: Date;
  saldoInicial: number;
  interes: number;
  amortizacion: number;
  segDesgravamen: number;
  segVehicular: number;
  otrosGastos: number;
  cuotaTotal: number;
  saldoFinal: number;
}

// ============================================
// VALIDACIÓN: Cargos Prohibidos (Ley 28587 Art. 7°, Res. SBS 8181-2012)
// ============================================

export interface ValidacionCargosResultado {
  valido: boolean;
  errores: string[];
  advertencias: string[];
}

export function validarCargosPermitidos(params: ParametrosCredito): ValidacionCargosResultado {
  const errores: string[] = [];
  const advertencias: string[] = [];

  // Cargos EXPRESAMENTE PROHIBIDOS por SBS (Ley 28587 Art. 7°, Res. 8181-2012 Anexo 3)
  if ((params.comisionDesembolso ?? 0) > 0) {
    errores.push('COMISIÓN POR DESEMBOLSO: Prohibida por Res. SBS 8181-2012 (cargo por servicio inherente al crédito)');
  }
  if ((params.comisionEvaluacion ?? 0) > 0) {
    errores.push('COMISIÓN POR EVALUACIÓN CREDITICIA: Prohibida por Res. SBS 8181-2012 (costo interno de la entidad)');
  }
  if ((params.comisionAdministracion ?? 0) > 0) {
    errores.push('COMISIÓN POR ADMINISTRACIÓN DEL CRÉDITO: Prohibida por Res. SBS 8181-2012 (servicio inherente)');
  }
  if ((params.gastoGarantiaVehicular ?? 0) > 0) {
    errores.push('GASTOS DE CONSTITUCIÓN/LEVANTAMIENTO DE GARANTÍA VEHICULAR: Prohibidos por Res. SBS 8181-2012');
  }
  if ((params.penalidadAnticipado ?? 0) > 0) {
    errores.push('PENALIDAD POR CANCELACIÓN ANTICIPADA: Prohibida por Ley 29571 Art. 85° y Res. SBS 8181-2012');
  }

  // Cargos PERMITIDOS pero que deben informarse claramente (Res. SBS 8181-2012)
  if ((params.segDesgravamenPct ?? 0) > 0) {
    advertencias.push('Seguro desgravamen: Informar monto prima, compañía, póliza y derecho a póliza externa (Res. SBS 8181-2012 Art. seguros)');
  }
  if ((params.segVehicularAnual ?? 0) > 0) {
    advertencias.push('Seguro vehicular: Informar monto prima, compañía, póliza y derecho a póliza externa (Res. SBS 8181-2012 Art. seguros)');
  }
  if ((params.gastoGps ?? 0) > 0) {
    advertencias.push('Gasto GPS: Debe ser servicio efectivamente prestado y aceptado por el cliente');
  }
  if ((params.gastoNotarial ?? 0) > 0) {
    advertencias.push('Gasto notarial: Debe ser servicio efectivamente prestado y aceptado por el cliente');
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  };
}

// ============================================
// ALGORITMO 1: Normalizar Tasa Efectiva Anual
// ============================================

export function normalizarTasa(
  teaPorcentaje: number
): number {
  if (teaPorcentaje <= 0) {
    throw new Error('La TEA debe ser mayor a cero');
  }
  return teaPorcentaje / 100;
}

// ============================================
// ALGORITMO 2: Calcular TEM (Tasa Efectiva Mensual)
// ============================================

export function calcularTEM(tea: number): number {
  const exponente = DIAS_MES / DIAS_ANIO; // 30/360 = 1/12
  return Math.pow(1 + tea, exponente) - 1;
}

// ============================================
// ALGORITMO 3: Calcular Capital Activo
// ============================================

export function calcularCapitalActivo(
  financiado: number,
  tem: number,
  plazo: number,
  residualFlag: boolean,
  residualMonto?: number
): number {
  if (!residualFlag || !residualMonto) {
    return financiado;
  }

  if (residualMonto <= 0) {
    throw new Error('Residual debe ser positivo');
  }

  if (residualMonto >= financiado) {
    throw new Error('Residual no puede superar el financiado');
  }

  const vpResidual = residualMonto / Math.pow(1 + tem, plazo);
  const capitalActivo = financiado - vpResidual;

  if (capitalActivo <= 0) {
    throw new Error('Capital activo no puede ser negativo');
  }

  return capitalActivo;
}

// ============================================
// ALGORITMO 4: Resolver Período de Gracia
// ============================================

export function resolverGracia(
  capitalActivo: number,
  tem: number,
  graciaTipo?: 'TOTAL' | 'PARCIAL',
  graciaMeses?: number
): { saldoAmortizacion: number; nAmortizacion: number; cuotaGracia: number } {
  if (!graciaMeses || graciaMeses === 0) {
    return {
      saldoAmortizacion: capitalActivo,
      nAmortizacion: 0, // Se calculará después
      cuotaGracia: 0
    };
  }

  if (graciaTipo === 'PARCIAL') {
    const cuotaParcial = capitalActivo * tem;
    return {
      saldoAmortizacion: capitalActivo,
      nAmortizacion: 0,
      cuotaGracia: cuotaParcial
    };
  }

  if (graciaTipo === 'TOTAL') {
    const saldoPost = capitalActivo * Math.pow(1 + tem, graciaMeses);
    return {
      saldoAmortizacion: saldoPost,
      nAmortizacion: 0,
      cuotaGracia: 0
    };
  }

  return {
    saldoAmortizacion: capitalActivo,
    nAmortizacion: 0,
    cuotaGracia: 0
  };
}

// ============================================
// ALGORITMO 5: Calcular Cuota Base (Sistema Francés)
// ============================================

export function calcularCuotaBase(saldo: number, tem: number, n: number): number {
  if (saldo <= 0 || tem <= 0 || n <= 0) {
    return 0;
  }

  const numerador = saldo * tem;
  const denominador = 1 - Math.pow(1 + tem, -n);

  if (Math.abs(denominador) < TOL) {
    throw new Error('Denominador cercano a cero');
  }

  return numerador / denominador;
}

// ============================================
// Helper: Redondeo financiero (HALF_UP)
// ============================================

function redondear(valor: number, decimales: number): number {
  const factor = Math.pow(10, decimales);
  return Math.round(valor * factor + Number.EPSILON) / factor;
}

// ============================================
// ALGORITMO 6: Generar Cronograma de Pagos
// ============================================

export function generarCronograma(
  capitalActivo: number,
  tem: number,
  cuotaBase: number,
  cuotaGracia: number,
  graciaFlag: boolean,
  graciaTipo: 'TOTAL' | 'PARCIAL' | undefined,
  graciaMeses: number,
  nAmortizacion: number,
  residualFlag: boolean,
  residualMonto: number,
  segDesgravPct: number,
  segVehicularAnual: number,
  gastoGps: number,
  gastoNotarial: number,
  fechaPrimeraCuota: Date
): Cuota[] {
  const cronograma: Cuota[] = [];
  let saldoActual = capitalActivo;
  const nTotal = graciaMeses + nAmortizacion;
  const segVehiMensual = segVehicularAnual / 12;

  for (let k = 1; k <= nTotal + (residualFlag ? 1 : 0); k++) {
    // Determinar tipo de cuota
    let tipoCuota: 'GRACIA_TOTAL' | 'GRACIA_PARCIAL' | 'NORMAL' | 'RESIDUAL';
    
    if (graciaFlag && k <= graciaMeses && graciaTipo === 'TOTAL') {
      tipoCuota = 'GRACIA_TOTAL';
    } else if (graciaFlag && k <= graciaMeses && graciaTipo === 'PARCIAL') {
      tipoCuota = 'GRACIA_PARCIAL';
    } else if (residualFlag && k === nTotal + 1) {
      tipoCuota = 'RESIDUAL';
    } else {
      tipoCuota = 'NORMAL';
    }

    // Calcular interés del período
    const interesK = redondear(saldoActual * tem, 2);

    // Calcular amortización según tipo
    let amortizacionK = 0;
    let saldoNuevo = 0;

    switch (tipoCuota) {
      case 'GRACIA_TOTAL':
        // El interés capitaliza al saldo
        saldoNuevo = saldoActual + interesK;
        break;
      case 'GRACIA_PARCIAL':
        // Solo se paga interés, saldo no varía
        saldoNuevo = saldoActual;
        break;
      case 'RESIDUAL':
        // Cuota balón: liquida todo el saldo
        amortizacionK = saldoActual;
        saldoNuevo = 0;
        break;
      case 'NORMAL':
        // Ajuste de última cuota para cerrar en cero
        if (k === nTotal) {
          amortizacionK = saldoActual;
        } else {
          amortizacionK = redondear(cuotaBase - interesK, 2);
        }
        saldoNuevo = redondear(saldoActual - amortizacionK, 2);
        if (saldoNuevo < 0) saldoNuevo = 0;
        break;
    }

    // Seguros y gastos
    const desgravK = redondear(saldoActual * (segDesgravPct / 100), 2);
    const vehiculK = redondear(segVehiMensual, 2);
    const gastosK = k === 1 ? (gastoGps + gastoNotarial) : 0;

    // Cuota total
    let cuotaTotalK = 0;
    switch (tipoCuota) {
      case 'RESIDUAL':
        cuotaTotalK = interesK + (residualMonto || 0) + desgravK + vehiculK;
        break;
      case 'GRACIA_TOTAL':
        cuotaTotalK = 0;
        break;
      default:
        cuotaTotalK = interesK + amortizacionK + desgravK + vehiculK + gastosK;
    }

    // Fecha de vencimiento
    const fechaVenc = new Date(fechaPrimeraCuota);
    fechaVenc.setDate(fechaVenc.getDate() + (k - 1) * DIAS_MES);

    cronograma.push({
      numero: k,
      tipoCuota,
      fechaVencimiento: fechaVenc,
      saldoInicial: saldoActual,
      interes: interesK,
      amortizacion: amortizacionK,
      segDesgravamen: desgravK,
      segVehicular: vehiculK,
      otrosGastos: gastosK,
      cuotaTotal: redondear(cuotaTotalK, 2),
      saldoFinal: saldoNuevo
    });

    saldoActual = saldoNuevo;
  }

  // Verificación de integridad
  if (saldoActual > 0.01) {
    throw new Error('Cronograma no cierra en cero');
  }

  return cronograma;
}

// ============================================
// ALGORITMO 7: Calcular TCEA (Newton-Raphson)
// ============================================

export function calcularTCEA(
  montoFinanciado: number,
  cronograma: Cuota[],
  semillaMensual: number
): number {
  let r = semillaMensual; // Semilla inicial = TEM de la operación

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let f = 0;
    let fPrima = 0;

    for (let k = 0; k < cronograma.length; k++) {
      const cf = cronograma[k].cuotaTotal;
      const factor = Math.pow(1 + r, k + 1);
      f += cf / factor;
      fPrima -= (k + 1) * cf / Math.pow(1 + r, k + 2);
    }

    f = montoFinanciado - f;
    fPrima = -fPrima;

    if (Math.abs(fPrima) < TOL) {
      throw new Error('Derivada cercana a cero');
    }

    const rNuevo = r - f / fPrima;

    if (Math.abs(rNuevo - r) < TOL) {
      r = rNuevo;
      break;
    }

    r = rNuevo;
  }

  // Convertir a TCEA anual (base 360 días)
  const tceaDecimal = Math.pow(1 + r, DIAS_ANIO / DIAS_MES) - 1;
  return redondear(tceaDecimal * 100, 4);
}

// ============================================
// ALGORITMO 7B: Descomponer TCEA por componentes
// ============================================
// Calcula la TCEA progresivamente para mostrar qué aporta cada componente
// Útil para transparencia SBS (Anexo 3 - Hoja Resumen)

export interface DescomposicionTCEA {
  teaBase: number;           // TEA sin seguros ni gastos
  efectoDesgravamen: number; // Incremento por seguro desgravamen
  efectoVehicular: number;   // Incremento por seguro vehicular
  efectoGastos: number;      // Incremento por GPS + Notarial
  tceaFinal: number;         // TCEA total (debe coincidir con calcularTCEA)
}

export function descomponerTCEA(
  montoFinanciado: number,
  cronograma: Cuota[],
  tem: number
): DescomposicionTCEA {
  // Función auxiliar para calcular TCEA dado un array de flujos
  const calcularTCEAFlujos = (flujos: number[]): number => {
    let r = tem;
    for (let iter = 0; iter < MAX_ITER; iter++) {
      let f = 0;
      let fPrima = 0;
      for (let k = 0; k < flujos.length; k++) {
        const cf = flujos[k];
        const factor = Math.pow(1 + r, k + 1);
        f += cf / factor;
        fPrima -= (k + 1) * cf / Math.pow(1 + r, k + 2);
      }
      f = montoFinanciado - f;
      fPrima = -fPrima;
      if (Math.abs(fPrima) < TOL) break;
      const rNuevo = r - f / fPrima;
      if (Math.abs(rNuevo - r) < TOL) { r = rNuevo; break; }
      r = rNuevo;
    }
    return redondear((Math.pow(1 + r, DIAS_ANIO / DIAS_MES) - 1) * 100, 4);
  };

  // 1. TEA Base: solo cuota base (interés + amortización) SIN seguros ni gastos
  const flujosBase = cronograma.map(q => q.interes + q.amortizacion);
  const teaBase = calcularTCEAFlujos(flujosBase);

  // 2. + Desgravamen
  const flujosConDesgrav = cronograma.map(q => q.interes + q.amortizacion + q.segDesgravamen);
  const tceaConDesgrav = calcularTCEAFlujos(flujosConDesgrav);
  const efectoDesgravamen = redondear(tceaConDesgrav - teaBase, 4);

  // 3. + Vehicular
  const flujosConVehicular = cronograma.map(q => q.interes + q.amortizacion + q.segDesgravamen + q.segVehicular);
  const tceaConVehicular = calcularTCEAFlujos(flujosConVehicular);
  const efectoVehicular = redondear(tceaConVehicular - tceaConDesgrav, 4);

  // 4. + Gastos (GPS + Notarial en primera cuota)
  const flujosConGastos = cronograma.map(q => q.cuotaTotal); // ya incluye todo
  const tceaFinal = calcularTCEAFlujos(flujosConGastos);
  const efectoGastos = redondear(tceaFinal - tceaConVehicular, 4);

  return {
    teaBase,
    efectoDesgravamen,
    efectoVehicular,
    efectoGastos,
    tceaFinal,
  };
}

// ============================================
// ALGORITMO 8: Calcular VAN del Deudor
// ============================================

export function calcularVAN(montoFinanciado: number, cronograma: Cuota[], tem: number): number {
  let sumaVP = 0;

  for (let k = 0; k < cronograma.length; k++) {
    const cf = cronograma[k].cuotaTotal;
    const factor = Math.pow(1 + tem, k + 1);
    sumaVP += cf / factor;
  }

  const van = montoFinanciado - sumaVP;
  return redondear(van, 2);
}

// ============================================
// ALGORITMO 9: Calcular TIR del Deudor
// ============================================

export function calcularTIR(
  montoFinanciado: number,
  cronograma: Cuota[],
  semillaMensual: number
): number {
  let r = semillaMensual;

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let f = -montoFinanciado;
    let fPrima = 0;

    for (let k = 0; k < cronograma.length; k++) {
      const cf = cronograma[k].cuotaTotal;
      const factor = Math.pow(1 + r, k + 1);
      f += cf / factor;
      fPrima -= (k + 1) * cf / Math.pow(1 + r, k + 2);
    }

    if (Math.abs(fPrima) < TOL) {
      throw new Error('Derivada cercana a cero');
    }

    const rNuevo = r - f / fPrima;

    if (rNuevo < -0.9999) {
      throw new Error('TIR inválida');
    }

    if (Math.abs(rNuevo - r) < TOL) {
      return rNuevo;
    }

    r = rNuevo;
  }

  throw new Error('TIR no convergió');
}

// ============================================
// ALGORITMO 10: Calcular Totales
// ============================================

export function calcularTotales(cronograma: Cuota[], montoFinanciado: number) {
  let totalIntereses = 0;
  let totalDesgrav = 0;
  let totalVehicular = 0;
  let totalGastos = 0;
  let totalPagado = 0;

  for (const cuota of cronograma) {
    totalIntereses += cuota.interes;
    totalDesgrav += cuota.segDesgravamen;
    totalVehicular += cuota.segVehicular;
    totalGastos += cuota.otrosGastos;
    totalPagado += cuota.cuotaTotal;
  }

  const totalSeguros = totalDesgrav + totalVehicular;
  const costoCredito = totalPagado - montoFinanciado;

  return {
    totalIntereses: redondear(totalIntereses, 2),
    totalSeguros: redondear(totalSeguros, 2),
    totalGastos: redondear(totalGastos, 2),
    totalPagado: redondear(totalPagado, 2),
    costoCredito: redondear(costoCredito, 2)
  };
}

// ============================================
// CONTROLADOR PRINCIPAL: Calcular Crédito
// ============================================

export function calcularCredito(params: ParametrosCredito): ResultadoFinanciero {
  // Paso 0: Validar cargos permitidos (SBS)
  const validacionCargos = validarCargosPermitidos(params);
  if (validacionCargos.errores.length > 0) {
    throw new Error(validacionCargos.errores.join('; '));
  }
  if (validacionCargos.advertencias.length > 0) {
    console.warn('[Motor Financiero] Validación cargos SBS:', validacionCargos.advertencias);
  }

  // Paso 1: Normalizar TEA
  const tea = normalizarTasa(params.tasaIngresada);
  const tem = calcularTEM(tea);

  // Paso 2: Calcular capital financiado
  const montoFinanciado = params.precioVehiculo - params.cuotaInicial;
  if (montoFinanciado <= 0) {
    throw new Error('El monto financiado debe ser mayor a cero');
  }

  // Paso 3: Calcular capital activo (con residual)
  const capitalActivo = calcularCapitalActivo(
    montoFinanciado,
    tem,
    params.plazoMeses,
    params.residualFlag,
    params.residualMonto
  );

  // Paso 4: Resolver gracia
  const { saldoAmortizacion, cuotaGracia } = resolverGracia(
    capitalActivo,
    tem,
    params.graciaTipo,
    params.graciaMeses
  );

  const nAmortizacion = params.plazoMeses;

  // Paso 5: Calcular cuota base
  const cuotaBase = params.graciaFlag && params.graciaMeses && params.graciaMeses > 0
    ? calcularCuotaBase(saldoAmortizacion, tem, nAmortizacion)
    : calcularCuotaBase(capitalActivo, tem, nAmortizacion);

  // Paso 6: Generar cronograma
  const cronograma = generarCronograma(
    params.graciaFlag && params.graciaTipo === 'TOTAL' ? saldoAmortizacion : capitalActivo,
    tem,
    cuotaBase,
    params.graciaFlag && params.graciaTipo === 'PARCIAL' ? cuotaGracia : 0,
    params.graciaFlag,
    params.graciaTipo,
    params.graciaMeses || 0,
    nAmortizacion,
    params.residualFlag,
    params.residualMonto || 0,
    params.segDesgravamenPct || 0,
    params.segVehicularAnual || 0,
    params.gastoGps || 0,
    params.gastoNotarial || 0,
    params.fechaPrimeraCuota
  );

  // Paso 7: Calcular indicadores
  const tcea = calcularTCEA(montoFinanciado, cronograma, tem);
  const vanDeudor = calcularVAN(montoFinanciado, cronograma, tem);
  const tirMensual = calcularTIR(montoFinanciado, cronograma, tem);
  const tirAnual = Math.pow(1 + tirMensual, 12) - 1;

  // Paso 7B: Descomponer TCEA (transparencia SBS)
  const descomposicionTCEA = descomponerTCEA(
    montoFinanciado,
    cronograma,
    tem
  );

  // Paso 8: Calcular totales
  const totales = calcularTotales(cronograma, montoFinanciado);

  return {
    tea: redondear(tea * 100, 6),
    tem: redondear(tem * 100, 8),
    montoFinanciado,
    cuotaBase: redondear(cuotaBase, 2),
    cronograma,
    tcea,
    vanDeudor,
    tirMensual: redondear(tirMensual * 100, 6),
    tirAnual: redondear(tirAnual * 100, 4),
    totalIntereses: totales.totalIntereses,
    totalSeguros: totales.totalSeguros,
    totalGastos: totales.totalGastos,
    totalPagado: totales.totalPagado,
    costoCredito: totales.costoCredito,
    descomposicionTCEA,
  };
}
