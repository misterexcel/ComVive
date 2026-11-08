# Wireframes: periodos, borrador vigente, emisión y cierre (web)

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/admin-emitir-cerrar-periodo.md`. Superficie: web de administración (1280 px). Marco: `comunes-estados-globales.md`. Componentes: `DataTable`, `MoneyField`, `SignedMoneyField`, `PreviewConfirm` y `ConfirmDialog` (design system 5.2, 5.4, 5.10 y 5.16).

Escenario base: Comunidad A, Edificio Los Aromos, borrador `2026-10` con los gastos de CA-1, emitido el 01-11-2026. La pantalla no calcula montos: cargos, totales y sumas de columnas vienen de la API (`issue-preview`).

Criterios de aceptación: CA-1, CA-17, CA-19, CA-20, CA-24, CA-25, CA-38, CA-39, CA-45, CA-46, CA-48, CA-58 y CA-62.

## WEB-PER-01 · Periodos

```text
+-- Gasto común · Periodos -------------------------------------------------------------------
|
| Periodo          Estado        Emitido el    Vence el      Total emitido   Avisos
| Noviembre 2026   <Borrador>    —             —             —               —           > Abrir
| Octubre 2026     <Emitido>     01-11-2026    11-11-2026    $1.050.000      4 listos    > Abrir
+---------------------------------------------------------------------------------------------
```

- El borrador vigente va siempre arriba. No hay botón para crear periodos (A-2).
- Estados con chip, ícono y texto: Borrador (neutral), Emitido (info), Cerrado (success).
- Estado vacío del comité: "Todavía no hay periodos emitidos para revisar."

## WEB-PER-02 · Borrador vigente: gastos

```text
+-- Octubre 2026 · <Borrador> ----------------------------------------------------------------
| [ Gastos (4) ]  Cargos directos (0)  Egresos del fondo (0)  Ajustes recibidos (0)
|
|                                                    [ Agregar gasto ]  [[ Preparar emisión ]]
| Concepto                     Cuenta      Subcategoría    Base        Monto     Respaldo
| Remuneración conserje        Ordinario   Administración  Alícuota    $650.000  factura.pdf  > Editar > Eliminar
| Electricidad áreas comunes   Ordinario   Uso o consumo   Alícuota    $180.000  —            > Editar > Eliminar
| Mantención ascensor          Ordinario   Mantención      Alícuota    $120.000  —            > Editar > Eliminar
| Aseo y artículos             Ordinario   Mantención      Alícuota     $50.000  —            > Editar > Eliminar
| Total                                                              $1.000.000
+---------------------------------------------------------------------------------------------
```

- Montos alineados a la derecha con cifras tabulares. La fila Total la entrega la API.
- "Remuneración conserje" se ve así en la web del administrador y del comité, que ven el detalle completo; los residentes ven "Remuneraciones del personal" (G-8).
- Acciones de fila con nombre accesible ("Editar: Electricidad áreas comunes").
- El comité ve la misma tabla sin "Agregar gasto", "Preparar emisión", "Editar" ni "Eliminar".
- **Estado vacío:** "Aún no hay gastos en este periodo." con "Agregar gasto" (solo administrador).

**Escritura sobre un periodo que otra persona emitió** (pestaña antigua):

```text
| {x} El periodo 2026-10 está emitido. Registra el movimiento en el borrador vigente
|     > Ir al borrador vigente
```

- 409 `PERIOD_NOT_EDITABLE`, texto de la spec con `<AAAA-MM>` como código (UX-59). La pantalla recarga el periodo en modo lectura.

## WEB-PER-03 · Agregar gasto (panel lateral)

```text
+-- Panel: Agregar gasto -----------------------------------
| Cuenta (obligatorio)
| (o) Ordinario   ( ) Extraordinario
|
| Subcategoría (obligatorio)
| [ Uso o consumo                                     v ]
|
| Base de reparto (obligatorio)
| (o) Alícuota   ( ) Partes iguales
|
| Monto (obligatorio)
| [ $ 180.000                                          ]
|
| Concepto (obligatorio)
| [ Electricidad áreas comunes                         ]
| Aparece en el resumen que ven los residentes. No
| incluyas nombres de personas
|
| Respaldo
| [ Adjuntar archivo ]
|
| ( Cancelar )                          [[ Guardar gasto ]]
+-----------------------------------------------------------
```

- Con "Partes iguales" aparece la lista de unidades con casillas (`[x] Casa 1  [x] Casa 2  [x] Casa 3`, CA-2).
- Con "Extraordinario" desaparece la subcategoría (B-2).
- Las remuneraciones se agrupan solas en el resumen para residentes (flujo, paso 2).

**Errores en el campo Monto** (spec, tal cual):

| Caso | Código | Texto |
| --- | --- | --- |
| Vacío, 0 o con decimales | 422 `INVALID_AMOUNT` | "El monto debe ser un número entero de pesos mayor que $0" |
| Sobre el máximo | 422 `AMOUNT_TOO_LARGE` | "El monto supera el máximo permitido de $9.999.999.999" |
| La suma del periodo superaría el máximo | 422 `AMOUNT_TOO_LARGE` | "La suma de los gastos del periodo superaría el máximo permitido de $9.999.999.999" |

- El campo no acepta coma, punto decimal ni signo (design system 5.2): el caso "con decimales" solo llega si alguien llama a la API directamente.
- El de la suma va como banner arriba del formulario, porque no es del campo (B-6, S-55).

## WEB-PER-04 · Cargos directos

Escenario: CA-17, consumo de agua por remarcador.

```text
+-- Octubre 2026 · <Borrador> ----------------------------------------------------------------
|  Gastos (4)  [ Cargos directos (4) ]  Egresos del fondo (0)  Ajustes recibidos (0)
|                                                                     [ Agregar cargo directo ]
| Unidad      Tipo                  Cuenta      Concepto o motivo            Monto
| Depto 101   Consumo individual    Ordinario   Agua octubre (remarcador)    $24.000   > Editar > Eliminar
| Depto 102   Consumo individual    Ordinario   Agua octubre (remarcador)    $36.000   > Editar > Eliminar
| Depto 201   Consumo individual    Ordinario   Agua octubre (remarcador)    $30.000   > Editar > Eliminar
| Depto 202   Consumo individual    Ordinario   Agua octubre (remarcador)    $30.000   > Editar > Eliminar
| Total                                                                   $120.000
+---------------------------------------------------------------------------------------------

+-- Panel: Agregar cargo directo ---------------------------
| Unidad (obligatorio)
| [ Depto 101                                     (buscar) ]
| Tipo (obligatorio)
| ( ) Consumo individual  ( ) Multa  ( ) Otro
|
| (con Multa)
| Motivo y referencia (obligatorio)
| [ Art. 12 del reglamento: ruidos molestos             ]
| El motivo aparece en el aviso. No incluyas datos
| personales
|
| (con Otro)
| Cuenta (obligatorio)
| ( ) Ordinario  ( ) Extraordinario
|
| Monto (obligatorio)
| [ $                                                  ]
| ( Cancelar )                    [[ Guardar cargo ]]
+-----------------------------------------------------------
```

- Los cargos directos no generan recargo de fondo (D-3, CA-17); la vista previa no les suma fondo.
- Ayuda de la multa: texto del flujo (paso 3). El ejemplo del motivo es ilustrativo.
- **Estado vacío:** "No hay multas ni consumos este mes."

## WEB-PER-05 · Egresos del fondo de reserva

Escenario: CA-62, borrador `2026-11`, saldo del fondo registrado $37.500.

```text
+-- Panel: Agregar egreso del fondo ------------------------
| Concepto (obligatorio)
| [ Cambio de cerradura portón                          ]
|
| Monto (obligatorio)
| [ $ 20.000                                            ]
|
| Autorización (obligatorio)
| [ Acta comité 24-11-2026                              ]
| Acuerdo del comité o de la asamblea, con su fecha. No
| incluyas datos personales
|
| {!} Con este egreso, el saldo del fondo de reserva
|     registrado en ComVive queda en −$12.500. Revisa el
|     monto; si el fondo tenía saldo antes de usar
|     ComVive, ese saldo aún no está cargado
|
| ( Cancelar )                    [[ Guardar egreso ]]
+-----------------------------------------------------------
```

- Sin autorización: 422 `AUTHORIZATION_REFERENCE_REQUIRED`, "Indica quién autorizó el uso del fondo de reserva: acuerdo del comité o de la asamblea, con su fecha", bajo el campo Autorización.
- La advertencia del saldo negativo no bloquea (S-50). La devuelve la API al guardar; la pantalla la muestra en el banner de resultado y en la tabla de egresos. Montos: GOLD-A62-02 ($7.500 − $20.000 = −$12.500).
- **Supuesto (a validar)**: para mostrarla antes de guardar, el formulario necesitaría una consulta previa a la API; la spec solo dice "en el formulario del egreso". Se muestra después de guardar, junto al egreso registrado (UX-70).

```text
+-- Noviembre 2026 · <Borrador> ... [ Egresos del fondo (2) ] ------------------------------
| Concepto                     Autorización             Monto
| Reparación bomba de agua     Acta comité 18-11-2026   $30.000   > Editar > Eliminar
| Cambio de cerradura portón   Acta comité 24-11-2026   $20.000   > Editar > Eliminar
| Saldo del fondo de reserva registrado en ComVive: −$12.500
+---------------------------------------------------------------------------------------------
```

- El saldo del fondo lo entrega la API (D-5); la pantalla no resta los egresos.

## WEB-PER-06 · Ajustes recibidos (lectura)

```text
+-- Noviembre 2026 · <Borrador> ... [ Ajustes recibidos (8) ] -------------------------------
| Origen                                   Unidad      Deuda de      Cuenta       Monto
| Ajuste periodo 2026-10: No correspondía  Depto 101   Propietario   Ordinario    −$10.000
| a la comunidad                           Depto 101   Propietario   Fondo           −$500
|                                          Depto 102   Propietario   Ordinario    −$12.500
|                                          ...
| > Ver la corrección del gasto "Aseo y artículos"
+---------------------------------------------------------------------------------------------
```

- Escenario: CA-33 (anulación de "Aseo y artículos" registrada en el borrador `2026-11`). Rótulo de H-4: "Ajuste periodo AAAA-MM: motivo".
- **Estado vacío:** "No hay ajustes de periodos anteriores."

## WEB-PER-07 · Preparar emisión: saldo de caja

Escenario: CA-58, el 01-11-2026.

```text
+-- Emitir periodo octubre 2026 · Paso 1 de 2 -----------------------------------------------
| Saldo de caja de la comunidad (obligatorio)
| Saldo de la cuenta bancaria de la comunidad a la fecha de corte. Aparece en el aviso.
|
| (o) Saldo positivo   ( ) Saldo negativo (sobregiro)
| [ $ 350.000                    ]        <- con "Saldo negativo", se envía −350000
|
| Fecha de corte (obligatorio)
| [ 31-10-2026  (calendario) ]
|
| ( Volver al borrador )                                          [ Ver vista previa ]
+---------------------------------------------------------------------------------------------
```

- `SignedMoneyField`: acepta $0. La fecha propone el último día del mes del periodo y no permite elegir días posteriores a hoy (G-4).
- La ayuda bajo el título es texto del diseño (UX-69).

| Caso | Código | Texto (spec) | Dónde |
| --- | --- | --- | --- |
| Sin monto o sin fecha | 422 `CASH_BALANCE_REQUIRED` | "Ingresa el saldo de caja y su fecha de corte. Puede ser $0" | Bajo el campo vacío |
| Valor absoluto sobre el máximo | 422 `AMOUNT_TOO_LARGE` | "El monto supera el máximo permitido de $9.999.999.999" | Bajo el monto |
| Fecha de corte futura | 422 `CASH_BALANCE_DATE_IN_FUTURE` | "La fecha de corte no puede ser futura" | Bajo la fecha |

## WEB-PER-08 · Vista previa de emisión

Escenario: CA-1 con el saldo de caja de CA-58 (−$350.000 al 31-10-2026). Versión v1.

```text
+-- Emitir periodo octubre 2026 · Paso 2 de 2 -----------------------------------------------
| Fecha de emisión 01-11-2026 · Vencimiento 11-11-2026 · Saldo de caja al 31-10-2026: −$350.000
|                                                                      > Cambiar saldo de caja
| Advertencias
| (ninguna)
|
| Cargos del periodo
| Unidad      Deuda de      Ordinario   Fondo de   Extra-     Intereses   Multas   Total
|                                       reserva    ordinario
| Depto 101   Propietario   $200.000    $10.000    $0         $0          $0       $210.000
| Depto 102   Propietario   $250.000    $12.500    $0         $0          $0       $262.500
| Depto 201   Propietario   $250.000    $12.500    $0         $0          $0       $262.500
| Depto 202   Propietario   $300.000    $15.000    $0         $0          $0       $315.000
| Total emitido             $1.000.000  $50.000    $0         $0          $0     $1.050.000
|
| +-- No forma parte del total emitido ------------------------------------------------------
| | Ajustes recibidos y saldos anteriores que aparecerán en cada aviso
| | No hay ajustes ni saldos anteriores.
| +------------------------------------------------------------------------------------------
|
| ( Volver al borrador )                                                  [[ Continuar ]]
+---------------------------------------------------------------------------------------------
```

- Montos: CA-1 y GOLD-A-01 a 04. "Total emitido" es Σ cargos del periodo, tal como lo entrega la API; nunca incluye ajustes ni saldos anteriores.
- "Deuda de" dice "Arrendatario" en las unidades con arrendatario vigente a la fecha de emisión (F-9); por ejemplo, con O-6 en el Depto 102 (CA-45).
- Las unidades con $0 aparecen con $0 (C-5, CA-18).
- El texto del bloque aparte y "No hay ajustes ni saldos anteriores." son del diseño (UX-69).

**Con bloqueos** (no se puede continuar; cada bloqueo enlaza a donde se corrige):

```text
| Bloqueos
| {x} Las alícuotas suman 99,9900 %; deben sumar 100,0000 %          > Ir a Unidades
| {x} El grupo ordinario / partes iguales no tiene unidades con participación para
|     repartir $95.238                                                > Ir al gasto
|
|                                                          [[ Continuar ]]  <- desactivado
| Corrige los bloqueos para poder emitir.
```

- Textos de A-3.1 (CA-19, Comunidad C) y A-3.2. El segundo ejemplo es ilustrativo (Comunidad B con un conjunto vacío). `<cuenta> / <base>` se muestra con los nombres de cuenta y base de la web.
- Otros bloqueos: "La comunidad no tiene unidades. Crea las unidades antes de emitir" (`COMMUNITY_WITHOUT_UNITS`) y "La suma de los gastos del periodo superaría el máximo permitido de $9.999.999.999" (`AMOUNT_TOO_LARGE`).
- "Corrige los bloqueos para poder emitir.": texto del diseño (UX-69).

**Con advertencias** (se puede continuar):

```text
| Advertencias
| {!} El periodo no tiene gastos. Se emitirán avisos sin cargos de gastos del periodo
| {!} Unidades sin propietario registrado: Depto 102. Su aviso se emitirá a nombre de
|     'Propietario sin registrar'                                     > Ir a Ocupantes
| {!} Falta la tasa de referencia CMF desde 01-12-2026. Se emitirá sin intereses y se
|     cobrarán en la próxima emisión                       <- solo con el flag activo
| {!} 2 unidades no recibirán la notificación del aviso. Revisa sus contactos
|                                                          <- depende de UX-28
```

- Textos de CA-20, F-15 (CA-38) y E-7. La fecha de la tasa CMF es ilustrativa.
- La última advertencia es del flujo y depende de que `issue-preview` la entregue (UX-28, pregunta abierta al arquitecto). En singular: "1 unidad no recibirá la notificación del aviso. Revisa sus contactos" (texto del diseño, UX-69).

## WEB-PER-09 · Confirmación de la emisión

```text
+-- Diálogo: Emitir periodo ----------------------------------------------------
| Vas a emitir el periodo octubre 2026: 4 avisos, total emitido $1.050.000,
| vencimiento 11-11-2026. Después no podrás editar sus gastos. Se creará el
| borrador de noviembre 2026 y se notificará a los residentes.
|
| ( Cancelar )                                           [[ Emitir periodo ]]
+-------------------------------------------------------------------------------
```

- Texto del flujo (paso 3) con los datos de CA-1. La clave de idempotencia se genera al abrir el diálogo; el envío lleva el `previewHash` de v1.
- Doble clic: el botón pasa a "Emitiendo…" al primer clic y una repetición con la misma clave devuelve el mismo resultado (CA-25).

**Durante la emisión** (bloqueante):

```text
+-------------------------------------------------------------------------------
|                         (indicador de progreso)
|              Emitiendo periodo… no cierres esta ventana
+-------------------------------------------------------------------------------
```

**Respuestas:**

| Respuesta | Pantalla |
| --- | --- |
| 409 `PREVIEW_OUTDATED` | GLB-06 con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir" y las filas marcadas "Cambió" (CA-39, CA-58) |
| 409 `PERIOD_ALREADY_ISSUED` | Banner `warning` "El periodo ya fue emitido" y recarga el periodo, ya Emitido (CA-25) |
| 422 `IDEMPOTENCY_KEY_REUSED` | GLB-08; cierra la confirmación y pide una vista previa nueva |
| Falla en la emisión | Banner `danger` "No se pudo emitir. No se creó ningún cargo. Intenta de nuevo." y el periodo sigue en Borrador |
| Corte de conexión | GLB-07, "Revisando si el periodo quedó emitido…" |
| 403 `FORBIDDEN` (comité) | GLB-03 |

## WEB-PER-10 · Periodo emitido: avisos y notificaciones

Escenario: CA-45, justo después de emitir `2026-10` el 01-11-2026 (arrendatario O-6 en el Depto 102; el correo del propietario del Depto 101 rebota).

```text
+-- Octubre 2026 · <Emitido> -----------------------------------------------------------------
| {ok} Se emitió el periodo octubre 2026. Se creó el borrador de noviembre 2026.
| {!} Avisos sin notificar: Depto 101                                      [ Reenviar ]
|
| Emitido el 01-11-2026 · Vence el 11-11-2026 · Total emitido $1.050.000
|                                     [ Descargar todos los avisos ]  [! Cerrar periodo !]
|
| [ Gastos y cargos ]  [ Avisos (4) ]
|
| [x] 1 aviso seleccionado · [ Reenviar ]                                  <- barra masiva
| [ ] Unidad      Destinatario del aviso   Aviso PDF   Notificación
| [x] Depto 101   Ana Pérez                <Listo>     <Sin notificar>   > Ver PDF > Contactos
| [ ] Depto 102   Luis Muñoz               <Listo>     Notificado        > Ver PDF
| [ ] Depto 201   Rosa Díaz                <Listo>     Notificado        > Ver PDF
| [ ] Depto 202   Marco Silva              <Listo>     Notificado        > Ver PDF
+---------------------------------------------------------------------------------------------
```

- "Avisos sin notificar: {unidades}" es de G-6 y CA-45. El vencimiento no cambia (E-1, S-29).
- Estados del PDF: "Generando", "Listo" y "Error al generar" con "Reintentar" (flujo). Con error: "No se pudo generar el aviso de Depto 201" y "Reintentar" genera el mismo aviso con los mismos montos (G-5).
- El PDF lleva el RUT enmascarado para todos (CA-46).
- Mientras notifica: "Notificando a residentes: 3 de 4" (flujo, "Carga").
- "Sin notificar" y "Notificado" en la columna Notificación: textos del diseño (UX-61). El banner de éxito: texto del diseño (UX-69).
- "Descargar todos los avisos" es solo del administrador y queda en auditoría (IA). Pide confirmación con "Este archivo contiene datos personales y deudas. Quedará registrado." (texto del diseño, UX-69, a partir del de la planilla de deudas). El comité descarga de a uno.
- El Depto 102 tiene arrendatario vigente (O-6): el propietario recibe el aviso y el arrendatario, la notificación de su cobro (G-6). La columna muestra solo al destinatario del aviso legal.

## WEB-PER-11 · Cerrar periodo

```text
+-- Diálogo: Cerrar periodo ----------------------------------------------------
| Al cerrar octubre 2026 no se podrá modificar. Las correcciones se harán con
| ajustes en el borrador vigente.
|
| Para confirmar, escribe el periodo: 2026-10
| [ 2026-10                ]
|
| ( Cancelar )                                         [! Cerrar periodo !]
+-------------------------------------------------------------------------------
```

- Texto del flujo. El botón se habilita solo cuando el texto coincide con `2026-10` (design system 5.16). No hay advertencias de conciliación (A-5.2).
- El botón "Cerrar periodo" solo existe en periodos emitidos.

**Resultado** (CA-48, cierre del 30-11-2026 a las 18:00):

```text
+-- Octubre 2026 · <Cerrado> -----------------------------------------------------------------
| {ok} Cerraste octubre 2026. Las correcciones se harán con ajustes en el borrador vigente.
|                                                       [ Descargar foto de saldos ]
| Foto de saldos al 30-11-2026 18:00
| Unidad      Deuda de      Ordinario   Fondo de reserva   Total
| Depto 101   Propietario   $100.000    $10.000            $110.000
| Depto 102   Propietario   $250.000    $12.500            $262.500
| Depto 201   Propietario   $250.000    $12.500            $262.500
| Depto 202   Propietario   $300.000    $15.000            $315.000
| Total                     $900.000    $50.000            $950.000
+---------------------------------------------------------------------------------------------
```

- Montos: CA-48. La foto no cambia con pagos registrados después del cierre.
- Banner de éxito: texto del diseño (UX-69).

| Caso | Código | Texto (spec) | Comportamiento |
| --- | --- | --- | --- |
| Cerrar un periodo en borrador | 409 `PERIOD_NOT_ISSUED` | "Solo se puede cerrar un periodo emitido" | El botón no existe; si llega a la API, banner `danger` |
| Ya cerrado (otra clave) | 409 `PERIOD_ALREADY_CLOSED` | "El periodo ya está cerrado" | Banner `warning` y recarga |
| Corte de conexión | — | Indicador en el botón y bloqueo del doble clic | Consulta el estado antes de reintentar |

## WEB-PER-12 · Vista del comité

```text
+-- Octubre 2026 · <Borrador> ----------------------------------------------------------------
| [ Gastos (4) ]  Cargos directos (0)  Egresos del fondo (0)  Ajustes recibidos (0)
|
| Concepto                     Cuenta      Subcategoría    Base        Monto     Respaldo
| Remuneración conserje        Ordinario   Administración  Alícuota    $650.000  factura.pdf
| ...
| Total                                                              $1.000.000
+---------------------------------------------------------------------------------------------
```

- Sin "Agregar", "Preparar emisión", "Editar", "Eliminar", "Reenviar", "Cerrar periodo" ni "Descargar todos los avisos". Si una acción llega a la API: GLB-03 (CA-24).
