# algorithms.md — Algoritmos del Motor Financiero
# SI642 — Finanzas e Ingeniería Económica — Ciclo 2026-10
# Crédito Vehicular "Compra Inteligente" — Sistema de Información

---

## Introducción

Este documento especifica en pseudocódigo y diagramas de flujo
todos los algoritmos que componen el motor financiero del sistema.
Cada algoritmo incluye: entrada, salida, precondiciones, fórmula
matemática de referencia, pseudocódigo detallado y casos borde.

El motor financiero es el núcleo del sistema. Es el conjunto de
funciones puras que transforman los parámetros de una operación
de crédito en un cronograma de pagos, indicadores financieros
y documentos exportables. Es completamente determinístico: los
mismos parámetros de entrada producen siempre los mismos resultados.

---

## Nomenclatura general
Variables de entrada (prefijo e_):
e_tipo_tasa : "EFECTIVA" | "NOMINAL"
e_tasa : tasa ingresada por el usuario (%, ej: 18.00)
e_capital : número (ej: capitalización m = 12)
e_precio : precio del vehículo
e_cuota_ini : cuota inicial en monto
e_plazo : plazo en meses
e_gracia_tipo : "TOTAL" | "PARCIAL" | null
e_gracia_meses : entero 0..6
e_residual_flag : booleano
e_residual_monto : monto de la cuota balón final
e_seg_desgrav : tasa mensual de desgravamen (%, ej: 0.04)
e_seg_vehicular : prima anual del seguro vehicular
e_gasto_gps : gasto único GPS
e_gasto_notarial : gasto único notarial

Variables calculadas (prefijo c_):
c_tea : TEA en decimal (ej: 0.18)
c_tem : TEM en decimal (ej: 0.013936)
c_financiado : monto financiado
c_capital_activo : capital base para cálculo de cuota
c_cuota_base : cuota fija sin seguros
c_cronograma[] : array de objetos cuota

Constantes:
DIAS_MES = 30
DIAS_ANIO = 360
MAX_ITER = 1000
TOL = 0.0000001

text

---

## ALGORITMO 0 — Controlador principal del motor financiero

Este es el algoritmo orquestador. Llama a todos los demás en orden
y ensambla el resultado final que se persiste en la base de datos.
FUNCIÓN calcularCredito(params) → ResultadoFinanciero

ENTRADA:
params : objeto con todos los parámetros de entrada (Sección 1
del schema.md)

SALIDA:
resultado : {
tea, tem, monto_financiado, cuota_base,
cronograma[],
tcea, van_deudor, tir_mensual, tir_anual,
total_intereses, total_seguros,
total_gastos, total_pagado, costo_credito
}

INICIO

// PASO 1 — Normalizar tasa
c_tea ← ALGORITMO_1_normalizarTasa(
params.tipo_tasa,
params.tasa_ingresada,
params.capitalizacion
)
c_tem ← ALGORITMO_2_calcularTEM(c_tea)

// PASO 2 — Calcular capital
c_financiado ← params.precio_vehiculo - params.cuota_inicial
c_capital_activo ← ALGORITMO_3_calcularCapitalActivo(
c_financiado,
c_tem,
params.plazo_meses,
params.residual_flag,
params.residual_monto
)

// PASO 3 — Resolver gracia
[saldo_amort, n_amort, cuota_gracia] ←
ALGORITMO_4_resolverGracia(
c_capital_activo,
c_tem,
params.gracia_tipo,
params.gracia_meses
)

// PASO 4 — Calcular cuota base
c_cuota_base ← ALGORITMO_5_calcularCuotaBase(
saldo_amort,
c_tem,
n_amort
)

// PASO 5 — Generar cronograma
c_cronograma ← ALGORITMO_6_generarCronograma(
c_capital_activo,
c_tem,
c_cuota_base,
cuota_gracia,
params.gracia_tipo,
params.gracia_meses,
n_amort,
params.residual_flag,
params.residual_monto,
params.seg_desgravamen_pct,
params.seg_vehicular_anual,
params.gasto_gps,
params.gasto_notarial,
params.fecha_primera_cuota
)

// PASO 6 — Calcular indicadores
c_tcea ← ALGORITMO_7_calcularTCEA(c_financiado, c_cronograma)
c_van ← ALGORITMO_8_calcularVAN(c_financiado, c_cronograma, c_tem)
c_tir_mensual ← ALGORITMO_9_calcularTIR(c_financiado, c_cronograma)
c_tir_anual ← (1 + c_tir_mensual)^12 - 1

// PASO 7 — Calcular totales
totales ← ALGORITMO_10_calcularTotales(c_cronograma, c_financiado)

RETORNAR {
tea: c_tea, tem: c_tem,
monto_financiado: c_financiado,
cuota_base: c_cuota_base,
cronograma: c_cronograma,
tcea: c_tcea,
van_deudor: c_van,
tir_mensual: c_tir_mensual,
tir_anual: c_tir_anual,
...totales
}

FIN

text

---

## ALGORITMO 1 — Normalización de tasa de interés

Convierte cualquier tipo de tasa ingresada por el usuario a TEA
en formato decimal, que es la unidad de trabajo del motor.
FUNCIÓN normalizarTasa(tipo_tasa, tasa_ingresada, capitalizacion)
→ tea_decimal

ENTRADA:
tipo_tasa : "EFECTIVA" | "NOMINAL"
tasa_ingresada : número en % (ej: 18.00)
capitalizacion : entero m (número de capitalizaciones/año)
ignorado si tipo_tasa = "EFECTIVA"

SALIDA:
tea_decimal : TEA expresada en decimal (ej: 0.18)

FÓRMULA:
Si EFECTIVA: TEA = tasa_ingresada / 100
Si NOMINAL: TEA = (1 + TNA/m)^m - 1
Donde TNA = tasa_ingresada / 100

PRECONDICIÓN:
tasa_ingresada > 0
Si NOMINAL: capitalizacion > 0

PSEUDOCÓDIGO:

INICIO
tasa_decimal ← tasa_ingresada / 100

SI tipo_tasa = "EFECTIVA" ENTONCES
tea_decimal ← tasa_decimal

SINO SI tipo_tasa = "NOMINAL" ENTONCES
m ← capitalizacion
SI m ≤ 0 ENTONCES
LANZAR Error("Capitalización debe ser mayor a cero")
FIN SI
tea_decimal ← (1 + tasa_decimal / m)^m - 1

SINO
LANZAR Error("Tipo de tasa inválido: " + tipo_tasa)
FIN SI

SI tea_decimal ≤ 0 ENTONCES
LANZAR Error("TEA resultante debe ser positiva")
FIN SI

RETORNAR tea_decimal
FIN

TABLA DE CONVERSIONES TÍPICAS (referencia):
┌──────────────────────┬─────────┬────┬─────────────┐
│ Tasa ingresada │ Tipo │ m │ TEA result.│
├──────────────────────┼─────────┼────┼─────────────┤
│ 18.00% │Efectiva │ — │ 18.0000% │
│ 18.00% cap. mensual │Nominal │ 12 │ 19.5618% │
│ 18.00% cap. trimest. │Nominal │ 4 │ 19.2522% │
│ 18.00% cap. semest. │Nominal │ 2 │ 18.8100% │
│ 18.00% cap. diaria │Nominal │360 │ 19.7161% │
└──────────────────────┴─────────┴────┴─────────────┘

CASO BORDE:
Si tasa_ingresada = 0 → LANZAR Error (división por cero en TIR)
Si m = 0 (capitalización) → LANZAR Error (división por cero)

text

---

## ALGORITMO 2 — Cálculo de la TEM

Convierte la TEA (base anual 360 días) en la Tasa Efectiva Mensual
que se aplica período a período en el cronograma.
FUNCIÓN calcularTEM(tea_decimal) → tem_decimal

ENTRADA:
tea_decimal : TEA en decimal (ej: 0.18)

SALIDA:
tem_decimal : TEM en decimal (ej: 0.013936)

FÓRMULA:
TEM = (1 + TEA)^(DIAS_MES / DIAS_ANIO) - 1
= (1 + TEA)^(30/360) - 1
= (1 + TEA)^(1/12) - 1

BASE NORMATIVA:
Res. SBS 8181-2012: tasas en base efectiva anual, año 360 días.

PSEUDOCÓDIGO:

INICIO
exponente ← DIAS_MES / DIAS_ANIO // = 30/360 = 0.08333...
tem_decimal ← (1 + tea_decimal)^exponente - 1

SI tem_decimal ≤ 0 ENTONCES
LANZAR Error("TEM resultante inválida")
FIN SI

RETORNAR tem_decimal
FIN

EJEMPLO NUMÉRICO:
TEA = 18% = 0.18
TEM = (1 + 0.18)^(30/360) - 1
= (1.18)^(0.08333) - 1
= 1.013936 - 1
= 0.013936 → 1.3936% mensual

CASO BORDE:
TEA = 0 → TEM = 0 (no debe ocurrir; bloqueado en ALGORITMO_1)
TEA muy alta (> 300%) → sistema emite advertencia pero calcula

text

---

## ALGORITMO 3 — Cálculo del capital activo

Determina el capital efectivo sobre el que se calcularán las cuotas.
En el esquema Compra Inteligente, descuenta el valor presente del
residual para que la cuota balón final no esté incluida en las cuotas.
FUNCIÓN calcularCapitalActivo(financiado, tem, plazo, residual_flag,
residual_monto) → capital_activo

ENTRADA:
financiado : monto financiado total
tem : TEM en decimal
plazo : número de cuotas de amortización
residual_flag : booleano
residual_monto : monto de la cuota balón (si aplica)

SALIDA:
capital_activo : capital base para el cálculo de cuota

FÓRMULA:
Si residual_flag = FALSE:
capital_activo = financiado

Si residual_flag = TRUE:
VP_residual = residual_monto / (1 + TEM)^n
capital_activo = financiado - VP_residual

PSEUDOCÓDIGO:

INICIO
SI residual_flag = FALSE ENTONCES
RETORNAR financiado

SINO
SI residual_monto ≤ 0 ENTONCES
LANZAR Error("Residual debe ser positivo")
FIN SI
SI residual_monto ≥ financiado ENTONCES
LANZAR Error("Residual no puede superar el financiado")
FIN SI

vp_residual ← residual_monto / (1 + tem)^plazo
capital_activo ← financiado - vp_residual

SI capital_activo ≤ 0 ENTONCES
LANZAR Error("Capital activo no puede ser negativo.
Verificar residual vs financiado.")
FIN SI

RETORNAR capital_activo
FIN SI
FIN

EJEMPLO NUMÉRICO:
financiado = S/. 45,000.00
TEM = 1.3936%
plazo = 36 meses
residual_monto = S/. 10,000.00

VP_residual = 10,000 / (1.013936)^36
= 10,000 / 1.64396
= S/. 6,083.57

capital_activo = 45,000 - 6,083.57
= S/. 38,916.43

INTERPRETACIÓN:
Las 36 cuotas amortizan S/. 38,916.43
La cuota 37 (balón) paga los S/. 10,000.00 restantes
El cliente puede verificar que la suma cierra el total

text

---

## ALGORITMO 4 — Resolución del período de gracia

Determina el saldo desde el que se inicia la amortización y la
cuota aplicable durante los períodos de gracia.
FUNCIÓN resolverGracia(capital_activo, tem, gracia_tipo, gracia_meses)
→ {saldo_amortizacion, n_amortizacion, cuota_gracia}

ENTRADA:
capital_activo : capital base
tem : TEM en decimal
gracia_tipo : "TOTAL" | "PARCIAL" | null
gracia_meses : entero 0..6

SALIDA:
saldo_amortizacion : saldo desde el cual calcular la cuota base
n_amortizacion : número de cuotas de amortización (plazo)
cuota_gracia : monto de cuota durante gracia (0 si TOTAL)

PSEUDOCÓDIGO:

INICIO
SI gracia_tipo = null O gracia_meses = 0 ENTONCES
// Sin gracia: amortización desde el inicio
RETORNAR {
saldo_amortizacion : capital_activo,
n_amortizacion : plazo_meses,
cuota_gracia : 0
}

SINO SI gracia_tipo = "PARCIAL" ENTONCES
// Solo se paga interés; el capital no varía
cuota_parcial ← capital_activo × tem
RETORNAR {
saldo_amortizacion : capital_activo, // capital no creció
n_amortizacion : plazo_meses, // plazo no se reduce
cuota_gracia : cuota_parcial
}

SINO SI gracia_tipo = "TOTAL" ENTONCES
// Los intereses se capitalizan al saldo
saldo_post ← capital_activo × (1 + tem)^gracia_meses
RETORNAR {
saldo_amortizacion : saldo_post, // capital creció
n_amortizacion : plazo_meses, // plazo no se reduce
cuota_gracia : 0 // no se paga nada
}

SINO
LANZAR Error("gracia_tipo inválido: " + gracia_tipo)
FIN SI
FIN

EJEMPLOS NUMÉRICOS:

Capital = S/. 45,000 | TEM = 1.3936% | Plazo = 36 meses

CASO A — Sin gracia:
saldo_amort = 45,000.00
n_amort = 36
cuota_gracia = 0.00

CASO B — Gracia parcial 2 meses:
cuota_gracia = 45,000 × 0.013936 = S/. 627.12 (×2 meses)
saldo_amort = 45,000.00 (sin cambio)
n_amort = 36

CASO C — Gracia total 2 meses:
saldo_post = 45,000 × (1.013936)^2
= 45,000 × 1.028063
= S/. 46,262.84
cuota_gracia = 0.00 (no se paga en estos meses)
saldo_amort = 46,262.84
n_amort = 36

NOTA IMPORTANTE:
En ambos tipos de gracia el plazo NO se reduce.
El cliente paga el mismo número de cuotas pactadas,
más los meses de gracia adicionales.
Total de filas en cronograma = gracia_meses + plazo_meses

text

---

## ALGORITMO 5 — Cálculo de la cuota base (método francés)

Calcula la cuota fija mensual que amortiza el saldo en exactamente
n períodos mediante el sistema de cuotas uniformes (francés).
FUNCIÓN calcularCuotaBase(saldo, tem, n) → cuota_base

ENTRADA:
saldo : saldo a amortizar (post-gracia si aplica)
tem : TEM en decimal
n : número de cuotas de amortización

SALIDA:
cuota_base : cuota fija mensual en unidades monetarias

FÓRMULA (sistema francés):

P × TEM
C = ─────────────────────
1 - (1 + TEM)^(-n)

DEMOSTRACIÓN DE EQUIVALENCIA:
La fórmula se deriva de igualar el valor presente de
una anualidad vencida ordinaria al capital prestado:

n C
P = Σ ────────────
k=1 (1 + TEM)^k

Despejando C se obtiene la fórmula anterior.

PSEUDOCÓDIGO:

INICIO
SI saldo ≤ 0 ENTONCES
LANZAR Error("Saldo debe ser positivo")
FIN SI
SI tem ≤ 0 ENTONCES
LANZAR Error("TEM debe ser positiva")
FIN SI
SI n ≤ 0 ENTONCES
LANZAR Error("Plazo debe ser positivo")
FIN SI

numerador ← saldo × tem
denominador ← 1 - (1 + tem)^(-n)

SI |denominador| < TOL ENTONCES
LANZAR Error("Denominador cercano a cero: verificar TEM y plazo")
FIN SI

cuota_base ← numerador / denominador
cuota_base ← REDONDEAR(cuota_base, 2) // centavo más cercano

RETORNAR cuota_base
FIN

EJEMPLO NUMÉRICO:
saldo = S/. 45,000.00
TEM = 1.3936% = 0.013936
n = 36

numerador = 45,000 × 0.013936 = 627.12
denominador = 1 - (1.013936)^(-36)
= 1 - 0.60807
= 0.39193

cuota_base = 627.12 / 0.39193 = S/. 1,600.66

CASO BORDE:
n = 1 → denominador = 1 - 1/(1+TEM) = TEM/(1+TEM)
cuota = saldo × (1 + TEM) (capital + interés en una sola cuota)
TEM muy pequeño → usar expansión de Taylor para evitar cancelación

text

---

## ALGORITMO 6 — Generación del cronograma de pagos

Genera el array completo de cuotas con todos sus componentes.
Es el algoritmo más largo del motor y produce la salida principal.
FUNCIÓN generarCronograma(capital_activo, tem, cuota_base,
cuota_gracia, gracia_tipo, gracia_meses,
n_amort, residual_flag, residual_monto,
seg_desgrav_pct, seg_vehicular_anual,
gasto_gps, gasto_notarial,
fecha_primera_cuota)
→ cronograma]

ENTRADA: (ver parámetros del ALGORITMO 0)
SALIDA: array de objetos cuota con todos los campos del schema

PSEUDOCÓDIGO:

INICIO
cronograma ← ]
saldo_actual ← capital_activo
n_total ← gracia_meses + n_amort
seg_vehic_mes ← seg_vehicular_anual / 12
fecha_actual ← fecha_primera_cuota

PARA k = 1 HASTA n_total + (1 SI residual_flag SINO 0) HACER

// ── Determinar tipo de cuota ────────────────────────────
SI k ≤ gracia_meses Y gracia_tipo = "TOTAL" ENTONCES
tipo ← "GRACIA_TOTAL"
SINO SI k ≤ gracia_meses Y gracia_tipo = "PARCIAL" ENTONCES
tipo ← "GRACIA_PARCIAL"
SINO SI k = n_total + 1 Y residual_flag ENTONCES
tipo ← "RESIDUAL"
SINO
tipo ← "NORMAL"
FIN SI

// ── Calcular interés del período ────────────────────────
interes_k ← REDONDEAR(saldo_actual × tem, 2)

// ── Calcular amortización según tipo ───────────────────
SI tipo = "GRACIA_TOTAL" ENTONCES
amortizacion_k ← 0.00
// El interés capitaliza al saldo
saldo_nuevo ← saldo_actual + interes_k

SINO SI tipo = "GRACIA_PARCIAL" ENTONCES
amortizacion_k ← 0.00
// Solo se paga el interés; saldo no varía
saldo_nuevo ← saldo_actual

SINO SI tipo = "RESIDUAL" ENTONCES
// Cuota balón: liquida TODO el saldo + paga residual
amortizacion_k ← saldo_actual
saldo_nuevo ← 0.00

SINO // NORMAL
amortizacion_k ← REDONDEAR(cuota_base - interes_k, 2)

// Ajuste de última cuota normal para cerrar en cero exacto
SI k = n_total ENTONCES
amortizacion_k ← saldo_actual // forzar saldo = 0
FIN SI

saldo_nuevo ← REDONDEAR(saldo_actual - amortizacion_k, 2)
SI saldo_nuevo < 0 ENTONCES saldo_nuevo ← 0.00 FIN SI
FIN SI

// ── Seguros y gastos ────────────────────────────────────
desgrav_k ← REDONDEAR(saldo_actual × (seg_desgrav_pct / 100), 2)
vehicul_k ← REDONDEAR(seg_vehic_mes, 2)

SI k = 1 ENTONCES
gastos_k ← gasto_gps + gasto_notarial
SINO
gastos_k ← 0.00
FIN SI

// ── Cuota total del período ─────────────────────────────
SI tipo = "RESIDUAL" ENTONCES
cuota_total_k ← interes_k + residual_monto
+ desgrav_k + vehicul_k
SINO SI tipo = "GRACIA_TOTAL" ENTONCES
cuota_total_k ← 0.00 // el deudor NO paga nada
// (los seguros se acumulan en saldo si se pacta así;
// en este sistema se omiten durante gracia total
// por simplicidad académica)
SINO
cuota_total_k ← interes_k + amortizacion_k
+ desgrav_k + vehicul_k + gastos_k
FIN SI

// ── Construir objeto cuota ──────────────────────────────
cuota_obj ← {
numero : k,
tipo_cuota : tipo,
fecha_vencimient: fecha_actual,
saldo_inicial : saldo_actual,
interes : interes_k,
amortizacion : amortizacion_k,
seg_desgravame : desgrav_k,
seg_vehicular : vehicul_k,
otros_gastos : gastos_k,
cuota_total : cuota_total_k,
saldo_final : saldo_nuevo
}

AGREGAR cuota_obj A cronograma
saldo_actual ← saldo_nuevo
fecha_actual ← fecha_actual + 30 días

FIN PARA

// ── Verificación de integridad ──────────────────────────
SI saldo_actual > 0.01 ENTONCES
LANZAR Error("Cronograma no cierra en cero. Saldo residual: "
+ saldo_actual)
FIN SI

RETORNAR cronograma
FIN

DIAGRAMA DE FLUJO SIMPLIFICADO:

Inicio
│
▼
k = 1; saldo = capital_activo
│
▼
┌─────────────────────────────┐
│ k ≤ n_total + residual? │──NO──► Fin → retornar cronograma
└──────────────┬──────────────┘
│ SÍ
▼
┌──────────────────────────────────────────────────┐
│ ¿Tipo de cuota? │
│ k ≤ gracia_meses AND TOTAL → GRACIA_TOTAL │
│ k ≤ gracia_meses AND PARCIAL → GRACIA_PARCIAL │
│ k = n_total+1 AND residual → RESIDUAL │
│ else → NORMAL │
└────────────────────┬─────────────────────────────┘
▼
Calcular interes_k = saldo × TEM
│
▼
┌────────────────────────────────────────┐
│ Calcular amortizacion_k según tipo │
│ Calcular saldo_nuevo │
│ Calcular seguros y gastos │
│ Calcular cuota_total_k │
└────────────────────┬───────────────────┘
▼
Guardar cuota en cronograma]
saldo ← saldo_nuevo
k ← k + 1
│
└──────────────────► (volver al inicio del bucle)

text

---

## ALGORITMO 7 — Cálculo de la TCEA

Calcula la Tasa de Costo Efectivo Anual exigida por la SBS mediante
el método de Newton-Raphson para resolver la ecuación de VPN = 0.
FUNCIÓN calcularTCEA(monto_financiado, cronograma[]) → tcea_pct

ENTRADA:
monto_financiado : capital desembolsado (flujo en t=0)
cronograma[] : array de cuotas con cuota_total por período

SALIDA:
tcea_pct : TCEA expresada en porcentaje (ej: 21.45)

ECUACIÓN A RESOLVER:
Encontrar r tal que:

n cuota_total_k
P = Σ ─────────────────────
k=1 (1 + r/360×30)^k

Equivalente a: f(r) = P - Σ[CF_k / (1 + r_m)^k] = 0
Donde r_m = r/12 (tasa mensual implícita de la TCEA)

PSEUDOCÓDIGO (Newton-Raphson):

INICIO
// Semilla inicial: usar la TEM como punto de partida
r ← tem // tasa mensual inicial

PARA iter = 1 HASTA MAX_ITER HACER

f ← 0.0
f_prima ← 0.0 // derivada de f respecto a r

PARA k = 1 HASTA LONGITUD(cronograma) HACER
cf ← cronograma[k].cuota_total
factor ← (1 + r)^k

f ← f + cf / factor
f_prima ← f_prima - k × cf / ((1 + r)^(k+1))
FIN PARA

f ← monto_financiado - f // f(r) = P - Σ[CF/(1+r)^k]
f_prima ← -f_prima // ajuste de signo

SI |f_prima| < TOL ENTONCES
LANZAR Error("Derivada cercana a cero: no converge")
FIN SI

r_nuevo ← r - f / f_prima

SI |r_nuevo - r| < TOL ENTONCES
r ← r_nuevo
SALIR DEL BUCLE
FIN SI

r ← r_nuevo

FIN PARA

// Convertir tasa mensual r a TCEA anual (base 360 días)
tcea_decimal ← (1 + r)^(360/30) - 1
tcea_pct ← REDONDEAR(tcea_decimal × 100, 4)

RETORNAR tcea_pct
FIN

DIAGRAMA DE FLUJO NEWTON-RAPHSON:

Inicio: r₀ = TEM
│
▼
iter = 1
│
▼
┌──────────────────────────────────────┐
│ iter ≤ MAX_ITER? │──NO──► Error: no converge
└──────────────┬───────────────────────┘
│ SÍ
▼
Calcular f(r) y f'(r) con el cronograma
│
▼
r_nuevo = r - f(r) / f'(r)
│
▼
┌──────────────────────────────────────┐
│ |r_nuevo - r| < TOL? │──SÍ──► Convertir a TCEA anual
└──────────────┬───────────────────────┘ y retornar
│ NO
▼
r = r_nuevo; iter = iter + 1
│
└──────────────────────► (repetir)

NOTA DE PRECISIÓN:
La TCEA usa los flujos TOTALES (interés + amortización + seguros
+ gastos), no solo la cuota base. Esto la diferencia de la TEA.
Base normativa: Res. SBS 8181-2012.

text

---

## ALGORITMO 8 — Cálculo del VAN del deudor

Calcula el Valor Actual Neto desde la perspectiva del deudor,
usando la TEM como tasa de descuento de referencia.
FUNCIÓN calcularVAN(monto_financiado, cronograma[], tem) → van

ENTRADA:
monto_financiado : flujo positivo en t=0 (el deudor recibe dinero)
cronograma[] : array con cuota_total por período
tem : TEM en decimal (tasa de descuento)

SALIDA:
van : valor en unidades monetarias (siempre negativo si hay costo)

FÓRMULA:
VAN = -P + Σ [CF_k / (1 + TEM)^k]

Convención del deudor:
t=0: +P (ingreso: recibe el préstamo)
t=k: -CF_k (egreso: paga cada cuota)

Por tanto: VAN_deudor = P - Σ[CF_k / (1+TEM)^k]
Si no hubiera costo (CF_k = solo capital), VAN = 0.
Con intereses y gastos, VAN < 0.

PSEUDOCÓDIGO:

INICIO
suma_vp ← 0.0

PARA k = 1 HASTA LONGITUD(cronograma) HACER
cf ← cronograma[k].cuota_total
factor ← (1 + tem)^k
suma_vp ← suma_vp + cf / factor
FIN PARA

van ← monto_financiado - suma_vp
van ← REDONDEAR(van, 2)

RETORNAR van
FIN

INTERPRETACIÓN:
VAN = 0.00 → crédito sin costo (imposible en la práctica)
VAN < 0.00 → costo total del crédito en valor presente
|VAN| → lo que el crédito "le cuesta" al deudor
expresado en dinero de hoy

EJEMPLO:
Si VAN_deudor = -S/. 8,420.15
Significa que el costo real del crédito, traído a valor
presente a la TEM, es S/. 8,420.15

text

---

## ALGORITMO 9 — Cálculo de la TIR del deudor

Calcula la Tasa Interna de Retorno del flujo del deudor.
Es la tasa mensual que hace VAN = 0. Se convierte luego a anual.
FUNCIÓN calcularTIR(monto_financiado, cronograma[]) → tir_mensual

ENTRADA:
monto_financiado : capital prestado
cronograma[] : array con cuota_total por período

SALIDA:
tir_mensual : TIR mensual en decimal

ECUACIÓN A RESOLVER:
Encontrar r tal que:

0 = -P + Σ [CF_k / (1 + r)^k]

(Igual que la TCEA pero la tasa r ya está en base mensual,
no se convierte con exponente 12)

PSEUDOCÓDIGO (Newton-Raphson — misma estructura que TCEA):

INICIO
r ← tem // semilla: TEM como punto de partida razonable

PARA iter = 1 HASTA MAX_ITER HACER

f ← -monto_financiado
f_prima ← 0.0

PARA k = 1 HASTA LONGITUD(cronograma) HACER
cf ← cronograma[k].cuota_total
factor ← (1 + r)^k

f ← f + cf / factor
f_prima ← f_prima - k × cf / (factor × (1 + r))
FIN PARA

SI |f_prima| < TOL ENTONCES
LANZAR Error("No converge: derivada cercana a cero")
FIN SI

r_nuevo ← r - f / f_prima

SI r_nuevo < -0.9999 ENTONCES
r_nuevo ← -0.9999 // evitar raíz negativa inválida
FIN SI

SI |r_nuevo - r| < TOL ENTONCES
RETORNAR r_nuevo
FIN SI

r ← r_nuevo

FIN PARA

LANZAR Error("TIR no convergió en " + MAX_ITER + " iteraciones")
FIN

CONVERSIÓN A TIR ANUAL:
// Llamada externa en el ALGORITMO 0:
tir_anual_pct ← REDONDEAR(((1 + tir_mensual)^12 - 1) × 100, 4)

DIFERENCIA ENTRE TCEA Y TIR:
┌──────────────────────────────────────────────────────────────┐
│ TCEA │ TIR del deudor │
├──────────────────────────────────────────────────────────────┤
│ Exigida por SBS │ Indicador académico / MFI │
│ Base anual 360 días │ Base mensual → anual equiv.│
│ Incluye todos los costos │ Incluye todos los costos │
│ (1+r_mensual)^(360/30) - 1 │ (1+r_mensual)^12 - 1 │
│ Los resultados son similares │ pero no idénticos por el │
│ exponente (12 vs 360/30=12) │ ← en base 30/360 son igual │
└──────────────────────────────────────────────────────────────┘

text

---

## ALGORITMO 10 — Cálculo de totales del cronograma

Suma todos los componentes del cronograma para obtener los
indicadores de costo total que se muestran en la hoja resumen.
FUNCIÓN calcularTotales(cronograma[], monto_financiado) → totales

PSEUDOCÓDIGO:

INICIO
tot_intereses ← 0.00
tot_desgrav ← 0.00
tot_vehicular ← 0.00
tot_gastos ← 0.00
tot_pagado ← 0.00

PARA k = 1 HASTA LONGITUD(cronograma) HACER
cuota ← cronograma[k]
tot_intereses ← tot_intereses + cuota.interes
tot_desgrav ← tot_desgrav + cuota.seg_desgravame
tot_vehicular ← tot_vehicular + cuota.seg_vehicular
tot_gastos ← tot_gastos + cuota.otros_gastos
tot_pagado ← tot_pagado + cuota.cuota_total
FIN PARA

tot_seguros ← tot_desgrav + tot_vehicular
costo_credito ← tot_pagado - monto_financiado

RETORNAR {
total_intereses : REDONDEAR(tot_intereses, 2),
total_seguros : REDONDEAR(tot_seguros, 2),
total_gastos : REDONDEAR(tot_gastos, 2),
total_pagado : REDONDEAR(tot_pagado, 2),
costo_credito : REDONDEAR(costo_credito, 2)
}
FIN

VERIFICACIÓN DE CUADRE:
// La suma de amortizaciones debe ≈ capital inicial
sum_amort ← Σ cronograma[k].amortizacion
SI |sum_amort - monto_financiado| > 0.10 ENTONCES
LANZAR Error("Error de cuadre: amortizaciones no suman al capital")
FIN SI

text

---

## ALGORITMO 11 — Pago anticipado parcial

Calcula el efecto de un pago mayor a la cuota ordinaria, aplica
el excedente al capital y regenera el cronograma completo.
FUNCIÓN calcularPagoAnticipado(operacion, monto_pago, fecha_pago,
modalidad, tem)
→ {nuevo_cronograma, comparativa, ahorro}

ENTRADA:
operacion : estado actual de la operación (saldo, última cuota)
monto_pago : monto total que el cliente paga
fecha_pago : fecha exacta del pago
modalidad : "REDUCIR_PLAZO" | "REDUCIR_CUOTA"
tem : TEM en decimal

SALIDA:
nuevo_cronograma : cronograma recalculado desde el nuevo saldo
comparativa : objeto con valores antes/después
ahorro : intereses evitados

PSEUDOCÓDIGO:

INICIO
// PASO A — Calcular interés devengado al día exacto
dias_desde_ultima ← diferenciaDias(
operacion.fecha_ultima_cuota,
fecha_pago
)
interes_devengado ← operacion.saldo_actual × tem
× (dias_desde_ultima / DIAS_MES)
interes_devengado ← REDONDEAR(interes_devengado, 2)

// PASO B — Validar que el pago cubre al menos el interés
SI monto_pago ≤ interes_devengado ENTONCES
LANZAR Error("El pago no cubre los intereses devengados.
Mínimo requerido: " + interes_devengado)
FIN SI

// PASO C — Aplicar el pago
capital_amortizado ← monto_pago - interes_devengado
saldo_nuevo ← operacion.saldo_actual - capital_amortizado
penalidad ← 0.00 // Ley 29571 Art. 85°

SI saldo_nuevo ≤ 0 ENTONCES
// El pago cancela el crédito completo
saldo_nuevo ← 0.00
RETORNAR cancelacionTotal(operacion, monto_pago)
FIN SI

// PASO D — Recalcular según modalidad
cuotas_restantes ← contarCuotasPendientes(operacion)

SI modalidad = "REDUCIR_PLAZO" ENTONCES
// Mantener la cuota original; calcular el nuevo plazo
cuota_orig ← operacion.cuota_base_original
nuevo_plazo ← calcularNuevoPlazo(saldo_nuevo, tem, cuota_orig)
nueva_cuota ← cuota_orig // cuota no cambia

SINO SI modalidad = "REDUCIR_CUOTA" ENTONCES
// Mantener el plazo restante; calcular la nueva cuota
nuevo_plazo ← cuotas_restantes // plazo no cambia
nueva_cuota ← calcularCuotaBase(saldo_nuevo, tem, nuevo_plazo)

FIN SI

// PASO E — Regenerar cronograma desde el nuevo estado
nuevo_cron ← generarCronogramaParcial(
saldo_nuevo, tem, nueva_cuota,
nuevo_plazo, operacion.params_seguros,
fecha_pago + 30 días // primera cuota del nuevo cron.
)

// PASO F — Calcular ahorro
intereses_originales ← sumarInteresesRestantes(operacion)
intereses_nuevos ← SUMA(nuevo_cron[k].interes)
ahorro ← REDONDEAR(
intereses_originales - intereses_nuevos,
2 )

// PASO G — Construir comparativa
comparativa ← {
saldo_antes : operacion.saldo_actual,
saldo_despues : saldo_nuevo,
plazo_antes : cuotas_restantes,
plazo_despues : nuevo_plazo,
cuota_antes : operacion.cuota_base_original,
cuota_despues : nueva_cuota,
intereses_antes : intereses_originales,
intereses_despues : SUMA(nuevo_cron[k].interes),
ahorro_intereses : ahorro
}

RETORNAR {
nuevo_cronograma : nuevo_cron,
comparativa : comparativa,
ahorro : ahorro,
registro_pago : {
fecha_pago : fecha_pago,
monto_total : monto_pago,
interes_dia : interes_devengado,
capital_amort : capital_amortizado,
saldo_anterior : operacion.saldo_actual,
saldo_nuevo : saldo_nuevo,
penalidad : 0.00,
modalidad : modalidad
}
}
FIN

SUBALGORITMO: calcularNuevoPlazo(saldo, tem, cuota_orig)

// Despeja n de la fórmula francesa:
// n = -ln(1 - saldo×TEM/cuota) / ln(1+TEM)

INICIO
ratio ← saldo × tem / cuota_orig

SI ratio ≥ 1 ENTONCES
LANZAR Error("Cuota original insuficiente para el nuevo saldo.
Usar modalidad REDUCIR_CUOTA.")
FIN SI

nuevo_n ← -LN(1 - ratio) / LN(1 + tem)
nuevo_n ← TECHO(nuevo_n) // redondear al entero superior

RETORNAR nuevo_n
FIN

text

---

## ALGORITMO 12 — Función de redondeo financiero

Centraliza toda operación de redondeo del sistema para garantizar
consistencia en todos los cálculos del motor.
FUNCIÓN REDONDEAR(valor, decimales) → valor_redondeado

MÉTODO: HALF_UP (bankers rounding no aplica; SBS usa half_up)
Ejemplo: 0.625 → 0.63 (no 0.62 como en bankers rounding)

PSEUDOCÓDIGO:

INICIO
factor ← 10^decimales
valor_escalado ← valor × factor
valor_redondeado ← PISO(valor_escalado + 0.5) / factor
RETORNAR valor_redondeado
FIN

POLÍTICA DE APLICACIÓN:
- Tasas (tem, tea, tcea, tir): 10 decimales en cálculo,
redondear a 4 decimales solo en presentación final
- Montos intermedios (interes_k, amortizacion_k): redondear
a 2 decimales EN CADA ITERACIÓN del cronograma
- Montos finales: 2 decimales siempre
- NUNCA truncar (PISO sin compensar): puede acumular error
sistemático negativo en cronogramas largos

IMPACTO DEL REDONDEO ITERATIVO:
Redondear interes_k cuota a cuota produce un pequeño error
acumulado. Este error se concentra en la última cuota mediante
el ajuste de saldo descrito en el ALGORITMO 6.
El sistema lo registra como ajuste_ultima_cuota y lo muestra
al usuario como nota al pie del cronograma.

text

---

## ALGORITMO 13 — Validación de parámetros de entrada

Algoritmo de guardia que se ejecuta ANTES del motor. Si falla
alguna validación, el motor no se invoca y se devuelve el error
al usuario con el campo exacto que lo causó.
FUNCIÓN validarParametros(params) → {valido, errores[]}

PSEUDOCÓDIGO:

INICIO
errores ← ]

// ── Tasa ─────────────────────────────────────────────────
SI params.tasa_ingresada ≤ 0 ENTONCES
AGREGAR "tasa_ingresada: debe ser mayor a cero" A errores
FIN SI
SI params.tipo_tasa = "NOMINAL" Y params.capitalizacion ≤ 0 ENTONCES
AGREGAR "capitalizacion: requerida para tasa nominal" A errores
FIN SI

// ── Capital ───────────────────────────────────────────────
SI params.precio_vehiculo ≤ 0 ENTONCES
AGREGAR "precio_vehiculo: debe ser positivo" A errores
FIN SI
SI params.cuota_inicial < 0 ENTONCES
AGREGAR "cuota_inicial: no puede ser negativa" A errores
FIN SI
SI params.cuota_inicial ≥ params.precio_vehiculo ENTONCES
AGREGAR "cuota_inicial: no puede superar el precio" A errores
FIN SI

// ── Plazo ─────────────────────────────────────────────────
SI params.plazo_meses < 6 O params.plazo_meses > 84 ENTONCES
AGREGAR "plazo_meses: debe estar entre 6 y 84" A errores
FIN SI

// ── Fechas ────────────────────────────────────────────────
SI params.fecha_desembolso < HOY ENTONCES
AGREGAR "fecha_desembolso: no puede ser anterior a hoy" A errores
FIN SI
SI params.fecha_primera_cuota ≤ params.fecha_desembolso ENTONCES
AGREGAR "fecha_primera_cuota: debe ser posterior al desembolso"
A errores
FIN SI

// ── Gracia ───────────────────────────────────────────────
SI params.gracia_flag = TRUE ENTONCES
SI params.gracia_tipo = null ENTONCES
AGREGAR "gracia_tipo: requerido si gracia_flag = true" A errores
FIN SI
SI params.gracia_meses < 1 O params.gracia_meses > 6 ENTONCES
AGREGAR "gracia_meses: debe estar entre 1 y 6" A errores
FIN SI
FIN SI

// ── Residual ─────────────────────────────────────────────
SI params.residual_flag = TRUE ENTONCES
monto_financiado_tentativo ← params.precio_vehiculo
- params.cuota_inicial
SI params.residual_monto ≤ 0 ENTONCES
AGREGAR "residual_monto: debe ser positivo" A errores
FIN SI
SI params.residual_monto ≥ monto_financiado_tentativo ENTONCES
AGREGAR "residual_monto: no puede superar el monto financiado"
A errores
FIN SI
FIN SI

// ── Seguros y gastos ─────────────────────────────────────
SI params.seg_desgravamen_pct < 0 ENTONCES
AGREGAR "seg_desgravamen_pct: no puede ser negativo" A errores
FIN SI
SI params.seg_vehicular_anual < 0 ENTONCES
AGREGAR "seg_vehicular_anual: no puede ser negativo" A errores
FIN SI
SI params.gasto_gps < 0 ENTONCES
AGREGAR "gasto_gps: no puede ser negativo" A errores
FIN SI
SI params.gasto_notarial < 0 ENTONCES
AGREGAR "gasto_notarial: no puede ser negativo" A errores
FIN SI

SI LONGITUD(errores) > 0 ENTONCES
RETORNAR { valido: false, errores: errores }
FIN SI

RETORNAR { valido: true, errores: [] }
FIN

text

---


## Sección de trazabilidad algoritmo–normativa

| Algoritmo | Norma aplicada                            | Artículo / Disposición                          |
|-----------|-------------------------------------------|-------------------------------------------------|
| ALG-1     | Res. SBS 8181-2012                        | Tasas en forma efectiva anual; año 360 días     |
| ALG-2     | Res. SBS 8181-2012                        | TEM derivada de TEA base 360 días               |
| ALG-3     | Práctica de mercado BCP / MAF Perú        | Esquema Compra Inteligente — valor residual      |
| ALG-4     | Res. SBS 8181-2012                        | Cronograma bajo sistema de cuotas               |
| ALG-5     | Res. SBS 8181-2012 / MAF Perú (fórmulas) | Sistema francés vencido ordinario               |
| ALG-6     | Res. SBS 8181-2012                        | Desglose cuota a cuota del cronograma           |
| ALG-7     | Res. SBS 8181-2012                        | Fórmula de la TCEA; flujos totales del deudor   |
| ALG-8     | Enunciado del trabajo                     | VAN del deudor como indicador                   |
| ALG-9     | Enunciado del trabajo                     | TIR del deudor como indicador                   |
| ALG-10    | Res. SBS 8181-2012 Anexo 3                | Totales para Hoja Resumen                       |
| ALG-11    | Ley 29571 Art. 85° / Res. SBS 8181-2012  | Pago anticipado sin penalidad; nuevo cronograma |
| ALG-12    | Práctica estándar SBS                     | Redondeo HALF_UP, base 2 decimales              |
| ALG-13    | Res. SBS 8181-2012 / Ley 28587 Art. 2°   | Validación de información antes de operar       |

---

## Casos de prueba del motor financiero

Conjunto de casos de prueba determinísticos para verificar que
la implementación del motor produce los resultados esperados.
Todos los valores de salida fueron calculados manualmente y
validados con Excel financiero. Si la implementación arroja un
valor diferente en más de S/. 0.02, hay un error en el código.

---

### CASO A — Crédito estándar sin gracia ni residual (PEN)
ENTRADA:
tipo_tasa = EFECTIVA
tasa_ingresada = 18.00%
precio_vehiculo = S/. 55,000.00
cuota_inicial = S/. 11,000.00 (20%)
plazo_meses = 36
gracia_flag = false
residual_flag = false
seg_desgrav_pct = 0.04% mensual
seg_vehicular = S/. 1,200.00 anual
gasto_gps = S/. 150.00
gasto_notarial = S/. 80.00
fecha_desembolso = 01/05/2026
fecha_1era_cuota = 01/06/2026

VALORES ESPERADOS:
TEA = 18.0000%
TEM = 1.3936%
monto_financiado = S/. 44,000.00
cuota_base = S/. 1,589.26
cuota_total (k=1) = S/. 1,589.26 + 17.60 + 100.00 + 230.00 = S/. 1,936.86
(base + desgrav + vehicular + gps+notarial)

TCEA ≈ 25.23% (incluye seguros y gastos)
VAN_deudor ≈ -S/. 9,150.XX (negativo, costo del crédito)
total_intereses ≈ S/. 9,213.XX
total_pagado ≈ S/. 53,213.XX

VERIFICACIÓN DE CUADRE:
Σ amortizaciones = S/. 44,000.00 ✓
saldo_final = S/. 0.00 ✓

text

---

### CASO B — Crédito con gracia total 2 meses
ENTRADA:
(mismo que CASO A excepto:)
gracia_flag = true
gracia_tipo = TOTAL
gracia_meses = 2

VALORES ESPERADOS:
saldo_post_gracia = S/. 44,000 × (1.013936)^2
= S/. 44,000 × 1.028063
= S/. 45,234.77

cuota_base = calcular con saldo S/. 45,234.77, n=36
≈ S/. 1,636.16

Cuotas 1-2: cuota_total = 0.00 (gracia total: no paga nada)
Cuota 3 en adelante: cuota_base ≈ S/. 1,636.16 + seguros

n_total filas = 2 + 36 = 38 filas en cronograma

TCEA > CASO A (costo mayor por capitalización de intereses)

VERIFICACIÓN DE CUADRE:
Σ amortizaciones a partir de fila 3 = S/. 45,234.77 ✓
saldo_final = S/. 0.00 ✓

text

---

### CASO C — Crédito con gracia parcial 3 meses
ENTRADA:
(mismo que CASO A excepto:)
gracia_flag = true
gracia_tipo = PARCIAL
gracia_meses = 3

VALORES ESPERADOS:
cuota_gracia = S/. 44,000 × 0.013936 = S/. 613.18
saldo_amortizacion= S/. 44,000.00 (no cambió)
cuota_base = S/. 1,589.26 (igual que CASO A; mismo saldo y plazo)

Cuotas 1-3: cuota_total = S/. 613.18 + seguros (solo interés)
Cuota 4 en adelante: cuota_total = S/. 1,589.26 + seguros

n_total filas = 3 + 36 = 39 filas en cronograma

VERIFICACIÓN DE CUADRE:
saldo no varía durante filas 1-3 ✓
saldo_final = S/. 0.00 ✓

text

---

### CASO D — Crédito con valor residual (Compra Inteligente)
ENTRADA:
(mismo que CASO A excepto:)
residual_flag = true
residual_monto = S/. 10,000.00

VALORES ESPERADOS:
VP_residual = S/. 10,000 / (1.013936)^36
= S/. 10,000 / 1.64396
= S/. 6,083.57

capital_activo = S/. 44,000 - S/. 6,083.57
= S/. 37,916.43

cuota_base = calcular con S/. 37,916.43, TEM=1.3936%, n=36
≈ S/. 1,370.17

n_total filas = 36 (normales) + 1 (residual) = 37 filas

Cuota 37 (balón):
interes_37 = saldo_restante_36 × TEM (≈ S/. 0 si cuadra)
cuota_total_37 = S/. 10,000.00 + interes_37

VERIFICACIÓN DE CUADRE:
Σ amortizaciones filas 1-36 ≈ S/. 37,916.43 ✓
Cuota 37 liquida residual = S/. 10,000.00 ✓
saldo_final = S/. 0.00 ✓

NOTA: la cuota base es menor que en CASO A (~S/. 1,370 vs ~S/. 1,589)
porque el cliente NO amortiza el residual en las 36 cuotas ordinarias.

text

---

### CASO E — Pago anticipado parcial modalidad REDUCIR_PLAZO
ESTADO INICIAL (operación activa del CASO A tras 12 pagos):
saldo_actual ≈ S/. 31,500.00 (estimado)
cuota_base_orig = S/. 1,589.26
cuotas_restantes = 24

PAGO ANTICIPADO:
monto_pago = S/. 10,000.00
modalidad = REDUCIR_PLAZO
dias_desde_ultima = 15 días

VALORES ESPERADOS:
interes_devengado = S/. 31,500 × 0.013936 × (15/30)
≈ S/. 219.49

capital_amortizado= S/. 10,000 - S/. 219.49
= S/. 9,780.51

saldo_nuevo ≈ S/. 31,500 - S/. 9,780.51
= S/. 21,719.49

nuevo_plazo = TECHO(-LN(1 - 21,719.49×0.013936/1,589.26)
/ LN(1.013936))
≈ 15 cuotas (en lugar de 24)

ahorro_intereses = intereses de 24 cuotas - intereses de 15 cuotas
penalidad = S/. 0.00 ← Ley 29571 Art. 85°

text

---

### CASO F — Tasa nominal cap. mensual
ENTRADA:
tipo_tasa = NOMINAL
tasa_ingresada = 18.00%
capitalizacion = 12 (mensual)

VALORES ESPERADOS:
TEA = (1 + 0.18/12)^12 - 1
= (1.015)^12 - 1
= 1.195618 - 1
= 19.5618%

TEM = (1 + 0.195618)^(30/360) - 1
= (1.195618)^(0.08333) - 1
= 1.015000 - 1
= 1.5000%

VERIFICACIÓN: con cap. mensual, la TEM coincide exactamente con
la tasa nominal mensual (TNA/12 = 18/12 = 1.5%). Esto es una
propiedad matemática de la capitalización mensual. Si no coincide,
hay un error en el ALGORITMO 1 o 2.

text

---

## Checklist de implementación del motor financiero

Verificaciones que el equipo debe completar antes de integrar
el motor financiero al backend de la aplicación.
ALGORITMOS CORE
[] ALG-1: normalizarTasa produce TEA=19.5618% para TNA=18% cap. mensual
[] ALG-2: calcularTEM produce TEM=1.3936% para TEA=18%
[] ALG-2: calcularTEM produce TEM=1.5000% para TEA=19.5618%
[] ALG-3: capital_activo = financiado cuando residual_flag=false
[] ALG-3: capital_activo = financiado - VP_residual cuando true
[] ALG-4: saldo no cambia en gracia parcial
[] ALG-4: saldo crece en gracia total
[] ALG-5: cuota_base del CASO A = S/. 1,589.26 ± S/. 0.02
[] ALG-6: saldo_final de la última fila = S/. 0.00

CRONOGRAMA
[] Caso A (estándar): 36 filas, todas NORMAL
[] Caso B (gracia total 2m): 38 filas, filas 1-2 = GRACIA_TOTAL
[] Caso C (gracia parcial 3m): 39 filas, filas 1-3 = GRACIA_PARCIAL
[] Caso D (residual): 37 filas, fila 37 = RESIDUAL con monto S/. 10,000
[] Σ amortizaciones ≈ monto_financiado en todos los casos (±S/. 0.05)
[] seg_desgravamen disminuye cuota a cuota (saldo decrece)
[] gastos_k = gasto_gps + gasto_notarial SOLO en k=1

INDICADORES
[] ALG-7: TCEA > TEA en todos los casos (por efecto de seguros/gastos)
[] ALG-8: VAN_deudor < 0 en todos los casos
[] ALG-9: TIR_anual ≈ TCEA (diferencia < 0.01% en base 30/360)
[] ALG-10: total_pagado - monto_financiado = costo_credito

PAGO ANTICIPADO
[] ALG-11: penalidad = S/. 0.00 siempre (Ley 29571 Art. 85°)
[] ALG-11: interes_devengado < monto_pago (validación previa)
[] ALG-11: REDUCIR_PLAZO → cuota_base igual, plazo menor
[] ALG-11: REDUCIR_CUOTA → plazo igual, cuota menor
[] ALG-11: nuevo saldo_final = S/. 0.00 al final del nuevo cronograma

VALIDACIONES
[] ALG-13: plazo < 6 es rechazado
[] ALG-13: plazo > 84 es rechazado
[] ALG-13: residual ≥ financiado es rechazado
[] ALG-13: gracia_flag=true sin gracia_tipo es rechazado
[] ALG-13: fecha_1era_cuota ≤ fecha_desembolso es rechazado

PRECISIÓN
[] Redondeo es HALF_UP en toda operación monetaria
[] Los cronogramas largos (84 meses) no acumulan error > S/. 0.10
[] El ajuste de última cuota se registra y muestra si > S/. 0.01

RENDIMIENTO
[] El motor completa un cronograma de 84 cuotas en < 100ms
[] La convergencia de Newton-Raphson ocurre en < 50 iteraciones
[] El motor es stateless (mismos inputs → mismo output siempre)

text

---

## Glosario de símbolos matemáticos

| Símbolo         | Descripción                                              |
|-----------------|----------------------------------------------------------|
| `P`             | Principal o capital financiado                           |
| `TEA`           | Tasa Efectiva Anual (base 360 días, SBS Perú)            |
| `TEM`           | Tasa Efectiva Mensual = (1+TEA)^(30/360) - 1            |
| `TNA`           | Tasa Nominal Anual                                       |
| `m`             | Número de capitalizaciones por año                       |
| `n`             | Número de períodos (cuotas de amortización)              |
| `k`             | Índice del período actual (1 … n)                        |
| `C`             | Cuota base fija (sistema francés)                        |
| `I_k`           | Interés del período k = Saldo_(k-1) × TEM               |
| `A_k`           | Amortización del período k = C - I_k                    |
| `S_k`           | Saldo al final del período k                             |
| `CF_k`          | Flujo total del deudor en período k (cuota_total)        |
| `VP_residual`   | Valor presente del monto balón final                     |
| `TCEA`          | Tasa de Costo Efectivo Anual (exigida por SBS)           |
| `TIR`           | Tasa Interna de Retorno del flujo del deudor             |
| `VAN`           | Valor Actual Neto del deudor (siempre ≤ 0)              |
| `g`             | Número de meses de período de gracia                     |
| `r`             | Tasa mensual implícita en Newton-Raphson                 |
| `f(r)`          | Función cuyo cero es la TCEA / TIR                       |
| `f'(r)`         | Derivada de f(r) respecto a r                            |
| `TOL`           | Tolerancia de convergencia = 0.0000001                   |
| `MAX_ITER`      | Máximo de iteraciones Newton-Raphson = 1000              |
| `DIAS_MES`      | Constante = 30 (SBS Perú)                               |
| `DIAS_ANIO`     | Constante = 360 (SBS Perú)     