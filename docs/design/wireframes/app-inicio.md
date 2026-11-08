# Wireframes: Inicio de la app residente

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/residente-estado-de-cuenta-y-pago.md` (pasos 1, 2, 8 y "Estados vacíos"). Superficie: app residente (360 px). La hoja "¿Qué quieres pagar?" y el resultado del pago están en `app-hoja-de-pago.md`.

Reglas que se ven en estas pantallas (spec F-9, F-12, F-16, F-17; design system 5.8):

- Una tarjeta por ámbito. Nunca un total que sume o compense ámbitos, ni siquiera entre las dos tarjetas del propietario.
- Todos los montos vienen de la API. La app no suma, no resta ni reparte.
- "Pagar gasto común" se ve sin desplazar en 360 × 640 px, también con dos tarjetas.
- El arrendatario no ve ningún texto, monto ni enlace sobre la deuda del propietario.

Criterios de aceptación: CA-22, CA-29, CA-30, CA-33, CA-41, CA-49, CA-53, CA-55, CA-56, CA-60 y CA-63.

## APP-01 · Propietario sin arrendatario

Escenario: Ana Pérez, Depto 101, el 20-11-2026. `2026-10` emitido como en CA-1 ($210.000, vencido el 11-11-2026) y pago manual de $100.000 del 05-11-2026 (CA-5). Flag `billing.interest` apagado.

```text
+-- Encabezado -------------------------
| Edificio Los Aromos
| Depto 101
+---------------------------------------
| +-[borde rojo]----------------------
| | Tu deuda              <Vencida>
| | $110.000                     (xl)
| | Vencido desde 11-11-2026: $110.000
| | > Ver detalle
| +-----------------------------------
|
| [[      Pagar gasto común       ]]
|
| v Desglose de tu deuda
|   Octubre 2026
|     Gasto común            $100.000
|     Fondo de reserva        $10.000
|   Pagos recibidos
|     Registrado por la administración
|     · $100.000 · 05-11-2026 ·
|     Transferencia
|
| > Ver detalle del periodo
| > Ver aviso (PDF)
+---------------------------------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

- Chip "Vencida": regla de UX-54 (hay monto vencido mayor que $0). Ícono `circle-alert` y texto, no solo color.
- Nombres de cuenta en la app: "Gasto común" y "Fondo de reserva" (**Supuesto (a validar)**, UX-58).
- Sin línea "Por vencer": la API no entrega monto por vencer en este ámbito.
- Montos: CA-5 ($210.000 − $100.000 = $110.000; ordinario $100.000 y fondo $10.000 pendientes).

## APP-02 · Propietario con arrendatario vigente (flag activo)

Escenario: Luis Muñoz, Depto 102, el 05-01-2027, estado de partida de CA-29 (CA-26 después de emitir `2026-12` el 01-01-2027). Arrendatario vigente: Pedro Soto (O-1).

```text
+-- Encabezado -------------------------
| Edificio Los Aromos
| Depto 102
+---------------------------------------
| +-[borde rojo]----------------------
| | Tu deuda              <Vencida>
| | $266.814                     (xl)
| | Vencido desde 11-11-2026: $264.139
| | Por vencer el 11-01-2027: $2.675
| | {!} Tu deuda está vencida. Se
| |     pueden generar intereses hasta
| |     la fecha de tu pago, que se
| |     cobrarán en el próximo aviso
| | > Ver detalle
| +-----------------------------------
|
| +-[borde ámbar]---------------------
| | Deuda del arrendatario
| | Pedro Soto           <Por vencer>
| | $263.190                     (lg)
| | Por vencer el 11-01-2027: $263.190
| | Esta deuda es del arriendo vigente.
| | Puedes pagarla si lo acordaste con
| | tu arrendatario.
| | > Ver detalle
| +-----------------------------------
|
| [[      Pagar gasto común       ]]
|
| v Desglose de tu deuda
| v Desglose de la deuda del arrendatario
+---------------------------------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

- **Sin total entre las tarjetas** (F-9, M1). La hoja de pago muestra "Ambas $530.004" porque la API entrega ese monto para esa opción (`app-hoja-de-pago.md`), no porque la app lo sume.
- Aviso de intereses: texto de E-8, solo con el flag activo y deuda vencida en ese ámbito. La tarjeta del arrendatario no lo muestra porque no tiene monto vencido.
- Nota del bloque del arrendatario: texto del diseño del flujo (paso 2).
- Montos: CA-29 y GOLD-A29. "Vencido" $264.139 = interés $1.639 + capital `2026-10` $262.500; "Por vencer" $2.675 = interés de `2026-12`. Los dos los entrega la API.
- La segunda tarjeta usa `type.amount.lg` para que el botón quede visible sin desplazar. **Supuesto (a validar)**, verificar en prototipo con texto ampliado.
- "Ver detalle" de la tarjeta del arrendatario queda en auditoría (S-44); la pantalla no lo dice.

**Desglose del arrendatario expandido** (lo que ve el propietario, CA-60):

```text
| v Desglose de la deuda del arrendatario
|   Diciembre 2026
|     Gasto común            $250.000
|     Fondo de reserva        $12.500
|     Intereses por mora         $690
|   Saldo anterior                 $0
```

## APP-03 · Arrendatario

Escenario: Pedro Soto (O-1), Depto 102, el 02-12-2026, estado de CA-22 después de emitir `2026-11` el 01-12-2026. Flag apagado.

```text
+-- Encabezado -------------------------
| Edificio Los Aromos
| Depto 102
+---------------------------------------
| +-[borde ámbar]---------------------
| | Tu gasto común      <Por vencer>
| | $262.500                     (xl)
| | Por vencer el 11-12-2026: $262.500
| | > Ver detalle
| +-----------------------------------
|
| [[      Pagar gasto común       ]]
|
| v Desglose de tu gasto común
|   Noviembre 2026
|     Gasto común            $250.000
|     Fondo de reserva        $12.500
|   Saldo anterior                 $0
|
| > Ver cobro de noviembre 2026
+---------------------------------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

- Título "Tu gasto común" (design system 5.8). No hay enlace "Ver aviso (PDF)": el arrendatario ve la vista de su cobro (G-7), en `app-pagos-y-cobros.md`.
- No aparece ningún dato del ámbito `owner` (los $262.500 de `2026-10` del propietario, CA-22). Si el arrendatario abre por enlace un cargo de `2026-10`, ve GLB-02 (404).
- Un toque en "Pagar gasto común" inicia el pago de su ámbito: no hay hoja de elección (flujo, paso 3).

## APP-04 · Estados vacíos

```text
Al día (propietario o arrendatario)        Saldo a favor del propietario (CA-33)
+--------------------------------------    +--------------------------------------
| +-[borde verde]------------------         | +-[borde turquesa]---------------
| | Tu deuda             <Al día>           | | Tu deuda       <Saldo a favor>
| | Estás al día. Te avisaremos             | | Tienes $10.500 a favor. Se
| | cuando llegue tu próximo gasto          | | descontará de tu próximo gasto
| | común.                                  | | común.
| +--------------------------------         | +--------------------------------
|   (sin botón de pago)                     |   (sin botón de pago)
+--------------------------------------    +--------------------------------------

Saldo a favor del arrendatario (CA-49)     Deuda del arrendatario en $0 (CA-60)
+--------------------------------------    +--------------------------------------
| +-[borde turquesa]---------------         | (tarjeta "Tu deuda" normal)
| | Tu gasto común <Saldo a favor>          | +-[borde verde]------------------
| | Tienes $37.500 a favor. Se              | | Deuda del arrendatario Pedro
| | descontará de tus próximos              | | Soto: al día          <Al día>
| | cobros mientras sigas                   | +--------------------------------
| | arrendando esta unidad.                 | (no se ofrece en la hoja de pago)
| +--------------------------------         +--------------------------------------
+--------------------------------------

Propietario sin periodos emitidos          Arrendatario sin cargos en su ámbito (CA-53)
+--------------------------------------    +--------------------------------------
| Tu comunidad todavía no emite             | Aún no hay cobros desde tu ingreso
| gastos comunes en ComVive.                | el 05-12-2026. Te avisaremos cuando
+--------------------------------------    | llegue el primero.
                                           +--------------------------------------
```

- Textos del flujo ("Estados vacíos"). Montos: CA-33 (Depto 101 con $10.500 a favor), CA-49 (O-1 con $37.500 a favor), CA-60 (O-1 en $0). Fecha de ingreso: O-4 (Daniela Fuentes), vigente desde el 05-12-2026 con saldo $0 (CA-53).
- Chips "Al día" y "Saldo a favor": textos del diseño (UX-54, UX-63).

## APP-05 · Pago propio en proceso (estado, no error)

Escenario: CA-30. El 05-01-2027 Luis Muñoz eligió "Deuda del arrendatario" y el intento de $263.190 quedó en `initiated`. Número de orden ilustrativo: `OC-2027-0001` (CA-30 no fija uno; es el de CA-29).

```text
Lo que ve el propietario                   Lo que ve el arrendatario
+--------------------------------------    +--------------------------------------
| +-[borde rojo]-------------------         | +-[borde ámbar]------------------
| | Tu deuda          <Vencida>             | | Tu gasto común  <Por vencer>
| | $266.814                                | | $263.190
| | Vencido desde 11-11-2026:               | | Por vencer el 11-01-2027:
| |   $264.139                              | |   $263.190
| | Por vencer el 11-01-2027: $2.675        | +--------------------------------
| +--------------------------------         |
| +-[borde ámbar]------------------         | [[    Pagar gasto común     ]]
| | Deuda del arrendatario                  |
| | Pedro Soto     <Por vencer>             | <- sin franja ni aviso: igual que
| | $263.190                                |    APP-03. El 409 solo aparece si
| | +- franja surface ------------          |    toca pagar (APP-PAG-04)
| | | Tienes un pago en proceso             +--------------------------------------
| | | Número de orden OC-2027-0001.
| | | Te avisaremos el resultado
| | +-----------------------------
| +--------------------------------
|
| [[    Pagar gasto común     ]]   <- sigue activo: "Mi deuda" no está bloqueada
+--------------------------------------
```

- Textos de F-17 (UX-46). Solo quien inició el intento ve el estado: `GET .../webpay-attempts/current` devuelve solo los intentos que inició quien consulta (H-31, S-74; spec F-12). La app dibuja la franja solo con lo que devuelve `current`.
- **El arrendatario no ve ningún estado de pago en curso** (CA-30 rev. 6, UX-68; B-1 de la rev. 4): ni franja, ni chip, ni banner, ni texto en su tarjeta. `current` no le devuelve el intento del propietario: ni su id, ni su monto, ni el ámbito bloqueado (H-31). Su Inicio es igual al de APP-03. El texto del 409 `PAYMENT_IN_PROGRESS` aparece solo como respuesta a un toque en "Pagar gasto común", y se dibuja en APP-PAG-04, no aquí.
- **Lo mismo al revés:** si el arrendatario inicia un pago de su deuda, el propietario no ve ningún estado en "Deuda del arrendatario"; solo recibe "Ya hay un pago en proceso para esta deuda" si elige esa opción (o "Ambas") en la hoja (APP-PAG-04).
- Si **todos** los ámbitos con deuda tienen un pago propio en curso, el botón no aparece y queda solo la franja (flujo, diagrama, nodo I1).

## APP-06 · Pago en revisión, para reverso y reversado

Escenario: Ana Pérez, Depto 101, CA-41 y CA-55. Intento `OC-2026-0002` de $110.000, autorizado por $11.000, en `in_review` desde el 25-11-2026. La deuda no cambia mientras tanto.

```text
En revisión (in_review)                    Para reverso (reversal_pending)
+--------------------------------------    +--------------------------------------
| +-[borde rojo]-------------------         | +-[borde rojo]-------------------
| | Tu deuda          <Vencida>             | | Tu deuda          <Vencida>
| |          <En revisión por ComVive>      | | $110.000
| | $110.000                                | | Vencido desde 11-11-2026:
| | Vencido desde 11-11-2026:               | |   $110.000
| |   $110.000                              | | +- franja surface ------------
| | +- franja surface ------------          | | | Tu pago no se registró. Se
| | | Te avisaremos cuando se               | | | solicitará la devolución del
| | | resuelva. Número de orden             | | | monto a Transbank
| | | OC-2026-0002                          | | +-----------------------------
| | +-----------------------------          | +--------------------------------
| +--------------------------------         | [[    Pagar gasto común     ]]
| [[    Pagar gasto común     ]]            +--------------------------------------
+--------------------------------------

Para reverso con cobro ya devuelto          Reversado (reversed)
(reversal_pending, D8)
+--------------------------------------    +--------------------------------------
| ... misma tarjeta ...                     | ... misma tarjeta ...
| | +- franja surface ------------          | | +- franja surface ------------
| | | Tu pago no se registró.               | | | Tu pago fue anulado en
| | | Transbank ya devolvió el              | | | Transbank. El reembolso a tu
| | | monto                                 | | | medio de pago depende de tu
| | +-----------------------------          | | | banco
+--------------------------------------    | | +-----------------------------
                                           +--------------------------------------
```

- **Cobro ya devuelto (decisión del líder D8, 2026-11-07, aprobada):** si Soporte marcó el intento para reverso y Transbank ya lo informaba `REVERSED` o `NULLIFIED`, ComVive no pide reembolso (D4) y la franja dice "Tu pago no se registró. Transbank ya devolvió el monto" en lugar de "Tu pago no se registró. Se solicitará la devolución del monto a Transbank". La app no deduce el caso: lo elige por el campo `reversalKind = already_returned` que entrega la API (spec F-16 y F-17, S-67; CA-68); con `refund_requested`, el texto anterior. Al confirmarse el reverso, pasa al texto de `reversed`.
- Textos de F-17, sin variantes, salvo la de D8. El chip "En revisión por ComVive" usa `color.debt.review` y acompaña al chip de la deuda, que no cambia (design system 5.6).
- El botón sigue activo: un intento en revisión no bloquea (**Supuesto (a validar)** de la arquitectura). Al abrir la hoja aparece la advertencia de `app-hoja-de-pago.md`, APP-PAG-02.
- Si se resuelve con `register_authorized`, la tarjeta pasa a $99.000 y el pago de $11.000 aparece como "Pagado por ti" (CA-41). Si la persona ya no tiene membresía, no ve la app: recibe el correo o SMS de F-13 (CA-54).
- La franja de `reversed` se mantiene hasta que la persona la cierra con "Entendido" (texto del diseño, UX-69); después el estado queda solo en el historial (`app-pagos-y-cobros.md`).

## APP-07 · Comunidad sin pago en línea

```text
+---------------------------------------
| +-[borde rojo]----------------------
| | Tu deuda              <Vencida>
| | $110.000
| | Vencido desde 11-11-2026: $110.000
| +-----------------------------------
|
| Esta comunidad aún no recibe pagos en
| línea. Pide a la administración los
| datos para pagar por transferencia
|
| [            Cómo pagar            ]
+---------------------------------------

Cómo pagar (Más > Cómo pagar)
+---------------------------------------
| < Atrás          Cómo pagar
|
| Transferencia a la cuenta de la
| comunidad
| Banco            {banco}
| Tipo de cuenta   {tipo}
| Número           {número}
| Titular          {titular}
| RUT del titular  {RUT}
| Comprobante a    {correo}
|
| [      Copiar datos de la cuenta     ]
+---------------------------------------
```

- Texto de F-17 (`ONLINE_PAYMENT_NOT_AVAILABLE`), igual para propietario y arrendatario. "Cómo pagar" pasa de enlace a botón `secondary` para que sea un objetivo táctil de 48 px.
- Los datos de la cuenta son los que configuró la administración (`admin-alta-comunidad.md`, paso 2). Las comunidades simuladas no tienen medios de pago: van entre llaves.
- "Copiar datos de la cuenta": texto del diseño (UX-69).

## APP-08 · Desglose con traspaso y pagos sin etiqueta

Escenario A: Luis Muñoz, Depto 102, el 08-12-2026, después del término de O-1 de CA-56 (registrado el 08-12-2026; ámbito `owner` en $425.000).

```text
| +-[borde rojo]----------------------
| | Tu deuda              <Vencida>
| | $425.000
| | Vencido desde 11-11-2026: $262.500
| | Por vencer el 11-12-2026: $162.500
| +-----------------------------------
| v Desglose de tu deuda
|   Octubre 2026
|     Gasto común            $250.000
|     Fondo de reserva        $12.500
|   Traspaso desde arriendo terminado
|   el 08-12-2026            $162.500
```

Escenario B: nuevo propietario del Depto 201, después de la venta del 15-11-2026 (CA-63). El ámbito `owner` quedó en $0.

```text
| +-[borde verde]---------------------
| | Tu deuda                <Al día>
| | Estás al día. Te avisaremos cuando
| | llegue tu próximo gasto común.
| +-----------------------------------
| v Pagos de esta unidad
|   Registrado por la administración
|   · $150.000 · 05-11-2026 ·
|   Transferencia
|   $112.500 · 08-11-2026 · Webpay
```

- Rótulo del traspaso: F-17, con la fecha de **registro** del término (H-27). Sin el nombre del ex arrendatario (S-44).
- El pago Webpay del propietario anterior va sin etiqueta (`payerKind` nulo; S-51, CA-63).
- Los montos por vencer y vencido los entrega la API: el traspaso conserva el vencimiento del 11-12-2026 (E-11).

## APP-09 · Pérdida de acceso

```text
+---------------------------------------
|        (icono lock, 48 px)
|
| Ya no tienes acceso a esta unidad. Si
| crees que es un error, contacta a tu
| administración.
|
| [[         Ver mis unidades        ]]   <- solo si le quedan otras
| [          Cerrar sesión           ]
+---------------------------------------
```

- Texto del flujo. Se muestra cuando la API responde 404 a toda la unidad (venta, fin de arriendo o revocación; S-14, CA-21, CA-56). La copia local de esa comunidad se borra en ese momento.
- "Ver mis unidades": texto del diseño (UX-69).

## APP-10 · Carga y sin conexión

```text
Primera carga (sin copia local)            Con copia local
+--------------------------------------    +--------------------------------------
| +- esqueleto -------------------          | Actualizando…
| | ~~~~~~~~~~                              | +-[borde rojo]-------------------
| | ~~~~~~~~~~~~~~~~                        | | Tu deuda          <Vencida>
| | ~~~~~~~~~~~~~~~~~~~~~~~~                | | $110.000
| +--------------------------------         | | Vencido desde 11-11-2026:
| [~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~]          | |   $110.000
+--------------------------------------    | +--------------------------------
                                           | [[    Pagar gasto común     ]]
                                           +--------------------------------------
```

- "Actualizando…": texto del flujo. Mientras actualiza, "Pagar gasto común" funciona, porque la API calcula el monto al iniciar y responde 409 `AMOUNT_CHANGED` si cambió.
- Sin conexión: GLB-04 de `comunes-estados-globales.md`.

## APP-11 · Selector de unidad

```text
+-- Encabezado -------------------------
| Edificio Los Aromos
| Depto 101  [ Cambiar unidad v ]
+---------------------------------------
        | toque
        v
+-- Hoja inferior ----------------------
| ¿Qué unidad quieres ver?
| (o) Edificio Los Aromos · Depto 101
| ( ) Edificio Los Aromos · Estac. 12
| [ Cerrar ]
+---------------------------------------
```

- Solo con varias unidades. Cada unidad tiene su Inicio y su propio pago: una transacción Webpay por unidad (**Supuesto (a validar)**, UX-13). "Estac. 12" es ilustrativo; la Comunidad A no tiene estacionamientos.
- El selector no muestra montos de otras unidades ni un total entre unidades.
