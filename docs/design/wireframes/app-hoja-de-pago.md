# Wireframes: hoja "¿Qué quieres pagar?" y resultado del pago con Webpay

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/residente-estado-de-cuenta-y-pago.md` (pasos 3 a 9, "Errores" y "Carga"). Superficie: app residente (360 px). Componentes: `PaymentSheet` (design system 5.9) y `Receipt` (5.18).

Reglas que se ven en estas pantallas (spec F-12, F-16, F-17; arquitectura §4, "Webpay"):

- Cada opción muestra el monto que entrega la API para esa opción, incluido "Ambas". La app no suma.
- Al iniciar, la app envía los ámbitos elegidos y el total que vio (`expectedTotalClp`). Si la deuda cambió, la API responde 409 `AMOUNT_CHANGED` con los montos nuevos.
- Solo se ofrecen ámbitos con deuda mayor que $0. "Ambas" solo si los dos tienen deuda y ninguno tiene un pago en curso.

Criterios de aceptación: CA-10, CA-29, CA-30, CA-41, CA-55 y CA-75.

## APP-PAG-01 · Hoja de pago del propietario con dos deudas

Escenario: Luis Muñoz, Depto 102, el 05-01-2027, estado de partida de CA-29 (APP-02 de `app-inicio.md`).

```text
+-- Inicio (velado) --------------------
|
+-- Hoja inferior ----------------------
|               ====                     <- asa
| ¿Qué quieres pagar?          [Cerrar]
|
| +-----------------------------------
| | ( ) Mi deuda             $266.814
| +-----------------------------------
| +-----------------------------------
| | ( ) Deuda del arrendatario
| |     Pedro Soto           $263.190
| +-----------------------------------
| +-----------------------------------
| | (o) Ambas                $530.004
| +-----------------------------------
|
| [[         Pagar $530.004         ]]
+---------------------------------------
```

- Ninguna opción viene marcada al abrir. Antes de elegir, el botón dice "Pagar" y está desactivado (design system 5.9).
- Montos de la API: $266.814, $263.190 y $530.004 (CA-29, GOLD-A29). El total "Ambas" es el que la API entrega para esa opción.
- Al abrirse, el foco va al título; al cerrarse (asa, "Cerrar" o gesto atrás), vuelve a "Pagar gasto común".
- Al tocar "Pagar $530.004", el botón pasa a "Conectando con Webpay…" y no admite otro toque (APP-PAG-06).

## APP-PAG-02 · Advertencia por un pago propio en revisión

Escenario: Ana Pérez, Depto 101, el 26-11-2026. El intento `OC-2026-0002` de $110.000 sigue en `in_review` (CA-41). Tiene una sola deuda.

```text
+-- Hoja inferior ----------------------
| ¿Qué quieres pagar?          [Cerrar]
|
| {!} Tienes un pago en revisión por
|     $110.000; si pagas de nuevo
|     podría quedar saldo a favor
|
| +-----------------------------------
| | (o) Mi deuda             $110.000
| +-----------------------------------
|
| [[         Pagar $110.000         ]]
+---------------------------------------
```

- Texto de F-17. `<monto>` es el **monto iniciado** del intento ($110.000), no el autorizado (H-23).
- Con una sola deuda el pago normalmente es de un toque, sin hoja. Si hay un intento propio en revisión, la hoja se abre igual, ya con la opción marcada, para que la advertencia se lea antes de pagar. **Supuesto (a validar)**, decisión de diseño a confirmar en pruebas con usuarios.

## APP-PAG-03 · Opción no disponible

Escenario: CA-30. Luis Muñoz ya tiene en `initiated` un pago de "Deuda del arrendatario".

```text
+-- Hoja inferior ----------------------
| ¿Qué quieres pagar?          [Cerrar]
|
| +-----------------------------------
| | ( ) Mi deuda             $266.814
| +-----------------------------------
| +-- desactivada --------------------
| | ( ) Deuda del arrendatario
| |     Pedro Soto           $263.190
| |     Tienes un pago en proceso
| +-----------------------------------
|   ("Ambas" no aparece)
|
| [[             Pagar              ]]   <- desactivado hasta elegir
+---------------------------------------
```

- Texto de F-17 visible en la opción, no solo en un tooltip (design system 5.1, "Desactivado con motivo").
- "Ambas" no se ofrece mientras uno de los ámbitos tenga un pago en curso (F-12, CA-30).

## APP-PAG-04 · Ámbito con pago en curso de otra persona (409 `PAYMENT_IN_PROGRESS`)

Escenario: CA-30, visto por Pedro Soto (arrendatario). El propietario inició un pago sobre su deuda; Pedro no ve ningún estado previo y toca "Pagar gasto común".

```text
+---------------------------------------
| +-[borde ámbar]---------------------
| | Tu gasto común      <Por vencer>
| | $263.190
| | Por vencer el 11-01-2027: $263.190
| +-----------------------------------
|
| {!} Ya hay un pago en proceso para
|     esta deuda
|
| [[      Pagar gasto común       ]]
+---------------------------------------
```

- Texto de F-17, sin decir quién paga. El banner `warning` reemplaza la conexión con Webpay; no se abre el navegador.
- Si quien recibe el 409 es el propietario dentro de la hoja (el arrendatario pagaba su deuda), el mismo texto aparece bajo esa opción y la opción queda desactivada.
- "Pagar gasto común" sigue visible: la API decide en cada intento. **Supuesto (a validar)**: no se oculta el botón tras un 409, porque la app no sabe cuándo se libera el bloqueo (UX-52).

## APP-PAG-05 · El monto cambió (409 `AMOUNT_CHANGED`)

Escenario: Ana Pérez veía $110.000. Antes de tocar "Pagar", Soporte ComVive registró el intento en revisión por $11.000 (CA-41) y la deuda quedó en $99.000.

```text
+-- Hoja inferior ----------------------
| ¿Qué quieres pagar?          [Cerrar]
|
| {!} El monto a pagar cambió. Revisa
|     el nuevo monto
|
| +-----------------------------------
| | (o) Mi deuda              $99.000
| |     Antes: $110.000
| +-----------------------------------
|
| [[         Pagar $99.000          ]]
+---------------------------------------
```

- Texto del 409: spec. Los montos nuevos vienen en la respuesta del 409; la app no los calcula. "Antes: ${monto}" es texto del diseño (UX-69) y usa el monto que la pantalla mostraba.
- La opción queda marcada y la persona debe tocar de nuevo para confirmar (flujo, diagrama L2).

## APP-PAG-06 · Conectando y confirmando

```text
Antes de abrir Webpay                      Al volver de Webpay (bloqueante)
+--------------------------------------    +--------------------------------------
| [[  Conectando con Webpay…   ]]           |
|   (indicador, sin otro toque)             |      (indicador de progreso)
+--------------------------------------    |
                                           |   Confirmando tu pago…
                                           |
                                           +--------------------------------------
```

- Textos del flujo ("Carga"). Webpay se abre en un navegador seguro dentro de la app. Al volver, la app siempre consulta el estado del intento a la API; si no hay respuesta final, pasa a "En proceso".

## APP-PAG-07 · Pago aprobado (comprobante)

Escenario: CA-29. Luis Muñoz pagó "Ambas" el 05-01-2027 con la orden `OC-2027-0001`.

```text
+---------------------------------------
| < Inicio              Comprobante
|
|        (icono circle-check)
| Pagado por ti
| $530.004                        (lg)
| Depto 102 · 05-01-2027
| Número de orden OC-2027-0001
|
| Se aplicó a
| Tu deuda                    $266.814
| Deuda del arrendatario      $263.190
|
| [[      Compartir comprobante      ]]
| [          Volver al inicio         ]
+---------------------------------------
```

- Componente `Receipt` (design system 5.18): "Pagado por ti" (F-17), el monto, la unidad y la fecha, y el número de orden, en líneas separadas (flujo, paso 6; UX-67 cerrada).
- "Se aplicó a": glosario de interfaz del design system ("Imputación" no se muestra en la app). Montos por ámbito de la API (F-12).
- Un pago de un solo ámbito no muestra el bloque "Se aplicó a".
- Si Transbank confirmó dos veces, la persona ve un solo comprobante (CA-10).
- Lo que ve el arrendatario del mismo pago está en `app-pagos-y-cobros.md` ("Pagado por el propietario · $263.190 · 05-01-2027 · Webpay", sin el total ni el número de orden).

## APP-PAG-08 · Otros resultados al volver

```text
Rechazado por Transbank                    Cancelado (abandoned)
(rejectionKind = transbank_rejected)
+--------------------------------------    +--------------------------------------
| (icono circle-alert)                      | (icono circle-alert)
| Tu banco rechazó el pago. No se           | Pago cancelado. No se hizo ningún
| hizo ningún cargo                         | cargo
|                                           | Podrás reintentar en 12 min
| [[     Intentar de nuevo      ]]          |
| [       Volver al inicio      ]           | [       Volver al inicio      ]
+--------------------------------------    +--------------------------------------

En proceso                                 En revisión por ComVive
+--------------------------------------    +--------------------------------------
| (icono clock)                             | (icono search-check)
| Estamos confirmando tu pago con           | En revisión por ComVive
| Transbank. No vuelvas a pagar. Te         | Te avisaremos cuando se resuelva.
| avisaremos cuando se confirme.            | Número de orden OC-2026-0002
| Número de orden OC-2026-0002              |
|                                           | [       Volver al inicio      ]
| [       Volver al inicio      ]           +--------------------------------------
+--------------------------------------
```

- Textos del flujo (paso 6) y de F-17 ("En revisión por ComVive" y su detalle). El número de orden de "En proceso" es ilustrativo.
- **Un texto por estado (M-6, rev. 4):** `rejected` se muestra según el campo `rejectionKind` que entrega la API: `transbank_rejected`, "Tu banco rechazó el pago. No se hizo ningún cargo" (esta pantalla); `resolved_without_charge`, "Tu pago no se completó. No se hizo ningún cargo" (APP-PAG-09). `abandoned` tiene un único texto, "Pago cancelado. No se hizo ningún cargo" (texto del diseño aprobado con UX-69, D15), también si el intento quedó así por el 503 al iniciar. Sin punto final y sin otras variantes.
- "Podrás reintentar en {n} min" solo aparece si el intento aún bloquea el ámbito (la persona cerró el navegador sin volver). Cómo se obtiene {n}: UX-52.
- **Formulario de Webpay expirado (decisión del líder D18; ADR 0007, decisión 4; spec F-12):** la expiración no lleva directo a `abandoned`. Antes de cancelar, ComVive consulta el estado a Transbank y la app muestra la pantalla que corresponda al estado resultante, sin una pantalla propia de "expirado":
  - **Sin cobro** (`INITIALIZED`): `abandoned`, "Pago cancelado. No se hizo ningún cargo" (esta pantalla, sin la línea "Podrás reintentar", porque el ámbito queda libre).
  - **Autorizado:** confirmación normal, con el comprobante (APP-PAG-07) o "En revisión por ComVive" si el monto no coincide.
  - **Sin respuesta, error u otro estado:** el intento sigue `initiated`; la app muestra "En proceso" (esta pantalla) y en Inicio el bloque de esa deuda muestra "Tienes un pago en proceso" y "Número de orden {buy_order}. Te avisaremos el resultado" (APP-05). Lo resuelve la consulta de los 15 minutos.
- "Intentar de nuevo" vuelve a abrir la hoja o a iniciar el pago con una clave de idempotencia nueva.

## APP-PAG-09 · Resultados de un pago en revisión resuelto por Soporte

Spec rev. 5 (F-16, F-17; textos de S-59 aprobados por el líder el 2026-11-07):

- **Para reverso:** la API pide el reembolso a Transbank automáticamente (D2). El residente ve el texto de F-17 de `reversal_pending`, sin cambios: "Tu pago no se registró. Se solicitará la devolución del monto a Transbank" (APP-06).
- **Para reverso con cobro ya devuelto** (Transbank ya informaba `REVERSED` o `NULLIFIED`; D4): ComVive no pide reembolso y el residente ve "Tu pago no se registró. Transbank ya devolvió el monto" (decisión del líder D8, 2026-11-07, aprobada; `reversalKind = already_returned`, S-67; APP-06). Si ya no tiene membresía, recibe la variante de cobro ya devuelto del aviso de F-13 (CA-68).
- **Sin cobro** (`resolve_without_charge`, `in_review` → `rejected`; D3): Soporte cierra el intento porque Transbank informa que no hubo cobro. La deuda no cambia. La app lo reconoce por `rejectionKind = resolved_without_charge` (M-6, rev. 4).
- **Sin cobro desde "Para reverso"** (D13, `reversal_pending` → `rejected`): pasados los 7 días, el reembolso automático respondió que Transbank nunca cobró (código 292) y Soporte cierra el intento sin cobro. La franja pasa de "Tu pago no se registró. Se solicitará la devolución del monto a Transbank" al mismo texto de "sin cobro", con el mismo `rejectionKind`.

Escenario: CA-65. Ana Pérez, Depto 101, el 26-11-2026. El intento `OC-2026-0006` de $110.000 se resolvió sin cobro.

```text
+---------------------------------------
| +-[borde rojo]----------------------
| | Tu deuda              <Vencida>
| | $110.000
| | Vencido desde 11-11-2026: $110.000
| | +- franja surface ---------------
| | | Tu pago no se completó. No se
| | | hizo ningún cargo
| | | Número de orden OC-2026-0006
| | +--------------------------------
| +-----------------------------------
| [[      Pagar gasto común       ]]
+---------------------------------------
```

- Texto de F-17 (S-59), tal cual. El número de orden bajo el estado es texto del diseño (UX-69, aprobado en bloque, D15), como en los demás estados del intento.
- Ya no aparece "Tienes un pago en revisión por $110.000; si pagas de nuevo podría quedar saldo a favor" y el nuevo pago se acepta sin advertencia (CA-65).
- En el historial, el intento muestra el mismo texto (APP-HIS-03). Como en `reversed`, la franja se cierra con "Entendido".
- Si la persona ya no tiene membresía, recibe por correo o SMS el aviso de F-13 para `resolve_without_charge` (CA-65).

## APP-PAG-10 · Retorno inválido de Webpay (pantalla propia)

Escenario: CA-75. La API recibe un retorno de Webpay que no puede validar: intento de otra comunidad, intento inexistente, o token u orden que no coinciden con el intento (spec F-12, H-32). Responde un 302 neutro a esta pantalla, sin el id del intento.

```text
+---------------------------------------
|
|        (icono triangle-alert, 48 px)
|
|  No encontramos lo que buscas o no
|  tienes acceso
|
| [[        Volver al inicio        ]]
|
+---------------------------------------
```

- Texto neutro de GLB-02 (404 `NOT_FOUND` de la spec), tal cual y sin punto final, por **decisión del líder D19** (2026-11-08, cierra P-59). Se descarta el texto de S-83 ("No pudimos mostrar el resultado del pago…").
- **Igual para toda causa:** misma pantalla, mismo texto y mismo botón para un intento ajeno, uno inexistente o datos que no coinciden. Así no revela si el intento existe.
- **Sin datos del pago:** no muestra número de orden (`buy_order`), monto, estado, unidad ni comunidad. La app no consulta ningún intento al abrirla: la ruta no trae id.
- **Mismo texto que GLB-02, pero pantalla propia:** comparte el texto y el botón "Volver al inicio" con el 404 neutro, pero no es GLB-02: usa el ícono `triangle-alert` en vez de `search-x` y no tiene barra de pestañas. Para evitar un pago doble si el pago sí existía, "Volver al inicio" lleva a Inicio, que muestra el pago en curso si lo hay (ver más abajo).
- **Ícono:** `triangle-alert` (advertencia, design system 7), decorativo y oculto para lectores de pantalla; el texto se entiende solo. Sin barra de pestañas, como las demás pantallas de resultado (APP-PAG-08). Ícono y ausencia de barra aprobados por el líder (D21).
- **"Volver al inicio"** (`Button` `primary`, a todo el ancho, 48 px de alto): abre Inicio, que consulta `webpay-attempts/current`. Si la persona tenía un pago propio en curso, Inicio lo muestra en el bloque de esa deuda (APP-05). Si la sesión expiró, pide el ingreso y luego abre Inicio.
- **Accesibilidad:** al abrirse, el foco va al texto; el gesto atrás equivale a "Volver al inicio".

## Errores

Textos de la tabla "Códigos y mensajes de error" de la spec y del flujo, tal cual.

| Caso | Texto | Dónde se muestra |
| --- | --- | --- |
| 409 `PAYMENT_IN_PROGRESS` | "Ya hay un pago en proceso para esta deuda" | Banner en Inicio (APP-PAG-04) o bajo la opción de la hoja |
| 409 `AMOUNT_CHANGED` | "El monto a pagar cambió. Revisa el nuevo monto" | Banner en la hoja, con los montos nuevos (APP-PAG-05) |
| 422 `SCOPE_WITHOUT_DEBT` | "Esta deuda no tiene saldo pendiente" | Banner en Inicio; la hoja se cierra y Inicio se recarga |
| 422 `ONLINE_PAYMENT_NOT_AVAILABLE` | "Esta comunidad aún no recibe pagos en línea. Pide a la administración los datos para pagar por transferencia" | Reemplaza el botón (APP-07 de `app-inicio.md`) |
| 422 `IDEMPOTENCY_KEY_REUSED` | "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario" | Cierra la hoja y recarga Inicio |
| 404 `NOT_FOUND` (ámbito que no ve) | "No encontramos lo que buscas o no tienes acceso" | GLB-02 |
| Retorno inválido de Webpay (302 neutro, sin id del intento; H-32, CA-75) | "No encontramos lo que buscas o no tienes acceso" (texto de GLB-02; decisión del líder D19) | Pantalla propia APP-PAG-10 con ícono `triangle-alert`, sin barra de pestañas (D21) y "Volver al inicio" |
| 503 `PAYMENT_GATEWAY_UNAVAILABLE` (Transbank no responde al crear la transacción) | "No pudimos conectar con Webpay. Intenta en unos minutos" | Banner `danger` en Inicio; la hoja se cierra y no se abre el navegador. El intento queda `abandoned` y el ámbito libre: "Pagar gasto común" sigue activo (S-57, CA-66) |
| Sin conexión | "Necesitas conexión para pagar" (UX-63) | Bajo el botón desactivado (GLB-04) |
