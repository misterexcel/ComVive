# Mapa de usuarios

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

> **Revisión crítica 1: Rechazado → cambios aplicados.** Cambios principales (entre paréntesis, los códigos de los hallazgos de la revisión, que no son reglas de la spec):
>
> - **Arrendatario (C-1, C-2):** ve y paga solo su ámbito, sin indicios de la deuda del propietario. El aviso legal en PDF es solo del propietario; el arrendatario ve el detalle del periodo en pantalla.
> - **Periodos (M-1, M-2, M-3, M-8):** siempre hay un borrador vigente y al emitir se crea el siguiente. Todo pago, reverso y ajuste va al borrador vigente. Se agrega el flujo de corrección de gastos.
> - **Pagos (M-4, M-5, M-6, M-9):** claves de idempotencia, Webpay con monto calculado por la API y campos de monto que solo aceptan dígitos.
> - **Identidad (M-11):** el residente se identifica por RUT.
> - **Alcance:** encomiendas, lecturas de consumo y tasa CMF salen de la superficie del MVP.
>
> **Revisión crítica 2 (`docs/revisiones/2026-11-07-diseno-rev2.md`) y decisiones del líder del proyecto del 2026-11-07: cambios aplicados.**
>
> - **Pago por ámbito (M1, M2, M3):** el propietario ve su deuda y la del arrendatario por separado, nunca un total neto, y elige pagar "Mi deuda", "Deuda del arrendatario" o "Ambas". El pago manual pide "Aplicar a la deuda de". El bloqueo de Webpay es por (unidad, ámbito). Cuando el propietario paga la deuda del arrendatario, éste ve "Pagado por el propietario".
> - **Webpay en revisión (M4):** lo resuelve Soporte ComVive en 5 días hábiles, en una consola de plataforma; el administrador y el comité lo ven en lectura.
> - **Pagos manuales (M5):** la referencia no es única; manda la clave del formulario.
> - **Anular gasto (M6), versión confirmada (M8), ocupaciones (M7) y usuarios y roles (M9):** flujos nuevos o corregidos.
> - **Menores 1 a 18 y sugerencias:** ver la tabla de resolución de la revisión.
>
> **Revisión crítica 3 (`docs/revisiones/2026-11-07-diseno-rev3.md`) y spec rev. 4: cambios aplicados.**
>
> - **Soporte ComVive (M-5):** la consola muestra el resultado solo en la confirmación inmediata y no recarga un detalle que responde 404.
> - **Ocupaciones (M-6):** término de arriendo y venta con vista previa y versión; arriendo programado.
> - **Comité que vende (M-7):** el rol no se revoca solo; el administrador recibe una alerta y la tarea "Revisar rol de comité" en Inicio > Tareas pendientes.
> - **Textos (M-8):** los de la regla F-17 de la spec, sin variantes.
> - **Menores 1, 2, 4, 5 y 6:** referencias vigentes, ámbito `owner`, permiso `committee_role.grant` y 422 `ADMIN_COMMITTEE_CONFLICT`, textos y códigos de la tabla de errores de la spec, saldo de caja según G-4.
> - **Preguntas cerradas:** UX-14, UX-25, UX-26, UX-27, UX-29, UX-32, UX-34, UX-37, UX-39, UX-41 y UX-46 a UX-49 (textos fijados por la analista en la spec rev. 4, S-52).

Quién usa ComVive, desde dónde y para qué en el MVP. Las reglas de negocio vienen de `docs/specs/gasto-comun.md` (en adelante, "la spec"), y los permisos, de la spec y de `docs/arquitectura.md` §3. Lo que no está en esas fuentes se marca **Supuesto (a validar)** y queda como pregunta al final.

## Superficies

| Superficie | Dispositivo | Usuarios | Principio de diseño |
| --- | --- | --- | --- |
| Web de administración | Computador (pantalla de 13" o más) | Administrador, comité | Densidad clara: tablas, filtros, acciones masivas |
| App residente | Celular iOS y Android | Residente propietario, residente arrendatario | Estado de cuenta y "Pagar gasto común" a un toque; sesiones de segundos |
| Consola de plataforma | Computador | Soporte ComVive, Operaciones ComVive | Mínima: solo lo que cada rol necesita, todo auditado |
| Modo conserjería | Tablet en portería | Conserje | **Posterior:** sin pantallas en el MVP hasta que exista la especificación de conserjería |

## Actores

### Administrador (multi-comunidad)

- **Contexto:** profesional que administra varias comunidades. Trabaja en computador a diario, con picos a fin y a comienzo de mes (emisión y cobranza).
- **Objetivo principal:** cerrar el mes rápido y sin errores, y saber quién debe.
- **Superficie:** web de administración, con selector de comunidad.
- **Cómo obtiene el rol:** se lo otorga Operaciones ComVive, que también crea la comunidad (`flujos/admin-usuarios-y-roles.md`). Ningún administrador otorga ni revoca administradores.
- **Tareas clave del MVP:**
  - Completar la configuración de la comunidad: datos, medios de pago, unidades, alícuotas, orden de prorrateo, ocupantes y primer mes a cobrar.
  - Configurar el cobro: porcentaje del fondo de reserva y plazo de vencimiento; tasa de interés y su activación (`billing.interest`).
  - Registrar gastos y cargos directos en el borrador vigente.
  - Emitir (con notificación automática) y cerrar periodos; reenviar avisos sin notificar.
  - Corregir o anular un gasto de un periodo emitido o cerrado con ajustes (sección H de la spec).
  - Registrar pagos manuales, eligiendo a qué deuda se aplican, y anularlos.
  - Ver los intentos Webpay en revisión de su comunidad, solo en lectura.
  - Registrar ocupaciones: arriendos (también programados), términos, ventas y propietarios faltantes.
  - Revisar deuda y saldo a favor por ámbito y cuotas impagas por unidad.
  - Invitar residentes y otorgar o revocar el rol de comité (`committee_role.grant`).
  - Decidir la tarea "Revisar rol de comité" (Inicio > Tareas pendientes) cuando un miembro del comité vende su última unidad en la comunidad: revocar o mantener el rol, con motivo (M-7).
- **Dolor actual:** planillas, cálculos del prorrateo a mano y residentes que preguntan cuánto deben.

### Comité de administración

- **Contexto:** copropietarios voluntarios. Entran de vez en cuando (al mes o ante dudas).
- **Objetivo principal:** supervisar al administrador: ver gastos, recaudación y deudas.
- **Superficie:** solo la web de administración, en modo lectura (decisión del líder, 2026-11-07). La app no tiene pantallas de comité: si un miembro también es residente, la usa solo como residente.
- **Cómo obtiene el rol:** se lo otorga el administrador, solo si es propietario registrado, con referencia a la asamblea que lo eligió (S-34). No puede ser a la vez administrador de la comunidad (S-43).
- **Si vende su última unidad en la comunidad:** conserva el rol hasta que el administrador decida revocarlo o mantenerlo (M-7, CA-57). Pierde el acceso de residente a la unidad vendida.
- **Tareas clave del MVP:** ver periodos, gastos, cargos, pagos, intentos Webpay, deudas por unidad y el registro de copropietarios de su comunidad; descargar avisos y reportes de a uno.
- **Datos personales que ve (decisión del líder):** nombre, unidad, alícuota y deuda de cada propietario; RUT enmascarado; sin teléfonos ni correos. El arrendatario aparece solo como "Arrendatario", con su deuda (S-33).
- **Restricción:** no emite, no cierra, no registra pagos, no edita montos, no gestiona usuarios ni ocupaciones (la API responde 403, CA-24). No exporta planillas con deudas ni descarga todos los avisos juntos.

### Residente propietario

- **Contexto:** usa el celular unos segundos, una o dos veces al mes, casi siempre al recibir el aviso.
- **Objetivo principal:** saber cuánto debe y pagar.
- **Superficie:** app residente.
- **Tareas clave del MVP:**
  - Primer ingreso a partir de una invitación, con su RUT.
  - Ver su deuda y, aparte, la del arrendatario vigente, con vencido y por vencer.
  - Pagar con Webpay su deuda, la del arrendatario o ambas, si la comunidad tiene pago en línea; si no, ver "Cómo pagar".
  - Ver su historial de pagos y descargar avisos de cobro en PDF.
  - Ver el resumen de gastos y el saldo de caja de la comunidad.
- **Variantes:** puede tener varias unidades (departamento, estacionamiento, bodega) o unidades en varias comunidades, y puede no vivir en la unidad.

### Residente arrendatario

- **Contexto:** igual que el propietario, pero con menos vínculo con la comunidad; puede cambiar cada año.
- **Objetivo principal:** pagar el gasto común de la unidad que arrienda.
- **Superficie:** app residente.
- **Tareas clave del MVP:**
  - Ver y pagar solo los cargos de **su ámbito**: los emitidos mientras es el ocupante responsable, desde que el administrador registra su arriendo (F-9, F-14, CA-22).
  - Ver la vista de su cobro en pantalla (G-7) y el resumen de gastos (G-8). No tiene aviso en PDF; si pide la ruta, ve el 404 neutro.
- **Regla de diseño:** ninguna pantalla, texto ni notificación menciona o insinúa la deuda del propietario. Sí ve quién pagó cada pago de su ámbito: "Pagado por ti", "Pagado por el propietario" o "Registrado por la administración" (F-12, F-17).
- **Privacidad:** antes de usar ComVive se le informa que el propietario ve su nombre, su deuda y los pagos aplicados a ella (S-44).

### Soporte ComVive (equipo ComVive)

- **Contexto:** persona del equipo ComVive, sin membresía en ninguna comunidad.
- **Objetivo:** resolver los pagos Webpay en revisión dentro de 5 días hábiles.
- **Superficie:** consola de plataforma (`flujos/plataforma-soporte-webpay.md`).
- **Restricción:** solo ve los campos de EX-1. Toda lectura y resolución queda en auditoría y la ve el administrador de la comunidad.

### Operaciones ComVive (equipo ComVive)

- **Objetivo:** crear comunidades, otorgar y revocar administradores y, cuando exista el código de comercio, activar el pago en línea, por procedimiento auditado y sin pantalla en el MVP (ADR 0007; UX-33 cerrada).
- **Superficie:** consola de plataforma. No ve datos de negocio de las comunidades.

### Conserje

- **Contexto:** turno en portería, tablet compartida, interrupciones constantes.
- **Alcance:** **Posterior.** No tiene pantallas en el MVP. El flujo de encomiendas (`flujos/conserje-encomienda.md`) queda como referencia hasta que exista la especificación de conserjería.
- **Restricción:** no ve nada del gasto común, ni RUT completo ni deudas (spec, CA-24; arquitectura §3 y §5).

## Matriz de tareas por actor (MVP)

| Tarea | Administrador | Comité | Propietario | Arrendatario | Equipo ComVive |
| --- | --- | --- | --- | --- | --- |
| Crear comunidad | No | No | No | No | Operaciones |
| Configurar comunidad y unidades | Web | Ver | No | No | No |
| Emitir y cerrar periodo | Web | Ver | No | No | No |
| Corregir o anular gasto de periodo emitido o cerrado | Web | Ver | No | No | No |
| Registrar y anular pago manual | Web | Ver | No | No | No |
| Registrar ocupaciones (arriendo, término, venta) | Web | Ver, datos limitados | No | No | No |
| Ver deuda | Web, todas las unidades, por ámbito | Web, todas las unidades, por ámbito, datos limitados | App: su deuda y, aparte, la del arrendatario | App, solo su ámbito | No |
| Aviso de cobro en PDF (RUT enmascarado) | Web | Web, de a uno | App | No (vista del cobro en pantalla) | No |
| Pagar con Webpay | No | No | App: su deuda, la del arrendatario o ambas | App, solo su ámbito | No |
| Ver intentos Webpay en revisión | Web, lectura | Web, lectura | App, los suyos | App, los suyos | Soporte, campos de EX-1 |
| Resolver intentos Webpay en revisión | No (404: no ve la ruta de plataforma) | No (404) | No | No | Soporte |
| Exportar planilla con deudas o todos los avisos | Web, auditado | No | No | No | No |
| Invitar residentes | Web | No | No | No | No |
| Otorgar y revocar comité | Web | No (403) | No | No | No |
| Decidir la tarea "Revisar rol de comité" | Web, Inicio > Tareas pendientes | No (404) | No (404) | No (404) | No |
| Otorgar y revocar administrador | No (403) | No | No | No | Operaciones |

## Datos personales en pantalla

- **RUT completo:** en pantalla solo lo ven el titular y el administrador de la comunidad. Para todos los demás, y **en todo PDF del aviso**, se muestra enmascarado (`12.345.***-*`) (G-2, S-30; arquitectura §5).
- **Comité:** nombre, unidad, alícuota y deuda; RUT enmascarado; sin teléfonos ni correos; arrendatario sin nombre (S-33).
- **Soporte ComVive:** ningún nombre, RUT, contacto ni deuda (EX-1).
- **Copia local:** la app guarda una copia para mostrar sin conexión. Se borra al cerrar sesión, al perder el acceso a la unidad o a la comunidad, y tras 30 días sin sincronizar (supuesto de la arquitectura §5).
- **Notificaciones:** sin montos ni nombres de unidad en la pantalla bloqueada. Al terminar una membresía, el dispositivo deja de recibir notificaciones de esa comunidad.
- **Privacidad:** pantalla informativa (deber de información, Ley 21.719), permisos opcionales aparte y "Ejercer mis derechos" en Más > Privacidad (UX-31).

## Flujos

| Flujo | Archivo | Alcance |
| --- | --- | --- |
| Alta de comunidad y unidades | `flujos/admin-alta-comunidad.md` | MVP |
| Emitir y cerrar periodo | `flujos/admin-emitir-cerrar-periodo.md` | MVP |
| Corregir o anular un gasto de un periodo emitido o cerrado | `flujos/admin-corregir-gasto.md` | MVP |
| Registrar y anular pago manual | `flujos/admin-pago-manual.md` | MVP |
| Ocupaciones: arriendos y cambios de propietario | `flujos/admin-ocupaciones.md` | MVP |
| Usuarios y roles | `flujos/admin-usuarios-y-roles.md` | MVP |
| Estado de cuenta y pago con Webpay | `flujos/residente-estado-de-cuenta-y-pago.md` | MVP |
| Primer ingreso por invitación e ingresos siguientes | `flujos/residente-primer-ingreso.md` | MVP |
| Soporte ComVive resuelve un pago Webpay en revisión | `flujos/plataforma-soporte-webpay.md` | MVP |
| Registrar y entregar encomienda | `flujos/conserje-encomienda.md` | Posterior |

## Requisitos para el arquitecto

Resueltos en `docs/arquitectura.md`: vistas previas con `previewHash` y 409 `PREVIEW_OUTDATED` (emisión, corrección, anulación de grupos de pagos, ocupaciones y resolución de Soporte), `webpay-attempts/current` por ámbito, idempotencia de pagos manuales, rutas `/platform/...`, `admin-tasks`, `payerKind` (`self`, `owner`, `tenant`, `administration`), la ruta para cancelar un arriendo programado, límites de ingreso, respuestas neutras y el texto del bloqueo por ámbito. Siguen abiertos:

- **Advertencia de unidades sin canal de notificación** en `issue-preview` (UX-28).
- **Contacto de ingreso de una persona existente** (UX-30).
- **Borrado del archivo de migración** después de procesarlo (supuesto en `flujos/admin-alta-comunidad.md`).

## Preguntas para el analista y el líder del proyecto

Las preguntas conservan su número. Las resueltas están en "Preguntas cerradas".

- [ ] **UX-1** (analista): **saldos de apertura.** El movimiento `opening` está reservado (F-10) y su carga va en una especificación de migración que aún no existe. Mientras tanto, la migración del MVP solo valida y confirma unidades, alícuotas y ocupantes, sin saldos.
- [ ] **UX-7** (líder y arquitecto): **método de ingreso** (ADR 0005). Supuesto: RUT más un código de un solo uso enviado al contacto de ingreso de la persona, sin contraseña.
- [ ] **UX-8** (analista): **identidad por RUT.** Supuesto: el RUT es obligatorio para propietarios y arrendatarios. ¿Se confirma para los arrendatarios (minimización, Ley 21.719)?
- [ ] **UX-11** (líder): **pagos sin unidad identificada** (P-11 de la spec). El formulario de pago manual exige una unidad.
- [ ] **UX-13** (analista): **varias unidades del mismo dueño.** Supuesto: una transacción Webpay por unidad.
- [ ] **UX-15** (analista): **cambio de alícuotas después de la primera emisión** (P-10). Supuesto: edición con advertencia, motivo obligatorio y auditoría; afecta solo a periodos futuros.
- [ ] **UX-16** (analista): **plantilla de migración.** ¿Se aceptan exportaciones de Edifito o ComunidadFeliz?
- [ ] **UX-17** (analista): **motivo de anulación de pagos.** Supuesto: lista (duplicado, monto erróneo, unidad errónea, cheque protestado, otro) más texto libre si es "otro".
- [ ] **UX-18** (líder): **panel consolidado multi-comunidad.** Queda después del MVP.
- [ ] **UX-28** (arquitecto): ¿`issue-preview` puede advertir las unidades sin ningún canal de notificación, para prevenir "Avisos sin notificar"?
- [ ] **UX-30** (arquitecto): **contacto de ingreso de una persona que ya tiene cuenta.** Supuesto: el código va a su contacto verificado existente, no al que escribe un administrador nuevo, para evitar la toma de cuentas.
- [ ] **UX-31** (abogado y líder): **responsable del tratamiento y canal de derechos** (Ley 21.719). ¿La comunidad es responsable y ComVive encargado? ¿A quién llega "Ejercer mis derechos" y en qué plazo se responde?
- [x] **UX-33** (cerrada 2026-11-07, Menor 5 de la revisión crítica 4): **código de comercio Transbank.** Activar el pago en línea es un procedimiento auditado de Operaciones ComVive, sin pantalla en el MVP (ADR 0007). La consola de Operaciones solo muestra el estado (CON-11).
- [ ] **UX-35** (analista): **coarrendatarios.** ¿Puede haber más de un arrendatario vigente por unidad? Supuesto: no (la arquitectura §4 permite una ocupación de arrendatario vigente o programada por unidad). La parte del término con fecha futura ya la resolvió la spec: se rechaza (F-14, S-47).
- [ ] **UX-36** (analista): **notificaciones de ocupación.** Supuesto: el propietario recibe una notificación sin montos al registrarse un arriendo y al hacerse un traspaso.
- [ ] **UX-38** (analista y abogado): **saldo a favor del vendedor** al registrar una venta. Supuesto: queda en la unidad, como en P-21.
- [ ] **UX-40** (analista): **varios propietarios por unidad, propietario persona jurídica y residentes sin RUT** (por ejemplo, extranjeros con pasaporte).
- [ ] **UX-42** (líder y arquitecto): **alerta de plazo vencido de Soporte:** canal (correo interno, Sentry u otro) y destinatarios.
- [ ] **UX-43** (analista): **"Recaudación del último periodo"** en Inicio. Supuesto: lo imputado a los cargos de ese periodo sobre el total emitido, más los pagos recibidos en el mes por separado.
- [ ] **UX-44** (analista y líder): **quién activa el flag `billing.interest`** en una comunidad. Supuesto: el administrador, con tasa vigente, confirmación y auditoría.
- [ ] **UX-45** (analista): **contenido de la planilla exportada.** Supuesto: unidad, nombre del propietario, RUT enmascarado, deuda y saldo a favor por ámbito, vencido desde y cuotas impagas, sin contactos.

Preguntas legales de la spec que afectan pantallas: P-18 (plazo desde la notificación), P-19 (RUT en el PDF), P-20 (aviso a "Propietario sin registrar"), P-23 (remuneraciones con un solo trabajador y arrendatario viendo el resumen), P-25 (quién integra el comité), P-34 (lo que ve el propietario del arrendatario), P-35 (comité que deja de ser copropietario), P-36 (segundo factor de administradores antes del Piloto), P-33 (corrección de egresos del fondo) y P-38 a P-40 (autorización de egresos, saldo del fondo negativo y pagos del propietario anterior).

## Preguntas cerradas

- **UX-2:** el arrendatario ve y paga solo su ámbito. Actualizada con la decisión del líder del 2026-11-07: el propietario ve su deuda y la del arrendatario por separado y puede pagar cualquiera o ambas (F-9, F-12).
- **UX-3 y UX-4:** la app no envía el monto; envía los ámbitos y el total que vio. La API calcula el monto por ámbito. No hay pago parcial por Webpay en el MVP.
- **UX-5:** existe `issue-preview`, ahora con versión (arquitectura §4).
- **UX-6:** la notificación es automática al emitir, por app y correo; WhatsApp cuando exista la integración (G-6).
- **UX-9:** las encomiendas pasan a Posterior.
- **UX-10:** se resolverá junto con la especificación de conserjería.
- **UX-12:** el bloqueo es por (unidad, ámbito); después de 15 minutos sin confirmación, la API consulta a Transbank (F-12, arquitectura §4).
- **UX-19:** se notifica al propietario (aviso) y al arrendatario vigente (cobro de su ámbito) (G-6).
- **UX-20:** el cierre no hace verificaciones de conciliación (A-5.2).
- **UX-21:** el `sort_order` es un entero editable como número.
- **UX-22:** la corrección y la anulación aplican a gastos y cargos directos (H-6).
- **UX-23:** al terminar un arriendo, lo pendiente pasa a la deuda del propietario como "Traspaso desde arriendo terminado" (F-9, F-13, `flujos/admin-ocupaciones.md`).
- **UX-24:** el intento queda en revisión y lo resuelve Soporte ComVive (F-16, decisión del líder).
- **UX-14 (resuelta, 2026-11-07):** el comité usa **solo la web**. La app no tiene pantallas de comité; un miembro que también es residente ve en la app solo lo de su rol de residente (decisión del líder; spec, "Usuarios y permisos").
- **UX-25 (resuelta):** el texto del bloqueo es "Ya hay un pago en proceso para esta deuda" en la spec (F-12, F-17, `PAYMENT_IN_PROGRESS`), la arquitectura §4 y el diseño (decisión del líder, M-8).
- **UX-26 (resuelta):** la spec rev. 3 y rev. 4 ya recoge las decisiones del líder: el arrendatario ve "Pagado por el propietario" (F-12, S-25; P-22 cerrada) y Soporte ComVive resuelve en 5 días hábiles con alerta automática (F-16, S-32; P-17 cerrada). "Días hábiles" quedó definido en la spec (lunes a viernes sin feriados nacionales legales, S-41).
- **UX-27 (resuelta):** la spec adoptó la propuesta del diseño en G-4 (S-45, CA-58): el saldo de caja es obligatorio, acepta $0 y negativos, su valor absoluto no supera $9.999.999.999 y su fecha de corte no puede ser futura. Errores `CASH_BALANCE_REQUIRED`, `CASH_BALANCE_DATE_IN_FUTURE` y `AMOUNT_TOO_LARGE` (`flujos/admin-emitir-cerrar-periodo.md`).
- **UX-32 (resuelta para el MVP):** Operaciones ComVive crea cada comunidad y su primer administrador (decisión del líder, 2026-11-07; spec, "Otorgamiento de roles"). **Supuesto (a validar):** el autoservicio del administrador queda fuera del MVP y se revisará después del Piloto; si se aprueba, se abrirá una pregunta nueva.
- **UX-34 (resuelta):** el pago manual no registra quién pagó y siempre se muestra "Registrado por la administración", al propietario y al arrendatario (decisión del líder, M-8; F-12, F-17, S-25).
- **UX-37 (resuelta):** el término de arriendo y la venta tienen vista previa con versión y 409 `PREVIEW_OUTDATED` con "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar" (spec A-7 y F-14, CA-56; arquitectura §4: `end-preview`/`end` y `ownership-transfers/preview`/`ownership-transfers`). Diseño en `flujos/admin-ocupaciones.md`.
- **UX-39 (resuelta, cambia el supuesto):** el rol de comité **no** se revoca automáticamente. Al registrar la venta de la última unidad de un miembro del comité, cada administrador recibe una alerta inmediata y queda la tarea "Revisar rol de comité de {nombre}" en Inicio > Tareas pendientes hasta que un administrador decida revocar o mantener, con motivo y auditoría (decisión del líder, M-7; spec "Comité que deja de ser propietario", CA-57). Si la ley exige la pérdida automática, queda en P-35.
- **UX-41 (resuelta):** el segundo factor es **opcional** para administradores en el MVP y obligatorio para los roles de plataforma (decisión del líder, 2026-11-07; spec, "Usuarios y permisos"). Exigirlo a los administradores antes del Piloto queda en P-36. La web ofrece activarlo en "Mi cuenta".
- **UX-29 (resuelta con supuesto):** la spec define la corrección y la anulación de un egreso del fondo en B-3 (Supuesto (a validar) S-46; P-33 sigue abierta para el contador). Diseño en `flujos/admin-corregir-gasto.md`.
- **UX-46 (resuelta):** quien inició el intento ve el estado "Tienes un pago en proceso" y debajo "Número de orden {buy_order}. Te avisaremos el resultado". No es un error; es distinto del 409 `PAYMENT_IN_PROGRESS` ("Ya hay un pago en proceso para esta deuda"), que reciben los demás solo si intentan pagar (F-17, S-52).
- **UX-47 (resuelta):** cancelar un arriendo programado responde, en este orden, 422 `USE_OWNERSHIP_TRANSFER`, 409 `OCCUPANCY_ALREADY_STARTED`, `OCCUPANCY_ALREADY_ENDED` u `OCCUPANCY_CANCELLED`, y 422 `REASON_REQUIRED` con "Indica el motivo de la cancelación". Un pago manual a un arriendo cancelado responde 409 `OCCUPANCY_CANCELLED` (F-9, F-14, CA-61).
- **UX-48 (resuelta):** sin motivo, 422 `REASON_REQUIRED` con "Indica el motivo de la corrección" (o "Indica el motivo de la anulación" con $0); bajo el campo, la ayuda "El motivo aparecerá en el aviso de cobro" (H-7).
- **UX-49 (resuelta):** 409 `ALREADY_COMMITTEE_MEMBER` (S-34, CA-64); 422 `CORRECTION_WITHOUT_CHANGE` con los textos de H-7; advertencias de término y venta con fecha pasada (F-14); "Saldo a favor traspasado desde arriendo terminado el {dd-mm-aaaa}" en lugar de "Pago del arrendatario anterior…" (F-17). Las confirmaciones de Soporte y de la tarea de comité también quedaron en F-17 (S-52).
