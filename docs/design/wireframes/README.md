# Wireframes

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Wireframes de baja fidelidad de las pantallas del MVP de ComVive, en ASCII, para revisión. Cubren los 10 flujos de `../flujos/`, con sus estados vacíos, de carga, de error, de conflicto (409) y de permisos (404 y 403). Los componentes, tokens y formatos están en `../design-system.md`; los menús, en `../arquitectura-de-informacion.md`. Las reglas de negocio vienen de `docs/specs/gasto-comun.md` rev. 6 ("la spec"): los wireframes no agregan reglas ni códigos de error.

## Convenciones

**Dibujo.** Cada wireframe va en un bloque `text`. Los marcos dibujan el borde superior, el izquierdo y el inferior; el derecho se omite para que el texto se pueda editar sin realinear. El ancho del marco sugiere la superficie: unos 40 caracteres para la app (360 px) y unos 95 para la web y la consola (1280 px).

| Notación | Significado | Componente |
| --- | --- | --- |
| `[[ Texto ]]` | Botón principal | `Button` `primary` |
| `[ Texto ]` | Botón secundario | `Button` `secondary` |
| `( Texto )` | Botón de cancelar o volver | `Button` `secondary` a la izquierda |
| `[! Texto !]` | Botón de acción irreversible | `Button` `danger` |
| `> Texto` | Enlace o acción de tabla | `Button` `ghost` |
| `<Texto>` | Chip de estado (ícono más texto) | `StatusChip` |
| `[ valor ]` | Campo con su valor; `v` al final indica lista | `TextField`, `Select` |
| `( )` y `(o)` | Opción sin marcar y marcada | `RadioGroup` |
| `[ ]` y `[x]` | Casilla sin marcar y marcada | Casilla |
| `{i}` `{ok}` `{!}` `{x}` | Banner de información, éxito, advertencia y error | `AlertBanner` |
| `(!)` bajo un campo | Error del campo | Anatomía de campos (5.2) |
| `~~~~` | Esqueleto de carga | `Skeleton` |
| `+-[borde rojo]-` | Tarjeta con borde de estado de 4 px | `DebtCard` |
| Barra vertical extra al inicio de una fila de tabla | Fila marcada "Cambió" tras un 409 (borde `color.warning`) | `DataTable` |
| `<-` | Nota del diseño, no se muestra | — |

**Datos.** Cada wireframe declara su escenario: comunidad, fecha y criterio de aceptación de origen. Los montos son CLP enteros con formato chileno y salen de la spec o de `docs/qa/comunidades-simuladas.md`; los que no fija ninguna fuente van entre llaves (`{RUT}`, `${monto}`) o marcados "ilustrativo". La interfaz nunca calcula montos: cuando un wireframe muestra un total, es el que entrega la API.

**Textos.** Tres orígenes, como en el design system:

- **Spec:** textos de la tabla "Códigos y mensajes de error" y de F-17, copiados tal cual, incluida la ausencia de punto final.
- **Flujo:** textos de los flujos de `../flujos/`.
- **Texto del diseño:** texto nuevo de estos wireframes, marcado con su pregunta (UX-61, UX-63, UX-64, UX-69 o UX-75). Los marcados UX-69 los aprobó el líder en bloque junto con los wireframes (D15, 2026-11-07).

**Identificadores.** `GLB-` estados globales; `APP-` app residente; `WEB-` web de administración y comité; `CON-` consola de plataforma; `CNJ-` conserjería (Posterior).

## Índice de pantallas

### Comunes

| ID | Pantalla | Archivo |
| --- | --- | --- |
| Marcos | Marco de la web y de la app | `comunes-estados-globales.md` |
| GLB-01 a GLB-02 | 404 neutro en web, consola y app | `comunes-estados-globales.md` |
| GLB-03 | 403 en la misma pantalla | `comunes-estados-globales.md` |
| GLB-04 | Sin conexión (app) | `comunes-estados-globales.md` |
| GLB-05 | Error inesperado | `comunes-estados-globales.md` |
| GLB-06 | Conflicto 409 `PREVIEW_OUTDATED` | `comunes-estados-globales.md` |
| GLB-07 | Corte de conexión en una acción de dinero | `comunes-estados-globales.md` |
| GLB-08 | 422 `IDEMPOTENCY_KEY_REUSED` | `comunes-estados-globales.md` |
| GLB-09 | Sesión vencida o acceso cambiado | `comunes-estados-globales.md` |
| GLB-10 | Carga | `comunes-estados-globales.md` |

### App residente (propietario y arrendatario)

| ID | Pantalla | Archivo |
| --- | --- | --- |
| APP-ING-01 a 07 | Invitación, RUT, código, confirmación, privacidad, permisos y elección de unidad | `app-ingreso.md` |
| APP-01 | Inicio del propietario sin arrendatario | `app-inicio.md` |
| APP-02 | Inicio del propietario con arrendatario vigente | `app-inicio.md` |
| APP-03 | Inicio del arrendatario | `app-inicio.md` |
| APP-04 | Estados vacíos de Inicio | `app-inicio.md` |
| APP-05 | Pago propio en proceso | `app-inicio.md` |
| APP-06 | Pago en revisión, para reverso y reversado | `app-inicio.md` |
| APP-07 | Comunidad sin pago en línea y "Cómo pagar" | `app-inicio.md` |
| APP-08 | Desglose con traspaso y pagos sin etiqueta | `app-inicio.md` |
| APP-09 | Pérdida de acceso | `app-inicio.md` |
| APP-10 | Carga y copia local | `app-inicio.md` |
| APP-11 | Selector de unidad | `app-inicio.md` |
| APP-PAG-01 a 09 | Hoja "¿Qué quieres pagar?", advertencias, 409, Webpay, comprobante y resultados | `app-hoja-de-pago.md` |
| APP-PAG-10 | Retorno inválido de Webpay (pantalla genérica, no el 404 neutro) | `app-hoja-de-pago.md` |
| APP-HIS-01 a 03 | Historial de pagos del propietario y del arrendatario | `app-pagos-y-cobros.md` |
| APP-COB-01 a 03 | Avisos del propietario, vista del cobro del arrendatario y resumen de gastos | `app-pagos-y-cobros.md` |
| APP-MAS-01 a 04 | Más, perfil, privacidad y notificaciones | `app-pagos-y-cobros.md` |

### Web de administración (administrador y comité)

| ID | Pantalla | Archivo |
| --- | --- | --- |
| WEB-INI-01 | Mis comunidades | `web-inicio-y-tareas.md` |
| WEB-INI-02 | Inicio del administrador con Tareas pendientes | `web-inicio-y-tareas.md` |
| WEB-INI-03 | Decidir la tarea "Revisar rol de comité" | `web-inicio-y-tareas.md` |
| WEB-INI-04 | Inicio del comité | `web-inicio-y-tareas.md` |
| WEB-INI-05 | Push y correo de la tarea | `web-inicio-y-tareas.md` |
| WEB-PER-01 a 12 | Periodos, borrador, gastos, cargos directos, egresos del fondo, ajustes, saldo de caja, vista previa, confirmación, avisos, cierre y vista del comité | `web-periodos-y-emision.md` |
| WEB-COR-01 a 06 | Corregir y anular gastos y egresos del fondo | `web-corregir-gasto.md` |
| WEB-PAG-01 a 07 | Pagos, registro manual, comprobante, anulación, pago Webpay e intentos Webpay | `web-pagos.md` |
| WEB-CTA-01 a 04 | Cuentas por unidad, estado de cuenta y exportación | `web-cuentas-por-unidad.md` |
| WEB-OCU-01 a 07 | Ocupantes, alta, arriendo programado, término, venta, propietario faltante y vista del comité | `web-ocupaciones.md` |
| WEB-USR-01 a 06 | Usuarios y roles, comité, historial, auditoría y Mi cuenta | `web-usuarios-y-roles.md` |
| WEB-ALT-01 a 06 | Puesta en marcha y configuración inicial | `web-alta-comunidad.md` |

### Consola de plataforma (equipo ComVive)

| ID | Pantalla | Archivo |
| --- | --- | --- |
| CON-01 | Ingreso con segundo factor | `consola-plataforma.md` |
| CON-02 a CON-10 | Soporte ComVive: lista, detalle, vistas previas, resultado y errores | `consola-plataforma.md` |
| CON-11 | Operaciones ComVive: comunidades y administradores | `consola-plataforma.md` |

### Modo conserjería (Posterior)

| ID | Pantalla | Archivo |
| --- | --- | --- |
| CNJ-01 a 03 | Inicio de portería, registrar y entregar encomiendas | `conserjeria-encomienda.md` |

### Pantallas sin wireframe en esta entrega

- **Reportes** (ingresos y egresos del mes, fondo de reserva) y **Configuración > Cobro > Intereses** (tasa versionada y activación): no tienen flujo propio. Se dibujarán cuando el analista cierre UX-43 y UX-44.
- **Activar el pago en línea:** sin pantalla en el MVP. Es un procedimiento auditado de Operaciones ComVive (ADR 0007; UX-33 cerrada). CON-11 solo muestra el estado.
- **Pagos por identificar**: **Por definir** (UX-11). **Panel consolidado multi-comunidad**: **Posterior** (UX-18).

## Trazabilidad: flujo → pantallas → criterios de aceptación

| Flujo | Pantallas | Criterios de aceptación de la spec |
| --- | --- | --- |
| `admin-alta-comunidad.md` | WEB-ALT-01 a 06, CON-11 | CA-3, CA-7, CA-18, CA-19 |
| `admin-emitir-cerrar-periodo.md` | WEB-PER-01 a 12, WEB-INI-02, GLB-06 | CA-1, CA-2, CA-17, CA-19, CA-20, CA-24, CA-25, CA-38, CA-39, CA-45, CA-46, CA-48, CA-58, CA-62 |
| `admin-corregir-gasto.md` | WEB-COR-01 a 06, WEB-PER-06 | CA-13, CA-14, CA-24, CA-33, CA-34, CA-36, CA-62 |
| `admin-pago-manual.md` | WEB-PAG-01 a 06, WEB-CTA-03 | CA-5, CA-11, CA-12, CA-15, CA-24, CA-31, CA-32, CA-40, CA-53, CA-56, CA-61, CA-67 |
| `admin-ocupaciones.md` | WEB-OCU-01 a 07, WEB-CTA-03 | CA-21, CA-22, CA-35, CA-36, CA-37, CA-38, CA-44, CA-53, CA-54, CA-56, CA-57, CA-61 |
| `admin-usuarios-y-roles.md` | WEB-USR-01 a 06, WEB-INI-02 a 05, CON-11 | CA-24, CA-43, CA-44, CA-57, CA-64, CA-69 |
| `residente-estado-de-cuenta-y-pago.md` | APP-01 a 11, APP-PAG-01 a 10, APP-HIS-01 a 03, APP-COB-01 a 03 | CA-5, CA-10, CA-22, CA-23, CA-26, CA-29, CA-30, CA-32, CA-33, CA-41, CA-46, CA-47, CA-49, CA-53, CA-55, CA-56, CA-60, CA-63, CA-65, CA-66, CA-68, CA-75 |
| `residente-primer-ingreso.md` | APP-ING-01 a 07, APP-MAS-01 a 04, APP-09 | CA-23, CA-46, CA-53, CA-60 |
| `plataforma-soporte-webpay.md` | CON-01 a 10, WEB-PAG-07, APP-06, APP-PAG-09 | CA-41, CA-42, CA-54, CA-55, CA-59, CA-65, CA-68 |
| `conserje-encomienda.md` | CNJ-01 a 03 | CA-24 (el conserje no ve nada del gasto común) |
| Permisos y aislamiento (todos) | GLB-01 a 03, WEB-INI-04, WEB-CTA-02, WEB-OCU-07, WEB-PER-12 | CA-23, CA-24, CA-41, CA-42, CA-43, CA-44 |

## Decisiones de Webpay del 2026-11-07 (spec rev. 5)

La spec rev. 5 (F-12, F-16, F-17, tabla de errores; S-56 a S-59; CA-65 y CA-66), la arquitectura y el ADR 0007 recogen las decisiones del líder sobre Webpay. Los textos de S-59, aprobados por el líder el 2026-11-07, se copian tal cual, sin punto final:

1. **Reembolso automático (D2):** al marcar para reverso, la API pide el reembolso a Transbank; la consola propone la referencia para confirmar el reverso y advierte si no hay un reembolso exitoso (CON-06, CON-07, CON-09).
2. **Resolución sin cobro (D3, `resolve_without_charge`):** `in_review` → `rejected`, con 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` o `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE` según el estado en Transbank (CON-03, CON-08 a CON-10, APP-PAG-09, WEB-PAG-07).
3. **503 `PAYMENT_GATEWAY_UNAVAILABLE` (S-57):** "No pudimos conectar con Webpay. Intenta en unos minutos" al iniciar un pago (`app-hoja-de-pago.md`) y "No pudimos consultar el estado en Transbank. Intenta en unos minutos" en la consulta de "sin cobro" (CON-10).

## Decisiones del líder del 2026-11-07 (spec rev. 6)

La spec rev. 6 (F-1, F-8, F-16, F-17, tabla de errores, "Validaciones de la consola de Operaciones ComVive"; S-60 a S-68; CA-67 a CA-69) recoge estas decisiones. Los textos se copian tal cual, sin punto final:

1. **Consulta previa al marcar para reverso (D4):** con cobro ya devuelto (`REVERSED` o `NULLIFIED`) no se pide reembolso; con `INITIALIZED` o `FAILED`, 422 `NO_CHARGE_TO_REVERSE` (texto aprobado, D6); 503 si Transbank no responde; 409 si cambia "se pedirá reembolso" entre la vista previa y la ejecución (CON-06, CON-10).
2. **Declaración sin estado concluyente (D5):** pasados los 7 días consultables, "sin cobro" con motivo y la advertencia aprobada (CON-08).
3. **Referencia del pago manual (D6):** 422 `PAYMENT_REFERENCE_REQUIRED`, "Ingresa la referencia del pago" (WEB-PAG-02).
4. **Cobro ya devuelto sin referencia (D7):** sin la advertencia "Transbank no confirmó la devolución…" y con la ayuda "Transbank no entregó la referencia de esta anulación. Obtenla en el portal de Transbank con el número de orden {buy_order} y escríbela aquí" (CON-07).
5. **Texto del residente (D8):** "Tu pago no se registró. Transbank ya devolvió el monto", elegido por `reversalKind = already_returned` (APP-06, APP-PAG-09).
6. **Último administrador (D9):** 409 `LAST_ADMIN`, "No se puede revocar al único administrador de la comunidad. Otorga primero el rol a quien lo reemplazará". Primero se otorga al nuevo y luego se revoca al anterior; el nuevo cuenta como vigente aunque no haya hecho su primer ingreso (CON-11).
7. **Aprobación de textos (D10):** la ayuda de D7, el 422 `REVERSAL_REFERENCE_REQUIRED` y el 409 `LAST_ADMIN` quedan aprobados.

## Revisión crítica 4 y decisiones del líder del 2026-11-07 (D13 y D15)

1. **Monto del reembolso (M-3):** "Se pedirá reembolso: sí, por $X", con el saldo anulable o el total autorizado que entrega la API (CON-06).
2. **Textos de `rejected` y `abandoned` (M-6):** `rejectionKind = transbank_rejected`, "Tu banco rechazó el pago. No se hizo ningún cargo"; `rejectionKind = resolved_without_charge`, "Tu pago no se completó. No se hizo ningún cargo"; `abandoned`, "Pago cancelado. No se hizo ningún cargo" (texto del diseño). Sin variantes ni punto final (APP-PAG-08, APP-PAG-09, APP-HIS-03, design system 5.8).
3. **Sin cobro desde "Para reverso" (D13):** si el reembolso respondió 292 pasados los 7 días, Soporte puede resolver sin cobro (`reversal_pending` → `rejected`) (CON-07, CON-08, CON-10; UX-75).
4. **Arrendatario sin estado de pago en curso (B-1):** APP-05 no muestra al arrendatario ningún estado ni el texto del 409; ese texto solo aparece en APP-PAG-04 (CA-30 rev. 6).
5. **Textos del diseño (D15):** UX-69 cerrada, aprobados en bloque. **Activar el pago en línea (Menor 5):** UX-33 cerrada, sin pantalla.

## Preguntas UX nuevas

Numeración: continúa desde UX-49 (`../mapa-de-usuarios.md`). UX-53 a UX-59, UX-61, UX-63 y UX-64 ya los usa el design system con el mismo sentido. Cada pregunta indica el supuesto con que avanzan los wireframes, que se marca **Supuesto (a validar)**.

- [x] **UX-50** (cerrada por la spec rev. 6, F-8 y S-64): **"Vencido desde" en la tabla de cuentas y en Inicio.** Una fecha por unidad: la de vencimiento más antigua entre los débitos pendientes y vencidos de cualquier ámbito. Como es la fecha de vencimiento y no el primer día de mora, la celda dice "Venció el {dd-mm-aaaa}" (WEB-CTA-01, WEB-CTA-02, WEB-INI-02).
- [x] **UX-51** (cerrada por la spec rev. 6, F-8 y S-64): **"Unidades con cuotas impagas" en Inicio.** Cuotas contadas por unidad; orden por cuotas de mayor a menor, luego "Vencido desde" de la más antigua a la más reciente y luego `sort_order`; sin umbral (marcar 3 o más cuotas sigue en P-47 de la spec) (WEB-INI-02).
- [ ] **UX-52** (arquitecto): **fin del bloqueo de un ámbito.** "Podrás reintentar en {n} min" necesita saber cuándo se libera el bloqueo. `webpay-attempts/current` entrega `startedAt`. **Supuesto (a validar):** la app calcula {n} con `startedAt` más 15 minutos (arquitectura §4) y, si no lo sabe, omite la línea. Alternativa: que la API entregue la hora de liberación.
- [ ] **UX-53** (analista): **RUT enmascarado con cuerpos de siete dígitos.** **Supuesto (a validar):** `9.876.***-*` (design system 4.3).
- [ ] **UX-54** (arquitecto y analista): **chip de estado de la deuda.** Requiere que la API entregue por ámbito el monto vencido, el monto por vencer, el saldo a favor y la fecha más antigua de cada uno. **Supuesto (a validar):** regla de la sección 5.6 del design system; textos "Al día", "Por vencer", "Vencida" y "Saldo a favor" (texto del diseño).
- [ ] **UX-55** (analista): **409 del alta de arrendatario.** A-7 no tiene texto para `PREVIEW_OUTDATED` al registrar un arrendatario. **Supuesto (a validar):** "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar", el mismo del término y la venta (WEB-OCU-02).
- [ ] **UX-56** (arquitecto): **marcar lo que cambió después de un 409.** **Supuesto (a validar):** la pantalla compara la vista previa anterior con la nueva por fila (unidad, ámbito y cuenta) y marca "Cambió" donde el valor que entregó la API es distinto. Compara, no calcula. Requiere filas con una clave estable en la respuesta de cada vista previa.
- [ ] **UX-57** (líder): **modo oscuro en el MVP.** **Supuesto (a validar):** sigue la preferencia del sistema, sin selector propio.
- [ ] **UX-58** (analista): **nombres de las cuentas en la app.** **Supuesto (a validar):** "Gasto común", "Fondo de reserva", "Gasto extraordinario", "Intereses por mora" y "Multa".
- [x] **UX-59** (cerrada por la spec rev. 6, G-6 y S-60): **formato del periodo en los textos.** `<periodo>` y `{mes}` como "octubre 2026"; `<AAAA-MM>` como código `2026-10`. G-6, CA-38 y CA-45 usan "octubre 2026".
- [x] **UX-60** (cerrada, alineada con la spec rev. 6): **error del RUT en el ingreso.** `INVALID_RUT`, "Ingresa un RUT válido. Revisa el dígito verificador", en todas las superficies, incluido el primer ingreso (APP-ING-02) y la consola de Operaciones (CON-11).
- [ ] **UX-61** (analista): **textos del diseño en chips y columnas.** "Cambió", "Registrado" y "Anulado" (pagos), "Vigente" y "Terminada" (ocupaciones), "Sin notificar" y "Notificado" (avisos), "Sin cobro" (intento Webpay `rejected` por `resolve_without_charge`). **Supuesto (a validar):** se usan mientras no haya texto en la spec.
- [x] **UX-62** (cerrada por la spec rev. 6, F-1, S-62 y CA-67; texto aprobado por el líder, D6): **referencia obligatoria del pago manual.** La API la valida con 422 `PAYMENT_REFERENCE_REQUIRED`, "Ingresa la referencia del pago", después de la deuda, el arriendo, el monto y la fecha (WEB-PAG-02, `admin-pago-manual.md`).
- [ ] **UX-63** (analista): **"Saldo a favor" y "Necesitas conexión para pagar".** Textos del diseño para el chip y para el botón desactivado sin conexión.
- [ ] **UX-64** (analista): **estados globales.** "Volver al inicio" en el 404 y "No se pudo completar la acción. Intenta de nuevo." (texto del flujo de Soporte) para todo error inesperado, en todas las superficies.
- [x] **UX-65** (cerrada, alineada con la spec): **nombre del equipo que otorga administradores.** El flujo de usuarios y roles decía "Cuentas ComVive"; se cambió a "Operaciones ComVive", el nombre de la spec.
- [x] **UX-66** (cerrada por la spec rev. 6, "Validaciones de la consola de Operaciones ComVive", S-63): **validaciones de la consola de Operaciones.** Códigos, textos y orden del alta de comunidad, el otorgamiento y la revocación de administradores, más 409 `LAST_ADMIN` (D9), en CON-11. Si quedan en esta spec o en una de plataforma sigue en P-49 de la spec.
- [x] **UX-67** (cerrada, decisión de diseño): **formato del comprobante Webpay.** El flujo (paso 6) tenía una línea propia, "Pagado por ti · ${monto} · {unidad} · {dd-mm-aaaa}", distinta de `PayerLabel`. Ningún texto de la spec la respalda, así que se alineó el flujo con el design system: el comprobante usa `Receipt` (5.18), con "Pagado por ti", el monto, la unidad, la fecha y el número de orden en líneas separadas, y el historial usa `PayerLabel` (5.7) (APP-PAG-07).
- [x] **UX-68** (cerrada por la spec rev. 6, CA-30 ajustado a F-17): **qué ve el arrendatario cuando el propietario paga su deuda.** Ningún estado de pago en curso; "Ya hay un pago en proceso para esta deuda" aparece solo si intenta pagar (409 `PAYMENT_IN_PROGRESS`) (APP-05, APP-PAG-04).
- [x] **UX-69** (cerrada 2026-11-07, decisión del líder D15: aprobados en bloque junto con los wireframes) (analista y líder): **textos del diseño nuevos de estos wireframes.** Cada uno va marcado en su pantalla. Entre ellos: "Se agregó esta unidad a tu cuenta", "Volver a abrir el formulario", "Tu sesión se cerrará en 1 minuto por inactividad.", "Entendido", "Copiar datos de la cuenta", "Ver mis unidades", "Antes: ${monto}", "Elige una decisión", la ayuda del saldo de caja, los banners de resultado de emisión, cierre, corrección, término y venta, "Corrige los bloqueos para poder emitir.", "No hay ajustes ni saldos anteriores.", la confirmación de "Descargar todos los avisos", "mismo pago: 2 deudas", "Compáralo con el comprobante bancario.", la frase del propietario faltante, los de la configuración inicial, los de Más y los de Mi cuenta. También la decisión de abrir la hoja de pago con una sola deuda cuando hay un intento propio en revisión (APP-PAG-02), y el texto de `abandoned`, "Pago cancelado. No se hizo ningún cargo" (APP-PAG-08, M-6 de la revisión crítica 4).
- [ ] **UX-70** (arquitecto y analista): **cuándo se ve la advertencia de saldo del fondo negativo al registrar un egreso.** B-3 dice "en el formulario del egreso", pero el saldo lo calcula la API y el registro no tiene vista previa. **Supuesto (a validar):** la advertencia llega en la respuesta del registro y se muestra junto al egreso ya guardado (WEB-PER-05). Alternativa: una consulta previa al guardar.
- [x] **UX-71** (cerrada por la spec rev. 5): **textos y códigos de las decisiones de Webpay del 2026-11-07.** La spec fijó la confirmación de `mark_for_reversal` y de `resolve_without_charge`, las advertencias de la consola, el estado del residente ("Tu pago no se completó. No se hizo ningún cargo"), los 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` y `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE`, el 503 de la consola ("No pudimos consultar el estado en Transbank. Intenta en unos minutos") y que "sin cobro" se permite con dos deudas. Quedan como texto del diseño, ya cubiertos por UX-61 y UX-69: el chip "Sin cobro" de "Intentos Webpay", los textos de las vistas previas de la consola y la ayuda de la referencia propuesta.
- [ ] **UX-72** (arquitecto): **datos de la API que suponen los wireframes.** La diferencia entre monto iniciado y autorizado y los días hábiles en revisión en la consola (CON-02, CON-03); los totales por columna en cuentas por unidad (WEB-CTA-01) y por subcategoría en el resumen de gastos (APP-COB-03); la deuda resultante por ámbito en las vistas previas de anulación (WEB-COR-05, WEB-PAG-05); y si la persona conserva una unidad al quitarla del comité (WEB-USR-03). **Supuesto (a validar):** la API los entrega; si no, la pantalla omite el dato en lugar de calcularlo.
- [ ] **UX-73** (líder y abogado): **actor de Soporte en la auditoría de la comunidad.** **Supuesto (a validar):** el administrador ve "Soporte ComVive" como actor, sin el nombre de la persona del equipo ComVive (WEB-USR-05), igual que en "Intentos Webpay".
- [x] **UX-74** (cerrada 2026-11-07, decisión del líder D11: se aprueba la propuesta del diseño, ya en F-17) (analista y líder): **confirmación de "marcar para reverso" en un cobro ya devuelto.** El texto aprobado de F-17 dice "ComVive ya pidió la anulación a Transbank. Cuando Transbank responda, revisa la referencia propuesta…", pero con `reversalKind = already_returned` ComVive no pide reembolso (D4) y la referencia ya se puede revisar. **Supuesto (a validar):** la consola muestra un texto propio para este caso, marcado "{texto confirmación cobro ya devuelto, pendiente}" (CON-09), hasta que el analista lo fije en F-17. Propuesta del diseño, para que el analista la evalúe: "Intento {buy_order} marcado para reverso. Transbank ya había devuelto el cobro. Revisa la referencia y confirma el reverso".

- [ ] **UX-75** (analista): **textos de la resolución sin cobro desde "Para reverso" (D13).** El aviso de CON-07 ("Transbank respondió al reembolso que este pago nunca se cobró (código 292). Si es así, ciérralo sin cobro en lugar de confirmar el reverso"), las líneas y el párrafo de su vista previa en CON-08, el código del rechazo cuando no se cumple D13 y cómo indica la API que la resolución está disponible. **Supuesto (a validar):** textos del diseño de CON-07 y CON-08; sin la advertencia de D5; rechazo con 409 `PREVIEW_OUTDATED`; la API incluye `resolve_without_charge` entre las resoluciones disponibles del intento.
- [x] **UX-33** (cerrada 2026-11-07, Menor 5 de la revisión crítica 4): **activar el pago en línea.** Procedimiento auditado de Operaciones ComVive, sin pantalla en el MVP (ADR 0007).

Preguntas anteriores que siguen afectando estas pantallas: UX-1, UX-7, UX-11, UX-13, UX-16, UX-17, UX-18, UX-28, UX-31, UX-35, UX-36, UX-38, UX-40, UX-43, UX-44 y UX-45 (`../mapa-de-usuarios.md`).

## Inconsistencias entre documentos

Encontradas al dibujar. No se resolvieron en silencio: las del lado del diseño se corrigieron en las rondas de alineación con la spec; las demás tienen su pregunta o quedan para el dueño del documento.

**Abiertas:** ninguna del lado del diseño.

**Cerradas por decisión del líder (2026-11-07):**

- Confirmación de "marcar para reverso" en un cobro ya devuelto: F-17 tiene el texto (D11, UX-74).
- Textos de `rejected` y `abandoned` para el pagador: uno por caso, por `rejectionKind`, sin variantes (M-6 de la revisión crítica 4).

**Cerradas por la spec rev. 6:**

- CA-30 frente a F-17: CA-30 se ajustó a F-17 (UX-68).
- "octubre de 2026" frente a "octubre 2026" en la notificación de G-6: G-6, CA-38 y CA-45 usan "octubre 2026" (UX-59, S-60).
- Medio de pago: mayúscula inicial en la línea del pago ("Transferencia") y minúscula dentro de una frase ("por transferencia"), salvo "Webpay"; CA-32 alineado con CA-63 (F-17, S-61).
- Referencia obligatoria del pago manual: 422 `PAYMENT_REFERENCE_REQUIRED` (UX-62, S-62, CA-67).
- "Vencido desde" y "Unidades con cuotas impagas": F-8 (UX-50, UX-51, S-64).
- Validaciones de la consola de Operaciones: S-63 (UX-66).
- Advertencia de revocar al último administrador en `admin-usuarios-y-roles.md` y CON-11: se quitó; ahora es 409 `LAST_ADMIN` (D9).

**Corregidas en el diseño (ronda de alineación con la spec rev. 6):**

- Ejemplo de error del RUT en `app-ingreso.md` (APP-ING-02): `12.345.678-9` se mantiene **a propósito**, porque el wireframe muestra el error del dígito verificador; ahora lo dice una nota, que indica el RUT válido `12.345.678-5`.

**Corregidas en el diseño (ronda de alineación con la spec rev. 5):**

- Error del RUT en `residente-primer-ingreso.md`: ahora usa el texto de `INVALID_RUT` (UX-60).
- "Cuentas ComVive" → "Operaciones ComVive" en `admin-usuarios-y-roles.md` (UX-65).
- Comprobante Webpay alineado con `Receipt` en `residente-estado-de-cuenta-y-pago.md` (UX-67).
- RUT de ejemplo `12.345.678-9` (dígito verificador inválido) → `12.345.678-5` en `residente-primer-ingreso.md` y `admin-alta-comunidad.md`.
- Salto de línea que faltaba en "Supuestos (a validar)" de `residente-estado-de-cuenta-y-pago.md`.
- `plataforma-soporte-webpay.md` actualizado con el reembolso automático, la referencia propuesta y la resolución sin cobro.
- "Pendiente" de `arquitectura-de-informacion.md` actualizado.

## Revisión de accesibilidad

Antes de pasar a desarrollo, cada wireframe se revisa con la lista de la sección 9 del design system. Puntos que estos wireframes ya fijan: botón principal visible sin desplazar en Inicio de la app (APP-02 con dos tarjetas usa `type.amount.lg` en la segunda, a verificar con texto ampliado); estados con ícono y texto; motivos visibles en botones desactivados; foco al primer error; ninguna acción que exija arrastrar (la hoja de pago tiene "Cerrar").
