# Userflow 4 — Gestión de Clientes y Catálogo de Vehículos (Backoffice)

## Meta del flujo
El asesor o administrador gestiona de forma independiente el directorio
de clientes y el catálogo de vehículos de la entidad: registra, consulta,
edita, y archiva tanto perfiles de clientes como fichas de vehículos,
sin necesidad de estar dentro de un flujo de cotización activo.

## Actor principal
Asesor comercial (clientes y vehículos)
Administrador (configuración del catálogo, permisos, archivado)

## Actores secundarios
Analista / supervisor (solo lectura)

## Pre-condición
- El usuario está autenticado en el sistema
- Tiene rol con permisos de lectura y/o escritura sobre clientes
  y/o vehículos

## Post-condición
- Los registros creados o modificados quedan persistidos en base
  de datos y disponibles para ser asociados a nuevas cotizaciones
- Todo cambio queda registrado en el log de auditoría con usuario,
  fecha, hora y campos modificados

---

## MÓDULO A — Gestión de Clientes

### PANTALLA A0 — Lista de clientes

**Ruta:** `/clientes`

**Encabezado:**
┌──────────────────────────────────────────────────────────────┐
│ Clientes [+ Nuevo cliente] │
│──────────────────────────────────────────────────────────────│
│ Buscar: [_________________________] Filtrar: [Todos ▾] │
└──────────────────────────────────────────────────────────────┘

text

**Filtros disponibles:**
- Por estado: Todos / Activo / Archivado
- Por situación laboral: Todos / Dependiente / Independiente / Otro
- Por fecha de registro: rango de fechas

**Buscador en tiempo real:**
Busca simultáneamente por:
- Nombre o apellido (parcial, case-insensitive)
- Número de documento (DNI / CE / Pasaporte)
- Correo electrónico
- Número de celular

**Tabla de resultados:**

| N°  | Documento      | Cliente              | Celular     | Cotizaciones | Estado  | Acciones |
|-----|----------------|----------------------|-------------|--------------|---------|----------|
| 001 | DNI 45678901   | Juan Pérez Quispe    | 987654321   | 3            | Activo  | ⋮        |
| 002 | CE 001234567   | María López Flores   | 998877665   | 1            | Activo  | ⋮        |
| 003 | DNI 32145698   | Carlos Ruiz Mendoza  | 912345678   | 0            | Activo  | ⋮        |

**Menú de acciones por fila (⋮):**
- Ver perfil completo
- Editar datos
- Nueva cotización para este cliente
- Ver cotizaciones y operaciones
- Archivar cliente

**Estado vacío (primer uso o sin resultados):**
┌──────────────────────────────────────────────────────────────┐
│ │
│ 📋 No hay clientes registrados │
│ │
│ Registra tu primer cliente para comenzar a │
│ generar cotizaciones de crédito vehicular. │
│ │
│ [+ Registrar cliente] │
│ │
└──────────────────────────────────────────────────────────────┘

text

---

### PANTALLA A1 — Registrar nuevo cliente

**Ruta:** `/clientes/nuevo`

**Encabezado:**
"Nuevo cliente — completa los datos del solicitante"

**Formulario dividido en dos secciones:**

#### Sección A1.1 — Datos de identificación (obligatorios)

| Campo                | Tipo      | Validación                                  |
|----------------------|-----------|---------------------------------------------|
| Tipo de documento    | Select    | DNI / CE / Pasaporte                        |
| Número de documento  | Text      | 8 dígitos si DNI; alfanumérico si CE/Pasap. |
|                      |           | Verificación de unicidad en BD en blur      |
| Nombres              | Text      | Mín. 2 caracteres; solo letras y espacios   |
| Apellido paterno     | Text      | Mín. 2 caracteres; solo letras y espacios   |
| Apellido materno     | Text      | Opcional                                    |
| Celular              | Text      | 9 dígitos; debe iniciar en 9                |
| Correo electrónico   | Email     | Formato válido; verificación de unicidad    |
| Dirección            | Text      | Mín. 5 caracteres                           |

**Validación de unicidad de documento:**
Al salir del campo "Número de documento", el sistema verifica si
ya existe un cliente con ese documento:
Si existe → Banner amarillo inline:
"Ya existe un cliente registrado con este documento:
Juan Pérez Quispe (DNI 45678901).
¿Deseas ver su perfil o continuar registrando uno nuevo?"
[Ver perfil existente] [Continuar con nuevo registro]"

text

#### Sección A1.2 — Datos complementarios (opcionales)

| Campo                  | Tipo     | Notas                                      |
|------------------------|----------|--------------------------------------------|
| Fecha de nacimiento    | Date     | Para calcular edad al momento del crédito  |
| Ingresos mensuales     | Number   | En PEN; referencial para evaluación        |
| Moneda de ingresos     | Select   | PEN / USD                                  |
| Situación laboral      | Select   | Dependiente / Independiente / Otro         |
| Empresa empleadora     | Text     | Visible solo si Dependiente                |
| Cargo / Ocupación      | Text     | Libre                                      |
| Notas internas         | Textarea | Visible solo para asesores; no para cliente|

**Acciones:**
- Botón "Guardar cliente" → valida → guarda en BD → redirige a
  Pantalla A2 (perfil del cliente recién creado)
- Botón "Guardar y crear cotización" → guarda → entra directamente
  al Flujo 1 con el cliente pre-seleccionado
- Botón "Cancelar" → descarta con modal de confirmación si hay
  datos ingresados

**Mensaje de éxito:**
✓ Cliente registrado: Juan Pérez Quispe (DNI 45678901)
ID asignado: CLI-2026-00089

text

---

### PANTALLA A2 — Perfil completo del cliente

**Ruta:** `/clientes/:id`

**Esta es la pantalla más rica del módulo. Consolida toda la
información del cliente en un solo lugar.**

**Encabezado del perfil:**
┌──────────────────────────────────────────────────────────────┐
│ Juan Pérez Quispe [Editar] [⋮] │
│ DNI 45678901 | 987654321 | juan@correo.com │
│ Registrado: 08/04/2026 por a.torres | Estado: Activo │
│──────────────────────────────────────────────────────────────│
│ Ingresos: S/. 4,500/mes | Situación: Dependiente │
│ Empresa: Transportes Lima S.A.C. │
└──────────────────────────────────────────────────────────────┘

text

**Tabs de contenido:**
[Datos personales] [Cotizaciones] [Operaciones] [Historial de cambios]

text

#### Tab: Datos personales
Muestra todos los campos del formulario en modo lectura, con botón
"Editar" que activa el formulario inline sin cambiar de pantalla.

#### Tab: Cotizaciones
Lista de todas las cotizaciones asociadas al cliente:

| ID             | Vehículo              | Monto financ. | TCEA   | Estado    | Fecha      |
|----------------|-----------------------|---------------|--------|-----------|------------|
| COT-2026-00147 | Toyota Corolla 2025   | S/. 45,000    | 21.45% | SIMULADA  | 08/04/2026 |
| COT-2026-00089 | Hyundai Tucson 2024   | S/. 72,000    | 22.10% | ARCHIVADA | 01/03/2026 |

Botón: "Nueva cotización para este cliente" → entra al Flujo 1
con cliente pre-seleccionado.

#### Tab: Operaciones
Lista de operaciones activas o cerradas del cliente (créditos
formalizados). En un sistema universitario esta sección puede
estar presente aunque los estados sean simulados.

| ID             | Vehículo            | Saldo pendiente | Estado  | Próxima cuota |
|----------------|---------------------|-----------------|---------|---------------|
| OPE-2026-00089 | Toyota Corolla 2025 | S/. 32,346.94   | ACTIVA  | 15/05/2026    |

#### Tab: Historial de cambios
Registro auditable de toda modificación al perfil:
┌────────────────┬───────────┬──────────────┬──────────────────────────────┐
│ Fecha/Hora │ Usuario │ Acción │ Detalle │
├────────────────┼───────────┼──────────────┼──────────────────────────────┤
│ 08/04 22:14 │ a.torres │ EDICION │ celular: 98765 → 987654321 │
│ 08/04 20:30 │ a.torres │ CREACION │ Registro inicial │
└────────────────┴───────────┴──────────────┴──────────────────────────────┘

text

---

### PANTALLA A3 — Editar cliente

**Ruta:** `/clientes/:id/editar`

El formulario es idéntico al de registro (Pantalla A1) pero con
todos los campos pre-rellenados con los valores actuales.

**Comportamiento al editar:**
- Cada campo modificado queda marcado visualmente (borde azul +
  etiqueta "Modificado") antes de guardar
- Al hacer clic en "Guardar cambios", el sistema muestra un resumen
  de los campos que cambiaron:
Cambios detectados:
- Celular: 98765 → 987654321
- Ingresos: S/. 3,800 → S/. 4,500

¿Confirmar cambios? [Cancelar] [Guardar]

text

- Tras confirmar, los cambios se guardan en BD y se registra una
  entrada en el historial de cambios del cliente
- El enunciado exige explícitamente poder editar y volver a
  guardar los datos registrados

**Restricción:**
No es posible cambiar el tipo ni número de documento de un cliente
que ya tiene cotizaciones u operaciones asociadas. En ese caso, el
campo aparece deshabilitado con tooltip:
"El documento no puede modificarse porque este cliente tiene
cotizaciones asociadas. Contacta al administrador si es necesario."

---

## MÓDULO B — Catálogo de Vehículos

### PANTALLA B0 — Lista del catálogo

**Ruta:** `/vehiculos`

**Encabezado:**
┌──────────────────────────────────────────────────────────────┐
│ Catálogo de Vehículos [+ Nuevo vehículo] │
│──────────────────────────────────────────────────────────────│
│ Buscar: [_________________________] Filtrar: [Todos ▾] │
└──────────────────────────────────────────────────────────────┘

text

**Filtros disponibles:**
- Por marca: dropdown con marcas registradas en el sistema
- Por moneda: PEN / USD / Todos
- Por año: rango mínimo - máximo
- Por precio: rango mínimo - máximo
- Por estado: Disponible / Archivado

**Vista del catálogo — dos modos:**

**Modo tabla** (default para asesores):

| Marca   | Modelo         | Año  | Versión    | Precio        | Moneda | Val. Residual | Estado      | Acciones |
|---------|----------------|------|------------|---------------|--------|---------------|-------------|----------|
| Toyota  | Corolla        | 2025 | XEI CVT    | 85,990.00     | PEN    | 25,500.00     | Disponible  | ⋮        |
| Hyundai | Tucson         | 2024 | GLS AT     | 129,000.00    | PEN    | 45,000.00     | Disponible  | ⋮        |
| Kia     | Sportage       | 2025 | EX AT      | 115,500.00    | PEN    | 40,000.00     | Disponible  | ⋮        |
| Toyota  | Hilux          | 2025 | SRX 4x4    | 62,000.00     | USD    | 20,000.00     | Disponible  | ⋮        |

**Modo tarjeta** (más visual, para presentaciones):
Cada vehículo como card con marca, modelo, año, precio en grande,
TCEA estimada a 36 meses (calculada con tasa referencial configurable)
y botón "Simular crédito".

**Menú de acciones por fila (⋮):**
- Ver ficha completa
- Editar
- Simular crédito vehicular → entra al Flujo 1 con vehículo
  pre-seleccionado
- Archivar

---

### PANTALLA B1 — Registrar nuevo vehículo

**Ruta:** `/vehiculos/nuevo`

**Formulario:**

#### Sección B1.1 — Identificación del vehículo (obligatoria)

| Campo               | Tipo     | Validación                                    |
|---------------------|----------|-----------------------------------------------|
| Marca               | Text     | Mín. 2 caracteres; con autocompletado de      |
|                     |          | marcas ya registradas                         |
| Modelo              | Text     | Mín. 2 caracteres                             |
| Versión / Trim      | Text     | Opcional (ej: XEI CVT, SRX 4x4)              |
| Año                 | Number   | Entre 2000 y año actual + 1                   |
| Precio de lista     | Number   | Mayor a 0; separador de miles automático      |
| Moneda del precio   | Select   | PEN / USD                                     |
| Concesionario       | Text     | Nombre del dealer o punto de venta            |

#### Sección B1.2 — Datos para "Compra Inteligente" (importantes)

| Campo                   | Tipo     | Notas                                      |
|-------------------------|----------|--------------------------------------------|
| Valor residual estimado | Number   | Monto o % del precio; base para calcular   |
|                         |          | la cuota balón final del esquema           |
| Tipo de valor residual  | Radio    | Monto fijo / Porcentaje del precio         |
| Plazo típico del producto| Select  | 24 meses / 36 meses / Ambos                |

**Tooltip en "Valor residual estimado":**
"Es el monto que el cliente pagará al final del plazo si decide
conservar el vehículo bajo el esquema Compra Inteligente. Se
incluye como última cuota en el cronograma y forma parte del
cálculo de la TCEA."

#### Sección B1.3 — Información adicional (opcional)

| Campo              | Tipo     | Notas                                         |
|--------------------|----------|-----------------------------------------------|
| Color(es)          | Text     | Colores disponibles separados por coma        |
| Tipo de vehículo   | Select   | Sedan / SUV / Camioneta / Hatchback / Otro    |
| Transmisión        | Select   | Manual / Automática / CVT                     |
| Combustible        | Select   | Gasolina / Diesel / Híbrido / Eléctrico       |
| Notas internas     | Textarea | Solo visible para asesores                    |

**Acciones:**
- Botón "Guardar vehículo" → valida → guarda → redirige a ficha B2
- Botón "Guardar y simular crédito" → guarda → entra al Flujo 1
  con el vehículo pre-seleccionado
- Botón "Cancelar" → modal de confirmación si hay datos ingresados

---

### PANTALLA B2 — Ficha del vehículo

**Ruta:** `/vehiculos/:id`

**Encabezado:**
┌──────────────────────────────────────────────────────────────┐
│ Toyota Corolla XEI CVT 2025 [Editar] [⋮] │
│ Precio: S/. 85,990.00 | Valor residual: S/. 25,500.00 │
│ Concesionario: Toyota del Perú S.A. │
│ Registrado: 08/04/2026 por a.torres | Estado: Disponible │
└──────────────────────────────────────────────────────────────┘

text

**Tabs de contenido:**
[Datos del vehículo] [Simulaciones rápidas] [Cotizaciones asociadas]

text

#### Tab: Datos del vehículo
Todos los campos en modo lectura con botón "Editar" inline.

#### Tab: Simulaciones rápidas
Panel de simulación express sin necesidad de ir al Flujo 1 completo.
Permite al asesor mostrar tres escenarios rápidos al cliente en sala:
┌─────────────────────────────────────────────────────────────┐
│ SIMULACIÓN RÁPIDA — Toyota Corolla XEI CVT 2025 │
│ Precio: S/. 85,990.00 │
│─────────────────────────────────────────────────────────────│
│ Cuota inicial: [20% ▾] Plazo: [36 meses ▾] │
│ Tasa (TEA): [18.00%] Moneda: [PEN ▾] │
│─────────────────────────────────────────────────────────────│
│ Monto financiado: S/. 68,792.00 │
│ Cuota estimada: S/. 2,490.14 │
│ TCEA estimada: 21.45% │
│─────────────────────────────────────────────────────────────│
│ [Usar estos datos en cotización formal →] │
└─────────────────────────────────────────────────────────────┘

text

El botón "Usar estos datos en cotización formal" lleva al Flujo 1
con el vehículo y los parámetros de la simulación rápida
pre-cargados, agilizando el proceso para el asesor.

#### Tab: Cotizaciones asociadas
Lista de todas las cotizaciones en las que este vehículo ha sido
usado, con cliente, monto financiado, estado y fecha.

---

### PANTALLA B3 — Editar vehículo

**Ruta:** `/vehiculos/:id/editar`

Idéntico al formulario de registro (B1) con campos pre-rellenados.

**Regla de negocio:**
Si el vehículo tiene cotizaciones en estado SIMULADA o PRESENTADA
asociadas, al modificar el precio o valor residual el sistema
muestra una advertencia:
┌─────────────────────────────────────────────────────────────┐
│ ⚠ Atención │
│ │
│ Este vehículo tiene 2 cotizaciones activas asociadas. │
│ Modificar el precio NO actualizará automáticamente │
│ esas cotizaciones. │
│ │
│ Si deseas actualizar las cotizaciones, deberás │
│ editarlas por separado desde el módulo de cotizaciones. │
│ │
│ ¿Continuar con la edición del vehículo? │
│ [Cancelar] [Continuar] │
└─────────────────────────────────────────────────────────────┘

text

Esto es correcto porque una cotización es una "foto" de las
condiciones en un momento dado; cambiar el precio del vehículo
en el catálogo no debe alterar cotizaciones ya generadas.

---

## Diagrama de flujo resumido
[NAVEGACIÓN LATERAL]
├── Clientes
│ │
│ ├── [LISTA DE CLIENTES]
│ │ ├── Buscar / filtrar
│ │ ├── → Ver perfil
│ │ ├── → Editar
│ │ ├── → Nueva cotización (→ Flujo 1)
│ │ └── → Nuevo cliente
│ │
│ ├── [NUEVO CLIENTE]
│ │ └── Guardar → Perfil / Guardar y cotizar → Flujo 1
│ │
│ ├── [PERFIL CLIENTE]
│ │ ├── Tab: Datos personales (lectura / edición inline)
│ │ ├── Tab: Cotizaciones → links a cada cotización
│ │ ├── Tab: Operaciones → links a cada operación
│ │ └── Tab: Historial de cambios
│ │
│ └── [EDITAR CLIENTE]
│ └── Guardar cambios → resumen → confirmar → Perfil
│
└── Vehículos
│
├── [CATÁLOGO DE VEHÍCULOS]
│ ├── Buscar / filtrar / modo tabla o tarjeta
│ ├── → Ver ficha
│ ├── → Editar
│ ├── → Simular crédito (→ Flujo 1)
│ └── → Nuevo vehículo
│
├── [NUEVO VEHÍCULO]
│ └── Guardar → Ficha / Guardar y simular → Flujo 1
│
├── [FICHA VEHÍCULO]
│ ├── Tab: Datos del vehículo (lectura / edición inline)
│ ├── Tab: Simulaciones rápidas → prellenar Flujo 1
│ └── Tab: Cotizaciones asociadas
│
└── [EDITAR VEHÍCULO]
└── Guardar cambios → advertencia si hay cotizaciones
→ confirmar → Ficha

text

---

## Reglas de control de acceso por rol

| Acción                        | Asesor | Analista | Admin |
|-------------------------------|--------|----------|-------|
| Ver lista de clientes         | ✓      | ✓        | ✓     |
| Registrar nuevo cliente       | ✓      | ✗        | ✓     |
| Editar datos de cliente       | ✓      | ✗        | ✓     |
| Archivar cliente              | ✗      | ✗        | ✓     |
| Ver catálogo de vehículos     | ✓      | ✓        | ✓     |
| Registrar nuevo vehículo      | ✓      | ✗        | ✓     |
| Editar vehículo               | ✓      | ✗        | ✓     |
| Archivar vehículo             | ✗      | ✗        | ✓     |
| Ver historial de cambios      | ✓      | ✓        | ✓     |

---

## Casos especiales y errores

| Situación                              | Respuesta del sistema                            |
|----------------------------------------|--------------------------------------------------|
| Documento de cliente ya registrado     | Advertencia inline con link al perfil existente  |
| Correo duplicado                       | Error inline: "Este correo ya está registrado"   |
| Precio del vehículo en 0 o negativo    | Validación bloqueante con mensaje                |
| Vehículo con año anterior a 2000       | Advertencia no bloqueante: "Año inusual"         |
| Archivar cliente con operación activa  | Bloqueado: "No se puede archivar un cliente      |
|                                        | con operaciones activas."                        |
| Búsqueda sin resultados                | Estado vacío con botón de acción primaria        |
| Campo numérico con texto               | Validación inline inmediata                      |

---

## Notas de implementación académica

- La **simulación rápida en la ficha del vehículo** (Tab B2) es un
  feature que impresiona en exposición porque muestra integración
  entre módulos y fluidez operativa del sistema.
- El **historial de cambios del cliente** (Tab A2) es la evidencia
  directa de que el sistema cumple el requerimiento del enunciado
  de poder editar y volver a guardar los datos, con trazabilidad.
- La **advertencia al editar precio del vehículo** cuando hay
  cotizaciones activas demuestra integridad referencial y
  comprensión del modelo de datos, lo cual es valorado en la
  rúbrica de análisis y diseño del sistema.
- El **control de acceso por rol** (aunque sea básico en la versión
  universitaria) evidencia que el equipo pensó el sistema como un
  backoffice real y no como un formulario simple, lo cual responde
  bien a preguntas sobre seguridad y arquitectura del sistema.