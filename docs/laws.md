# laws.md — Marco Legal y Normativo
# Crédito Vehicular "Compra Inteligente" — Sistema de Información SI642
# Universidad Peruana de Ciencias Aplicadas (UPC) — Ciclo 2026-10

---

## Introducción

Este documento lista de forma explícita todas las normas legales y
reglamentarias del ordenamiento jurídico peruano que sustentan el
diseño, los cálculos, los indicadores y las restricciones de negocio
implementados en el sistema de información de crédito vehicular.
Cada norma incluye su fuente validada y los artículos directamente
aplicables al producto desarrollado.

---

## BLOQUE 1 — Leyes del Congreso de la República

---

### LEY N° 26702
**Nombre completo:** Ley General del Sistema Financiero y del Sistema
de Seguros y Orgánica de la Superintendencia de Banca y Seguros

**Fecha de promulgación:** 9 de diciembre de 1996

**Fuente oficial (PDF — SBS):**
https://www.sbs.gob.pe/Portals/0/jer/PFRPV_NORMATIVIDAD/NUEVO/Ley-26702.pdf

**Fuente secundaria validada (MEF):**
https://www.mef.gob.pe/es/portal-de-transparencia-economica/297-preguntas-frecuentes/2169-sistema-financiero

**Artículos aplicables al sistema:**

| Artículo | Contenido relevante                                           |
|----------|---------------------------------------------------------------|
| Art. 9°  | Libertad para fijar intereses, comisiones y tarifas. Las     |
|          | empresas del sistema financiero pueden señalar libremente     |
|          | las tasas de interés, comisiones y gastos para sus           |
|          | operaciones activas y pasivas, dentro del límite que         |
|          | establezca el Banco Central de Reserva del Perú (BCRP).     |

**Impacto en el sistema:**
- Fundamento para que la entidad configure libremente la TEA del
  crédito vehicular dentro del sistema.
- Justifica por qué el campo "Valor de la tasa" es editable y no
  tiene un valor fijo predeterminado.
- La tasa ingresada debe respetar el tope máximo publicado por
  el BCRP semestralmente para créditos de consumo.

---

### LEY N° 28587
**Nombre completo:** Ley Complementaria a la Ley de Protección al
Consumidor en Materia de Servicios Financieros

**Fecha de promulgación:** 20 de julio de 2005

**Última modificación:** Ley N° 31143 (2021)

**Fuente oficial (SBS — versión actualizada con Ley N° 31143):**
https://www.sbs.gob.pe/Portals/0/jer/LEY_SIST_FINAN_EMP_COMPLEMENTARIOS/2024/Ley%20N%C2%B0%2028587%20modificada%20por%20Ley%20N%C2%B0%2031143.docx

**Fuente secundaria validada (vLex Perú):**
https://vlex.com.pe/vid/ley-n-28587-complementaria-941616824

**Artículos aplicables al sistema:**

| Artículo | Contenido relevante                                           |
|----------|---------------------------------------------------------------|
| Art. 2°  | Transparencia en la información. Las empresas están          |
|          | obligadas a brindar información previa a la celebración      |
|          | del contrato sobre beneficios, riesgos y condiciones del     |
|          | producto financiero ofrecido.                                |
| Art. 6°  | Cobro de intereses, comisiones y gastos. Las tasas se        |
|          | fijan libremente dentro del límite del BCRP. Las empresas   |
|          | deben difundir constantemente tasas, comisiones y gastos.   |
| Art. 7°  | Cargos no permitidos. Prohíbe el cobro de comisiones o      |
|          | gastos por conceptos que no corresponden a servicios         |
|          | efectivamente prestados al usuario.                          |

**Impacto en el sistema:**
- Fundamento legal del módulo de Transparencia (Userflow 5).
- Sustenta la exigencia de mostrar beneficios, riesgos y
  condiciones del producto en la hoja resumen (Userflow 1,
  Pantalla 6, Sección 6.2).
- Justifica el bloqueo de cargos prohibidos en la Sección 4.5
  del formulario de cotización.

---

### LEY N° 29571
**Nombre completo:** Código de Protección y Defensa del Consumidor

**Fecha de promulgación:** 2 de septiembre de 2010

**Fuente oficial (INDECOPI — SPIJ):**
https://www.gob.pe/institucion/indecopi/normas-legales/1244218-29571

**Fuente secundaria validada (PDF — SPIJ/MINJUS):**
https://spijweb.minjus.gob.pe/wp-content/uploads/2018/09/CODIGO-CONSUMIDOR.pdf

**Fuente secundaria validada (Diario Oficial El Peruano):**
https://diariooficial.elperuano.pe/Normas/obtenerDocumento?idNorma=17

**Artículos aplicables al sistema:**

| Artículo    | Contenido relevante                                        |
|-------------|------------------------------------------------------------|
| Art. 85°    | Liquidación anticipada. El consumidor tiene derecho a     |
|             | pagar anticipadamente el saldo de toda operación de       |
|             | crédito, en forma total o parcial, con la consiguiente    |
|             | reducción de los intereses compensatorios al día de pago  |
|             | y sin que le sean aplicables penalidades de ningún tipo.  |
| Art. 86°    | Derecho a conocer el saldo deudor y a recibir el          |
|             | cronograma de pagos actualizado.                          |
| Art. 87°    | Información mínima en contratos de crédito: monto,        |
|             | tasa de interés efectiva anual, TCEA, comisiones,         |
|             | gastos, número de cuotas y cronograma de pagos.           |
| Art. 88°    | Prohibición de cobros no pactados o no informados al      |
|             | momento de la contratación.                               |

**Impacto en el sistema:**
- Art. 85°: fundamento directo del Userflow 3 (Pago Anticipado).
  Justifica que el campo "Penalidad = S/. 0.00" es obligatorio
  y no configurable.
- Art. 86°: justifica la generación automática del nuevo
  cronograma tras cada pago anticipado parcial.
- Art. 87°: sustenta los campos mínimos de la hoja resumen
  y del cronograma de pagos.

---

### LEY N° 31143
**Nombre completo:** Ley que Protege de la Usura a los Consumidores
de los Servicios Financieros

**Fecha de promulgación:** 29 de abril de 2021

**Fuente oficial (BCRP — referencia en Circular 0008-2021):**
https://www.bcrp.gob.pe/docs/Transparencia/Normas-Legales/Circulares/2021/circular-0008-2021-bcrp.pdf

**Fuente secundaria validada (mafirma.pe):**
https://mafirma.pe/es/noticias/banco-central-de-reserva-del-peru--aprueban-circular-sobre-tasas-de-interes

**Artículos aplicables al sistema:**

| Artículo | Contenido relevante                                           |
|----------|---------------------------------------------------------------|
| Art. 1°  | Establece que el BCRP fija semestralmente la tasa máxima     |
|          | de interés convencional compensatorio aplicable a créditos   |
|          | de consumo (que incluye el crédito vehicular).               |

**Impacto en el sistema:**
- Justifica la validación de advertencia cuando la TEA ingresada
  supera el rango típico para créditos vehiculares en Perú.
- Aunque el sistema universitario no implementa la consulta en
  tiempo real al BCRP, esta ley fundamenta por qué el campo de
  tasa debería tener un límite referencial configurable.

---

## BLOQUE 2 — Resoluciones de la SBS

---

### RESOLUCIÓN SBS N° 8181-2012
**Nombre completo:** Reglamento de Transparencia de Información y
Contratación con Usuarios del Sistema Financiero

**Fecha de emisión:** 25 de octubre de 2012

**Fuente oficial (PDF — SBS / intranet2):**
https://intranet2.sbs.gob.pe/dv_int_cn/763/v4.0/adjuntos/8181-2012.R.pdf

**Fuente alternativa validada (Banco de la Nación):**
http://www.bn.com.pe/transparenciabn/transparencia-financiera/ResolucionSBS-8181-2012.pdf

**Fuente alternativa validada (CMAC Cusco):**
https://www.cmac-cusco.com.pe/api/storage/file/reDM4S0lVlnthSpHGpLiHzU1BB39cmMix71U769K.pdf

**Artículos y disposiciones aplicables al sistema:**

| Artículo / Disposición     | Contenido relevante                               |
|----------------------------|---------------------------------------------------|
| Art. 3° — Principio de     | Las empresas deben ser transparentes en la        |
| transparencia              | difusión de tasas, comisiones, gastos y           |
|                            | condiciones contractuales, de forma clara,        |
|                            | explícita y comprensible para el usuario.         |
| Art. sobre TCEA            | La TCEA debe igualar el valor presente de todos   |
|                            | los flujos de pago (cuotas, comisiones, seguros   |
|                            | y gastos trasladados) con el capital recibido.    |
|                            | Se expresa en forma efectiva anual con base       |
|                            | de 360 días.                                      |
| Art. sobre TEA             | Las tasas de interés compensatorio y moratorio    |
|                            | se expresan en forma efectiva anual considerando  |
|                            | un año de 360 días.                               |
| Anexo 3 — Hoja Resumen     | Define el contenido mínimo obligatorio de la      |
| (Operaciones Activas bajo  | Hoja Resumen para créditos bajo sistema de        |
| sistema de cuotas)         | cuotas: monto, TEA, TCEA, plazo, cronograma,      |
|                            | comisiones, gastos, seguros y garantías.          |
| Anexo 4 — Beneficios,      | Las empresas deben comunicar beneficios, riesgos  |
| Riesgos y Condiciones      | y condiciones del producto antes y durante la     |
|                            | vigencia del contrato.                            |
| Art. sobre Programa        | Las empresas deben difundir las fórmulas y        |
| (software/aplicativo)      | programas de cálculo de sus productos de crédito  |
|                            | para que el usuario pueda verificar los           |
|                            | resultados por su cuenta.                         |
| Art. sobre cronograma      | Para operaciones bajo sistema de cuotas, el       |
|                            | cronograma debe desglosar por cada período:       |
|                            | amortización, intereses, comisiones, gastos y     |
|                            | monto total; más el monto total de cada concepto  |
|                            | y la TCEA de la operación.                        |
| Art. sobre pagos           | El usuario tiene derecho a recibir el cronograma  |
| anticipados                | actualizado tras realizar un pago anticipado.     |
| Art. sobre seguros         | En los seguros exigidos por la entidad, debe      |
|                            | informarse el monto de la prima, la compañía,     |
|                            | la póliza y el derecho del usuario a contratar    |
|                            | una póliza propia que cumpla las condiciones      |
|                            | informadas.                                       |
| Art. sobre cargos          | Se prohíbe trasladar al cliente costos por:       |
| prohibidos                 | evaluación crediticia, desembolso, administración |
|                            | del crédito, constitución/levantamiento de        |
|                            | garantía vehicular y cancelación anticipada.      |

**Impacto en el sistema:**
Esta es la norma de mayor impacto directo en el producto. Sustenta:
- El cálculo de la TCEA (Motor financiero — Userflow 1, Pantalla 4)
- El desglose completo del cronograma (Userflow 1, Pantalla 5)
- La Hoja Resumen automática (Userflow 1, Pantalla 6, Sección 6.1)
- El módulo de Beneficios, Riesgos y Condiciones (Userflow 1,
  Pantalla 6, Sección 6.2)
- El bloqueo de cargos prohibidos (Userflow 1, Pantalla 4,
  Sección 4.5)
- El derecho a póliza propia de seguro (Userflow 1, Sección 4.5)
- La obligación de difundir fórmulas (Userflow 5 completo)
- La generación del nuevo cronograma tras pago anticipado
  (Userflow 3, Pantalla 3)

---

### RESOLUCIÓN SBS N° 3274-2017
**Nombre completo:** Reglamento de Gestión de Conducta de Mercado
del Sistema Financiero

**Fecha de emisión:** 21 de agosto de 2017

**Fuente oficial (PDF — SBS):**
https://intranet2.sbs.gob.pe/dv_int_cn/1731/v7.0/Adjuntos/3274-2017%20R%20mod.doc.pdf

**Fuente secundaria validada (Banco de la Nación):**
https://www.bn.com.pe/transparenciabn/transparencia-financiera/Res-SBS-3274-2017-Reglamento-Gestion-Conducta-Mercado.pdf

**Fuente secundaria validada (Fundación Microfinanzas BBVA):**
https://www.fundacionmicrofinanzasbbva.org/revistaprogreso/reglamento-gestion-conducta-mercado-del-sistema-financiero/

**Artículos aplicables al sistema:**

| Artículo / Sección         | Contenido relevante                               |
|----------------------------|---------------------------------------------------|
| Art. sobre diseño de       | Las empresas deben contar con procedimientos de   |
| productos                  | diseño, validación y monitoreo de productos que   |
|                            | sean acordes con los principios de conducta de    |
|                            | mercado y protección al consumidor.               |
| Art. sobre oferta y        | La información que se brinda al usuario en la     |
| contratación               | etapa de oferta debe ser veraz, suficiente,        |
|                            | comprensible y no inducir a error.                |
| Art. sobre reclamos        | Las empresas deben contar con canales de          |
|                            | atención de reclamos de fácil acceso para         |
|                            | el usuario.                                       |
| Art. sobre capacitación    | El personal que interactúa con usuarios debe      |
|                            | conocer el marco normativo de conducta de         |
|                            | mercado y los productos que comercializa.         |

**Impacto en el sistema:**
- Sustenta el módulo de Información complementaria de la Hoja
  Resumen (canal de reclamos, derechos del usuario).
- Justifica la sección de "Notas del asesor" en el formulario de
  cotización como registro de lo comunicado al cliente.
- Base legal para la referencia "Penalidad: S/. 0.00 — base legal:
  Res. SBS N° 3274-2017 y modificatorias" en el Userflow 3.

---

## BLOQUE 3 — Circulares del BCRP

---

### CIRCULAR BCRP N° 0008-2021-BCRP
**Nombre completo:** Circular sobre Tasas Máximas de Interés
Convencional Compensatorio y Moratorio para Créditos de Consumo

**Fecha de emisión:** 29 de abril de 2021

**Fuente oficial (PDF — BCRP):**
https://www.bcrp.gob.pe/docs/Transparencia/Normas-Legales/Circulares/2021/circular-0008-2021-bcrp.pdf

**Fuente de referencia normativa (BCRP — tasas de interés):**
https://www.bcrp.gob.pe/normas-sobre-las-tasas-de-interes-que-fija-el-bcrp.html

**Fuente secundaria validada (vLex Perú):**
https://vlex.com.pe/vid/866117217

**Disposiciones aplicables al sistema:**

| Disposición                | Contenido relevante                               |
|----------------------------|---------------------------------------------------|
| Tasa máxima compensatoria  | Equivale a 2 veces el promedio de las tasas de   |
| para créditos de consumo   | interés de consumo en moneda nacional publicadas  |
|                            | por la SBS. Se calcula y publica semestralmente   |
|                            | (en mayo y noviembre de cada año).                |
| Tasa máxima moratoria      | Para el sistema financiero: igual a la tasa       |
|                            | máxima compensatoria. No puede superar este       |
|                            | límite bajo ningún concepto.                      |

**Impacto en el sistema:**
- Establece el tope referencial para el campo "Tasa de interés"
  del formulario de cotización.
- Justifica que el sistema muestre una advertencia si la TEA
  ingresada supera el tope semestral publicado por el BCRP.
- Sustenta el campo configurable de "Tasa de interés moratorio"
  en la Hoja Resumen, que no puede exceder la compensatoria.

---

## BLOQUE 4 — Código Civil peruano (base matemático-legal)

---

### DECRETO LEGISLATIVO N° 295 — CÓDIGO CIVIL
**Fecha de promulgación:** 25 de julio de 1984

**Fuente oficial (BCRP — artículos sobre intereses):**
https://www.bcrp.gob.pe/normas-sobre-las-tasas-de-interes-que-fija-el-bcrp.html

**Artículos aplicables al sistema:**

| Artículo    | Contenido relevante                                        |
|-------------|------------------------------------------------------------|
| Art. 1242°  | Define el interés compensatorio (contraprestación por     |
|             | el uso del dinero) y el interés moratorio (indemnización  |
|             | por mora en el pago). Fundamento de la distinción entre   |
|             | tasa compensatoria y tasa moratoria en el sistema.        |
| Art. 1243°  | La tasa máxima del interés convencional compensatorio o   |
|             | moratorio es fijada por el BCRP. Es la base legal del     |
|             | límite de tasa implementado en el motor financiero.       |

**Impacto en el sistema:**
- Fundamento jurídico de la separación entre "interés de la cuota"
  (compensatorio) y "interés por mora" (moratorio) en el cronograma.
- Justifica que el sistema gestione ambos tipos de tasa como
  campos separados y con lógicas de cálculo distintas.

---

## BLOQUE 5 — Normas de referencia del producto "Compra Inteligente"

---

### FÓRMULAS Y EJEMPLOS PUBLICADOS POR ENTIDADES AUTORIZADAS

El Reglamento SBS N° 8181-2012 exige que las entidades difundan
las fórmulas y programas de cálculo de sus productos. A continuación
se listan las fuentes de entidades autorizadas por la SBS que
publican estas fórmulas para crédito vehicular:

**BCP — Crédito Vehicular Compra Inteligente (producto de referencia):**
https://www.viabcp.com/creditos/credito-vehicular/compra-inteligente

**Santander Consumer Perú — Fórmulas y ejemplos (PDF oficial):**
https://www.santanderconsumer.com.pe/wp-content/uploads/2024/11/Formulas-y-ejemplos-Credito-vehicular-Compra-maestra.pdf

**MAF Perú — Fórmulas de Liquidación para Crédito Vehicular (PDF oficial):**
https://mafperu.com/wp-content/uploads/2025/02/8.-Formulas-de-Liquidacion-para-Credito-Vehicular-5.02.25.pdf

**Impacto en el sistema:**
- Las fórmulas publicadas por estas entidades autorizadas
  confirman que el método francés vencido ordinario con meses
  de 30 días y año de 360 días es el estándar del mercado.
- El Módulo de Transparencia (Userflow 5) debe referenciar
  explícitamente estas fuentes al mostrar las fórmulas al usuario.
- La lógica del valor residual / cuota balón del esquema
  "Compra Inteligente" está validada por los documentos oficiales
  de MAF Perú y BCP.

---

## BLOQUE 6 — Tabla resumen de aplicación normativa por módulo

| Módulo del sistema              | Normas aplicables                              |
|---------------------------------|------------------------------------------------|
| Login y control de acceso       | Res. SBS 3274-2017 (conducta de mercado,       |
|                                 | gestión de accesos internos)                   |
| Configuración de tasa           | Ley 26702 Art. 9° / Ley 28587 Art. 6° /       |
|                                 | Circular BCRP 0008-2021                        |
| Conversión de tasa (TEM/TEA)    | Res. SBS 8181-2012 (año 360 días, TEA)         |
| Período de gracia               | Res. SBS 8181-2012 (cronograma bajo cuotas)    |
| Valor residual (Compra Int.)    | Res. SBS 8181-2012 (flujos del deudor, TCEA) / |
|                                 | MAF Perú / BCP (práctica de mercado)           |
| Cálculo de cuota (francés)      | Res. SBS 8181-2012 / MAF Perú (fórmulas)      |
| Cálculo de TCEA                 | Res. SBS 8181-2012 (definición y fórmula)      |
| Cálculo de VAN y TIR            | Res. SBS 8181-2012 (indicadores del deudor)   |
| Seguros y cargos permitidos     | Res. SBS 8181-2012 (cargos permitidos) /      |
|                                 | Ley 28587 Art. 7°                              |
| Cargos prohibidos               | Res. SBS 8181-2012 / Ley 29571 Art. 88°       |
| Hoja Resumen                    | Res. SBS 8181-2012 Anexo 3                    |
| Beneficios, Riesgos y Cond.    | Res. SBS 8181-2012 Anexo 4 / Ley 28587 Art. 2°|
| Pago anticipado sin penalidad   | Ley 29571 Art. 85° / Res. SBS 3274-2017       |
| Nuevo cronograma tras pago      | Ley 29571 Art. 86° / Res. SBS 8181-2012       |
| Canal de reclamos               | Res. SBS 3274-2017                            |
| Módulo de fórmulas y ayuda      | Res. SBS 8181-2012 (difusión de programas) /  |
|                                 | Ley 28587 Art. 2°                              |
| Tasa moratoria                  | D.Leg. 295 Art. 1242°–1243° / Circ. BCRP      |
|                                 | 0008-2021                                      |
| Historial y trazabilidad        | Res. SBS 3274-2017 (documentación de          |
|                                 | políticas y procedimientos)                    |

---

## BLOQUE 7 — Jerarquía normativa aplicable
Constitución Política del Perú (1993)
└── Ley N° 26702 — Ley General del Sistema Financiero (1996)
└── Ley N° 28587 — Transparencia en Servicios Financieros (2005)
└── Ley N° 29571 — Código del Consumidor (2010)
└── Ley N° 31143 — Protección contra la usura (2021)
└── Res. SBS N° 8181-2012 — Reglamento de
Transparencia e Información
└── Res. SBS N° 3274-2017 — Reglamento
de Conducta de Mercado
└── Circular BCRP N° 0008-2021
Tasas máximas de interés

text

Las normas de rango inferior no pueden contradecir a las de rango
superior. En caso de conflicto, prevalece la norma de mayor jerarquía.
El sistema debe implementar las disposiciones más restrictivas cuando
una norma inferior sea más exigente en materia de protección al usuario.

---

## Nota académica

Este documento es parte del trabajo final del curso SI642 — Finanzas
e Ingeniería Económica de la Universidad Peruana de Ciencias Aplicadas,
ciclo 2026-10. Las fuentes listadas son documentos oficiales publicados
por la SBS, el BCRP, el MINJUS (SPIJ), el MEF y el INDECOPI del Perú,
todos de acceso público y verificables al momento de la elaboración
de este trabajo. Las URLs han sido verificadas y corresponden a fuentes
primarias o secundarias de instituciones del Estado peruano o entidades
financieras supervisadas y autorizadas por la SBS.