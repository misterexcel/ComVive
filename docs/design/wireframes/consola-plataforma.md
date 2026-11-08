# Wireframes: consola de plataforma (Soporte ComVive y Operaciones ComVive)

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujos: `../flujos/plataforma-soporte-webpay.md` y `../flujos/admin-usuarios-y-roles.md` (Operaciones ComVive). IA: `../arquitectura-de-informacion.md`, sección 4. Superficie: web separada (1280 px), con su propio ingreso y sesión de audiencia `platform`.

Reglas que se ven en estas pantallas (spec EX-1, F-16, F-17; arquitectura §3):

- Soporte ve solo los campos de EX-1: número de orden, comunidad, código de la unidad, tipo de deuda ("Propietario" o "Arrendatario", sin nombre), monto iniciado por deuda, monto autorizado, estado y códigos de Transbank, fechas y "Plazo vencido". Nunca nombres, RUT, contactos, cargos, deudas, saldos ni imputaciones.
- El resultado de una resolución se muestra solo en la confirmación inmediata; la consola no vuelve a pedir el detalle, porque puede responder 404.
- Toda lectura queda en auditoría. El pie de cada pantalla de Soporte lo dice.

Criterios de aceptación: CA-41, CA-42, CA-43, CA-54, CA-55, CA-59, CA-65 y CA-68.

## Decisiones del líder del 2026-11-07 (spec rev. 5)

La spec rev. 5 ya recoge las tres decisiones sobre Webpay (F-16, F-17, tabla de errores; S-57 a S-59). Los textos de S-59 los aprobó el líder el 2026-11-07 y aquí se copian tal cual, sin punto final:

1. **Reembolso automático (D2):** al marcar para reverso, la API pide el reembolso a Transbank (por el saldo anulable o, si no hubo anulaciones, el total autorizado; M-3 de la rev. 4). Para confirmar el reverso, la consola propone la referencia a partir del resultado del reembolso (CON-06, CON-07).
2. **Resolución sin cobro (D3, `resolve_without_charge`, `in_review` → `rejected`):** solo con `INITIALIZED` o `FAILED` en Transbank; la API consulta el estado al pedir la vista previa y al ejecutar. Se permite también con dos deudas (CON-08).
3. **503 `PAYMENT_GATEWAY_UNAVAILABLE` (S-57):** en la consola, en la consulta de estado de "sin cobro" y, desde D4, de "marcar para reverso", con "No pudimos consultar el estado en Transbank. Intenta en unos minutos" (CON-10).

## Decisiones del líder del 2026-11-07 (spec rev. 6)

1. **Consulta previa al marcar para reverso (D4):** la API consulta el estado en Transbank en la vista previa y en la ejecución. Con cobro vigente pide el reembolso; con `REVERSED` o `NULLIFIED` (cobro ya devuelto) no lo pide y deja el intento listo para confirmar el reverso; con `INITIALIZED` o `FAILED` responde 422 `NO_CHARGE_TO_REVERSE` (texto aprobado). Si Transbank pasa de `AUTHORIZED` a `REVERSED` entre la vista previa y la ejecución, 409 (CON-06, CON-10; CA-68).
2. **Declaración sin estado concluyente (D5):** pasados los 7 días consultables sin una respuesta concluyente, Soporte puede resolver sin cobro con motivo y la advertencia aprobada (CON-08).
3. **Cobro ya devuelto sin referencia (D7):** al confirmar el reverso de un cobro ya devuelto no se muestra la advertencia "Transbank no confirmó la devolución de este intento…"; si no hay referencia propuesta, una ayuda breve para ingresarla desde el portal de Transbank (CON-07).
4. **Último administrador (D9):** Operaciones no puede revocar al último administrador de una comunidad: 409 `LAST_ADMIN`. Primero se otorga al nuevo y luego se revoca al anterior (CON-11, CA-69).

La ayuda de D7, el 422 `REVERSAL_REFERENCE_REQUIRED` y el 409 `LAST_ADMIN` los aprobó el líder (D10, 2026-11-07). La confirmación de "marcar para reverso" en un cobro ya devuelto la aprobó el líder (D11, 2026-11-07; UX-74, CON-09).

## Revisión crítica 4 y decisiones del líder del 2026-11-07 (D13 y D15)

1. **Monto del reembolso (M-3):** la vista previa de "marcar para reverso" dice "Se pedirá reembolso: sí, por $X", donde $X es el monto que entrega la API: el saldo anulable de la consulta previa o, si no hubo anulaciones, el total autorizado. La consola no lo calcula (CON-06).
2. **Sin cobro desde "Para reverso" (D13):** si, pasados los 7 días consultables, el reembolso automático responde que Transbank nunca hizo el cobro (código 292), Soporte puede resolver sin cobro desde "Para reverso" (`reversal_pending` → `rejected`). La consola ofrece la acción en el detalle y en "Confirmar reverso" (CON-07, CON-08, CON-10).
3. **Textos del diseño (D15):** el líder aprobó en bloque los textos propios del diseño de UX-69 junto con estos wireframes. Las notas "texto del diseño (UX-69)" quedan como origen del texto, ya aprobado.
4. **Activar el pago en línea (Menor 5, UX-33 cerrada):** es un procedimiento auditado de Operaciones ComVive, sin pantalla en el MVP (ADR 0007). CON-11 solo muestra el estado.

## CON-01 · Ingreso

```text
+-- ComVive · Consola de plataforma ----------------------------------------------------------
|
|   RUT (obligatorio)                 [ 10.111.222-3            ]
|   [[ Continuar ]]
|
|   Si el RUT está registrado, te enviamos un código a ****@comvive.cl
|   Código (obligatorio)              [ _ _ _ _ _ _ ]
|
|   Segundo factor (obligatorio)
|   Código de tu app autenticadora    [ _ _ _ _ _ _ ]
|   > Usar un código de recuperación
|   [[ Ingresar ]]
+---------------------------------------------------------------------------------------------
```

- Segundo factor obligatorio para los roles de plataforma (decisión del líder; spec, "Usuarios y permisos"). Método TOTP: **Supuesto (a validar)** de la arquitectura §3. Sesión de hasta 8 horas.
- El RUT es ilustrativo: las comunidades simuladas no tienen personas del equipo ComVive.
- Errores: los de `app-ingreso.md` (APP-ING-03), con los mismos textos. Segundo factor incorrecto: "No pudimos validar tus datos." (no dice cuál dato falló).

## CON-02 · Pagos Webpay en revisión (lista)

Escenario: el 07-12-2026. `OC-2026-0002` (CA-41) sigue en revisión, ilustrativo: en CA-41 se resuelve el 26-11. `OC-2026-0003` entró a revisión el sábado 05-12-2026 (CA-54); su plazo, con el feriado del martes 08-12 (CA-59), vence el lunes 14-12-2026.

```text
+-- ComVive · Consola de plataforma ·  Soporte ComVive ---------------------- Cerrar sesión ---
| Pagos Webpay en revisión
|
| Estado: [ Todos v ]   [ ] Solo plazo vencido     Número de orden: [ OC-______ ] [ Buscar ]
|
| N.º de orden   Comunidad             Unidad     Deuda          Iniciado   Autorizado  Días   Estado          Plazo
| OC-2026-0002   Edificio Los Aromos   Depto 101  Propietario    $110.000   $11.000     8      <En revisión>   <Plazo vencido>   > Ver
| OC-2026-0003   Edificio Los Aromos   Depto 102  Arrendatario   $262.500   $200.000    1      <En revisión>   Vence el 14-12-2026 > Ver
|
| Cada consulta y cada resolución queda registrada y la ve la administración de la comunidad
+---------------------------------------------------------------------------------------------
```

- Orden por defecto: el más antiguo primero. "Días": días hábiles en revisión, que entrega la API.
- "Plazo vencido" con chip `danger`, ícono y texto (F-16, CA-59).
- Búsqueda por número de orden exacto. **Estados vacíos:** "No hay pagos en revisión." y, en la búsqueda, "No hay un pago en revisión con ese número de orden." (también si existe pero está fuera de la vista: 404 neutro).

## CON-03 · Detalle de un intento de una deuda

Escenario: `OC-2026-0002` (CA-41, CA-42).

```text
+-- Pago Webpay OC-2026-0002 · <En revisión> -------------------------------------------------
| < Volver a la lista
|
| Comunidad            Edificio Los Aromos
| Unidad               Depto 101
| Deuda                Propietario
| Monto iniciado       $110.000
| Monto autorizado     $11.000          Diferencia: $99.000 menos que lo iniciado
| Estado en Transbank  AUTHORIZED · código de respuesta 0
| Iniciado             25-11-2026 18:42
| En revisión desde    25-11-2026 · Vence el 02-12-2026 · <Plazo vencido>
|
| Resolver
| [ Registrar por el monto autorizado ]   [ Marcar para reverso ]   [ Resolver sin cobro ]
|
| Cada consulta y cada resolución queda registrada y la ve la administración de la comunidad
+---------------------------------------------------------------------------------------------
```

- Solo campos de EX-1. La respuesta no trae nombre, RUT, contacto, deuda ni saldo (CA-42). Hora y código de Transbank: ilustrativos.
- "Diferencia" la entrega la API (o se omite si no la entrega); la consola no resta. **Supuesto (a validar), UX-72**: entra en "monto iniciado y autorizado" de EX-1 (flujo, paso 3).
- **"Resolver sin cobro"** queda siempre disponible en un intento en revisión: el estado que decide es el que la API consulta en Transbank al pedir la vista previa, no el que muestra el detalle. Con `OC-2026-0002`, que Transbank informa `AUTHORIZED`, la vista previa responde 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` (CON-08, CA-65).
- **"Marcar para reverso"** también queda siempre disponible: la API consulta el estado en Transbank al pedir la vista previa y otra vez al ejecutar (D4). Con `INITIALIZED` o `FAILED` responde 422 `NO_CHARGE_TO_REVERSE` y la consola sugiere "Resolver sin cobro" (CON-06, CA-68).
- El "Estado en Transbank" del detalle es el último guardado; el que decide cada resolución es el de la consulta de su vista previa.
- Plazo: CA-41 (quinto día hábil, 02-12-2026).

## CON-04 · Detalle de un intento de dos deudas

Escenario ilustrativo: el intento `OC-2027-0001` de CA-29 si hubiera entrado a revisión porque Transbank no entregó un estado concluyente.

```text
+-- Pago Webpay OC-2027-0001 · <En revisión> -------------------------------------------------
| Comunidad            Edificio Los Aromos
| Unidad               Depto 102
| Monto iniciado       Propietario $266.814 · Arrendatario $263.190
| Monto autorizado     —
| Estado en Transbank  Sin estado concluyente
|
| Resolver
| [ Registrar por el monto autorizado ]   [ Marcar para reverso ]   [ Resolver sin cobro ]
|   <- desactivado
| Un pago que cubre dos deudas solo se puede marcar para reverso
+---------------------------------------------------------------------------------------------
```

- Texto de `MULTI_SCOPE_REVIEW_REVERSAL_ONLY`, visible bajo el botón desactivado (design system 5.1).
- Montos por deuda: CA-29. "Resolver sin cobro" sigue disponible con dos deudas (F-16, CA-65).

## CON-05 · Vista previa: registrar por el monto autorizado

Escenario: CA-41, el 26-11-2026. Pago a crear: $11.000, deuda del propietario, periodo `2026-11`.

```text
+-- Panel: Registrar por el monto autorizado ---------------------------------
| Se registrará un pago Webpay de $11.000 en el periodo en borrador
| noviembre 2026, en la deuda del propietario.
|
| Motivo (obligatorio)
| [ Transbank autorizó un monto menor; se registra lo autorizado  ]
| No incluyas datos personales
|
| ( Cancelar )                                   [[ Registrar pago ]]
+-----------------------------------------------------------------------------
```

- Textos de la vista previa: del diseño (flujo, paso 5). No muestra la deuda de la unidad ($110.000) ni la imputación (EX-1, M-5).
- **Arriendo terminado durante la revisión** (CA-54, `OC-2026-0003`, pago a crear $200.000, periodo `2026-12`):

```text
| Se registrará un pago Webpay de $200.000 en el periodo en borrador
| diciembre 2026, en la deuda del propietario.
| {i} El arriendo de este intento terminó. El pago quedará en la deuda del
|     propietario de la misma unidad.
```

## CON-06 · Vista previa: marcar para reverso

La API consulta el estado en Transbank al pedir la vista previa y otra vez al ejecutar (D4; F-16; CA-68). La vista previa muestra el estado obtenido y si se pedirá reembolso; los dos datos forman parte de la huella.

Escenario: CA-68, el 26-11-2026. Intento `OC-2026-0009` del Depto 101: iniciado por $110.000, autorizado por $11.000, en revisión desde el 25-11-2026.

```text
Cobro vigente (AUTHORIZED, CAPTURED o PARTIALLY_NULLIFIED)
+-- Panel: Marcar para reverso -----------------------------------------------
| Estado en Transbank: AUTHORIZED (consultado el 26-11-2026 10:02)
| Se pedirá reembolso: sí, por $11.000
| Pago a crear: ninguno
|
| No se registrará ningún pago. ComVive pedirá a Transbank la devolución de
| $11.000. El residente verá que su pago no se registró y que se solicitará
| la devolución del monto a Transbank.
|
| Motivo (obligatorio)
| [                                                                ]
| No incluyas datos personales
|
| ( Cancelar )                               [[ Marcar para reverso ]]
+-----------------------------------------------------------------------------

Cobro ya devuelto (REVERSED o NULLIFIED)
+-- Panel: Marcar para reverso -----------------------------------------------
| Estado en Transbank: NULLIFIED (consultado el 26-11-2026 10:15)
| Se pedirá reembolso: no
| Pago a crear: ninguno
|
| No se registrará ningún pago ni se pedirá un reembolso nuevo. El intento
| quedará listo para confirmar el reverso. El residente verá que su pago no
| se registró y que Transbank ya devolvió el monto.
|
| Motivo (obligatorio)
| [ La comunidad anuló la venta en Transbank                       ]
| No incluyas datos personales
|
| ( Cancelar )                               [[ Marcar para reverso ]]
+-----------------------------------------------------------------------------
```

- **Monto del reembolso (M-3 de la rev. 4):** "Se pedirá reembolso: sí, por $X". $X lo entrega la API como parte de la huella: el saldo anulable (`balance`) de la consulta previa o, si no hubo anulaciones previas, el total autorizado. En CA-68 no hay anulaciones previas, así que $X = $11.000. Con `PARTIALLY_NULLIFIED`, $X es el saldo anulable, menor que lo autorizado; la consola muestra el monto que llega, sin restar. Si $X cambia entre la vista previa y la ejecución, 409 `PREVIEW_OUTDATED` con "Cambió" en "Se pedirá reembolso".
- Textos de la vista previa: del diseño (flujo, paso 5; UX-69, aprobados en bloque, D15), con el reembolso automático de F-16 (D2) y la consulta previa (D4). "Se pedirá reembolso" es el dato de la huella que entrega la API; la consola no lo deduce del estado. Pago a crear: ninguno. Horas de consulta: ilustrativas. Motivo del cobro ya devuelto: CA-68.
- **Cambio entre la vista previa y la ejecución** (por ejemplo, de `AUTHORIZED` a `NULLIFIED` porque la comunidad anuló la venta en el portal de Transbank): 409 `PREVIEW_OUTDATED`, "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver". La consola pide una vista previa nueva y marca "Cambió" en "Estado en Transbank" y en "Se pedirá reembolso" (CA-68). No se escribe nada.
- **La vista previa no se puede pedir** (errores en el orden de la spec: estado del intento → estado en Transbank → motivo → huella):

```text
| {x} Transbank informa el estado INITIALIZED: este pago no tiene un cobro
|     que devolver. Si corresponde, resuélvelo sin cobro
|     [ Resolver sin cobro ]                        <- abre CON-08
| {x} No pudimos consultar el estado en Transbank. Intenta en unos minutos
```

- 422 `NO_CHARGE_TO_REVERSE` con `INITIALIZED` o `FAILED` (texto aprobado por el líder, D6), en la vista previa y en la ejecución, también si no hay motivo; el intento sigue en revisión. La consola ofrece en el banner el botón "Resolver sin cobro" (texto del botón: el de la acción de CON-03), que abre su propia vista previa con su propia consulta (CA-68).
- 503 `PAYMENT_GATEWAY_UNAVAILABLE` si Transbank no responde dentro de los 7 días consultables; no se escribe nada y Soporte reintenta (S-57).
- Sobre un intento que ya está "Para reverso": 409 `PREVIEW_OUTDATED`, "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa", sin consultar a Transbank; la consola recarga el detalle.

## CON-07 · Confirmar reverso

Escenario: CA-55, intento `OC-2026-0002` en `reversal_pending`. El reembolso automático fue una anulación (más de 3 horas desde la autorización), así que la referencia propuesta es el código de autorización de la anulación.

```text
+-- Panel: Confirmar reverso -------------------------------------------------
| No se registrará ningún pago. El intento quedará como reversado con la
| referencia de Transbank que ingreses.
|
| Referencia de la anulación en Transbank (obligatorio)
| [ {código de autorización de la anulación}                       ]
| Propuesta a partir del reembolso automático. Revísala antes de confirmar.
|
| Motivo (obligatorio)
| [                                                                ]
| No incluyas datos personales
|
| ( Cancelar )                                  [[ Confirmar reverso ]]
+-----------------------------------------------------------------------------
```

- La consola propone la referencia (F-16, D2): con una anulación, el código de autorización de la anulación; con una reversa, `REVERSED <buy_order> <fecha y hora del reembolso>`. Sigue editable y obligatoria: vacía, 422 `REVERSAL_REFERENCE_REQUIRED`, "Ingresa la referencia de la anulación en Transbank" (CA-55). La ayuda bajo el campo es texto del diseño (UX-69).
- **Sin un reembolso exitoso registrado** (el intento tiene solicitud de reembolso y su resultado no es una reversa ni una anulación exitosa): el campo aparece vacío y arriba va la advertencia de F-17 (S-59), que no bloquea:

```text
| {!} Transbank no confirmó la devolución de este intento. Confirma el reverso
|     solo con una referencia que obtuviste directamente de Transbank
```

- **Transbank nunca cobró (decisión del líder D13):** pasados los 7 días consultables, el reembolso automático respondió con el código 292 (Transbank informa que no hubo cobro). La advertencia anterior se mantiene, porque no hubo un reembolso exitoso, y debajo la consola ofrece cerrar el intento sin cobro:

```text
Escenario ilustrativo: intento {buy_order} en reversal_pending, sin CA propio todavía
+-- Panel: Confirmar reverso -------------------------------------------------
| {!} Transbank no confirmó la devolución de este intento. Confirma el reverso
|     solo con una referencia que obtuviste directamente de Transbank
| {i} Transbank respondió al reembolso que este pago nunca se cobró (código
|     292). Si es así, ciérralo sin cobro en lugar de confirmar el reverso
|     [ Resolver sin cobro ]                     <- abre CON-08, desde "Para reverso"
|
| Referencia de la anulación en Transbank (obligatorio)
| [                                                                ]
| ...
+-----------------------------------------------------------------------------
```

- La consola muestra el banner `{i}` y el botón solo si la API ofrece `resolve_without_charge` para ese intento (resultado del reembolso con código 292 pasados los 7 días); no lo deduce del código. El texto del banner es del diseño (UX-75). "Confirmar reverso" sigue disponible: la decisión es de Soporte.
- El detalle de un intento "Para reverso" en este caso (CON-03 con el chip `<Para reverso>`) muestra las acciones "Confirmar reverso" y "Resolver sin cobro".

- **Cobro ya devuelto** (`reversalKind = already_returned`: se marcó para reverso con `REVERSED` o `NULLIFIED` y ComVive no pidió reembolso; D4, D7, CA-68). La consola **nunca** muestra la advertencia anterior, haya o no referencia propuesta. La referencia se propone desde la consulta previa: con `NULLIFIED`, el código de autorización de la anulación si la consulta lo trae; con `REVERSED`, `REVERSED <buy_order> <fecha y hora de la consulta>`.

```text
Con referencia propuesta (NULLIFIED con código)
+-- Panel: Confirmar reverso -------------------------------------------------
| Estado en Transbank: NULLIFIED. Transbank ya devolvió el cobro
|
| Referencia de la anulación en Transbank (obligatorio)
| [ {código de autorización de la anulación}                       ]
| Propuesta a partir de la consulta a Transbank. Revísala antes de confirmar.
| ...
+-----------------------------------------------------------------------------

Sin referencia propuesta (NULLIFIED sin código; D7)
+-- Panel: Confirmar reverso -------------------------------------------------
| Estado en Transbank: NULLIFIED. Transbank ya devolvió el cobro
|
| Referencia de la anulación en Transbank (obligatorio)
| [                                                                ]
| Transbank no entregó la referencia de esta anulación. Obtenla en el
| portal de Transbank con el número de orden OC-2026-0009 y escríbela aquí
|
| Motivo (obligatorio)
| [                                                                ]
| No incluyas datos personales
|
| ( Cancelar )                                  [[ Confirmar reverso ]]
+-----------------------------------------------------------------------------
```

- **Ayuda de D7:** texto breve bajo el campo, con estilo de ayuda (no banner `warning`), con el texto de F-17: "Transbank no entregó la referencia de esta anulación. Obtenla en el portal de Transbank con el número de orden {buy_order} y escríbela aquí" (aprobado por el líder, D10; en el ejemplo, la orden de CA-68). No bloquea ni pide una confirmación adicional.
- Confirmar sin referencia: 422 `REVERSAL_REFERENCE_REQUIRED`, "Ingresa la referencia de la anulación en Transbank", bajo el campo; el intento sigue "Para reverso" (CA-68).
- La línea "Estado en Transbank: … Transbank ya devolvió el cobro" y la ayuda "Propuesta a partir de la consulta a Transbank…" son texto del diseño (UX-69).

## CON-08 · Vista previa: resolver sin cobro

Escenario: CA-65, el 26-11-2026. Intento `OC-2026-0006` del Depto 101 ($110.000), en revisión desde el 25-11-2026; Transbank informa `INITIALIZED`.

```text
+-- Panel: Resolver sin cobro ------------------------------------------------
| Estado en Transbank: INITIALIZED (consultado el 26-11-2026 10:02)
| Pago a crear: ninguno
|
| No se registrará ningún pago y la deuda no cambia. El intento quedará
| cerrado sin cobro.
|
| Motivo (obligatorio)
| [ Transbank informa la transacción como no pagada               ]
| No incluyas datos personales
|
| ( Cancelar )                                  [[ Resolver sin cobro ]]
+-----------------------------------------------------------------------------
```

- Campos de EX-1 con el estado consultado en Transbank (F-16). Motivo: CA-65. La hora de la consulta es ilustrativa; el párrafo es texto del diseño (UX-69).
- **Sin estado concluyente pasados los 7 días consultables (decisión del líder D5):** Transbank ya no permite consultar y nunca hubo una respuesta concluyente. Soporte puede resolver sin cobro como **declaración**, con motivo obligatorio y la advertencia aprobada de F-17 arriba del motivo. La advertencia no bloquea; el motivo es lo que queda en auditoría como respaldo.

```text
+-- Panel: Resolver sin cobro ------------------------------------------------
| Estado en Transbank: sin estado concluyente (no se puede consultar después
| de 7 días)
| Pago a crear: ninguno
|
| {!} No hay un estado de Transbank que respalde esta resolución. Confírmala
|     solo si verificaste con Transbank que no hubo cobro
|
| No se registrará ningún pago y la deuda no cambia. El intento quedará
| cerrado sin cobro.
|
| Motivo (obligatorio)
| [ Transbank confirmó por correo que no hubo cobro               ]
| No incluyas datos personales
|
| ( Cancelar )                                  [[ Resolver sin cobro ]]
+-----------------------------------------------------------------------------
```

- La línea del estado y el motivo de ejemplo son texto del diseño (UX-69). En la confirmación de CON-09, {estado} es el que entregue la API para este caso.
- Pasados los 7 días con una respuesta concluyente guardada, se usa esa respuesta con la misma regla: sin advertencia si es `INITIALIZED` o `FAILED`, y los mismos 422 si no.

- **Desde "Para reverso" (decisión del líder D13, `reversal_pending` → `rejected`):** el intento se marcó para reverso pasados los 7 días y el reembolso automático respondió con el código 292 (Transbank nunca hizo el cobro). Se abre desde el detalle o desde CON-07.

```text
Escenario ilustrativo: intento {buy_order} en reversal_pending, sin CA propio todavía
+-- Panel: Resolver sin cobro ------------------------------------------------
| Estado del intento: Para reverso
| Respuesta de Transbank al reembolso: nunca hubo cobro (código 292,
| {dd-mm-aaaa hh:mm})
| Pago a crear: ninguno
|
| No se registrará ningún pago y la deuda no cambia. El intento quedará
| cerrado sin cobro y no se confirmará el reverso.
|
| Motivo (obligatorio)
| [ El reembolso respondió que Transbank nunca cobró este pago     ]
| No incluyas datos personales
|
| ( Cancelar )                                  [[ Resolver sin cobro ]]
+-----------------------------------------------------------------------------
```

- Las líneas "Estado del intento", "Respuesta de Transbank al reembolso" y la segunda frase del párrafo son texto del diseño (UX-75). Fecha y hora: las del resultado del reembolso que entrega la API.
- **Supuesto (a validar), UX-75:** no se muestra la advertencia de D5 ("No hay un estado de Transbank que respalde esta resolución…"), porque la respuesta 292 sí la respalda. Si el analista la exige en F-17, va arriba del motivo, como en la declaración de D5.
- Confirmación (CON-09): el texto de `resolve_without_charge`, con el {estado} que entregue la API para este caso. El residente pasa de "Tu pago no se registró. Se solicitará la devolución del monto a Transbank" a "Tu pago no se completó. No se hizo ningún cargo" (`rejectionKind = resolved_without_charge`; APP-PAG-09).
- La huella de la vista previa incluye el estado del intento y la respuesta del reembolso; si cambian antes de ejecutar (por ejemplo, otra persona confirmó el reverso), 409 `PREVIEW_OUTDATED` (CON-10).

- **La vista previa no se puede pedir** (errores en el orden de la spec: estado del intento → estado en Transbank → motivo → huella):

```text
| {x} Transbank informa que este pago tiene un cobro vigente. Regístralo por
|     el monto autorizado o márcalo para reverso          <- OC-2026-0002
| {x} Transbank informa el estado REVERSED, que no corresponde a un pago sin
|     cobro. Revisa el intento antes de resolver
| {x} No pudimos consultar el estado en Transbank. Intenta en unos minutos
```

- 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` también en la ejecución, si Transbank cambia a `AUTHORIZED` después de la vista previa; el panel se cierra y el detalle se recarga.
- Con `REVERSED` o `NULLIFIED` (cobro ya devuelto), el 422 `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE` lleva en el banner el botón "Marcar para reverso", porque un cobro ya devuelto se cierra por reverso (D4; CON-06).

## CON-09 · Resultado (solo en la confirmación inmediata)

```text
+-- Pago Webpay resuelto ---------------------------------------------------------------------
| {ok} Pago registrado por $11.000 en la deuda del propietario de Depto 101, periodo 2026-11.
|      Número de orden OC-2026-0002
|
|                                                            [[ Volver a la lista ]]
+---------------------------------------------------------------------------------------------
```

| Resolución | Texto de la confirmación |
| --- | --- |
| `register_authorized` | "Pago registrado por $<monto> en la deuda {del propietario o del arrendatario} de {unidad}, periodo <AAAA-MM>. Número de orden {buy_order}" (F-17) |
| `mark_for_reversal` con reembolso pedido (`refund_requested`) | "Intento {buy_order} marcado para reverso. ComVive ya pidió la anulación a Transbank. Cuando Transbank responda, revisa la referencia propuesta y confirma el reverso" (F-17, S-59) |
| `mark_for_reversal` de un cobro ya devuelto (`already_returned`) | "Intento {buy_order} marcado para reverso. Transbank ya había devuelto el cobro. Revisa la referencia y confirma el reverso" (aprobado por el líder, D11, 2026-11-07; UX-74 cerrada) |
| `confirm_reversal` | "Reverso confirmado para el intento {buy_order}. Referencia de Transbank: {referencia}" (F-17) |
| `resolve_without_charge` | "Intento {buy_order} cerrado sin cobro. Estado en Transbank: {estado}" (F-17, S-59). En CA-65: "Intento OC-2026-0006 cerrado sin cobro. Estado en Transbank: INITIALIZED". Desde "Para reverso" (D13), el mismo texto con el {estado} que entregue la API |

- Datos de la respuesta de la resolución, nunca del detalle. "Volver a la lista" recarga la lista: el intento ya no aparece (registrado, reversado o sin cobro) o aparece "Para reverso".
- En CA-54 la confirmación dice "deuda del propietario" (tipo de ámbito final `owner`).

## CON-10 · Errores de Soporte

| Caso | Código | Texto | Comportamiento |
| --- | --- | --- | --- |
| El intento salió de la vista (otra persona lo registró o reversó) | 404 `NOT_FOUND` | "No encontramos lo que buscas o no tienes acceso" | Cierra el panel, vuelve a la lista y la recarga; no pide el detalle (CA-55) |
| La resolución no corresponde al estado | 409 `PREVIEW_OUTDATED` | "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa" | Recarga el detalle con las acciones de su estado (CA-55) |
| Cambió la huella | 409 `PREVIEW_OUTDATED` | "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" | Vista previa nueva con "Cambió" en el dato que cambió (CA-54) |
| Registrar un intento de dos deudas | 422 `MULTI_SCOPE_REVIEW_REVERSAL_ONLY` | "Un pago que cubre dos deudas solo se puede marcar para reverso" | Botón desactivado; si llega, banner |
| Sin motivo | 422 `REASON_REQUIRED` | "Indica el motivo de la resolución" | Error en el campo |
| Confirmar reverso sin referencia | 422 `REVERSAL_REFERENCE_REQUIRED` | "Ingresa la referencia de la anulación en Transbank" | Error en el campo |
| Sin cobro con cobro vigente (`AUTHORIZED`, `CAPTURED` o `PARTIALLY_NULLIFIED`) | 422 `CHARGE_AUTHORIZED_IN_TRANSBANK` | "Transbank informa que este pago tiene un cobro vigente. Regístralo por el monto autorizado o márcalo para reverso" | Banner `danger`; el intento sigue en revisión (CA-65) |
| Sin cobro con otro estado (`REVERSED`, `NULLIFIED` o desconocido) | 422 `TRANSBANK_STATUS_NOT_WITHOUT_CHARGE` | "Transbank informa el estado {estado}, que no corresponde a un pago sin cobro. Revisa el intento antes de resolver" | Banner `danger` (CA-65) |
| Sin cobro sobre un intento para reverso que no cumple D13 (el reembolso no respondió 292 pasados los 7 días) | 409 `PREVIEW_OUTDATED` | "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa" | Recarga el detalle. Código y texto: **Supuesto (a validar)** hasta que el analista fije D13 en la spec (UX-75) |
| Sin cobro desde "Para reverso" (D13) cuando otra persona ya confirmó el reverso | 409 `PREVIEW_OUTDATED` o 404 `NOT_FOUND` | Los de las filas de arriba | Si el intento salió de la vista, 404 y vuelve a la lista; si no, recarga el detalle |
| Transbank no responde a la consulta de estado de "sin cobro" o de "marcar para reverso" | 503 `PAYMENT_GATEWAY_UNAVAILABLE` | "No pudimos consultar el estado en Transbank. Intenta en unos minutos" | Banner `danger`; no cambia nada (S-57, CA-65, CA-68) |
| Marcar para reverso sin cobro en Transbank (`INITIALIZED` o `FAILED`) | 422 `NO_CHARGE_TO_REVERSE` | "Transbank informa el estado {estado}: este pago no tiene un cobro que devolver. Si corresponde, resuélvelo sin cobro" | Banner `danger` con el botón "Resolver sin cobro"; el intento sigue en revisión (D6, CA-68) |
| Marcar para reverso cuando cambió el estado en Transbank o si se pedirá reembolso (por ejemplo, de `AUTHORIZED` a `REVERSED`) | 409 `PREVIEW_OUTDATED` | "El intento cambió desde la vista previa. Revisa la nueva vista previa antes de resolver" | Vista previa nueva con "Cambió" en el estado y en "Se pedirá reembolso" (D4, CA-68) |
| Marcar para reverso un intento que ya está para reverso | 409 `PREVIEW_OUTDATED` | "Esta resolución no corresponde al estado actual del intento. Revisa la nueva vista previa" | Recarga el detalle, sin consultar a Transbank (CA-68) |
| Misma clave con otros datos | 422 `IDEMPOTENCY_KEY_REUSED` | "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario" | Cierra el panel y vuelve a la lista |
| Sesión vencida o rol revocado | — | "Tu sesión terminó. Vuelve a ingresar." | Lleva al ingreso |
| Falla de la auditoría | — | "No se pudo completar la acción. Intenta de nuevo." | GLB-05 |

**Carga:** esqueleto de la tabla en la lista y el detalle; botón con indicador y bloqueo del doble envío al confirmar.

## CON-11 · Operaciones ComVive: comunidades y administradores

```text
+-- ComVive · Consola de plataforma ·  Operaciones ComVive ------------------ Cerrar sesión ---
| Comunidades                                                           [[ Crear comunidad ]]
|
| Comunidad             RUT de la comunidad   Administradores    Pago en línea
| Edificio Los Aromos   {RUT}                 2                  Activo         > Administradores
| Edificio Mirador      {RUT}                 1                  Pendiente      > Administradores
+---------------------------------------------------------------------------------------------

+-- Panel: Crear comunidad ---------------------------------
| Nombre de la comunidad (obligatorio)  [                  ]
| RUT de la comunidad (obligatorio)     [                  ]
| Primer administrador
|   RUT (obligatorio)                   [                  ]
|   Celular o correo (obligatorio)      [                  ]
| Motivo (obligatorio)
| [ Contrato de administración del 01-10-2026             ]
| ( Cancelar )                     [[ Crear comunidad ]]
+-----------------------------------------------------------

+-- Administradores · Edificio Los Aromos -----------------------------------------------------
| Nombre            RUT             Desde        Otorgado por                 [ Otorgar administrador ]
| Carolina Lagos    10.987.654-2    01-10-2026   Operaciones ComVive          [! Revocar !]
| Héctor Molina     11.223.344-K    01-10-2026   Operaciones ComVive          [! Revocar !]
+---------------------------------------------------------------------------------------------
```

- Operaciones no ve datos de negocio: ni unidades, ni deudas, ni pagos. "Pago en línea" es el estado del código de comercio, solo lectura (UX-33 cerrada: se activa por procedimiento, ADR 0007). Fechas "Desde": ilustrativas.
- Otorgar administrador a quien integra el comité: 422 `ADMIN_COMMITTEE_CONFLICT`, "Esta persona integra el comité de la comunidad. Primero se debe revocar su rol de comité" (CA-43; por ejemplo, Rosa Díaz).
- Revocar: confirmación con motivo.
- Contacto: celular chileno (+56 9 y ocho dígitos) o correo. Si la persona ya tiene cuenta en ComVive, se usa su contacto verificado y el campo no se pide (spec, "Validaciones de la consola de Operaciones ComVive").

**Último administrador (decisión del líder D9; CA-69).** Con un solo administrador vigente, la consola no deja la comunidad sin administrador y guía el cambio en dos pasos:

```text
+-- Administradores · Edificio Mirador --------------------------------------------------------
| Nombre            RUT             Desde        Otorgado por                 [ Otorgar administrador ]
| {nombre}          {RUT}           {dd-mm-aaaa} Operaciones ComVive          [! Revocar !]
|
| {i} Para cambiar de administrador, primero otorga el rol a quien lo reemplazará y después
|     revoca al anterior.
+---------------------------------------------------------------------------------------------

Si se pide revocar igual:
| {x} No se puede revocar al único administrador de la comunidad. Otorga primero el rol a
|     quien lo reemplazará
|     [ Otorgar administrador ]
```

- La guía `{i}` es texto del diseño (UX-69) y aparece solo con un administrador vigente. "Revocar" no se desactiva: la regla la aplica la API, que responde 409 `LAST_ADMIN` (texto aprobado por el líder, D10), sin escribir nada. El banner ofrece "Otorgar administrador".
- Un administrador recién otorgado cuenta como vigente aunque no haya hecho su primer ingreso (decisión del líder D10; S-68): apenas se otorga, la tabla muestra dos filas y la revocación del anterior procede.
- Datos de la tabla: ilustrativos.

**Errores de Operaciones** (spec, "Validaciones de la consola de Operaciones ComVive", S-63; UX-66 cerrada). La API responde solo el primero, en el orden de cada acción. En ningún rechazo se escribe nada.

| Acción y orden | Código | Texto | Dónde se muestra |
| --- | --- | --- | --- |
| Crear comunidad: 1 | 422 `COMMUNITY_NAME_REQUIRED` | "Ingresa el nombre de la comunidad" | Bajo el nombre |
| Crear comunidad: 2 (RUT de la comunidad) y 3 (RUT del administrador), también vacíos | 422 `INVALID_RUT` | "Ingresa un RUT válido. Revisa el dígito verificador" | Bajo el campo del RUT que falló |
| Crear comunidad: 4 | 422 `INVALID_CONTACT` | "Ingresa un celular o un correo válido del administrador" | Bajo "Celular o correo" |
| Crear comunidad: 5 | 422 `REASON_REQUIRED` | "Indica el motivo del alta" | Bajo el motivo |
| Crear comunidad: 6 | 409 `COMMUNITY_ALREADY_EXISTS` | "Ya existe una comunidad con este RUT en ComVive" | Banner y foco en el RUT de la comunidad |
| Otorgar administrador: 1 | 422 `INVALID_RUT` | "Ingresa un RUT válido. Revisa el dígito verificador" | Bajo el RUT |
| Otorgar administrador: 2 (solo si la persona no tiene cuenta) | 422 `INVALID_CONTACT` | "Ingresa un celular o un correo válido del administrador" | Bajo "Celular o correo" |
| Otorgar administrador: 3 | 422 `REASON_REQUIRED` | "Indica el motivo del otorgamiento" | Bajo el motivo |
| Otorgar administrador: 4 | 422 `ADMIN_COMMITTEE_CONFLICT` | "Esta persona integra el comité de la comunidad. Primero se debe revocar su rol de comité" | Banner (CA-43) |
| Otorgar administrador: 5 | 409 `ALREADY_ADMIN` | "Esta persona ya es administradora de la comunidad" | Banner; recarga la tabla |
| Revocar administrador: 1 | 422 `REASON_REQUIRED` | "Indica el motivo de la revocación" | Bajo el motivo |
| Revocar administrador: 2 | 409 `ROLE_ALREADY_REVOKED` | "Este rol ya fue revocado" | Banner; recarga la tabla. Un reintento con la misma clave devuelve el resultado original, no el 409 |
| Revocar administrador: 3 | 409 `LAST_ADMIN` | "No se puede revocar al único administrador de la comunidad. Otorga primero el rol a quien lo reemplazará" | Banner con "Otorgar administrador" (D9, CA-69) |

- **Activar el pago en línea** (UX-33 cerrada; Menor 5 de la rev. 4): es un procedimiento auditado de Operaciones ComVive, sin pantalla en el MVP (ADR 0007). La columna "Pago en línea" solo muestra el estado ("Activo" o "Pendiente"), sin acción. Para QA, "Edificio Mirador" en "Pendiente" ilustra una comunidad sin comercio vigente (422 `ONLINE_PAYMENT_NOT_AVAILABLE` en la app, APP-07); el dato de prueba lo fijan el analista y QA.
