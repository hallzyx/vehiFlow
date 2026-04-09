<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Orquestador de Documentación
# Proyecto: Compra Inteligente (SI642)

## 1) Propósito
Este archivo define cómo debe trabajar cualquier agente dentro del repo.
La fuente de verdad es la documentación en `docs/`.

---

## 2) Mapa de documentos y responsabilidad

### [docs/product.md](docs/product.md)
Define visión de producto, alcance funcional, reglas de negocio, no negociables y definición de terminado.

### [docs/laws.md](docs/laws.md)
Define marco legal peruano (SBS, BCRP, leyes de consumidor) y obligaciones de transparencia/compliance.

### [docs/algorithms.md](docs/algorithms.md)
Define lógica del motor financiero: normalización de tasa, TEM, cronograma francés, gracia, residual, TCEA, VAN y TIR.

### [docs/schema.md](docs/schema.md)
Define modelo de datos, DDL, constraints, migraciones y validaciones de integridad.
**Base de datos objetivo: MySQL 8.0+**.

### [docs/stack.md](docs/stack.md)
Define stack técnico recomendado, skills/MCPs sugeridos y triggers de uso.

### [docs/userflows](docs/userflows)
Define comportamiento UX y flujos operativos (crear cotización, editar, backoffice, pago anticipado, transparencia).

---

## 3) Orden de prioridad cuando hay dudas o conflicto
1. **Normativa y compliance:** [docs/laws.md](docs/laws.md)
2. **Reglas del producto:** [docs/product.md](docs/product.md)
3. **Lógica matemática/financiera:** [docs/algorithms.md](docs/algorithms.md)
4. **Persistencia y estructura de datos:** [docs/schema.md](docs/schema.md)
5. **Flujos de UI/UX:** [docs/userflows](docs/userflows)
6. **Stack y herramientas:** [docs/stack.md](docs/stack.md)

Si persiste conflicto, priorizar siempre cumplimiento SBS y trazabilidad auditable.

---

## 4) Protocolo de trabajo del agente (obligatorio)

Antes de implementar cualquier cambio:
1. Leer [docs/product.md](docs/product.md) + [docs/laws.md](docs/laws.md).
2. Si afecta cálculos, leer [docs/algorithms.md](docs/algorithms.md).
3. Si afecta datos, leer [docs/schema.md](docs/schema.md).
4. Si afecta UI/flujo, leer [docs/userflows](docs/userflows).
5. Alinear implementación con [docs/stack.md](docs/stack.md).

Al finalizar:
1. Validar que no se rompan reglas de compliance (TCEA visible, cronograma desagregado, penalidad=0 en anticipado).
2. Verificar consistencia entre cálculo, UI y persistencia.
3. Documentar cualquier decisión técnica que se aparte del plan.

---

## 5) Reglas no negociables para el agente
- No introducir cargos prohibidos por SBS (desembolso, evaluación crediticia, penalidad por pago anticipado, etc.).
- No cambiar semántica de TCEA, TEA/TEM, VAN/TIR sin actualizar documentación y pruebas.
- No romper el modelo de versionado de cotizaciones y auditoría.
- Mantener lenguaje claro en UI y outputs de documentos.

---

## 6) Guía rápida por tipo de tarea

### A) Nueva feature financiera
Leer: [docs/algorithms.md](docs/algorithms.md), [docs/product.md](docs/product.md), [docs/laws.md](docs/laws.md), [docs/schema.md](docs/schema.md).

### B) Nueva pantalla o flujo
Leer: [docs/userflows](docs/userflows), [docs/product.md](docs/product.md), [docs/laws.md](docs/laws.md).

### C) Cambio de BD o migraciones
Leer: [docs/schema.md](docs/schema.md), [docs/product.md](docs/product.md).
Confirmar compatibilidad MySQL 8.0+.

### D) Endurecimiento de seguridad / auth
Leer: [docs/stack.md](docs/stack.md), [docs/laws.md](docs/laws.md), [docs/product.md](docs/product.md).

---

## 7) Skills/MCPs sugeridos para el agente
Usar como referencia operativa la sección de skills y triggers de [docs/stack.md](docs/stack.md).

Prioritarios para este repo:
- `nodejs-best-practices`
- `vercel-react-best-practices`
- `tailwind-design-system`
- `web-design-guidelines`
- `mermaid-diagrams`
- `commit-work`

Y para documentación técnica viva:
- Context7 (`mcp_context7_*`) para consultar APIs actualizadas.

---

## 8) Criterio de calidad de entrega del agente
Una tarea se considera bien resuelta solo si cumple simultáneamente:
- Correctitud financiera
- Cumplimiento normativo
- Consistencia de datos
- Claridad UX
- Trazabilidad auditable

