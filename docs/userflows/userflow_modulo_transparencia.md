# Userflow 5 — Módulo de Transparencia, Fórmulas y Ayuda

## Meta del flujo
El sistema pone a disposición de asesores y clientes un módulo de
consulta con las fórmulas matemáticas del producto, ejemplos numéricos
resueltos paso a paso, glosario financiero, marco normativo aplicable
y ayuda contextual en cada campo del formulario de cotización.
Este módulo cumple simultáneamente tres exigencias: el enunciado que
pide un medio electrónico de ayuda por campo, la SBS que exige difundir
fórmulas y programas de cálculo para créditos vehiculares y de consumo,
y la rúbrica del trabajo que evalúa el marco legal y teórico.

## Actor principal
Asesor comercial (consulta interna durante operación)
Cliente final (consulta pública del módulo de transparencia)

## Actores secundarios
Administrador (gestiona contenido del módulo)
Profesor evaluador (revisa durante la exposición)

## Pre-condición
- Para ayuda contextual: el usuario está en cualquier pantalla del
  formulario de cotización (Flujo 1, Paso 3)
- Para el módulo completo: el usuario puede estar autenticado o no
  (la sección de transparencia es de acceso público según la SBS)

## Post-condición
- El usuario comprende el concepto o fórmula consultada
- El sistema ha registrado qué secciones de ayuda fueron consultadas
  (log de uso para demostrar en exposición que el módulo es funcional)

---

## Marco normativo de este flujo

La SBS establece que las empresas del sistema financiero deben difundir
entre sus usuarios las fórmulas y los programas de cálculo de los
productos que ofrecen, de modo que los clientes puedan verificar los
resultados por su cuenta. Para el crédito vehicular y otros créditos
de consumo, esto incluye la fórmula de la cuota, el cálculo de la
TCEA, el cronograma de pagos y los indicadores de costo real.

Adicionalmente, el Reglamento de Transparencia exige publicar los
beneficios, riesgos y condiciones de cada producto, así como informar
sobre el procedimiento de reclamos y los derechos del usuario.

El enunciado del trabajo exige que en cada campo del sistema exista
un medio electrónico que permita recibir ayuda o indicaciones sobre
la forma de uso del futuro sistema.

Este flujo da cumplimiento a ambas exigencias mediante dos capas:
ayuda contextual inline (tooltips y paneles flotantes por campo) y
módulo de transparencia completo (sección dedicada del sistema).

---

## CAPA 1 — Ayuda contextual inline

### Descripción general

Cada campo del formulario de cotización (Flujo 1, Pantalla 4) tiene
asociado un ícono de ayuda [?] que al hacer clic despliega un panel
flotante con:
- Definición del campo en lenguaje simple
- Fórmula matemática aplicable cuando corresponde
- Ejemplo numérico con valores concretos
- Referencia normativa si aplica
- Link "Ver más en el módulo de fórmulas" que lleva a la sección
  correspondiente del Módulo de Transparencia

### Diseño del panel flotante de ayuda
┌─────────────────────────────────────────────────────────────┐
│ [?] Tasa Efectiva Mensual (TEM) [×] │
│─────────────────────────────────────────────────────────────│
│ ¿Qué es? │
│ Es la tasa de interés que se aplica a cada período de 30 │
│ días para calcular el interés de cada cuota. Se obtiene │
│ convirtiendo la tasa anual ingresada. │
│ │
│ Fórmula (desde TEA): │
│ TEM = (1 + TEA)^(30/360) - 1 │
│ │
│ Ejemplo con TEA = 18%: │
│ TEM = (1 + 0.18)^(30/360) - 1 │
│ TEM = (1.18)^(0.08333) - 1 │
│ TEM = 1.013936 - 1 │
│ TEM = 0.013936 = 1.3936% │
│ │
│ Base normativa: SBS establece que las tasas se expresan │
│ en forma efectiva anual considerando 360 días. │
│ │
│ → Ver fórmulas completas del cronograma │
└─────────────────────────────────────────────────────────────┘

text

### Inventario completo de ayudas contextuales por campo

#### Ayudas en la sección de tasa e interés

**Campo: Tipo de tasa**
Tasa Efectiva (TEA):
Refleja el costo real del dinero incorporando el efecto de la
capitalización. Es la que exige mostrar la SBS. Si ingresas una
tasa efectiva, el sistema la usa directamente para calcular la TEM.

Tasa Nominal (TNA):
Es una tasa de referencia que no incorpora capitalización. Para
usarla, debes indicar con qué frecuencia se capitaliza. El sistema
la convierte automáticamente a TEA antes de calcular.

text

**Campo: Capitalización**
Es la frecuencia con la que los intereses se acumulan al capital
cuando la tasa es nominal.

Fórmula de conversión TNA → TEA:
TEA = (1 + TNA/m)^m - 1
Donde m = número de capitalizaciones por año.

Ejemplo: TNA = 18% capitalizable mensualmente (m = 12):
TEA = (1 + 0.18/12)^12 - 1
TEA = (1.015)^12 - 1
TEA = 1.19562 - 1
TEA = 19.562%

text

**Campo: Valor de la tasa**
Ingresa la tasa en términos anuales y en porcentaje.
Ejemplo: si la tasa es 18% anual, ingresa 18.

El sistema convertirá automáticamente esta tasa a la tasa
periódica mensual (TEM) que se aplica cuota a cuota.

Rango típico para créditos vehiculares en Perú: 10% a 30% TEA.

text

#### Ayudas en la sección de financiamiento

**Campo: Cuota inicial**
Es el monto que el cliente paga de su propio dinero al momento
de adquirir el vehículo, antes de que la entidad desembolse
el préstamo.

Fórmula:
Monto financiado = Precio del vehículo - Cuota inicial

Ejemplo:
Precio: S/. 85,990.00
Cuota inicial: S/. 17,198.00 (20%)
Financiado: S/. 68,792.00

Una cuota inicial mayor reduce el monto financiado, lo que
disminuye la cuota mensual y el costo total del crédito.

text

**Campo: Monto financiado**
Es el capital que la entidad financiera presta al cliente.
Sobre este monto se calculan los intereses de cada período.

Monto financiado = Precio del vehículo - Cuota inicial
+ Gastos financiados (si aplica)

En el esquema Compra Inteligente, el monto financiado excluye
el valor residual, que se trata como una cuota balón al final.

text

**Campo: Plazo**
Es el número de meses en los que el cliente devolverá el préstamo
mediante cuotas mensuales.

Para Compra Inteligente, los plazos típicos son 24 o 36 meses,
lo que permite cuotas más bajas porque al final queda un valor
residual pendiente de pago.

A mayor plazo: cuota más baja, pero mayor costo total en intereses.
A menor plazo: cuota más alta, pero menor costo total en intereses.

text

#### Ayudas en la sección de período de gracia

**Campo: Gracia total**
Durante el período de gracia total el cliente NO paga ninguna
cuota. Sin embargo, los intereses siguen generándose y se
capitalizan al saldo del principal.

Efecto: el saldo de capital crece durante la gracia porque los
intereses no pagados se suman al capital.

Fórmula del saldo al final de la gracia total (n meses):
Saldo post-gracia = Capital inicial × (1 + TEM)^n

Ejemplo: Capital S/. 45,000, TEM 1.3936%, 2 meses de gracia:
Saldo = 45,000 × (1.013936)^2 = 45,000 × 1.02806 = S/. 46,262.70

text

**Campo: Gracia parcial**
Durante el período de gracia parcial el cliente paga SOLO los
intereses generados en el período. El capital no se amortiza.

El saldo de capital permanece igual durante toda la gracia parcial.

Fórmula de la cuota en gracia parcial:
Cuota gracia = Saldo capital × TEM

Ejemplo: Capital S/. 45,000, TEM 1.3936%:
Cuota gracia = 45,000 × 0.013936 = S/. 627.12

Después de la gracia parcial, el plazo de amortización completo
comienza desde el saldo original (no se reduce el plazo).

text

#### Ayudas en la sección de valor residual

**Campo: Valor residual**
En el esquema Compra Inteligente, el valor residual es el monto
que el cliente debe pagar al final del plazo para quedarse con
el vehículo definitivamente.

Durante el plazo del crédito, las cuotas mensuales son más bajas
porque no se amortiza el valor residual; este aparece como una
cuota balón única en la última posición del cronograma.

Al vencimiento, el cliente puede:

Pagar el valor residual y conservar el vehículo

Renovar el vehículo (nuevo crédito sobre otro vehículo)

Devolver el vehículo a la entidad (según contrato)

El valor residual se incluye en el cálculo de la TCEA porque
representa un flujo real de pago del deudor.

text

#### Ayudas en indicadores financieros

**Campo: TCEA**
La Tasa de Costo Efectivo Anual es el indicador de costo real
del crédito que exige mostrar la SBS. Incluye intereses,
comisiones y gastos trasladados al cliente.

Fórmula: la TCEA es la tasa r que resuelve la ecuación:

Préstamo = Σ [ Flujo_k / (1 + r/360×30)^k]

Donde Flujo_k es el total de cada cuota (interés + amortización

seguros + gastos) y k es el número de la cuota.

La TCEA siempre es mayor o igual que la TEA porque incorpora
costos adicionales al interés puro.

Base normativa: Reglamento de Transparencia SBS, año 360 días.

text

**Campo: VAN del deudor**
El Valor Actual Neto desde la perspectiva del deudor mide el
costo del crédito en valor presente.

Flujo del deudor:
Período 0: +Préstamo recibido (entrada de dinero)
Períodos 1..n: -Cuota pagada (salida de dinero)

VAN = Préstamo - Σ [ Cuota_k / (1 + i)^k]

Donde i es la tasa de descuento del mercado (referencial).

Un VAN negativo para el deudor indica que el crédito tiene
costo real: el deudor paga más de lo que recibe.

text

**Campo: TIR del deudor**
La Tasa Interna de Retorno desde la perspectiva del deudor es
la tasa que hace que el VAN del flujo sea igual a cero.

Es equivalente al costo efectivo del financiamiento sin gastos
adicionales (similar a la TEA pero calculada desde el flujo
real de pagos).

Fórmula: resolver r en:
0 = Préstamo - Σ [ Cuota_k / (1 + r)^k]

Se resuelve por el método de Newton-Raphson o bisección.

Si no hay gastos adicionales, la TIR del deudor ≈ TEA.
Si hay seguros y gastos, la TIR del deudor > TEA.

text

---

## CAPA 2 — Módulo de Transparencia completo

### PANTALLA T0 — Índice del módulo

**Ruta:** `/transparencia`
**Acceso:** desde navegación lateral (todos los roles) y desde
el footer del sistema (acceso público sin login)
┌──────────────────────────────────────────────────────────────┐
│ Centro de Transparencia e Información Financiera │
│──────────────────────────────────────────────────────────────│
│ "Conoce cómo calculamos tu crédito vehicular" │
│ │
│ [1. Fórmulas del cronograma] │
│ [2. Cálculo de la TCEA] │
│ [3. VAN y TIR del deudor] │
│ [4. Períodos de gracia] │
│ [5. Compra Inteligente / Valor residual] │
│ [6. Pago anticipado] │
│ [7. Glosario financiero] │
│ [8. Marco legal y normativo] │
│ [9. Beneficios, riesgos y condiciones del producto] │
│ [10. Canal de reclamos] │
└──────────────────────────────────────────────────────────────┘

text

---

### PANTALLA T1 — Fórmulas del cronograma

**Ruta:** `/transparencia/formulas-cronograma`

#### Sección T1.1 — Fórmula central: cuota fija mensual
SISTEMA FRANCÉS VENCIDO ORDINARIO — Meses de 30 días

La cuota mensual es FIJA y CONSTANTE durante todo el plazo
(salvo períodos de gracia y la última cuota con valor residual).

FÓRMULA DE LA CUOTA:

P × TEM
C = ─────────────────────
1 - (1 + TEM)^(-n)

Donde:
C = Cuota mensual fija
P = Monto financiado (capital prestado)
TEM = Tasa Efectiva Mensual
n = Número de cuotas (plazo en meses)

EJEMPLO NUMÉRICO RESUELTO:
P = S/. 45,000.00
TEA = 18.00% → TEM = (1.18)^(30/360) - 1 = 1.3936%
n = 36 meses

45,000 × 0.013936
C = ──────────────────────────────
1 - (1 + 0.013936)^(-36)

627.12
C = ─────────────────
1 - (1.013936)^(-36)

627.12
C = ─────────────
1 - 0.60807

627.12
C = ──────────── = S/. 1,609.32
0.39193

text

#### Sección T1.2 — Desglose de cada cuota
Cada cuota se descompone en dos partes que cambian cuota a cuota:

INTERÉS DE LA CUOTA k:
I_k = Saldo_(k-1) × TEM

AMORTIZACIÓN DE LA CUOTA k:
A_k = C - I_k

SALDO AL FINAL DE LA CUOTA k:
Saldo_k = Saldo_(k-1) - A_k

VERIFICACIÓN:
Al final de la cuota n (última), Saldo_n = 0.00
(salvo error de redondeo menor a S/. 0.01)

EJEMPLO — Primeras 3 cuotas:

┌──────┬────────────────┬──────────┬──────────┬────────────────┐
│ N° │ Saldo inicial │ Interés │ Amort. │ Saldo final │
├──────┼────────────────┼──────────┼──────────┼────────────────┤
│ 1 │ 45,000.00 │ 627.12 │ 982.20 │ 44,017.80 │
│ 2 │ 44,017.80 │ 613.43 │ 995.89 │ 43,021.91 │
│ 3 │ 43,021.91 │ 599.55 │ 1,009.77 │ 42,012.14 │
│ … │ … │ … │ … │ … │
│ 36 │ 1,596.88 │ 22.27 │ 1,587.05 │ 9.83* │
└──────┴────────────────┴──────────┴──────────┴────────────────┘

Última cuota se ajusta por decimales acumulados.

text

#### Sección T1.3 — Propiedad fundamental del método francés
PATRÓN DE EVOLUCIÓN:
→ El interés DISMINUYE cuota a cuota (el saldo baja)
→ La amortización AUMENTA cuota a cuota (cuota - interés)
→ La cuota total PERMANECE CONSTANTE

Esto significa que al inicio del crédito se paga más interés
y menos capital. Al final se paga menos interés y más capital.

DEMOSTRACIÓN VISUAL (distribución cuota 1 vs cuota 36):
Cuota 1: |████████████████████████░░░░░░░░░░░░░░|
Interés 38.9% Amort. 61.1%

Cuota 18: |████████████████░░░░░░░░░░░░░░░░░░░░░░|
Interés 50.4% Amort. 49.6% (aprox. mitad)

Cuota 36: |██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░|
Int. 1.4% Amort. 98.6%

text

---

### PANTALLA T2 — Cálculo de la TCEA

**Ruta:** `/transparencia/tcea`

#### Sección T2.1 — Definición normativa
La TCEA (Tasa de Costo Efectivo Anual) es el indicador oficial
exigido por la Superintendencia de Banca, Seguros y AFP (SBS)
para medir el costo real de un crédito.

Base legal: Resolución SBS N° 8181-2012 y sus modificatorias,
que establece el Reglamento de Transparencia de Información
y Contratación con Usuarios del Sistema Financiero.

Diferencia entre TEA y TCEA:
TEA = Solo intereses. No incluye seguros ni gastos.
TCEA = Intereses + seguros + comisiones + gastos trasladados
al cliente. Es el costo TOTAL real del crédito.

La TCEA siempre es ≥ TEA.

text

#### Sección T2.2 — Fórmula de la TCEA
La TCEA es la tasa r que satisface la siguiente ecuación:

n Flujo_k
P = Σ ──────────────────
k=1 (1 + r/360×30)^k

Donde:
P = Monto efectivamente desembolsado al cliente
Flujo_k = Cuota total del período k, incluyendo:
- Amortización de capital
- Intereses
- Seguros (desgravamen + vehicular)
- Comisiones permitidas
- Gastos trasladables (GPS, notariales, etc.)
r = TCEA (lo que se busca)
n = Número total