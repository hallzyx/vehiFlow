# Userflow 3 — Pago Anticipado y Recalculo de Cronograma

## Meta del flujo
El operador registra un pago extraordinario realizado por el cliente
sobre una operación activa, el sistema determina si aplica reducción
de plazo o reducción de cuota según la elección del cliente, recalcula
el cronograma residual sin cobrar ninguna penalidad ni comisión, y
emite la nueva versión del cronograma como documento formal.

## Actor principal
Asesor comercial u operador de créditos (usuario interno autenticado)

## Actores secundarios
Cliente final (comunica su decisión sobre cómo aplicar el pago)
Analista / supervisor (puede aprobar si el monto supera un umbral)

## Pre-condición
- El asesor está autenticado en el sistema
- Existe una operación en estado ACTIVA con saldo pendiente > 0
- El cliente ha realizado o solicita registrar un pago extraordinario
  por encima de la cuota exigible del período

## Post-condición
- El pago queda registrado en la base de datos con fecha, monto,
  tipo y decisión del cliente
- El cronograma residual es recalculado y guardado como nueva versión
- El nuevo cronograma muestra las cuotas restantes actualizadas
- Se genera un documento de "Constancia de pago anticipado" que incluye
  la declaración de voluntad del cliente sobre la modalidad elegida
- Cero penalidades o comisiones aplicadas (norma SBS)

---

## Marco normativo de este flujo

La SBS establece que los usuarios del sistema financiero tienen derecho
a efectuar pagos anticipados de sus créditos, ya sea de manera total
o parcial, con la consiguiente reducción de los intereses compensatorios
a partir de la fecha de pago. Las empresas del sistema financiero están
prohibidas de cobrar comisiones, gastos o penalidades por el ejercicio
de este derecho.

Adicionalmente, la norma reconoce dos modalidades que el cliente puede
elegir libremente:
1. Reducción del plazo manteniendo el monto de cuota
2. Reducción del monto de cuota manteniendo el plazo

El sistema debe registrar formalmente la elección del cliente y el
nuevo cronograma debe reflejarla con exactitud.

---

## Pantallas del flujo

### PANTALLA 0 — Punto de entrada: Detalle de operación activa

**Ruta:** `/operacion/:id`

La pantalla de detalle de una operación activa muestra:
- Datos del cliente y vehículo
- Parámetros financieros de la operación
- Cronograma vigente con estado de cada cuota:
  - PENDIENTE / PAGADA / VENCIDA / EN GRACIA
- Saldo capital pendiente actual
- Próxima cuota y fecha de vencimiento
- Barra de progreso del crédito (% amortizado)

**Acciones disponibles en la barra de operaciones:**
- Ver cronograma completo
- Registrar pago de cuota normal
- **Registrar pago anticipado** ← entrada al flujo 3
- Consultar historial de pagos
- Solicitar cancelación total

Al hacer clic en "Registrar pago anticipado":
→ PANTALLA 1 — Verificación del pago extraordinario

---

### PANTALLA 1 — Verificación del pago extraordinario

**Ruta:** `/operacion/:id/pago-anticipado/verificar`

**Encabezado fijo:**
┌──────────────────────────────────────────────────────────────┐
│ Pago Anticipado — OPE-2026-00089 │
│ Cliente: Juan Pérez Quispe │ Saldo capital: S/. 38,420.15│
│ Próxima cuota: S/. 1,642.32 │ Vence: 15/05/2026 │
└──────────────────────────────────────────────────────────────┘

text

**Sección 1.1 — Datos del pago a registrar:**

| Campo                    | Tipo     | Validación                               |
|--------------------------|----------|------------------------------------------|
| Fecha del pago           | Date     | Menor o igual a hoy; no futura           |
| Monto del pago           | Number   | Mayor a 0; en moneda de la operación     |
| Canal del pago           | Select   | Ventanilla / Transferencia / App móvil / |
|                          |          | Débito automático / Otro                 |
| Número de operación/ref. | Text     | Referencia bancaria del pago realizado   |

**Sección 1.2 — Clasificación automática del pago:**

Al ingresar el monto, el sistema clasifica automáticamente:
┌─────────────────────────────────────────────────────────────┐
│ ANÁLISIS DEL PAGO INGRESADO │
│─────────────────────────────────────────────────────────────│
│ Monto ingresado: S/. 8,000.00 │
│ Cuota exigible: S/. 1,642.32 │
│ Excedente disponible: S/. 6,357.68 ← pago anticipado │
│─────────────────────────────────────────────────────────────│
│ Tipo de pago: PAGO ANTICIPADO PARCIAL │
│ El excedente se aplicará a reducir el saldo de capital. │
│─────────────────────────────────────────────────────────────│
│ ⚠ No se aplicará ninguna penalidad ni comisión por │
│ pago anticipado (Reglamento SBS de Transparencia). │
└─────────────────────────────────────────────────────────────┘

text

**Tipos de pago clasificados por el sistema:**

| Tipo                        | Condición                                        |
|-----------------------------|--------------------------------------------------|
| PAGO DE CUOTA NORMAL        | Monto = cuota exigible (±1%)                     |
| PAGO ANTICIPADO PARCIAL     | Monto > cuota exigible y < saldo total           |
| CANCELACIÓN TOTAL ANTICIPADA| Monto ≥ saldo capital + intereses al día de hoy  |

Si el tipo es CANCELACIÓN TOTAL → derivar al Flujo 5 (cancelación).
Si el tipo es PAGO NORMAL → registrar y cerrar sin recalcular.
Si el tipo es PAGO ANTICIPADO PARCIAL → continuar al Paso 2.

**Cálculo del saldo al día del pago:**
Dado que el pago puede no coincidir con la fecha de cuota, el sistema
calcula los intereses al día exacto del pago:

  Interés al día = Saldo capital × TEM × (días transcurridos / 30)

  Capital amortizado = Excedente - Interés al día
  Nuevo saldo capital = Saldo anterior - Capital amortizado

Este detalle es fundamental para la exposición: demuestra que el
sistema maneja el devengamiento de intereses al día exacto, no
solo por período completo.

**Desglose visible antes de confirmar:**
┌─────────────────────────────────────────────────────────────┐
│ DESGLOSE DE APLICACIÓN DEL PAGO │
│─────────────────────────────────────────────────────────────│
│ Pago total: S/. 8,000.00 │
│ Intereses al día S/. 284.47 (17 días devengados) │
│ Cuota exigible: S/. 1,642.32 │
│ ───────────────────────────────────────────────────────── │
│ Aplicado a cuota N°8: S/. 1,642.32 (cuota del período) │
│ Aplicado a capital: S/. 6,073.21 (reducción directa) │
│ ───────────────────────────────────────────────────────── │
│ Nuevo saldo capital: S/. 32,346.94 │
└─────────────────────────────────────────────────────────────┘

text

**Acción:** Botón "Confirmar pago y continuar" →
→ PANTALLA 2 — Elección del cliente

---

### PANTALLA 2 — Elección del cliente: ¿cómo aplicar el capital?

**Ruta:** `/operacion/:id/pago-anticipado/modalidad`

**Esta es la pantalla más importante del flujo desde el punto
de vista normativo.** La SBS exige que sea el cliente quien elija
cómo aplicar el excedente y que su decisión quede registrada.

**Encabezado informativo:**
Capital a amortizar anticipadamente: S/. 6,073.21
Saldo capital antes del pago: S/. 38,420.15
Nuevo saldo capital: S/. 32,346.94
Cuotas restantes antes del pago: 28

text

**Sección 2.1 — Opciones de recalculo:**

El sistema muestra dos opciones como tarjetas comparativas con
los indicadores proyectados para cada modalidad:
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ OPCIÓN A │ │ OPCIÓN B │
│ Reducir plazo │ │ Reducir cuota │
│ (mantener monto de cuota) │ │ (mantener plazo) │
│──────────────────────────────│ │──────────────────────────────│
│ Cuota: S/. 1,642.32 │ │ Cuota: S/. 1,268.44 ↓ │
│ (sin cambio) │ │ Ahorro: S/. 373.88/mes │
│ │ │ │
│ Plazo nuevo: 23 meses ↓ │ │ Plazo: 28 meses │
│ Ahorro: 5 cuotas │ │ (sin cambio) │
│ │ │ │
│ Interés total ahorrado: │ │ Interés total ahorrado: │
│ S/. 8,211.60 │ │ S/. 10,476.32 │
│ │ │ │
│ Finaliza: 15/03/2028 │ │ Finaliza: 15/08/2028 │
│ │ │ │
│ [Elegir Opción A] │ │ [Elegir Opción B] │
└──────────────────────────────┘ └──────────────────────────────┘

text

**Nota visible al asesor (no al cliente):**
"Recuerda informar al cliente que tiene derecho a elegir libremente
cualquiera de estas opciones sin costo adicional, de acuerdo con el
Reglamento de Transparencia del Sistema Financiero Peruano."

**Sección 2.2 — Registro formal de la decisión:**

Independientemente de la opción elegida, el sistema genera un
registro de la decisión del cliente:

| Campo                      | Tipo     | Notas                              |
|----------------------------|----------|------------------------------------|
| Modalidad elegida          | Radio    | Pre-seleccionada al hacer clic en  |
|                            |          | la tarjeta; editable               |
| Forma de comunicación      | Select   | Presencial / Teléfono / Correo /   |
|                            |          | App / Mensaje de texto             |
| Nombre de quien comunica   | Text     | Si es presencial = cliente mismo;  |
|                            |          | si es remoto = nombre del agente   |
| Observaciones              | Textarea | Libre; opcional                    |

**Regla de negocio:**
El campo "Modalidad elegida" es obligatorio. No es posible recalcular
sin registrar la decisión del cliente. Esto garantiza trazabilidad
ante cualquier reclamo posterior.

**Acción:** Botón "Recalcular cronograma con Opción [A/B]" →
→ PANTALLA 3 — Nuevo cronograma recalculado

---

### PANTALLA 3 — Nuevo cronograma recalculado

**Ruta:** `/operacion/:id/pago-anticipado/cronograma`

**Encabezado del nuevo cronograma:**
CRONOGRAMA ACTUALIZADO — OPE-2026-00089
────────────────────────────────────────────────────────────────
Cliente: Juan Pérez Quispe Fecha del pago: 22/04/2026
Monto pagado: S/. 8,000.00 Capital amortizado: S/. 6,073.21
Modalidad: Reducción de plazo (Opción A)
────────────────────────────────────────────────────────────────
Nuevo saldo: S/. 32,346.94 Cuotas restantes: 23
Nueva TCEA: 21.45% (sin variación) Meses de 30 días, año 360
────────────────────────────────────────────────────────────────
⚠ No se aplicó penalidad ni comisión por pago anticipado.
Base legal: Reglamento de Gestión de Conducta de Mercado del
Sistema Financiero (Res. SBS N° 3274-2017 y modificatorias).

text

**Tabla del nuevo cronograma (desde la siguiente cuota):**

| N°  | Fecha      | Saldo inicial | Interés  | Amort.   | Seguro | Cuota    | Saldo final |
|-----|------------|---------------|----------|----------|--------|----------|-------------|
| 9   | 15/05/2026 | 32,346.94     | 451.12   | 1,172.70 | 18.00  | 1,642.32 | 31,174.24   |
| 10  | 15/06/2026 | 31,174.24     | 434.76   | 1,189.06 | 18.00  | 1,642.32 | 29,985.18   |
| …   | …          | …             | …        | …        | …      | …        | …           |
| 31* | 15/03/2028 | 1,629.45      | 22.73    | 1,601.09 | 18.00  | 1,642.32 | 0.00        |

*Nota: última cuota ajustada para saldar el saldo exacto.

**Comparativa antes vs. después del pago anticipado:**
┌──────────────────────────┬────────────────┬────────────────┐
│ Indicador │ Antes │ Después │
├──────────────────────────┼────────────────┼────────────────┤
│ Saldo capital │ S/. 38,420.15 │ S/. 32,346.94 │
│ Cuotas restantes │ 28 │ 23 │
│ Cuota mensual │ S/. 1,642.32 │ S/. 1,642.32 │
│ Fecha de término │ 15/08/2028 │ 15/03/2028 │
│ Interés residual total │ S/. 15,432.96 │ S/. 7,221.36 │
│ Ahorro en intereses │ — │ S/. 8,211.60 │
└──────────────────────────┴────────────────┴────────────────┘

text

**Indicadores actualizados del deudor:**
VAN del deudor (residual): S/. -1,847.22
TIR del deudor (anual): 23.67% (sin variación, es función de la TEA)
TCEA: 21.45% (sin variación en tasa pactada)
Interés ahorrado por pago: S/. 8,211.60

text

**Nota para la exposición:**
El VAN y la TIR del deudor se recalculan sobre el flujo residual
para que el cronograma siempre tenga indicadores vigentes y
auditables desde la perspectiva del deudor.

**Acciones disponibles:**
- Botón "Confirmar y guardar nuevo cronograma"
- Botón "Cambiar modalidad" → regresa a Pantalla 2
- Botón "Cancelar operación de pago" → descarta con confirmación

---

### PANTALLA 4 — Confirmación y emisión de constancia

**Ruta:** `/operacion/:id/pago-anticipado/confirmar`

**Sección 4.1 — Resumen final antes de guardar:**
┌─────────────────────────────────────────────────────────────┐
│ CONFIRMAR PAGO ANTICIPADO PARCIAL │
│─────────────────────────────────────────────────────────────│
│ Operación: OPE-2026-00089 │
│ Fecha del pago: 22/04/2026 │
│ Monto total: S/. 8,000.00 │
│ Aplicado a cuota: S/. 1,642.32 (cuota N°8) │
│ Aplicado a cap.: S/. 6,073.21 │
│ Nuevo saldo: S/. 32,346.94 │
│ Modalidad: Reducción de plazo (elegida por cliente) │
│ Penalidad: S/. 0.00 (prohibido por norma SBS) │
│ Cuotas nuevas: 23 │
│─────────────────────────────────────────────────────────────│
│ [Confirmar y guardar] [Volver] │
└─────────────────────────────────────────────────────────────┘

text

**Sección 4.2 — Documentos generados automáticamente al confirmar:**

1. **Constancia de pago anticipado:**
   Documento que incluye:
   - Datos de la operación y el cliente
   - Monto pagado, fecha y canal
   - Desglose: cuota regular + capital amortizado
   - Declaración de la modalidad elegida por el cliente
   - Nuevo saldo capital
   - Referencia al derecho ejercido (base normativa SBS)
   - Firma del asesor y sello de la entidad (campo para impresión)

2. **Nuevo cronograma de pagos:**
   Idéntico al cronograma completo del Flujo 1, Pantalla 5,
   pero con encabezado que indica:
   "CRONOGRAMA ACTUALIZADO — Generado tras pago anticipado
    del [fecha]. Reemplaza al cronograma anterior."

**Acciones sobre los documentos:**
- Exportar constancia en PDF
- Exportar nuevo cronograma en PDF
- Exportar nuevo cronograma en Excel
- Imprimir ambos documentos (botón conjunto)

**Mensaje de éxito al guardar:**
✓ Pago anticipado registrado correctamente.
Constancia: CONST-2026-00089-08
Nuevo cronograma guardado: versión v2 de OPE-2026-00089
Cuotas restantes: 23 | Próxima cuota: 15/05/2026 | S/. 1,642.32

text

---

### PANTALLA 5 — Historial de pagos de la operación

**Accesible desde:** `/operacion/:id` → tab "Historial de pagos"

**Propósito:**
Muestra todos los movimientos registrados sobre la operación:
cuotas normales pagadas, pagos anticipados, recalculos y
versiones de cronograma emitidas.
┌──────┬────────────┬──────────────┬───────────────┬───────────────┬────────────────────┐
│ N° │ Fecha │ Tipo │ Monto │ Capital aplic.│ Acción registrada │
├──────┼────────────┼──────────────┼───────────────┼───────────────┼────────────────────┤
│ 008 │ 22/04/2026 │ ANTICIP.PARC │ S/. 8,000.00 │ S/. 6,073.21 │ Cronograma v2 │
│ 007 │ 15/04/2026 │ CUOTA NORMAL │ S/. 1,642.32 │ S/. 1,015.20 │ — │
│ … │ … │ … │ … │ … │ … │
└──────┴────────────┴──────────────┴───────────────┴───────────────┴────────────────────┘

text

---

## Diagrama de flujo resumido
[DETALLE DE OPERACIÓN ACTIVA]
│
▼ "Registrar pago anticipado"
[PANTALLA 1: VERIFICACIÓN DEL PAGO]
├── Ingresar monto, fecha, canal, referencia
├── Clasificación automática del pago
├── Cálculo de intereses devengados al día exacto
└── Desglose: cuota regular + capital anticipado
│
▼ Confirmar pago y continuar
[PANTALLA 2: ELECCIÓN DEL CLIENTE]
├── Opción A: Reducir plazo (mantener cuota)
│ └── Preview: nuevo plazo, ahorro en intereses
├── Opción B: Reducir cuota (mantener plazo)
│ └── Preview: nueva cuota, ahorro en intereses
└── Registro formal de la decisión del cliente
│
▼ Recalcular
[PANTALLA 3: NUEVO CRONOGRAMA]
├── Tabla de cuotas desde la siguiente
├── Comparativa antes vs. después
├── VAN y TIR residuales del deudor
└── Indicación: penalidad = S/. 0.00
│
▼ Confirmar
[PANTALLA 4: CONSTANCIA Y DOCUMENTOS]
├── Resumen final
├── Generar: constancia de pago anticipado
├── Generar: nuevo cronograma (PDF + Excel)
└── Guardar en BD → versión vN del cronograma
│
▼
[DETALLE DE OPERACIÓN — cronograma actualizado]
└── Historial de pagos muestra el evento

text

---

## Casos especiales y errores

| Situación                                 | Respuesta del sistema                          |
|-------------------------------------------|------------------------------------------------|
| Monto menor a la cuota exigible           | Error bloqueante: "El monto ingresado es menor |
|                                           | a la cuota exigible. Registra el pago como     |
|                                           | cuota normal o ingresa un monto mayor."        |
| Monto exacto al saldo total + intereses   | Sistema detecta cancelación total → deriva a   |
|                                           | modal: "Esto cubriría el saldo total.          |
|                                           | ¿Deseas registrar como cancelación total?"     |
| Fecha de pago futura                      | Validación bloqueante: "No se pueden registrar |
|                                           | pagos con fecha futura."                       |
| Pago en fecha de cuota exacta             | El sistema aplica el monto completo a la cuota |
|                                           | sin calcular intereses adicionales al día.     |
| Operación con cuotas vencidas sin pagar   | Advertencia: "Existen X cuotas vencidas.       |
|                                           | El pago se aplicará primero a saldar las       |
|                                           | cuotas vencidas y el excedente al capital."    |
| TIR no converge tras recalculo            | Mensaje informativo en panel de indicadores;   |
|                                           | no bloquea el guardado del pago.               |
| Asesor sin rol para registrar pagos       | Botón deshabilitado con tooltip:               |
|                                           | "Necesitas rol de Operador para registrar      |
|                                           | pagos. Contacta al administrador."             |

---

## Reglas de negocio críticas del flujo

### Regla 1: Cero penalidades
El sistema no puede bajo ningún parámetro de configuración habilitar
un cargo por pago anticipado. El campo "Penalidad" existe en el
formulario únicamente para mostrar S/. 0.00 de forma explícita y
documentar el cumplimiento normativo.

### Regla 2: Elección libre del cliente
La modalidad (reducir plazo vs. reducir cuota) es decisión exclusiva
del cliente. El sistema debe presentar ambas opciones con igual
prominencia visual, sin sugerir ni preseleccionar ninguna de ellas.

### Regla 3: Interés al día exacto
El interés devengado se calcula hasta la fecha exacta del pago,
no hasta el fin del período. La fórmula es:

  Interés al día = Saldo capital × TEM × (días desde última cuota / 30)

Esto garantiza que el cliente solo paga intereses por los días
que efectivamente usó el dinero.

### Regla 4: Nuevo cronograma obligatorio
Tras un pago anticipado parcial, el sistema debe emitir siempre un
nuevo cronograma. No es válido continuar usando el cronograma anterior.
La norma SBS reconoce explícitamente el derecho del cliente a recibir
el cronograma actualizado.

### Regla 5: Trazabilidad completa
Cada pago anticipado genera: un registro en `pagos`, una entrada en
`audit_log`, una nueva versión en `cronogramas` y un documento en
`constancias`. Los cuatro registros deben crearse en la misma
transacción de base de datos para garantizar consistencia.

---

## Registro en base de datos

### Tabla `pagos`
| Campo              | Ejemplo                        |
|--------------------|--------------------------------|
| id_pago            | PAG-2026-00312                 |
| id_operacion       | OPE-2026-00089                 |
| fecha_pago         | 2026-04-22                     |
| monto_total        | 8000.00                        |
| tipo_pago          | ANTICIPADO_PARCIAL             |
| cuota_aplicada     | 1642.32                        |
| interes_dia        | 284.47                         |
| capital_amortizado | 6073.21                        |
| saldo_anterior     | 38420.15                       |
| saldo_nuevo        | 32346.94                       |
| modalidad_cliente  | REDUCCION_PLAZO                |
| penalidad          | 0.00                           |
| canal_pago         | VENTANILLA                     |
| referencia         | TRF-00982341                   |
| id_usuario         | USR-014                        |

---

## Notas de implementación académica

- La tarjeta comparativa de Opción A vs. Opción B con los ahorros
  proyectados es el elemento de mayor impacto visual en la exposición
  y demuestra que el equipo entiende las implicancias financieras de
  cada modalidad.
- El campo "Penalidad: S/. 0.00" con referencia normativa explícita
  evidencia cumplimiento directo con la SBS y responde de forma
  proactiva a preguntas sobre derechos del consumidor financiero.
- El cálculo de intereses al día exacto (no al período completo)
  demuestra precisión matemática que va más allá del enunciado básico
  y que diferencia al equipo en la rúbrica.
- La generación automática de la constancia de pago anticipado con
  referencia a la base normativa es el documento de mayor valor
  regulatorio del flujo y refuerza la nota en el criterio de
  cumplimiento de la normativa peruana.