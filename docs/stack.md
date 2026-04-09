# stack.md — Stack Tecnológico Recomendado
# Crédito Vehicular "Compra Inteligente" (SI642)

---

## 1) Stack base del proyecto

### Frontend
- **Next.js 16 (App Router)**
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend (en el mismo monorepo Next.js)
- **Route Handlers de Next.js** para endpoints internos (`app/api/*`)
- **Servicios de dominio** en TypeScript (motor financiero desacoplado de la UI)
- **Validación de entrada** con Zod (recomendado)

### Base de datos
- **MySQL 8.0+** (decisión del proyecto)
- **Migraciones SQL versionadas** (carpeta `db/migrations`)
- **Índices y constraints** alineados a compliance SBS

### Autenticación y autorización
- Login con usuario/clave
- Roles mínimos: `ADMIN`, `ASESOR`, `ANALISTA`, `AUDITOR`
- Auditoría de acciones sensibles (`audit_log`)

### Reportes y exportables
- Hoja Resumen y Cronograma en PDF (fase 2)
- Exportación CSV para análisis interno (opcional)

---

## 2) Arquitectura recomendada

- **Capa UI**: pantallas de userflows (`/login`, `/dashboard`, `/cotizacion/*`, `/clientes`, `/vehiculos`, `/operacion/*`)
- **Capa Aplicación**: casos de uso (`crearCotizacion`, `recalcularPagoAnticipado`, `generarHojaResumen`)
- **Capa Dominio**: motor financiero puro (TEA/TEM, francés, gracia, residual, TCEA, VAN, TIR)
- **Capa Persistencia**: repositorios SQL sobre MySQL

Principio clave: el **motor financiero** debe ser determinístico, auditable y testeable sin depender de la UI.

---

## 3) Librerías recomendadas para arrancar implementación

- `zod` → validación robusta de formularios y payloads
- `react-hook-form` → formularios extensos (cliente, vehículo, cotización)
- `dayjs` → fechas de desembolso/cuotas
- `decimal.js` → precisión en cálculos financieros
- `mysql2` o `prisma` → acceso a MySQL
- `vitest` o `jest` → pruebas unitarias del motor financiero

---

## 4) Skills recomendadas para este proyecto (y triggers)

### 4.1 `nodejs-best-practices`
**Uso:** estructurar backend, errores, seguridad y arquitectura Node/TS.

**Triggers sugeridos:**
- “organiza la arquitectura del backend”
- “mejora seguridad de API”
- “refactoriza servicios de Node/Next”

### 4.2 `vercel-react-best-practices`
**Uso:** optimizar rendimiento de React/Next (render, datos, UX).

**Triggers sugeridos:**
- “optimiza performance de esta vista”
- “reduce re-renders”
- “mejora carga inicial en Next.js”

### 4.3 `tailwind-design-system`
**Uso:** sistema de diseño consistente para dashboard/backoffice.

**Triggers sugeridos:**
- “crea design system con Tailwind”
- “estandariza botones, tablas y formularios”
- “define tokens y componentes base”

### 4.4 `web-design-guidelines`
**Uso:** revisión de accesibilidad, legibilidad y UX para exposición.

**Triggers sugeridos:**
- “audita accesibilidad”
- “revisa UX del formulario de cotización”
- “evalúa cumplimiento UI/UX”

### 4.5 `better-auth-best-practices` (opcional)
**Uso:** fortalecer autenticación, sesiones y roles.

**Triggers sugeridos:**
- “implementa auth con roles”
- “refuerza seguridad del login”
- “agrega manejo de sesiones”

### 4.6 `mermaid-diagrams`
**Uso:** diagramas de arquitectura, secuencia y ER para documentación.

**Triggers sugeridos:**
- “genera diagrama de arquitectura”
- “haz un sequence del pago anticipado”
- “dibuja el modelo relacional en Mermaid”

### 4.7 `commit-work`
**Uso:** ordenar commits lógicos y mensajes claros para entregas.

**Triggers sugeridos:**
- “arma commits por feature”
- “proponme conventional commits”
- “separa cambios funcionales de docs”

---

## 5) MCPs recomendados (y triggers)

### 5.1 Context7 Docs (`mcp_context7_*`)
**Uso:** consultar documentación actualizada de Next.js, React, Tailwind, MySQL clients.

**Triggers sugeridos:**
- “busca la forma recomendada en Next 16 para…”
- “trae ejemplos oficiales de React 19”
- “verifica sintaxis actual de librería X”


### 5.2 CWE Assessment (`appmod-cwe-rules-assessment`)
**Uso:** revisar riesgos de seguridad en código antes de entrega.

**Triggers sugeridos:**
- “haz un assessment de seguridad”
- “busca vulnerabilidades CWE”
- “revisa riesgos de inyección/autorización”


---

## 6) Decisiones de stack alineadas a los docs

- Se prioriza **precisión financiera** (uso de decimales exactos y pruebas).
- Se prioriza **cumplimiento normativo SBS** (TCEA, cronograma detallado, cero penalidad por anticipado).
- Se prioriza **trazabilidad** (versionado de cotizaciones y `audit_log`).
- Se prioriza **claridad de interfaz** para sustentar defensa académica.

---

## 7) Stack MVP (resumen corto)

- **Web app:** Next.js 16 + React 19 + TypeScript
- **UI:** Tailwind CSS 4
- **DB:** MySQL 8.0+
- **Motor financiero:** servicios TypeScript puros + tests unitarios
- **Auth/RBAC:** login + roles + auditoría
- **Compliance:** reglas SBS embebidas en validaciones y cálculos
