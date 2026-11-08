# Wireframes: pagos manuales, anulación e intentos Webpay (web)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujos: `../flujos/admin-pago-manual.md` y `../flujos/plataforma-soporte-webpay.md` ("Lo que ven el administrador y el comité"). Superficie: web de administración (1280 px). Componentes: `RadioGroup` sin valor por defecto, `MoneyField`, `DateField` con `maxToday`, `PreviewConfirm` y `Receipt` (design system).

Reglas que se ven en estas pantallas:

- Todo pago va a una deuda (ámbito). Con arrendatario vigente, "Aplicar a la deuda de" no tiene valor por defecto (F-9, CA-32).
- El pago se registra en el borrador vigente, con su fecha de pago real (A-4).
- Un pago no se edita ni se borra: se anula con un reverso, siempre el grupo completo (F-4).
- El residente ve todo pago manual como "Registrado por la administración" (F-17).

Criterios de aceptación: CA-5, CA-11, CA-12, CA-15, CA-24, CA-31, CA-32, CA-40, CA-41, CA-53, CA-56, CA-61 y CA-67.

## WEB-PAG-01 · Lista de pagos

Escenario: Comunidad A, el 04-12-2026, con el pago de CA-5 y el registro "Ambos" de CA-32.

```text
+-- Pagos ------------------------------------------------------------------------------------
| [ Pagos ]  Intentos Webpay (1)                                          [[ Registrar pago ]]
|
| Periodo: [ Todos v ]  Medio: [ Todos v ]  Deuda de: [ Todas v ]  Estado: [ Todos v ]
| Unidad: [ Buscar código ]
|
| Fecha de pago  Registrado    Unidad      Deuda de       Medio           Referencia           Monto      Estado
| 04-12-2026     04-12-2026    Depto 102   Propietario    Transferencia   Transferencia 4471   $100.000   <Registrado>  > Ver
| 04-12-2026     04-12-2026    Depto 102   Arrendatario   Transferencia   Transferencia 4471   $162.500   <Registrado>  > Ver
|                              (mismo pago: 2 deudas)
| 05-11-2026     05-11-2026    Depto 101   Propietario    Transferencia   Comprobante 1182     $100.000   <Registrado>  > Ver
+---------------------------------------------------------------------------------------------
```

- Una fila por pago (por deuda); los pagos del mismo grupo van juntos y marcados "mismo pago: 2 deudas" (texto del diseño, UX-69).
- Referencias: "Transferencia 4471" es la del ejemplo de la arquitectura §4; "Comprobante 1182" es ilustrativa.
- El comité ve la lista sin "Registrar pago"; la columna "Deuda de" le dice "Arrendatario", sin nombre (S-33).
- **Estado vacío:** "No hay pagos registrados en este periodo." con "Registrar pago" (solo administrador).

## WEB-PAG-02 · Registrar pago en una unidad sin arrendatario

Escenario: CA-31. Depto 202 debe $315.000 de `2026-10`. Ya existe una transferencia de $100.000 del 05-11-2026 con la referencia "transferencia"; se registra otra igual con fecha 06-11-2026.

```text
+-- Panel: Registrar pago -------------------------------------------------------------------
| Unidad (obligatorio)
| [ Depto 202                                    (buscar) ]
| Se aplicará a la deuda del propietario
| Lo verá el residente como "Registrado por la administración".
|
| Monto (obligatorio)            [ $ 100.000             ]
| Fecha de pago (obligatorio)    [ 06-11-2026 (calendario) ]
| Medio (obligatorio)            [ Transferencia       v ]
| Referencia (obligatorio)       [ transferencia                     ]
| Número de comprobante o de recibo. No incluyas datos personales
|
| {!} Ya existe un pago de $100.000 por transferencia con la referencia "transferencia"
|     (Depto 202, 05-11-2026). Revisa que no sea un duplicado
|
| {i} Se registrará en el periodo en borrador noviembre 2026 con fecha de pago 06-11-2026.
|
| ( Cancelar )                                                        [[ Registrar pago ]]
+---------------------------------------------------------------------------------------------
```

- Textos del flujo (pasos 3 a 6) y de F-3 (CA-31). La advertencia no bloquea.
- La otra advertencia de F-3: "Ya existe un pago de $262.500 para Depto 201 con fecha 09-11-2026 por transferencia. Revisa que no sea un duplicado" (CA-11).
- El medio va en minúscula dentro de los textos de F-3, como en CA-11 y CA-31.
- La clave de idempotencia se genera al abrir el panel (F-2). Un doble clic devuelve el mismo pago (CA-31).
- **Referencia vacía o de solo espacios:** 422 `PAYMENT_REFERENCE_REQUIRED`, "Ingresa la referencia del pago", bajo el campo (F-1, S-62, CA-67; texto aprobado por el líder el 2026-11-07; UX-62 cerrada). La API responde solo el primer error, en este orden: deuda, arriendo, monto, fecha y referencia. Sin referencia y con monto 0, el campo marcado es el monto.

## WEB-PAG-03 · Registrar pago en una unidad con arrendatario vigente

Escenario: CA-32, el 04-12-2026. Depto 102: deuda del propietario $262.500 (`2026-10`, vencida) y deuda del arrendatario Pedro Soto (O-1) $262.500 (`2026-11`, vence el 11-12-2026).

```text
+-- Panel: Registrar pago -------------------------------------------------------------------
| Unidad (obligatorio)
| [ Depto 102                                    (buscar) ]
|
| Aplicar a la deuda de (obligatorio)
| +---------------------------------------------------------------------
| | ( ) Propietario Luis Muñoz: deuda $262.500 · a favor $0
| +---------------------------------------------------------------------
| +---------------------------------------------------------------------
| | ( ) Arrendatario Pedro Soto: deuda $262.500 · a favor $0
| +---------------------------------------------------------------------
| +---------------------------------------------------------------------
| | (o) Ambos
| +---------------------------------------------------------------------
| Lo verán el propietario y el arrendatario como "Registrado por la administración".
|
| Para la deuda del propietario (obligatorio)     [ $ 100.000           ]
| Para la deuda del arrendatario (obligatorio)    [ $ 162.500           ]
| Total del pago: $262.500
| Compáralo con el comprobante bancario.
|
| Fecha de pago (obligatorio)    [ 04-12-2026 (calendario) ]
| Medio (obligatorio)            [ Transferencia       v ]
| Referencia (obligatorio)       [ Transferencia 4471                ]
|
| {i} Se registrará en el periodo en borrador diciembre 2026 con fecha de pago 04-12-2026.
|
| ( Cancelar )                                                        [[ Registrar pago ]]
+---------------------------------------------------------------------------------------------
```

- Textos de las opciones: flujo (paso 3). Deudas y saldos a favor de la API.
- "Total del pago" es la única suma de la interfaz: suma lo que escribió el administrador como control contra el comprobante bancario; no es un cálculo de deuda (design system 4.1). "Compáralo con el comprobante bancario.": texto del diseño (UX-69).
- Sin elegir deuda: "Elige a qué deuda aplicar el pago" bajo "Aplicar a la deuda de" (422 `SCOPE_REQUIRED`, CA-32); el formulario no envía.
- **Variantes de la lista de opciones:**
  - Unidad sin propietario registrado (F-15, CA-38): la opción se llama "Deuda de la unidad (propietario sin registrar)".
  - Arriendo programado (CA-53) o cancelado: no se ofrece; el pago va a la deuda del propietario.
  - Arriendo terminado: no se ofrece y aparece la ayuda "Los pagos de un arrendatario que ya no está se aplican a la deuda del propietario" (flujo, paso 3).
- **Deuda elegida en $0:** "Esta deuda no tiene saldo pendiente. El pago quedará como saldo a favor de {propietario o arrendatario}." (flujo). No bloquea.

## WEB-PAG-04 · Comprobante del registro

```text
+-- Pago registrado --------------------------------------------------------------------------
| {ok} Pago registrado · $262.500 · Depto 102 · 04-12-2026 · Transferencia 4471
|
| Deuda del propietario · $100.000
|   Ordinario octubre 2026 (vencido)          $100.000
|   Deuda resultante: $162.500 · A favor: $0
|
| Deuda del arrendatario · $162.500
|   Ordinario noviembre 2026                  $162.500
|   Deuda resultante: $100.000 · A favor: $0
|
| [ Registrar otro pago ]                                         [[ Ver estado de cuenta ]]
+---------------------------------------------------------------------------------------------
```

- Imputaciones que hizo la API, por deuda, periodo y cuenta (flujo, paso 8). Montos: CA-32 y GOLD-A32.

## WEB-PAG-05 · Detalle de un pago y anulación

```text
+-- Pago · Depto 102 · 04-12-2026 · <Registrado> ---------------------------------------------
| Medio: Transferencia · Referencia: Transferencia 4471 · Registrado por Carolina Lagos
| Este pago se aplicó a dos deudas.
|   Deuda del propietario     $100.000
|   Deuda del arrendatario    $162.500
|                                                                     [! Anular pago !]
+---------------------------------------------------------------------------------------------

+-- Panel: Anular pago ----------------------------------------------------------------------
| Este pago se aplicó a dos deudas. Se anulará completo
|
| Motivo (obligatorio)
| [ Monto erróneo                                                v ]   <- lista (UX-17)
| No incluyas datos personales
|
| Vista previa de la anulación
| Reverso de $262.500 en el periodo en borrador diciembre 2026
|
| Deuda de      Reverso     Vuelve a quedar pendiente              Deuda resultante  A favor
| Propietario   $100.000    Ordinario octubre 2026 $100.000        $262.500          $0
| Arrendatario  $162.500    Ordinario noviembre 2026 $162.500      $262.500          $0
|
| ( Cancelar )                                                         [! Anular pago !]
+---------------------------------------------------------------------------------------------
```

- La anulación es sobre el grupo (`payment_group_id`), también después de 30 días (F-4, CA-32).
- Confirmación: "Se registrará un reverso de $262.500 en el periodo en borrador diciembre 2026. El pago original no se borra." (flujo, paso 4).
- Resultado: chip "Anulado", enlace al reverso y las imputaciones nuevas. Pago y reverso siguen en el estado de cuenta.
- Con el flag activo, la vista previa agrega "Ajustes de intereses" (E-10).

**409 por cambios en la cuenta** (CA-40, Depto 202): otra persona registró $15.000 en efectivo entre la vista previa y la confirmación.

```text
| {!} La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes
|     de anular
| | Deuda de      Reverso     Se reimputan                     Deuda resultante  <Cambió>
| | Propietario   $315.000    $100.000 + $15.000 a octubre     $200.000
```

- Montos: CA-40 (deuda resultante $200.000 en lugar de $215.000).
- **Ya anulado** (409 `PAYMENT_ALREADY_VOIDED`): banner `warning` "El pago ya fue anulado" y el detalle se recarga con el chip "Anulado" (CA-40).

## WEB-PAG-06 · Detalle de un pago Webpay

```text
+-- Pago · Depto 101 · 26-11-2026 · <Registrado> ---------------------------------------------
| Medio: Webpay · Número de orden OC-2026-0002 · Registrado por Soporte ComVive
| Deuda del propietario     $11.000
|
| Este pago no se puede anular desde ComVive
+---------------------------------------------------------------------------------------------
```

- Escenario: CA-41 (`register_authorized`, `paid_on` 25-11-2026). En lugar del botón, el texto de `PAYMENT_NOT_VOIDABLE` (flujo).

## WEB-PAG-07 · Intentos Webpay (lectura)

Escenario: el 07-12-2026, con los intentos de CON-02 (`consola-plataforma.md`).

```text
+-- Pagos · Intentos Webpay ------------------------------------------------------------------
| {i} Estos pagos los resuelve Soporte ComVive en un plazo de hasta 5 días hábiles. Si un
|     residente pregunta, dale el número de orden.
|
| Estado: [ En revisión y para reverso v ]   Número de orden: [ OC-______ ] [ Buscar ]
|
| N.º de orden  Unidad     Deuda                   Iniciado   Autorizado  Estado         Plazo                Resolución
| OC-2026-0002  Depto 101  Propietario Ana Pérez   $110.000   $11.000     <En revisión>  <Plazo vencido>      —
| OC-2026-0003  Depto 102  Arrendatario Pedro Soto $262.500   $200.000    <En revisión>  Vence el 14-12-2026  —
+---------------------------------------------------------------------------------------------
```

- Solo lectura: no hay botones de resolución ni ruta para resolver; una llamada a `/platform/...` responde 404 (CA-41).
- El comité ve "Propietario" o "Arrendatario", sin nombre (S-33). Cada lectura del comité queda en auditoría.
- Estados (design system 5.6): "En revisión", "Para reverso", "Registrado", "Reversado" y "Plazo vencido". Un intento resuelto con `resolve_without_charge` (`rejected`, CA-65) se muestra con el chip "Sin cobro" (neutral; texto del diseño, UX-61) y la resolución de Soporte ComVive; se ve con el filtro "Resueltos". La columna Resolución dice el actor, "Soporte ComVive", y la fecha.
- **Estado vacío:** "No hay pagos en línea en revisión en esta comunidad."

## Errores

Textos de la spec, tal cual.

| Caso | Código | Texto | Comportamiento |
| --- | --- | --- | --- |
| Monto vacío, 0 o con decimales | 422 `INVALID_AMOUNT` | "El monto debe ser un número entero de pesos mayor que $0" | Bajo el campo |
| Sobre el máximo | 422 `AMOUNT_TOO_LARGE` | "El monto supera el máximo permitido de $9.999.999.999" | Bajo el campo |
| Fecha futura | 422 `PAID_ON_IN_FUTURE` | "La fecha de pago no puede ser futura" | Bajo el campo (CA-15) |
| Referencia vacía o de solo espacios | 422 `PAYMENT_REFERENCE_REQUIRED` | "Ingresa la referencia del pago" | Bajo el campo (CA-67) |
| Sin deuda elegida | 422 `SCOPE_REQUIRED` | "Elige a qué deuda aplicar el pago" | Bajo "Aplicar a la deuda de" |
| Arriendo terminado mientras el panel estaba abierto | 409 `OCCUPANCY_ALREADY_ENDED` | "El arriendo de esta persona ya terminó. Aplica el pago a la deuda del propietario" | Banner y recarga de opciones (CA-56) |
| Arriendo programado | 409 `OCCUPANCY_NOT_STARTED` | "El arriendo aún no comienza. Aplica el pago a la deuda del propietario" | Banner y recarga (CA-53) |
| Arriendo cancelado | 409 `OCCUPANCY_CANCELLED` | "Este arriendo fue cancelado y nunca comenzó. Aplica el pago a la deuda del propietario" | Banner y recarga (CA-61) |
| La misma deuda dos veces | 422 `DUPLICATE_SCOPE` | "Cada deuda puede aparecer una sola vez en el pago" | Banner; no debería ocurrir desde el formulario |
| Unidad no encontrada | — | "No hay unidades con ese código en esta comunidad" | Bajo el buscador |
| Anular sin motivo | 422 `REASON_REQUIRED` | "Indica el motivo de la anulación" | Bajo el campo |
| Cuenta cambiada | 409 `PREVIEW_OUTDATED` | "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de anular" | WEB-PAG-05 |
| Ya anulado | 409 `PAYMENT_ALREADY_VOIDED` | "El pago ya fue anulado" | WEB-PAG-05 |
| Pago no manual | 422 `PAYMENT_NOT_VOIDABLE` | "Este pago no se puede anular desde ComVive" | WEB-PAG-06 |
| Misma clave con otros datos | 422 `IDEMPOTENCY_KEY_REUSED` | GLB-08 | Pide reabrir el formulario |
| Corte de conexión | — | "No se pudo confirmar el registro. Revisando…" | GLB-07; conserva los datos del formulario |
| Comité | 403 `FORBIDDEN` | GLB-03 | Los botones no se muestran |

**Carga:** resultados del buscador al escribir; esqueleto en las opciones de "Aplicar a la deuda de" y en la vista previa de la anulación; botones con indicador y bloqueo del doble envío.
