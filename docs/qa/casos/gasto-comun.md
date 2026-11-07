# Casos de prueba: motor de gasto común

Estado: **Para revisión del líder del proyecto**
Responsable: ingeniero-qa
Aprobación: líder del proyecto
Especificación de origen: `docs/specs/gasto-comun.md` (estado Borrador, con las revisiones críticas 1 y 2 aplicadas). Abreviatura del módulo: `GC`.

Casos derivados de los criterios de aceptación CA-1 a CA-28, de los casos borde de la especificación y de casos borde adicionales. Cada monto esperado muestra su cálculo. Los montos se verificaron con un script de enteros (resto mayor, techo del fondo e interés con base actual/actual).

## Convenciones

- IDs según `docs/qa/plan-de-pruebas.md` §8: `TC-GC-CA<n>-<nn>` (desde un CA), `TC-GC-CB-<nn>` (caso borde), `PROP-GC-<nn>` (propiedad), `ISO-GC-<acción>-<n>` (aislamiento) y `PERM-GC-<rol>-<acción>` (permiso).
- **Tipo:** unitaria (motor puro en `packages/shared`), propiedad (fast-check), integración (API + PostgreSQL), aislamiento, e2e (Playwright o Maestro).
- **Prioridad por riesgo:** 1 = dinero, aislamiento o permisos; 2 = flujo y mensajes; 3 = presentación.
- **Supuesto (a validar):** marca todo dato o resultado que la especificación no define y que este documento fija para poder probar. Cada uno se repite en los hallazgos si requiere decisión del analista.
- **Bloqueado por H-n:** el resultado no se puede fijar sin ambigüedad hasta que el analista responda el hallazgo H-n (sección final).
- Notación: `div` es división entera, `mod` es el resto, `piso` trunca. Los montos van en CLP enteros.

## Datos comunes

- Comunidades A, B, C y D de `docs/qa/comunidades-simuladas.md`, con el `sort_order` fijado en la especificación (A: 101 = 1, 102 = 2, 201 = 3, 202 = 4; B: Casa 1 a 3 = 1 a 3; C: 11 = 1, 12 = 2, 21 = 3, 22 = 4, 31 = 5; D: Depto 1 a 4 = 1 a 4).
- Por defecto: fondo 500 pb, plazo 10 días corridos, flag `billing.interest` apagado.
- Con el flag activo, salvo indicación: activo desde el 2026-11-01, tasa del reglamento 1200 pb anuales vigente desde el 2026-11-01, tasa CMF 3000 pb vigente desde antes (tope 1500 pb).
- En 2026 y 2027 (años de 365 días) el interés es `piso(Σ capital_d × tasa_d / 3.650.000)`.
- **Supuesto (a validar):** en CA-1 a CA-21, salvo que el caso diga otra cosa, ninguna unidad de la Comunidad A tiene una ocupación de arrendatario vigente a la fecha de emisión, así que todos los cargos van al ámbito `unidad`. La tabla de la Comunidad A dice que el Depto 102 tiene arrendatario, pero no da fechas (H-19).

## Matriz de trazabilidad

| CA | Casos | Tipo | Prueba de oro |
| --- | --- | --- | --- |
| CA-1 | TC-GC-CA1-01, 02 | unitaria, integración | GOLD-A-01 a 04 |
| CA-2 | TC-GC-CA2-01 | unitaria | GOLD-B-01 a 03 (totales) |
| CA-3 | TC-GC-CA3-01, 02 | unitaria | GOLD-CE-01 a 05, GOLD-C-01 a 05 |
| CA-4 | TC-GC-CA4-01, 02 | unitaria | GOLD-D-01 a 04 |
| CA-5 | TC-GC-CA5-01 | integración | |
| CA-6 | TC-GC-CA6-01 a 04 | unitaria, integración | |
| CA-7 | TC-GC-CA7-01, 02 | integración, unitaria | |
| CA-8 | TC-GC-CA8-01 | unitaria | |
| CA-9 | TC-GC-CA9-01 | integración | |
| CA-10 | TC-GC-CA10-01 | integración | |
| CA-11 | TC-GC-CA11-01, 02 | integración, e2e | |
| CA-12 | TC-GC-CA12-01 | integración | |
| CA-13 | TC-GC-CA13-01, 02 | unitaria, integración | |
| CA-14 | TC-GC-CA14-01 a 03 | unitaria, integración | |
| CA-15 | TC-GC-CA15-01 a 03 | integración | |
| CA-16 | TC-GC-CA16-01 | unitaria | |
| CA-17 | TC-GC-CA17-01, 02 | unitaria | |
| CA-18 | TC-GC-CA18-01, 02 | integración | GOLD-CE-01 a 05 |
| CA-19 | TC-GC-CA19-01, 02 | integración | |
| CA-20 | TC-GC-CA20-01 | integración, e2e | |
| CA-21 | TC-GC-CA21-01 | integración | |
| CA-22 | TC-GC-CA22-01 a 03 | integración, aislamiento | |
| CA-23 | ISO-GC-* (sección de aislamiento) | aislamiento | |
| CA-24 | PERM-GC-* (sección de permisos) | integración | |
| CA-25 | TC-GC-CA25-01, 02 | integración | |
| CA-26 | TC-GC-CA26-01 a 04 | integración | |
| CA-27 | TC-GC-CA27-01 | integración | |
| CA-28 | TC-GC-CA28-01, 02 | integración | |

## Casos derivados de criterios de aceptación

### CA-1 · Emisión base por cuenta

#### TC-GC-CA1-01 · Prorrateo y fondo de la Comunidad A

- **CA:** CA-1 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-A-01 a GOLD-A-04
- **Precondiciones:** grupo (ordinario, alícuota) con gastos $650.000 + $180.000 + $120.000 + $50.000 = $1.000.000; `aliquot_e6` 200000, 250000, 250000, 300000; fondo 500 pb.
- **Pasos:** ejecutar el motor de cálculo del periodo.
- **Resultado esperado:**
  - Un solo grupo ordinario de $1.000.000 (los cuatro gastos se suman antes de repartir, regla C-1).
  - Fondo F = (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 = $50.000.
  - Ordinario: 1.000.000 × 200000 div 1.000.000 = 200.000; × 250000 = 250.000; × 250000 = 250.000; × 300000 = 300.000. Todos los restos son 0.
  - Fondo: 50.000 × 200000 div 1.000.000 = 10.000; 12.500; 12.500; 15.000. Restos 0.
  - Totales: 101 $210.000; 102 $262.500; 201 $262.500; 202 $315.000. Suma 1.000.000 + 50.000 = $1.050.000.

#### TC-GC-CA1-02 · Emisión en la API

- **CA:** CA-1 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Comunidad A con el borrador `2026-10` de TC-GC-CA1-01; reloj del servidor en 2026-11-01 (hora de Chile).
- **Pasos:** `period.issue` como administrador con una clave de idempotencia nueva.
- **Resultado esperado:**
  - `2026-10` en estado `emitido`, fecha de emisión 2026-11-01 (fijada por el servidor; si el cliente envía otra fecha, se ignora o se rechaza) y vencimiento 2026-11-01 + 10 = 2026-11-11.
  - 8 cargos y 8 débitos en el libro (4 ordinarios, 4 de fondo), con los montos de TC-GC-CA1-01, ámbito `unidad`.
  - Σ débitos del periodo = $1.050.000; cada grupo cuadra con su total.
  - Foto de participaciones guardada: 4 unidades con `aliquot_e6`, `sort_order` y 500 pb.
  - `2026-11` creado en estado `borrador` y es el único borrador de la comunidad.
  - Un registro de auditoría de la emisión.

### CA-2 · Partes iguales con desempate

#### TC-GC-CA2-01 · Comunidad B por partes iguales

- **CA:** CA-2 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-B-01 a 03 (los totales coinciden)
- **Precondiciones:** grupo (ordinario, partes iguales {Casa 1, Casa 2, Casa 3}) de $95.238; las casas sin `aliquot_e6` cargado.
- **Pasos:** emitir.
- **Resultado esperado:**
  - No se valida la suma de alícuotas (no hay grupos por alícuota).
  - Fondo F = (95.238 × 500 + 9.999) div 10.000 = 47.628.999 div 10.000 = $4.762.
  - Ordinario: 95.238 × 1 div 3 = 31.746, resto 0, para cada casa.
  - Fondo: 4.762 × 1 div 3 = 1.587, resto 1 para cada casa. Falta 4.762 − 4.761 = 1 peso; empate de restos, gana la Casa 1 (`sort_order` 1): 1.588, 1.587, 1.587.
  - Totales: Casa 1 31.746 + 1.588 = $33.334; Casa 2 $33.333; Casa 3 $33.333. Suma $100.000.

### CA-3 · Resto mayor con varios pesos y empate

#### TC-GC-CA3-01 · Emisión por cuenta de la Comunidad C

- **CA:** CA-3 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-CE-01 a GOLD-CE-05
- **Precondiciones:** grupo (ordinario, alícuota) de $1.175.778 con `aliquot_e6` 185000, 195000, 200000, 210000, 210000.
- **Pasos:** emitir.
- **Resultado esperado:** los cálculos de `docs/qa/comunidades-simuladas.md`, Comunidad C, emisión por cuenta:
  - Fondo F = 587.898.999 div 10.000 = $58.789.
  - Ordinario: 217.519; 229.277; 235.156; 246.913; 246.913 (3 pesos a los restos 930.000, 710.000 y 600.000).
  - Fondo: 10.876; 11.464; 11.758; 12.346; 12.345 (4 pesos; en el empate de 690.000 gana el Depto 22 por `sort_order` 4 sobre 5).
  - Totales: $228.395; $240.741; $246.914; $259.259; $259.258. Suma $1.234.567.

#### TC-GC-CA3-02 · El redondeo combinado debe fallar

- **CA:** CA-3, regla C-6 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-C-01 a 05 y GOLD-CE-01 a 05
- **Pasos:** repartir $1.234.567 de una vez (función de reparto pura) y, por separado, emitir por cuenta.
- **Resultado esperado:** el reparto único da GOLD-C (Depto 21 $246.913 y Depto 31 $259.259). La emisión da GOLD-CE (Depto 21 $246.914 y Depto 31 $259.258). Las dos pruebas deben pasar a la vez; si la emisión devuelve GOLD-C, la implementación redondea el total combinado y falla.

### CA-4 · Alícuotas en escala 10^-6

#### TC-GC-CA4-01 · Comunidad D con fondo techo

- **CA:** CA-4 · **Tipo:** unitaria · **Prioridad:** 1 · **Oro:** GOLD-D-01 a GOLD-D-04
- **Precondiciones:** grupo (ordinario, alícuota) de $876.543 con `aliquot_e6` 187345, 243218, 256789, 312648.
- **Pasos:** emitir.
- **Resultado esperado:**
  - Fondo F = (876.543 × 500 + 9.999) div 10.000 = 438.281.499 div 10.000 = $43.828.
  - Ordinario: 164.216; 213.191; 225.087; 274.049 (2 pesos a los restos 948.335 y 600.427).
  - Fondo: productos 8.210.956.660; 10.659.758.504; 11.254.548.292; 13.702.736.544. Partes enteras 8.210 + 10.659 + 11.254 + 13.702 = 43.825; 3 pesos a los restos 956.660 (Depto 1), 758.504 (Depto 2) y 736.544 (Depto 4): 8.211; 10.660; 11.254; 13.703.
  - GOLD-D-01 $172.427; GOLD-D-02 $223.851; GOLD-D-03 $236.341; GOLD-D-04 $287.752. Suma $920.371.

#### TC-GC-CA4-02 · Regresión del redondeo del fondo

- **CA:** CA-4, regla D-3 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el total del fondo con O = 876.543 y 500 pb.
- **Resultado esperado:** $43.828. Falla si devuelve $43.827 (mitad hacia arriba o truncado), que deja el fondo bajo el 5 % (43.827 < 43.827,15).

### CA-5 · Pago parcial e imputación

#### TC-GC-CA5-01 · Pago parcial del Depto 101

- **CA:** CA-5 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` emitido como en TC-GC-CA1-02; `2026-11` es el borrador vigente.
- **Pasos:** el administrador registra una transferencia de $100.000 del Depto 101, `paid_on` 2026-11-05, ámbito por defecto.
- **Resultado esperado:**
  - Un crédito de $100.000 en la cuenta `pago`, en el periodo `2026-11`, ámbito `unidad`.
  - Una imputación de $100.000 al ordinario de `2026-10` (orden F-5: no hay intereses ni capital vencido, así que va a lo no vencido, ordinario primero).
  - Pendiente: ordinario 200.000 − 100.000 = $100.000 y fondo $10.000. Saldo 210.000 − 100.000 = $110.000. Sin saldo a favor.

### CA-6 · Interés por mora y pago posterior (flag activo)

#### TC-GC-CA6-01 · Fórmula del interés de 19 días

- **CA:** CA-6 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el interés con capital $110.000 los días 2026-11-12 a 2026-11-30 (19 días), tasa min(1200, 1500) = 1200.
- **Resultado esperado:** piso(110.000 × 19 × 1.200 / 3.650.000) = piso(2.508.000.000 / 3.650.000) = piso(687,12) = **$687**. Con la fórmula general: Σ 110.000 × 1.200 × 366 durante 19 días / (10.000 × 133.590) da el mismo $687.

#### TC-GC-CA6-02 · Emisión de `2026-11` con interés

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA5-01, flag y tasas por defecto, Depto 101 sin arrendatario; borrador `2026-11` con los gastos de CA-1.
- **Pasos:** emitir `2026-11` el 2026-12-01.
- **Resultado esperado:**
  - Cargo de cuenta `intereses` de $687 para el Depto 101, en `2026-11`, ámbito `unidad`, que vence el 2026-12-11.
  - Cargos de `2026-11` del Depto 101: ordinario $200.000 y fondo $10.000.
  - Saldo: 110.000 + 687 + 210.000 = **$320.687**.
  - Último día cobrado del ámbito: 2026-11-30.

#### TC-GC-CA6-03 · Pago de $150.000 e imputación

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** registrar $150.000 del Depto 101 con `paid_on` 2026-12-05.
- **Resultado esperado:**
  - Capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000 (quedan 150.000 − 110.000 = 40.000).
  - Lo no vencido (vence el 2026-12-11): interés $687 (quedan 39.313) y ordinario `2026-11` $39.313.
  - Pendiente: ordinario `2026-11` 200.000 − 39.313 = $160.687 y fondo `2026-11` $10.000. Saldo **$170.687**.

#### TC-GC-CA6-04 · Interés de dos tramos el 2027-01-01

- **CA:** CA-6 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA6-03, sin más pagos.
- **Pasos:** emitir `2026-12` el 2027-01-01.
- **Resultado esperado:**
  - Tramo 1: 2026-12-01 a 2026-12-04 sobre $110.000 = 4 × 110.000 = 440.000 peso-días. El 2026-12-05 ya no cuenta (fecha efectiva máx(2026-12-05, 2026-11-11) = 2026-12-05; el capital se mide al cierre del día).
  - Tramo 2: 2026-12-12 a 2026-12-31 sobre $170.687 = 20 × 170.687 = 3.413.740 peso-días.
  - Interés = piso((440.000 + 3.413.740) × 1.200 / 3.650.000) = piso(4.624.488.000 / 3.650.000) = piso(1.266,98) = **$1.266**, en un solo cargo del ámbito `unidad`.
  - El interés de $687 no devenga interés (S-9).

### CA-7 · Tasa del reglamento sobre el tope

#### TC-GC-CA7-01 · Advertencia y nueva versión de tasa

- **CA:** CA-7 · **Tipo:** integración · **Prioridad:** 2
- **Precondiciones:** tope vigente 1500 pb; tasa del reglamento vigente 1200 pb desde el 2026-11-01.
- **Pasos:** el administrador configura 1,50 % mensual, que se envía como 1800 pb anuales, con vigencia desde una fecha nueva.
- **Resultado esperado:** se guarda una versión nueva (la de 1200 pb no se edita); la respuesta incluye "La tasa configurada supera el tope legal vigente (15,00 % anual). Se aplicará el tope"; queda un registro de auditoría.

#### TC-GC-CA7-02 · El cálculo usa el tope

- **CA:** CA-7 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** calcular el interés de $110.000 durante 19 días con tasa del reglamento 1800 y tope 1500.
- **Resultado esperado:** piso(110.000 × 19 × min(1.800, 1.500) / 3.650.000) = piso(3.135.000.000 / 3.650.000) = piso(858,90) = **$858**. Falla si da piso(110.000 × 19 × 1.800 / 3.650.000) = $1.030.

### CA-8 · Mes de 31 días con tasa igual al tope

#### TC-GC-CA8-01 · Diciembre de 31 días

- **CA:** CA-8 · **Tipo:** unitaria · **Prioridad:** 1
- **Precondiciones:** tasa del reglamento 1500 pb, tope 1500 pb; Depto 202 con $315.000 de capital vencido; último día cobrado 2026-11-30.
- **Pasos:** emitir `2026-12` el 2027-01-01.
- **Resultado esperado:** ventana 2026-12-01 a 2026-12-31 (31 días); interés piso(315.000 × 31 × 1.500 / 3.650.000) = piso(14.647.500.000 / 3.650.000) = piso(4.013,01) = **$4.013**. Falla si da $4.068 (convención de 30 días).
- **Nota:** la emisión de `2026-11` del 2026-12-01 que exige la precondición genera para el Depto 202 un cargo de intereses de piso(315.000 × 19 × 1.500 / 3.650.000) = piso(2.459,59) = $2.459, así que no es una emisión "con cargos $0" (H-2).

### CA-9 · Pago mayor a la deuda

#### TC-GC-CA9-01 · Excedente a favor y aplicación en la emisión

- **CA:** CA-9 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` emitido como en CA-1; Depto 201 ocupado por su propietario.
- **Pasos:** registrar $300.000 del Depto 201 el 2026-11-08 (ámbito `unidad`); luego emitir `2026-11` con ordinario $250.000 y fondo $12.500 para el Depto 201.
- **Resultado esperado:**
  - Tras el pago: imputación $250.000 al ordinario y $12.500 al fondo de `2026-10`; saldo a favor 300.000 − 262.500 = $37.500 (saldo −$37.500).
  - Tras emitir: los $37.500 se imputan al ordinario de `2026-11` (regla F-6, débito nuevo). Pendiente ordinario 250.000 − 37.500 = $212.500 y fondo $12.500. Saldo **$225.000**, sin saldo a favor.

### CA-10 · Webpay duplicado

#### TC-GC-CA10-01 · Confirmación repetida

- **CA:** CA-10 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 202 debe $315.000 de `2026-10`.
- **Pasos:** procesar dos veces la confirmación Webpay de $315.000 con `external_ref` `OC-2026-0001` (en secuencia y, en otra corrida, en paralelo).
- **Resultado esperado:** un solo pago, un solo crédito y un solo juego de imputaciones; la segunda respuesta devuelve el pago existente; saldo del Depto 202 = 315.000 − 315.000 = **$0**.

### CA-11 · Posible duplicado manual

#### TC-GC-CA11-01 · Advertencia de duplicado

- **CA:** CA-11 · **Tipo:** integración y e2e (Playwright) · **Prioridad:** 2
- **Precondiciones:** Depto 201 debía $262.500 de `2026-10` y un pago manual de $262.500 por transferencia con fecha 2026-11-09 lo dejó en $0. **Supuesto (a validar):** la especificación no dice cuánto debía el Depto 201; se toma $262.500 para que "el saldo vuelve a $0" cuadre (H-13).
- **Pasos:** ingresar otro pago de $262.500, Depto 201, transferencia, 2026-11-09.
- **Resultado esperado:** el formulario muestra exactamente "Ya existe un pago de $262.500 para Depto 201 con fecha 09-11-2026 por transferencia. Revisa que no sea un duplicado" y permite guardar. Al guardar: saldo −$262.500 (todo a favor).

#### TC-GC-CA11-02 · Anulación del duplicado

- **CA:** CA-11 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** anular el segundo pago con motivo "duplicado".
- **Resultado esperado:** débito de reverso de $262.500 en la cuenta `pago`, en el borrador vigente, con motivo y referencia al pago; saldo −262.500 + 262.500 = **$0**; los dos pagos siguen existiendo; auditoría de la anulación.

### CA-12 · Anulación con reimputación del saldo a favor

#### TC-GC-CA12-01 · Cheque protestado

- **CA:** CA-12 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 202 debe $315.000 de `2026-10` (ordinario $300.000, fondo $15.000); P1 cheque $315.000 `paid_on` 2026-11-05; P2 transferencia $100.000 `paid_on` 2026-11-06 (queda a favor, saldo −$100.000).
- **Pasos:** el 2026-11-20 anular P1.
- **Resultado esperado:**
  - Débito de reverso de $315.000 en `2026-11`.
  - Las imputaciones de P1 se deshacen; P2 se reimputa: $100.000 al ordinario de `2026-10`.
  - Pendiente: ordinario 300.000 − 100.000 = $200.000 y fondo $15.000. Saldo **$215.000** y saldo a favor $0.

### CA-13 · Corrección de un periodo cerrado

#### TC-GC-CA13-01 · Notas de crédito con la foto original

- **CA:** CA-13 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** recalcular `2026-10` con la foto de participaciones y el gasto de electricidad corregido de $180.000 a $170.000.
- **Resultado esperado:**
  - O = 1.000.000 − 10.000 = $990.000; F = (990.000 × 500 + 9.999) div 10.000 = 495.009.999 div 10.000 = $49.500.
  - Ordinario correcto: 198.000; 247.500; 247.500; 297.000. Fondo correcto: 9.900; 12.375; 12.375; 14.850 (sin restos).
  - Ajustes (correcto − original): ordinario −2.000, −2.500, −2.500, −3.000 (suma −10.000); fondo −100, −125, −125, −150 (suma −500).

#### TC-GC-CA13-02 · Registro y reimputación del Depto 101

- **CA:** CA-13 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` cerrado; Depto 101 con `2026-10` pagado completo y `2026-11` ($200.000 + $10.000, vencido el 2026-12-11) impago; borrador vigente `2026-12`.
- **Pasos:** el 2026-12-15 registrar la corrección.
- **Resultado esperado:**
  - 8 notas de crédito en `2026-12`, cada una con `adjusts_entry_id` al cargo original de `2026-10`, motivo y ámbito del cargo ajustado.
  - Depto 101: las notas (−2.000 y −100) se imputan a sus cargos ya pagados; se liberan 2.000 + 100 = $2.100 del pago, que se reimputan al ordinario vencido de `2026-11` conservando el `paid_on` del pago.
  - Pendiente Depto 101: ordinario 200.000 − 2.100 = $197.900 y fondo $10.000. Saldo **$207.900**.
  - Ningún movimiento ni imputación con periodo `2026-10` cambia (comparar la foto de la tabla antes y después).

### CA-14 · Dos correcciones sucesivas del mismo grupo

#### TC-GC-CA14-01 · Ajuste acumulado

- **CA:** CA-14 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** recalcular con O = $995.000 y aplicar ajuste = correcto − (original + ajustes previos).
- **Resultado esperado:**
  - F = (995.000 × 500 + 9.999) div 10.000 = 497.509.999 div 10.000 = $49.750.
  - Fondo exacto 9.950; 12.437,5; 12.437,5; 14.925. Partes enteras 9.950 + 12.437 + 12.437 + 14.925 = 49.749; el peso que falta va al Depto 102 (empate de resto 500.000 con el Depto 201, `sort_order` 2 contra 3).

  | Unidad | Ordinario: original + ajuste 1 + ajuste 2 | Fondo: original + ajuste 1 + ajuste 2 |
  | --- | --- | --- |
  | Depto 101 | 200.000 − 2.000 + 1.000 = 199.000 | 10.000 − 100 + 50 = 9.950 |
  | Depto 102 | 250.000 − 2.500 + 1.250 = 248.750 | 12.500 − 125 + 63 = 12.438 |
  | Depto 201 | 250.000 − 2.500 + 1.250 = 248.750 | 12.500 − 125 + 62 = 12.437 |
  | Depto 202 | 300.000 − 3.000 + 1.500 = 298.500 | 15.000 − 150 + 75 = 14.925 |
  | **Suma** | 1.000.000 − 10.000 + 5.000 = 995.000 | 50.000 − 500 + 250 = 49.750 |

#### TC-GC-CA14-02 · Periodo y vencimiento del débito de ajuste

- **CA:** CA-14, regla H-5 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** TC-GC-CA13-02 aplicado; Depto 101 sin deuda ni saldo a favor; borrador vigente `2027-01`.
- **Pasos:** registrar la segunda corrección; emitir `2027-01` el 2027-02-01.
- **Resultado esperado:** los 8 débitos de ajuste pertenecen a `2027-01`, vencen el 2027-02-11, ámbito `unidad`; el Depto 101 tiene $1.050 pendientes no vencidos (1.000 + 50) antes de emitir; su aviso de `2027-01` muestra "Ajuste periodo 2026-10: corrección factura electricidad".

#### TC-GC-CA14-03 · Interés del débito de ajuste

- **CA:** CA-14 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** flag activo; **Supuesto (a validar, dato de prueba):** el único capital vencido del Depto 101 son los $1.050 del ajuste y nadie paga.
- **Pasos:** emitir `2027-02` el 2027-03-01.
- **Resultado esperado:** ventana del ajuste 2027-02-12 a 2027-02-28 (17 días), nunca desde el vencimiento del cargo original; interés piso(1.050 × 17 × 1.200 / 3.650.000) = piso(5,87) = **$5**.

### CA-15 · Pago tardío después del cierre

#### TC-GC-CA15-01 · Periodo del crédito tardío

- **CA:** CA-15 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** `2026-10` cerrado, `2026-11` emitido, borrador `2026-12`.
- **Pasos:** el 2026-12-03 registrar un pago con `paid_on` 2026-10-31.
- **Resultado esperado:** crédito en `2026-12`, `paid_on` 2026-10-31, `recorded_at` 2026-12-03.

#### TC-GC-CA15-02 · Escritura en periodo cerrado o emitido

- **CA:** CA-15, reglas A-3.5, A-4 y A-5.4 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** intentar crear, editar o eliminar un gasto, un cargo directo o un movimiento con periodo `2026-10` (cerrado) y con periodo `2026-11` (emitido).
- **Resultado esperado:** rechazo sin escritura en todos los casos (verificar conteos de filas). Código HTTP y mensaje: **bloqueado por H-5**.

#### TC-GC-CA15-03 · Fecha de pago futura

- **CA:** CA-15, regla F-1 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** con el reloj en 2026-12-03 22:30 hora de Chile (2026-12-04 01:30 UTC), registrar pagos con `paid_on` 2026-12-03 y 2026-12-04.
- **Resultado esperado:** 2026-12-03 se acepta; 2026-12-04 se rechaza con "La fecha de pago no puede ser futura". Prueba que "fecha actual" se toma en hora de Chile y no en UTC.

### CA-16 · Extraordinario sin recargo

#### TC-GC-CA16-01 · Extraordinario por partes iguales

- **CA:** CA-16 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** emitir con grupo (extraordinario, partes iguales) $300.000 y grupo (ordinario, partes iguales) $95.238.
- **Resultado esperado:** extraordinario 300.000 div 3 = $100.000 por casa; fondo $4.762 (solo del ordinario); no existe grupo de fondo del extraordinario. Totales: Casa 1 31.746 + 1.588 + 100.000 = $133.334; Casa 2 y 3 $133.333. Suma 95.238 + 4.762 + 300.000 = $400.000.

### CA-17 · Consumo de agua como monto directo

#### TC-GC-CA17-01 · Solo cargos directos

- **CA:** CA-17 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** emitir con cargos directos ordinarios de agua $24.000 (101), $36.000 (102), $30.000 (201), $30.000 (202) y sin otros gastos.
- **Resultado esperado:** 4 cargos tal cual, suma 24.000 + 36.000 + 30.000 + 30.000 = $120.000; ningún grupo de fondo; no se valida la suma de alícuotas.

#### TC-GC-CA17-02 · Directos junto al grupo por alícuota

- **CA:** CA-17 · **Tipo:** unitaria · **Prioridad:** 1 · **Dato de prueba propio**
- **Pasos:** emitir con los cargos de TC-GC-CA17-01 y el grupo de CA-1.
- **Resultado esperado:** fondo $50.000 (de O = 1.000.000), no 1.120.000 × 5 % = $56.000. Totales: 101 210.000 + 24.000 = $234.000; 102 262.500 + 36.000 = $298.500; 201 262.500 + 30.000 = $292.500; 202 315.000 + 30.000 = $345.000. Suma $1.170.000.

### CA-18 · Unidad con participación 0

#### TC-GC-CA18-01 · Bodega sin cargos

- **CA:** CA-18 · **Tipo:** integración · **Prioridad:** 1 · **Oro:** GOLD-CE-01 a 05
- **Precondiciones:** Comunidad C más Bodega B1 con `aliquot_e6` 0 y `sort_order` 6.
- **Pasos:** emitir el periodo de CA-3.
- **Resultado esperado:** B1: producto 1.175.778 × 0 = 0, sin cargo ni movimiento; su aviso muestra $0. Los demás cargos son idénticos a GOLD-CE. La foto incluye a B1 con peso 0.

#### TC-GC-CA18-02 · Multa a la bodega

- **CA:** CA-18 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** en el periodo siguiente, cargo directo de cuenta `multas` de $30.000 a B1, con motivo y referencia; emitir.
- **Resultado esperado:** un cargo de $30.000 en `multas`; sin recargo de fondo.

### CA-19 · Alícuotas que no suman 100 %

#### TC-GC-CA19-01 · Suma 999.900

- **CA:** CA-19 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Comunidad C con Depto 31 en 209900: 185.000 + 195.000 + 200.000 + 210.000 + 209.900 = 999.900; un grupo por alícuota.
- **Pasos:** emitir.
- **Resultado esperado:** bloqueo con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %". El periodo sigue en `borrador`; no hay cargos, débitos, foto ni borrador nuevo.

#### TC-GC-CA19-02 · Suma sobre 100 %

- **CA:** CA-19 · **Tipo:** integración · **Prioridad:** 1 · **Dato de prueba propio**
- **Pasos:** Depto 31 en 210100 (suma 1.000.100) y emitir.
- **Resultado esperado:** bloqueo con "Las alícuotas suman 100,0100 %; deben sumar 100,0000 %" y nada escrito.

### CA-20 · Periodo sin gastos

#### TC-GC-CA20-01 · Emisión con confirmación

- **CA:** CA-20 · **Tipo:** integración y e2e (Playwright) · **Prioridad:** 2
- **Precondiciones:** Comunidad B, borrador sin gastos ni cargos, flag apagado.
- **Pasos:** emitir sin confirmar; luego confirmar.
- **Resultado esperado:** sin confirmar no cambia nada y se muestra "El periodo no tiene gastos. Se emitirán avisos con cargo $0". Al confirmar: 0 cargos y 0 movimientos; 3 avisos con cargo $0, saldo anterior y saldo de caja; borrador siguiente creado. Con el flag activo y deuda vencida: **bloqueado por H-2**.

### CA-21 · Cambio de propietario

#### TC-GC-CA21-01 · Venta a mitad de mes

- **CA:** CA-21 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 201 debe $262.500 de `2026-10`; venta el 2026-11-15.
- **Pasos:** registrar al nuevo propietario desde el 2026-11-15; emitir `2026-11` el 2026-12-01; el propietario anterior consulta la unidad.
- **Resultado esperado:** cargo `2026-11` completo de $262.500; aviso dirigido al nuevo propietario con saldo 262.500 + 262.500 = **$525.000**; el propietario anterior recibe 404 en lectura y en pago.

### CA-22 · Arrendatario con deuda anterior en la unidad

#### TC-GC-CA22-01 · Ámbito al emitir

- **CA:** CA-22 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** ocupación anterior del Depto 102 terminada el 2026-10-31; `2026-10` emitido el 2026-11-01 con $262.500 en ámbito `unidad`, impago; ocupación O-1 desde el 2026-11-15.
- **Pasos:** emitir `2026-11` el 2026-12-01 con $262.500 para el Depto 102.
- **Resultado esperado:** los cargos de `2026-11` del Depto 102 (ordinario $250.000 y fondo $12.500) en ámbito `ocupacion:O-1`. Vista del arrendatario: total $262.500 y saldo anterior $0.

#### TC-GC-CA22-02 · Pago del arrendatario solo a su ámbito

- **CA:** CA-22 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el arrendatario paga $262.500 por Webpay el 2026-12-05.
- **Resultado esperado:** imputaciones ordinario `2026-11` $250.000 y fondo `2026-11` $12.500, ámbito O-1; nada a `2026-10`. Saldo O-1 $0; saldo `unidad` $262.500. Aviso legal: `unidad` deuda $262.500 y a favor $0; O-1 deuda $0 y a favor $0; total de la unidad $262.500.

#### TC-GC-CA22-03 · El arrendatario no ve la deuda del propietario

- **CA:** CA-22 · **Tipo:** aislamiento · **Prioridad:** 1
- **Pasos:** el arrendatario pide el cargo de `2026-10`, la lista de movimientos y el saldo del Depto 102.
- **Resultado esperado:** 404 en el cargo de `2026-10`; la lista y el saldo solo incluyen el ámbito O-1 ($0); la respuesta no contiene montos ni IDs del ámbito `unidad`.

### CA-25 · Emisión idempotente

#### TC-GC-CA25-01 · Misma clave, en paralelo

- **CA:** CA-25 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** enviar dos peticiones de emisión de `2026-10` de la Comunidad A con la misma clave, en paralelo.
- **Resultado esperado:** una emisión; 8 débitos por $1.050.000 en total; un solo borrador `2026-11`; respuestas iguales.

#### TC-GC-CA25-02 · Otra clave

- **CA:** CA-25 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** tras TC-GC-CA25-01, emitir `2026-10` con otra clave.
- **Resultado esperado:** 409 con "El periodo ya fue emitido"; nada escrito.

### CA-26 · Intereses por ámbito con arrendatario (flag activo)

#### TC-GC-CA26-01 · Interés del ámbito `unidad`

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** escenario de CA-22 con flag y tasas por defecto.
- **Pasos:** emitir `2026-11` el 2026-12-01.
- **Resultado esperado:** ámbito `unidad`: piso(262.500 × 19 × 1.200 / 3.650.000) = piso(5.985.000.000 / 3.650.000) = piso(1.639,726) = **$1.639** (días 2026-11-12 a 2026-11-30). Ámbito O-1: sin cargo de intereses.

#### TC-GC-CA26-02 · Pago tardío del arrendatario

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el arrendatario paga $262.500 por Webpay con `paid_on` 2026-12-20.
- **Resultado esperado:** imputaciones ordinario $250.000 y fondo $12.500 de `2026-11`, ámbito O-1, con fecha efectiva máx(2026-12-20, 2026-12-11) = 2026-12-20.

#### TC-GC-CA26-03 · Emisión de `2026-12` por ámbito

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** emitir `2026-12` el 2027-01-01 con $262.500 para el Depto 102 (ámbito O-1).
- **Resultado esperado:**
  - `unidad`: piso(262.500 × 31 × 1.200 / 3.650.000) = piso(9.765.000.000 / 3.650.000) = piso(2.675,34) = **$2.675** (2026-12-01 a 2026-12-31).
  - O-1: piso(262.500 × 8 × 1.200 / 3.650.000) = piso(2.520.000.000 / 3.650.000) = piso(690,41) = **$690** (2026-12-12 a 2026-12-19).
  - Aviso legal: `unidad` 262.500 + 1.639 + 2.675 = $266.814, a favor $0; O-1 262.500 + 690 = $263.190, a favor $0; total de la unidad 266.814 + 263.190 = **$530.004**.
  - El arrendatario ve solo $263.190.

#### TC-GC-CA26-04 · Fin de la ocupación

- **CA:** CA-26 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** terminar la ocupación O-1 el 2027-01-31 sin más pagos.
- **Resultado esperado:** los $263.190 pasan al ámbito `unidad`, que queda en 266.814 + 263.190 = **$530.004**; registro de auditoría del traspaso; el ex arrendatario recibe 404 en todo el módulo. El interés de los días 2027-01-12 a 2027-01-31 del capital traspasado: **bloqueado por H-3**.

### CA-27 · Fecha efectiva al reimputar (flag activo)

#### TC-GC-CA27-01 · Reimputación tras anular P1

- **CA:** CA-27 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** escenario de TC-GC-CA12-01 con flag y tasas por defecto.
- **Pasos:** anular P1 el 2026-11-20; emitir `2026-11` el 2026-12-01 con los gastos de CA-1.
- **Resultado esperado:**
  - Fecha efectiva de la reimputación de P2: máx(2026-11-06, 2026-11-11) = 2026-11-11.
  - Interés: piso(215.000 × 19 × 1.200 / 3.650.000) = piso(4.902.000.000 / 3.650.000) = piso(1.343,01) = **$1.343**.
  - Falla si da piso((315.000 × 8 + 215.000 × 11) × 1.200 / 3.650.000) = piso(5.862.000.000 / 3.650.000) = $1.606.
  - Saldo: 215.000 + 1.343 + 315.000 = **$531.343**.

### CA-28 · Pago con fecha dentro de días ya cobrados (flag activo)

#### TC-GC-CA28-01 · Nota de crédito automática de intereses

- **CA:** CA-28 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** estado de TC-GC-CA6-02 (interés $687 por 2026-11-12 a 2026-11-30, saldo $320.687); borrador `2026-12`.
- **Pasos:** el 2026-12-03 registrar una transferencia de $110.000 con `paid_on` 2026-11-20.
- **Resultado esperado:**
  - Imputación al ordinario `2026-10` $100.000 y al fondo `2026-10` $10.000, fecha efectiva 2026-11-20.
  - Interés recalculado: piso(110.000 × 8 × 1.200 / 3.650.000) = piso(1.056.000.000 / 3.650.000) = piso(289,315) = $289.
  - Nota de crédito automática de intereses en `2026-12`: 289 − 687 = **−$398**, con `adjusts_entry_id` al cargo de $687, imputada a él (queda $289 pendiente).
  - Saldo: 320.687 − 110.000 − 398 = **$210.289**.

#### TC-GC-CA28-02 · Anulación de esa transferencia

- **CA:** CA-28 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** el 2026-12-10 anular la transferencia.
- **Resultado esperado:** interés recalculado $687; débito de ajuste de intereses 687 − (687 − 398) = +398, es decir, $398 en `2026-12`, que vence con el aviso de `2026-12`; saldo 210.289 + 110.000 + 398 = **$320.687**; interés neto del cargo original 687 − 398 + 398 = $687.

## Aislamiento (CA-23)

Patrón de `docs/qa/plan-de-pruebas.md` §4, con las dos vías (guard y capa de datos). Actores: `admin-A`, `comite-A`, `propietario-101`, `arrendatario-102` (ocupación O-1), `conserje-A`, `ex-residente-A`. Después de cada caso se verifica en la base de datos que la Comunidad B y la unidad ajena no cambiaron (conteo y suma de movimientos, imputaciones y auditoría de B). Los nombres de acción son lógicos; se ajustan a la ruta real cuando exista el contrato de la API.

| ID | CA | Actor | Acción | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-GC-cargos-leer-1 | CA-23 | `admin-A` | Leer los cargos de una unidad de B, por las dos vías | 404 en ambas; el cuerpo no revela si existe |
| ISO-GC-pago-registrar-1 | CA-23 | `admin-A` | Registrar un pago de $10.000 en una unidad de B, por las dos vías | 404; B sin movimientos nuevos; sin auditoría en B |
| ISO-GC-pago-anular-1 | CA-23 | `admin-A` | Anular un pago de B | 404; el pago de B sigue vigente |
| ISO-GC-periodo-emitir-1 | CA-23 | `admin-A` | Emitir el borrador de B | 404; B sigue en borrador |
| ISO-GC-periodo-cerrar-1 | CA-23 | `admin-A` | Cerrar un periodo emitido de B | 404 |
| ISO-GC-gasto-escribir-1 | CA-23 | `admin-A` | Crear un gasto con `communityId` B en el cuerpo, en la ruta de A | 404; nada en B |
| ISO-GC-ajuste-crear-1 | CA-23 | `admin-A` | Crear un ajuste con `adjusts_entry_id` de un cargo de B (vía ISO-5) | 404; sin cambios en A ni en B |
| ISO-GC-cargos-listar-1 | CA-23 | `admin-A`, `comite-A` | Listar cargos, pagos y avisos | Solo aparecen datos de A |
| ISO-GC-multi-1 | CA-23 | Administrador de A y B | Operar en el contexto de A | Solo ve y modifica A |
| ISO-GC-unidad-leer-1 | CA-23 | `propietario-101` | Leer cargos, saldo o aviso del Depto 102 | 404 |
| ISO-GC-unidad-pagar-1 | CA-23 | `propietario-101` | Pagar por Webpay un cargo del Depto 102 | 404; no se crea orden Webpay |
| ISO-GC-ambito-leer-1 | CA-22 | `arrendatario-102` | Leer un movimiento del ámbito `unidad` del Depto 102 | 404 |
| ISO-GC-exresidente-1 | CA-21 | `ex-residente-A` | Leer o pagar cualquier recurso del módulo | 404 |
| ISO-GC-idempotencia-1 | CB | `admin-A` y `admin-B` | Emitir en A y en B con la misma clave de idempotencia | Dos emisiones independientes; la clave no se cruza entre comunidades. **Supuesto (a validar):** la clave es única por comunidad (H-18) |
| ISO-GC-webpay-ref-1 | CB | Sistema | Confirmar en B un pago con el mismo `external_ref` que uno de A | Se crea el pago en B; el par (`method`, `external_ref`) es único por comunidad (regla F-2) |

## Permisos por rol (CA-24)

Una prueba por celda. Códigos: 2xx permitido; 403 rol sin permiso con membresía vigente; 404 sin membresía o fuera de su unidad o ámbito; 401 sin sesión.

| Acción | Admin | Comité | Propietario | Arrendatario | Conserje | Ex residente | Sin sesión |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Configurar fondo, plazo, tasa, `sort_order` | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Crear, editar o eliminar gasto o cargo directo | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Emitir periodo | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Cerrar periodo | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Registrar pago manual | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Anular pago manual | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Registrar ajuste | 2xx | 403 | 403 | 403 | 403 | 404 | 401 |
| Leer cargos y saldos de cualquier unidad | 2xx + auditoría | 2xx + auditoría | 404 (ajena) | 404 (ajena) | 403 | 404 | 401 |
| Leer su unidad (propietario) o su ámbito (arrendatario) | n/a | n/a | 2xx sin auditoría | 2xx sin auditoría | 403 | 404 | 401 |
| Leer resumen de gastos y saldo de caja | 2xx | 2xx | 2xx | **Supuesto:** 2xx (H-12) | 403 | 404 | 401 |
| Descargar aviso | 2xx | 2xx | 2xx (suyo) | **Supuesto:** 2xx, vista de su ámbito (H-12) | 403 | 404 | 401 |
| Pagar por Webpay | 403 | 403 | 2xx (su unidad) | 2xx (su ámbito) | 403 | 404 | 401 |

- IDs: `PERM-GC-<rol>-<acción>`, por ejemplo `PERM-GC-comite-emitir` (403) y `PERM-GC-conserje-leer-aviso` (403).
- En cada 403 y 404 se verifica que no hubo escritura ni registro de auditoría de una escritura.
- **Supuesto (a validar):** que el administrador o el comité intenten pagar por Webpay da 403 (la especificación no lo dice).
- Auditoría (regla de "Usuarios y permisos"): cada escritura deja exactamente un registro; cada lectura de deuda de terceros por el administrador o el comité deja un registro por petición; la consulta del residente sobre lo suyo no deja registro (plan §5.1).

## Casos borde

### Prorrateo, redondeo y fondo

#### TC-GC-CB-01 · Gastos del mismo grupo se suman antes de repartir

- **Origen:** regla C-1 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** Comunidad B, tres gastos ordinarios de $1 por partes iguales.
- **Resultado esperado:** total 3, 3 div 3 = 1 por casa. Falla si se reparte gasto por gasto (cada $1 iría a la Casa 1: $3, $0, $0). Fondo: (3 × 500 + 9.999) div 10.000 = 11.499 div 10.000 = $1, que va a la Casa 1 (empate de restos, `sort_order` 1).

#### TC-GC-CB-02 · Total menor que el número de unidades

- **Origen:** regla C-5 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir $2 por partes iguales entre las 3 casas.
- **Resultado esperado:** partes enteras 0, restos 2, 2, 2 (de 3); los 2 pesos van a la Casa 1 y la Casa 2. La Casa 3 queda en $0: sin cargo ni movimiento y con $0 en el aviso.

#### TC-GC-CB-03 · Un fondo por cada grupo ordinario

- **Origen:** regla D-3 (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** Comunidad A con (ordinario, alícuota) $1.000.000 y (ordinario, partes iguales {101, 102}) $10.001.
- **Resultado esperado:**
  - Partes iguales: 10.001 div 2 = 5.000 con resto 1 cada una; el peso va al 101: $5.001 y $5.000.
  - Fondo de ese grupo: (10.001 × 500 + 9.999) div 10.000 = 5.010.499 div 10.000 = $501 (exacto 500,05); 501 div 2 = 250 con resto 1; el peso va al 101: $251 y $250.
  - Fondo por alícuota: $50.000 como en CA-1. Total de fondo 50.000 + 501 = $50.501.
  - Totales: 101 210.000 + 5.001 + 251 = $215.252; 102 262.500 + 5.000 + 250 = $267.750; 201 $262.500; 202 $315.000. Suma $1.060.502 = 1.000.000 + 50.000 + 10.001 + 501.

#### TC-GC-CB-04 · Partes iguales con conjuntos distintos son grupos distintos

- **Origen:** definición de grupo (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** (ordinario, partes iguales {101, 102}) $1.001 y (ordinario, partes iguales {201, 202}) $1.001.
- **Resultado esperado:** dos grupos: 101 $501, 102 $500, 201 $501, 202 $500. Dos fondos de (1.001 × 500 + 9.999) div 10.000 = $51 cada uno: 101 $26, 102 $25, 201 $26, 202 $25.

#### TC-GC-CB-05 · Fondo de grupos muy pequeños

- **Origen:** regla D-3 (borde propio) · **Tipo:** unitaria · **Prioridad:** 2
- **Pasos:** calcular F con 500 pb para O = 1, 19, 20, 21, 200 y 201.
- **Resultado esperado:** $1, $1, $1, $2, $10 y $11. Ejemplo: O = 21 → (10.500 + 9.999) div 10.000 = 2 (exacto 1,05). Con O = 1 el fondo es el 100 % del gasto (ver H-16).

#### TC-GC-CB-06 · Porcentaje del fondo

- **Origen:** regla D-2 · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** configurar 499, 500 y 750 pb; emitir CA-1 con 750 pb.
- **Resultado esperado:** 499 se rechaza (mensaje: bloqueado por H-5); 500 y 750 se aceptan; con 750 pb F = (1.000.000 × 750 + 9.999) div 10.000 = $75.000. Límite superior: bloqueado por H-17.

#### TC-GC-CB-07 · `sort_order` no consecutivo y orden natural

- **Origen:** reglas C-3 y C-4 · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir $100.000 entre "Depto 10" (`sort_order` 20), "Depto 9" (`sort_order` 10) y "Depto 2" (`sort_order` 30), peso 1 cada uno. Por separado, crear unidades "Depto 9" y "Depto 10" sin `sort_order` y leer el valor propuesto.
- **Resultado esperado:** el peso extra va al "Depto 9" (`sort_order` 10): $33.334, y los otros $33.333. Valor propuesto: "Depto 9" antes que "Depto 10".

#### TC-GC-CB-08 · Grupo con total y sin pesos

- **Origen:** caso borde de la especificación, regla A-3.2 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** grupo (extraordinario, partes iguales {}) de $50.000 y emitir.
- **Resultado esperado:** bloqueo con "El grupo extraordinario / partes_iguales no tiene unidades con participación para repartir $50.000" y nada escrito. **Supuesto (a validar):** `<cuenta>` y `<base>` se muestran con su código interno; la especificación no dice si se traducen.

#### TC-GC-CB-09 · Comunidad sin unidades

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** emitir en una comunidad sin unidades.
- **Resultado esperado:** rechazo sin escritura. Código y mensaje: bloqueado por H-5.

#### TC-GC-CB-10 · Montos inválidos

- **Origen:** regla B-5 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** crear gastos, cargos directos y pagos con 0, −1, 100,5, `"1e3"`, `"100.000"` (texto) y `null`.
- **Resultado esperado:** todos rechazados sin escritura. Código y mensaje: bloqueado por H-5. Monto máximo: bloqueado por H-11.

#### TC-GC-CB-11 · Montos grandes sin pérdida de precisión

- **Origen:** regla 1 de `CLAUDE.md` (borde propio) · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** repartir T = 9.999.999.999 con `aliquot_e6` 999.999 y 1.
- **Resultado esperado:** productos 9.999.989.999.000.001 y 9.999.999.999 (el primero supera 2^53 − 1 = 9.007.199.254.740.991). Partes enteras 9.999.989.999 y 9.999; restos 1 y 999.999; el peso que falta va a la segunda unidad: $9.999.989.999 y $10.000. Suma 9.999.999.999. Falla si se usa `number` de JavaScript en el producto (H-11).

### Pagos, imputación y saldos

#### TC-GC-CB-12 · Orden completo de imputación

- **Origen:** regla F-5 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones (dato de prueba):** el 2026-12-15, Depto 101 tiene pendiente: interés de `2026-11` $687 (vencido el 2026-12-11); `2026-10` ordinario $100.000 y fondo $10.000 (vencidos el 2026-11-11); `2026-11` ordinario $200.000, fondo $10.000, extraordinario $5.000 y multa $30.000 (vencidos el 2026-12-11).
- **Pasos:** registrar $320.000 con `paid_on` 2026-12-15 (registro el mismo día).
- **Resultado esperado:** intereses vencidos $687 (quedan 319.313); capital vencido `2026-10` ordinario $100.000 (219.313) y fondo $10.000 (209.313); `2026-11` ordinario $200.000 (9.313) y fondo $9.313 (0). Pendiente: fondo `2026-11` 10.000 − 9.313 = $687, extraordinario $5.000 y multa $30.000; saldo 687 + 5.000 + 30.000 = **$35.687**. La multa queda después de todo el capital vencido.

#### TC-GC-CB-13 · Fecha de referencia de "vencido"

- **Origen:** regla F-5 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 101 debe una multa de `2026-10` de $30.000 (vencida el 2026-11-11) y el ordinario de `2026-11` de $200.000 (vence el 2026-12-11).
- **Pasos:** el 2026-12-15 registrar $30.000 con `paid_on` 2026-12-05.
- **Resultado esperado:** **bloqueado por H-1.** Si "vencido" se mide en `paid_on`, se paga la multa (único vencido ese día). Si se mide al registrar, se paga el ordinario de `2026-11` (capital vencido antes que multas).

#### TC-GC-CB-14 · Pago antes de la primera emisión

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** Comunidad A recién configurada, borrador `2026-10`; Depto 101 paga $50.000 el 2026-10-20; emitir `2026-10` el 2026-11-01 como en CA-1.
- **Resultado esperado:** crédito en `2026-10` (borrador), saldo −$50.000. Al emitir se imputa al ordinario de `2026-10`: pendiente ordinario $150.000 y fondo $10.000, saldo **$160.000**.

#### TC-GC-CB-15 · Saldo a favor en un ámbito y deuda en otro

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** escenario de CA-22, pero el arrendatario paga $300.000 en vez de $262.500; luego termina la ocupación O-1.
- **Resultado esperado:**
  - Antes del fin: O-1 deuda $0 y a favor 300.000 − 262.500 = $37.500; `unidad` deuda $262.500 y a favor $0; no se compensan. Total de la unidad: **bloqueado por H-8** (neto $225.000 o bruto con dos líneas).
  - Al terminar O-1: los $37.500 pasan a `unidad` y se imputan al ordinario de `2026-10`: pendiente ordinario 250.000 − 37.500 = $212.500 y fondo $12.500; saldo **$225.000**, sin saldo a favor.

#### TC-GC-CB-16 · Cambio de arrendatario

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** O-1 con `2026-11` impago ($262.500) termina el 2026-12-15; O-2 ingresa el 2026-12-16; emitir `2026-12` el 2027-01-01 con $262.500 para el Depto 102.
- **Resultado esperado:** los $262.500 de O-1 pasan a `unidad` (auditoría); el cargo de `2026-12` va a `ocupacion:O-2`; O-2 ve solo $262.500 y saldo anterior $0; O-1 recibe 404. Intereses del capital traspasado: bloqueado por H-3.

#### TC-GC-CB-17 · Pago manual con ámbito elegido por el administrador

- **Origen:** regla F-9 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** en el escenario de CA-22, el administrador registra $262.500 sin elegir ámbito y, en otra corrida, eligiendo `ocupacion:O-1`.
- **Resultado esperado:** sin elegir, va al ámbito `unidad` y paga `2026-10`; eligiendo O-1, paga `2026-11` de O-1.

#### TC-GC-CB-18 · Pago concurrente con la emisión

- **Origen:** regla A-4 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** lanzar a la vez la emisión de `2026-10` y el registro de un pago de $100.000 del Depto 101.
- **Resultado esperado:** el pago queda en `2026-10` (si se registró antes de emitir) o en `2026-11` (si después), nunca en `2026-10` ya emitido; el saldo final es $110.000 en ambos casos.

### Intereses

#### TC-GC-CB-19 · Cambio de tasa del reglamento dentro de la ventana

- **Origen:** caso borde de la especificación · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** $110.000 vencido del 2026-11-12 al 2026-11-30; tasa 1200 pb hasta el 2026-11-19 y versión nueva de 600 pb desde el 2026-11-20.
- **Resultado esperado:** piso(110.000 × (8 × 1.200 + 11 × 600) / 3.650.000) = piso(110.000 × 16.200 / 3.650.000) = piso(1.782.000.000 / 3.650.000) = piso(488,22) = **$488**. La versión de 1200 pb sigue intacta.

#### TC-GC-CB-20 · Año bisiesto

- **Origen:** caso borde de la especificación · **Tipo:** unitaria · **Prioridad:** 1
- **Pasos:** $100.000 a 1200 pb (a) en enero de 2028, 31 días; (b) del 2027-12-17 al 2028-01-15 (15 días de 2027 y 15 de 2028).
- **Resultado esperado:**
  - (a) piso(100.000 × 1.200 × 365 × 31 / (10.000 × 133.590)) = piso(1.357.800.000.000 / 1.335.900.000) = piso(1.016,39) = **$1.016** (con base 365 daría $1.019).
  - (b) piso(100.000 × 1.200 × (15 × 366 + 15 × 365) / 1.335.900.000) = piso(1.315.800.000.000 / 1.335.900.000) = piso(984,95) = **$984**.

#### TC-GC-CB-21 · Falta la tasa CMF

- **Origen:** regla E-7 · **Tipo:** integración · **Prioridad:** 1
- **Precondiciones:** Depto 101 con $110.000 vencido desde el 2026-11-12; sin tasa CMF desde el 2026-11-25. **Dato de prueba:** el Depto 101 paga `2026-11` antes de su vencimiento.
- **Pasos:** emitir el 2026-12-01; cargar la tasa CMF faltante; emitir el 2027-01-01.
- **Resultado esperado:** el 2026-12-01 se advierte "Falta la tasa de referencia CMF desde 25-11-2026. Se emitirá sin intereses y se cobrarán en la próxima emisión" (formato de fecha: **Supuesto (a validar)** dd-mm-aaaa, como en F-3), sin cargos de intereses, con auditoría. El 2027-01-01 la ventana va del 2026-11-12 al 2026-12-31 (50 días): piso(110.000 × 50 × 1.200 / 3.650.000) = piso(1.808,22) = **$1.808**.

#### TC-GC-CB-22 · Activación del flag después del vencimiento

- **Origen:** caso borde de la especificación, S-20 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** flag activado el 2026-11-20 (tasa vigente desde esa fecha); $110.000 vencido desde el 2026-11-12; emitir el 2026-12-01.
- **Resultado esperado:** ventana 2026-11-20 a 2026-11-30 (11 días): piso(110.000 × 11 × 1.200 / 3.650.000) = piso(397,81) = **$397**. Activar el flag sin tasa vigente se rechaza con "Configura la tasa de interés del reglamento antes de activar los intereses".

#### TC-GC-CB-23 · Interés menor a $1

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 2
- **Pasos (dato de prueba):** cargo directo ordinario de $150 vencido desde el 2026-11-12, impago; emitir el 2026-12-01 y el 2027-01-01.
- **Resultado esperado:** 2026-12-01: piso(150 × 19 × 1.200 / 3.650.000) = piso(0,94) = $0, sin cargo; días hasta el 2026-11-30 cobrados. 2027-01-01: piso(150 × 31 × 1.200 / 3.650.000) = piso(1,53) = **$1**. Falla si da piso(150 × 50 × 1.200 / 3.650.000) = $2 (días no consumidos).

#### TC-GC-CB-24 · Anulación con interés original $0

- **Origen:** regla E-10 (borde propio) · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** Depto 101 paga `2026-10` completo con cheque el 2026-11-05; emitir el 2026-12-01 (interés $0, sin cargo); el 2026-12-10 se anula el cheque.
- **Resultado esperado:** **bloqueado por H-4.** El interés correcto de 2026-11-12 a 2026-11-30 es piso(210.000 × 19 × 1.200 / 3.650.000) = piso(1.311,78) = $1.311, pero no hay cargo de intereses original al que apunte `adjusts_entry_id`.

#### TC-GC-CB-25 · Webpay que llega después del cierre

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** como TC-GC-CA28-01, pero el crédito de $110.000 es una confirmación Webpay con `paid_on` 2026-11-20 que llega el 2026-12-03, con `2026-10` cerrado.
- **Resultado esperado:** crédito en `2026-12`; nota de crédito de intereses de −$398; saldo $210.289 (mismos cálculos de CA-28).

### Ciclo del periodo

#### TC-GC-CB-26 · Cierre de periodo

- **Origen:** regla A-5 (sin CA; ver H-6) · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** cerrar `2026-10` en borrador; cerrarlo emitido; cerrarlo otra vez; registrar después una reimputación con `recorded_at` posterior.
- **Resultado esperado:** cerrar un borrador se rechaza (código: bloqueado por H-5); cerrar el emitido crea la foto de saldos por unidad, ámbito y cuenta, que cuadra con el libro a ese momento; el segundo cierre se rechaza; la reimputación posterior no cambia la foto.

#### TC-GC-CB-27 · Fecha de emisión en hora de Chile

- **Origen:** regla A-3.3 (borde propio) · **Tipo:** integración · **Prioridad:** 2
- **Pasos:** emitir con el reloj en 2026-10-31 23:30 hora de Chile (2026-11-01 02:30 UTC).
- **Resultado esperado:** fecha de emisión 2026-10-31 y vencimiento 2026-11-10.

#### TC-GC-CB-28 · Vencimiento en día inhábil

- **Origen:** regla E-1, S-7 · **Tipo:** unitaria · **Prioridad:** 2
- **Pasos:** emitir el 2026-12-15.
- **Resultado esperado:** vencimiento 2026-12-25 (feriado), sin correrse.

#### TC-GC-CB-29 · Reclasificación de cuenta

- **Origen:** regla H-3 · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** en `2026-10` emitido de la Comunidad A, reclasificar el gasto de aseo de $50.000 de (ordinario, alícuota) a (extraordinario, alícuota).
- **Resultado esperado:**
  - Origen: O = 950.000; F = (950.000 × 500 + 9.999) div 10.000 = $47.500. Ajustes ordinario −10.000, −12.500, −12.500, −15.000; fondo 9.500 − 10.000 = −500, 11.875 − 12.500 = −625, −625, 14.250 − 15.000 = −750.
  - Destino: no había grupo extraordinario, así que son cargos nuevos que apuntan al gasto: 10.000, 12.500, 12.500, 15.000 (sin fondo).
  - Efecto neto por unidad: 101 −10.000 − 500 + 10.000 = −$500; 102 −$625; 201 −$625; 202 −$750. Suma −$2.500 = −(50.000 × 5 %).
  - Solo cambiar la subcategoría no genera movimientos; queda una nota en el aviso del borrador vigente.

#### TC-GC-CB-30 · Unidad nueva después de emitir

- **Origen:** caso borde de la especificación · **Tipo:** integración · **Prioridad:** 1
- **Pasos:** emitir `2026-10` de A; agregar una bodega con `aliquot_e6` 0; registrar la corrección de CA-13.
- **Resultado esperado:** las notas de crédito son las de TC-GC-CA13-01; la bodega no aparece en la corrección porque no está en la foto de `2026-10`.

## Propiedades (fast-check)

Generadores comunes: totales y pesos como `bigint` (total de 0 a 10^13, pesos de 0 a 10^6, al menos uno mayor que 0), de 1 a 50 unidades con `sort_order` únicos y no consecutivos, permutaciones del orden de entrada, porcentaje de fondo de 500 a 10.000 pb. No se generan porcentajes que sumen 100.

| ID | Propiedad | Expresión |
| --- | --- | --- |
| PROP-GC-01 | La suma de cargos iguala el total del grupo | Σ cargo_u = T |
| PROP-GC-02 | Nadie se aleja un peso o más de su exacto | `cargo_u × W − T × w_u` está en el intervalo (−W, W); además cargo_u ∈ {⌊T × w_u / W⌋, ⌊T × w_u / W⌋ + 1} |
| PROP-GC-03 | Cargos enteros no negativos y peso 0 da $0 | cargo_u ≥ 0; w_u = 0 ⇒ cargo_u = 0 y sin movimiento |
| PROP-GC-04 | Determinismo | dos ejecuciones con la misma entrada dan el mismo resultado |
| PROP-GC-05 | Invariancia al orden de entrada | cualquier permutación de las unidades da el mismo cargo por unidad |
| PROP-GC-06 | Desempate por `sort_order` | w_u = w_v y `sort_order`_u < `sort_order`_v ⇒ cargo_u ≥ cargo_v |
| PROP-GC-07 | Invariancia a la escala de pesos | multiplicar todos los pesos por k ≥ 1 no cambia ningún cargo |
| PROP-GC-08 | Pesos extra acotados | T − Σ ⌊T × w_u / W⌋ < número de unidades con w_u > 0 |
| PROP-GC-09 | Fondo techo | O × pb ≤ F × 10.000 < O × pb + 10.000 |
| PROP-GC-10 | Redondeo por cuenta | cada grupo cuadra con su total; total de la unidad = Σ de sus cargos por cuenta; Σ de la emisión = Σ de los totales de grupo |
| PROP-GC-11 | Saldo desde el libro | para cualquier secuencia de cargos, pagos, anulaciones, notas y ajustes: saldo de la unidad = Σ débitos − Σ créditos = Σ saldos por ámbito |
| PROP-GC-12 | Invariante S-18 | tras cualquier secuencia, ningún ámbito tiene a la vez deuda pendiente y saldo a favor |
| PROP-GC-13 | Imputaciones acotadas | Σ imputaciones de un crédito ≤ su monto; Σ imputaciones a un cargo ≤ cargo − sus notas de crédito |
| PROP-GC-14 | Ajustes acumulados | tras cualquier secuencia de correcciones de un grupo, original + Σ ajustes = reparto correcto con la foto original |
| PROP-GC-15 | Interés acotado por el tope | interés ≤ piso(Σ capital_d × tope_d × k_d / (10.000 × 133.590)) e interés ≤ exacto |
| PROP-GC-16 | Equivalencia en años de 365 días | si ningún día es de un año bisiesto, la fórmula general = piso(Σ capital_d × tasa_d / 3.650.000) |
| PROP-GC-17 | Inmutabilidad | cualquier secuencia de operaciones posteriores deja idénticos los movimientos de periodos emitidos o cerrados |
| PROP-GC-18 | Idempotencia | repetir N veces una emisión o confirmación Webpay con la misma clave deja el mismo estado que una vez |
| PROP-GC-19 | Aislamiento (basada en modelo) | cualquier secuencia de operaciones de actores de A no cambia ninguna fila de B |

Las semillas que encuentren un fallo se agregan como caso fijo de regresión (plan §7).

## Hallazgos para el analista

Contradicciones o vacíos de `docs/specs/gasto-comun.md` que impiden fijar un resultado o que conviene corregir. No se editó la especificación.

| Id | Regla o CA | Hallazgo | Pregunta concreta |
| --- | --- | --- | --- |
| H-1 | F-5 | No dice en qué fecha se evalúa si un cargo está "vencido": `paid_on`, `recorded_at` o el momento de imputar. Ningún CA lo distingue. En TC-GC-CB-13 cambia a qué cargo va el pago. | ¿Se mide al registrar (hora de Chile) o en `paid_on`? ¿Y en una reimputación? |
| H-2 | CA-8, CA-20 | CA-8 dice que `2026-11` se emitió "sin gastos, con cargos $0 (como en CA-20)", pero con el flag activo esa emisión crea un cargo de intereses de piso(315.000 × 19 × 1.500 / 3.650.000) = $2.459 al Depto 202. CA-20 promete "avisos con cargo $0". | Con el flag activo y deuda vencida, ¿el mensaje de CA-20 cambia? ¿CA-8 debe decir "sin gastos" en vez de "con cargos $0"? |
| H-3 | F-9, E-6 | No define la ventana ni el ámbito del interés del capital traspasado al terminar una ocupación (días en mora antes del traspaso aún no cobrados, y ventanas distintas entre ámbitos, por ejemplo por E-7). | ¿El interés de esos días va al ámbito `unidad` con la ventana de O-1, con la de `unidad`, o se cobra en O-1 antes del traspaso? |
| H-4 | E-10, E-6 | E-10 corrige "cada cargo de intereses afectado", pero si el interés original fue $0 (sin cargo) o el ámbito no tenía capital en mora, no hay cargo al que apuntar. Tampoco dice si la ventana avanza cuando un ámbito no tenía capital en mora. | ¿Se crea un débito de intereses nuevo sin `adjusts_entry_id`? ¿La ventana de un ámbito sin mora avanza igual? |
| H-5 | A-3.5, A-4, A-5, B-5, D-2, casos borde | Faltan código HTTP y mensaje para: escritura en periodo emitido o cerrado, monto 0, negativo o con decimales, porcentaje bajo 500 pb, comunidad sin unidades y cierre de un periodo que no está emitido. | ¿Qué código (409 o 422) y qué texto exacto devuelve cada uno? |
| H-6 | A-5 | No hay CA para el cierre (`period.close`): requisito, foto de saldos, doble cierre y corte por `recorded_at`. | ¿Se agrega un CA con montos de la foto de saldos? |
| H-7 | F-5 | No fija el orden entre varios cargos del mismo periodo y cuenta (por ejemplo, ordinario por alícuota, agua por monto directo y débito de ajuste). Afecta el determinismo de las imputaciones. | ¿Desempate por fecha de creación del cargo, por ID o por tipo? |
| H-8 | F-9, CA-22 | El aviso legal muestra "además el total de la unidad", pero no dice si es neto (Σ débitos − Σ créditos) o la suma de deudas brutas. CA-22 y CA-26 no lo distinguen porque no hay saldo a favor. | Con O-1 a favor $37.500 y `unidad` debiendo $262.500, ¿el total es $225.000 o $262.500? |
| H-9 | A-3.3 | La lista de la transacción imputa los saldos a favor antes de asignar el ámbito de cada cargo, pero la imputación es por ámbito. | Confirmar que el ámbito se asigna antes de imputar. |
| H-10 | C-6, CA-4 | C-6 cita las Comunidades C y D como ejemplo de la diferencia de ±1 peso. Con el techo, repartir $920.371 de una vez da los mismos cargos que por cuenta, así que la Comunidad D ya no muestra esa diferencia. QA agregó GOLD-CE (Comunidad C por cuenta) para detectarla. | Actualizar C-6 para citar CA-3 y GOLD-CE; cerrar P-15 con la opción elegida (prueba de oro D actualizada al techo). |
| H-11 | B-5, regla 1 de `CLAUDE.md` | No hay monto máximo. T × `aliquot_e6` supera 2^53 − 1 cuando T > $9.007.199.254, y la suma del interés (capital × tasa × 366 × días) también puede superarlo. | ¿Monto máximo por gasto y por pago? ¿Se exige `bigint` en el motor (ADR)? |
| H-12 | Usuarios y permisos | No dice si el arrendatario descarga su aviso ni si ve el resumen de gastos y el saldo de caja de la comunidad, que sí ve el propietario. | ¿Qué ve y descarga el arrendatario además de sus movimientos? |
| H-13 | CA-11 | No dice cuánto debía el Depto 201 antes del primer pago; el resultado "el saldo vuelve a $0" supone $262.500. | Agregar la deuda inicial a la precondición. |
| H-14 | CA-26, CA-28 | Los decimales intermedios se muestran truncados (1.639,726 aparece como 1.639,72; 289,315 como 289,31). El resultado no cambia, pero un contador puede leerlos como redondeados. | ¿Se muestran con 4 decimales o con "≈"? |
| H-15 | E-7 | El formato de `<fecha>` en el mensaje de tasa CMF faltante no está definido. | ¿dd-mm-aaaa como en F-3? |
| H-16 | D-3, S-6 | Con el techo, un grupo ordinario pequeño paga un fondo muy superior al porcentaje (O = $1 → F = $1, el 100 %; O = $19 → $1, el 5,26 %). | ¿Es aceptable para el contador, o se aplica el techo sobre el total ordinario del periodo? |
| H-17 | D-2 | Solo hay límite inferior del fondo (500 pb). | ¿Hay un máximo (por ejemplo, 10.000 pb)? |
| H-18 | A-3.4 | No dice el alcance de la clave de idempotencia (por comunidad o global), su vigencia, ni qué pasa si se reutiliza con otro periodo. | ¿La clave es única por comunidad y periodo? ¿Misma clave con otro periodo da 409 o 422? |
| H-19 | CA-1 a CA-21, comunidades simuladas | La Comunidad A dice que el Depto 102 tiene arrendatario, sin fechas. CA-22 dice que la ocupación anterior terminó el 2026-10-31. Los CA anteriores no indican el ámbito de los cargos del Depto 102. | ¿Se fijan fechas de ocupación en la Comunidad A? Mientras tanto, estos casos suponen ámbito `unidad`. |
