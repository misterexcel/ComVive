# Mapa de usuarios

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Quién usa ComVive, desde dónde y para qué en el MVP. Las reglas de negocio vienen de `docs/specs/gasto-comun.md` y los permisos de `docs/arquitectura.md` §3. Lo que no está en esas fuentes se marca **Supuesto (a validar)** y queda como pregunta al final.

## Superficies

| Superficie | Dispositivo | Usuarios | Principio de diseño |
| --- | --- | --- | --- |
| Web de administración | Computador (pantalla de 13" o más) | Administrador, comité | Densidad clara: tablas, filtros, acciones masivas, atajos de teclado |
| App residente | Celular iOS y Android | Residente propietario, residente arrendatario | Estado de cuenta y "Pagar" a un toque; sesiones de segundos |
| Modo conserjería | Tablet en portería (misma app, rol conserje) | Conserje | Botones grandes (mínimo 56 px), flujos de 3 pasos o menos, sin datos financieros |

**Supuesto (a validar):** el modo conserjería vive dentro de la app móvil y se activa según el rol de la membresía; no es una app aparte (ver UX-10).

## Actores

### Administrador (multi-comunidad)

- **Contexto:** profesional que administra varias comunidades; trabaja en computador, a diario, con picos a fin y comienzo de mes (emisión y cobranza).
- **Objetivo principal:** cerrar el mes rápido y sin errores, y saber quién debe.
- **Superficie:** web de administración, con selector de comunidad.
- **Tareas clave del MVP:**
  - Dar de alta una comunidad con sus unidades, alícuotas y residentes (incluida la migración desde planilla).
  - Configurar el cobro: porcentaje del fondo de reserva, plazo de vencimiento, intereses y tope CMF.
  - Registrar gastos y cargos individuales del periodo en borrador.
  - Emitir y cerrar el periodo.
  - Registrar pagos manuales y anularlos cuando corresponde.
  - Revisar saldos y cuotas impagas por unidad.
  - Invitar residentes y gestionar usuarios.
- **Dolor actual:** planillas, cálculos a mano del prorrateo, residentes que preguntan cuánto deben.

### Comité de administración

- **Contexto:** copropietarios voluntarios; entran ocasionalmente (mensual o ante dudas), desde computador o celular.
- **Objetivo principal:** supervisar al administrador: ver gastos, recaudación y deudas.
- **Superficie:** web de administración en modo lectura. **Supuesto (a validar):** en el MVP el comité no tiene vistas propias en la app; si además es residente, usa la app como residente (UX-14).
- **Tareas clave del MVP:**
  - Ver periodos, gastos, cargos, pagos y saldos de su comunidad.
  - Descargar avisos y reportes.
- **Restricción:** no emite, no cierra, no registra pagos ni edita montos (spec, CA-20; P-4 abierta).

### Residente propietario

- **Contexto:** usa el celular unos segundos, una o dos veces al mes, normalmente al recibir el aviso.
- **Objetivo principal:** saber cuánto debe y pagar.
- **Superficie:** app residente.
- **Tareas clave del MVP:**
  - Primer ingreso a partir de una invitación.
  - Ver el estado de cuenta de sus unidades: total a pagar, vencimiento, detalle de cargos.
  - Pagar el gasto común con Webpay.
  - Ver el historial de pagos y descargar avisos de cobro.
- **Variantes:** puede tener varias unidades (depto, estacionamiento, bodega) o unidades en varias comunidades; puede no vivir en la unidad.

### Residente arrendatario

- **Contexto:** igual que el propietario, pero con menos vínculo con la comunidad; puede cambiar cada año.
- **Objetivo principal:** pagar el gasto común de la unidad que arrienda.
- **Superficie:** app residente.
- **Tareas clave del MVP:** las mismas que el propietario, limitadas a los cargos y pagos desde el inicio de su ocupación (spec, S-14 y CA-20).
- **Punto delicado:** la deuda es de la unidad. Si paga, el pago se imputa primero a lo más antiguo (spec, F-5), aunque sea anterior a su ingreso y no la vea (UX-2).

### Conserje

- **Contexto:** turno en portería, tablet compartida, interrupciones constantes, a veces con guantes o de pie.
- **Objetivo principal:** registrar lo que pasa en portería sin perder tiempo.
- **Superficie:** modo conserjería en tablet.
- **Tareas clave:** registrar y entregar encomiendas (**propuesta MVP**, ver `flujos/conserje-encomienda.md`); visitas y bitácora quedan para después.
- **Restricción:** no ve nada del gasto común, ni RUT completo ni deudas (spec, CA-20; arquitectura §3 y §5).

## Matriz superficie por tarea (MVP)

| Tarea | Administrador | Comité | Propietario | Arrendatario | Conserje |
| --- | --- | --- | --- | --- | --- |
| Alta de comunidad y unidades | Web | Ver | No | No | No |
| Emitir y cerrar periodo | Web | Ver | No | No | No |
| Registrar y anular pago manual | Web | Ver | No | No | No |
| Ver estado de cuenta | Web, todas las unidades | Web, todas las unidades | App, sus unidades | App, desde su ingreso | No |
| Pagar con Webpay | No | No | App | App | No |
| Invitar residentes | Web | No | No | No | No |
| Registrar encomienda | No (posterior: ver) | No | App, recibe aviso | App, recibe aviso | Tablet |

## Flujos de este entregable

| Flujo | Archivo | Alcance |
| --- | --- | --- |
| Alta de comunidad y unidades | `flujos/admin-alta-comunidad.md` | MVP |
| Emitir y cerrar periodo | `flujos/admin-emitir-cerrar-periodo.md` | MVP |
| Registrar y anular pago manual | `flujos/admin-pago-manual.md` | MVP |
| Estado de cuenta y pago Webpay | `flujos/residente-estado-de-cuenta-y-pago.md` | MVP |
| Primer ingreso por invitación | `flujos/residente-primer-ingreso.md` | MVP |
| Registrar y entregar encomienda | `flujos/conserje-encomienda.md` | Propuesta MVP, sujeta a especificación |

## Preguntas para el analista y el líder del proyecto

Cada pregunta indica a quién va y qué supuesto se tomó mientras tanto.

- [ ] **UX-1** (analista): **saldos iniciales al migrar.** La spec no define cómo entra la deuda o el saldo a favor histórico de cada unidad al pasar a ComVive. La pantalla de migración reserva un paso para eso, sin regla. ¿Se registran como ajuste en el primer periodo en borrador, con qué cuenta y con qué antigüedad (afecta intereses e imputación)?
- [ ] **UX-2** (analista): **el arrendatario no ve la deuda anterior, pero su pago se imputa a ella** (F-5 con S-14). ¿Qué monto le mostramos en "Total a pagar" y cómo le explicamos que parte de su pago puede cubrir deuda anterior? Supuesto: se muestra el saldo visible desde su ingreso y una nota "La unidad tiene deuda anterior a tu ingreso; tu pago se aplica primero a lo más antiguo".
- [ ] **UX-3** (analista): **pago parcial por Webpay.** Supuesto: en el MVP el residente paga el total a pagar de una unidad, sin elegir monto. ¿Se debe permitir "Pagar otro monto"?
- [ ] **UX-4** (analista): **qué es "Total a pagar" en la app.** Supuesto: el saldo de la unidad si es mayor que 0 (deuda vencida más cargos emitidos no vencidos). Con saldo 0 o a favor, el botón "Pagar" no se muestra.
- [ ] **UX-5** (analista y arquitecto): **vista previa de la emisión.** El flujo muestra los cargos calculados antes de confirmar. Supuesto: la API ofrece una simulación sin escritura con el mismo cálculo de la emisión (la web no calcula montos, arquitectura §1).
- [ ] **UX-6** (analista): **aviso al residente cuando se emite.** ¿Por qué canal (WhatsApp, correo, notificación push), con qué texto y con qué consentimiento? Supuesto: notificación push y correo en el MVP; WhatsApp cuando se apruebe el proveedor.
- [ ] **UX-7** (líder y arquitecto): **método de ingreso del residente** (ADR 0005). Supuesto: enlace de invitación más código de un solo uso al teléfono o correo registrado; sin contraseña.
- [ ] **UX-8** (analista): **datos mínimos para invitar.** Supuesto: nombre, unidad, relación (propietario o arrendatario), fecha de inicio de ocupación y teléfono o correo. ¿El RUT es obligatorio para el residente (Ley 21.719, minimización)?
- [ ] **UX-9** (líder): **encomiendas en el MVP.** Se propone incluir registrar y entregar encomiendas, y dejar visitas para después. Falta la especificación del módulo de conserjería.
- [ ] **UX-10** (líder y arquitecto): **tablet compartida.** ¿Cada conserje inicia sesión con su cuenta (cambio de turno con PIN) o hay una cuenta de portería? Supuesto: cuenta por persona y cambio rápido de usuario con PIN de 4 dígitos, para que la auditoría identifique al conserje.
- [ ] **UX-11** (analista): **pagos sin unidad identificada** (P-11 de la spec). El formulario de pago manual exige unidad. ¿Se necesita una bandeja de "pagos por identificar"?
- [ ] **UX-12** (analista): **Webpay sin confirmación.** ¿Cuánto tiempo queda un pago "en proceso" y qué ve el residente si intenta pagar de nuevo? Supuesto: se advierte "Tienes un pago en proceso" y se permite reintentar; la idempotencia (F-2) evita el doble crédito por la misma orden, pero no un segundo pago con otra orden.
- [ ] **UX-13** (analista): **varias unidades del mismo dueño.** Supuesto: una transacción Webpay por unidad en el MVP. ¿Se necesita pagar todas en una sola transacción?
- [ ] **UX-14** (líder): **comité en la app.** Supuesto: el comité usa solo la web en el MVP.
- [ ] **UX-15** (analista): **editar alícuotas después de la primera emisión** (P-10 de la spec). Supuesto: se permite solo con un periodo en borrador, con advertencia, motivo obligatorio y auditoría.
- [ ] **UX-16** (analista): **formato de la planilla de migración.** Supuesto: plantilla CSV o Excel propia de ComVive con código, tipo, alícuota, orden, propietario, arrendatario y contacto. ¿Se aceptan exportaciones de Edifito o ComunidadFeliz?
- [ ] **UX-17** (analista): **motivo de anulación de pago.** Supuesto: lista (duplicado, monto erróneo, unidad errónea, cheque protestado, otro) más texto libre obligatorio con "otro".
- [ ] **UX-18** (líder): **panel consolidado multi-comunidad.** Se confirma que queda después del MVP (arquitectura §3); en el MVP hay selector de comunidad y una lista "Mis comunidades" sin cifras agregadas.
- [ ] **UX-19** (analista): **a quién se notifica.** Si la unidad tiene propietario y arrendatario, ¿ambos reciben el aviso de emisión? La spec dirige el aviso al propietario (F-9). Supuesto: ambos reciben la notificación; cada uno ve solo su alcance.
- [ ] **UX-20** (líder): **conciliación bancaria en el MVP.** La spec la deja como módulo propio y el cierre advierte sobre pagos sin conciliar. La arquitectura de información la marca como "por definir".
- [ ] **UX-21** (analista): **orden de prorrateo en la interfaz.** La spec (S-3) propone orden por código; `docs/qa/comunidades-simuladas.md` y la arquitectura usan `sort_order` entero y prohíben desempatar por texto. Supuesto: la interfaz propone un orden inicial por código en orden natural y el administrador puede reordenar; se guarda como entero.
