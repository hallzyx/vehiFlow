Product Overview
1. Producto
Nombre de trabajo: VehiFlow / Compra Inteligente Perú.
Tipo de producto: aplicación web orientada a entidades financieras para originar, simular, registrar y administrar operaciones de crédito vehicular bajo modalidad “Compra Inteligente”, con cronograma de pagos por método francés vencido ordinario, meses de 30 días, soporte en soles y dólares, y tasas nominales o efectivas.

El enunciado exige que la solución sea una aplicación web o móvil enfocada desde el punto de vista de la entidad que ofrece el servicio, con acceso mediante login y password, registro en base de datos de clientes y vehículos, y cálculo obligatorio de VAN y TIR del préstamo desde la perspectiva del deudor.

Además, el producto debe ajustarse a los requerimientos de entidades financieras autorizadas y contemplar todos los indicadores exigidos por la normativa peruana de transparencia del sistema financiero.

2. Problema
Hoy, una entidad financiera necesita cotizar créditos vehiculares de manera consistente, trazable y transparente, explicando al cliente el costo real del financiamiento, el detalle de cuotas, seguros, gastos y consecuencias de incumplimiento.

La SBS exige que las empresas sean transparentes en tasas, comisiones, gastos, cronogramas, fórmulas y programas de cálculo, y que la información sea clara, explícita y comprensible antes y durante la contratación.

En el caso de “Compra Inteligente”, el producto además debe manejar una estructura especial de cuotas reducidas y una decisión final sobre el valor residual, renovación o conservación del vehículo, como ocurre en ofertas reales del mercado peruano.

BCP describe este producto como un crédito vehicular con cuotas hasta 45% más bajas que un crédito vehicular convencional, normalmente a 24 o 36 meses, con opción final de renovar el auto o conservarlo.

3. Visión
Construir una plataforma de simulación y originación de crédito vehicular que permita a asesores y analistas configurar una operación completa, generar un cronograma válido, calcular indicadores regulatorios y financieros, guardar evidencia de la operación y entregar información transparente al cliente.

La aplicación debe sentirse como un sistema interno bancario-lite: confiable, auditable, explicable y listo para demostrar cumplimiento regulatorio en cada pantalla crítica.

4. Objetivos del producto
Permitir crear operaciones de crédito vehicular con configuración de moneda, tasa, capitalización, plazo, cuota inicial, valor residual y periodos de gracia.

Generar cronogramas de pago bajo sistema francés vencido ordinario y año comercial de 360 días, ya que la SBS dispone que las tasas se expresen en forma efectiva anual considerando un año de 360 días.

Mostrar TCEA, tasa compensatoria efectiva anual, detalle de comisiones y gastos, cronograma desagregado y demás información exigida en la hoja resumen de operaciones activas.

Calcular VAN y TIR desde el punto de vista del deudor, como lo exige expresamente el trabajo final.

Mantener trazabilidad total de clientes, vehículos, cotizaciones, versiones de cronograma, pagos, recalculos y documentos generados.

Evitar cobros no permitidos por la normativa, como cargos por desembolso, evaluación crediticia o cancelación anticipada.

5. Usuarios
5.1 Usuario interno principal
Asesor comercial / ejecutivo de créditos, quien registra al cliente, configura la operación, presenta la simulación, explica costos y genera la propuesta comercial.

5.2 Usuario interno secundario
Analista / supervisor, quien valida parámetros, revisa consistencia financiera, monitorea cumplimiento y aprueba o rechaza operaciones.

5.3 Usuario externo indirecto
Cliente final, quien no necesariamente opera el backoffice, pero sí recibe la simulación, el cronograma, la hoja resumen y la explicación de beneficios, riesgos y condiciones del producto.

6. Alcance funcional
6.1 Autenticación y control de acceso
Inicio de sesión obligatorio con usuario y clave, tal como exige el enunciado.

Roles mínimos: administrador, asesor, analista y auditor.

Bitácora de accesos y acciones sensibles para trazabilidad operativa.

6.2 Configuración financiera
Moneda de operación: PEN o USD.

Tipo de tasa: nominal o efectiva.

Si la tasa es nominal, debe definirse también la capitalización, porque el enunciado lo exige expresamente.

Periodicidad de pago, plazo total, fecha de desembolso, fecha de primera cuota y tratamiento de días.

Periodos de gracia total o parcial al inicio de la operación.

Parametrización del valor residual o cuota balón propia del esquema de “Compra Inteligente”.

6.3 Gestión de clientes
Alta de cliente con datos personales, documento de identidad, contacto, ingresos y datos necesarios para evaluación comercial.

Edición y actualización de registros, ya que el sistema debe permitir modificar los datos y volverlos a guardar.

Historial de cotizaciones y operaciones por cliente.

6.4 Gestión de vehículo
Registro de marca, modelo, año, versión, precio, dealer, cuota inicial y valor comercial.

Asociación del vehículo a una oferta concreta de financiamiento.

Gestión de garantía mobiliaria y documentación relacionada al vehículo financiado.

6.5 Motor de simulación
Cálculo del capital financiado a partir de precio, cuota inicial, gastos financiados y ajustes permitidos.

Conversión correcta de tasas para obtener la tasa periódica aplicable al cronograma.

Generación de cuota periódica bajo método francés, diferenciando interés, amortización, comisiones, gastos y seguros cuando correspondan.

Manejo de gracia total, donde se difiere el pago y los intereses impactan el saldo según la lógica pactada, y gracia parcial, donde puede pagarse interés sin amortización del principal.

Inclusión de valor residual final para representar la modalidad “Compra Inteligente”.

6.6 Cronograma de pagos
La SBS exige que el cronograma para operaciones activas bajo sistema de cuotas incluya número de cuotas, periodicidad, fecha de pago y desglose de amortización del principal, intereses, comisiones y gastos, así como el monto total por cada concepto y la TCEA aplicable.

Por eso, el cronograma del producto debe mostrar como mínimo: número de cuota, fecha de vencimiento, saldo inicial, interés, amortización, seguro, gastos, cuota total, saldo final y TCEA de la operación.

6.7 Indicadores financieros
TCEA de la operación bajo sistema de cuotas, incluyendo principal, intereses, comisiones y gastos trasladados al cliente, conforme al Reglamento SBS.

Tasa compensatoria efectiva anual, fija o variable, con indicación de su naturaleza.

VAN y TIR desde la perspectiva del deudor, porque el enunciado lo pide de forma obligatoria.

Monto total a pagar y costo total del crédito.

6.8 Transparencia y documentos
Generación de hoja resumen de operaciones activas con el contenido mínimo regulatorio.

Generación de cronograma preliminar y cronograma definitivo cuando aplique.

Módulo de beneficios, riesgos y condiciones del producto, siguiendo el Anexo 4 del Reglamento de Transparencia.

Módulo de fórmulas y ejemplos explicativos, porque la SBS exige difundir fórmulas y programas para créditos vehiculares y otros créditos de consumo.

6.9 Operación posterior a la contratación
Registro de pagos efectuados y pagos pendientes.

Recalculo por pago anticipado o adelanto de cuotas.

Generación de cronograma modificado cuando el cliente lo solicite tras un pago anticipado.

Gestión de cancelación total, constancia de no adeudo y levantamiento de garantía.

7. Reglas de negocio críticas
7.1 Tasas
La SBS dispone que las tasas de interés compensatorio y moratorio se expresen en forma efectiva anual y que se considere un año de 360 días.

En consecuencia, aunque el sistema permita ingresar una tasa nominal o efectiva por conveniencia operativa del curso, internamente debe convertir y normalizar la tasa a una forma periódica coherente y exponer al usuario la TEA/TCEA conforme a la normativa.

7.2 TCEA
La TCEA debe igualar el valor actual de todas las cuotas con el monto efectivamente recibido en préstamo, incorporando principal, intereses, comisiones y gastos trasladados al cliente, y en los casos previstos también seguros.

El sistema no debe calcular la TCEA como un simple campo informativo, sino como una salida oficial del motor financiero con soporte auditable y explicación de componentes.

7.3 Cronograma obligatorio
Para créditos bajo sistema de cuotas, la hoja resumen debe incluir el cronograma con desglose de principal, intereses, comisiones y gastos, además del monto total y la TCEA.

Eso significa que una simple “cuota mensual” no basta para aprobar el producto; el detalle componente por componente es obligatorio.

7.4 Pagos anticipados y adelanto de cuotas
La SBS reconoce el derecho del cliente a realizar pagos por encima de la cuota exigible y prohíbe cobrar comisiones, gastos o penalidades por ejercer ese derecho.

El sistema debe diferenciar entre pago anticipado y adelanto de cuotas, registrar la elección del cliente y recalcular plazo o monto de cuotas según corresponda.

7.5 Comisiones y gastos permitidos
La norma distingue entre comisiones y gastos, y prohíbe trasladar al cliente cobros por servicios esenciales o inherentes al crédito, como evaluación crediticia, desembolso, administración del crédito o gestiones asociadas a garantías en productos vehiculares.

Por tanto, el sistema debe bloquear por configuración cualquier cargo prohibido y permitir solo conceptos sustentables y documentables.

7.6 Seguros
La SBS exige informar el monto de la prima, la compañía y la póliza cuando corresponda, y reconoce el derecho del usuario a contratar el seguro ofrecido por la entidad o uno externo que cumpla las condiciones informadas.

BCP, por ejemplo, muestra expresamente ambas alternativas para su producto vehicular.

El sistema debe contemplar seguro de desgravamen y seguro vehicular como conceptos parametrizables, con opción de póliza propia de la entidad o póliza externa endosada.

7.7 Beneficios, riesgos y condiciones
El Reglamento SBS exige publicar y comunicar beneficios, riesgos y condiciones del producto, incluyendo consecuencias del incumplimiento, mecanismos de reclamo, afiliación a débito automático, información sobre seguros, procedimiento de levantamiento de garantías y resolución del contrato.

Por eso, el producto no debe limitarse a “simular cuotas”; también debe entregar información legal-operativa entendible para el cliente.

8. Features obligatorios del MVP
Login con usuario y contraseña.

CRUD de clientes.

CRUD de vehículos.

Simulación de crédito vehicular en PEN y USD.

Soporte para tasa nominal y efectiva.

Soporte para capitalización cuando la tasa sea nominal.

Soporte para gracia total y parcial.

Cálculo de cronograma francés vencido ordinario con meses de 30 días.

Cálculo de TCEA.

Cálculo de VAN y TIR del deudor.

Hoja resumen imprimible o exportable.

Cronograma detallado exportable.

Registro en base de datos de operaciones realizadas.

Módulo de fórmulas y ayuda contextual por campo, alineado con el enunciado que pide ayuda o indicaciones sobre el uso del sistema.

Presentación comercial-académica de alto impacto y video demostrativo como soporte del trabajo.

9. Features recomendados para destacar
Simulador comparativo entre crédito convencional y “Compra Inteligente”, mostrando diferencia de cuota, costo total y valor residual.

Recalculo automático ante cambios en cuota inicial, plazo, seguro o valor residual.

Módulo de auditoría con versionado de simulaciones.

Generador de tabla de sensibilidad para tasa variable, aunque el producto principal sea a tasa fija, porque la SBS exige ejemplos de variación cuando exista tasa variable.

Módulo de pago anticipado con constancia de decisión del cliente.

Flujo de levantamiento de garantía y carta de no adeudo.

Sección “Transparencia” que muestre fórmulas, ejemplos numéricos y glosario financiero.

10. No negociables de cumplimiento
No cobrar ni simular cargos prohibidos como desembolso, evaluación crediticia, cancelación anticipada, administración del crédito o constitución/administración de garantía vehicular como gasto trasladable.

Mostrar siempre TCEA, tasas, comisiones, gastos, tributos y oportunidad de cobro de forma clara.

Generar cronograma con desglose completo.

Permitir pago anticipado sin penalidad.

Informar alternativas de seguro y permitir póliza externa cuando cumpla condiciones.

Mantener lenguaje claro y comprensible en la interfaz y en los documentos.

11. Datos principales del dominio
Cliente
id_cliente

tipo_documento

numero_documento

nombres

apellidos

celular

email

direccion

ingresos_mensuales

situacion_laboral

fecha_registro

Vehículo
id_vehiculo

marca

modelo

version

anio

precio_lista

moneda

concesionario

valor_residual_estimado

Operación de crédito
id_operacion

cliente_id

vehiculo_id

moneda

monto_vehiculo

cuota_inicial

monto_financiado

tipo_tasa

tasa_ingresada

capitalizacion

tea

tem

plazo_meses

gracia_tipo

gracia_meses

seguro_desgravamen

seguro_vehicular

gastos_trasladables_permitidos

valor_residual

tcea

van_deudor

tir_deudor

estado_operacion

Cuota
operacion_id

numero

fecha_vencimiento

saldo_inicial

interes

amortizacion

seguro

gastos

cuota_total

saldo_final

12. Flujos principales
Flujo 1: Crear cotización
El asesor inicia sesión.

Registra o busca al cliente.

Registra o selecciona el vehículo.

Configura moneda, tasa, plazo, gracia, cuota inicial y valor residual.

El sistema genera cronograma, TCEA, VAN y TIR.

El asesor revisa, ajusta y guarda la simulación.

Flujo 2: Entrega transparente de información
El asesor abre la hoja resumen.

El sistema muestra tasa compensatoria efectiva anual, TCEA, comisiones, gastos, seguros y cronograma.

El cliente recibe una explicación de beneficios, riesgos, condiciones, incumplimiento, seguros y derechos de pago anticipado.

Flujo 3: Pago anticipado
El operador registra el pago extraordinario.

El sistema pregunta si se reducirá plazo o monto de cuotas, según la elección del cliente.

El motor recalcula el cronograma y emite la nueva versión.

13. Métricas de éxito
Tiempo de generación de una cotización menor a 2 minutos por asesor.

Cero diferencias entre el cronograma mostrado y el cronograma exportado.

Cero cargos no permitidos configurables en producción académica.

Trazabilidad completa de toda simulación y toda modificación de cronograma.

Capacidad de explicar cada componente de la cuota durante la exposición del trabajo.

14. Riesgos de producto
Calcular mal la TCEA por excluir gastos o seguros que sí corresponden al supuesto regulatorio.

Mezclar cobros permitidos con cargos prohibidos por la SBS.

Tratar “Compra Inteligente” como un préstamo convencional y no modelar el valor residual final.

No diferenciar adecuadamente gracia total, gracia parcial, pago anticipado y adelanto de cuotas.

No presentar hoja resumen, cronograma y explicaciones con lenguaje claro.

15. Definición de terminado
El producto estará “done” cuando permita registrar clientes y vehículos, configurar una operación de crédito vehicular “Compra Inteligente”, generar un cronograma correcto bajo método francés vencido ordinario, calcular TCEA, VAN y TIR, exportar hoja resumen y cronograma, y demostrar cumplimiento con los puntos esenciales del Reglamento de Transparencia SBS y del enunciado del curso.

16. Criterio de diseño del producto
La aplicación debe priorizar tres cosas en cada vista: claridad, cumplimiento y capacidad de defensa en exposición.

Si una pantalla se ve bonita pero no explica bien qué compone la cuota, por qué la TCEA tiene ese valor o qué cargos sí y no pueden trasladarse, entonces el producto todavía no está listo.