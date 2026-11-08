# Wireframes: Pagos, Cobros y Más (app residente)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujos: `../flujos/residente-estado-de-cuenta-y-pago.md` ("Historial de pagos", "Cobros") y `../flujos/residente-primer-ingreso.md` ("Ejercer mis derechos"). Superficie: app residente (360 px). Componentes: `MovementList` y `PayerLabel` (design system 5.5 y 5.7).

Reglas que se ven en estas pantallas:

- Cada pago lleva la etiqueta de quién pagó según `payerKind`, con los textos de F-17. Con `payerKind` nulo no hay etiqueta (S-51).
- Formato de cada línea: "{etiqueta} · ${monto} · {dd-mm-aaaa} · {medio}" (design system 5.7).
- El arrendatario ve solo los pagos de su ámbito. Los que no inició él no abren el comprobante completo (404 en la API).
- El aviso legal en PDF es solo del propietario y lleva el RUT enmascarado (G-2, S-30). El arrendatario ve la vista de su cobro (G-7).

Criterios de aceptación: CA-26, CA-29, CA-32, CA-46, CA-47, CA-49, CA-60 y CA-63.

## APP-HIS-01 · Historial de pagos del propietario

Escenario: Luis Muñoz, Depto 102, el 05-01-2027, después de CA-26 (el arrendatario pagó $262.500 por Webpay el 20-12-2026) y de CA-29 (el propietario pagó "Ambas" el 05-01-2027).

```text
+-- Encabezado -------------------------
| Pagos · Depto 102
+---------------------------------------
| [ Todas ] [ Tu deuda ] [ Deuda del
|   arrendatario ]                       <- filtros, chips
|
| Enero 2027
| +-----------------------------------
| | Pago                     $530.004
| | Pagado por ti · 05-01-2027 ·
| | Webpay                          >
| | Tu deuda $266.814 · Deuda del
| | arrendatario $263.190
| +-----------------------------------
|
| Diciembre 2026
| +-----------------------------------
| | Deuda del arrendatario   $262.500
| | Pagado por el arrendatario ·
| | 20-12-2026 · Webpay
| +-----------------------------------
+---------------------------------------
| Inicio   Pagos   Cobros   Más
+---------------------------------------
```

- El pago de dos deudas se muestra como un solo cobro, con el detalle por deuda (F-12; flujo, "Historial de pagos"). Abre el comprobante de APP-PAG-07.
- La fila del arrendatario no tiene `>`: el propietario no ve el detalle del intento del arrendatario (404, CA-60).
- Montos y fechas: CA-26 (pago del arrendatario con `paid_on` 20-12-2026) y CA-29.

## APP-HIS-02 · Historial de pagos del arrendatario

Escenario: Pedro Soto (O-1), mismo momento que APP-HIS-01.

```text
+-- Encabezado -------------------------
| Pagos · Depto 102
+---------------------------------------
| Enero 2027
| +-----------------------------------
| | Pago                     $263.190
| | Pagado por el propietario ·
| | 05-01-2027 · Webpay
| +-----------------------------------
|
| Diciembre 2026
| +-----------------------------------
| | Pago                     $262.500
| | Pagado por ti · 20-12-2026 ·
| | Webpay                          >
| +-----------------------------------
+---------------------------------------
```

- No ve el pago de $266.814 del ámbito `owner`, ni el total de $530.004, ni el número de orden del pago del propietario (CA-29). La fila no abre nada.
- Otra fila posible, de CA-32: "Registrado por la administración · $162.500 · 04-12-2026 · Transferencia". Tampoco abre el comprobante completo.

## APP-HIS-03 · Estados de intentos propios en el historial

```text
| Noviembre 2026
| +-----------------------------------
| | Pago                     $110.000
| | <En revisión por ComVive>
| | 25-11-2026 · Número de orden
| | OC-2026-0002                    >
| +-----------------------------------
| +-----------------------------------
| | Pago                     $110.000
| | Tu pago fue anulado en Transbank.
| | El reembolso a tu medio de pago
| | depende de tu banco
| | 25-11-2026                      >
| +-----------------------------------
```

- Estados posibles de un intento propio que no terminó en pago (flujo, "Historial de pagos"): "En proceso", "En revisión por ComVive", el texto de `reversal_pending` que corresponda a `reversalKind`, el de `reversed`, y los de los intentos cerrados sin pago, con el mismo texto que en Inicio y en el resultado (M-6, rev. 4):
  - `rejected` con `rejectionKind = transbank_rejected`: "Tu banco rechazó el pago. No se hizo ningún cargo".
  - `rejected` con `rejectionKind = resolved_without_charge` (Soporte lo resolvió sin cobro, desde "En revisión" o, con D13, desde "Para reverso"): "Tu pago no se completó. No se hizo ningún cargo" (F-17, S-59, CA-65).
  - `abandoned`: "Pago cancelado. No se hizo ningún cargo" (texto del diseño, UX-69 aprobado, D15).
  - No hay etiquetas cortas aparte ("Rechazado", "Cancelado").
- Las dos filas son alternativas del mismo intento de CA-41 y CA-55; en la app se ve una sola, con el estado vigente.
- El monto de la fila es el monto iniciado.

**Estado vacío:** "Aquí verás tus pagos." (flujo).

## APP-COB-01 · Cobros del propietario

Escenario: Ana Pérez, Depto 101, el 02-12-2026.

```text
+-- Encabezado -------------------------
| Cobros · Depto 101
+---------------------------------------
| +-----------------------------------
| | Resumen de gastos de la comunidad >
| +-----------------------------------
|
| Avisos de cobro
| +-----------------------------------
| | Noviembre 2026
| | Emitido el 01-12-2026 · Vence el
| | 11-12-2026
| | [ Ver aviso (PDF) ] [ Compartir ]
| +-----------------------------------
| +-----------------------------------
| | Octubre 2026
| | Emitido el 01-11-2026 · Vence el
| | 11-11-2026
| | [ Ver aviso (PDF) ] [ Compartir ]
| +-----------------------------------
+---------------------------------------
```

- El PDF es el mismo archivo para el propietario, el administrador y el comité, con el RUT `12.345.***-*` (CA-46). En pantalla, Ana ve su RUT completo en Más > Mi perfil.
- "Compartir" usa la hoja de compartir del sistema.
- Estado vacío: "Tu comunidad todavía no emite gastos comunes en ComVive." (flujo).

## APP-COB-02 · Vista del cobro del arrendatario

Escenario: CA-47. Pedro Soto (O-1) abre el cobro de `2026-11`.

```text
+---------------------------------------
| < Cobros     Cobro de noviembre 2026
|
| Edificio Los Aromos · Depto 102
| Emitido el 01-12-2026
| Vence el 11-12-2026
| Alícuota de la unidad: 25,0000 %
|
| Tus cargos de noviembre 2026
|   Gasto común              $250.000
|   Fondo de reserva          $12.500
| Saldo anterior                   $0
| Pagos recibidos                  $0
| Total a pagar              $262.500
| Cuotas impagas                    0
|
| Comunidad
|   > Resumen de gastos
|   Saldo del fondo de reserva:
|     ${monto}
|   Saldo de caja al {dd-mm-aaaa}:
|     ${monto}
|
| [ Descargar comprobante de cobro ]
| Comprobante de cobro (no es el aviso
| de cobro legal)
+---------------------------------------
```

- Contenido y orden de G-7 y del flujo ("Cobros"). Montos: CA-47. El saldo del fondo y el saldo de caja no los fija CA-47: van entre llaves.
- No muestra nombre ni RUT del propietario, deuda del ámbito `owner`, total de la unidad ni número correlativo del aviso (G-7, CA-47).
- Alícuota con cuatro decimales (design system 4.4); CA-47 la escribe "25,00 %". Es el mismo dato.
- Si pide el aviso legal del Depto 102 por enlace, ve GLB-02 (404).
- Con saldo a favor (CA-49): "Total a pagar $0" y la línea "Saldo a favor $37.500" (texto del glosario de interfaz).

## APP-COB-03 · Resumen de gastos de la comunidad

Escenario: CA-47, periodo `2026-11` de la Comunidad A, con los gastos de CA-1. Lo ven el propietario y el arrendatario.

```text
+---------------------------------------
| < Cobros     Resumen de gastos
|              noviembre 2026
|
| Administración             $650.000
|   Remuneraciones del
|   personal                 $650.000
| Uso o consumo              $180.000
|   Electricidad áreas
|   comunes                  $180.000
| Mantención                 $170.000
|   Mantención ascensor      $120.000
|   Aseo y artículos          $50.000
| ---------------------------------
| Gastos ordinarios        $1.000.000
| Fondo de reserva            $50.000
|
| Egresos del fondo de reserva
|   (sin egresos este mes)
| Saldo del fondo de reserva: ${monto}
| Ingresos del mes: ${monto}
| Egresos del mes: ${monto}
| Saldo de caja al {dd-mm-aaaa}: ${monto}
+---------------------------------------
```

- La línea "Remuneraciones del personal" agrupa remuneraciones, honorarios del personal y leyes sociales; nunca se ve "Remuneración conserje" (G-8, CA-47). Los honorarios del administrador irían en su propia línea, "Honorarios de administración".
- Los totales por subcategoría ($650.000, $180.000 y $170.000) los entrega la API.
- No contiene deudas por unidad, nombres ni listas de morosos (G-8).
- Con un saldo negativo, el signo va antes del peso: "Saldo del fondo de reserva: −$12.500" (CA-62, design system 4.1).

## APP-MAS-01 · Más

```text
+---------------------------------------
| Más
| > Mi perfil y contacto
| > Mis unidades y comunidades
| > Cómo pagar
| > Privacidad
| > Notificaciones
|
| [          Cerrar sesión           ]
| Al cerrar sesión borramos los datos
| guardados en este celular.
+---------------------------------------
```

- Encomiendas, Reservas y Visitas son **Posterior** y no aparecen.
- La nota bajo "Cerrar sesión" es texto del diseño (UX-69); el comportamiento es de la arquitectura §5.

## APP-MAS-02 · Mi perfil y contacto

```text
+---------------------------------------
| < Más        Mi perfil y contacto
|
| Nombre          Ana Pérez
| RUT             12.345.678-5
| Contacto de     +56 9 **** 1234
| ingreso
|
| Si algún dato está mal, pide a tu
| administración que lo corrija.
+---------------------------------------
```

- Solo lectura: lo corrige la administración (IA). RUT completo porque es el titular (CA-46).
- Texto de la nota: diseño (UX-69).

## APP-MAS-03 · Privacidad y "Ejercer mis derechos"

```text
+---------------------------------------
| < Privacidad   Ejercer mis derechos
|
| Puedes pedir acceso, rectificación,
| supresión, oposición o portabilidad
| de tus datos.
|
| Derecho (obligatorio)
| [ Acceso a mis datos            v ]
|
| Comunidad (obligatorio)
| [ Edificio Los Aromos           v ]
|
| Detalle
| [                                 ]
| [                                 ]
| No incluyas datos de otras personas.
|
| [[        Enviar solicitud        ]]
+---------------------------------------
```

- Formulario del flujo `residente-primer-ingreso.md`. La solicitud llega a la administración de la comunidad. El canal y el plazo de respuesta los fija el abogado (UX-31).
- Resultado: "Enviamos tu solicitud a la administración de Edificio Los Aromos." (texto del diseño, UX-69).

## APP-MAS-04 · Notificaciones

```text
+---------------------------------------
| < Más        Notificaciones
|
| Avisos en este celular       [ on ]
| Te avisaremos cuando llegue tu gasto
| común y cuando se confirme un pago.
| Los avisos no muestran montos en la
| pantalla bloqueada.
+---------------------------------------
```

- Texto del flujo (paso 9). WhatsApp: **Posterior**.
