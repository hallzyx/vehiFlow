# Userflow 2 — Editar Cotización y Recalcular Cronograma

## Meta del flujo
El asesor comercial localiza una cotización existente en estado SIMULADA
o PRESENTADA, modifica uno o varios parámetros (financieros, del cliente
o del vehículo), recalcula el cronograma con los nuevos valores y guarda
una nueva versión auditable de la operación, preservando el historial
completo de versiones anteriores.

## Actor principal
Asesor comercial (usuario interno autenticado)

## Actores secundarios
Analista / supervisor (puede consultar historial; no puede editar si la
cotización fue presentada, salvo que tenga rol de supervisión)

## Pre-condición
- El asesor está autenticado en el sistema
- Existe al menos una cotización en estado SIMULADA o PRESENTADA

## Post-condición
- La cotización queda guardada como una nueva versión (v2, v3, etc.)
- La versión anterior queda en estado ARCHIVADA_VERSION y es consultable
- El nuevo cronograma, TCEA, VAN y TIR reflejan los parámetros actualizados
- Todos los cambios quedan registrados en el log de auditoría con usuario,
  fecha, hora y campos modificados

---

## Regla de negocio central

El enunciado exige explícitamente que sea posible editar y/o modificar
los datos registrados y volverlos a guardar. Esto no significa sobreescribir
el registro anterior: significa crear una nueva versión rastreable, de modo
que ante una pregunta del profesor ("¿qué pasaba si la tasa era 20%?") el
equipo pueda mostrar versiones anteriores sin pérdida de información.

---

## Pantallas del flujo

### PANTALLA 0 — Punto de entrada A: desde Dashboard

**Ruta:** `/dashboard`

El asesor localiza la cotización en la tabla de cotizaciones recientes.
Cada fila tiene un menú de acciones rápidas (icono ⋮):
- Ver detalle
- **Editar** ← entrada al flujo 2
- Nueva versión
- Archivar

Al hacer clic en "Editar":
- Si estado = SIMULADA → acceso directo al formulario de edición
- Si estado = PRESENTADA → modal de confirmación:
┌──────────────────────────────────────────────────────────────┐
│ Esta cotización ya fue presentada al cliente │
│ │
│ Editarla creará una nueva versión (v2). La versión actual │
│ quedará guardada en el historial y no se modificará. │
│ │
│ ¿Deseas continuar? │
│ │
│ [Cancelar] [Crear versión v2] │
└──────────────────────────────────────────────────────────────┘

text

---

### PANTALLA 0B — Punto de entrada B: desde Detalle de cotización

**Ruta:** `/cotizacion/:id`

En la pantalla de detalle existe el botón "Editar cotización" en la
barra de acciones. El comportamiento es idéntico al Punto de entrada A.

---

### PANTALLA 1 — Formulario de edición (multi-sección)

**Ruta:** `/cotizacion/:id/editar`

**Encabezado fijo visible en toda la pantalla:**
┌─────────────────────────────────────────────────────────────┐
│ Editando: COT-2026-00147 │ Cliente: Juan Pérez Quispe │
│ Versión actual: v1 │ Estado: SIMULADA │
│ ⚠ Los cambios generarán una nueva versión (v2) │
└─────────────────────────────────────────────────────────────┘

text

El formulario está dividido en tres tabs o secciones colapsables:
[Tab 1: Cliente] [Tab 2: Vehículo] [Tab 3: Parámetros financieros]

text

Los campos aparecen pre-rellenados con los valores de la versión actual.
Cada campo editado queda marcado visualmente (borde azul o etiqueta
"Modificado") para que el asesor identifique qué cambió antes de guardar.

---

#### Tab 1 — Datos del cliente

Todos los campos del cliente son editables. Si se modifica un dato del
cliente, el cambio aplica al perfil global del cliente en la BD (con
registro en historial de modificaciones del cliente).

Campos editables:
- Nombres y apellidos
- Tipo y número de documento
- Celular y correo
- Dirección
- Ingresos mensuales
- Situación laboral

**Caso especial — cambio de cliente:**
Si el asesor necesita asignar la cotización a un cliente distinto
(error de asignación inicial):
- Botón secundario: "Cambiar cliente"
- Abre modal de búsqueda igual al Paso 1 del Flujo 1
- Al seleccionar nuevo cliente → el campo "Cliente" se actualiza y
  se marca como "Modificado"
- Se registra en el log: "Cliente cambiado de [ID anterior] a [ID nuevo]"

---

#### Tab 2 — Datos del vehículo

Todos los campos del vehículo son editables. Si se modifica un dato del
vehículo, el cambio aplica al registro global del vehículo en la BD.

Campos editables:
- Marca, modelo, versión, año
- Precio de lista (al modificar → recalcula automáticamente el
  monto financiado si la cuota inicial es porcentual)
- Moneda del precio
- Concesionario
- Valor residual estimado

**Caso especial — cambio de vehículo:**
- Botón secundario: "Cambiar vehículo"
- Abre modal de búsqueda igual al Paso 2 del Flujo 1
- Al seleccionar nuevo vehículo → campos se actualizan y se marcan
  como "Modificados"
- Si el nuevo vehículo tiene diferente moneda que la operación →
  advertencia inline:
  "El vehículo seleccionado está en [USD] pero la operación está
   configurada en [PEN]. ¿Deseas ajustar la moneda de la operación?"

---

#### Tab 3 — Parámetros financieros

Esta es la sección más sensible. Cualquier cambio aquí invalida el
cronograma actual y exige recalcular.

**Indicador visible al modificar cualquier campo de esta sección:**
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Cronograma desactualizado │
│ Has modificado parámetros financieros. El cronograma │
│ actual ya no es válido. Debes recalcular antes de guardar. │
│ │
│ [Recalcular ahora] │
└─────────────────────────────────────────────────────────────┘

text

Campos editables:

| Campo                   | Comportamiento al editar                      |
|-------------------------|-----------------------------------------------|
| Moneda de operación     | Actualiza símbolo en todos los campos         |
| Tipo de tasa            | Muestra/oculta campo de capitalización        |
| Valor de la tasa        | Actualiza preview de TEM y cuota estimada     |
| Capitalización          | Solo si tipo = Nominal; actualiza TEM         |
| Cuota inicial (%)       | Recalcula monto de cuota inicial y financiado |
| Cuota inicial (monto)   | Recalcula % y monto financiado                |
| Monto financiado        | Editable solo si cuota inicial = 0            |
| Plazo (meses)           | Actualiza número de filas del preview         |
| Fecha de desembolso     | Recalcula fechas de todas las cuotas          |
| Fecha primera cuota     | Recalcula fechas sucesivas                    |
| Período de gracia       | Recalcula estructura del cronograma           |
| Valor residual          | Recalcula última cuota                        |
| Seguros y gastos        | Recalcula TCEA                                |

**Panel de comparación v1 vs. v2 (feature diferenciador):**
Al modificar parámetros financieros, el sistema muestra una tabla
comparativa lateral que facilita la explicación al cliente y la
defensa en exposición:
┌────────────────────┬──────────────────┬──────────────────┐
│ Indicador │ Versión actual │ Nueva versión │
├────────────────────┼──────────────────┼──────────────────┤
│ Tasa (TEA) │ 18.00% │ 16.50% ↓ │
│ Plazo │ 36 meses │ 48 meses ↑ │
│ Cuota estimada │ S/. 1,642.32 │ S/. 1,312.80 ↓ │
│ TCEA │ 21.45% │ 19.87% ↓ │
│ Total a pagar │ S/. 54,889.08 │ S/. 57,986.40 ↑ │
│ Costo del crédito │ S/. 9,889.08 │ S/. 12,986.40 ↑ │
│ VAN deudor │ S/. -2,847.60 │ S/. -3,924.10 ↓ │
│ TIR deudor anual │ 23.67% │ 21.20% ↓ │
└────────────────────┴──────────────────┴──────────────────┘

text

Flechas ↑ / ↓ en color para indicar si el cambio es favorable o
desfavorable para el deudor. Esto permite al asesor explicar
el impacto del cambio de forma visual e inmediata.

---

### PANTALLA 2 — Recalcular cronograma

**Acción:** El asesor hace clic en "Recalcular ahora" o en
"Guardar cambios" (el sistema recalcula automáticamente si hay
parámetros modificados antes de permitir guardar).

**Proceso del motor financiero (visible como loading state):**
Recalculando cronograma...
✓ Conversión de tasa aplicada (TEM = 1.2847%)
✓ Período de gracia procesado (2 meses parciales)
✓ 36 cuotas generadas
✓ Valor residual incluido en cuota 36
✓ TCEA calculada (19.87%)
✓ VAN del deudor calculado (S/. -3,924.10)
✓ TIR del deudor calculada (1.6248% mensual)
Listo ✓

text

Este loading state con pasos detallados tiene doble propósito:
muestra al usuario que el cálculo ocurrió correctamente y durante
la exposición permite que el profesor vea que el sistema ejecuta
cada paso del modelo matemático de forma explícita.

**Resultado:**
El sistema muestra el nuevo cronograma completo con los indicadores
actualizados y la tabla comparativa v1 vs. v2.

---

### PANTALLA 3 — Confirmación y guardado de nueva versión

**Ruta:** `/cotizacion/:id/editar/confirmar`

**Resumen de cambios detectados automáticamente:**
Resumen de modificaciones — COT-2026-00147 v2

Parámetros modificados:
- Tasa TEA: 18.00% → 16.50%
- Plazo: 36 meses → 48 meses
- Valor residual: S/. 9,000.00 → S/. 8,500.00

Impacto en indicadores:
- Cuota mensual: S/. 1,642.32 → S/. 1,312.80 (-329.52)
- TCEA: 21.45% → 19.87% (-1.58 pp)
- Total a pagar: S/. 54,889.08 → S/. 57,986.40 (+3,097.32)
- VAN deudor: S/. -2,847.60 → S/. -3,924.10

Datos sin modificación:
- Cliente, vehículo, moneda, seguros, gastos, gracia

text

**Campo opcional:**
- Motivo del cambio: Select con opciones predefinidas + texto libre
  - "Solicitud del cliente"
  - "Ajuste de condiciones comerciales"
  - "Corrección de datos"
  - "Comparativa de escenarios"
  - Otro (campo libre)
  
Este campo es importante para la trazabilidad y para responder
en la exposición por qué existen múltiples versiones.

**Acciones:**
- Botón "Guardar como versión v2" → guarda nueva versión →
  versión anterior queda en ARCHIVADA_VERSION → redirige al
  detalle de la nueva versión
- Botón "Seguir editando" → regresa al formulario con cambios
  preservados
- Botón "Descartar cambios" → modal de confirmación → descarta
  todo y regresa a la versión actual sin modificaciones

**Mensaje de éxito:**
✓ Nueva versión guardada: COT-2026-00147 v2
Versión anterior (v1) disponible en el historial.

text

---

### PANTALLA 4 — Historial de versiones

**Accesible desde:** `/cotizacion/:id` → panel lateral "Historial"

**Propósito:**
Muestra todas las versiones de una cotización con sus diferencias.
Es la evidencia de trazabilidad auditable que cumple con el
requerimiento del enunciado de poder editar y volver a guardar.

**Estructura del historial:**
┌──────────────────────────────────────────────────────────────┐
│ HISTORIAL DE VERSIONES — COT-2026-00147 │
├──────────┬────────────┬───────────┬──────────────────────────┤
│ Versión │ Fecha │ Usuario │ Cambios principales │
├──────────┼────────────┼───────────┼──────────────────────────┤
│ v2 ● │ 08/04/2026 │ a.torres │ Tasa 18%→16.5%, │
│ (actual) │ 22:14 hs │ │ Plazo 36→48 meses │
├──────────┼────────────┼───────────┼──────────────────────────┤
│ v1 │ 08/04/2026 │ a.torres │ Versión original │
│ │ 20:33 hs │ │ │
└──────────┴────────────┴───────────┴──────────────────────────┘

[Ver v1] [Comparar v1 vs v2]

text

**Acción "Ver versión anterior":**
Abre la cotización en modo solo lectura con banner:
"Estás viendo la versión v1 (archivada). La versión activa es v2."

**Acción "Comparar versiones":**
Abre la tabla comparativa de indicadores entre las dos versiones
seleccionadas (la misma tabla de la Pantalla 1, Tab 3).

---

## Diagrama de flujo resumido
[DASHBOARD o DETALLE DE COTIZACIÓN]
│
▼ Clic en "Editar"
¿Estado = PRESENTADA?
├── Sí → Modal confirmación → [Crear versión vN]
└── No (SIMULADA) → acceso directo
│
▼
[FORMULARIO DE EDICIÓN]
├── Tab 1: Editar datos cliente (opcional)
├── Tab 2: Editar datos vehículo (opcional)
└── Tab 3: Editar parámetros financieros
│
▼ ¿Cambió algún parámetro financiero?
├── Sí → Banner "Cronograma desactualizado"
│ → Botón "Recalcular ahora"
└── No → Solo guarda datos sin recalcular
│
▼ Recalcular
[MOTOR FINANCIERO]
├── Conversión de tasa → TEM
├── Período de gracia
├── Generación de cuotas (método francés)
├── Valor residual (Compra Inteligente)
├── TCEA (con todos los gastos trasladables)
├── VAN del deudor
└── TIR del deudor
│
▼ Resultado
[NUEVO CRONOGRAMA + TABLA COMPARATIVA v1 vs vN]
│
▼ Guardar
[CONFIRMACIÓN]
├── Resumen automático de cambios detectados
├── Campo: motivo del cambio
└── Botón "Guardar como versión vN"
│
▼
[DETALLE DE COTIZACIÓN — versión nueva activa]
└── Historial de versiones disponible

text

---

## Casos especiales y errores

| Situación                                | Respuesta del sistema                           |
|------------------------------------------|-------------------------------------------------|
| Asesor intenta editar cotización ARCHIVADA | Botón "Editar" deshabilitado; tooltip: "Las     |
|                                          | cotizaciones archivadas no son editables.       |
|                                          | Crea una nueva cotización si necesitas simular  |
|                                          | con datos similares."                           |
| Cambio de moneda (PEN → USD)             | Modal de advertencia: "Cambiar la moneda        |
|                                          | afecta todos los montos. ¿Confirmas el cambio?" |
|                                          | Los montos se limpian y deben reingresarse.     |
| Sin cambios detectados al guardar        | Sistema bloquea el guardado e informa:          |
|                                          | "No se detectaron cambios respecto a la versión |
|                                          | actual. Modifica al menos un parámetro."        |
| TIR no converge con nuevos parámetros    | Mensaje inline en el panel de indicadores:      |
|                                          | "TIR no calculable con estos parámetros.        |
|                                          | Verifica el flujo de caja."                     |
| Sesión expirada durante la edición       | Modal: "Tu sesión expiró. Los cambios no        |
|                                          | guardados se perderán." + botón Reiniciar sesión|

---

## Log de auditoría (registro en BD)

Cada acción en este flujo genera un registro en la tabla `audit_log`:

| Campo            | Ejemplo                                          |
|------------------|--------------------------------------------------|
| id_log           | LOG-000892                                       |
| id_cotizacion    | COT-2026-00147                                   |
| version          | v2                                               |
| id_usuario       | USR-014 (a.torres)                               |
| fecha_hora       | 2026-04-08 22:14:33                              |
| accion           | EDICION_PARAMETROS                               |
| campos_modificados | tasa_ingresada, plazo_meses, valor_residual    |
| valores_anteriores | {"tea": 18.0, "plazo": 36, "residual": 9000}  |
| valores_nuevos   | {"tea": 16.5, "plazo": 48, "residual": 8500}     |
| motivo           | "Solicitud del cliente"                          |

Este log es la evidencia directa de trazabilidad para la exposición
y responde a la exigencia del enunciado de registrar todas las
operaciones en base de datos.

---

## Notas de implementación académica

- El panel comparativo v1 vs. vN es el elemento de mayor impacto en
  la exposición porque permite al equipo demostrar que comprende cómo
  cada parámetro afecta la TCEA, el VAN y el TIR.
- El loading state con pasos detallados del recalculo hace visible el
  algoritmo financiero, lo cual responde directamente a preguntas como
  "¿Cómo calculan la TEM?" o "¿Cómo obtienen la TCEA?".
- El historial de versiones responde a la exigencia del enunciado de
  poder editar y volver a guardar sin perder información anterior.
- El log de auditoría demuestra que el equipo consideró trazabilidad
  operativa, que es una expectativa implícita en un sistema bancario.