# Especificación: Motor de gasto común

Estado: Borrador
Responsable: analista-producto
Aprobación: líder del proyecto

## Objetivo

Calcular, emitir y cobrar el gasto común mensual de cada unidad de una comunidad, con montos enteros en CLP, trazables y reproducibles desde el libro de movimientos. El administrador puede cerrar el mes rápido y con confianza, y el residente sabe exactamente qué debe y por qué.

Esta especificación cubre el MVP. Donde la ley o la práctica contable no son claras, se toma un **supuesto** marcado como `S-n` (sección "Supuestos (a validar)"). Los supuestos permiten avanzar en la fase de prueba, pero ninguno queda como definitivo sin validación del líder del proyecto y, cuando corresponda, de un abogado o contador.

> **Nota sobre las citas legales.** Los artículos de la Ley 21.442 se citan según el texto publicado en LeyChile (BCN) y en la reproducción de modulor.cl. El texto oficial en bcn.cl no se pudo leer completo durante la redacción, así que la numeración exacta se debe verificar (ver P-1).

## Definiciones

- **Periodo:** mes calendario de gastos (por ejemplo `2026-10`, gastos de octubre). Se identifica por año y mes.
- **Gasto:** egreso de la comunidad registrado en un periodo, con concepto, monto CLP entero, tipo, criterio de distribución y respaldo opcional.
- **Cargo:** monto que se cobra a una unidad en un periodo, en una **cuenta** determinada. Cada cargo genera un movimiento de débito en el libro.
- **Cuenta:** clasificación contable de cargos y abonos. En el MVP hay cinco: `ordinario`, `fondo_reserva`, `extraordinario`, `intereses`, `multas`.
- **Pago:** dinero recibido para una unidad. Genera un movimiento de crédito en el libro y una o más **imputaciones** a cargos pendientes.
- **Saldo de una unidad:** suma de débitos menos suma de créditos del libro. Si es positivo, la unidad debe. Si es negativo, tiene saldo a favor.
- **Peso de participación:** entero que representa la alícuota de la unidad (por ejemplo 1850 para 18,50 %). La precisión la define el ADR 0007.

## Usuarios y permisos

| Rol | Puede ver | Puede hacer |
| --- | --- | --- |
| Administrador | Todo el gasto común de las comunidades donde tiene membresía: gastos, cargos, pagos, imputaciones, saldos y deudas por unidad, avisos de cobro | Configurar criterios de distribución, porcentaje del fondo de reserva, plazo de vencimiento y tasa de interés (`community.billing.configure`). Crear y editar gastos y cargos individuales en periodos en borrador (`expense.write`). Emitir (`period.issue`) y cerrar periodos (`period.close`). Registrar y anular pagos manuales (`payment.register`, `payment.void`). Registrar ajustes (`adjustment.create`) |
| Comité | Lo mismo que el administrador, solo de su comunidad, en modo lectura | Descargar avisos y reportes. No edita montos ni emite ni cierra (ver P-4) |
| Residente propietario | Avisos de cobro, cargos, pagos, imputaciones y saldo de **sus** unidades. Resumen de gastos del periodo y saldo de caja de la comunidad (información que el aviso exige mostrar a todos) | Pagar en línea (Webpay). Descargar sus avisos |
| Residente arrendatario | Avisos, cargos y pagos de la unidad que arrienda **desde la fecha de inicio de su ocupación** (S-14) | Pagar en línea. Descargar avisos desde su ingreso |
| Conserje | Nada del módulo de gasto común | Nada |

Reglas de permisos:

- Ningún rol ve cargos, deudas ni pagos de unidades ajenas, salvo administrador y comité de esa comunidad (regla 4 de `CLAUDE.md`).
- Toda lectura de deudas de terceros por administrador o comité queda en el registro de auditoría (regla 7 de `CLAUDE.md` y `docs/arquitectura.md` §5).
- Toda escritura (gasto, emisión, cierre, pago, anulación, ajuste, configuración) queda en el registro de auditoría con actor, fecha y hora.

## Reglas de negocio

### A. Ciclo del periodo

1. **Estados:** `borrador` → `emitido` → `cerrado`. No hay transiciones hacia atrás.
2. **Borrador:** el administrador agrega, edita o elimina gastos y cargos individuales. No existen cargos en el libro. Puede haber como máximo un periodo en borrador por comunidad.
3. **Emisión** (`period.issue`, solo administrador):
   1. Requisitos: el periodo anterior está emitido o cerrado (la emisión es secuencial); la suma de pesos de las unidades que participan en criterios por alícuota es exactamente 100 % (regla C-4); hay tope de interés vigente si la comunidad cobra intereses (regla E-6).
   2. En una sola transacción se calculan los cargos (secciones B, C y D), los intereses (sección E) y la imputación automática de saldos a favor (regla F-6). Se verifica que, **por cada cuenta y criterio**, la suma de los cargos iguale el total a distribuir. Si no se cumple, la emisión se aborta completa.
   3. Se fijan la fecha de emisión y la fecha de vencimiento (regla E-1), y se genera el aviso de cobro de cada unidad (sección G).
   4. Desde la emisión, los gastos y cargos del periodo son inmutables.
4. **Emitido:** se pueden registrar pagos y anulaciones de pagos con fecha contable en el periodo. No se agregan, editan ni eliminan gastos ni cargos. Los errores se corrigen con ajustes en el periodo siguiente (sección H).
5. **Cierre** (`period.close`, solo administrador; S-1):
   1. Requisito: el periodo está emitido.
   2. El sistema advierte (sin bloquear) si hay pagos sin conciliar del mes o si aún no pasa la fecha de vencimiento.
   3. Al cerrar se genera una foto de saldos de cierre por unidad y por cuenta, verificable contra el libro.
6. **Cerrado:** inmutable. No admite movimientos con su identificador de periodo (regla 6 de `CLAUDE.md`). Todo pago o ajuste posterior se registra en el primer periodo abierto (emitido o en borrador), conservando la fecha real del pago.
7. **Fecha contable de un movimiento:**
   - Cargos e intereses: pertenecen al periodo que se emite.
   - Pagos: pertenecen al periodo del mes de la fecha de pago si ese periodo no está cerrado; si lo está, al primer periodo abierto posterior.
   - Un periodo en borrador puede recibir pagos (por ejemplo, pagos de noviembre antes de emitir los gastos de noviembre).
8. **Calendario (S-2):** los gastos del mes M se emiten a comienzos del mes M+1 ("mes vencido"). El sistema no fuerza una fecha de emisión.

### B. Tipos de gasto y cargos

1. **Gastos comunes ordinarios** (Ley 21.442, art. 2 N° 9). El administrador clasifica cada gasto en una subcategoría, para el aviso y los reportes:
   - **Administración:** remuneraciones y honorarios del personal, del administrador y del conserje, más leyes sociales.
   - **Mantención:** mantención de bienes comunes, por ejemplo ascensores, aseo, luminarias, seguros y equipos de emergencia.
   - **Reparación:** arreglo de desperfectos o reemplazo de piezas de bienes comunes.
   - **Uso o consumo:** servicios colectivos como agua, gas, electricidad y telecomunicaciones de áreas comunes.
2. **Gastos comunes extraordinarios** (Ley 21.442, art. 2 N° 10): todo gasto distinto de los ordinarios, incluidas las nuevas obras comunes. Van a la cuenta `extraordinario`. **No generan recargo del fondo de reserva** (S-4).
3. **Gastos pagados con el fondo de reserva:** se registran como egreso del fondo con referencia a la autorización (comité o asamblea, según Ley 21.442, art. 39; S-13). No se distribuyen entre las unidades. El aviso los muestra como egresos del fondo.
4. **Cargos individuales:** cargos directos a una unidad, que no se prorratean:
   - **Consumo medido** (por ejemplo, agua por remarcador): la cuenta es `ordinario` y la subcategoría "uso o consumo". Se calculan con el criterio "por consumo" (regla C-3) o se ingresan como monto directo por unidad.
   - **Multa:** cuenta `multas`. La ingresa el administrador con monto, motivo y referencia a la norma del reglamento o al acuerdo que la respalda. En el MVP las multas son siempre manuales (S-8).
   - **Otros cargos directos** (por ejemplo, uso exclusivo de quincho): la cuenta la elige el administrador entre `ordinario` y `extraordinario`.
5. Todo monto ingresado es un entero CLP mayor que 0. Un monto 0 o negativo se rechaza. Los descuentos y devoluciones se hacen como ajustes de crédito (sección H).

### C. Distribución (prorrateo) y redondeo

1. **Criterios de distribución.** Cada gasto lleva uno:
   - **Por alícuota:** peso de cada unidad = su peso de participación. Es el criterio por defecto: la ley pide contribuir en proporción al derecho en los bienes comunes, salvo que el reglamento diga otra cosa (Ley 21.442, art. 6).
   - **Partes iguales:** peso 1 para cada unidad que participa en el criterio.
   - **Por consumo:** peso = consumo medido de la unidad en el periodo, como entero en la unidad mínima de medida (por ejemplo, litros).
   - **Monto directo:** cargo individual a una sola unidad, sin prorrateo.
2. **Agrupación:** los gastos de un periodo se agrupan por (cuenta, criterio). Cada grupo se suma y ese total se distribuye **una sola vez** con el método del resto mayor. El prorrateo no se hace gasto por gasto, para no acumular pesos de redondeo.
3. **Método del resto mayor** (`docs/qa/comunidades-simuladas.md`), con aritmética entera exacta:
   - `W` = suma de pesos de las unidades que participan; `T` = total del grupo.
   - Parte entera de la unidad `u`: `piso(T × w_u / W)`. Resto: `(T × w_u) mod W`.
   - Los pesos que faltan (`T − Σ partes enteras`) se asignan de a uno a las unidades con mayor resto.
   - **Desempate:** si dos restos son iguales, el peso va a la unidad con menor **orden de prorrateo**. Es un entero configurable por unidad; por defecto sigue el orden natural del código de la unidad: Casa 1 < Casa 2; Depto 22 < Depto 31 (S-3).
   - Garantías: la suma del grupo es exactamente `T`, ningún cargo difiere de su valor exacto en 1 peso o más, y el resultado no depende del orden de procesamiento.
4. **Validación de alícuotas:** para el criterio por alícuota, la suma de los pesos de participación de todas las unidades de la comunidad debe ser exactamente 100 % en la precisión configurada. Si no, la emisión se bloquea con el mensaje "Las alícuotas suman X %; deben sumar 100 %".
5. **Unidad con participación 0:** recibe cargo 0 en los grupos por alícuota y no genera movimiento de 0 en el libro. Sí puede recibir cargos individuales, y participa en "partes iguales" solo si el administrador la incluye.
6. **Consecuencia de agrupar por cuenta:** como el fondo de reserva se distribuye por separado del ordinario, el total de una unidad puede diferir en ±1 peso de lo que daría distribuir la suma de ambas cuentas de una vez (ver CA-4). Esto es intencional: cada cuenta debe cuadrar por sí sola, porque el fondo se mantiene y rinde por separado (Ley 21.442, art. 39).

### D. Fondo común de reserva

1. **Destino:** gastos urgentes, extraordinarios o imprevistos, incluidas las indemnizaciones por término de contrato del personal (Ley 21.442, art. 2 N° 11 y art. 39).
2. **Porcentaje:** se forma con un recargo sobre los gastos comunes ordinarios de cada unidad, con el porcentaje que fije el reglamento o la asamblea. Ese porcentaje no puede ser inferior al 5 % (Ley 21.442, art. 8 letra d y art. 39; S-5). El porcentaje se configura por comunidad en puntos base (500 = 5,00 %); el sistema rechaza valores bajo 500.
3. **Base de cálculo (S-4):** `O` = suma de los gastos comunes ordinarios del periodo que se distribuyen por alícuota o en partes iguales. Quedan fuera: consumos individuales medidos, cargos directos, extraordinarios, intereses, multas y egresos pagados con el propio fondo.
4. **Total del fondo del periodo:** `F = redondeo_mitad_arriba(O × pb / 10.000)`, en enteros: `F = (O × pb + 5.000) div 10.000` (S-6).
5. **Distribución:** `F` se distribuye con el mismo criterio de alícuota, como grupo propio en la cuenta `fondo_reserva` (regla C-2).
6. **Otros ingresos del fondo:** por ley, lo recaudado por multas e intereses va al fondo de reserva (Ley 21.442, art. 39). En el MVP, al imputar un pago a un cargo de las cuentas `intereses` o `multas`, el reporte del fondo lo suma como ingreso del fondo. No se mueve dinero entre cuentas bancarias; solo se clasifica.
7. **Saldo del fondo** = recargos cobrados e imputados + intereses y multas imputados − egresos del fondo. Se muestra en el aviso. La ley exige mantener el fondo en cuenta corriente, cuenta de ahorro o instrumentos financieros (Ley 21.442, art. 39), pero ComVive no administra inversiones.

### E. Vencimiento, intereses y multas

1. **Vencimiento:** el pago se debe hacer dentro de los diez días siguientes a la emisión del aviso de cobro, salvo que el reglamento fije otro plazo (Ley 21.442, art. 7). Se configura por comunidad; el valor por defecto es 10 días corridos (S-7). `fecha_vencimiento = fecha_emisión + plazo`. Si cae en día inhábil, no se corre.
2. **Mora:** desde el día siguiente al vencimiento, el capital impago de los cargos de ese aviso está en mora.
3. **Tasa:** la deuda en mora devenga el interés que fije el reglamento o, en su defecto, el reglamento tipo. Ese interés no puede superar el 50 % del interés corriente bancario (Ley 21.442, art. 7). La comunidad configura:
   - Si cobra intereses (sí o no; por defecto **no**, hasta que el administrador lo active con referencia al reglamento).
   - La tasa mensual del reglamento en puntos base (100 = 1,00 % mensual).
4. **Base del interés:** capital en mora = parte impaga de los cargos vencidos de las cuentas `ordinario`, `fondo_reserva` y `extraordinario`. **No** devengan interés los intereses ni las multas: no hay interés sobre interés (S-9). Que el fondo de reserva sea parte de la base también es un supuesto (S-9).
5. **Cálculo (S-10):** interés simple diario con convención de mes de 30 días, calculado una vez, al emitir el periodo siguiente:
   - `interés = piso( Σ_d capital_en_mora_d × tasa_pb / (10.000 × 30) )`
   - `d` recorre cada día desde el día siguiente al vencimiento (o el día siguiente al último corte de intereses) hasta el día anterior a la fecha de emisión, ambos incluidos.
   - `capital_en_mora_d` es el capital vencido impago al cierre del día `d`, según la fecha de pago de las imputaciones.
   - El resultado se trunca al peso (piso), a favor del deudor.
   - Se registra como cargo de la cuenta `intereses` en el periodo que se emite.
6. **Tope (S-11):**
   1. El administrador registra cada mes la tasa de interés corriente de referencia publicada por la CMF, con fecha de publicación, categoría de operación y valor anual en puntos base.
   2. Tope mensual = `piso(tasa_corriente_anual_pb × 50 / 100 / 12)`.
   3. Tasa aplicada = mínimo entre la tasa del reglamento y el tope vigente a la fecha de cálculo.
   4. Si la comunidad cobra intereses y no hay tope registrado para el mes, el sistema advierte. El administrador puede emitir sin calcular intereses para ese periodo, y eso queda en auditoría.
7. **Multas:** la ley incluye las multas dentro de las obligaciones económicas (Ley 21.442, art. 2 N° 8) y el reglamento debe regularlas (art. 8 letra e). En el MVP solo existen como cargo individual manual (regla B-4). Las multas automáticas por atraso quedan fuera de alcance.
8. **Suspensión de servicios por morosidad:** la ley la permite con 3 o más cuotas impagas, continuas o discontinuas, con restricciones (Ley 21.442, art. 36). El MVP **no** suspende servicios. Solo muestra al administrador el número de cuotas impagas de cada unidad (regla F-8).

### F. Pagos, imputación y saldos

1. **Origen del pago:**
   - Webpay: automático al confirmarse la transacción.
   - Manual: lo registra el administrador. Medios: transferencia, depósito, efectivo, cheque u otro.
   - Todo pago lleva unidad, monto CLP entero > 0, fecha de pago, medio y referencia.
2. **Idempotencia:** un pago con la misma referencia externa (orden de compra Webpay o identificador de transferencia) en la misma comunidad se registra **una sola vez**. Los reintentos devuelven el pago existente, sin crear otro crédito.
3. **Posible duplicado manual:** si se registra un pago manual con la misma unidad, monto, fecha y medio que otro existente, el sistema pide confirmación explícita antes de guardarlo y registra la confirmación en auditoría.
4. **Anulación:** un pago no se borra ni se edita. Se anula con un movimiento de débito de reverso que apunta al pago original y lleva motivo. Sus imputaciones se revierten. El reverso se registra en el primer periodo abierto. Solo el administrador puede anular pagos manuales. Los pagos Webpay solo se anulan si hubo una anulación en Transbank (fuera de alcance del MVP).
5. **Orden de imputación** de cualquier pago, total o parcial (S-12, basado en Código Civil arts. 1595 a 1597):
   1. Intereses pendientes, del más antiguo al más reciente.
   2. Multas pendientes, de la más antigua a la más reciente.
   3. Capital de los cargos vencidos, del periodo más antiguo al más reciente. Dentro de un mismo periodo, el orden de cuentas es `ordinario` → `fondo_reserva` → `extraordinario`.
   4. Capital de los cargos emitidos aún no vencidos, con el mismo orden.
   5. El remanente queda como **saldo a favor** (crédito sin imputar).
6. **Pago anticipado y saldo a favor:** un pago sin deuda pendiente, o el remanente de uno, queda como saldo a favor. Al emitir el periodo siguiente, el saldo a favor se imputa automáticamente a los nuevos cargos con el orden de la regla F-5. ComVive no gestiona devoluciones de saldo a favor en el MVP.
7. **Saldos:** siempre se calculan desde el libro. Saldo de la unidad = Σ débitos − Σ créditos. El saldo por cuenta y la deuda vencida se calculan desde las imputaciones. Ningún saldo es un campo editable (regla 5 de `CLAUDE.md`).
8. **Cuotas impagas:** una cuota impaga es un periodo emitido y vencido cuyos cargos de capital no están imputados por completo. Se muestra como contador por unidad (insumo para la regla E-8 y para cobranza).
9. **Quién debe:** la deuda pertenece a la unidad y la obligación la sigue a ella, incluidas las deudas anteriores a su adquisición (Ley 21.442, art. 6). El aviso se dirige al propietario registrado a la fecha de emisión. Cualquier persona puede pagar por la unidad; el pago se imputa a la unidad, no a una persona.

### G. Aviso de cobro

1. **Contenido mínimo legal** (Ley 21.442, art. 31):
   - La proporción en que la unidad contribuye a los gastos comunes y al fondo común de reserva.
   - Los intereses y multas que adeude a la fecha.
   - El total de ingresos y egresos del mes de la comunidad.
   - El saldo de caja de la comunidad.
2. **Contenido adicional del MVP (S-15).** Es la práctica habitual en Chile; ComunidadFeliz, por ejemplo, muestra el detalle de egresos, el porcentaje de prorrateo y el vencimiento:
   - Identificación de la comunidad, de la unidad y del propietario. El RUT se muestra enmascarado salvo para el propio titular.
   - Periodo, fecha de emisión, fecha de vencimiento y número correlativo del aviso.
   - Detalle de los gastos del periodo por subcategoría, con el total de cada grupo y el porcentaje de la unidad.
   - Cargos de la unidad por cuenta: ordinario, fondo de reserva, extraordinario, consumos, intereses y multas.
   - Saldo anterior, pagos recibidos desde el aviso anterior y total a pagar.
   - Saldo del fondo de reserva.
   - Medios de pago y nombre del administrador.
3. **Firma:** el aviso firmado por el administrador, en forma presencial o electrónica, tiene mérito ejecutivo para el cobro (Ley 21.442, art. 32). En el MVP el aviso lleva la identificación del administrador como firma electrónica simple. Si eso basta para el mérito ejecutivo es la pregunta P-6.
4. **Saldo de caja:** en el MVP el administrador lo ingresa al emitir (monto, fecha de corte y cuenta bancaria), porque la conciliación bancaria es otro módulo (S-16). Los ingresos y egresos del mes salen de los pagos imputados y los gastos registrados.
5. **Inmutabilidad:** el aviso emitido se conserva como documento (PDF) con huella de integridad. Se puede reenviar, pero nunca regenerar con otros montos.

### H. Ajustes y corrección de periodos

1. Un error en un periodo emitido o cerrado se corrige **solo** con ajustes en el primer periodo en borrador. Cada ajuste es un débito o un crédito (nota de crédito) por unidad y cuenta, con motivo obligatorio y referencia al periodo y al cargo o gasto original (`adjusts_entry_id`).
2. **Corrección de un gasto distribuido:**
   1. El sistema recalcula la distribución completa del grupo con el monto correcto, usando el método del resto mayor.
   2. El ajuste de cada unidad es `cargo_correcto − cargo_original`.
   3. Así, cargo original más ajuste es exactamente lo que habría resultado del cálculo correcto, y la suma de los ajustes del grupo es exactamente la diferencia del gasto.
   4. Si cambia la base del fondo de reserva, el fondo se recalcula igual.
3. Los ajustes no cambian ningún cargo ni aviso anterior. Aparecen en el aviso del periodo en que se registran como "Ajuste periodo AAAA-MM: motivo".

## Criterios de aceptación

Los gastos de las comunidades A, B y C vienen de `docs/qa/comunidades-simuladas.md`. Las fechas, tasas, consumos y gastos adicionales son **datos de prueba** propuestos aquí. Salvo que se diga otra cosa, el fondo de reserva es de 5 % (500 pb), el vencimiento es de 10 días corridos y la comunidad no cobra intereses.

**CA-1 · Emisión base con fondo de reserva por cuenta (Comunidad A)**

- Dado que la Comunidad A tiene el periodo `2026-10` en borrador con gastos ordinarios por alícuota de $1.000.000 (conserje $650.000, electricidad $180.000, ascensor $120.000, aseo $50.000) y fondo de reserva de 5 %
- Cuando el administrador emite el periodo el 2026-11-01
- Entonces el fondo del periodo es $50.000 y se generan estos cargos:

  | Unidad | Ordinario | Fondo de reserva | Total |
  | --- | --- | --- | --- |
  | Depto 101 | $200.000 | $10.000 | $210.000 |
  | Depto 102 | $250.000 | $12.500 | $262.500 |
  | Depto 201 | $250.000 | $12.500 | $262.500 |
  | Depto 202 | $300.000 | $15.000 | $315.000 |
  | **Suma** | **$1.000.000** | **$50.000** | **$1.050.000** |

- Y la fecha de vencimiento es 2026-11-11.
- Y el periodo queda en estado `emitido`, sin posibilidad de editar sus gastos.

**CA-2 · Partes iguales con desempate (Comunidad B)**

- Dado que la Comunidad B tiene un periodo en borrador con gastos ordinarios en partes iguales de $95.238 y fondo de 5 %
- Cuando el administrador emite
- Entonces el fondo es (95.238 × 500 + 5.000) div 10.000 = $4.762 (4.761,9 redondeado hacia arriba).
- Y el ordinario de cada casa es $31.746 (95.238 / 3 exacto).
- Y el fondo se reparte 1.587 + 1.587 + 1.587 = 4.761; el peso que falta va a la Casa 1 por desempate, así que los fondos son $1.588, $1.587 y $1.587.
- Y los totales son Casa 1 $33.334, Casa 2 $33.333 y Casa 3 $33.333, que suman $100.000. Coincide con la prueba de oro B.

**CA-3 · Resto mayor con varios pesos y empate (Comunidad C)**

- Dado que la Comunidad C tiene gastos ordinarios por alícuota de $1.175.778 y fondo de 5 %
- Cuando el administrador emite
- Entonces el fondo es (1.175.778 × 500 + 5.000) div 10.000 = $58.789, y el total del periodo es $1.234.567.
- Y el ordinario queda así: partes enteras 217.518 + 229.276 + 235.155 + 246.913 + 246.913 = 1.175.775, y los 3 pesos que faltan van a los restos mayores (0,93 del Depto 11, 0,71 del Depto 12 y 0,60 del Depto 21):

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 11 | $217.519 | $10.876 | $228.395 |
  | Depto 12 | $229.277 | $11.464 | $240.741 |
  | Depto 21 | $235.156 | $11.758 | $246.914 |
  | Depto 22 | $246.913 | $12.346 | $259.259 |
  | Depto 31 | $246.913 | $12.345 | $259.258 |
  | **Suma** | **$1.175.778** | **$58.789** | **$1.234.567** |

- Y el fondo queda así: partes enteras 10.875 + 11.463 + 11.757 + 12.345 + 12.345 = 58.785, y los 4 pesos que faltan van a los restos 0,965 (Depto 11), 0,855 (Depto 12) y 0,80 (Depto 21), más el empate 0,69 entre los Deptos 22 y 31, que gana el Depto 22 por menor orden.

**CA-4 · La distribución por cuenta difiere de la prueba de oro C en un peso (documentado)**

- Dado el resultado de CA-3
- Cuando se comparan los totales por unidad con la prueba de oro C, que distribuye $1.234.567 como un solo total
- Entonces el Depto 21 paga $246.914 (oro: $246.913) y el Depto 31 paga $259.258 (oro: $259.259). Las demás unidades coinciden y la suma total es igual.
- Y esto es correcto según la regla C-6. La prueba de oro C sigue siendo válida para la función de prorrateo de **un** grupo (ver P-9).

**CA-5 · Pago parcial e imputación (Comunidad A)**

- Dado el periodo `2026-10` emitido de CA-1
- Cuando el Depto 101 paga $100.000 por transferencia el 2026-11-05
- Entonces se imputan $100.000 al ordinario de `2026-10`.
- Y la unidad queda con ordinario pendiente $100.000, fondo pendiente $10.000 y saldo $110.000. Coincide con el escenario de pago parcial de la Comunidad A.

**CA-6 · Interés por mora y pago parcial posterior (Comunidad A, intereses activos)**

- Dado que la Comunidad A cobra 1,00 % mensual (100 pb) y la tasa corriente de referencia registrada es 30,00 % anual (dato de prueba), con tope de 1,25 % mensual
- Y el Depto 101 tiene $110.000 de capital vencido desde el 2026-11-12, sin otros pagos
- Cuando el administrador emite el periodo `2026-11` el 2026-12-01, con los mismos gastos de CA-1
- Entonces el interés del Depto 101 es piso(110.000 × 19 días × 100 / 300.000) = piso(696,67) = $696, en la cuenta `intereses`. Se cuentan los días del 2026-11-12 al 2026-11-30.
- Y el saldo de la unidad es 110.000 + 696 + 210.000 = $320.696.
- Cuando el Depto 101 paga $150.000 el 2026-12-05
- Entonces la imputación es:
  - Intereses: $696.
  - `2026-10`: ordinario $100.000 y fondo $10.000.
  - `2026-11`: ordinario $39.304.
- Y queda pendiente en `2026-11` un ordinario de $160.696 y un fondo de $10.000, con saldo $170.696.

**CA-7 · Tasa sobre el tope legal**

- Dado que la tasa corriente registrada es 30,00 % anual (tope de 1,25 % mensual)
- Cuando el administrador configura una tasa del reglamento de 1,50 % mensual
- Entonces el sistema guarda la tasa del reglamento, avisa que supera el tope legal (Ley 21.442, art. 7) y aplica 1,25 % mientras ese tope esté vigente.

**CA-8 · Pago mayor a la deuda y saldo a favor (Comunidad A)**

- Dado que el Depto 102 debe $262.500 del periodo `2026-10`
- Cuando paga $300.000 el 2026-11-08
- Entonces se imputan $250.000 al ordinario y $12.500 al fondo, y quedan $37.500 como saldo a favor (saldo de la unidad −$37.500).
- Cuando se emite `2026-11` con un cargo de $262.500 para el Depto 102
- Entonces el saldo a favor se imputa automáticamente al ordinario de `2026-11` y el Depto 102 queda debiendo $225.000.

**CA-9 · Pago Webpay duplicado**

- Dado que el Depto 202 paga $315.000 por Webpay con la orden `OC-2026-0001`
- Cuando la confirmación de Transbank llega dos veces con la misma orden
- Entonces existe un solo pago de $315.000 y un solo crédito en el libro, y el saldo del Depto 202 es $0.

**CA-10 · Posible duplicado manual**

- Dado que el Depto 201 tiene un pago manual de $262.500 por transferencia el 2026-11-09
- Cuando el administrador intenta registrar otro pago de $262.500 por transferencia el 2026-11-09 para el Depto 201
- Entonces el sistema muestra "Ya existe un pago igual para esta unidad y fecha. ¿Registrar de todos modos?" y no lo guarda sin confirmación.
- Cuando el administrador anula el pago duplicado que se confirmó por error
- Entonces se registra un débito de reverso de $262.500 que apunta al pago duplicado y lleva motivo. El duplicado había quedado entero como saldo a favor, porque el primer pago ya cubría la deuda, así que tras el reverso el saldo del Depto 201 es $0.
- Y ningún pago se borra: ambos y el reverso siguen en el libro.

**CA-11 · Corrección de un periodo cerrado (Comunidad A)**

- Dado que el periodo `2026-10` está cerrado y la electricidad se registró en $180.000 cuando la factura era de $170.000
- Cuando el administrador registra la corrección en el periodo `2026-12`, en borrador
- Entonces el sistema recalcula el grupo con $990.000 de ordinario y $49.500 de fondo, y genera estas notas de crédito:

  | Unidad | Ordinario | Fondo |
  | --- | --- | --- |
  | Depto 101 | −$2.000 | −$100 |
  | Depto 102 | −$2.500 | −$125 |
  | Depto 201 | −$2.500 | −$125 |
  | Depto 202 | −$3.000 | −$150 |
  | **Suma** | **−$10.000** | **−$500** |

- Y ningún movimiento del periodo `2026-10` cambia.
- Y el aviso de `2026-12` muestra "Ajuste periodo 2026-10: corrección factura electricidad".

**CA-12 · Intento de modificar un periodo cerrado**

- Dado que el periodo `2026-10` está cerrado
- Cuando cualquier usuario intenta registrar un gasto, un cargo o un pago con identificador de periodo `2026-10`
- Entonces la operación se rechaza.
- Y un pago con fecha 2026-10-31 registrado después del cierre queda en el primer periodo abierto, con su fecha real.

**CA-13 · Gasto extraordinario sin recargo de fondo (Comunidad B)**

- Dado que la asamblea de la Comunidad B acordó pintar la fachada por $300.000 en partes iguales
- Cuando se emite el periodo con ese gasto extraordinario y $95.238 de gastos ordinarios
- Entonces cada casa recibe un extraordinario de $100.000.
- Y el fondo sigue siendo $4.762, porque se calcula solo sobre los ordinarios.

**CA-14 · Consumo de agua por remarcador (Comunidad A, datos de prueba)**

- Dado un periodo de la Comunidad A con una boleta de agua de $120.000, distribuida por consumo
- Y lecturas del mes de 8.000 L (101), 12.000 L (102), 10.000 L (201) y 10.000 L (202)
- Cuando se emite
- Entonces los cargos de consumo son $24.000, $36.000, $30.000 y $30.000, que suman $120.000.
- Y esos montos no forman parte de la base del fondo de reserva.

**CA-15 · Unidad con participación 0 (Comunidad C más bodega, datos de prueba)**

- Dado que la Comunidad C tiene además la unidad "Bodega B1" con alícuota 0,00 %, y las demás suman 100 %
- Cuando se emite el periodo de CA-3
- Entonces la Bodega B1 no recibe cargos ordinarios ni de fondo, y los demás cargos son idénticos a CA-3.
- Cuando el administrador agrega una multa de $30.000 a la Bodega B1 en el periodo siguiente
- Entonces la multa se cobra normalmente en la cuenta `multas`.

**CA-16 · Alícuotas que no suman 100 %**

- Dado que en la Comunidad C se cambia el Depto 31 a 20,99 % y la suma queda en 99,99 %
- Cuando el administrador intenta emitir
- Entonces la emisión se bloquea con "Las alícuotas suman 99,99 %; deben sumar 100 %" y no se crea ningún cargo.

**CA-17 · Periodo sin gastos (Comunidad B)**

- Dado un periodo en borrador de la Comunidad B sin gastos ni cargos individuales
- Cuando el administrador intenta emitir
- Entonces el sistema pide confirmación ("El periodo no tiene gastos. Se emitirán avisos con cargo $0").
- Y al confirmar, el fondo es $0, no se crean movimientos de cargo, y cada casa recibe un aviso con su saldo anterior, intereses si los hubiera, y el saldo de caja.

**CA-18 · Cambio de propietario a mitad de mes (Comunidad A)**

- Dado que el Depto 201 debe $262.500 del periodo `2026-10` y se vende el 2026-11-15
- Cuando el administrador registra al nuevo propietario desde el 2026-11-15 y luego emite `2026-11` el 2026-12-01
- Entonces el cargo de `2026-11` del Depto 201 es completo ($262.500), sin prorratearlo por días.
- Y el aviso se dirige al nuevo propietario, con un saldo de $525.000 que incluye la deuda anterior (Ley 21.442, art. 6).
- Y el propietario anterior conserva acceso de solo lectura a los avisos y pagos del tiempo en que fue propietario (S-14).

**CA-19 · Aislamiento entre comunidades**

- Dado un administrador con membresía solo en la Comunidad A
- Cuando intenta leer los cargos o registrar un pago en una unidad de la Comunidad B
- Entonces recibe 404 y no se escribe nada.

**CA-20 · Permisos por rol**

- Dado un miembro del comité de la Comunidad A
- Cuando intenta emitir, cerrar, registrar un pago o crear un gasto
- Entonces recibe un error de permiso y no cambia nada.
- Dado un conserje de la Comunidad A
- Cuando intenta leer los avisos o el saldo de cualquier unidad
- Entonces se le niega el acceso.
- Dado el arrendatario del Depto 102, con ocupación desde el 2026-11-01
- Cuando consulta el estado de cuenta
- Entonces ve los cargos y pagos desde el periodo `2026-11` y no ve la deuda anterior a su ingreso.

## Casos borde

- **Unidad con participación 0:** cargo 0 en los grupos por alícuota y sin movimiento en el libro. Puede recibir cargos individuales (CA-15).
- **Todas las unidades con peso 0 en un grupo** (por ejemplo, criterio por consumo con lecturas en 0 y una boleta mayor que 0): la emisión se bloquea con "No hay consumos para distribuir $X". El administrador debe cambiar el criterio del gasto.
- **Cambio de propietario a mitad de mes:** la deuda y el cargo son de la unidad, sin prorrateo por días. El aviso va al propietario vigente a la fecha de emisión (CA-18). El reparto entre vendedor y comprador es un asunto privado entre ellos: el vendedor debe declarar en la escritura si está al día (Ley 21.442, art. 6).
- **Cambio de arrendatario a mitad de mes:** no cambia los cargos. Solo cambia quién puede ver y pagar desde su fecha de ingreso.
- **Pago duplicado:** si viene de Webpay, es idempotente por orden (CA-9); si es manual, el sistema pide confirmación y se corrige con anulación (CA-10).
- **Pago mayor a la deuda:** el remanente queda como saldo a favor y se imputa en la siguiente emisión (CA-8).
- **Pago antes de la primera emisión:** queda como saldo a favor en el periodo de su fecha.
- **Pago de $1 a una unidad con interés pendiente:** se imputa completo al interés.
- **Periodo sin gastos:** se emite con confirmación y cargos $0 (CA-17).
- **Corrección de un periodo cerrado:** nota de crédito o débito en el periodo en borrador, recalculando el grupo (CA-11).
- **Corrección de un periodo emitido no cerrado:** mismo tratamiento que un periodo cerrado. Los cargos emitidos no se editan.
- **Error descubierto antes de emitir:** se edita libremente en el borrador.
- **Intento de emitir con el periodo anterior en borrador:** se bloquea, porque la emisión es secuencial.
- **Tope de interés no registrado en el mes:** el sistema advierte; se puede emitir sin intereses y queda en auditoría (regla E-6).
- **Interés que da menos de $1:** cargo 0, sin movimiento. Los días ya contados no se acumulan para el siguiente cálculo (S-10).
- **Pago anulado después de cerrar su periodo:** el reverso va al primer periodo abierto. Los intereses de los días en que el pago se creyó válido no se recalculan retroactivamente (P-12).
- **Unidad nueva agregada a mitad de mes:** participa desde el primer periodo en borrador si las alícuotas suman 100 %. Si su incorporación cambia alícuotas, se requiere reglamento modificado (fuera de alcance; P-10).
- **Monto con decimales en un archivo importado o en la API:** se rechaza. Solo se aceptan enteros CLP.

## Fuera de alcance

- Gastos expresados en UF. El administrador los convierte a CLP a mano en el MVP (ver P-8 y `docs/arquitectura.md`, pregunta 7).
- Prorrateo por sectores o torres (Ley 21.442, art. 38).
- Multas automáticas por atraso y multas en UF o UTM.
- Convenios de pago con morosos (Ley 21.442, art. 6).
- Suspensión de servicios por morosidad (Ley 21.442, art. 36). Solo se informa el contador de cuotas impagas.
- Devolución de saldos a favor.
- Gastos extraordinarios en cuotas automáticas a lo largo de varios meses. En el MVP se ingresa la cuota de cada mes.
- Presupuesto anual, provisiones y fondo operacional inicial.
- Inversión del fondo de reserva y fondos adicionales (por ejemplo, fondo de indemnizaciones como cuenta separada).
- Lectura automática de medidores e importación de lecturas.
- Cobranza judicial, certificado de deuda y emisión de documentos tributarios.
- Conciliación bancaria (módulo propio) y cálculo automático del saldo de caja.

## Supuestos (a validar)

| Id | Supuesto | Fuente o razonamiento |
| --- | --- | --- |
| S-1 | Solo el administrador emite y cierra. El comité no aprueba la emisión ni el cierre en el MVP. | La ley encarga el cobro al administrador (Ley 21.442, art. 31). No se encontró una norma que exija aprobación del comité para emitir. `docs/arquitectura.md` lo deja abierto. |
| S-2 | El gasto común se cobra "mes vencido": los gastos de M se emiten en M+1. | Práctica habitual de administraciones y plataformas chilenas: el gasto común refleja egresos ya incurridos. |
| S-3 | El desempate del resto mayor usa un orden de prorrateo configurable; por defecto, el orden natural del código de la unidad. | Extiende la regla "menor número" de `docs/qa/comunidades-simuladas.md` a códigos alfanuméricos. |
| S-4 | El recargo del fondo se calcula solo sobre los gastos ordinarios prorrateados por alícuota o en partes iguales, sin consumos individuales, extraordinarios, intereses ni multas. | El art. 8 letra d de la Ley 21.442 habla de recargo "sobre los gastos comunes ordinarios de cada unidad". Los consumos individuales se excluyen por prudencia (ver P-3). |
| S-5 | El porcentaje mínimo del fondo es 5 % y aplica a toda comunidad. | Ley 21.442, art. 39 (según modulor.cl): "no podrán ser inferiores a un 5%". Bajo la Ley 19.537 el fondo era optativo en viviendas sociales; no se verificó si sigue así (P-2). |
| S-6 | El total del fondo se redondea al peso con mitad hacia arriba antes de distribuirlo. | Redondeo comercial habitual. Con `O` múltiplo de 20 no hay redondeo (Comunidad A). |
| S-7 | El plazo de 10 días se cuenta en días corridos desde la fecha de emisión, sin correr el vencimiento si cae en día inhábil. | Ley 21.442, art. 7, más Código Civil, art. 50 (los plazos de días de las leyes son corridos salvo norma en contrario). |
| S-8 | Las multas son manuales y el administrador las respalda con el reglamento o un acuerdo. | La ley remite la regulación de multas al reglamento (art. 8 letra e). Evita automatizar sanciones sin base verificada. |
| S-9 | El interés se calcula sobre el capital (ordinario, fondo y extraordinario), no sobre intereses ni multas. | Prudencia frente al anatocismo (Ley 18.010, art. 9, permite capitalizar intereses solo en casos pactados). Que el fondo de reserva genere interés se infiere del art. 37 de la Ley 21.442, que extiende el régimen de cobro a sus contribuciones. |
| S-10 | Interés simple diario (mes de 30 días), calculado al emitir el periodo siguiente y truncado al peso. | ComunidadFeliz calcula el interés devengado diariamente sobre el saldo atrasado desde el vencimiento (ayuda.comunidadfeliz.com). El truncamiento favorece al deudor y evita cobrar sobre el tope. |
| S-11 | El tope es el 50 % de la tasa de interés corriente que publica la CMF, registrada a mano por el administrador cada mes, y el tope mensual es la tasa anual dividida por 12. | Ley 21.442, art. 7. La CMF publica las tasas cada mes en el Diario Oficial. Qué categoría de operación usar y si la conversión debe ser simple son preguntas abiertas (P-5). |
| S-12 | Orden de imputación: intereses, multas y capital del más antiguo al más reciente; dentro del periodo, ordinario, fondo y extraordinario. | Código Civil, arts. 1595 (intereses antes que capital), 1596 y 1597 (deuda devengada antes que no devengada). El orden entre cuentas de un mismo periodo es convención propia. |
| S-13 | Los egresos del fondo se registran con la referencia a la autorización del comité (gastos extraordinarios, urgentes o imprevistos) o de la asamblea (ordinarios de mantención o reparación). | Ley 21.442, art. 39 (según modulor.cl). |
| S-14 | El arrendatario ve solo desde el inicio de su ocupación y el ex propietario conserva lectura de su propio tiempo. | Minimización de datos (Ley 21.719) y pregunta 2 de `docs/arquitectura.md`. |
| S-15 | El aviso incluye, además del mínimo legal, el detalle de gastos, el porcentaje de la unidad, el saldo anterior y el saldo del fondo. | Práctica de mercado (configuración de boleta de ComunidadFeliz) y transparencia exigida por la rendición de cuentas. |
| S-16 | El saldo de caja del aviso lo ingresa el administrador al emitir. | El art. 31 lo exige, pero en el MVP no hay integración bancaria. |

## Preguntas abiertas

- [ ] **P-1** (líder del proyecto → abogado): verificar contra el texto oficial de bcn.cl la numeración citada de la Ley 21.442 (arts. 2, 6, 7, 8, 31, 32, 36, 37, 38 y 39) y revisar si el reglamento (DS N° 7 de 2025 del MINVU, publicado en enero de 2025) agrega requisitos al aviso de cobro, al fondo de reserva o a los intereses.
- [ ] **P-2** (abogado): ¿el fondo de reserva con mínimo de 5 % es obligatorio para todo condominio, incluidas las viviendas sociales o de interés público?
- [ ] **P-3** (contador): ¿la base del recargo del fondo debe incluir los consumos individuales medidos (agua por remarcador)? ¿Y los gastos ordinarios pagados con el propio fondo?
- [ ] **P-4** (líder del proyecto): ¿el comité debe aprobar la emisión o el cierre en ComVive, o basta con que tenga lectura?
- [ ] **P-5** (abogado o contador): ¿qué categoría de "interés corriente" de la CMF se usa para el tope del 50 % (operaciones no reajustables en moneda nacional, de menos de 90 días o de 90 días o más, y en qué tramo de monto)? ¿La conversión de tasa anual a mensual es simple (÷ 12)?
- [ ] **P-6** (abogado): ¿qué tipo de firma electrónica necesita el aviso para tener mérito ejecutivo (simple o avanzada, Ley 19.799)?
- [ ] **P-7** (contador): ¿es aceptable el orden de imputación de S-12, en particular entre ordinario, fondo y extraordinario dentro de un mismo periodo? ¿Debe poder configurarlo cada comunidad?
- [ ] **P-8** (líder del proyecto): ¿el MVP necesita gastos en UF (honorarios del administrador, contratos de mantención)? Si es así, ¿con la UF de qué fecha se convierte?
- [ ] **P-9** (ingeniero QA y contador): actualizar `docs/qa/comunidades-simuladas.md` para separar la prueba de oro C entre la función de prorrateo de un grupo y la emisión completa por cuentas (CA-3 y CA-4). El analista no modifica ese archivo.
- [ ] **P-10** (líder del proyecto): ¿qué precisión tienen las alícuotas en los reglamentos reales (2, 4 o más decimales)? Afecta el ADR 0007 y la regla C-4.
- [ ] **P-11** (líder del proyecto): ¿se aceptan pagos de terceros sin identificar? ¿Cómo se manejan los depósitos sin unidad asociada hasta conciliarlos?
- [ ] **P-12** (contador): si se anula un pago después del vencimiento, ¿se deben cobrar retroactivamente los intereses de los días en que la deuda estuvo impaga?
- [ ] **P-13** (líder del proyecto): ¿el ex propietario debe conservar acceso a su historial (S-14), o se le entrega un respaldo descargable al salir?

## Referencias

- Ley 21.442 de Copropiedad Inmobiliaria, texto en LeyChile (BCN): <https://www.bcn.cl/leychile/navegar?idNorma=1174663> (XML usado: <https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=1174663>).
  - Art. 2 N° 8 a 11: definiciones.
  - Art. 6: contribución y deudas anteriores a la adquisición.
  - Art. 7: plazo de pago e interés.
  - Art. 8 letras d y e: reglamento, recargo del fondo, multas e intereses.
- Ley 21.442, Capítulo VI "De las obligaciones económicas", reproducción en modulor.cl: <https://modulor.cl/copropiedad/titulo-1/capitulo-vi/de-las-obligaciones-economicas/>.
  - Art. 31: aviso de cobro.
  - Art. 32: mérito ejecutivo.
  - Art. 33: cuenta bancaria exclusiva.
  - Art. 36: suspensión de servicios.
  - Art. 37: extensión del régimen de cobro a intereses, multas y fondo.
  - Art. 38: prorrateo por sectores.
  - Art. 39: fondo común de reserva.
- Reglamento de la Ley 21.442 (DS N° 7 de 2025, MINVU), publicado en el Diario Oficial en enero de 2025: <https://www.diarioconstitucional.cl/2025/01/17/publican-reglamento-de-la-nueva-ley-de-copropiedad-inmobiliaria-que-cambios-trae-para-los-condominios/>.
- Código Civil de Chile, art. 50 (cómputo de plazos) y arts. 1595 a 1597 (imputación del pago): <https://leyes-cl.com/codigo_civil/1595.htm>, <https://leyes-cl.com/codigo_civil/1596.htm>, <https://leyes-cl.com/codigo_civil/1597.htm>.
- Ley 18.010, art. 9 (capitalización de intereses).
- CMF, certificados mensuales de tasas de interés corriente y máxima convencional, publicados en el Diario Oficial: <https://www.diariooficial.interior.gob.cl/publicaciones/2026/10/15/44574/01/2885690.pdf>.
- ComunidadFeliz, centro de ayuda:
  - Multas e intereses: <https://ayuda.comunidadfeliz.com/c%C3%B3mo-fijo-la-tasa-de-inter%C3%A9s-de-la-comunidad>.
  - Configurar la boleta: <https://www.comunidadfeliz.cl/recursos/configurar-la-boleta>.
- `docs/qa/comunidades-simuladas.md`: regla de redondeo y pruebas de oro A, B y C.
- `docs/arquitectura.md`:
  - §4: libro de movimientos, estados de periodo, pesos de participación e idempotencia de pagos.
  - §5: auditoría.
  - §8: preguntas abiertas.
- ADR por escribir: 0005 (libro de movimientos), 0006 (ciclo y cierre de periodos), 0007 (participaciones y redondeo), 0008 (UF), 0013 (Webpay).
