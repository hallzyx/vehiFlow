# Userflow 1 — Crear Cotización de Crédito Vehicular "Compra Inteligente"

## Meta del flujo
El asesor comercial crea una cotización de crédito vehicular completa: registra
o busca al cliente, registra o selecciona el vehículo, configura todos los
parámetros financieros y obtiene un cronograma francés vencido ordinario con
TCEA, VAN y TIR desde la perspectiva del deudor, listo para presentar al
cliente como simulación formal.

## Actor principal
Asesor comercial (usuario interno autenticado)

## Pre-condición
El asesor tiene credenciales válidas en el sistema.

## Post-condición
La cotización queda guardada en base de datos con estado SIMULADA y puede ser
consultada, editada, exportada o convertida en operación formal.

---

## Pantallas del flujo

### PANTALLA 0 — Acceso al sistema (Login)

**Ruta:** `/login`

**Elementos visibles:**
- Logo de la entidad financiera / nombre del sistema
- Campo: Correo o nombre de usuario
- Campo: Contraseña (tipo password, con toggle mostrar/ocultar)
- Botón: Iniciar sesión
- Enlace: ¿Olvidaste tu contraseña? (solo decorativo en versión universitaria)

**Validaciones:**
- Ambos campos obligatorios; si alguno vacío → mensaje inline
  "Este campo es requerido"
- Si credenciales inválidas → mensaje inline sobre el formulario:
  "Usuario o contraseña incorrectos. Intenta de nuevo."
- Máximo 5 intentos fallidos → bloqueo de sesión por 5 minutos con contador
  visible (feature para demostrar seguridad en exposición)

**Regla de negocio:**
El enunciado exige que el acceso sea obligatorio con login y password.
Sin autenticación no existe ninguna pantalla funcional accesible.

**Flujo exitoso:**
Usuario y contraseña correctos → redirección al Dashboard principal

---

### PANTALLA 1 — Dashboard principal

**Ruta:** `/dashboard`

**Elementos visibles:**
- Header: logo + nombre del asesor + rol + botón cerrar sesión
- KPI rápidos: N° de cotizaciones del día | N° de clientes registrados |
  N° de operaciones activas
- Acceso rápido: botón prominente "Nueva Cotización"
- Tabla de cotizaciones recientes (últimas 10): cliente, vehículo, monto
  financiado, TCEA, estado, fecha
- Navegación lateral: Dashboard | Clientes | Vehículos | Cotizaciones |
  Configuración (solo admin) | Ayuda / Fórmulas

**Acción del asesor:**
Hace clic en "Nueva Cotización"

**Transición:**
→ PANTALLA 2 — Paso 1: Buscar o crear cliente

---

### PANTALLA 2 — Paso 1 / 5: Cliente

**Ruta:** `/cotizacion/nueva/cliente`

**Indicador de progreso visible:**
[1 Cliente] → [2 Vehículo] → [3 Parámetros] → [4 Cronograma] → [5 Resumen]

**Sección A — Buscar cliente existente:**
- Input de búsqueda por DNI, CE o nombre
- Botón: Buscar
- Si encuentra resultados → lista de coincidencias con nombre, documento
  y número de cotizaciones previas
- El asesor selecciona un cliente → los campos del formulario se
  pre-rellenan automáticamente y quedan editables

**Sección B — Registrar nuevo cliente:**
- Aparece si no se encuentra cliente O si el asesor hace clic en
  "Registrar nuevo cliente"

Campos obligatorios:
| Campo                | Tipo      | Validación                           |
|----------------------|-----------|--------------------------------------|
| Tipo de documento    | Select    | DNI / CE / Pasaporte                 |
| Número de documento  | Text      | 8 dígitos si DNI; libre si CE/Pasap. |
| Nombres              | Text      | Mín. 2 caracteres                    |
| Apellido paterno     | Text      | Mín. 2 caracteres                    |
| Apellido materno     | Text      | Opcional                             |
| Celular              | Text      | 9 dígitos, empieza en 9              |
| Correo electrónico   | Email     | Formato válido                       |
| Dirección            | Text      | Mín. 5 caracteres                    |

Campos opcionales para evaluación comercial:
| Campo                | Tipo      | Notas                                |
|----------------------|-----------|--------------------------------------|
| Ingresos mensuales   | Number    | En la moneda seleccionada            |
| Situación laboral    | Select    | Dependiente / Independiente / Otro   |
| Empresa empleadora   | Text      | Si es dependiente                    |

**Regla de negocio:**
El sistema debe permitir editar y volver a guardar los datos registrados,
tal como lo exige el enunciado.
Si el cliente ya existe, cualquier cambio en sus datos queda registrado
en historial de modificaciones.

**Acciones disponibles:**
- Guardar cliente y continuar → valida formulario → guarda en BD →
  activa botón "Siguiente"
- Si cliente ya fue seleccionado de búsqueda → botón "Siguiente" ya
  disponible

**Siguiente:** → PANTALLA 3 — Paso 2: Vehículo

---

### PANTALLA 3 — Paso 2 / 5: Vehículo

**Ruta:** `/cotizacion/nueva/vehiculo`

**Sección A — Buscar vehículo registrado:**
- Input búsqueda por marca, modelo o código interno
- Lista de resultados con marca, modelo, año, precio y moneda
- Seleccionar vehículo pre-rellena el formulario

**Sección B — Registrar nuevo vehículo:**
Campos obligatorios:
| Campo                | Tipo      | Validación                              |
|----------------------|-----------|-----------------------------------------|
| Marca                | Text      | Mín. 2 caracteres                       |
| Modelo               | Text      | Mín. 2 caracteres                       |
| Versión / Trim       | Text      | Opcional                                |
| Año                  | Number    | Entre 2000 y año actual + 1             |
| Precio de lista      | Number    | Mayor a 0; formato miles con separador  |
| Moneda del precio    | Select    | PEN / USD                               |
| Concesionario        | Text      | Nombre del dealer                       |

Campos opcionales para "Compra Inteligente":
| Campo                     | Tipo   | Notas                                    |
|---------------------------|--------|------------------------------------------|
| Valor residual estimado   | Number | % del precio o monto fijo; base para     |
|                           |        | calcular la cuota balón al final del     |
|                           |        | plazo en el esquema Compra Inteligente   |
| Color / Especificaciones  | Text   | Solo informativo                         |

**Nota de diseño para exposición:**
Mostrar un tooltip en "Valor residual estimado" explicando que es el
valor que el cliente pagará al final del plazo si decide conservar el
vehículo en el esquema Compra Inteligente. Esto evidencia comprensión
del producto durante la exposición.

**Siguiente:** → PANTALLA 4 — Paso 3: Parámetros financieros

---

### PANTALLA 4 — Paso 3 / 5: Parámetros financieros

**Ruta:** `/cotizacion/nueva/parametros`

**Esta es la pantalla central del sistema. Todo el compliance financiero
se configura aquí.**

#### Sección 4.1 — Moneda y tasa

| Campo                  | Tipo     | Opciones / Validación                    |
|------------------------|----------|------------------------------------------|
| Moneda de la operación | Select   | PEN (Soles) / USD (Dólares)              |
| Tipo de tasa           | Radio    | Efectiva / Nominal                       |
| Valor de la tasa       | Number   | % anual; mayor a 0; hasta 4 decimales    |
| Capitalización         | Select   | Aparece SOLO si tipo = Nominal           |
|                        |          | Diaria / Semanal / Quincenal / Mensual / |
|                        |          | Bimestral / Trimestral / Semestral /     |
|                        |          | Anual                                    |

**Lógica de conversión de tasas (visible en tooltip de ayuda):**

Si tasa es EFECTIVA ANUAL:
  TEM = (1 + TEA)^(30/360) - 1

Si tasa es NOMINAL con capitalización m veces al año:
  TEM = (1 + TNA/m)^(m/12) - 1

En ambos casos, internamente el sistema normaliza a TEM (Tasa Efectiva
Mensual) para construir el cronograma, y expone TEA al usuario.

Obligatorio por normativa SBS: mostrar siempre la TCEA en forma efectiva
anual considerando año de 360 días, independientemente de la tasa
ingresada.

#### Sección 4.2 — Financiamiento

| Campo                     | Tipo   | Validación                               |
|---------------------------|--------|------------------------------------------|
| Precio del vehículo       | Number | Pre-llenado desde vehículo; editable     |
| Cuota inicial (%)         | Number | 0% a 99%; calcula monto automáticamente  |
| Cuota inicial (monto)     | Number | Sincronizado con %; editable             |
| Monto financiado          | Number | Calculado: precio - cuota inicial;       |
|                           |        | solo lectura con botón "recalcular"      |
| Plazo (meses)             | Number | 6 a 84 meses; típicamente 24 o 36 para  |
|                           |        | Compra Inteligente                       |
| Fecha de desembolso       | Date   | Mayor o igual a hoy                      |
| Fecha primera cuota       | Date   | Calculada: desembolso + 30 días;         |
|                           |        | editable para ajustar al calendario      |

#### Sección 4.3 — Periodo de gracia

| Campo                  | Tipo   | Opciones / Lógica                        |
|------------------------|--------|------------------------------------------|
| ¿Incluir gracia?       | Toggle | Sí / No                                  |
| Tipo de gracia         | Radio  | Total / Parcial                          |
|                        |        | Aparece solo si toggle = Sí              |
| Número de meses        | Number | 1 a 6 meses; aparece solo si toggle = Sí |

Definición visible en tooltip (requerida por enunciado para ayuda):
- Gracia TOTAL: el deudor no paga nada durante ese período. Los
  intereses generados se capitalizan al saldo del principal.
- Gracia PARCIAL: el deudor paga solo los intereses generados durante
  ese período. El principal no se amortiza.

#### Sección 4.4 — Valor residual (Compra Inteligente)

| Campo                      | Tipo   | Lógica                                  |
|----------------------------|--------|-----------------------------------------|
| ¿Incluir valor residual?   | Toggle | Sí / No; activado por defecto si el     |
|                            |        | vehículo tiene valor residual estimado  |
| Monto del valor residual   | Number | % del precio o monto fijo; editable     |

Nota visible al asesor:
"El valor residual representa la cuota balón final del esquema Compra
Inteligente. Aparecerá como última cuota del cronograma y se incluye en
el cálculo de la TCEA."

#### Sección 4.5 — Seguros y gastos trasladables

**Contexto normativo:**
La SBS distingue entre comisiones y gastos permitidos vs. cargos prohibidos.
El sistema debe mostrar solo conceptos permitidos y bloquear por diseño
cualquier cargo que la norma prohíba trasladar al cliente.

**Cargos PROHIBIDOS (bloqueados en el sistema — no configurables):**
- Evaluación crediticia / análisis de riesgo
- Desembolso del crédito
- Administración del crédito
- Constitución de garantía vehicular
- Levantamiento de garantía (en ningún caso trasladable al deudor)
- Cancelación anticipada o pago adelantado
- Emisión de estados de cuenta periódicos

**Cargos PERMITIDOS (configurables por el admin de la entidad):**

| Concepto                      | Tipo      | Notas                                       |
|-------------------------------|-----------|---------------------------------------------|
| Seguro de desgravamen         | Mensual   | % sobre saldo; la SBS exige informar monto, |
|                               |           | compañía y póliza; cliente puede traer      |
|                               |           | póliza propia si cumple condiciones         |
| Seguro vehicular (SOAT + TODO |           |                                             |
| RIESGO)                       | Anual     | Prima informada; cliente puede contratar    |
|                               |           | con aseguradora propia endosando a favor    |
|                               |           | de la entidad                               |
| GPS / Rastreo vehicular       | Único     | Gasto real, documentable, si es exigido     |
|                               |           | por la entidad como condición del crédito   |
| Gastos notariales             | Único     | Solo si están sustentados con contrato      |
|                               |           | notarial real                               |
| Portes de envío               | Mensual   | Solo si el cliente elige recibir            |
|                               |           | documentación física                        |

**Interfaz de la sección:**
- Cada concepto aparece como una fila con toggle (incluir / no incluir),
  campo de monto o porcentaje, periodicidad y compañía cuando aplique
- Al activar seguro de desgravamen → aparece sub-campo: "¿Póliza propia
  del cliente?" con instrucciones de endoso
- Al activar seguro vehicular → aparece sub-campo: "¿Póliza propia del
  cliente?" con ídem
- Tooltip en cada concepto explicando su naturaleza y base normativa

**Regla de negocio crítica:**
Todos los conceptos activos en esta sección se incluyen en el cálculo
de la TCEA, ya que la norma exige que la TCEA refleje el costo total
efectivo incluyendo principal, intereses, comisiones y gastos
trasladados al cliente.

---

#### Sección 4.6 — Vista previa de indicadores (en tiempo real)

Mientras el asesor completa los parámetros, el panel lateral derecho
(o sección inferior en mobile) muestra un preview que se actualiza
con cada cambio:
┌─────────────────────────────────────────────┐
│ INDICADORES DE LA OPERACIÓN │
│─────────────────────────────────────────────│
│ Monto financiado S/. 45,000.00 │
│ Plazo 36 meses │
│ TEA ingresada 18.00% │
│ TEM calculada 1.3936% │
│ Cuota estimada S/. 1,624.32 │
│─────────────────────────────────────────────│
│ TCEA (preliminar) 21.45% │
│ VAN deudor S/. -2,847.60 │
│ TIR deudor (mensual) 1.7834% │
│─────────────────────────────────────────────│
│ Total a pagar S/. 58,475.52 │
│ Costo total del cred. S/. 13,475.52 │
└─────────────────────────────────────────────┘

text

Estado del preview: etiqueta "Simulación preliminar — no vinculante"
para dejar claro que es una vista en tiempo real, no el documento final.

**Nota para la exposición universitaria:**
Este panel en tiempo real demuestra dominio del motor financiero y
permite al profesor ver los cálculos actualizarse mientras hace preguntas
sobre parámetros específicos.

**Acción disponible:**
- Botón "Generar cronograma completo" → valida todos los campos →
  guarda borrador → → PANTALLA 5 — Paso 4: Cronograma

---

### PANTALLA 5 — Paso 4 / 5: Cronograma de pagos

**Ruta:** `/cotizacion/nueva/cronograma`

**Encabezado del cronograma (obligatorio por norma SBS):**
Cliente: Juan Pérez Quispe DNI: 45678901
Vehículo: Toyota Corolla 2025 Moneda: PEN
Monto financiado: S/. 45,000.00 Plazo: 36 meses
TEA: 18.00% TCEA: 21.45%
Fecha desembolso: 15/04/2026 1ra cuota: 15/05/2026
Tipo de tasa: Efectiva anual Sistema: Francés vencido ordinario
Período de gracia: 2 meses — Parcial Meses de 30 días (año 360)
Valor residual: S/. 9,000.00 (cuota 36)

text

**Tabla del cronograma:**
Cada fila representa una cuota. El desglose completo es obligatorio por
la norma SBS para créditos bajo sistema de cuotas.

| N° | Fecha       | Saldo inicial | Interés    | Amort.     | Seguro   | Gastos  | Cuota total | Saldo final |
|----|-------------|---------------|------------|------------|----------|---------|-------------|-------------|
| GR | 15/05/2026  | 45,000.00     | 627.12     | 0.00       | 18.00    | 0.00    | 645.12      | 45,000.00   |
| GR | 15/06/2026  | 45,000.00     | 627.12     | 0.00       | 18.00    | 0.00    | 645.12      | 45,000.00   |
| 1  | 15/07/2026  | 45,000.00     | 627.12     | 997.20     | 18.00    | 0.00    | 1,642.32    | 44,002.80   |
| …  | …           | …             | …          | …          | …        | …       | …           | …           |
| 34 | 15/02/2029  | 10,824.40     | 150.89     | 1,473.43   | 18.00    | 0.00    | 1,642.32    | 9,350.97    |
| 35 | 15/03/2029  | 9,350.97      | 130.35     | 1,493.97   | 18.00    | 0.00    | 1,642.32    | 7,857.00    |
| 36 | 15/04/2029  | 7,857.00      | 109.55     | 9,000.00   | 18.00    | 0.00    | 9,127.55    | 0.00        |

Leyenda: GR = Cuota en período de gracia parcial
Última cuota = cuota normal + valor residual (Compra Inteligente)

**Fila de totales (obligatoria por SBS):**

| Concepto                       | Monto         |
|--------------------------------|---------------|
| Total intereses pagados        | S/. 9,241.08  |
| Total seguros pagados          | S/. 648.00    |
| Total gastos pagados           | S/. 0.00      |
| Total amortización             | S/. 45,000.00 |
| TOTAL PAGADO (costo total)     | S/. 54,889.08 |
| Costo del crédito              | S/. 9,889.08  |

**Indicadores financieros del deudor (obligatorios por enunciado):**
VAN del deudor: S/. -2,847.60
(flujo neto a la TEM del mercado de referencia;
negativo indica que el crédito tiene costo para el deudor)

TIR del deudor (mensual): 1.7834%
TIR del deudor (anual): 23.67%
(tasa que iguala el valor presente de los pagos con el préstamo recibido)

TCEA de la operación: 21.45%
(incluye: intereses + seguro desgravamen + GPS; año 360 días)

text

**Tooltip explicativo visible en pantalla:**
"El VAN del deudor mide el costo real del crédito en valor presente.
La TIR del deudor es la tasa efectiva que hace que el flujo de pagos
sea equivalente al préstamo recibido. La TCEA incluye todos los costos
trasladados al cliente y es el indicador de comparación entre entidades
financieras."

**Acciones disponibles en esta pantalla:**

- Botón "Recalcular" → regresa a Pantalla 4 con parámetros cargados
- Botón "Exportar PDF" → genera hoja resumen + cronograma en PDF
- Botón "Exportar Excel" → cronograma en .xlsx con fórmulas visibles
- Botón "Continuar al resumen final" → → PANTALLA 6 — Paso 5: Resumen

---

### PANTALLA 6 — Paso 5 / 5: Resumen y guardado

**Ruta:** `/cotizacion/nueva/resumen`

**Objetivo de esta pantalla:**
Confirmar y guardar la cotización formalmente en la base de datos, con
todos los datos del cliente, el vehículo, los parámetros y el cronograma
completo. Es el registro auditable de la operación.

#### Sección 6.1 — Hoja resumen (Obligatoria por normativa SBS)

La norma SBS exige una "Hoja Resumen" para operaciones activas con el
siguiente contenido mínimo. El sistema la genera automáticamente:

**Información del producto:**
- Nombre del producto: Crédito Vehicular — Compra Inteligente
- Moneda de la operación
- Monto total del crédito
- Destino del crédito: Adquisición de vehículo automotor

**Condiciones financieras:**
- Tasa de interés compensatoria: X% TEA (efectiva anual, año 360 días)
- Tasa de interés moratorio: X% TEA (si aplica; por defecto según BCRP)
- TCEA: X% (efectiva anual, año 360 días)
- Plazo total: N meses
- Número de cuotas: N
- Monto de la cuota: S/. X (durante el período de amortización)
- Monto de la cuota en gracia parcial: S/. X (si aplica)
- Monto de la última cuota (valor residual): S/. X
- Fecha de desembolso
- Fecha de primera cuota
- Sistema de amortización: Francés vencido ordinario
- Fecha de vencimiento final

**Comisiones y gastos trasladados al cliente:**
(tabla con cada concepto activo, monto, periodicidad y oportunidad de cobro)

**Seguros:**
- Seguro de desgravamen: compañía, prima mensual, póliza (si aplica)
- Seguro vehicular: compañía, prima anual, póliza (si aplica)
- Indicación del derecho del cliente a contratar póliza propia

**Garantías:**
- Tipo: Garantía mobiliaria sobre vehículo
- Descripción del vehículo gravado

**Información complementaria:**
- Derecho a efectuar pagos anticipados sin penalidad ni comisión
- Derecho a un cronograma recalculado tras pago anticipado
- Canal de reclamos: Mesa de partes / correo / teléfono de la entidad
- Referencia al contrato de crédito

#### Sección 6.2 — Módulo de Beneficios, Riesgos y Condiciones

Requerido por el Reglamento de Transparencia SBS (Anexo 4):

**Beneficios del producto:**
- Cuotas hasta 45% más bajas vs. crédito vehicular convencional
- Opción de renovar el vehículo o conservarlo al final del plazo
- Financiamiento disponible en PEN y USD
- Posibilidad de definir cuota inicial flexible

**Riesgos del producto:**
- Al final del plazo, el cliente debe pagar el valor residual
  para conservar el vehículo; si no puede, puede perder el vehículo
- El incumplimiento genera intereses moratorios y deterioro en
  la central de riesgos (SBS / Infocorp)
- Si la moneda es USD y el cliente tiene ingresos en PEN, existe
  riesgo cambiario que puede incrementar el costo real del crédito
- El seguro de desgravamen cubre la deuda ante fallecimiento o
  invalidez permanente, no ante despido o reducción de ingresos

**Condiciones del producto:**
- Cliente debe mantener el seguro vehicular vigente durante todo
  el plazo del crédito
- El vehículo queda en garantía mobiliaria a favor de la entidad
  hasta la cancelación total
- Cualquier modificación del crédito debe formalizarse por escrito
- Incumplimiento de 2 o más cuotas puede activar cobro judicial
  y ejecución de garantía

#### Sección 6.3 — Confirmación y guardado

**Resumen visual de los datos ingresados:**
- Ficha del cliente (nombre, documento)
- Ficha del vehículo (marca, modelo, precio)
- Parámetros clave (moneda, tasa, plazo, TCEA)
- VAN y TIR del deudor
- Monto total a pagar

**Campo opcional:**
- Notas del asesor: textarea libre para observaciones internas

**Acciones:**
- Botón "Guardar cotización" → estado = SIMULADA → genera ID único
  de cotización → redirige a pantalla de detalle de la cotización
- Botón "Volver a parámetros" → regresa a Pantalla 4 sin perder datos
- Botón "Cancelar" → descarta borrador (con confirmación modal)

**Mensaje de éxito:**
Banner verde en la parte superior:
"✓ Cotización #COT-2026-00147 guardada correctamente.
  Puedes exportarla, compartirla o convertirla en operación activa."

---

### PANTALLA 7 — Detalle de cotización guardada

**Ruta:** `/cotizacion/:id`

Esta pantalla es el destino final del flujo y también el punto de
acceso cuando el asesor consulta una cotización desde el dashboard.

**Contenido:**
- Todos los datos del cliente, vehículo y parámetros financieros
- Cronograma completo paginado (10 cuotas por página)
- Indicadores: TCEA, VAN, TIR, total a pagar, costo del crédito
- Hoja resumen generada automáticamente
- Módulo de beneficios, riesgos y condiciones

**Acciones disponibles:**
- Editar cotización → regresa al Paso 3 (Parámetros) con datos cargados
- Exportar PDF (hoja resumen + cronograma)
- Exportar Excel (cronograma con fórmulas)
- Nueva versión → crea copia editable manteniendo historial de versiones
- Archivar → cambia estado a ARCHIVADA

**Historial de versiones (feature de trazabilidad):**
Panel lateral colapsable mostrando versiones anteriores de la misma
cotización con fecha, hora, usuario y qué parámetros cambiaron.
Esto permite defender la trazabilidad operativa en la exposición.

---

## Diagrama de flujo resumido
[LOGIN]
│
▼
[DASHBOARD]
│
▼ Nueva Cotización
[PASO 1: CLIENTE]
├── Buscar existente → seleccionar → pre-rellenar
└── Registrar nuevo → formulario → guardar
│
▼ Siguiente
[PASO 2: VEHÍCULO]
├── Buscar existente → seleccionar → pre-rellenar
└── Registrar nuevo → formulario → guardar
│
▼ Siguiente
[PASO 3: PARÁMETROS FINANCIEROS]
├── Moneda + Tasa (efectiva/nominal + capitalización)
├── Monto financiado + Plazo + Fechas
├── Período de gracia (total/parcial/ninguno)
├── Valor residual (Compra Inteligente)
├── Seguros y gastos permitidos por SBS
└── Preview en tiempo real: TCEA, VAN, TIR
│
▼ Generar cronograma
[PASO 4: CRONOGRAMA]
├── Tabla completa con desglose por cuota
├── Totales por concepto (interés, amort., seguros, gastos)
├── VAN deudor + TIR deudor + TCEA
├── Exportar PDF / Excel
└── ¿Recalcular? → vuelve a Paso 3
│
▼ Continuar
[PASO 5: RESUMEN Y GUARDADO]
├── Hoja resumen normativa SBS
├── Beneficios, riesgos y condiciones del producto
├── Confirmación de datos
└── Guardar cotización → estado: SIMULADA
│
▼
[DETALLE DE COTIZACIÓN #COT-XXXX]
├── Ver / editar
├── Nueva versión
├── Exportar
└── Archivar

text

---

## Estados de una cotización

| Estado     | Descripción                                               |
|------------|-----------------------------------------------------------|
| BORRADOR   | Parámetros incompletos; no guardada aún                   |
| SIMULADA   | Guardada con cronograma completo; disponible para editar  |
| PRESENTADA | Enviada / mostrada al cliente; no se edita sin nueva vers.|
| ARCHIVADA  | Cotización expirada o descartada; solo lectura            |

---

## Errores y casos especiales

| Situación                              | Respuesta del sistema                             |
|----------------------------------------|---------------------------------------------------|
| TEM calculada = 0 o negativa           | Error bloqueante: "La tasa ingresada no es válida"|
| Monto financiado < cuota mensual       | Advertencia: "El plazo es muy corto para el monto"|
| Gracia > 50% del plazo total           | Advertencia: "El período de gracia es inusualmente largo; verifica"|
| Valor residual > 80% del precio        | Advertencia: "El valor residual supera el umbral común del producto"|
| TIR no converge (flujo atípico)        | Mensaje: "No se pudo calcular la TIR; verifica el flujo de caja"   |
| Campo numérico con letras              | Validación inline inmediata con mensaje claro     |
| Sesión expirada (30 min sin actividad) | Modal: "Tu sesión ha expirado" + botón Reiniciar  |

---

## Notas de implementación académica

- El flujo de 5 pasos es ideal para la exposición porque permite al
  profesor interrumpir en cualquier paso y hacer preguntas sobre la
  lógica financiera o regulatoria.
- El panel de indicadores en tiempo real (Pantalla 4) es el mejor
  momento para demostrar que el equipo comprende las fórmulas.
- La hoja resumen generada automáticamente en el Paso 5 es el
  entregable que evidencia cumplimiento con la normativa SBS.
- El historial de versiones en la Pantalla 7 responde a la exigencia
  del enunciado de poder editar y volver a guardar los datos.