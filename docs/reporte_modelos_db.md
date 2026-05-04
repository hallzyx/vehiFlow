# 🗃️ Modelo de Base de Datos — Compra Inteligente (Versión Final)

**Motor:** MySQL 8.0+ · **ORM:** Prisma Client · **BD:** `vehiflow_db`

---

## 1. ENUMS (16 tipos)

| Enum | Valores | Propósito |
|------|---------|-----------|
| `RolUsuario` | `ADMIN`, `ASESOR`, `ANALISTA`, `AUDITOR` | Perfiles de acceso |
| `EstadoUsuario` | `ACTIVO`, `INACTIVO` | Bloqueo de cuentas |
| `TipoDocumento` | `DNI`, `CE`, `PASAPORTE` | Identificación del cliente |
| `EstadoCliente` | `ACTIVO`, `ARCHIVADO` | Baja lógica de clientes |
| `EstadoVehiculo` | `DISPONIBLE`, `ARCHIVADO` | Baja lógica de vehículos |
| `Moneda` | `PEN`, `USD` | Moneda de operación |
| `TipoValorResidual` | `MONTO`, `PORCENTAJE` | Cómo se expresa el residual |
| `TipoVehiculo` | `SEDAN`, `SUV`, `CAMIONETA`, `PICKUP`, `HATCHBACK`, `COUPE`, `STATION_WAGON`, `VAN`, `OTRO` | Clasificación del vehículo |
| `Transmision` | `MANUAL`, `AUTOMATICA`, `CVT`, `DUAL` | Tipo de transmisión |
| `Combustible` | `GASOLINA`, `DIESEL`, `HIBRIDO`, `ELECTRICO`, `GLP` | Tipo de combustible |
| `GraciaTipo` | `TOTAL`, `PARCIAL` | Tipo de período de gracia |
| `EstadoCotizacion` | `BORRADOR`, `SIMULADA`, `PRESENTADA`, `APROBADA`, `RECHAZADA`, `ARCHIVADA`, `ARCHIVADA_VERSION` | Ciclo de vida de cotizaciones |
| `TipoCuota` | `GRACIA_TOTAL`, `GRACIA_PARCIAL`, `NORMAL`, `RESIDUAL` | Clasificación de cada cuota en el cronograma |
| `EstadoOperacion` | `ACTIVA`, `CANCELADA`, `CERRADA` | Ciclo de vida de operaciones formalizadas |
| `TipoPago` | `CUOTA_NORMAL`, `ANTICIPADO_PARCIAL`, `CANCELACION_TOTAL` | Tipo de pago registrado |
| `CanalPago` | `VENTANILLA`, `TRANSFERENCIA`, `APP`, `DEBITO_AUTOMATICO`, `OTRO` | Canal por el que se realizó el pago |
| `ModalidadAnticipado` | `REDUCIR_PLAZO`, `REDUCIR_CUOTA` | Modalidad elegida en pago anticipado |
| `AccionAudit` | `CREACION`, `EDICION`, `ARCHIVADO`, `LOGIN`, `LOGOUT`, `ELIMINACION`, `CAMBIO_ESTADO` | Acciones auditables |

---

## 2. ENTIDADES (8 tablas)

---

### 2.1 `usuarios` — Usuarios internos del sistema

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `usuario` | `VARCHAR(50)` | UNIQUE, NOT NULL | Nombre de usuario para login |
| `contrasena` | `VARCHAR(255)` | NOT NULL | Hash bcrypt |
| `nombre_compl` | `VARCHAR(150)` | NOT NULL | Nombre completo del usuario |
| `rol` | `ENUM(RolUsuario)` | NOT NULL | ADMIN / ASESOR / ANALISTA / AUDITOR |
| `estado` | `ENUM(EstadoUsuario)` | NOT NULL, DEFAULT 'ACTIVO' | ACTIVO / INACTIVO |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de registro |

**Relaciones:** 1:N → cotizaciones, clientes (creador), vehículos (creador), pagos, audit_log

---

### 2.2 `clientes` — Directorio de clientes

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `tipo_documento` | `ENUM(TipoDocumento)` | NOT NULL | DNI / CE / PASAPORTE |
| `num_documento` | `VARCHAR(15)` | UNIQUE, NOT NULL | Número de documento |
| `nombres` | `VARCHAR(100)` | NOT NULL | Nombres del cliente |
| `ap_paterno` | `VARCHAR(100)` | NOT NULL | Apellido paterno |
| `ap_materno` | `VARCHAR(100)` | NULL | Apellido materno |
| `celular` | `VARCHAR(9)` | NOT NULL | Celular peruano (9 dígitos) |
| `correo` | `VARCHAR(150)` | UNIQUE, NOT NULL | Correo electrónico |
| `direccion` | `VARCHAR(200)` | NOT NULL | Dirección de residencia |
| `fec_nacimiento` | `DATE` | NULL | Fecha de nacimiento |
| `ingresos_mens` | `DECIMAL(12,2)` | NULL | Ingresos mensuales declarados |
| `moneda_ingres` | `ENUM(Moneda)` | NULL | PEN / USD |
| `situacion_lab` | `VARCHAR(20)` | NULL | DEPENDIENTE / INDEPENDIENTE / OTRO |
| `empresa_empl` | `VARCHAR(150)` | NULL | Empresa empleadora |
| `estado` | `ENUM(EstadoCliente)` | NOT NULL, DEFAULT 'ACTIVO' | ACTIVO / ARCHIVADO |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de registro |
| `creado_por` | `BIGINT FK` | NOT NULL → usuarios.id | Usuario que registró |

**Relaciones:** N:1 → usuarios (creador) · 1:N → cotizaciones

---

### 2.3 `vehiculos` — Catálogo de vehículos

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `marca` | `VARCHAR(50)` | NOT NULL | Marca |
| `modelo` | `VARCHAR(100)` | NOT NULL | Modelo |
| `version` | `VARCHAR(100)` | NULL | Versión / trim |
| `anio` | `SMALLINT` | NOT NULL | Año de fabricación |
| `precio_lista` | `DECIMAL(12,2)` | NOT NULL | Precio de venta al público |
| `moneda_precio` | `ENUM(Moneda)` | NOT NULL | PEN / USD |
| `concesionario` | `VARCHAR(150)` | NOT NULL | Dealer o concesionario |
| `val_resid_est` | `DECIMAL(12,2)` | NULL | Valor residual estimado (Compra Inteligente) |
| `tipo_val_resid` | `ENUM(TipoValorResidual)` | NULL | MONTO / PORCENTAJE |
| `tipo_vehiculo` | `ENUM(TipoVehiculo)` | NULL | SEDAN / SUV / etc. |
| `transmision` | `ENUM(Transmision)` | NULL | MANUAL / AUTOMATICA / CVT |
| `combustible` | `ENUM(Combustible)` | NULL | GASOLINA / DIESEL / etc. |
| `estado` | `ENUM(EstadoVehiculo)` | NOT NULL, DEFAULT 'DISPONIBLE' | DISPONIBLE / ARCHIVADO |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de registro |
| `creado_por` | `BIGINT FK` | NOT NULL → usuarios.id | Usuario que registró |

**Relaciones:** N:1 → usuarios (creador) · 1:N → cotizaciones

---

### 2.4 `cotizaciones` ⭐ — Núcleo del sistema

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `id_cliente` | `BIGINT FK` | NOT NULL → clientes.id | Cliente asociado |
| `id_vehiculo` | `BIGINT FK` | NOT NULL → vehiculos.id | Vehículo asociado |
| `id_usuario` | `BIGINT FK` | NOT NULL → usuarios.id | Asesor que creó la cotización |
| `version` | `SMALLINT` | NOT NULL, DEFAULT 1 | N° de versión (v1, v2, ...) |
| `estado` | `ENUM(EstadoCotizacion)` | NOT NULL, DEFAULT 'BORRADOR' | Estado del ciclo de vida |

**Parámetros financieros:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `moneda_op` | `ENUM(Moneda)` | NOT NULL | Moneda de la operación (PEN/USD) |
| `tasa_ingresada` | `DECIMAL(8,4)` | NOT NULL | **TEA** ingresada por el asesor (%) |
| `tea` | `DECIMAL(8,6)` | NOT NULL | TEA en decimal (se usa tal cual) |
| `tem` | `DECIMAL(10,8)` | NOT NULL | TEM calculada = (1+TEA)^(30/360)-1 |

**Parámetros del crédito:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `precio_veh` | `DECIMAL(12,2)` | NOT NULL | Precio del vehículo |
| `cuota_ini_pct` | `DECIMAL(5,2)` | NOT NULL | % de cuota inicial |
| `cuota_ini_mnt` | `DECIMAL(12,2)` | NOT NULL | Monto de cuota inicial |
| `monto_financ` | `DECIMAL(12,2)` | NOT NULL | Capital financiado |
| `plazo_meses` | `SMALLINT` | NOT NULL | Plazo en meses (6-84) |
| `fec_desembolso` | `DATE` | NOT NULL | Fecha de desembolso |
| `fec_1era_cuota` | `DATE` | NOT NULL | Fecha de primera cuota |

**Período de gracia:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `gracia_flag` | `TINYINT(1)` | NOT NULL, DEFAULT 0 | ¿Tiene gracia? |
| `gracia_tipo` | `ENUM(GraciaTipo)` | NULL | TOTAL / PARCIAL |
| `gracia_meses` | `SMALLINT` | NULL | Meses de gracia (1-6) |

**Valor residual (Compra Inteligente):**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `residual_flag` | `TINYINT(1)` | NOT NULL, DEFAULT 0 | ¿Incluye residual? |
| `residual_monto` | `DECIMAL(12,2)` | NULL | Monto del residual |

**Seguros y gastos:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `seg_desgrav` | `DECIMAL(6,4)` | NULL | Tasa mensual seguro desgravamen |
| `seg_vehi` | `DECIMAL(10,2)` | NULL | Prima anual seguro vehicular |
| `gasto_gps` | `DECIMAL(10,2)` | NULL | Costo GPS |
| `gasto_not` | `DECIMAL(10,2)` | NULL | Gastos notariales |

**Indicadores calculados:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `tcea` | `DECIMAL(8,4)` | NOT NULL | TCEA (%) |
| `van_deudor` | `DECIMAL(14,2)` | NOT NULL | VAN del deudor |
| `tir_m` | `DECIMAL(8,6)` | NOT NULL | TIR mensual (decimal) |
| `tir_a` | `DECIMAL(8,4)` | NOT NULL | TIR anual (%) |
| `tot_pagado` | `DECIMAL(14,2)` | NOT NULL | Total a pagar |
| `costo_cred` | `DECIMAL(14,2)` | NOT NULL | Costo total del crédito |

**Metadata:**

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `motivo_ed` | `VARCHAR(200)` | NULL | Motivo de edición (v2+) |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de creación |

**Restricciones:** Combinación única `(id, version)` · FKs: clientes (RESTRICT), vehiculos (RESTRICT), usuarios (RESTRICT)

---

### 2.5 `cuotas` — Cronograma de pagos

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `id_cotizacion` | `BIGINT FK` | NOT NULL → cotizaciones.id (CASCADE) | Cotización padre |
| `numero` | `SMALLINT` | NOT NULL | N° de cuota (1, 2, ...) |
| `tipo_cuota` | `ENUM(TipoCuota)` | NOT NULL | GRACIA_TOTAL / GRACIA_PARCIAL / NORMAL / RESIDUAL |
| `fec_vencimient` | `DATE` | NOT NULL | Fecha de vencimiento |
| `saldo_inicial` | `DECIMAL(12,2)` | NOT NULL | Saldo al inicio del período |
| `interes` | `DECIMAL(12,2)` | NOT NULL | Interés del período |
| `amortizacion` | `DECIMAL(12,2)` | NOT NULL | Capital amortizado |
| `seg_desgravame` | `DECIMAL(10,2)` | NOT NULL | Prima desgravamen |
| `seg_vehicular` | `DECIMAL(10,2)` | NOT NULL | Prima vehicular |
| `otros_gastos` | `DECIMAL(10,2)` | NOT NULL | Otros gastos (GPS, notarial) |
| `cuota_total` | `DECIMAL(12,2)` | NOT NULL | Total cuota (todo incluido) |
| `saldo_final` | `DECIMAL(12,2)` | NOT NULL | Saldo al cierre |

**Restricción única:** `(id_cotizacion, numero)` — una cuota por número por cotización

**Relaciones:** N:1 → cotizaciones (ON DELETE CASCADE)

---

### 2.6 `operaciones` — Créditos formalizados

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `id_cotizacion` | `BIGINT FK` | UNIQUE, NOT NULL → cotizaciones.id | Cotización que originó la operación |
| `estado_op` | `ENUM(EstadoOperacion)` | NOT NULL | ACTIVA / CANCELADA / CERRADA |
| `fec_inicio` | `DATE` | NOT NULL | Fecha de inicio |
| `fec_termino` | `DATE` | NULL | Fecha de vencimiento final |
| `saldo_actual` | `DECIMAL(12,2)` | NOT NULL | Saldo de capital vigente |
| `version_crono` | `SMALLINT` | NOT NULL, DEFAULT 1 | Versión del cronograma |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de registro |

**Relaciones:** 1:1 → cotizaciones · 1:N → pagos

---

### 2.7 `pagos` — Pagos realizados

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `id_operac` | `BIGINT FK` | NOT NULL → operaciones.id | Operación asociada |
| `fecha_pago` | `DATE` | NOT NULL | Fecha del pago |
| `monto_tot` | `DECIMAL(12,2)` | NOT NULL | Monto total pagado |
| `tipo_pago` | `ENUM(TipoPago)` | NOT NULL | CUOTA_NORMAL / ANTICIPADO_PARCIAL / CANCELACION_TOTAL |
| `cuota_aplic` | `DECIMAL(12,2)` | NOT NULL | Monto aplicado a cuota del período |
| `interes_dia` | `DECIMAL(12,2)` | NOT NULL | Interés devengado al día del pago |
| `capital_am` | `DECIMAL(12,2)` | NOT NULL | Capital amortizado |
| `saldo_ant` | `DECIMAL(12,2)` | NOT NULL | Saldo antes del pago |
| `saldo_nvo` | `DECIMAL(12,2)` | NOT NULL | Saldo después del pago |
| `modalidad` | `ENUM(ModalidadAnticipado)` | NULL | REDUCIR_PLAZO / REDUCIR_CUOTA |
| `penalidad` | `DECIMAL(10,2)` | NOT NULL, DEFAULT 0 | Siempre 0 (Ley 29571 Art. 85°) |
| `canal_pago` | `ENUM(CanalPago)` | NOT NULL | Canal de pago |
| `referencia` | `VARCHAR(50)` | NOT NULL | N° de operación bancaria |
| `id_usuario` | `BIGINT FK` | NOT NULL → usuarios.id | Usuario que registró |
| `creado_en` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Fecha de registro |

---

### 2.8 `audit_log` — Trazabilidad

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | `BIGINT PK` | AUTO_INCREMENT | Identificador único |
| `entidad` | `VARCHAR(30)` | NOT NULL | Nombre de la entidad afectada |
| `id_entidad` | `BIGINT` | NOT NULL | ID del registro afectado |
| `accion` | `ENUM(AccionAudit)` | NOT NULL | Tipo de acción |
| `campos_anteriores` | `JSON` | NULL | Snapshot del estado anterior |
| `campos_nuevos` | `JSON` | NULL | Snapshot del nuevo estado |
| `id_usuario` | `BIGINT FK` | NOT NULL → usuarios.id | Usuario que ejecutó la acción |
| `fecha_hora` | `TIMESTAMP` | NOT NULL, DEFAULT now() | Marca temporal |

---

## 3. DIAGRAMA DE RELACIONES

```
USUARIOS ──1:N──> COTIZACIONES
USUARIOS ──1:N──> CLIENTES (creador)
USUARIOS ──1:N──> VEHICULOS (creador)
USUARIOS ──1:N──> PAGOS
USUARIOS ──1:N──> AUDIT_LOG

CLIENTES ──1:N──> COTIZACIONES
VEHICULOS ──1:N──> COTIZACIONES

COTIZACIONES ──1:N──> CUOTAS (CASCADE)
COTIZACIONES ──1:1──> OPERACIONES

OPERACIONES ──1:N──> PAGOS
```

---

## 4. CAMBIOS DE VERSIÓN (vs. schema original)

| Cambio | Antes | Ahora | Motivo |
|--------|-------|-------|--------|
| `tipo_tasa` | `ENUM('EFECTIVA','NOMINAL')` | **Eliminado** | Solo se usa TEA directa |
| `capitalizacion` | `ENUM(...)` nullable | **Eliminado** | No aplica (tasa efectiva no requiere capitalización) |
| `tasa_ingresada` | TNA o TEA según tipo_tasa | **Siempre TEA** | El asesor ingresa TEA directamente |

---

## 5. REGLAS DE INTEGRIDAD CLAVE

1. **Penalidad cero:** `pagos.penalidad = 0.00` — Ley 29571, Art. 85° (prohibición de penalidad por pago anticipado).
2. **Gracia consistente:** si `gracia_flag = TRUE`, entonces `gracia_tipo` y `gracia_meses` deben estar completos.
3. **Residual:** el residual no puede superar el monto financiado.
4. **Plazo:** restringido entre 6 y 84 meses.
5. **Versionado:** `(id_cotizacion, version)` es UNIQUE; cada edición crea una nueva versión archivando la anterior.
6. **Auditoría:** toda acción sensible queda registrada en `audit_log` (tabla inmutable, sin DELETE permitido).
7. **Cascade en cuotas:** al eliminar una cotización se eliminan sus cuotas en cascada.
8. **Restrict en el resto:** no se puede eliminar un cliente/vehículo/usuario con cotizaciones asociadas.
