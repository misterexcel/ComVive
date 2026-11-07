# Mapa de usuarios

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

> **Revisión crítica 1: Rechazado → cambios aplicados.** Cambios principales (entre paréntesis, los códigos de los hallazgos de la revisión, que no son reglas de la spec):
>
> - **Arrendatario (C-1, C-2):** ve y paga solo su ámbito, sin indicios de la deuda del propietario. El aviso legal en PDF es solo del propietario; el arrendatario ve el detalle del periodo en pantalla.
> - **Periodos (M-1, M-2, M-3, M-8):** siempre hay un borrador vigente y al emitir se crea el siguiente. Los bloqueos y textos son los de la spec actual. Todo pago, reverso y ajuste va al borrador vigente. Se agrega el flujo de corrección de gastos.
> - **Pagos (M-4, M-5, M-6, M-9):** campo "Pagado por", claves de idempotencia, Webpay con monto calculado por la API y un solo pago en curso por unidad, y campos de monto que solo aceptan dígitos.
> - **Identidad (M-11):** el residente se identifica por RUT.
> - **Alcance:** encomiendas, lecturas de consumo y tasa CMF salen de la superficie del MVP.
> - **Referencias (M-10):** revisadas contra la versión actual de `docs/specs/gasto-comun.md`.

Quién usa ComVive, desde dónde y para qué en el MVP. Las reglas de negocio vienen de `docs/specs/gasto-comun.md` (en adelante, "la spec"), y los permisos, de la spec y de `docs/arquitectura.md` §3. Lo que no está en esas fuentes se marca **Supuesto (a validar)** y queda como pregunta al final.

## Superficies

| Superficie | Dispositivo | Usuarios | Principio de diseño |
| --- | --- | --- | --- |
| Web de administración | Computador (pantalla de 13" o más) | Administrador, comité | Densidad clara: tablas, filtros, acciones masivas |
| App residente | Celular iOS y Android | Residente propietario, residente arrendatario | Estado de cuenta y "Pagar gasto común" a un toque; sesiones de segundos |
| Modo conserjería | Tablet en portería | Conserje | **Posterior:** sin pantallas en el MVP hasta que exista la especificación de conserjería |

## Actores

### Administrador (multi-comunidad)

- **Contexto:** profesional que administra varias comunidades. Trabaja en computador a diario, con picos a fin y a comienzo de mes (emisión y cobranza).
- **Objetivo principal:** cerrar el mes rápido y sin errores, y saber quién debe.
- **Superficie:** web de administración, con selector de comunidad.
- **Tareas clave del MVP:**
  - Dar de alta una comunidad con sus unidades, alícuotas, orden de prorrateo, residentes y primer mes a cobrar.
  - Configurar el cobro: porcentaje del fondo de reserva y plazo de vencimiento. La tasa de interés solo se configura con el flag `billing.interest` activo.
  - Registrar gastos y cargos directos en el borrador vigente.
  - Emitir y cerrar periodos.
  - Corregir un gasto de un periodo emitido o cerrado con ajustes (sección H de la spec).
  - Registrar pagos manuales y anularlos.
  - Revisar saldos y cuotas impagas por unidad.
  - Invitar residentes y gestionar usuarios.
- **Dolor actual:** planillas, cálculos del prorrateo a mano y residentes que preguntan cuánto deben.

### Comité de administración

- **Contexto:** copropietarios voluntarios. Entran de vez en cuando (al mes o ante dudas).
- **Objetivo principal:** supervisar al administrador: ver gastos, recaudación y deudas.
- **Superficie:** web de administración en modo lectura. Si un miembro también es residente, usa la app como residente (UX-14).
- **Tareas clave del MVP:** ver periodos, gastos, cargos, pagos y saldos de su comunidad; descargar avisos y reportes.
- **Restricción:** no emite, no cierra, no registra pagos ni edita montos (la API responde 403, CA-24). No exporta planillas con deudas.

### Residente propietario

- **Contexto:** usa el celular unos segundos, una o dos veces al mes, casi siempre al recibir el aviso.
- **Objetivo principal:** saber cuánto debe y pagar.
- **Superficie:** app residente.
- **Tareas clave del MVP:**
  - Primer ingreso a partir de una invitación, con su RUT.
  - Ver el estado de cuenta de sus unidades: total a pagar, vencimiento y detalle de cargos.
  - Pagar con Webpay.
  - Ver su historial de pagos y descargar avisos de cobro en PDF.
  - Ver el resumen de gastos y el saldo de caja de la comunidad.
- **Variantes:** puede tener varias unidades (departamento, estacionamiento, bodega) o unidades en varias comunidades, y puede no vivir en la unidad.

### Residente arrendatario

- **Contexto:** igual que el propietario, pero con menos vínculo con la comunidad; puede cambiar cada año.
- **Objetivo principal:** pagar el gasto común de la unidad que arrienda.
- **Superficie:** app residente.
- **Tareas clave del MVP:**
  - Ver y pagar solo los cargos de **su ventana**, es decir, los emitidos desde su fecha de ingreso (F-9, CA-22).
  - Ver el detalle del periodo en pantalla. No tiene aviso en PDF: el aviso legal es del propietario (F-9, S-19). Si pide la ruta del PDF, la API responde 404.
- **Regla de diseño:** ninguna pantalla, texto ni notificación menciona o insinúa la deuda del propietario.

### Conserje

- **Contexto:** turno en portería, tablet compartida, interrupciones constantes.
- **Alcance:** **Posterior.** No tiene pantallas en el MVP. El flujo de encomiendas (`flujos/conserje-encomienda.md`) queda como referencia hasta que exista la especificación de conserjería.
- **Restricción:** no ve nada del gasto común, ni RUT completo ni deudas (spec, CA-24; arquitectura §3 y §5).

## Matriz de tareas por actor (MVP)

| Tarea | Administrador | Comité | Propietario | Arrendatario |
| --- | --- | --- | --- | --- |
| Alta de comunidad y unidades | Web | Ver | No | No |
| Emitir y cerrar periodo | Web | Ver | No | No |
| Corregir gasto de periodo emitido o cerrado | Web | Ver | No | No |
| Registrar y anular pago manual | Web | Ver | No | No |
| Ver estado de cuenta | Web, todas las unidades | Web, todas las unidades | App, sus unidades | App, solo su ventana |
| Aviso de cobro en PDF | Web | Web | App | No (detalle en pantalla) |
| Pagar con Webpay | No | No | App | App, solo su ventana |
| Exportar planilla con deudas | Web, auditado | No | No | No |
| Invitar residentes | Web | No | No | No |

## Datos personales en pantalla

- **RUT completo:** solo lo ven el titular y el administrador de la comunidad. Para todos los demás se muestra enmascarado (`12.345.***-*`) (G-2; arquitectura §5).
- **Copia local:** la app guarda una copia para mostrar sin conexión. Se borra al cerrar sesión o al perder el acceso a la unidad o a la comunidad. La misma regla aplicará a la tablet cuando exista el modo conserjería.
- **Notificaciones:** sin montos ni nombres de unidad en la pantalla bloqueada. Por ejemplo: "Tienes un nuevo aviso de gasto común".

## Flujos

| Flujo | Archivo | Alcance |
| --- | --- | --- |
| Alta de comunidad y unidades | `flujos/admin-alta-comunidad.md` | MVP |
| Emitir y cerrar periodo | `flujos/admin-emitir-cerrar-periodo.md` | MVP |
| Corregir un gasto de un periodo emitido o cerrado | `flujos/admin-corregir-gasto.md` | MVP |
| Registrar y anular pago manual | `flujos/admin-pago-manual.md` | MVP |
| Estado de cuenta y pago con Webpay | `flujos/residente-estado-de-cuenta-y-pago.md` | MVP |
| Primer ingreso por invitación | `flujos/residente-primer-ingreso.md` | MVP |
| Registrar y entregar encomienda | `flujos/conserje-encomienda.md` | Posterior |

## Requisitos para el arquitecto

- **Simulación de emisión:** la vista previa usa `POST /communities/{communityId}/periods/{periodId}/issue-preview` (arquitectura §4), sin persistir nada. La web nunca calcula montos.
- **Simulación de corrección:** el flujo de corrección necesita un endpoint equivalente que devuelva los ajustes por unidad y cuenta (fórmula H-2) sin persistir. Hoy no está en la arquitectura.
- **Idempotencia:** la confirmación de emisión (A-3.4) y cada envío de pago manual llevan una clave de idempotencia. Ante un corte, la interfaz consulta el estado antes de reintentar.
- **Estado del intento Webpay:** la app necesita consultar el estado del intento en curso de la unidad (arquitectura §4, `WEBPAY_ATTEMPT`).

## Preguntas para el analista y el líder del proyecto

Las preguntas conservan su número. Las resueltas están en "Preguntas cerradas".

- [ ] **UX-1** (analista): **saldos de apertura.** El movimiento `apertura` está reservado (F-10) y su carga va en una especificación de migración que aún no existe. Mientras tanto, la migración del MVP solo valida y confirma unidades, alícuotas y residentes, sin saldos.
- [ ] **UX-6** (analista): **aviso al emitir.** ¿Por qué canal se avisa (WhatsApp, correo o push) y con qué consentimiento? Supuesto: push y correo, sin montos en la pantalla bloqueada; WhatsApp cuando se apruebe el proveedor.
- [ ] **UX-7** (líder y arquitecto): **método de ingreso** (ADR 0005). Supuesto: RUT más un código de un solo uso enviado al contacto registrado por el administrador, sin contraseña.
- [ ] **UX-8** (analista): **identidad por RUT.** Supuesto: el RUT es obligatorio para propietarios y arrendatarios, porque la Ley 21.442 exige llevar un registro de copropietarios y la arquitectura (§4) pide RUT para pagar. La persona se reconoce por su RUT, nunca por correo ni teléfono. ¿Se confirma para los arrendatarios (minimización, Ley 21.719)?
- [ ] **UX-11** (líder): **pagos sin unidad identificada** (P-11 de la spec). El formulario de pago manual exige una unidad.
- [ ] **UX-13** (analista): **varias unidades del mismo dueño.** Supuesto: una transacción Webpay por unidad. ¿Se necesita pagar todas en una sola transacción?
- [ ] **UX-14** (líder): **comité en la app.** Supuesto: en el MVP el comité usa solo la web.
- [ ] **UX-15** (analista): **cambio de alícuotas después de la primera emisión.** La spec lo deja fuera de alcance (casos borde, P-10). Supuesto: la pantalla permite editarlas con advertencia, motivo obligatorio y auditoría; afecta solo a periodos futuros, porque cada emisión guarda su foto de participaciones.
- [ ] **UX-16** (analista): **plantilla de migración.** Supuesto: CSV o Excel propio de ComVive con código, tipo, alícuota, `sort_order`, y RUT, nombre, relación, fecha de ingreso y contacto de cada residente. ¿Se aceptan exportaciones de Edifito o ComunidadFeliz?
- [ ] **UX-17** (analista): **motivo de anulación.** Supuesto: una lista (duplicado, monto erróneo, unidad errónea, cheque protestado, otro) más texto libre, obligatorio cuando se elige "otro".
- [ ] **UX-18** (líder): **panel consolidado multi-comunidad.** Queda después del MVP (arquitectura §3). En el MVP hay selector de comunidad y una lista "Mis comunidades", sin cifras agregadas.
- [ ] **UX-19** (analista): **a quién se notifica la emisión.** Supuesto: el propietario recibe la notificación del aviso, y el arrendatario, la de los cargos de su ventana, cada uno sin montos en la pantalla bloqueada.
- [ ] **UX-20** (analista y líder): **advertencia de cierre por pagos sin conciliar.** La regla A-5.2 la mantiene, pero la conciliación está fuera de alcance, así que la interfaz no puede calcularla. Por decisión del coordinador, el cierre no muestra advertencias. ¿Se quita A-5.2 de la spec?
- [ ] **UX-22** (analista): **corrección de cargos directos.** El flujo de corrección también aplica a cargos directos (base `monto_directo`, por ejemplo una multa mal ingresada), con la fórmula H-2. ¿Se confirma?
- [ ] **UX-23** (analista): **fin de una ocupación.** Al terminar un arriendo, lo pendiente pasa al ámbito del propietario (arquitectura §4, `transfer`). ¿Qué ve el propietario en su estado de cuenta y con qué texto?
- [ ] **UX-24** (analista y arquitecto): **monto autorizado distinto del iniciado en Webpay.** Supuesto: la API no registra el pago y lo deja para que lo revise la administración; el residente ve "En proceso" con el número de orden. ¿Cuál es el procedimiento de revisión y quién lo hace?

## Preguntas cerradas

- **UX-2:** el arrendatario ve y paga solo su ventana. "Total a pagar" es el saldo de su ámbito. No se menciona la deuda del propietario (F-9, CA-22; decisión del coordinador).
- **UX-3 y UX-4:** la app no envía el monto. La API calcula el total del ámbito de quien paga (decisión del coordinador). No hay pago parcial por Webpay en el MVP.
- **UX-5:** existe el endpoint `issue-preview` (arquitectura §4).
- **UX-9:** las encomiendas pasan a Posterior.
- **UX-10:** se resolverá junto con la especificación de conserjería.
- **UX-12:** un solo pago en curso por unidad. Supuesto: después de 15 minutos sin confirmación, la API consulta el estado en Transbank (arquitectura §4).
- **UX-21:** el `sort_order` es un entero editable como número. Se propone en orden natural del código (C-4, S-3).
