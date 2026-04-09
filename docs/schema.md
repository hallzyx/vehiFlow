# schema.md — Análisis de Datos y Modelo de Base de Datos
# SI642 — Finanzas e Ingeniería Económica — Ciclo 2026-10
# Crédito Vehicular "Compra Inteligente" — Sistema de Información

---

## Sección 1 — Análisis de Datos de Entrada

Los datos de entrada son todos los valores que el usuario ingresa
al sistema o que el sistema recibe como parámetros para ejecutar
los cálculos financieros. Se clasifican en cuatro grupos:
configuración financiera, datos del cliente, datos del vehículo
y datos de la operación de crédito.

---

### 1.1 — Grupo: Configuración de acceso

| Variable            | Descripción                          | Tipo    | Tamaño   | Formato          | Valor por defecto | Restricciones                              |
|---------------------|--------------------------------------|---------|----------|------------------|-------------------|--------------------------------------------|
| usuario             | Identificador de acceso del asesor   | String  | 50 chars | Alfanumérico     | —                 | Obligatorio; único en BD; no vacío         |
| contrasena          | Clave de acceso cifrada              | String  | 255 chars| Hash bcrypt      | —                 | Obligatorio; mínimo 8 caracteres; 1 mayús. |
| rol                 | Rol del usuario en el sistema        | Enum    | —        | ADMIN / ASESOR / | ASESOR            | Obligatorio; solo valores del Enum         |
|                     |                                      |         |          | ANALISTA /       |                   |                                            |
|                     |                                      |         |          | AUDITOR          |                   |                                            |

---

### 1.2 — Grupo: Datos del cliente

| Variable              | Descripción                           | Tipo    | Tamaño    | Formato                      | Valor por defecto | Restricciones                                       |
|-----------------------|---------------------------------------|---------|-----------|------------------------------|-------------------|-----------------------------------------------------|
| tipo_documento        | Tipo de documento de identidad        | Enum    | —         | DNI / CE / PASAPORTE         | DNI               | Obligatorio                                         |
| numero_documento      | Número del documento de identidad     | String  | 15 chars  | Alfanumérico                 | —                 | Obligatorio; 8 dígitos si DNI; único en BD          |
| nombres               | Nombres del cliente                   | String  | 100 chars | Solo letras y espacios       | —                 | Obligatorio; mínimo 2 caracteres                    |
| apellido_paterno      | Apellido paterno del cliente          | String  | 100 chars | Solo letras y espacios       | —                 | Obligatorio; mínimo 2 caracteres                    |
| apellido_materno      | Apellido materno del cliente          | String  | 100 chars | Solo letras y espacios       | —                 | Opcional                                            |
| celular               | Número de celular de contacto         | String  | 9 chars   | 9XXXXXXXX                    | —                 | Obligatorio; 9 dígitos; inicia en 9 (Perú)          |
| correo                | Correo electrónico del cliente        | String  | 150 chars | RFC 5321 email               | —                 | Obligatorio; formato válido; único en BD            |
| direccion             | Dirección de residencia               | String  | 200 chars | Texto libre                  | —                 | Obligatorio; mínimo 5 caracteres                    |
| fecha_nacimiento      | Fecha de nacimiento del cliente       | Date    | —         | DD/MM/YYYY                   | —                 | Opcional; no futura; mayor de 18 años               |
| ingresos_mensuales    | Ingresos mensuales declarados         | Decimal | 12,2      | 999,999,999.99               | —                 | Opcional; mayor a 0 si se ingresa                   |
| moneda_ingresos       | Moneda de los ingresos declarados     | Enum    | —         | PEN / USD                    | PEN               | Opcional                                            |
| situacion_laboral     | Situación laboral del cliente         | Enum    | —         | DEPENDIENTE /                | —                 | Opcional                                            |
|                       |                                       |         |           | INDEPENDIENTE / OTRO         |                   |                                                     |
| empresa_empleadora    | Empresa donde trabaja el cliente      | String  | 150 chars | Texto libre                  | —                 | Condicional: obligatorio si DEPENDIENTE             |

---

### 1.3 — Grupo: Datos del vehículo

| Variable                | Descripción                              | Tipo    | Tamaño   | Formato              | Valor por defecto | Restricciones                                     |
|-------------------------|------------------------------------------|---------|----------|----------------------|-------------------|---------------------------------------------------|
| marca                   | Marca del vehículo                       | String  | 50 chars | Texto libre          | —                 | Obligatorio; mínimo 2 caracteres                  |
| modelo                  | Modelo del vehículo                      | String  | 100 chars| Texto libre          | —                 | Obligatorio; mínimo 2 caracteres                  |
| version                 | Versión o trim del vehículo              | String  | 100 chars| Texto libre          | —                 | Opcional                                          |
| anio                    | Año de fabricación del vehículo          | Integer | 4 dígitos| YYYY                 | Año actual        | Obligatorio; entre 2000 y año actual + 1          |
| precio_lista            | Precio de venta al público               | Decimal | 12,2     | 999,999,999.99       | —                 | Obligatorio; mayor a 0                            |
| moneda_precio           | Moneda del precio de lista               | Enum    | —        | PEN / USD            | PEN               | Obligatorio                                       |
| concesionario           | Nombre del dealer o punto de venta       | String  | 150 chars| Texto libre          | —                 | Obligatorio; mínimo 2 caracteres                  |
| valor_residual_estimado | Valor residual del esquema C. Inteligente| Decimal | 12,2     | 999,999,999.99       | —                 | Opcional; mayor a 0; menor al precio de lista     |
| tipo_valor_residual     | Define si el residual es monto o porcent.| Enum    | —        | MONTO / PORCENTAJE   | MONTO             | Condicional: obligatorio si valor_residual > 0    |

---

### 1.4 — Grupo: Parámetros financieros de la operación

Estos son los datos de entrada más críticos del sistema, ya que
determinan todos los cálculos del motor financiero.

| Variable               | Descripción                                   | Tipo    | Tamaño | Formato          | Valor por defecto | Restricciones                                           |
|------------------------|-----------------------------------------------|---------|--------|------------------|-------------------|---------------------------------------------------------|
| moneda_operacion       | Moneda del crédito                            | Enum    | —      | PEN / USD        | PEN               | Obligatorio                                             |
| tipo_tasa              | Tipo de tasa ingresada por el usuario         | Enum    | —      | EFECTIVA /       | EFECTIVA          | Obligatorio                                             |
|                        |                                               |         |        | NOMINAL          |                   |                                                         |
| tasa_ingresada         | Valor de la tasa anual ingresada              | Decimal | 8,4    | 999.9999 (%)     | —                 | Obligatorio; mayor a 0; menor a tope BCRP              |
| capitalizacion         | Frecuencia de capitalización (solo si nominal)| Enum    | —      | DIARIA /         | MENSUAL           | Condicional: obligatorio si tipo_tasa = NOMINAL        |
|                        |                                               |         |        | SEMANAL /        |                   |                                                         |
|                        |                                               |         |        | QUINCENAL /      |                   |                                                         |
|                        |                                               |         |        | MENSUAL /        |                   |                                                         |
|                        |                                               |         |        | BIMESTRAL /      |                   |                                                         |
|                        |                                               |         |        | TRIMESTRAL /     |                   |                                                         |
|                        |                                               |         |        | SEMESTRAL /      |                   |                                                         |
|                        |                                               |         |        | ANUAL            |                   |                                                         |
| precio_vehiculo        | Precio del vehículo (editable en cotización)  | Decimal | 12,2   | 999,999,999.99   | precio_lista      | Obligatorio; mayor a 0                                 |
| cuota_inicial_pct      | Porcentaje de cuota inicial sobre el precio   | Decimal | 5,2    | 999.99 (%)       | 20.00             | Obligatorio; entre 0 y 99.99                           |
| cuota_inicial_monto    | Monto de la cuota inicial en moneda operación | Decimal | 12,2   | 999,999,999.99   | calculado         | Obligatorio; sincronizado con cuota_inicial_pct        |
| plazo_meses            | Plazo del crédito en meses                    | Integer | 3 dígit| 999              | 36                | Obligatorio; entre 6 y 84                              |
| fecha_desembolso       | Fecha de desembolso del crédito               | Date    | —      | DD/MM/YYYY       | Hoy               | Obligatorio; mayor o igual a hoy                       |
| fecha_primera_cuota    | Fecha de vencimiento de la primera cuota      | Date    | —      | DD/MM/YYYY       | desembolso + 30d  | Obligatorio; mayor a fecha_desembolso                  |
| gracia_flag            | Indica si existe período de gracia            | Boolean | —      | true / false     | false             | Obligatorio                                            |
| gracia_tipo            | Tipo de período de gracia                     | Enum    | —      | TOTAL / PARCIAL  | —                 | Condicional: obligatorio si gracia_flag = true         |
| gracia_meses           | Número de meses de gracia                     | Integer | 2 dígit| 99               | —                 | Condicional: obligatorio si gracia_flag = true;        |
|                        |                                               |         |        |                  |                   | entre 1 y 6                                            |
| residual_flag          | Indica si incluye valor residual (C.Int.)     | Boolean | —      | true / false     | false             | Obligatorio                                            |
| residual_monto         | Monto del valor residual / cuota balón final  | Decimal | 12,2   | 999,999,999.99   | estimado vehículo | Condicional: obligatorio si residual_flag = true;      |
|                        |                                               |         |        |                  |                   | mayor a 0; menor al monto financiado                   |
| seguro_desgravamen_pct | Tasa mensual del seguro de desgravamen        | Decimal | 6,4    | 99.9999 (%)      | 0.04              | Opcional; mayor o igual a 0; aplicado sobre saldo      |
| seguro_vehicular_anual | Prima anual del seguro vehicular              | Decimal | 10,2   | 9,999,999.99     | —                 | Opcional; mayor o igual a 0                            |
| gasto_gps              | Costo único de instalación de GPS             | Decimal | 10,2   | 9,999,999.99     | —                 | Opcional; mayor o igual a 0                            |
| gasto_notarial         | Gastos notariales únicos                      | Decimal | 10,2   | 9,999,999.99     | —                 | Opcional; mayor o igual a 0                            |
| tasa_moratoria_tea     | Tasa de interés moratorio efectiva anual      | Decimal | 8,4    | 999.9999 (%)     | igual compensat.  | Opcional; mayor a 0; no supera tope BCRP               |

---

### 1.5 — Grupo: Datos del pago anticipado (Userflow 3)

| Variable               | Descripción                                  | Tipo    | Tamaño | Formato        | Valor por defecto | Restricciones                                         |
|------------------------|----------------------------------------------|---------|--------|----------------|-------------------|-------------------------------------------------------|
| fecha_pago             | Fecha en que se realizó el pago              | Date    | —      | DD/MM/YYYY     | Hoy               | Obligatorio; menor o igual a hoy; no futura           |
| monto_pago_total       | Monto total del pago realizado               | Decimal | 12,2   | 999,999,999.99 | —                 | Obligatorio; mayor a 0; mayor a cuota exigible        |
| canal_pago             | Canal por el que se realizó el pago          | Enum    | —      | VENTANILLA /   | —                 | Obligatorio                                           |
|                        |                                              |         |        | TRANSFERENCIA /|                   |                                                       |
|                        |                                              |         |        | APP / DEBITO / |                   |                                                       |
|                        |                                              |         |        | OTRO           |                   |                                                       |
| referencia_pago        | Número de operación o referencia bancaria    | String  | 50chars| Alfanumérico   | —                 | Obligatorio; mínimo 4 caracteres                      |
| modalidad_anticipado   | Decisión del cliente sobre el excedente      | Enum    | —      | REDUCIR_PLAZO /| —                 | Obligatorio; elegida por el cliente, no pre-seleccionada|
|                        |                                              |         |        | REDUCIR_CUOTA  |                   |                                                       |

---

## Sección 2 — Análisis de Datos Intermedios

Los datos intermedios son variables calculadas internamente por el
motor financiero a partir de los datos de entrada. No son ingresados
por el usuario ni mostrados directamente como resultado final, pero
son necesarios para obtener los datos de salida.

| Variable               | Descripción                                             | Tipo    | Tamaño | Formato          |
|------------------------|---------------------------------------------------------|---------|--------|------------------|
| tea                    | Tasa Efectiva Anual normalizada (base de todos cálculos)| Decimal | 8,6    | 0.999999         |
| tem                    | Tasa Efectiva Mensual = (1+TEA)^(30/360) - 1           | Decimal | 10,8   | 0.99999999       |
| m_capitalizacion       | Número de capitalizaciones por año (si tasa nominal)    | Integer | 3 dígit| 999              |
| monto_financiado       | Capital prestado = precio - cuota_inicial_monto        | Decimal | 12,2   | 999,999,999.99   |
| cuota_base             | Cuota fija sin seguros ni gastos periódicos             | Decimal | 12,2   | 999,999,999.99   |
| cuota_gracia_parcial   | Cuota solo interés durante gracia parcial               | Decimal | 12,2   | 999,999,999.99   |
| saldo_post_gracia_total| Saldo capitalizado tras gracia total                    | Decimal | 12,2   | 999,999,999.99   |
| n_cuotas_amortizacion  | Número de cuotas de amortización efectiva               | Integer | 3 dígit| 999              |
| factor_actualizacion_k | (1+TEM)^(-k) para cada cuota k del cronograma          | Decimal | 12,10  | 0.9999999999     |
| interes_k              | Interés de la cuota k = Saldo_(k-1) × TEM              | Decimal | 12,2   | 999,999,999.99   |
| amortizacion_k         | Amortización de capital de la cuota k                  | Decimal | 12,2   | 999,999,999.99   |
| seguro_desgravamen_k   | Prima de desgravamen de la cuota k (% sobre saldo)     | Decimal | 10,2   | 9,999,999.99     |
| seguro_vehicular_k     | Prima vehicular mensualizada para la cuota k           | Decimal | 10,2   | 9,999,999.99     |
| flujo_total_k          | Flujo total del deudor en período k (para VAN y TIR)   | Decimal | 12,2   | 999,999,999.99   |
| suma_vp_flujos         | Sumatoria del valor presente de todos los flujos        | Decimal | 14,4   | 9,999,999,999.9999|
| interes_dia_anticipo   | Interés devengado al día exacto del pago anticipado    | Decimal | 12,2   | 999,999,999.99   |
| capital_amortizado_ant | Capital efectivamente reducido por el pago anticipado  | Decimal | 12,2   | 999,999,999.99   |
| saldo_post_anticipo    | Nuevo saldo capital tras aplicar el pago anticipado    | Decimal | 12,2   | 999,999,999.99   |
| nuevo_plazo_opcion_a   | Nuevo número de cuotas si cliente elige reducir plazo  | Integer | 3 dígit| 999              |
| nueva_cuota_opcion_b   | Nueva cuota fija si cliente elige reducir cuota        | Decimal | 12,2   | 999,999,999.99   |
| ajuste_ultima_cuota    | Diferencia por redondeo decimal en última cuota        | Decimal | 10,4   | 9,999,999.9999   |

---

## Sección 3 — Análisis de Datos de Salida

Los datos de salida son los resultados que el sistema presenta al
usuario: indicadores financieros, cronograma, hoja resumen y
documentos exportables.

### 3.1 — Indicadores financieros principales

| Variable              | Descripción                                              | Tipo    | Tamaño | Formato            |
|-----------------------|----------------------------------------------------------|---------|--------|--------------------|
| tcea                  | Tasa de Costo Efectivo Anual (exigida por SBS)           | Decimal | 8,4    | 99.9999 %          |
| van_deudor            | Valor Actual Neto desde perspectiva del deudor           | Decimal | 14,2   | ±9,999,999,999.99  |
| tir_deudor_mensual    | TIR mensual del flujo del deudor                         | Decimal | 8,6    | 99.999999 %        |
| tir_deudor_anual      | TIR anual equivalente = (1+TIR_m)^12 - 1                | Decimal | 8,4    | 99.9999 %          |
| cuota_mensual         | Cuota fija periódica (sin seguros ni gastos)             | Decimal | 12,2   | 999,999,999.99     |
| cuota_total_mensual   | Cuota total incluyendo seguros y gastos periódicos       | Decimal | 12,2   | 999,999,999.99     |
| total_intereses       | Suma de todos los intereses pagados en el crédito        | Decimal | 14,2   | 9,999,999,999.99   |
| total_seguros         | Suma de todas las primas de seguro pagadas               | Decimal | 12,2   | 999,999,999.99     |
| total_gastos          | Suma de todos los gastos trasladados al cliente          | Decimal | 12,2   | 999,999,999.99     |
| total_pagado          | Suma total de todos los desembolsos del deudor           | Decimal | 14,2   | 9,999,999,999.99   |
| costo_credito         | total_pagado - monto_financiado                          | Decimal | 14,2   | 9,999,999,999.99   |
| ahorro_anticipado     | Interés ahorrado por pago anticipado                     | Decimal | 12,2   | 999,999,999.99     |

### 3.2 — Cronograma de pagos (por cada cuota k)

| Variable           | Descripción                                    | Tipo    | Tamaño | Formato            |
|--------------------|------------------------------------------------|---------|--------|--------------------|
| numero_cuota       | Número secuencial de la cuota                  | Integer | 3 dígit| 999                |
| tipo_cuota         | Tipo de período de la cuota                    | Enum    | —      | GRACIA_TOTAL /     |
|                    |                                                |         |        | GRACIA_PARCIAL /   |
|                    |                                                |         |        | NORMAL / RESIDUAL  |
| fecha_vencimiento  | Fecha de vencimiento de la cuota               | Date    | —      | DD/MM/YYYY         |
| saldo_inicial      | Saldo de capital al inicio del período         | Decimal | 12,2   | 999,999,999.99     |
| interes            | Interés generado en el período                 | Decimal | 12,2   | 999,999,999.99     |
| amortizacion       | Capital amortizado en el período               | Decimal | 12,2   | 999,999,999.99     |
| seguro_desgravamen | Prima de desgravamen del período               | Decimal | 10,2   | 9,999,999.99       |
| seguro_vehicular   | Prima vehicular del período (mensualizada)     | Decimal | 10,2   | 9,999,999.99       |
| otros_gastos       | Gastos trasladables del período (GPS, etc.)    | Decimal | 10,2   | 9,999,999.99       |
| cuota_total        | Suma de todos los conceptos del período        | Decimal | 12,2   | 999,999,999.99     |
| saldo_final        | Saldo de capital al cierre del período         | Decimal | 12,2   | 999,999,999.99     |

### 3.3 — Hoja Resumen (documento de salida obligatorio por SBS)

| Campo del documento           | Origen                                          |
|-------------------------------|-------------------------------------------------|
| Nombre del producto           | Constante: "Crédito Vehicular — Compra Int."    |
| Moneda de la operación        | moneda_operacion                                |
| Monto total del crédito       | monto_financiado                                |
| Tasa compensatoria (TEA)      | tea (expresada como % anual, año 360 días)      |
| TCEA                          | tcea                                            |
| Plazo                         | plazo_meses                                     |
| Número de cuotas              | n_cuotas_amortizacion + gracia_meses            |
| Monto de la cuota normal      | cuota_total_mensual                             |
| Monto de la cuota en gracia   | cuota_gracia_parcial (si aplica)                |
| Monto última cuota (residual) | residual_monto + cuota_total_mensual            |
| Fecha de desembolso           | fecha_desembolso                                |
| Fecha de primera cuota        | fecha_primera_cuota                             |
| Fecha de vencimiento final    | fecha_vencimiento de la última cuota            |
| Total intereses               | total_intereses                                 |
| Total seguros                 | total_seguros                                   |
| Total gastos                  | total_gastos                                    |
| Total pagado                  | total_pagado                                    |
| VAN del deudor                | van_deudor                                      |
| TIR del deudor (anual)        | tir_deudor_anual                                |

---

## Sección 4 — Constantes del sistema

Las constantes son valores fijos que no cambia el usuario pero
que el motor financiero usa en cada cálculo.

| Constante                | Descripción                                    | Valor       | Base normativa              |
|--------------------------|------------------------------------------------|-------------|------------------------------|
| DIAS_MES                 | Días por mes para cálculo de intereses         | 30          | Práctica SBS / enunciado     |
| DIAS_ANIO                | Días del año base para expresión de tasas      | 360         | Res. SBS 8181-2012           |
| MESES_ANIO               | Meses del año para exponente de conversión     | 12          | Matemática financiera        |
| EXPONENTE_TEM            | Exponente para convertir TEA a TEM             | 30/360      | Res. SBS 8181-2012           |
| MAX_ITER_TIR             | Iteraciones máximas para calcular TIR (Newton) | 1000        | Precisión numérica           |
| TOLERANCIA_TIR           | Tolerancia de convergencia para la TIR         | 0.0000001   | Precisión numérica           |
| MAX_GRACIA_MESES         | Máximo de meses de gracia permitidos           | 6           | Política de la entidad       |
| MIN_PLAZO_MESES          | Plazo mínimo aceptado                          | 6           | Política de la entidad       |
| MAX_PLAZO_MESES          | Plazo máximo aceptado                          | 84          | Política de la entidad       |
| PENALIDAD_ANTICIPO       | Penalidad por pago anticipado                  | 0.00        | Ley 29571 Art. 85°           |
| MONEDAS_PERMITIDAS       | Monedas habilitadas para operar                | [PEN, USD]  | Enunciado del trabajo        |

---

## Sección 5 — Modelo Entidad-Relación

### 5.1 — Diagrama ER (notación texto)
┌───────────────┐ ┌───────────────┐
│ USUARIOS │ │ CLIENTES │
│───────────────│ │───────────────│
│ PK id_usuario │ │ PK id_cliente │
│ usuario │ │ tipo_doc │
│ contrasena │ │ num_doc │
│ nombre │ │ nombres │
│ rol │ │ ap_paterno │
│ estado │ │ ap_materno │
│ creado_en │ │ celular │
└───────┬───────┘ │ correo │
│ │ direccion │
│ crea/edita │ ingresos │
│ │ situacion │
▼ │ empresa │
┌───────────────┐ │ estado │
│ AUDIT_LOG │ │ creado_en │
│───────────────│ │ creado_por │
│ PK id_log │ └───────┬───────┘
│ entidad │ │
│ id_entidad │ tiene N│
│ accion │ │
│ campos_ant │ ┌───────┴───────┐
│ campos_nue │ │ COTIZACIONES │
│ id_usuario │ │───────────────│
│ fecha_hora │ │ PK id_cotiz │
└───────────────┘ │ FK id_cliente │◄──────────────────┐
│ FK id_vehiculo│ │
│ FK id_usuario │ │
│ version │ │
│ estado │ │
│ moneda │ │
│ tipo_tasa │ │
│ tasa_ingr │ │
│ capitaliz │ │
│ tea │ │
│ tem │ │
│ precio_veh │ │
│ cuota_ini │ │
│ monto_fin │ │
│ plazo_mes │ │
│ fec_desemb │ │
│ fec_1cuota │ │
│ gracia_flg │ │
│ gracia_tip │ │
│ gracia_mes │ │
│ resid_flg │ │
│ resid_monto│ │
│ seg_desgr │ │
│ seg_vehi │ │
│ gasto_gps │ │
│ gasto_not │ │
│ tcea │ │
│ van_deudor │ │
│ tir_m │ │
│ tir_a │ │
│ tot_pagado │ │
│ costo_cred │ │
│ motivo_ed │ │
│ creado_en │ │
└───────┬───────┘ │
│ │
contiene N │ pertenece a │
│ │
┌───────┴───────┐ ┌──────────┴────┐
│ CUOTAS │ │ VEHICULOS │
│───────────────│ │───────────────│
│ PK id_cuota │ │ PK id_vehiculo│
│ FK id_cotiz │ │ marca │
│ numero │ │ modelo │
│ tipo_cuota │ │ version │
│ fec_venc │ │ anio │
│ saldo_ini │ │ precio │
│ interes │ │ moneda │
│ amortiz │ │ concesion │
│ seg_desgr │ │ val_resid │
│ seg_vehi │ │ tipo_resid │
│ otros_gast │ │ tipo_veh │
│ cuota_tot │ │ transmision│
│ saldo_fin │ │ combustible│
└───────────────┘ │ estado │
│ creado_en │
│ creado_por │
└───────────────┘

┌───────────────┐
│ PAGOS │
│───────────────│
│ PK id_pago │
│ FK id_operac │◄──────────────────┐
│ fecha_pago │ │
│ monto_tot │ │
│ tipo_pago │ │
│ cuota_aplic│ │
│ interes_dia│ ┌──────────┴────┐
│ capital_am │ │ OPERACIONES │
│ saldo_ant │ │───────────────│
│ saldo_nvo │ │ PK id_operac │
│ modalidad │ │ FK id_cotiz │
│ penalidad │ │ estado_op │
│ canal_pago │ │ fec_inicio │
│ referencia │ │ fec_termino│
│ id_usuario │ │ saldo_act │
│ creado_en │ │ version_cr │
└───────────────┘ │ creado_en │
└───────────────┘

text

---

### 5.2 — Descripción de entidades

#### Entidad: USUARIOS
Almacena las credenciales y roles de los usuarios internos del sistema.

| Columna      | Tipo SQL        | PK/FK | Nulo | Descripción                         |
|--------------|-----------------|-------|------|-------------------------------------|
| id_usuario   | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| usuario      | VARCHAR(50)     | —     | NO   | Nombre de usuario único             |
| contrasena   | VARCHAR(255)    | —     | NO   | Hash bcrypt de la contraseña        |
| nombre_compl | VARCHAR(150)    | —     | NO   | Nombre completo para visualización  |
| rol          | VARCHAR(20)     | —     | NO   | ADMIN/ASESOR/ANALISTA/AUDITOR       |
| estado       | VARCHAR(10)     | —     | NO   | ACTIVO / INACTIVO                   |
| creado_en    | TIMESTAMP       | —     | NO   | Fecha y hora de creación            |

#### Entidad: CLIENTES
Directorio de clientes de la entidad financiera.

| Columna        | Tipo SQL        | PK/FK | Nulo | Descripción                         |
|----------------|-----------------|-------|------|-------------------------------------|
| id_cliente     | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| tipo_documento | VARCHAR(10)     | —     | NO   | DNI / CE / PASAPORTE                |
| num_documento  | VARCHAR(15)     | —     | NO   | Número del documento; único en BD   |
| nombres        | VARCHAR(100)    | —     | NO   | Nombres del cliente                 |
| ap_paterno     | VARCHAR(100)    | —     | NO   | Apellido paterno                    |
| ap_materno     | VARCHAR(100)    | —     | SÍ   | Apellido materno                    |
| celular        | VARCHAR(9)      | —     | NO   | Celular en formato peruano          |
| correo         | VARCHAR(150)    | —     | NO   | Correo electrónico; único en BD     |
| direccion      | VARCHAR(200)    | —     | NO   | Dirección de residencia             |
| fec_nacimiento | DATE            | —     | SÍ   | Fecha de nacimiento                 |
| ingresos_mens  | DECIMAL(12,2)   | —     | SÍ   | Ingresos mensuales declarados       |
| moneda_ingres  | VARCHAR(3)      | —     | SÍ   | PEN o USD                           |
| situacion_lab  | VARCHAR(20)     | —     | SÍ   | DEPENDIENTE/INDEPENDIENTE/OTRO      |
| empresa_empl   | VARCHAR(150)    | —     | SÍ   | Empresa empleadora                  |
| estado         | VARCHAR(10)     | —     | NO   | ACTIVO / ARCHIVADO                  |
| creado_en      | TIMESTAMP       | —     | NO   | Fecha y hora de registro            |
| creado_por     | INTEGER         | FK    | NO   | FK → USUARIOS.id_usuario            |

#### Entidad: VEHICULOS
Catálogo de vehículos disponibles para financiamiento.

| Columna          | Tipo SQL       | PK/FK | Nulo | Descripción                         |
|------------------|----------------|-------|------|-------------------------------------|
| id_vehiculo      | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| marca            | VARCHAR(50)    | —     | NO   | Marca del vehículo                  |
| modelo           | VARCHAR(100)   | —     | NO   | Modelo del vehículo                 |
| version          | VARCHAR(100)   | —     | SÍ   | Versión o trim                      |
| anio             | SMALLINT       | —     | NO   | Año de fabricación                  |
| precio_lista     | DECIMAL(12,2)  | —     | NO   | Precio de venta al público          |
| moneda_precio    | VARCHAR(3)     | —     | NO   | PEN o USD                           |
| concesionario    | VARCHAR(150)   | —     | NO   | Nombre del dealer                   |
| val_resid_est    | DECIMAL(12,2)  | —     | SÍ   | Valor residual estimado             |
| tipo_val_resid   | VARCHAR(12)    | —     | SÍ   | MONTO o PORCENTAJE                  |
| tipo_vehiculo    | VARCHAR(20)    | —     | SÍ   | SEDAN/SUV/CAMIONETA/etc.            |
| transmision      | VARCHAR(15)    | —     | SÍ   | MANUAL/AUTOMATICA/CVT               |
| combustible      | VARCHAR(15)    | —     | SÍ   | GASOLINA/DIESEL/HIBRIDO/ELECTRICO   |
| estado           | VARCHAR(10)    | —     | NO   | DISPONIBLE / ARCHIVADO              |
| creado_en        | TIMESTAMP      | —     | NO   | Fecha y hora de registro            |
| creado_por       | INTEGER        | FK    | NO   | FK → USUARIOS.id_usuario            |

#### Entidad: COTIZACIONES
Cada simulación de crédito vehicular generada por un asesor.
Una cotización puede tener múltiples versiones (v1, v2, ...).

| Columna        | Tipo SQL        | PK/FK | Nulo | Descripción                         |
|----------------|-----------------|-------|------|-------------------------------------|
| id_cotizacion  | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| id_cliente     | INTEGER         | FK    | NO   | FK → CLIENTES.id_cliente            |
| id_vehiculo    | INTEGER         | FK    | NO   | FK → VEHICULOS.id_vehiculo          |
| id_usuario     | INTEGER         | FK    | NO   | FK → USUARIOS.id_usuario (asesor)   |
| version        | SMALLINT        | —     | NO   | Número de versión (1, 2, 3, ...)    |
| estado         | VARCHAR(15)     | —     | NO   | BORRADOR/SIMULADA/PRESENTADA/       |
|                |                 |       |      | ARCHIVADA/ARCHIVADA_VERSION         |
| moneda_op      | VARCHAR(3)      | —     | NO   | PEN o USD                           |
| tipo_tasa      | VARCHAR(10)     | —     | NO   | EFECTIVA o NOMINAL                  |
| tasa_ingresada | DECIMAL(8,4)    | —     | NO   | Tasa ingresada por el usuario (%)   |
| capitalizacion | VARCHAR(15)     | —     | SÍ   | Frecuencia de capitalización        |
| tea            | DECIMAL(8,6)    | —     | NO   | TEA normalizada (decimal, no %)     |
| tem            | DECIMAL(10,8)   | —     | NO   | TEM calculada (decimal, no %)       |
| precio_veh     | DECIMAL(12,2)   | —     | NO   | Precio del vehículo en la cotización|
| cuota_ini_pct  | DECIMAL(5,2)    | —     | NO   | Porcentaje de cuota inicial         |
| cuota_ini_mnt  | DECIMAL(12,2)   | —     | NO   | Monto de cuota inicial              |
| monto_financ   | DECIMAL(12,2)   | —     | NO   | Capital financiado                  |
| plazo_meses    | SMALLINT        | —     | NO   | Plazo en meses                      |
| fec_desembolso | DATE            | —     | NO   | Fecha de desembolso                 |
| fec_1era_cuota | DATE            | —     | NO   | Fecha primera cuota                 |
| gracia_flag    | TINYINT(1)      | —     | NO   | Indica si hay período de gracia     |
| gracia_tipo    | VARCHAR(10)     | —     | SÍ   | TOTAL o PARCIAL                     |
| gracia_meses   | SMALLINT        | —     | SÍ   | Meses de gracia                     |
| residual_flag  | TINYINT(1)      | —     | NO   | Indica si hay valor residual        |
| residual_monto | DECIMAL(12,2)   | —     | SÍ   | Monto del valor residual            |
| seg_desgrav    | DECIMAL(6,4)    | —     | SÍ   | Tasa mensual seguro desgravamen (%) |
| seg_vehicular  | DECIMAL(10,2)   | —     | SÍ   | Prima anual seguro vehicular        |
| gasto_gps      | DECIMAL(10,2)   | —     | SÍ   | Costo GPS                           |
| gasto_notarial | DECIMAL(10,2)   | —     | SÍ   | Gastos notariales                   |
| tcea           | DECIMAL(8,4)    | —     | NO   | TCEA calculada (%)                  |
| van_deudor     | DECIMAL(14,2)   | —     | NO   | VAN del deudor                      |
| tir_mensual    | DECIMAL(8,6)    | —     | NO   | TIR mensual del deudor (decimal)    |
| tir_anual      | DECIMAL(8,4)    | —     | NO   | TIR anual del deudor (%)            |
| total_pagado   | DECIMAL(14,2)   | —     | NO   | Total a pagar por el deudor         |
| costo_credito  | DECIMAL(14,2)   | —     | NO   | Costo total del crédito             |
| motivo_edicion | VARCHAR(200)    | —     | SÍ   | Motivo del cambio (en v2, v3, ...)  |
| creado_en      | TIMESTAMP       | —     | NO   | Fecha y hora de creación            |

#### Entidad: CUOTAS
Detalle de cada cuota del cronograma asociado a una cotización.

| Columna        | Tipo SQL       | PK/FK | Nulo | Descripción                         |
|----------------|----------------|-------|------|-------------------------------------|
| id_cuota       | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| id_cotizacion  | INTEGER        | FK    | NO   | FK → COTIZACIONES.id_cotizacion     |
| numero         | SMALLINT       | —     | NO   | Número de la cuota (1, 2, 3, ...)   |
| tipo_cuota     | VARCHAR(15)    | —     | NO   | GRACIA_TOTAL/GRACIA_PARCIAL/NORMAL/ |
|                |                |       |      | RESIDUAL                            |
| fec_vencimient | DATE           | —     | NO   | Fecha de vencimiento de la cuota    |
| saldo_inicial  | DECIMAL(12,2)  | —     | NO   | Saldo de capital al inicio          |
| interes        | DECIMAL(12,2)  | —     | NO   | Interés del período                 |
| amortizacion   | DECIMAL(12,2)  | —     | NO   | Capital amortizado                  |
| seg_desgravame | DECIMAL(10,2)  | —     | NO   | Prima desgravamen del período       |
| seg_vehicular  | DECIMAL(10,2)  | —     | NO   | Prima vehicular mensualizada        |
| otros_gastos   | DECIMAL(10,2)  | —     | NO   | Otros gastos del período            |
| cuota_total    | DECIMAL(12,2)  | —     | NO   | Total de la cuota                   |
| saldo_final    | DECIMAL(12,2)  | —     | NO   | Saldo de capital al cierre          |

#### Entidad: OPERACIONES
Crédito vehicular formalizado (para el scope universitario puede
tener estado simulado; en producción requeriría flujo de aprobación).

| Columna        | Tipo SQL       | PK/FK | Nulo | Descripción                         |
|----------------|----------------|-------|------|-------------------------------------|
| id_operacion   | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| id_cotizacion  | INTEGER        | FK    | NO   | FK → COTIZACIONES.id_cotizacion     |
| estado_op      | VARCHAR(15)    | —     | NO   | ACTIVA / CANCELADA / CERRADA        |
| fec_inicio     | DATE           | —     | NO   | Fecha de inicio de la operación     |
| fec_termino    | DATE           | —     | SÍ   | Fecha de vencimiento final          |
| saldo_actual   | DECIMAL(12,2)  | —     | NO   | Saldo de capital vigente            |
| version_crono  | SMALLINT       | —     | NO   | Versión del cronograma vigente      |
| creado_en      | TIMESTAMP      | —     | NO   | Fecha y hora de creación            |

#### Entidad: PAGOS
Registro de todos los pagos realizados sobre una operación activa.

| Columna        | Tipo SQL       | PK/FK | Nulo | Descripción                         |
|----------------|----------------|-------|------|-------------------------------------|
| id_pago        | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental |
| id_operacion   | INTEGER        | FK    | NO   | FK → OPERACIONES.id_operacion       |
| fecha_pago     | DATE           | —     | NO   | Fecha del pago                      |
| monto_total    | DECIMAL(12,2)  | —     | NO   | Monto total pagado                  |
| tipo_pago      | VARCHAR(20)    | —     | NO   | CUOTA_NORMAL/ANTICIPADO_PARCIAL/    |
|                |                |       |      | CANCELACION_TOTAL                   |
| cuota_aplicada | DECIMAL(12,2)  | —     | NO   | Monto aplicado a cuota del período  |
| interes_dia    | DECIMAL(12,2)  | —     | NO   | Interés devengado al día del pago   |
| capital_amort  | DECIMAL(12,2)  | —     | NO   | Capital amortizado anticipadamente  |
| saldo_anterior | DECIMAL(12,2)  | —     | NO   | Saldo antes del pago                |
| saldo_nuevo    | DECIMAL(12,2)  | —     | NO   | Saldo después del pago              |
| modalidad      | VARCHAR(20)    | —     | SÍ   | REDUCIR_PLAZO / REDUCIR_CUOTA       |
| penalidad      | DECIMAL(10,2)  | —     | NO   | Siempre 0.00 (Ley 29571 Art. 85°)  |
| canal_pago     | VARCHAR(20)    | —     | NO   | VENTANILLA/TRANSFERENCIA/etc.       |
| referencia     | VARCHAR(50)    | —     | NO   | Número de operación bancaria        |
| id_usuario     | INTEGER        | FK    | NO   | FK → USUARIOS.id_usuario            |
| creado_en      | TIMESTAMP      | —     | NO   | Fecha y hora de registro            |

#### Entidad: AUDIT_LOG
Registro de todas las acciones sensibles del sistema para trazabilidad.

| Columna         | Tipo SQL       | PK/FK | Nulo | Descripción                        |
|-----------------|----------------|-------|------|------------------------------------|
| id_log          | BIGINT UNSIGNED AUTO_INCREMENT | PK    | NO   | Identificador único autoincremental|
| entidad         | VARCHAR(30)    | —     | NO   | CLIENTES/VEHICULOS/COTIZACIONES/.. |
| id_entidad      | INTEGER        | —     | NO   | ID del registro modificado         |
| accion          | VARCHAR(30)    | —     | NO   | CREACION/EDICION/ARCHIVADO/LOGIN/..| 
| campos_anteriores| JSON          | —     | SÍ   | Valores antes del cambio           |
| campos_nuevos   | JSON           | —     | SÍ   | Valores después del cambio         |
| id_usuario      | INTEGER        | FK    | NO   | FK → USUARIOS.id_usuario           |
| fecha_hora      | TIMESTAMP      | —     | NO   | Fecha y hora exacta del evento     |

---

## Sección 6 — Índices recomendados

```sql
-- Búsqueda rápida de clientes por documento
CREATE UNIQUE INDEX idx_clientes_documento
  ON clientes(tipo_documento, num_documento);

-- Búsqueda rápida de clientes por correo
CREATE UNIQUE INDEX idx_clientes_correo
  ON clientes(correo);

-- Cotizaciones por cliente (historial del cliente)
CREATE INDEX idx_cotizaciones_cliente
  ON cotizaciones(id_cliente);

-- Cotizaciones por vehículo (ficha del vehículo)
CREATE INDEX idx_cotizaciones_vehiculo
  ON cotizaciones(id_vehiculo);

-- Cuotas por cotización (generación del cronograma)
CREATE INDEX idx_cuotas_cotizacion
  ON cuotas(id_cotizacion, numero);

-- Pagos por operación (historial de pagos)
CREATE INDEX idx_pagos_operacion
  ON pagos(id_operacion, fecha_pago);

-- Audit log por entidad (trazabilidad)
CREATE INDEX idx_audit_entidad
  ON audit_log(entidad, id_entidad, fecha_hora);
```

---

## Sección 7 — Relaciones y cardinalidades

| Relación                        | Tipo       | Descripción                                    |
|---------------------------------|------------|------------------------------------------------|
| USUARIOS → COTIZACIONES         | 1 : N      | Un asesor crea muchas cotizaciones             |
| CLIENTES → COTIZACIONES         | 1 : N      | Un cliente tiene muchas cotizaciones           |
| VEHICULOS → COTIZACIONES        | 1 : N      | Un vehículo aparece en muchas cotizaciones     |
| COTIZACIONES → CUOTAS           | 1 : N      | Una cotización tiene N cuotas en el cronograma |
| COTIZACIONES → OPERACIONES      | 1 : 1      | Una cotización puede formalizarse en 1 operac. |
| OPERACIONES → PAGOS             | 1 : N      | Una operación puede tener N pagos registrados  |
| USUARIOS → AUDIT_LOG            | 1 : N      | Un usuario genera N entradas en el log         |
| Cualquier entidad → AUDIT_LOG   | 1 : N      | Toda entidad sensible genera registros de log  |

---


## Sección 8 — Reglas de integridad referencial

Estas reglas definen el comportamiento de la base de datos ante
operaciones de modificación o eliminación en registros padre.

```sql
-- COTIZACIONES referencia a CLIENTES
ALTER TABLE cotizaciones
  ADD CONSTRAINT fk_cotiz_cliente
  FOREIGN KEY (id_cliente)
  REFERENCES clientes(id_cliente)
  ON DELETE RESTRICT    -- No se puede eliminar un cliente con cotizaciones
  ON UPDATE CASCADE;

-- COTIZACIONES referencia a VEHICULOS
ALTER TABLE cotizaciones
  ADD CONSTRAINT fk_cotiz_vehiculo
  FOREIGN KEY (id_vehiculo)
  REFERENCES vehiculos(id_vehiculo)
  ON DELETE RESTRICT    -- No se puede eliminar un vehículo con cotizaciones
  ON UPDATE CASCADE;

-- COTIZACIONES referencia a USUARIOS
ALTER TABLE cotizaciones
  ADD CONSTRAINT fk_cotiz_usuario
  FOREIGN KEY (id_usuario)
  REFERENCES usuarios(id_usuario)
  ON DELETE RESTRICT    -- No se puede eliminar un asesor con cotizaciones
  ON UPDATE CASCADE;

-- CUOTAS referencia a COTIZACIONES
ALTER TABLE cuotas
  ADD CONSTRAINT fk_cuotas_cotizacion
  FOREIGN KEY (id_cotizacion)
  REFERENCES cotizaciones(id_cotizacion)
  ON DELETE CASCADE;    -- Si se elimina la cotización, se eliminan sus cuotas

-- OPERACIONES referencia a COTIZACIONES
ALTER TABLE operaciones
  ADD CONSTRAINT fk_operac_cotizacion
  FOREIGN KEY (id_cotizacion)
  REFERENCES cotizaciones(id_cotizacion)
  ON DELETE RESTRICT;   -- No se puede eliminar una cotización formalizada

-- PAGOS referencia a OPERACIONES
ALTER TABLE pagos
  ADD CONSTRAINT fk_pagos_operacion
  FOREIGN KEY (id_operacion)
  REFERENCES operaciones(id_operacion)
  ON DELETE RESTRICT;   -- No se puede eliminar una operación con pagos

-- PAGOS referencia a USUARIOS
ALTER TABLE pagos
  ADD CONSTRAINT fk_pagos_usuario
  FOREIGN KEY (id_usuario)
  REFERENCES usuarios(id_usuario)
  ON DELETE RESTRICT;

-- AUDIT_LOG referencia a USUARIOS
ALTER TABLE audit_log
  ADD CONSTRAINT fk_audit_usuario
  FOREIGN KEY (id_usuario)
  REFERENCES usuarios(id_usuario)
  ON DELETE RESTRICT;

-- CLIENTES referencia a USUARIOS (creado_por)
ALTER TABLE clientes
  ADD CONSTRAINT fk_clientes_creador
  FOREIGN KEY (creado_por)
  REFERENCES usuarios(id_usuario)
  ON DELETE RESTRICT;

-- VEHICULOS referencia a USUARIOS (creado_por)
ALTER TABLE vehiculos
  ADD CONSTRAINT fk_vehiculos_creador
  FOREIGN KEY (creado_por)
  REFERENCES usuarios(id_usuario)
  ON DELETE RESTRICT;
```

**Principio general:**
El sistema nunca elimina físicamente registros financieros. Toda
operación de "baja" cambia el campo `estado` a ARCHIVADO/INACTIVO.
Las eliminaciones físicas (`DELETE`) están reservadas únicamente
para datos de prueba en entorno de desarrollo.

---

## Sección 9 — Reglas de negocio a nivel de datos

Estas restricciones se implementan como `CHECK CONSTRAINTS` en la
base de datos y como validaciones de capa de servicio en el backend.
La doble capa garantiza que los datos sean consistentes incluso si
alguien interactúa directamente con la BD.

### 9.1 — Constraints en tabla CLIENTES

```sql
-- El número de documento tiene longitud correcta según el tipo
ALTER TABLE clientes ADD CONSTRAINT chk_doc_longitud
  CHECK (
    (tipo_documento = 'DNI'      AND LENGTH(num_documento) = 8) OR
    (tipo_documento = 'CE'       AND LENGTH(num_documento) BETWEEN 9 AND 12) OR
    (tipo_documento = 'PASAPORTE' AND LENGTH(num_documento) BETWEEN 5 AND 15)
  );

-- El celular inicia en 9 (numeración peruana)
ALTER TABLE clientes ADD CONSTRAINT chk_celular_peru
  CHECK (REGEXP_LIKE(celular, '^9[0-9]{8}$'));

-- Los ingresos, si se ingresan, deben ser positivos
ALTER TABLE clientes ADD CONSTRAINT chk_ingresos_positivos
  CHECK (ingresos_mens IS NULL OR ingresos_mens > 0);

-- Si la situación es DEPENDIENTE, la empresa no puede estar vacía
-- (se valida en capa de servicio porque SQL CHECK no puede
--  referenciar fácilmente campos condicionales con NULL)
```

### 9.2 — Constraints en tabla VEHICULOS

```sql
-- El año del vehículo no puede ser anterior al 2000
ALTER TABLE vehiculos ADD CONSTRAINT chk_anio_minimo
  CHECK (anio >= 2000);

-- El año del vehículo no puede superar el año en curso + 1
-- (modelos del próximo año ya se comercializan)
-- Se valida en capa de servicio con fecha dinámica.

-- El precio debe ser positivo
ALTER TABLE vehiculos ADD CONSTRAINT chk_precio_positivo
  CHECK (precio_lista > 0);

-- El valor residual, si existe, debe ser positivo
ALTER TABLE vehiculos ADD CONSTRAINT chk_residual_positivo
  CHECK (val_resid_est IS NULL OR val_resid_est > 0);

-- Si hay tipo_val_resid, debe existir val_resid_est
ALTER TABLE vehiculos ADD CONSTRAINT chk_residual_consistente
  CHECK (
    (val_resid_est IS NULL AND tipo_val_resid IS NULL) OR
    (val_resid_est IS NOT NULL AND tipo_val_resid IS NOT NULL)
  );
```

### 9.3 — Constraints en tabla COTIZACIONES

```sql
-- La cuota inicial no puede superar el precio del vehículo
ALTER TABLE cotizaciones ADD CONSTRAINT chk_cuota_ini_vs_precio
  CHECK (cuota_ini_mnt < precio_veh);

-- El monto financiado debe ser positivo
ALTER TABLE cotizaciones ADD CONSTRAINT chk_monto_financ_positivo
  CHECK (monto_financ > 0);

-- El plazo debe estar dentro del rango permitido
ALTER TABLE cotizaciones ADD CONSTRAINT chk_plazo_rango
  CHECK (plazo_meses BETWEEN 6 AND 84);

-- La primera cuota debe ser posterior al desembolso
ALTER TABLE cotizaciones ADD CONSTRAINT chk_fechas_cuota
  CHECK (fec_1era_cuota > fec_desembolso);

-- Si hay período de gracia, los campos de gracia deben estar completos
ALTER TABLE cotizaciones ADD CONSTRAINT chk_gracia_completa
  CHECK (
    (gracia_flag = FALSE) OR
    (gracia_flag = TRUE AND gracia_tipo IS NOT NULL AND gracia_meses BETWEEN 1 AND 6)
  );

-- Si hay residual, el monto debe estar presente y ser positivo
ALTER TABLE cotizaciones ADD CONSTRAINT chk_residual_completo
  CHECK (
    (residual_flag = FALSE) OR
    (residual_flag = TRUE AND residual_monto IS NOT NULL AND residual_monto > 0)
  );

-- El residual no puede superar el monto financiado
ALTER TABLE cotizaciones ADD CONSTRAINT chk_residual_vs_financiado
  CHECK (
    residual_monto IS NULL OR
    residual_monto < monto_financ
  );

-- La TCEA siempre debe ser mayor o igual a la TEA
-- (se valida en capa de servicio por ser cálculo derivado)

-- La versión de cotización debe ser positiva
ALTER TABLE cotizaciones ADD CONSTRAINT chk_version_positiva
  CHECK (version >= 1);
```

### 9.4 — Constraints en tabla CUOTAS

```sql
-- El número de cuota debe ser positivo
ALTER TABLE cuotas ADD CONSTRAINT chk_numero_cuota
  CHECK (numero >= 1);

-- Los montos no pueden ser negativos
ALTER TABLE cuotas ADD CONSTRAINT chk_montos_no_negativos
  CHECK (
    saldo_inicial  >= 0 AND
    interes        >= 0 AND
    amortizacion   >= 0 AND
    seg_desgravame >= 0 AND
    seg_vehicular  >= 0 AND
    otros_gastos   >= 0 AND
    cuota_total    >= 0 AND
    saldo_final    >= 0
  );

-- El saldo final no puede ser mayor al saldo inicial
ALTER TABLE cuotas ADD CONSTRAINT chk_saldo_decreciente
  CHECK (saldo_final <= saldo_inicial);
```

### 9.5 — Constraints en tabla PAGOS

```sql
-- La penalidad siempre debe ser 0 (Ley 29571 Art. 85°)
ALTER TABLE pagos ADD CONSTRAINT chk_penalidad_cero
  CHECK (penalidad = 0.00);

-- El monto total debe ser positivo
ALTER TABLE pagos ADD CONSTRAINT chk_monto_pago_positivo
  CHECK (monto_total > 0);

-- El saldo nuevo debe ser menor o igual al saldo anterior
ALTER TABLE pagos ADD CONSTRAINT chk_saldo_pago
  CHECK (saldo_nuevo <= saldo_anterior);

-- El saldo final no puede ser negativo
ALTER TABLE pagos ADD CONSTRAINT chk_saldo_no_negativo
  CHECK (saldo_nuevo >= 0);
```

---

## Sección 10 — Diccionario de estados

### 10.1 — Estados de CLIENTES

| Estado      | Descripción                                             | Transiciones permitidas  |
|-------------|---------------------------------------------------------|--------------------------|
| `ACTIVO`    | Cliente operativo, puede asociarse a cotizaciones       | → ARCHIVADO              |
| `ARCHIVADO` | Cliente dado de baja. No puede tener cotizaciones nuevas| → ACTIVO (reactivación)  |

### 10.2 — Estados de VEHICULOS

| Estado        | Descripción                                           | Transiciones permitidas  |
|---------------|-------------------------------------------------------|--------------------------|
| `DISPONIBLE`  | Vehículo activo en catálogo, puede cotizarse          | → ARCHIVADO              |
| `ARCHIVADO`   | Vehículo fuera de catálogo; cotizaciones pasadas intactas | → DISPONIBLE          |

### 10.3 — Estados de COTIZACIONES
BORRADOR ──► SIMULADA ──► PRESENTADA ──► [operación formalizada]
│ │ │
└────────────┴──────────────┴──► ARCHIVADA

Si se edita una cotización PRESENTADA:
PRESENTADA ──► ARCHIVADA_VERSION (versión anterior)
+ nueva BORRADOR (nueva versión, version+1)

text

| Estado              | Descripción                                             |
|---------------------|---------------------------------------------------------|
| `BORRADOR`          | En construcción, datos incompletos o en revisión        |
| `SIMULADA`          | Cálculos ejecutados, cronograma generado, lista para presentar |
| `PRESENTADA`        | Entregada o enviada al cliente para su evaluación       |
| `ARCHIVADA`         | Descartada definitivamente (no llegó a formalizarse)    |
| `ARCHIVADA_VERSION` | Versión anterior de una cotización editada; conservada  |
|                     | para historial y auditoría                              |

### 10.4 — Estados de OPERACIONES

| Estado      | Descripción                                             | Transiciones permitidas          |
|-------------|---------------------------------------------------------|----------------------------------|
| `ACTIVA`    | Crédito vigente con cuotas pendientes                   | → CANCELADA, → CERRADA           |
| `CANCELADA` | Cancelada por el cliente (pago anticipado total)        | — (estado final)                 |
| `CERRADA`   | Todas las cuotas pagadas regularmente                   | — (estado final)                 |

### 10.5 — Estados de USUARIOS

| Estado     | Descripción                                              | Transiciones permitidas  |
|------------|----------------------------------------------------------|--------------------------|
| `ACTIVO`   | Usuario habilitado para iniciar sesión                   | → INACTIVO               |
| `INACTIVO` | Usuario deshabilitado. No puede iniciar sesión.          | → ACTIVO (reactivación)  |

---



## Sección 11 — Flujo de datos completo: entrada → intermedio → salida
╔══════════════════════════════════════════════════════════════════╗
║ DATOS DE ENTRADA (usuario) ║
╠══════════════════════════════════════════════════════════════════╣
║ tipo_tasa + tasa_ingresada + capitalización ║
║ precio_vehiculo + cuota_inicial ║
║ plazo_meses + fecha_desembolso + fecha_primera_cuota ║
║ gracia_flag + gracia_tipo + gracia_meses ║
║ residual_flag + residual_monto ║
║ seg_desgravamen_pct + seg_vehicular_anual ║
║ gasto_gps + gasto_notarial ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 1 — NORMALIZACIÓN DE TASA ║
╠══════════════════════════════════════════════════════════════════╣
║ Si NOMINAL: TNA + capitalización → TEA ║
║ TEA = (1 + TNA/m)^m - 1 ║
║ Si EFECTIVA: tasa_ingresada → TEA directamente ║
║ ║
║ TEA → TEM = (1 + TEA)^(30/360) - 1 ║
║ ║
║ Intermedios: tea, tem, m_capitalizacion ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 2 — CÁLCULO DEL CAPITAL ║
╠══════════════════════════════════════════════════════════════════╣
║ monto_financiado = precio_vehiculo - cuota_inicial_monto ║
║ ║
║ Si residual_flag = TRUE: ║
║ VP_residual = residual_monto / (1 + TEM)^n ║
║ capital_activo = monto_financiado - VP_residual ║
║ (residual NO se amortiza en cuotas; es cuota balón final) ║
║ ║
║ Si residual_flag = FALSE: ║
║ capital_activo = monto_financiado ║
║ ║
║ Intermedios: monto_financiado, VP_residual, capital_activo ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 3 — MANEJO DEL PERÍODO DE GRACIA ║
╠══════════════════════════════════════════════════════════════════╣
║ Si gracia_flag = FALSE: ║
║ → Salta al Paso 4 con capital_activo y plazo originales ║
║ ║
║ Si gracia_tipo = PARCIAL (g meses): ║
║ cuota_gracia_parcial = capital_activo × TEM ║
║ n_cuotas_amortizacion = plazo_meses ← plazo NO se reduce ║
║ saldo_para_amortizar = capital_activo ← no cambia ║
║ ║
║ Si gracia_tipo = TOTAL (g meses): ║
║ saldo_post_gracia = capital_activo × (1 + TEM)^g ║
║ n_cuotas_amortizacion = plazo_meses ← plazo NO se reduce ║
║ saldo_para_amortizar = saldo_post_gracia ← capital creció ║
║ ║
║ Intermedios: cuota_gracia_parcial, saldo_post_gracia_total, ║
║ n_cuotas_amortizacion, saldo_para_amortizar ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 4 — CÁLCULO DE LA CUOTA BASE ║
╠══════════════════════════════════════════════════════════════════╣
║ ║
║ saldo_para_amortizar × TEM ║
║ C = ────────────────────────────────── ║
║ 1 - (1 + TEM)^(-n_cuotas_amortizacion) ║
║ ║
║ Esta cuota cubre solo interés + amortización de capital. ║
║ Los seguros y gastos se suman cuota a cuota en el Paso 5. ║
║ ║
║ Intermedio: cuota_base ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 5 — GENERACIÓN DEL CRONOGRAMA ║
╠══════════════════════════════════════════════════════════════════╣
║ n_total = gracia_meses + n_cuotas_amortizacion ║
║ (+ 1 si residual_flag, para la cuota balón final) ║
║ ║
║ Para k = 1 hasta n_total: ║
║ ║
║ ┌─ k ≤ gracia_meses AND tipo = TOTAL ──────────────────────┐ ║
║ │ interes_k = Saldo_(k-1) × TEM │ ║
║ │ amortizacion_k = 0.00 │ ║
║ │ Saldo_k = Saldo_(k-1) + interes_k (capitaliza) │ ║
║ │ tipo_cuota = GRACIA_TOTAL │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌─ k ≤ gracia_meses AND tipo = PARCIAL ─────────────────────┐ ║
║ │ interes_k = Saldo_(k-1) × TEM │ ║
║ │ amortizacion_k = 0.00 │ ║
║ │ Saldo_k = Saldo_(k-1) (no varía) │ ║
║ │ tipo_cuota = GRACIA_PARCIAL │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌─ k = última cuota AND residual_flag = TRUE ────────────────┐ ║
║ │ interes_k = Saldo_(k-1) × TEM │ ║
║ │ amortizacion_k = Saldo_(k-1) (liquida todo) │ ║
║ │ cuota_balon = residual_monto │ ║
║ │ cuota_total_k = interes_k + amortizacion_k + residual │ ║
║ │ Saldo_k = 0.00 │ ║
║ │ tipo_cuota = RESIDUAL │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌─ Cuota normal ─────────────────────────────────────────────┐ ║
║ │ interes_k = Saldo_(k-1) × TEM │ ║
║ │ amortizacion_k = cuota_base - interes_k │ ║
║ │ Saldo_k = Saldo_(k-1) - amortizacion_k │ ║
║ │ tipo_cuota = NORMAL │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ Para TODAS las cuotas se agregan: ║
║ seg_desgravamen_k = Saldo_(k-1) × seg_desgravamen_pct ║
║ seg_vehicular_k = seg_vehicular_anual / 12 ║
║ gastos_k = gasto_gps (solo cuota 1) + ║
║ gasto_notarial (solo cuota 1) ║
║ flujo_total_k = amortizacion_k + interes_k ║
║ + seg_desgravamen_k + seg_vehicular_k ║
║ + gastos_k ║
║ ║
║ Ajuste de última cuota: ║
║ Si Saldo_(n-1) ≠ amortizacion_n → ajuste_ultima_cuota ║
║ se aplica para forzar Saldo_n = 0.00 exacto ║
║ ║
║ Intermedios por cuota: interes_k, amortizacion_k, ║
║ seg_desgravamen_k, seg_vehicular_k, flujo_total_k, ║
║ ajuste_ultima_cuota ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 6 — CÁLCULO DE INDICADORES ║
╠══════════════════════════════════════════════════════════════════╣
║ ║
║ TCEA → tasa r que resuelve (Newton-Raphson): ║
║ n flujo_total_k ║
║ P = Σ ────────────────────── ║
║ k=1 (1 + r/360×30)^k ║
║ ║
║ Donde P = monto_financiado desembolsado ║
║ Tolerancia: 0.0000001 | Máx iteraciones: 1000 ║
║ ║
║ TIR_deudor_mensual → tasa r que resuelve: ║
║ 0 = -P + Σ [ flujo_total_k / (1 + r)^k] ║
║ (mismo Newton-Raphson; r aquí es tasa mensual) ║
║ ║
║ TIR_deudor_anual = (1 + TIR_mensual)^12 - 1 ║
║ ║
║ VAN_deudor = -P + Σ [ flujo_total_k / (1 + i)^k] ║
║ Donde i = TEM (tasa de descuento de referencia) ║
║ VAN < 0 confirma que el crédito tiene costo real ║
║ ║
║ total_intereses = Σ interes_k (todas las cuotas) ║
║ total_seguros = Σ (seg_desgravamen_k + seg_vehicular_k) ║
║ total_gastos = gasto_gps + gasto_notarial ║
║ total_pagado = monto_financiado + total_intereses ║
║ + total_seguros + total_gastos ║
║ costo_credito = total_pagado - monto_financiado ║
║ ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO 7 — DATOS DE SALIDA (presentación) ║
╠══════════════════════════════════════════════════════════════════╣
║ ║
║ ┌─ CRONOGRAMA ──────────────────────────────────────────────┐ ║
║ │ Tabla con n_total filas, una por cuota. │ ║
║ │ Columnas: N° · Fecha · Saldo ini · Interés · Amort. · │ ║
║ │ Desgrav · Veh · Otros · Cuota total · Saldo fin│ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌─ PANEL DE INDICADORES ─────────────────────────────────────┐ ║
║ │ Cuota mensual | TCEA | Total pagado | Costo crédito │ ║
║ │ VAN deudor | TIR anual deudor │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
║ ┌─ HOJA RESUMEN (PDF exportable — Res. SBS 8181-2012) ──────┐ ║
║ │ Todos los campos del Anexo 3 + Beneficios/Riesgos/Cond. │ ║
║ └───────────────────────────────────────────────────────────┘ ║
║ ║
╚══════════════════════════════════════════════════════════════════╝


---

## Sección 12 — Flujo de datos del pago anticipado
╔══════════════════════════════════════════════════════════════════╗
║ ENTRADA: PAGO ANTICIPADO ║
╠══════════════════════════════════════════════════════════════════╣
║ fecha_pago + monto_total + canal + referencia + modalidad ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO A — Calcular interés devengado al día exacto ║
╠══════════════════════════════════════════════════════════════════╣
║ dias_transcurridos = fecha_pago - fecha_ultima_cuota_pagada ║
║ interes_dia = saldo_actual × TEM × (dias_transcurridos / 30) ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO B — Aplicar el pago ║
╠══════════════════════════════════════════════════════════════════╣
║ capital_amortizado = monto_total - interes_dia ║
║ saldo_post_anticipo = saldo_actual - capital_amortizado ║
║ penalidad = 0.00 (Ley 29571 Art. 85° — siempre cero) ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO C — Bifurcación según modalidad elegida ║
╠════════════════════════════╦═════════════════════════════════════╣
║ REDUCIR_PLAZO ║ REDUCIR_CUOTA ║
╠════════════════════════════╬═════════════════════════════════════╣
║ nuevo_plazo = resolver n ║ nueva_cuota = recalcular C ║
║ tal que la cuota_base ║ con el mismo n restante ║
║ original cierra el ║ y el nuevo saldo ║
║ nuevo saldo ║ ║
║ ║ nueva_C = saldo_post × TEM ║
║ n' = -ln(1 - saldo ×TEM ║ / (1-(1+TEM)^(-n_rest)) ║
║ / cuota_base) ║ ║
║ / ln(1+TEM) ║ ║
╚════════════════════════════╩═════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ PASO D — Regenerar cronograma + recalcular indicadores ║
╠══════════════════════════════════════════════════════════════════╣
║ Ejecutar Pasos 5 y 6 completos desde el nuevo saldo ║
║ Generar nueva TCEA, nuevo VAN, nueva TIR, nuevo total_pagado ║
║ Calcular ahorro_anticipado = intereses_evitados ║
╚══════════════════════╦═══════════════════════════════════════════╝
║
▼
╔══════════════════════════════════════════════════════════════════╗
║ SALIDA: NUEVO CRONOGRAMA + COMPARATIVA ║
╠══════════════════════════════════════════════════════════════════╣
║ Tabla cronograma actualizado ║
║ Cuadro comparativo: antes vs después del pago anticipado ║
║ Saldo anterior vs Saldo nuevo ║
║ Plazo anterior vs Plazo nuevo (si REDUCIR_PLAZO) ║
║ Cuota anterior vs Cuota nueva (si REDUCIR_CUOTA) ║
║ Total intereses antes vs Total intereses después ║
║ Ahorro en intereses = diferencia ║
╚══════════════════════════════════════════════════════════════════╝

## Sección 13 — Versionado de cotizaciones

Cuando un asesor edita una cotización que ya fue presentada al
cliente, el sistema crea una nueva versión en lugar de sobrescribir.
Esto garantiza trazabilidad total exigida por la Res. SBS 3274-2017.
COTIZACIÓN ORIGINAL (v1, estado = PRESENTADA)
│
│ El asesor hace clic en "Editar cotización"
│
├── La v1 cambia estado → ARCHIVADA_VERSION
│ (se conserva en BD con todos sus datos y su cronograma)
│
└── Se crea COTIZACIÓN v2 (estado = BORRADOR)
Hereda todos los valores de v1 como punto de partida
El asesor modifica los campos necesarios
Al guardar: v2 estado → SIMULADA
El motivo_edicion queda registrado en v2

En la interfaz:
Tab "Versión actual" → muestra la versión más reciente
Tab "Historial de versiones" → lista v1, v2, v3… con fechas,
asesor y motivo del cambio

text

### 13.1 — Regla de versionado por tipo de campo modificado

| Campo modificado             | ¿Crea nueva versión? | Justificación                                 |
|------------------------------|----------------------|-----------------------------------------------|
| Tasa de interés              | SÍ                   | Cambia TCEA, cronograma y todos los indicadores |
| Plazo                        | SÍ                   | Cambia cuota, cronograma e indicadores        |
| Precio del vehículo          | SÍ                   | Cambia monto financiado y todos los cálculos  |
| Cuota inicial                | SÍ                   | Cambia monto financiado y todos los cálculos  |
| Período de gracia            | SÍ                   | Cambia estructura completa del cronograma     |
| Valor residual               | SÍ                   | Cambia cuota base y estructura del cronograma |
| Seguros y gastos             | SÍ                   | Cambia TCEA y flujos del deudor               |
| Fecha de desembolso          | SÍ                   | Cambia todas las fechas del cronograma        |
| Notas internas del asesor    | NO                   | Campo informativo; no afecta cálculos         |
| Datos del cliente            | NO                   | Se editan en el módulo de clientes (Userflow 4)|
| Datos del vehículo           | NO                   | Se editan en el catálogo de vehículos         |

### 13.2 — Identificación única de versiones
Formato de identificador de cotización:
COT-{AÑO}-{SECUENCIAL-5DIGITOS}-V{VERSION}

Ejemplo:
COT-2026-00089-V1 ← versión original
COT-2026-00089-V2 ← primera edición
COT-2026-00089-V3 ← segunda edición

El id_cotizacion en BD es el mismo para todas las versiones.
El campo version discrimina cuál es cuál.
La combinación (id_cotizacion, version) es UNIQUE en la tabla.

text

---

## Sección 14 — Trazabilidad y auditoría

Todo evento sensible del sistema queda registrado en la tabla
`AUDIT_LOG`. La siguiente tabla define qué acciones generan entrada
en el log, con qué nivel de detalle y quién puede consultarlas.

### 14.1 — Acciones auditadas

| Módulo           | Acción                         | Campos registrados en log              | Consulta permitida a |
|------------------|--------------------------------|----------------------------------------|----------------------|
| USUARIOS         | LOGIN exitoso                  | ip, user_agent, fecha_hora             | ADMIN                |
| USUARIOS         | LOGIN fallido                  | usuario_intentado, ip, fecha_hora      | ADMIN                |
| USUARIOS         | Creación de usuario            | Todos los campos excepto contraseña    | ADMIN                |
| USUARIOS         | Cambio de rol                  | rol_anterior, rol_nuevo                | ADMIN                |
| USUARIOS         | Desactivación                  | estado_anterior = ACTIVO               | ADMIN                |
| CLIENTES         | Creación                       | Todos los campos del cliente           | ADMIN / ASESOR       |
| CLIENTES         | Edición                        | Campos antes y después del cambio      | ADMIN / ASESOR       |
| CLIENTES         | Archivado / Reactivación       | estado_anterior, estado_nuevo          | ADMIN / ASESOR       |
| VEHICULOS        | Creación                       | Todos los campos del vehículo          | ADMIN / ASESOR       |
| VEHICULOS        | Edición                        | Campos antes y después del cambio      | ADMIN / ASESOR       |
| VEHICULOS        | Archivado / Reactivación       | estado_anterior, estado_nuevo          | ADMIN / ASESOR       |
| COTIZACIONES     | Creación (v1)                  | Todos los parámetros financieros       | ADMIN / ASESOR       |
| COTIZACIONES     | Nueva versión (v2, v3…)        | motivo_edicion + campos modificados    | ADMIN / ASESOR       |
| COTIZACIONES     | Cambio de estado               | estado_anterior, estado_nuevo          | ADMIN / ASESOR       |
| COTIZACIONES     | Exportación PDF                | id_cotizacion, versión, fecha_hora     | ADMIN / ASESOR       |
| PAGOS            | Registro de pago               | Todos los campos del pago              | ADMIN / ASESOR       |
| PAGOS            | Pago anticipado                | modalidad, capital_amortizado, ahorro  | ADMIN / ASESOR       |
| OPERACIONES      | Cambio de estado               | estado_anterior, estado_nuevo          | ADMIN / ASESOR       |

### 14.2 — Política de retención del log
Período de retención mínimo: 5 años desde la fecha del evento
Base normativa: Res. SBS 3274-2017 (gestión de conducta de mercado)

Restricciones:
- Ningún usuario puede eliminar entradas del AUDIT_LOG
- Solo el rol ADMIN puede consultar el log completo
- El rol AUDITOR puede consultar el log en modo solo lectura
- Los logs de LOGIN solo son visibles para ADMIN
- Los registros de contraseñas nunca se almacenan en texto plano
ni en el log (solo el hash en la tabla USUARIOS)

text

---

## Sección 15 — Consideraciones de precisión numérica

El motor financiero trabaja con valores monetarios y tasas que
requieren una política explícita de redondeo para garantizar que
los cronogramas cuadren centavo a centavo y que la TCEA sea
reproducible por el cliente (exigencia de la Res. SBS 8181-2012).

### 15.1 — Política de redondeo

| Tipo de valor                  | Precisión en cálculo | Precisión en presentación | Método de redondeo     |
|--------------------------------|----------------------|---------------------------|------------------------|
| Tasas (TEM, TEA, TCEA)         | 10 decimales         | 4 decimales (%)           | HALF_UP                |
| Montos intermedios (interes_k) | 10 decimales         | 2 decimales               | HALF_UP en cada cuota  |
| Montos en cronograma           | 2 decimales          | 2 decimales               | HALF_UP                |
| Cuota base calculada           | 10 decimales         | 2 decimales               | HALF_UP                |
| Saldo de capital               | 10 decimales         | 2 decimales               | HALF_UP                |
| VAN del deudor                 | 10 decimales         | 2 decimales               | HALF_UP                |
| TIR (mensual y anual)          | 10 decimales         | 4 decimales (%)           | HALF_UP                |

### 15.2 — Ajuste de última cuota

Debido al redondeo acumulado cuota a cuota, el saldo al final de
la penúltima cuota puede no ser exactamente igual a la amortización
que produciría la cuota base. La política es:
Si |Saldo_(n-1)| ≤ cuota_base × 1.05:
→ La última cuota se ajusta para cerrar exactamente en 0.00
→ El ajuste se registra en el campo ajuste_ultima_cuota
→ Se muestra en la interfaz como nota al pie del cronograma:
"(*) Última cuota ajustada por S/. X.XX por efecto de redondeo"

Si |Saldo_(n-1)| > cuota_base × 1.05:
→ Error de cálculo; el sistema relanza el motor con mayor
precisión antes de presentar el cronograma al usuario

text

### 15.3 — Manejo de la moneda USD

Cuando la operación se pacta en dólares americanos (USD):
Todos los cálculos del motor financiero se realizan en USD.
Los tipos de cambio NO son responsabilidad del motor financiero.
La Hoja Resumen expresa los montos en la moneda pactada (USD).
La conversión referencial a PEN (si el usuario la solicita)
usa el tipo de cambio venta del BCRP del día de la cotización,
almacenado como campo informativo en la cotización (no afecta
ningún cálculo financiero).
La tasa de interés en USD puede diferir de la tasa en PEN;
el sistema no realiza conversión automática entre monedas.


---

## Sección 16 — Scripts DDL completos

Script de creación de todas las tablas en MySQL, listo para
ejecutar en el entorno de desarrollo del proyecto.

```sql
-- ============================================================
-- DDL — Sistema de Crédito Vehicular "Compra Inteligente"
-- Base de datos: MySQL 8.0+
-- Codificación: UTF-8
-- Motor recomendado: InnoDB
-- ============================================================

-- USUARIOS
CREATE TABLE usuarios (
  id_usuario    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  usuario       VARCHAR(50)     NOT NULL UNIQUE,
  contrasena    VARCHAR(255)    NOT NULL,
  nombre_compl  VARCHAR(150)    NOT NULL,
  rol           VARCHAR(20)     NOT NULL
                CHECK (rol IN ('ADMIN','ASESOR','ANALISTA','AUDITOR')),
  estado        VARCHAR(10)     NOT NULL DEFAULT 'ACTIVO'
                CHECK (estado IN ('ACTIVO','INACTIVO')),
  creado_en     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CLIENTES
CREATE TABLE clientes (
  id_cliente      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  tipo_documento  VARCHAR(10)     NOT NULL
                  CHECK (tipo_documento IN ('DNI','CE','PASAPORTE')),
  num_documento   VARCHAR(15)     NOT NULL,
  nombres         VARCHAR(100)    NOT NULL,
  ap_paterno      VARCHAR(100)    NOT NULL,
  ap_materno      VARCHAR(100),
  celular         VARCHAR(9)      NOT NULL,
  correo          VARCHAR(150)    NOT NULL UNIQUE,
  direccion       VARCHAR(200)    NOT NULL,
  fec_nacimiento  DATE,
  ingresos_mens   DECIMAL(12,2)   CHECK (ingresos_mens IS NULL OR ingresos_mens > 0),
  moneda_ingres   VARCHAR(3)      CHECK (moneda_ingres IN ('PEN','USD')),
  situacion_lab   VARCHAR(20)     CHECK (situacion_lab IN
                  ('DEPENDIENTE','INDEPENDIENTE','OTRO')),
  empresa_empl    VARCHAR(150),
  estado          VARCHAR(10)     NOT NULL DEFAULT 'ACTIVO'
                  CHECK (estado IN ('ACTIVO','ARCHIVADO')),
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_por      BIGINT UNSIGNED NOT NULL,
  CONSTRAINT uq_cliente_doc UNIQUE (tipo_documento, num_documento),
  CONSTRAINT chk_doc_longitud CHECK (
    (tipo_documento = 'DNI'       AND LENGTH(num_documento) = 8) OR
    (tipo_documento = 'CE'        AND LENGTH(num_documento) BETWEEN 9 AND 12) OR
    (tipo_documento = 'PASAPORTE' AND LENGTH(num_documento) BETWEEN 5 AND 15)
  ),
  CONSTRAINT chk_celular_peru CHECK (REGEXP_LIKE(celular, '^9[0-9]{8}$')),
  CONSTRAINT fk_clientes_usuario_creador FOREIGN KEY (creado_por)
    REFERENCES usuarios(id_usuario)
);

-- VEHICULOS
CREATE TABLE vehiculos (
  id_vehiculo     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  marca           VARCHAR(50)     NOT NULL,
  modelo          VARCHAR(100)    NOT NULL,
  version         VARCHAR(100),
  anio            SMALLINT        NOT NULL CHECK (anio >= 2000),
  precio_lista    DECIMAL(12,2)   NOT NULL CHECK (precio_lista > 0),
  moneda_precio   VARCHAR(3)      NOT NULL CHECK (moneda_precio IN ('PEN','USD')),
  concesionario   VARCHAR(150)    NOT NULL,
  val_resid_est   DECIMAL(12,2)   CHECK (val_resid_est IS NULL OR val_resid_est > 0),
  tipo_val_resid  VARCHAR(12)     CHECK (tipo_val_resid IN ('MONTO','PORCENTAJE')),
  tipo_vehiculo   VARCHAR(20),
  transmision     VARCHAR(15),
  combustible     VARCHAR(15),
  estado          VARCHAR(15)     NOT NULL DEFAULT 'DISPONIBLE'
                  CHECK (estado IN ('DISPONIBLE','ARCHIVADO')),
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  creado_por      BIGINT UNSIGNED NOT NULL,
  CONSTRAINT chk_residual_consistente CHECK (
    (val_resid_est IS NULL AND tipo_val_resid IS NULL) OR
    (val_resid_est IS NOT NULL AND tipo_val_resid IS NOT NULL)
  ),
  CONSTRAINT fk_vehiculos_usuario_creador FOREIGN KEY (creado_por)
    REFERENCES usuarios(id_usuario)
);

-- COTIZACIONES
CREATE TABLE cotizaciones (
  id_cotizacion   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_cliente      BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_cotizaciones_cliente FOREIGN KEY (id_cliente)
                                  REFERENCES clientes(id_cliente)
                                  ON DELETE RESTRICT ON UPDATE CASCADE,
  id_vehiculo     BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_cotizaciones_vehiculo FOREIGN KEY (id_vehiculo)
                                  REFERENCES vehiculos(id_vehiculo)
                                  ON DELETE RESTRICT ON UPDATE CASCADE,
  id_usuario      BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_cotizaciones_usuario FOREIGN KEY (id_usuario)
                                  REFERENCES usuarios(id_usuario)
                                  ON DELETE RESTRICT ON UPDATE CASCADE,
  version         SMALLINT        NOT NULL DEFAULT 1 CHECK (version >= 1),
  estado          VARCHAR(20)     NOT NULL DEFAULT 'BORRADOR'
                  CHECK (estado IN (
                    'BORRADOR','SIMULADA','PRESENTADA',
                    'ARCHIVADA','ARCHIVADA_VERSION'
                  )),
  moneda_op       VARCHAR(3)      NOT NULL CHECK (moneda_op IN ('PEN','USD')),
  tipo_tasa       VARCHAR(10)     NOT NULL CHECK (tipo_tasa IN ('EFECTIVA','NOMINAL')),
  tasa_ingresada  DECIMAL(8,4)    NOT NULL CHECK (tasa_ingresada > 0),
  capitalizacion  VARCHAR(15)     CHECK (capitalizacion IN (
                    'DIARIA','SEMANAL','QUINCENAL','MENSUAL',
                    'BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL'
                  )),
  tea             DECIMAL(8,6)    NOT NULL CHECK (tea > 0),
  tem             DECIMAL(10,8)   NOT NULL CHECK (tem > 0),
  precio_veh      DECIMAL(12,2)   NOT NULL CHECK (precio_veh > 0),
  cuota_ini_pct   DECIMAL(5,2)    NOT NULL CHECK (cuota_ini_pct BETWEEN 0 AND 99.99),
  cuota_ini_mnt   DECIMAL(12,2)   NOT NULL CHECK (cuota_ini_mnt >= 0),
  monto_financ    DECIMAL(12,2)   NOT NULL CHECK (monto_financ > 0),
  plazo_meses     SMALLINT        NOT NULL CHECK (plazo_meses BETWEEN 6 AND 84),
  fec_desembolso  DATE            NOT NULL,
  fec_1era_cuota  DATE            NOT NULL,
  gracia_flag     TINYINT(1)      NOT NULL DEFAULT 0,
  gracia_tipo     VARCHAR(10)     CHECK (gracia_tipo IN ('TOTAL','PARCIAL')),
  gracia_meses    SMALLINT        CHECK (gracia_meses BETWEEN 1 AND 6),
  residual_flag   TINYINT(1)      NOT NULL DEFAULT 0,
  residual_monto  DECIMAL(12,2)   CHECK (residual_monto IS NULL OR residual_monto > 0),
  seg_desgrav     DECIMAL(6,4)    DEFAULT 0 CHECK (seg_desgrav >= 0),
  seg_vehicular   DECIMAL(10,2)   DEFAULT 0 CHECK (seg_vehicular >= 0),
  gasto_gps       DECIMAL(10,2)   DEFAULT 0 CHECK (gasto_gps >= 0),
  gasto_notarial  DECIMAL(10,2)   DEFAULT 0 CHECK (gasto_notarial >= 0),
  tcea            DECIMAL(8,4)    NOT NULL CHECK (tcea >= 0),
  van_deudor      DECIMAL(14,2)   NOT NULL,
  tir_mensual     DECIMAL(8,6)    NOT NULL,
  tir_anual       DECIMAL(8,4)    NOT NULL,
  total_pagado    DECIMAL(14,2)   NOT NULL CHECK (total_pagado > 0),
  costo_credito   DECIMAL(14,2)   NOT NULL,
  motivo_edicion  VARCHAR(200),
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_cotiz_version UNIQUE (id_cotizacion, version),
  CONSTRAINT chk_fechas_cuota CHECK (fec_1era_cuota > fec_desembolso),
  CONSTRAINT chk_cuota_ini_vs_precio CHECK (cuota_ini_mnt < precio_veh),
  CONSTRAINT chk_gracia_completa CHECK (
     (gracia_flag = 0) OR
     (gracia_flag = 1 AND gracia_tipo IS NOT NULL
     AND gracia_meses BETWEEN 1 AND 6)
  ),
  CONSTRAINT chk_residual_completo CHECK (
     (residual_flag = 0) OR
     (residual_flag = 1 AND residual_monto IS NOT NULL
     AND residual_monto > 0)
  ),
  CONSTRAINT chk_residual_vs_financiado CHECK (
    residual_monto IS NULL OR residual_monto < monto_financ
  )
);

-- CUOTAS
CREATE TABLE cuotas (
  id_cuota        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_cotizacion   BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_cuotas_cotizacion FOREIGN KEY (id_cotizacion)
                                  REFERENCES cotizaciones(id_cotizacion)
                                  ON DELETE CASCADE ON UPDATE CASCADE,
  numero          SMALLINT        NOT NULL CHECK (numero >= 1),
  tipo_cuota      VARCHAR(15)     NOT NULL
                  CHECK (tipo_cuota IN (
                    'GRACIA_TOTAL','GRACIA_PARCIAL','NORMAL','RESIDUAL'
                  )),
  fec_vencimient  DATE            NOT NULL,
  saldo_inicial   DECIMAL(12,2)   NOT NULL CHECK (saldo_inicial >= 0),
  interes         DECIMAL(12,2)   NOT NULL CHECK (interes >= 0),
  amortizacion    DECIMAL(12,2)   NOT NULL CHECK (amortizacion >= 0),
  seg_desgravame  DECIMAL(10,2)   NOT NULL DEFAULT 0 CHECK (seg_desgravame >= 0),
  seg_vehicular   DECIMAL(10,2)   NOT NULL DEFAULT 0 CHECK (seg_vehicular >= 0),
  otros_gastos    DECIMAL(10,2)   NOT NULL DEFAULT 0 CHECK (otros_gastos >= 0),
  cuota_total     DECIMAL(12,2)   NOT NULL CHECK (cuota_total >= 0),
  saldo_final     DECIMAL(12,2)   NOT NULL CHECK (saldo_final >= 0),
  CONSTRAINT chk_saldo_decreciente CHECK (saldo_final <= saldo_inicial),
  CONSTRAINT uq_cuota_numero UNIQUE (id_cotizacion, numero)
);

-- OPERACIONES
CREATE TABLE operaciones (
  id_operacion    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_cotizacion   BIGINT UNSIGNED NOT NULL UNIQUE,
  CONSTRAINT fk_operaciones_cotizacion FOREIGN KEY (id_cotizacion)
                                  REFERENCES cotizaciones(id_cotizacion)
                                  ON DELETE RESTRICT,
  estado_op       VARCHAR(15)     NOT NULL DEFAULT 'ACTIVA'
                  CHECK (estado_op IN ('ACTIVA','CANCELADA','CERRADA')),
  fec_inicio      DATE            NOT NULL,
  fec_termino     DATE,
  saldo_actual    DECIMAL(12,2)   NOT NULL CHECK (saldo_actual >= 0),
  version_crono   SMALLINT        NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PAGOS
CREATE TABLE pagos (
  id_pago         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id_operacion    BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_pagos_operacion FOREIGN KEY (id_operacion)
                                  REFERENCES operaciones(id_operacion)
                                  ON DELETE RESTRICT,
  fecha_pago      DATE            NOT NULL,
  monto_total     DECIMAL(12,2)   NOT NULL CHECK (monto_total > 0),
  tipo_pago       VARCHAR(25)     NOT NULL
                  CHECK (tipo_pago IN (
                    'CUOTA_NORMAL','ANTICIPADO_PARCIAL','CANCELACION_TOTAL'
                  )),
  cuota_aplicada  DECIMAL(12,2)   NOT NULL DEFAULT 0,
  interes_dia     DECIMAL(12,2)   NOT NULL DEFAULT 0,
  capital_amort   DECIMAL(12,2)   NOT NULL DEFAULT 0,
  saldo_anterior  DECIMAL(12,2)   NOT NULL CHECK (saldo_anterior >= 0),
  saldo_nuevo     DECIMAL(12,2)   NOT NULL CHECK (saldo_nuevo >= 0),
  modalidad       VARCHAR(20)     CHECK (modalidad IN ('REDUCIR_PLAZO','REDUCIR_CUOTA')),
  penalidad       DECIMAL(10,2)   NOT NULL DEFAULT 0.00
                  CHECK (penalidad = 0.00),
  canal_pago      VARCHAR(20)     NOT NULL
                  CHECK (canal_pago IN (
                    'VENTANILLA','TRANSFERENCIA','APP','DEBITO','OTRO'
                  )),
  referencia      VARCHAR(50)     NOT NULL,
  id_usuario      BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_pagos_usuario FOREIGN KEY (id_usuario)
                                  REFERENCES usuarios(id_usuario)
                                  ON DELETE RESTRICT,
  creado_en       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_saldo_pago CHECK (saldo_nuevo <= saldo_anterior)
);

-- AUDIT_LOG
CREATE TABLE audit_log (
  id_log            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  entidad           VARCHAR(30)   NOT NULL,
  id_entidad        BIGINT UNSIGNED NOT NULL,
  accion            VARCHAR(30)   NOT NULL,
  campos_anteriores JSON,
  campos_nuevos     JSON,
  id_usuario        BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_audit_usuario FOREIGN KEY (id_usuario)
                                  REFERENCES usuarios(id_usuario)
                                  ON DELETE RESTRICT,
  fecha_hora        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE UNIQUE INDEX idx_clientes_documento
  ON clientes(tipo_documento, num_documento);

CREATE UNIQUE INDEX idx_clientes_correo
  ON clientes(correo);

CREATE INDEX idx_cotizaciones_cliente
  ON cotizaciones(id_cliente);

CREATE INDEX idx_cotizaciones_vehiculo
  ON cotizaciones(id_vehiculo);

CREATE INDEX idx_cuotas_cotizacion
  ON cuotas(id_cotizacion, numero);

CREATE INDEX idx_pagos_operacion
  ON pagos(id_operacion, fecha_pago);

CREATE INDEX idx_audit_entidad
  ON audit_log(entidad, id_entidad, fecha_hora);

CREATE INDEX idx_audit_usuario
  ON audit_log(id_usuario, fecha_hora);
```

---

## Sección 17 — Datos semilla (seed data)

Script de datos iniciales para el entorno de desarrollo. Incluye
un usuario administrador, un asesor de prueba y tres vehículos
de referencia con sus valores residuales estimados.

```sql
-- ============================================================
-- SEED DATA — Entorno de desarrollo y demo
-- ============================================================

-- Usuario ADMIN (contraseña: Admin2026! → hash bcrypt)
INSERT INTO usuarios (usuario, contrasena, nombre_compl, rol, estado)
VALUES (
  'admin',
  '$2b$12$KIX8HaUTe4j2JLgFzM9xNuYv7tR6QpW3cB1sDnA5mZoEhVXkl0PiO',
  'Administrador del Sistema',
  'ADMIN',
  'ACTIVO'
);

-- Usuario ASESOR de prueba (contraseña: Asesor2026!)
INSERT INTO usuarios (usuario, contrasena, nombre_compl, rol, estado)
VALUES (
  'a.torres',
  '$2b$12$Mx3NpLk7WvB9TzYu4Qr1HeAcDiF6JgR8sVnK2oXlZmPbEwUdCt5qH',
  'Andrea Torres Vega',
  'ASESOR',
  'ACTIVO'
);

-- Vehículo 1 — Toyota Corolla (segmento sedán más cotizado en Perú)
INSERT INTO vehiculos (
  marca, modelo, version, anio, precio_lista, moneda_precio,
  concesionario, val_resid_est, tipo_val_resid,
  tipo_vehiculo, transmision, combustible, estado, creado_por
) VALUES (
  'Toyota', 'Corolla', 'XEi 2.0', 2026, 95990.00, 'PEN',
  'Toyota del Perú - San Borja', 23997.50, 'MONTO',
  'SEDAN', 'AUTOMATICA', 'GASOLINA', 'DISPONIBLE', 1
);

-- Vehículo 2 — Hyundai Tucson (SUV referencia)
INSERT INTO vehiculos (
  marca, modelo, version, anio, precio_lista, moneda_precio,
  concesionario, val_resid_est, tipo_val_resid,
  tipo_vehiculo, transmision, combustible, estado, creado_por
) VALUES (
  'Hyundai', 'Tucson', 'GL 2.0', 2026, 129900.00, 'PEN',
  'Hyundai Perú - Miraflores', 32475.00, 'MONTO',
  'SUV', 'AUTOMATICA', 'GASOLINA', 'DISPONIBLE', 1
);

-- Vehículo 3 — Kia Picanto (segmento económico, cuota baja)
INSERT INTO vehiculos (
  marca, modelo, version, anio, precio_lista, moneda_precio,
  concesionario, val_resid_est, tipo_val_resid,
  tipo_vehiculo, transmision, combustible, estado, creado_por
) VALUES (
  'Kia', 'Picanto', 'EX 1.2', 2026, 54990.00, 'PEN',
  'Kia Perú - Surco', 13747.50, 'MONTO',
  'SEDAN', 'MANUAL', 'GASOLINA', 'DISPONIBLE', 1
);

-- Cliente de prueba 1
INSERT INTO clientes (
  tipo_documento, num_documento, nombres, ap_paterno, ap_materno,
  celular, correo, direccion, situacion_lab, empresa_empl,
  estado, creado_por
) VALUES (
  'DNI', '45678901', 'Juan Carlos', 'Pérez', 'Quispe',
  '987654321', 'jperez@correo.pe',
  'Av. Universitaria 1245, Los Olivos, Lima',
  'DEPENDIENTE', 'Empresa Ejemplo SAC',
  'ACTIVO', 2
);
```

---

text
## Sección 18 — Glosario de términos del modelo de datos

| Término técnico        | Significado en el contexto del sistema                         |
|------------------------|----------------------------------------------------------------|
| `id_cotizacion`        | Identificador que agrupa todas las versiones de una cotización |
| `version`              | Número de iteración de la cotización (1 = original)           |
| `monto_financ`         | Capital desembolsado por la entidad al cliente                 |
| `capital_activo`       | Porción del capital sobre la que se calculan las cuotas;       |
|                        | excluye VP del residual en Compra Inteligente                  |
| `cuota_base`           | Cuota que cubre solo interés y amortización (sin seguros)      |
| `cuota_total`          | Cuota que el cliente paga incluyendo seguros y gastos          |
| `flujo_total_k`        | Toda salida de dinero del deudor en el período k;              |
|                        | base del cálculo de TCEA y TIR                                 |
| `saldo_para_amort`     | Saldo desde el cual inicia la amortización efectiva;           |
|                        | puede diferir de monto_financ si hubo gracia total             |
| `ajuste_ultima_cuota`  | Diferencia de redondeo concentrada en la cuota final           |
| `AUDIT_LOG`            | Tabla inmutable de auditoría; ningún usuario puede editarla    |
| `ARCHIVADA_VERSION`    | Estado de una cotización superada por una versión más nueva    |
| `penalidad = 0.00`     | Restricción legal permanente — Ley 29571 Art. 85°              |
| `VP_residual`          | Valor presente del monto residual descontado a la TEM          |
| `n_cuotas_amortizacion`| Cuotas en las que se amortiza capital efectivamente;           |
|                        | no incluye los meses de gracia                                 |
| `n_total`              | Total de filas del cronograma = gracia_meses +                 |
|                        | n_cuotas_amortizacion (+ 1 si residual)                        |
| `seg_desgravamen`      | Seguro que cancela el saldo deudor si el cliente fallece;      |
|                        | su prima se calcula sobre el saldo vigente cada período        |
| `seg_vehicular`        | Seguro contra daños al vehículo; prima anual mensualizada      |
| `TCEA`                 | Tasa de Costo Efectivo Anual; indicador legal SBS que incluye  |
|                        | intereses + seguros + gastos trasladados al deudor             |
| `TIR_deudor`           | Tasa Interna de Retorno calculada desde el flujo del deudor;   |
|                        | similar a la TCEA pero sin gastos de período 0                 |
| `VAN_deudor`           | Valor Actual Neto del deudor; siempre ≤ 0 cuando el crédito   |
|                        | tiene costo real (el deudor paga más de lo que recibe)         |
| `ahorro_anticipado`    | Intereses futuros evitados gracias al pago anticipado parcial  |
| `motivo_edicion`       | Texto libre obligatorio al crear v2, v3…; queda en el log     |

---

## Sección 19 — Consultas SQL de uso frecuente

Queries de referencia para el equipo de desarrollo. Cubren los
casos de uso más comunes del sistema sin necesidad de construir
las consultas desde cero durante la implementación.

### 19.1 — Historial completo de cotizaciones de un cliente

```sql
SELECT
  c.id_cotizacion,
  c.version,
  c.estado,
  c.moneda_op,
  c.monto_financ,
  c.plazo_meses,
  ROUND(c.tcea, 4)        AS tcea_pct,
  c.total_pagado,
  v.marca || ' ' || v.modelo || ' ' || COALESCE(v.version,'') AS vehiculo,
  u.nombre_compl          AS asesor,
  c.creado_en
FROM cotizaciones c
JOIN vehiculos  v ON v.id_vehiculo = c.id_vehiculo
JOIN usuarios   u ON u.id_usuario  = c.id_usuario
WHERE c.id_cliente = :id_cliente
ORDER BY c.id_cotizacion, c.version;
```

### 19.2 — Cronograma completo de una cotización

```sql
SELECT
  cu.numero,
  cu.tipo_cuota,
  TO_CHAR(cu.fec_vencimient, 'DD/MM/YYYY') AS fecha,
  cu.saldo_inicial,
  cu.interes,
  cu.amortizacion,
  cu.seg_desgravame,
  cu.seg_vehicular,
  cu.otros_gastos,
  cu.cuota_total,
  cu.saldo_final
FROM cuotas cu
WHERE cu.id_cotizacion = :id_cotizacion
ORDER BY cu.numero;
```

### 19.3 — Resumen de indicadores de una cotización

```sql
SELECT
  co.id_cotizacion,
  co.version,
  cl.nombres || ' ' || cl.ap_paterno               AS cliente,
  cl.num_documento,
  ve.marca || ' ' || ve.modelo                     AS vehiculo,
  co.moneda_op,
  co.precio_veh,
  co.cuota_ini_mnt,
  co.monto_financ,
  co.plazo_meses,
  ROUND(co.tea  * 100, 4)                          AS tea_pct,
  ROUND(co.tem  * 100, 6)                          AS tem_pct,
  ROUND(co.tcea, 4)                                AS tcea_pct,
  ROUND(co.tir_anual, 4)                           AS tir_anual_pct,
  co.van_deudor,
  co.total_pagado,
  co.costo_credito,
  co.gracia_flag,
  co.gracia_tipo,
  co.gracia_meses,
  co.residual_flag,
  co.residual_monto
FROM cotizaciones co
JOIN clientes cl ON cl.id_cliente  = co.id_cliente
JOIN vehiculos ve ON ve.id_vehiculo = co.id_vehiculo
WHERE co.id_cotizacion = :id_cotizacion
  AND co.version       = :version;
```

### 19.4 — Totales del cronograma (verificación cuadre)

```sql
SELECT
  COUNT(*)                          AS total_cuotas,
  SUM(interes)                      AS suma_intereses,
  SUM(amortizacion)                 AS suma_amortizacion,
  SUM(seg_desgravame)               AS suma_desgravamen,
  SUM(seg_vehicular)                AS suma_seg_vehicular,
  SUM(otros_gastos)                 AS suma_otros_gastos,
  SUM(cuota_total)                  AS suma_total_pagado,
  MIN(saldo_final)                  AS saldo_final_minimo,
  MAX(saldo_inicial)                AS capital_original
FROM cuotas
WHERE id_cotizacion = :id_cotizacion;

-- El saldo_final_minimo debe ser 0.00 (cronograma cierra en cero)
-- La suma_amortizacion debe ≈ capital_original
```

### 19.5 — Historial de pagos de una operación

```sql
SELECT
  p.id_pago,
  TO_CHAR(p.fecha_pago, 'DD/MM/YYYY') AS fecha,
  p.tipo_pago,
  p.monto_total,
  p.interes_dia,
  p.capital_amort,
  p.saldo_anterior,
  p.saldo_nuevo,
  p.modalidad,
  p.penalidad,
  p.canal_pago,
  p.referencia,
  u.nombre_compl AS registrado_por
FROM pagos p
JOIN usuarios u ON u.id_usuario = p.id_usuario
WHERE p.id_operacion = :id_operacion
ORDER BY p.fecha_pago, p.id_pago;
```

### 19.6 — Clientes con cotizaciones activas (dashboard del asesor)

```sql
SELECT
  cl.id_cliente,
  cl.nombres || ' ' || cl.ap_paterno       AS cliente,
  cl.num_documento,
  cl.celular,
  COUNT(DISTINCT co.id_cotizacion)         AS total_cotizaciones,
  MAX(co.creado_en)                        AS ultima_cotizacion,
  SUM(CASE WHEN co.estado = 'SIMULADA'
           THEN 1 ELSE 0 END)             AS cotiz_vigentes
FROM clientes cl
LEFT JOIN cotizaciones co ON co.id_cliente = cl.id_cliente
WHERE cl.estado    = 'ACTIVO'
  AND cl.creado_por = :id_usuario_asesor
GROUP BY cl.id_cliente, cl.nombres, cl.ap_paterno, cl.num_documento, cl.celular
ORDER BY ultima_cotizacion DESC NULLS LAST;
```

### 19.7 — Log de auditoría de una entidad específica

```sql
SELECT
  al.id_log,
  al.entidad,
  al.id_entidad,
  al.accion,
  al.campos_anteriores,
  al.campos_nuevos,
  u.nombre_compl       AS usuario,
  u.rol,
  TO_CHAR(al.fecha_hora, 'DD/MM/YYYY HH24:MI:SS') AS fecha_hora
FROM audit_log al
JOIN usuarios u ON u.id_usuario = al.id_usuario
WHERE al.entidad    = :entidad     -- ej: 'COTIZACIONES'
  AND al.id_entidad = :id_entidad
ORDER BY al.fecha_hora;
```

### 19.8 — Detección de cotizaciones sin cronograma (integridad)

```sql
-- Cotizaciones SIMULADAS que no tienen cuotas generadas
-- Este resultado debe estar vacío en producción
SELECT
  co.id_cotizacion,
  co.version,
  co.estado,
  co.creado_en
FROM cotizaciones co
LEFT JOIN cuotas cu ON cu.id_cotizacion = co.id_cotizacion
WHERE co.estado IN ('SIMULADA', 'PRESENTADA')
  AND cu.id_cuota IS NULL;
```

---

## Sección 20 — Mapa de dependencias entre entidades y módulos

Este mapa muestra qué tablas consulta o modifica cada módulo
del sistema, para guiar la implementación de la capa de servicios.
MÓDULO LECTURA ESCRITURA
──────────────────────────────────────────────────────────────────
Login / Auth USUARIOS AUDIT_LOG

Gestión de clientes CLIENTES, USUARIOS CLIENTES
AUDIT_LOG

Gestión de vehículos VEHICULOS, USUARIOS VEHICULOS
AUDIT_LOG

Nueva cotización CLIENTES, VEHICULOS, COTIZACIONES
(Userflow 1) USUARIOS CUOTAS
AUDIT_LOG

Ver cotización COTIZACIONES, CUOTAS, —
CLIENTES, VEHICULOS

Editar cotización COTIZACIONES, CUOTAS COTIZACIONES (nueva versión)
(versionado) CUOTAS (nuevo set)
AUDIT_LOG

Exportar PDF COTIZACIONES, CUOTAS, AUDIT_LOG
CLIENTES, VEHICULOS

Comparar versiones COTIZACIONES, CUOTAS —

Registrar pago OPERACIONES, PAGOS, PAGOS
(Userflow 3) COTIZACIONES, CUOTAS OPERACIONES
COTIZACIONES (nueva versión)
CUOTAS (cronograma nuevo)
AUDIT_LOG

Dashboard / KPIs COTIZACIONES, CLIENTES, —
VEHICULOS, PAGOS

Módulo transparencia — AUDIT_LOG
(Userflow 5) (solo log de consulta)

Administración USUARIOS, AUDIT_LOG USUARIOS
de usuarios AUDIT_LOG


## Sección 21 — Resumen ejecutivo del modelo de datos

Este esquema implementa un modelo relacional normalizado en tercera
forma normal (3FN) con las siguientes características:
Tablas principales: 8
Índices adicionales: 7
Constraints CHECK: 28 (validaciones de negocio en BD)
Foreign Keys: 11
Campos auditados: Todos los cambios en 7 entidades sensibles

Entidades de dominio:
USUARIOS → Control de acceso y responsabilidad
CLIENTES → Directorio de solicitantes
VEHICULOS → Catálogo de activos a financiar
COTIZACIONES → Simulaciones versionadas de crédito
CUOTAS → Detalle cuota a cuota del cronograma
OPERACIONES → Créditos formalizados en ejecución
PAGOS → Registro de flujos reales del deudor
AUDIT_LOG → Trazabilidad inmutable de todos los eventos

Cumplimiento normativo reflejado en la BD:
✓ penalidad = 0.00 (Ley 29571 Art. 85°) → CHECK CONSTRAINT
✓ REGEXP_LIKE(celular, '^9[0-9]{8}$') (numeración peruana) → CHECK CONSTRAINT
✓ plazo BETWEEN 6 AND 84 → CHECK CONSTRAINT
✓ gracia_meses BETWEEN 1 AND 6 → CHECK CONSTRAINT
✓ residual < monto_financiado → CHECK CONSTRAINT
✓ fec_primera_cuota > fec_desembolso → CHECK CONSTRAINT
✓ tcea almacenada para reproducibilidad SBS → CAMPO NOT NULL
✓ versionado de cotizaciones presentadas → ESTADO + VERSION
✓ audit_log con JSON campos antes/después → TABLA DEDICADA

text

---

## Sección 22 — Diagrama de máquinas de estado

Especificación formal de todas las transiciones de estado válidas
en el sistema. Ninguna transición fuera de las listadas puede ser
ejecutada por ningún rol.

### 22.1 — Máquina de estados: COTIZACIONES
┌─────────────────────────────────────────┐
│ MÁQUINA DE ESTADOS │
│ COTIZACIONES │
└─────────────────────────────────────────┘

[Creación]
│
▼
┌──────────┐ calcular() ┌──────────┐ presentar() ┌─────────────┐
│ BORRADOR │ ─────────────► │ SIMULADA │ ──────────────► │ PRESENTADA │
└──────────┘ └──────────┘ └─────────────┘
│ │ │
│ archivar() │ archivar() │ editar()
│ │ │
▼ ▼ ▼
┌──────────┐ ┌──────────┐ ┌──────────────────┐
│ARCHIVADA │ │ARCHIVADA │ │ARCHIVADA_VERSION │
└──────────┘ └──────────┘ └──────────────────┘
│
(se crea v_nueva)
│
▼
┌──────────┐
│ BORRADOR │
│ (v nueva)│
└──────────┘

Transiciones permitidas por rol:
BORRADOR → SIMULADA : ASESOR, ADMIN
SIMULADA → PRESENTADA : ASESOR, ADMIN
SIMULADA → BORRADOR : ASESOR, ADMIN (recalcular)
PRESENTADA → ARCHIVADA_VERSION : ASESOR, ADMIN (editar → crea nueva versión)
BORRADOR → ARCHIVADA : ASESOR, ADMIN
SIMULADA → ARCHIVADA : ASESOR, ADMIN
ARCHIVADA → (ninguna) : estado final no reversible
ARCHIVADA_VERSION → (ninguna) : estado final no reversible

text

### 22.2 — Máquina de estados: OPERACIONES
[Formalización desde PRESENTADA]
│
▼
┌──────────┐ pago_total_anticipado() ┌────────────┐
│ ACTIVA │ ─────────────────────────► │ CANCELADA │
└──────────┘ └────────────┘
│
│ ultima_cuota_pagada()
│
▼
┌──────────┐
│ CERRADA │
└──────────┘

Transiciones permitidas por rol:
ACTIVA → CANCELADA : ASESOR, ADMIN (pago anticipado total)
ACTIVA → CERRADA : Sistema automático (última cuota registrada)
CANCELADA → (ninguna): estado final
CERRADA → (ninguna): estado final

text

### 22.3 — Máquina de estados: CLIENTES y VEHICULOS
[Creación] [Creación]
│ │
▼ ▼
┌──────────┐ ┌─────────────┐
│ ACTIVO │ │ DISPONIBLE │
└──────────┘ └─────────────┘
│ │
│ archivar() │ archivar()
▼ ▼
┌──────────┐ ┌────────────┐
│ARCHIVADO │ │ ARCHIVADO │
└──────────┘ └────────────┘
│ │
│ reactivar() │ reactivar()
▼ ▼
┌──────────┐ ┌─────────────┐
│ ACTIVO │ │ DISPONIBLE │
└──────────┘ └─────────────┘

Restricción: un cliente ARCHIVADO no puede ser asociado a una
nueva cotización. Un vehículo ARCHIVADO no puede ser usado en
una nueva cotización. Las cotizaciones existentes no se ven afectadas.

text

### 22.4 — Máquina de estados: USUARIOS
[Creación por ADMIN]
│
▼
┌──────────┐ desactivar() [ADMIN] ┌──────────┐
│ ACTIVO │ ────────────────────── ► │ INACTIVO │
└──────────┘ └──────────┘
▲ │
│ reactivar() [ADMIN] │
└─────────────────────────────────────┘

Un usuario INACTIVO no puede iniciar sesión.
Su historial de cotizaciones y auditoría se conserva íntegro.

text

---

## Sección 23 — Estrategia de migraciones

Para el entorno universitario del proyecto se usa una estrategia
de migraciones numeradas y secuenciales. Cada archivo de migración
es idempotente: puede ejecutarse sin romper el estado de la BD si
ya fue aplicado.

### 23.1 — Estructura de archivos de migración
db/
├── migrations/
│ ├── 001_create_usuarios.sql
│ ├── 002_create_clientes.sql
│ ├── 003_create_vehiculos.sql
│ ├── 004_create_cotizaciones.sql
│ ├── 005_create_cuotas.sql
│ ├── 006_create_operaciones.sql
│ ├── 007_create_pagos.sql
│ ├── 008_create_audit_log.sql
│ ├── 009_create_indexes.sql
│ └── 010_seed_data.sql
├── schema.sql ← DDL completo consolidado (Sección 16)
└── rollback/
├── rollback_001.sql
├── rollback_002.sql
└── ...

text

### 23.2 — Tabla de control de migraciones

```sql
-- Tabla para registrar qué migraciones han sido aplicadas
CREATE TABLE IF NOT EXISTS schema_migrations (
  version      VARCHAR(10)   PRIMARY KEY,
  descripcion  VARCHAR(200)  NOT NULL,
  aplicada_en  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplo de registro al aplicar una migración:
INSERT INTO schema_migrations (version, descripcion)
VALUES ('001', 'Crear tabla usuarios')
ON DUPLICATE KEY UPDATE version = version;
```

### 23.3 — Script de verificación de integridad post-migración

```sql
-- Ejecutar después de aplicar todas las migraciones.
-- Ninguna consulta debe retornar filas; si retorna, hay un
-- problema de integridad en el esquema aplicado.

-- V1: todas las tablas deben existir
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name NOT IN (
    'usuarios','clientes','vehiculos','cotizaciones',
    'cuotas','operaciones','pagos','audit_log','schema_migrations'
  )
  AND table_type = 'BASE TABLE';
-- Esperado: 0 filas

-- V2: cotizaciones SIMULADAS sin cuotas (debe estar vacío)
SELECT co.id_cotizacion
FROM cotizaciones co
LEFT JOIN cuotas cu ON cu.id_cotizacion = co.id_cotizacion
WHERE co.estado IN ('SIMULADA','PRESENTADA')
  AND cu.id_cuota IS NULL;
-- Esperado: 0 filas

-- V3: pagos con penalidad distinta de cero (debe estar vacío)
SELECT id_pago, penalidad
FROM pagos
WHERE penalidad <> 0.00;
-- Esperado: 0 filas (Ley 29571 Art. 85°)

-- V4: cronogramas que no cierran en saldo cero
SELECT id_cotizacion, MAX(saldo_final) AS saldo_final_ultimo
FROM cuotas
WHERE numero = (
  SELECT MAX(numero) FROM cuotas c2
  WHERE c2.id_cotizacion = cuotas.id_cotizacion
)
GROUP BY id_cotizacion
HAVING MAX(saldo_final) > 0.01;
-- Esperado: 0 filas (todo cronograma cierra en S/. 0.00)

-- V5: usuarios con rol inválido
SELECT id_usuario, usuario, rol
FROM usuarios
WHERE rol NOT IN ('ADMIN','ASESOR','ANALISTA','AUDITOR');
-- Esperado: 0 filas
```

---

## Sección 24 — Checklist de implementación del modelo de datos

Lista de verificación para el equipo antes de presentar el sprint
de base de datos al profesor evaluador.
ESTRUCTURA
[] DDL ejecutado sin errores en MySQL 8.0+
[] Las 8 tablas existen con sus columnas y tipos correctos
[] Todos los CHECK CONSTRAINTS están activos
[] Todas las FOREIGN KEYS están activas con ON DELETE correcto
[] Los 7 índices adicionales están creados
[] La tabla schema_migrations registra las 10 migraciones

INTEGRIDAD
[] Script de verificación post-migración retorna 0 filas en V1-V5
[] El seed data se insertó sin errores (2 usuarios, 3 vehículos,
1 cliente de prueba)
[] Un intento de insertar penalidad ≠ 0.00 es rechazado por la BD
[] Un intento de DNI con ≠ 8 dígitos es rechazado por la BD
[] Un intento de celular sin inicio en 9 es rechazado por la BD

NORMATIVA
[] El campo tcea es NOT NULL en cotizaciones
[] El campo penalidad tiene DEFAULT 0.00 y CHECK = 0.00
[] El campo motivo_edicion se registra en versiones v2+
[] La tabla audit_log no tiene UPDATE ni DELETE permitidos
(verificar con política RLS o trigger en producción)

CONSULTAS
[] La query 19.1 (historial de cliente) retorna datos del seed
[] La query 19.4 (verificación de cuadre) retorna saldo_final = 0
[] La query 19.8 (cotizaciones sin cronograma) retorna 0 filas

DOCUMENTACIÓN
[] schema.md está completo y versionado en el repositorio
[] El diagrama ER (Sección 5.1) coincide con el DDL real
[] El glosario (Sección 18) cubre todos los términos del código
[] Las queries de uso frecuente (Sección 19) están probadas

text
Este es el final del schema.md. El documento cubre las 24 secciones completas:

Bloque	Secciones	Contenido
Análisis de datos	1 – 4	Entradas, intermedios, salidas y constantes
Modelo ER	5 – 7	Diagrama, entidades, cardinalidades
Integridad	8 – 10	FK, constraints, diccionario de estados
Motor financiero	11 – 12	Flujo completo y pago anticipado
Trazabilidad	13 – 14	Versionado y auditoría
Precisión numérica	15	Redondeo y manejo de USD
DDL y seed	16 – 17	Scripts listos para ejecutar
Referencia	18 – 19	Glosario y queries frecuentes
Operaciones	20 – 22	Mapa de dependencias, resumen y estados
Implementación	23 – 24	Migraciones y checklist