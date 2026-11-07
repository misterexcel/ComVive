# Especificación: Motor de gasto común

Estado: Borrador
Responsable: analista-producto
Aprobación: líder del proyecto

> **Revisión crítica 1: Rechazado → cambios aplicados.** Cambios principales:
>
> - **Intereses (C-1):**
>   - Ahora se calculan con tasas anuales en base 365 y tope diario.
>   - Quedan detrás de un feature flag, como rebanada posterior del MVP.
>   - La tasa CMF pasa a ser un dato global.
>   - Los días no cobrados no se pierden.
> - **Grupos y fondo (M-1, M-2):** la clave de grupo es (cuenta, base de pesos) y hay un fondo por cada grupo ordinario. El prorrateo por consumo sale del MVP.
> - **Movimientos posteriores a la emisión (M-3, M-11):** regla única: van al borrador vigente.
> - **Acceso (M-4, M-5):** el arrendatario ve solo sus propios cargos (en la revisión 2 esto pasó a ser su ámbito) y los ex residentes pierden acceso.
> - **Ajustes (M-6):** acumulan las correcciones previas y usan la foto de participaciones del periodo original.
> - **Imputación (M-7, M-8):** el invariante impide que coexistan deuda y saldo a favor, y el orden de imputación se reescribió.
> - **Participación y desempate (M-9, M-10):** `aliquot_e6`, `sort_order` y la Comunidad D.
> - **Apertura (M-12):** se reserva el movimiento de apertura.
> - **Otros:** cargos $0 sin movimiento, códigos HTTP exactos, casos borde nuevos y simplificaciones de alcance.
>
> **Revisión crítica 2: Aprobado con cambios → cambios aplicados.** No se renumeró ninguna regla ni ningún CA existente; las reglas y los CA nuevos van al final de su serie. Cambios:
>
> - **Ámbito de cada cargo (M-A):** se fija al crearlo. Los saldos se calculan por ámbito, el interés se calcula por ámbito y el ámbito del arrendatario pasa al de la unidad cuando termina su ocupación. Reglas F-9 y E-6, permisos, CA-22 y CA-26 nuevo.
> - **Débito de ajuste (M-B):** pertenece al borrador donde se registra y vence con ese aviso (CA-14).
> - **Fecha efectiva de imputación (M-C):** máx(`paid_on`, vencimiento del cargo). Regla F-11 y CA-27 nuevos.
> - **Recálculo de intereses ya cobrados (M-D):** se hace en ambos sentidos. Regla E-10 y CA-28 nuevos; P-12 queda cerrada.
> - **Fondo de reserva (m-D):** se redondea hacia arriba (techo). Cambia la Comunidad D (CA-4, GOLD-D-04).
> - **Intereses (m-A, m-B, m-C, m-E, m-K):**
>   - Base actual/actual (días del año calendario).
>   - Tasa del reglamento versionada por fecha.
>   - Categoría CMF por defecto.
>   - Flag activo con fecha explícita en CA-6 y CA-8.
> - **Otros (m-F a m-J):** criterios simples para el débito nuevo, la reclasificación, el cierre y la fecha de emisión. El movimiento de apertura usa el código `opening`. CA-9 queda coherente con la Comunidad A.

## Objetivo

Calcular, emitir y cobrar el gasto común mensual de cada unidad de una comunidad. Los montos son enteros en CLP, trazables y reproducibles desde el libro de movimientos. Así el administrador cierra el mes rápido y con confianza, y el residente sabe exactamente qué debe y por qué.

La especificación cubre el MVP. Donde la ley o la práctica contable no son claras, se toma un **supuesto (a validar)** con el código `S-n` (ver la sección de supuestos). Los supuestos permiten avanzar en la fase de prueba. Ninguno es definitivo sin la validación del líder del proyecto y, cuando corresponda, de un abogado o un contador.

> **Citas legales.** Los artículos de la Ley 21.442 se citan según el texto de LeyChile (BCN) y la reproducción de modulor.cl. La numeración exacta se debe verificar contra el texto oficial (P-1).

## Definiciones

- **Periodo:** mes calendario de gastos (`2026-10` = gastos de octubre).
- **Borrador vigente:** el único periodo en estado `borrador` de la comunidad. Siempre existe exactamente uno (regla A-2).
- **Gasto:** egreso de la comunidad registrado en un periodo. Tiene concepto, subcategoría, monto CLP entero, cuenta y base de pesos.
- **Cuenta:** clasificación de cargos y abonos:
  - **Cuentas de cargo:** `ordinario`, `fondo_reserva`, `extraordinario`, `intereses`, `multas`.
  - **Cuenta técnica de pagos:** `pago`.
  - **Movimiento reservado:** apertura, con código `opening` (regla F-10).
- **Base de pesos:** de dónde salen los pesos de prorrateo. En el MVP hay tres:
  - `alicuota`: `aliquot_e6` de todas las unidades de la comunidad.
  - `partes_iguales`: peso 1 para cada unidad de un conjunto explícito de unidades.
  - `monto_directo`: un monto fijo para una unidad, sin prorrateo.
- **Grupo:** conjunto de gastos de un periodo con la misma **clave (cuenta, base de pesos)**. En `partes_iguales`, el conjunto de unidades forma parte de la clave.
- **Cargo:** monto cobrado a una unidad en un periodo y una cuenta. Cada cargo distinto de $0 tiene exactamente un movimiento de débito en el libro.
- **Pago:** dinero recibido para una unidad. Genera un crédito en el libro (cuenta `pago`) y se reparte en **imputaciones** a cargos pendientes.
- **Saldo de una unidad:** Σ débitos − Σ créditos del libro. Si es positivo, la unidad debe. Si es negativo, tiene saldo a favor.
- **`aliquot_e6`:** alícuota legal como entero en escala 10^-6 (18,50 % = 185000; 100 % = 1000000), según `docs/arquitectura.md` §4.
- **`sort_order`:** entero único por comunidad que fija el orden de desempate de las unidades.
- **Foto de participaciones:** copia, guardada al emitir, de las unidades que participaron en el periodo, con su `aliquot_e6`, su `sort_order`, los conjuntos de partes iguales y el porcentaje del fondo.
- **Ámbito:** responsable de un débito dentro de la unidad. Es un atributo fijo que se asigna al crear el movimiento y nunca cambia, salvo el traspaso de la regla F-9.
  - `unidad`: el propietario.
  - `ocupacion:<id>`: un arrendatario concreto, durante su ocupación.
- **Saldo por ámbito:** Σ débitos del ámbito − Σ créditos imputados o disponibles en ese ámbito. La suma de los saldos de todos los ámbitos es el saldo de la unidad.

## Usuarios y permisos

| Rol | Puede ver | Puede hacer |
| --- | --- | --- |
| Administrador | Todo el gasto común de las comunidades donde tiene membresía vigente | Configurar porcentaje del fondo, plazo de vencimiento, tasa del reglamento y `sort_order` (`community.billing.configure`). Crear, editar y eliminar gastos y cargos directos en el borrador vigente (`expense.write`). Emitir (`period.issue`) y cerrar (`period.close`). Registrar y anular pagos manuales (`payment.register`, `payment.void`). Registrar ajustes (`adjustment.create`) |
| Comité | Lo mismo que el administrador, solo de su comunidad y solo lectura | Descargar avisos y reportes. Nada más (ver P-4) |
| Residente propietario | Avisos de cobro, cargos, pagos, imputaciones y saldo de **sus** unidades, completos. Resumen de gastos y saldo de caja de la comunidad | Pagar en línea (Webpay). Descargar sus avisos |
| Residente arrendatario | Solo los movimientos de **su ámbito** (`ocupacion:<id>`), es decir, los cargos emitidos mientras era el ocupante responsable y sus intereses y ajustes (regla F-9) | Pagar en línea; sus pagos se imputan solo a su ámbito |
| Conserje | Nada de este módulo | Nada |
| Ex propietario o ex residente | Nada: pierde el acceso al vencer su membresía (S-14) | Pedir su historial al administrador |

Respuestas de error:

- **403:** un rol con membresía vigente en la comunidad intenta una acción que su rol no permite. Por ejemplo, el comité intenta emitir, o el conserje intenta leer un aviso.
- **404:** el recurso pertenece a otra comunidad, la membresía está vencida, o un residente pide una unidad que no es suya o un movimiento fuera de su ámbito. Se devuelve 404 para no revelar que el recurso existe (`docs/qa/plan-de-pruebas.md`, ISO-8).

Auditoría:

- Toda escritura (gasto, emisión, cierre, pago, anulación, ajuste, configuración) queda en el registro de auditoría.
- También queda toda lectura de deudas de terceros por el administrador o el comité (regla 7 de `CLAUDE.md`).

## Reglas de negocio

### A. Ciclo del periodo

1. **Estados:** `borrador` → `emitido` → `cerrado`. No hay transiciones hacia atrás.
2. **Borrador vigente:**
   - Siempre existe exactamente uno por comunidad.
   - El primero se crea al configurar la comunidad.
   - Al emitir el periodo M se crea automáticamente, en la misma transacción, el borrador M+1.
   - En el borrador, el administrador agrega, edita o elimina gastos y cargos directos. Esos gastos aún no generan cargos.
3. **Emisión** (`period.issue`, solo administrador):
   1. **Validación de alícuotas:** si algún grupo del periodo usa la base `alicuota`, la suma de `aliquot_e6` de las unidades de la comunidad debe ser exactamente 1.000.000. Si no, la emisión se bloquea con el mensaje: "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" (con la suma real, en 4 decimales). Si ningún grupo usa alícuota, esta validación no aplica.
   2. **Validación de grupos:** si un grupo tiene total mayor que $0 y todos sus pesos son 0, la emisión se bloquea con el mensaje: "El grupo <cuenta> / <base> no tiene unidades con participación para repartir $<total>".
   3. **Transacción única.** En una sola transacción:
      - Se guarda la foto de participaciones.
      - Se calculan los cargos (secciones B, C y D) y, si el flag está activo, los intereses (sección E).
      - Se crean los cargos y sus débitos.
      - Se imputan los saldos a favor existentes (regla F-6).
      - Se verifica que cada grupo cuadre con su total.
      - Se fijan la fecha de emisión y la de vencimiento. La fecha de emisión la fija el servidor (fecha actual en hora de Chile); el cliente no la envía.
      - Se asigna el ámbito de cada cargo (regla F-9).
      - Se crea el borrador M+1.

      Si algo falla, no queda nada escrito.
   4. **Idempotencia:** la petición de emisión lleva una clave de idempotencia. Si llega una petición repetida con la misma clave (por ejemplo, un doble clic), se devuelve el mismo resultado y no se crean cargos nuevos. Si llega otra petición distinta sobre un periodo ya emitido, la respuesta es 409 con el mensaje "El periodo ya fue emitido".
   5. **Inmutabilidad:** desde la emisión, los gastos y cargos del periodo no cambian.
4. **Regla única de movimientos posteriores (S-17):** todo pago, anulación, nota de crédito, ajuste o reverso se registra en el **borrador vigente** al momento de registrarlo. Esto incluye los pagos con fecha de un mes cuyo periodo ya se emitió o cerró, los pagos con fecha de un mes que aún no tiene periodo y las confirmaciones Webpay que llegan después de un cierre.
   - Cada movimiento conserva `paid_on` (fecha real del pago) y `recorded_at` (fecha y hora de registro).
   - Un periodo emitido o cerrado no recibe movimientos nuevos.
5. **Cierre** (`period.close`, solo administrador; S-1):
   1. Requisito: el periodo está emitido.
   2. El cierre no hace verificaciones de conciliación, porque la conciliación queda fuera del alcance de esta spec. Nota: la advertencia de pagos sin conciliar se agregará cuando exista la spec de conciliación.
   3. Al cerrar se guarda una foto de saldos por unidad, ámbito y cuenta, verificable contra el libro.
      - La foto considera solo las imputaciones con `recorded_at` ≤ momento del cierre.
      - Las reimputaciones posteriores no la cambian.
   4. Un periodo cerrado es inmutable y rechaza cualquier movimiento con su identificador (regla 6 de `CLAUDE.md`).
6. **Calendario (S-2):** se cobra "mes vencido": los gastos del mes M se emiten a comienzos de M+1. El sistema no fuerza la fecha de emisión.

### B. Tipos de gasto y cargos

1. **Gastos comunes ordinarios** (Ley 21.442, art. 2 N° 9). Van a la cuenta `ordinario` con una de estas subcategorías:
   - **Administración:** remuneraciones y honorarios del personal, del administrador y del conserje, más leyes sociales.
   - **Mantención:** ascensores, aseo, luminarias, seguros, equipos de emergencia.
   - **Reparación:** desperfectos o reemplazo de piezas de bienes comunes.
   - **Uso o consumo:** agua, gas, electricidad y telecomunicaciones de uso común.
2. **Gastos comunes extraordinarios** (Ley 21.442, art. 2 N° 10): todo gasto distinto de los ordinarios, incluidas las obras nuevas. Van a la cuenta `extraordinario` y no generan recargo de fondo (S-4).
3. **Egresos pagados con el fondo de reserva:**
   - Se registran como egreso del fondo, con una referencia de texto libre a la autorización.
   - No se reparten entre las unidades.
   - El aviso los muestra como egresos del fondo.
4. **Cargos directos** (base `monto_directo`):
   - **Consumo individual** (por ejemplo, agua por remarcador): cuenta `ordinario`, subcategoría uso o consumo. El administrador ingresa el monto de cada unidad, calculado fuera de ComVive.
   - **Multa:** cuenta `multas`, con motivo y referencia al reglamento o al acuerdo que la respalda. En el MVP las multas son siempre manuales (S-8).
   - **Otros:** cuenta `ordinario` o `extraordinario`, a elección del administrador.
5. **Montos:** todo monto ingresado es un entero CLP mayor que 0. Un monto 0, negativo o con decimales se rechaza. Las rebajas se hacen como notas de crédito (sección H).

### C. Prorrateo y redondeo

1. **Agrupación:** los gastos del periodo se agrupan por la clave (cuenta, base de pesos). Cada grupo se suma y su total se reparte **una sola vez**. Nunca se reparte gasto por gasto.
2. **Pesos por base:**
   - `alicuota`: el peso de cada unidad es su `aliquot_e6`. Es la base por defecto, porque cada unidad contribuye en proporción a su derecho en los bienes comunes, salvo que el reglamento diga otra cosa (Ley 21.442, art. 6).
   - `partes_iguales`: peso 1 para cada unidad del conjunto y 0 para las demás.
   - `monto_directo`: no se reparte. El cargo es el monto ingresado.
3. **Método del resto mayor** (`docs/qa/comunidades-simuladas.md`), con enteros:
   - `W` = suma de los pesos y `T` = total del grupo.
   - Parte entera de la unidad u: `(T × w_u) div W`. Resto: `(T × w_u) mod W`.
   - Los `T − Σ partes enteras` pesos que faltan se asignan de a uno a los mayores restos.
   - **Desempate:** en un empate de restos gana el menor `sort_order` (S-3).
4. **`sort_order`:**
   - Es un entero único por comunidad.
   - Al crear las unidades, el sistema propone un valor inicial en orden natural del código ("Depto 9" antes que "Depto 10") y el administrador lo puede cambiar.
   - El desempate nunca usa el código como texto.
5. **Cargos de $0:** una unidad con peso 0, o cuya parte resulte $0, no genera cargo ni movimiento en el libro. En el aviso aparece con $0.
6. **Redondeo por cuenta:** cada grupo cuadra por sí solo. El total de una unidad puede diferir en ±1 peso del que resultaría de repartir la suma de todas las cuentas de una vez. Es intencional: el fondo se mantiene y se rinde por separado (Ley 21.442, art. 39; `docs/qa/comunidades-simuladas.md`, Comunidades C y D).

### D. Fondo común de reserva

1. **Destino:** gastos urgentes, extraordinarios o imprevistos, incluidas las indemnizaciones del personal (Ley 21.442, art. 2 N° 11 y art. 39).
2. **Porcentaje:** recargo sobre los gastos comunes ordinarios, fijado por el reglamento o la asamblea, nunca inferior a 5 % (Ley 21.442, art. 8 letra d y art. 39; S-5).
   - Se configura por comunidad en puntos base (500 = 5,00 %).
   - El sistema rechaza valores bajo 500.
3. **Un fondo por cada grupo ordinario (S-4):**
   - Por cada grupo `ordinario` con base `alicuota` o `partes_iguales` y total `O_g`, se forma un grupo `fondo_reserva` con la misma base de pesos.
   - Su total es `F_g = (O_g × pb + 9.999) div 10.000`, es decir, redondeado hacia arriba al peso (techo; S-6). Así el fondo nunca queda bajo el porcentaje mínimo.
   - `F_g` se reparte con el método del resto mayor y los mismos pesos de su grupo ordinario.
   - Los cargos directos ordinarios, los extraordinarios, los intereses, las multas y los egresos del fondo no generan recargo.
4. **Otros ingresos del fondo:** lo recaudado por multas e intereses va al fondo (Ley 21.442, art. 39). El reporte del fondo suma como ingreso lo imputado a cargos de las cuentas `intereses` y `multas`.
5. **Saldo del fondo:** recargos imputados + intereses imputados + multas imputadas − egresos del fondo. Se muestra en el aviso. ComVive no administra inversiones.

### E. Vencimiento, intereses y multas

**Feature flag:** los intereses (reglas E-3 a E-8 y E-10) quedan detrás del flag `billing.interest`, desactivado por defecto. Son una rebanada posterior dentro del MVP. Con el flag apagado, la emisión no calcula intereses.

1. **Vencimiento:** el plazo de pago es de 10 días desde el aviso de cobro, salvo que el reglamento fije otro (Ley 21.442, art. 7).
   - El plazo es configurable. Por defecto son 10 días corridos (S-7).
   - `fecha_vencimiento = fecha_emisión + plazo`. No se corre si cae en día inhábil.
   - Desde el día siguiente al vencimiento, el capital impago de los cargos de ese aviso está en mora.
2. **Multas:** son obligaciones económicas (Ley 21.442, art. 2 N° 8) que regula el reglamento (art. 8 letra e). En el MVP solo existen como cargo directo manual (regla B-4).
3. **Tasa del reglamento:** la mora devenga el interés que fije el reglamento o, en su defecto, el reglamento tipo, y ese interés no puede superar el 50 % del interés corriente bancario (Ley 21.442, art. 7).
   - La comunidad configura la tasa como **tasa anual** en puntos base.
   - Si el reglamento la expresa mensual, se convierte multiplicando por 12 (S-10).
   - Ejemplo: 1,00 % mensual = 1200 pb anuales.
   - **Versiones:** la tasa del reglamento se guarda con fecha de inicio de vigencia. Cada cambio crea una versión nueva y nunca edita las anteriores. `tasa_reglamento_d` es la versión vigente el día d.
   - El flag no se puede activar en una comunidad sin una tasa del reglamento vigente a la fecha de activación. El mensaje es: "Configura la tasa de interés del reglamento antes de activar los intereses".
4. **Tasa de referencia CMF (S-11):**
   - Es un dato **global**, no de cada comunidad, igual que `UF_VALUE`.
   - Cada registro tiene fecha de inicio de vigencia, categoría de operación, tasa anual en puntos base y fuente (certificado CMF en el Diario Oficial).
   - Lo carga el equipo de ComVive, no el administrador.
   - **Categoría por defecto (S-21):** interés corriente para operaciones no reajustables en moneda nacional de menos de 90 días. P-5 sigue abierta para validarla.
   - Tope diario: `tope_d = (tasa_corriente_vigente_el_día_d × 50) div 100`, en pb anuales.
5. **Base del interés (S-9):**
   - Devenga interés solo el capital: la parte impaga de los cargos vencidos de las cuentas `ordinario`, `fondo_reserva` y `extraordinario`.
   - Los intereses y las multas no devengan interés.
   - El capital de cada día se mide al cierre del día, según la fecha efectiva de las imputaciones (regla F-11).
6. **Cálculo (S-10):** interés simple diario con base actual/actual, es decir, con los días del año calendario de cada día (365 o 366). Se calcula al emitir, **una vez por cada ámbito** de la unidad que tenga capital en mora en la ventana.

   ```text
   interés_ámbito = piso( Σ_d capital_ámbito_d × min(tasa_reglamento_d, tope_d) × k_d / (10.000 × 133.590) )
   ```

   - `k_d = 366` si el año de d tiene 365 días, y `k_d = 365` si tiene 366. El número 133.590 es 365 × 366. Con esto, cada día pesa `1 / días_del_año(d)` y el cálculo es entero y exacto.
   - En un año de 365 días, la fórmula equivale a `piso( Σ_d capital_d × tasa_d / 3.650.000 )`.
   - `d` recorre los días desde el inicio de la ventana de intereses hasta el día anterior a la fecha de emisión, ambos incluidos.
   - La ventana empieza el día siguiente al último día ya cobrado. Si nunca se ha cobrado, empieza el día siguiente al vencimiento o en la fecha de activación del flag, lo que sea posterior (S-20).
   - El resultado se trunca al peso, a favor del deudor.
   - Si el resultado es mayor que $0, se crea un cargo de cuenta `intereses`, con el ámbito del capital que lo generó, en el periodo que se emite.
7. **Días sin tope:** si al emitir falta la tasa CMF de algún día de la ventana, el sistema advierte: "Falta la tasa de referencia CMF desde <fecha>. Se emitirá sin intereses y se cobrarán en la próxima emisión". La emisión sigue sin intereses y lo deja en auditoría. **Los días no se pierden:** la ventana no avanza y esos días se cobran en el siguiente cálculo con tope disponible.
8. **Aviso al pagar:** si el flag está activo y la unidad tiene deuda vencida, la pantalla de pago muestra: "Tu deuda está vencida. Se pueden generar intereses hasta la fecha de tu pago, que se cobrarán en el próximo aviso".
9. **Suspensión de servicios:** la ley la permite con 3 o más cuotas impagas (Ley 21.442, art. 36). El MVP no suspende servicios; solo muestra el número de cuotas impagas (regla F-8).
10. **Recálculo de días ya cobrados (S-22).** Aplica cuando un evento cambia el capital de días ya cobrados. Los eventos son:
    - Un crédito con fecha efectiva dentro de esos días: pago manual tardío, confirmación Webpay tardía, nota de crédito o reimputación.
    - La anulación de un pago.

    En ese caso, al registrar el evento el sistema recalcula, con la fórmula E-6, el interés de cada cargo de intereses afectado del ámbito, sobre su misma ventana y con el capital corregido. La diferencia se registra con la fórmula H-2 (`correcto − (original + ajustes previos)`):
    - Si la diferencia es negativa, es una **nota de crédito** en la cuenta `intereses`.
    - Si es positiva, es un **débito de ajuste** en la cuenta `intereses`.

    Ambos se registran en el borrador vigente, con `adjusts_entry_id` apuntando al cargo de intereses original y con su ámbito. Así P-12 queda resuelta: los intereses se corrigen hacia atrás en ambos sentidos.

### F. Pagos, imputación y saldos

1. **Registro de pagos:**
   - Por Webpay: se registra automáticamente al confirmarse. `paid_on` es la fecha de confirmación de Transbank.
   - Manual: lo registra el administrador. Medios: transferencia, depósito, efectivo, cheque u otro.
   - Todo pago tiene unidad, monto CLP entero > 0, `paid_on`, `recorded_at`, medio y referencia. Un `paid_on` posterior a la fecha actual (hora de Chile) se rechaza.
   - El libro registra un crédito en la cuenta `pago`. El reparto por cuenta sale de las imputaciones.
2. **Idempotencia:** el par (`method`, `external_ref`) es único por comunidad (`docs/arquitectura.md` §4). Un reintento devuelve el pago existente.
3. **Posible duplicado manual (solo advertencia):** si ya existe un pago con la misma unidad, monto, fecha y medio, el formulario muestra: "Ya existe un pago de $<monto> para <unidad> con fecha <dd-mm-aaaa> por <medio>. Revisa que no sea un duplicado". El registro no se bloquea.
4. **Anulación:**
   - Un pago no se borra ni se edita. Se anula con un débito de reverso en la cuenta `pago`, que apunta al pago y lleva motivo.
   - El reverso se registra en el borrador vigente (regla A-4) y deshace las imputaciones del pago.
   - Solo el administrador anula pagos manuales.
   - La anulación de pagos Webpay queda fuera de alcance.
5. **Orden de imputación (S-12).** ComVive imputa como lo haría el acreedor en la carta de pago (Código Civil, art. 1596). En el MVP el pagador no elige a qué deuda se aplica su pago. El orden es:
   1. Intereses vencidos, del más antiguo al más reciente.
   2. Capital vencido, del periodo más antiguo al más reciente. Dentro de un periodo: `ordinario` → `fondo_reserva` → `extraordinario`.
   3. Multas vencidas, de la más antigua a la más reciente.
   4. Lo no vencido, con el mismo orden: intereses, capital y multas.
   5. El remanente queda como saldo a favor.
6. **Invariante (S-18):** dentro de un mismo ámbito de imputación, nunca coexisten deuda pendiente y saldo a favor. Por eso se reimputa en cada uno de estos eventos:
   - **Crédito nuevo (pago):** se imputa con el orden de F-5 y el remanente queda a favor.
   - **Nota de crédito:** se imputa primero al cargo que ajusta. Si ese cargo ya estaba pagado, la parte liberada del pago se reimputa con el orden de F-5, conservando el `paid_on` original del pago.
   - **Reverso de un pago:** sus cargos vuelven a quedar pendientes y los saldos a favor del ámbito se aplican a ellos, del crédito más antiguo al más reciente.
   - **Débito nuevo (emisión o ajuste de débito):** los saldos a favor del ámbito se aplican a todos los débitos pendientes del ámbito, incluido el nuevo, con el orden de F-5.

   Las imputaciones no son movimientos del libro: no cambian el saldo total, solo su reparto. Cada cambio queda registrado y auditado.
7. **Saldos:** siempre se calculan desde el libro (regla 5 de `CLAUDE.md`).
   - Saldo por cuenta = cargos de la cuenta − notas de crédito de la cuenta − imputaciones de pagos a la cuenta.
   - Ningún saldo es editable.
8. **Cuotas impagas:** cantidad de periodos emitidos y vencidos con capital pendiente. Se muestra por unidad.
9. **Responsable y ámbito (S-14, S-19):**
   - **Deuda y aviso legal:** la deuda es de la unidad y sigue al dueño, incluidas las deudas anteriores a su adquisición (Ley 21.442, art. 6). El aviso legal se dirige al propietario registrado a la fecha de emisión.
   - **Ámbito de cada débito.** Se asigna al crearlo y es fijo:
     - **Cargos del periodo:** van al ámbito del ocupante responsable a la fecha de emisión. Si hay un arrendatario con ocupación vigente ese día, el ámbito es `ocupacion:<id>`; si no, es `unidad`.
     - **Intereses:** van al ámbito del capital que los genera (regla E-6).
     - **Ajustes y notas de crédito:** van al ámbito del movimiento al que apuntan (`adjusts_entry_id`).
     - **Cargo nuevo por reclasificación** (regla H-3): va al ámbito de los cargos originales de la unidad en ese periodo.
   - **Ámbito de los créditos:**
     - Los pagos del arrendatario van a su ámbito.
     - Los pagos del propietario van al ámbito `unidad`.
     - En un pago manual, el administrador elige el ámbito. Por defecto es el ámbito `unidad`.
     - Cada crédito se imputa solo a débitos de su ámbito, y su remanente queda a favor en ese mismo ámbito.
   - **Visibilidad:**
     - El arrendatario ve solo su ámbito. Su vista del aviso muestra como saldo anterior solo el de su ámbito.
     - El propietario ve todos los ámbitos de su unidad.
   - **Aviso legal:** muestra, por cada ámbito, la deuda bruta y el saldo a favor, **sin compensarlos entre ámbitos**, y además el total de la unidad.
   - **Fin de la ocupación:** al terminar la ocupación de un arrendatario, la deuda y el saldo a favor de su ámbito pasan al ámbito `unidad`. El traspaso queda registrado en auditoría y se reimputa según la regla F-6.
10. **Saldos de apertura (reservado):**
    - Se reserva el tipo de movimiento apertura, con código `opening`: un débito o crédito por unidad, ámbito y cuenta, con referencia de origen (sistema anterior, documento, fecha de corte).
    - Su carga, validación y conciliación se definen en una especificación propia de migración, que aún no existe.
11. **Fecha efectiva de imputación (S-23):** toda imputación o reimputación tiene una fecha efectiva:

    ```text
    fecha_efectiva = máx(paid_on del crédito, fecha de vencimiento del cargo imputado)
    ```

    - Para una nota de crédito, `paid_on` es la fecha de vencimiento del cargo que ajusta.
    - El capital de un cargo deja de contar para el interés desde el cierre del día de la fecha efectiva (regla E-5).

### G. Aviso de cobro

1. **Contenido mínimo legal** (Ley 21.442, art. 31):
   - La proporción en que la unidad contribuye a los gastos comunes y al fondo de reserva.
   - Los intereses y multas adeudados a la fecha.
   - El total de ingresos y egresos del mes.
   - El saldo de caja de la comunidad.
2. **Contenido adicional (S-15):**
   - Comunidad, unidad y propietario. El RUT va enmascarado, salvo para el titular.
   - Periodo, fecha de emisión, fecha de vencimiento y número correlativo.
   - Gastos del periodo por subcategoría. Las remuneraciones se muestran **agregadas** como "Remuneraciones del personal", sin detalle por persona.
   - Cargos de la unidad por cuenta (las unidades con $0 aparecen con $0), ajustes con su motivo, saldo anterior, pagos recibidos, total a pagar, saldo del fondo, medios de pago y nombre del administrador.
3. **Firma:** el aviso firmado por el administrador, en forma presencial o electrónica, tiene mérito ejecutivo (Ley 21.442, art. 32). En el MVP lleva la identificación del administrador como firma electrónica simple (P-6).
4. **Saldo de caja:** en el MVP lo ingresa el administrador al emitir, con monto y fecha de corte (S-16). Los ingresos y egresos del mes salen de los pagos y los gastos registrados.
5. **Documento:** el aviso se guarda como PDF al emitir. Se puede reenviar, nunca regenerar con otros montos.

### H. Ajustes y corrección de periodos

1. **Dónde se corrige:** un error en un periodo emitido o cerrado se corrige solo con ajustes en el borrador vigente.
   - Cada ajuste es un débito (si la diferencia es positiva) o una nota de crédito (si es negativa).
   - Va por unidad y cuenta, con motivo obligatorio y `adjusts_entry_id` apuntando al cargo original.
2. **Fórmula del ajuste (por unidad y cuenta del grupo corregido):**

   ```text
   ajuste = cargo_correcto − (cargo_original + Σ ajustes previos del mismo grupo y unidad)
   ```

   - `cargo_correcto` se recalcula con la **foto de participaciones del periodo original** (unidades, `aliquot_e6`, `sort_order`, conjuntos y porcentaje del fondo) y con el total corregido del grupo.
   - Si cambia `O_g`, el fondo del grupo se recalcula igual.
   - Así, el cargo original más todos sus ajustes es siempre igual a la última distribución correcta, por muchas correcciones que se hagan.
3. **Reclasificación:**
   - Si un gasto cambia de cuenta o de base de pesos, se generan dos ajustes: la reversión de su efecto en el grupo de origen y su aplicación en el grupo de destino, ambos con la fórmula H-2.
   - Si solo cambia la subcategoría (misma cuenta y base), no hay movimiento. Queda como nota en el aviso del borrador vigente.
   - Si en el grupo de destino la unidad no tenía un cargo original, el ajuste es un **cargo nuevo** en el borrador vigente que apunta al gasto corregido (no a un movimiento). Su ámbito sigue la regla F-9.
4. **Avisos anteriores:** los ajustes no modifican ningún cargo ni aviso anterior. Aparecen en el aviso siguiente como "Ajuste periodo AAAA-MM: motivo".
5. **Periodo y vencimiento de un débito de ajuste:**
   - El débito pertenece al periodo del borrador donde se registra y vence con el aviso de ese borrador: `fecha_emisión del borrador + plazo`.
   - Devenga interés desde el día siguiente a ese vencimiento, nunca desde el vencimiento del cargo original.
   - Las notas de crédito también se registran en el borrador vigente, pero se imputan al cargo que ajustan (regla F-6).

## Criterios de aceptación

Las comunidades A, B, C y D vienen de `docs/qa/comunidades-simuladas.md`.

- Las fechas, tasas, consumos y gastos adicionales son **datos de prueba**.
- `sort_order` de cada comunidad:
  - A: 101 = 1, 102 = 2, 201 = 3, 202 = 4.
  - B: Casa 1 = 1, Casa 2 = 2, Casa 3 = 3.
  - C: 11 = 1, 12 = 2, 21 = 3, 22 = 4, 31 = 5.
  - D: Depto 1 a 4 = 1 a 4.
- Salvo indicación, el fondo es 5 % (500 pb), el plazo de vencimiento es de 10 días corridos y el flag `billing.interest` está apagado.

**CA-1 · Emisión base por cuenta (Comunidad A)**

- Dado que la Comunidad A tiene el borrador `2026-10` con un grupo (ordinario, alícuota) de $1.000.000 (conserje $650.000, electricidad $180.000, ascensor $120.000, aseo $50.000)
- Cuando el administrador lo emite el 2026-11-01
- Entonces se crea el grupo de fondo (fondo de reserva, alícuota) con F = (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 = $50.000.
- Y los cargos son:

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 101 | $200.000 | $10.000 | $210.000 |
  | Depto 102 | $250.000 | $12.500 | $262.500 |
  | Depto 201 | $250.000 | $12.500 | $262.500 |
  | Depto 202 | $300.000 | $15.000 | $315.000 |
  | **Suma** | **$1.000.000** | **$50.000** | **$1.050.000** |

- Y el vencimiento es el 2026-11-11.
- Y `2026-10` queda emitido y `2026-11` queda creado como borrador vigente.

**CA-2 · Partes iguales con desempate (Comunidad B)**

- Dado un grupo (ordinario, partes iguales {Casa 1, Casa 2, Casa 3}) de $95.238 y alícuotas no cargadas
- Cuando se emite
- Entonces la emisión no exige que las alícuotas sumen 100 %, porque no hay grupos por alícuota.
- Y el fondo es (95.238 × 500 + 9.999) div 10.000 = 47.628.999 div 10.000 = $4.762 (techo de 4.761,9).
- Y el ordinario es 95.238 / 3 = $31.746 exacto para cada casa.
- Y el fondo de cada casa es 4.762 div 3 = 1.587, con resto 1 para cada una. El peso que falta va a la Casa 1 por su `sort_order` menor.
- Y los totales son Casa 1 $33.334, Casa 2 $33.333 y Casa 3 $33.333, que suman $100.000.

**CA-3 · Resto mayor con varios pesos y empate (Comunidad C)**

- Dado un grupo (ordinario, alícuota) de $1.175.778 con `aliquot_e6` 185000, 195000, 200000, 210000 y 210000
- Cuando se emite
- Entonces el fondo es (1.175.778 × 500 + 9.999) div 10.000 = 587.898.999 div 10.000 = $58.789 (techo de 58.788,9).
- Y en el ordinario los productos 217.518.930.000, 229.276.710.000, 235.155.600.000, 246.913.380.000 y 246.913.380.000 (÷ 1.000.000) dan partes enteras que suman 1.175.775. Los 3 pesos que faltan van a los restos 930.000 (Depto 11), 710.000 (Depto 12) y 600.000 (Depto 21).
- Y en el fondo los productos 10.875.965.000, 11.463.855.000, 11.757.800.000, 12.345.690.000 y 12.345.690.000 dan partes enteras que suman 58.785. Los 4 pesos que faltan van a los restos 965.000, 855.000 y 800.000, y en el empate de 690.000 gana el Depto 22 (`sort_order` 4) sobre el Depto 31 (`sort_order` 5).
- Y los cargos son:

  | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- |
  | Depto 11 | $217.519 | $10.876 | $228.395 |
  | Depto 12 | $229.277 | $11.464 | $240.741 |
  | Depto 21 | $235.156 | $11.758 | $246.914 |
  | Depto 22 | $246.913 | $12.346 | $259.259 |
  | Depto 31 | $246.913 | $12.345 | $259.258 |
  | **Suma** | **$1.175.778** | **$58.789** | **$1.234.567** |

- Y los Deptos 21 y 31 difieren en ±1 peso de la prueba de oro C, que reparte un solo monto (regla C-6).

**CA-4 · Alícuotas en escala 10^-6 (Comunidad D, GOLD-D-01 a GOLD-D-04)**

- Dado un grupo (ordinario, alícuota) de $876.543 con `aliquot_e6` 187345, 243218, 256789 y 312648
- Cuando se emite
- Entonces el fondo es (876.543 × 500 + 9.999) div 10.000 = 438.281.499 div 10.000 = $43.828. Es el techo de 43.827,15; con el redondeo anterior (mitad hacia arriba) era $43.827.
- Y en el fondo los productos 43.828 × `aliquot_e6` son 8.210.956.660, 10.659.758.504, 11.254.548.292 y 13.702.736.544. Las partes enteras suman 8.210 + 10.659 + 11.254 + 13.702 = 43.825, y los 3 pesos que faltan van a los restos 956.660 (Depto 1), 758.504 (Depto 2) y 736.544 (Depto 4).
- Y los cargos son:

  | Prueba | Unidad | Ordinario | Fondo | Total |
  | --- | --- | --- | --- | --- |
  | GOLD-D-01 | Depto 1 | $164.216 | $8.211 | $172.427 |
  | GOLD-D-02 | Depto 2 | $213.191 | $10.660 | $223.851 |
  | GOLD-D-03 | Depto 3 | $225.087 | $11.254 | $236.341 |
  | GOLD-D-04 | Depto 4 | $274.049 | $13.703 | $287.752 |
  | | **Suma** | **$876.543** | **$43.828** | **$920.371** |

- **Diferencia con la prueba de oro D:** `docs/qa/comunidades-simuladas.md` usa un fondo fijo de $43.827 y espera $287.751 en GOLD-D-04. Con el techo de la regla D-3, la emisión da un fondo de $43.828 y $287.752 en GOLD-D-04. GOLD-D-01 a 03 no cambian. QA debe actualizar la prueba de oro D (P-15).

**CA-5 · Pago parcial e imputación (Comunidad A)**

- Dado `2026-10` emitido como en CA-1
- Cuando el Depto 101 paga $100.000 por transferencia, con `paid_on` 2026-11-05
- Entonces el crédito se registra en el periodo `2026-11` (borrador vigente).
- Y el pago se imputa al ordinario de `2026-10`. Queda pendiente un ordinario de $100.000 y un fondo de $10.000, con saldo de $110.000.

**CA-6 · Interés por mora y pago posterior (Comunidad A, flag activo)**

- Dado que la Comunidad A tiene el flag `billing.interest` activo desde el 2026-11-01, una tasa del reglamento de 1200 pb anuales (1,00 % mensual × 12) vigente desde el 2026-11-01 y una tasa CMF de referencia de 3000 pb (dato de prueba) vigente desde antes del 2026-11-01, con tope diario de 1500 pb
- Y el Depto 101 no tiene arrendatario, así que todo está en el ámbito `unidad`
- Y el Depto 101 tiene $110.000 de capital vencido desde el 2026-11-12, como en CA-5
- Cuando se emite `2026-11` el 2026-12-01, con los mismos gastos de CA-1
- Entonces la ventana va del 2026-11-12 al 2026-11-30 (19 días) y el interés es piso(110.000 × 19 × 1200 / 3.650.000) = piso(2.508.000.000 / 3.650.000) = piso(687,12) = $687.
- Y el saldo es 110.000 + 687 + 210.000 = $320.687.
- Cuando el Depto 101 paga $150.000 con `paid_on` 2026-12-05
- Entonces la imputación es:
  - Capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000.
  - Lo no vencido (vence el 2026-12-11): interés $687 y ordinario `2026-11` $39.313.
- Y queda pendiente un ordinario `2026-11` de $160.687 y un fondo `2026-11` de $10.000, con saldo de $170.687.
- Y si no hay más pagos, en la emisión del 2027-01-01 el interés suma dos tramos:
  - Del 2026-12-01 al 2026-12-04, sobre los $110.000 de `2026-10`: 4 × 110.000 = 440.000 peso-días. Los días no se pierden por haber emitido el 2026-12-01.
  - Del 2026-12-12 al 2026-12-31, sobre los $170.687 de capital de `2026-11`: 20 × 170.687 = 3.413.740 peso-días.
- Y el interés total es piso(3.853.740 × 1200 / 3.650.000) = piso(1.266,98) = $1.266.

**CA-7 · Tasa del reglamento sobre el tope**

- Dado que el tope vigente es 1500 pb anuales
- Cuando el administrador configura una tasa del reglamento de 1,50 % mensual (1800 pb anuales)
- Entonces se guarda la tasa, el sistema advierte "La tasa configurada supera el tope legal vigente (15,00 % anual). Se aplicará el tope" y el cálculo usa min(1800, 1500) = 1500 pb.

**CA-8 · Mes de 31 días con tasa igual al tope (flag activo)**

- Dado que la Comunidad A tiene el flag activo desde el 2026-11-01, una tasa del reglamento de 1500 pb vigente desde el 2026-11-01 y una tasa CMF de 3000 pb, con tope de 1500 pb, igual a la tasa del reglamento
- Y el Depto 202 tiene $315.000 impagos de `2026-10` (vencido el 2026-11-11) y ningún pago
- Y `2026-11` se emitió el 2026-12-01 sin gastos, con cargos $0 (como en CA-20). En esa emisión se cobraron intereses hasta el **2026-11-30**, que es el último día cobrado, así que el capital vencido de diciembre se mantiene en $315.000
- Cuando se emite `2026-12` el 2027-01-01
- Entonces la ventana va del 2026-12-01 al 2026-12-31 (31 días) en un año de 365 días, y el interés es piso(315.000 × 31 × 1500 / 3.650.000) = piso(14.647.500.000 / 3.650.000) = piso(4.013,01) = $4.013.
- Y no supera el tope legal proporcional a los días: 315.000 × 15 % × 31 / 365 = 4.013,01. La tasa efectiva anualizada es exactamente 15 %.
- Y no da el resultado de la convención de 30 días de la versión anterior, que cobraba 315.000 × 1,25 % × 31 / 30 = 4.068,75 y superaba el tope.

**CA-9 · Pago mayor a la deuda (Comunidad A)**

- Dado que el Depto 201, ocupado por su propietario según la Comunidad A, debe $262.500 de `2026-10`
- Cuando su propietario paga $300.000 el 2026-11-08
- Entonces se imputan $250.000 al ordinario y $12.500 al fondo, y quedan $37.500 a favor (saldo −$37.500).
- Cuando se emite `2026-11` con cargos de $250.000 de ordinario y $12.500 de fondo
- Entonces los $37.500 se imputan al ordinario de `2026-11` y la unidad debe $225.000.

**CA-10 · Webpay duplicado**

- Dado un pago Webpay de $315.000 del Depto 202 con la orden `OC-2026-0001`
- Cuando la confirmación llega dos veces
- Entonces hay un solo pago y un solo crédito, y el saldo del Depto 202 es $0.

**CA-11 · Posible duplicado manual**

- Dado un pago manual de $262.500 del Depto 201 por transferencia con fecha 2026-11-09
- Cuando el administrador ingresa otro pago con esos mismos datos
- Entonces el formulario muestra "Ya existe un pago de $262.500 para Depto 201 con fecha 09-11-2026 por transferencia. Revisa que no sea un duplicado" y permite guardar.
- Cuando lo guarda y después lo anula por duplicado
- Entonces se registra un débito de reverso de $262.500 en la cuenta `pago`, con motivo, en el borrador vigente. El duplicado estaba entero como saldo a favor, así que el saldo vuelve a $0. Ningún pago se borra.

**CA-12 · Anulación con reimputación del saldo a favor (Comunidad A)**

- Dado que el Depto 202 debe $315.000 de `2026-10` y paga $315.000 con cheque el 2026-11-05 (pago P1) y $100.000 por transferencia el 2026-11-06 (pago P2, que queda a favor)
- Cuando el 2026-11-20 el administrador anula P1 porque el cheque fue protestado
- Entonces se registra un débito de reverso de $315.000 en `2026-11`.
- Y los $100.000 de P2 se reimputan al ordinario de `2026-10`.
- Y queda pendiente un ordinario de $200.000 y un fondo de $15.000, con saldo de $215.000 y sin saldo a favor.

**CA-13 · Corrección de un periodo cerrado (Comunidad A)**

- Dado que `2026-10` está cerrado, que la electricidad se registró en $180.000 cuando la factura era de $170.000, y que el Depto 101 tiene `2026-10` pagado completo y `2026-11` ($210.000, vencido el 2026-12-11) sin pagar
- Cuando el 2026-12-15 el administrador registra la corrección en el borrador vigente `2026-12`
- Entonces el sistema recalcula con la foto de `2026-10`: O = $990.000 y F = $49.500.
- Y se generan estas notas de crédito:

  | Unidad | Ordinario | Fondo |
  | --- | --- | --- |
  | Depto 101 | −$2.000 | −$100 |
  | Depto 102 | −$2.500 | −$125 |
  | Depto 201 | −$2.500 | −$125 |
  | Depto 202 | −$3.000 | −$150 |
  | **Suma** | **−$10.000** | **−$500** |

- Y en el Depto 101 se liberan $2.100 del pago de `2026-10`, que se reimputan al ordinario vencido de `2026-11`. Ese ordinario queda en $197.900 pendiente, más el fondo de $10.000: saldo $207.900.
- Y ningún movimiento de `2026-10` cambia.

**CA-14 · Dos correcciones sucesivas del mismo grupo (Comunidad A)**

- Dado CA-13 aplicado, y que el Depto 101 no tiene deuda ni saldo a favor al registrar esta segunda corrección
- Cuando en el borrador vigente `2027-01` se registra que la factura real era de $175.000
- Entonces el cargo correcto se calcula con O = $995.000 y F = (995.000 × 500 + 9.999) div 10.000 = 497.509.999 div 10.000 = $49.750.
- Y el fondo exacto es 9.950; 12.437,5; 12.437,5 y 14.925. Las partes enteras suman 49.749 y el peso que falta se lo lleva el Depto 102 en el empate con el Depto 201, por su menor `sort_order`.
- Y con ajuste = correcto − (original + ajustes previos), los débitos son:

  | Unidad | Ordinario correcto | Ajuste ordinario | Fondo correcto | Ajuste fondo |
  | --- | --- | --- | --- | --- |
  | Depto 101 | $199.000 | 199.000 − 198.000 = +$1.000 | $9.950 | 9.950 − 9.900 = +$50 |
  | Depto 102 | $248.750 | +$1.250 | $12.438 | 12.438 − 12.375 = +$63 |
  | Depto 201 | $248.750 | +$1.250 | $12.437 | +$62 |
  | Depto 202 | $298.500 | +$1.500 | $14.925 | +$75 |
  | **Suma** | **$995.000** | **+$5.000** | **$49.750** | **+$250** |

- Y para cada unidad, original + ajuste 1 + ajuste 2 es igual al cargo correcto.
- Y los débitos de ajuste pertenecen al periodo `2027-01`, donde se registran (regla H-5), no a `2026-10`. Si `2027-01` se emite el 2027-02-01, vencen el 2027-02-11.
- Y el Depto 101 queda con $1.050 pendientes no vencidos ($1.000 de ordinario y $50 de fondo de `2027-01`, ámbito `unidad`), que aparecen en su aviso de `2027-01` como "Ajuste periodo 2026-10: corrección factura electricidad".
- Y con el flag activo, ese monto devengaría interés solo desde el 2027-02-12.

**CA-15 · Pago tardío después del cierre: periodo exacto**

- Dado que `2026-10` está cerrado, `2026-11` emitido el 2026-12-01 y `2026-12` es el borrador vigente
- Cuando el 2026-12-03 el administrador registra un pago con `paid_on` 2026-10-31
- Entonces el crédito queda en el periodo `2026-12`, con `paid_on` 2026-10-31 y `recorded_at` 2026-12-03.
- Y todo intento de registrar un gasto, cargo o movimiento con periodo `2026-10` se rechaza.
- Y un pago con `paid_on` posterior a la fecha actual se rechaza con "La fecha de pago no puede ser futura".

**CA-16 · Extraordinario sin recargo (Comunidad B)**

- Dado un grupo (extraordinario, partes iguales) de $300.000 y un grupo (ordinario, partes iguales) de $95.238
- Cuando se emite
- Entonces cada casa recibe un extraordinario de $100.000 y el fondo sigue siendo $4.762.

**CA-17 · Consumo de agua como monto directo (Comunidad A)**

- Dado que el administrador ingresa cargos directos ordinarios de agua de $24.000 (101), $36.000 (102), $30.000 (201) y $30.000 (202)
- Cuando se emite
- Entonces esos cargos se crean tal cual, suman $120.000 y no generan recargo de fondo.

**CA-18 · Unidad con participación 0 (Comunidad C más Bodega B1)**

- Dada la unidad Bodega B1 con `aliquot_e6` 0 y `sort_order` 6, con las demás alícuotas sumando 1.000.000
- Cuando se emite el periodo de CA-3
- Entonces la Bodega B1 no tiene cargos ni movimientos, su aviso muestra $0 y los demás cargos son idénticos a CA-3.
- Cuando se le carga una multa de $30.000 en el periodo siguiente
- Entonces se crea un cargo de cuenta `multas` por $30.000.

**CA-19 · Alícuotas que no suman 100 %**

- Dado que en la Comunidad C el Depto 31 queda con `aliquot_e6` 209900 (suma 999.900) y hay un grupo por alícuota
- Cuando se intenta emitir
- Entonces la emisión se bloquea con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" y no se crea nada.

**CA-20 · Periodo sin gastos (Comunidad B)**

- Dado un borrador sin gastos ni cargos
- Cuando se intenta emitir
- Entonces el sistema pide confirmación con el mensaje "El periodo no tiene gastos. Se emitirán avisos con cargo $0".
- Y al confirmar no se crean cargos ni movimientos, cada casa recibe su aviso con el saldo anterior y el saldo de caja, y se crea el borrador siguiente.

**CA-21 · Cambio de propietario (Comunidad A)**

- Dado que el Depto 201 debe $262.500 de `2026-10` y se vende el 2026-11-15
- Cuando el administrador registra al nuevo propietario desde esa fecha y emite `2026-11` el 2026-12-01
- Entonces el cargo de `2026-11` es completo ($262.500), sin prorrateo por días.
- Y el aviso va al nuevo propietario con un saldo de $525.000, que incluye la deuda anterior (Ley 21.442, art. 6).
- Y el propietario anterior, con la membresía vencida, recibe 404 al consultar la unidad. Su historial lo obtiene pidiéndolo al administrador.

**CA-22 · Arrendatario que paga con deuda anterior en la unidad (Comunidad A)**

- Dado que la ocupación del arrendatario anterior del Depto 102 terminó el 2026-10-31
- Y que `2026-10` se emitió el 2026-11-01 sin arrendatario vigente, así que su cargo de $262.500 quedó en el ámbito `unidad` y está impago
- Y que un nuevo arrendatario (ocupación O-1) ingresa el 2026-11-15
- Cuando se emite `2026-11` el 2026-12-01 con $262.500 para el Depto 102
- Entonces ese cargo queda en el ámbito `ocupacion:O-1`, porque O-1 es el ocupante responsable a la fecha de emisión.
- Y el arrendatario ve solo su ámbito: total $262.500 y saldo anterior $0.
- Cuando el arrendatario paga $262.500 por Webpay el 2026-12-05
- Entonces el pago se imputa solo a su ámbito: ordinario `2026-11` $250.000 y fondo `2026-11` $12.500. No se aplica a `2026-10`, aunque sea más antiguo.
- Y el saldo del ámbito `ocupacion:O-1` es $0 y el del ámbito `unidad` es $262.500.
- Y el aviso legal al propietario muestra las dos líneas por separado, sin compensarlas: ámbito `unidad` con deuda $262.500 y saldo a favor $0; ámbito arrendatario con deuda $0 y saldo a favor $0. El total de la unidad es $262.500.
- Y si el arrendatario pide un cargo de `2026-10`, recibe 404.

**CA-23 · Aislamiento entre comunidades y unidades**

- Dado un administrador con membresía solo en la Comunidad A
- Cuando lee los cargos de una unidad de la Comunidad B, o registra un pago en ella
- Entonces en ambos casos recibe 404 y no se escribe nada.
- Dado el residente propietario del Depto 101
- Cuando lee o paga cargos del Depto 102
- Entonces en ambos casos recibe 404.

**CA-24 · Permisos por rol**

- Dado un miembro del comité de la Comunidad A
- Cuando intenta emitir, cerrar, registrar un pago o crear un gasto
- Entonces recibe 403 y nada cambia.
- Dado un conserje de la Comunidad A
- Cuando intenta leer un aviso o un saldo
- Entonces recibe 403.

**CA-25 · Emisión idempotente**

- Dado el borrador `2026-10` de la Comunidad A
- Cuando llegan dos peticiones de emisión con la misma clave de idempotencia
- Entonces existe una sola emisión, con los cargos de CA-1 una sola vez, y ambas respuestas son iguales.
- Cuando llega una petición con otra clave
- Entonces la respuesta es 409 con el mensaje "El periodo ya fue emitido".

**CA-26 · Intereses por ámbito con arrendatario y deuda anterior del propietario (Comunidad A, flag activo)**

- Dado el escenario de CA-22, con el flag activo desde el 2026-11-01, una tasa del reglamento de 1200 pb vigente desde el 2026-11-01 y una tasa CMF de 3000 pb (tope 1500 pb)
- Cuando se emite `2026-11` el 2026-12-01
- Entonces el ámbito `unidad` genera un interés de piso(262.500 × 19 × 1200 / 3.650.000) = piso(5.985.000.000 / 3.650.000) = piso(1.639,72) = $1.639, por los días del 2026-11-12 al 2026-11-30.
- Y el ámbito `ocupacion:O-1` no genera interés, porque aún no tiene capital vencido.
- Cuando el arrendatario paga $262.500 por Webpay con `paid_on` 2026-12-20, después del vencimiento del 2026-12-11
- Entonces se imputa al ordinario ($250.000) y al fondo ($12.500) de `2026-11` de su ámbito, con fecha efectiva máx(2026-12-20, 2026-12-11) = 2026-12-20.
- Cuando se emite `2026-12` el 2027-01-01, con $262.500 para el Depto 102 (ámbito `ocupacion:O-1`)
- Entonces el interés del ámbito `unidad` es piso(262.500 × 31 × 1200 / 3.650.000) = piso(9.765.000.000 / 3.650.000) = piso(2.675,34) = $2.675, por los días del 2026-12-01 al 2026-12-31.
- Y el interés del ámbito `ocupacion:O-1` es piso(262.500 × 8 × 1200 / 3.650.000) = piso(2.520.000.000 / 3.650.000) = piso(690,41) = $690, por los días del 2026-12-12 al 2026-12-19.
- Y el aviso legal de `2026-12` al propietario muestra:

  | Ámbito | Deuda bruta | Saldo a favor |
  | --- | --- | --- |
  | `unidad` | 262.500 + 1.639 + 2.675 = $266.814 | $0 |
  | `ocupacion:O-1` | 262.500 + 690 = $263.190 | $0 |
  | **Total de la unidad** | **$530.004** | **$0** |

- Y el arrendatario ve solo $263.190.
- Cuando la ocupación O-1 termina el 2027-01-31 sin más pagos
- Entonces los $263.190 pasan al ámbito `unidad`, que queda con $530.004.

**CA-27 · Fecha efectiva al reimputar después de anular un pago (Comunidad A, flag activo)**

- Dado el escenario de CA-12, con el flag activo desde el 2026-11-01, una tasa del reglamento de 1200 pb y un tope de 1500 pb
- Cuando el 2026-11-20 se anula P1 y los $100.000 de P2 (`paid_on` 2026-11-06) se reimputan al ordinario de `2026-10`
- Entonces la fecha efectiva de esa reimputación es máx(2026-11-06, 2026-11-11) = 2026-11-11, no el 2026-11-20.
- Y al emitir `2026-11` el 2026-12-01, el capital es $215.000 en todos los días del 2026-11-12 al 2026-11-30 (19 días). El interés es piso(215.000 × 19 × 1200 / 3.650.000) = piso(4.902.000.000 / 3.650.000) = piso(1.343,01) = $1.343.
- Y no es $1.606, que es lo que daría tomar el 2026-11-20 como fecha efectiva: 315.000 × 8 días + 215.000 × 11 días.
- Y el saldo tras emitir es 215.000 + 1.343 + 315.000 = $531.343.

**CA-28 · Pago registrado con fecha dentro de días ya cobrados, y su anulación (Comunidad A, flag activo)**

- Dado el estado de CA-6 inmediatamente después de emitir `2026-11` el 2026-12-01: el interés de $687 cubre del 2026-11-12 al 2026-11-30 y el saldo es $320.687
- Cuando el 2026-12-03 el administrador registra una transferencia de $110.000 con `paid_on` 2026-11-20, que el propietario había hecho y no se había registrado (en lugar del pago de $150.000 de CA-6)
- Entonces se imputa al capital vencido: ordinario `2026-10` $100.000 y fondo `2026-10` $10.000, con fecha efectiva máx(2026-11-20, 2026-11-11) = 2026-11-20.
- Y el interés recalculado de esa ventana es piso(110.000 × 8 × 1200 / 3.650.000) = piso(1.056.000.000 / 3.650.000) = piso(289,31) = $289, por los días del 2026-11-12 al 2026-11-19.
- Y se registra automáticamente en `2026-12` una nota de crédito de intereses por 289 − 687 = −$398, que apunta al cargo de interés de $687 y se imputa a él, que queda en $289 pendiente.
- Y el saldo es 320.687 − 110.000 − 398 = $210.289 ($210.000 de `2026-11` más $289 de interés).
- Cuando el 2026-12-10 se anula esa transferencia
- Entonces el interés recalculado vuelve a $687 y se registra un débito de ajuste de intereses por 687 − (687 − 398) = +$398.
- Y el saldo vuelve a 210.289 + 110.000 + 398 = $320.687.

## Casos borde

- **Unidad con peso 0:** no tiene cargo ni movimiento y su aviso muestra $0 (CA-18).
- **Grupo con total > 0 y todos los pesos en 0:** la emisión se bloquea (regla A-3.2).
- **Comunidad sin unidades:** no se puede emitir.
- **Cambio de propietario a mitad de mes:** no hay prorrateo por días. El aviso va al propietario vigente a la fecha de emisión y el anterior pierde el acceso (CA-21).
- **Cambio de arrendatario:** los cargos emitidos desde el ingreso del nuevo arrendatario van a su ámbito. La deuda y el saldo a favor del arrendatario anterior pasan al ámbito `unidad`, y el arrendatario anterior pierde el acceso (regla F-9).
- **Saldo a favor en un ámbito y deuda en otro:** no se compensan automáticamente. El aviso legal los muestra por separado (regla F-9). Al terminar la ocupación, todo pasa al ámbito `unidad` y ahí se compensan (regla F-6).
- **Pago duplicado:**
  - Webpay: idempotente (CA-10).
  - Manual: se advierte y se corrige con una anulación (CA-11).
- **Pago mayor a la deuda:** el excedente queda a favor y se aplica en la emisión siguiente (CA-9).
- **Pago anterior a la primera emisión:** queda a favor en el borrador vigente.
- **Pago con `paid_on` futuro:** se rechaza.
- **Confirmación Webpay que llega después de cerrar el periodo de su mes:** va al borrador vigente, con su `paid_on` real. Si su fecha efectiva cae en días con intereses ya cobrados, se genera una nota de crédito de intereses (regla E-10).
- **Anulación de un pago antiguo:** el reverso va al borrador vigente, sus cargos vuelven a quedar pendientes y se reimputan los saldos a favor (CA-12 y CA-27). Si afecta días ya cobrados, se genera un débito de ajuste de intereses (regla E-10 y CA-28).
- **Crédito con `paid_on` dentro de días ya cobrados:** se genera automáticamente una nota de crédito de intereses por la diferencia (CA-28).
- **Reimputación tardía:** la fecha efectiva es máx(`paid_on`, vencimiento del cargo), no la fecha en que se reimputa (CA-27).
- **Débito de ajuste:** vence con el aviso del borrador donde se registra (regla H-5 y CA-14).
- **Cambio de la tasa del reglamento:** se crea una versión nueva con fecha de inicio. Los días anteriores usan la versión anterior.
- **Año bisiesto:** los días de 2028 pesan 1/366 (regla E-6).
- **Periodo sin gastos:** se emite con confirmación (CA-20).
- **Corrección de un periodo emitido o cerrado:** se hace con ajustes en el borrador vigente (CA-13 y CA-14).
- **Reclasificar un gasto:**
  - Si cambia de cuenta o de base, se generan dos ajustes con la fórmula H-2.
  - Si solo cambia la subcategoría, no hay movimiento (regla H-3).
- **Doble clic en "Emitir":** la emisión es idempotente (CA-25).
- **Emisión sin tasa CMF para algunos días:** se emite sin intereses y esos días se cobran después (regla E-7).
- **Activación del flag de intereses:** solo cuentan los días desde la fecha de activación (S-20).
- **Interés menor a $1:** no se crea cargo. Los días de la ventana sí se consideran cobrados (S-10).
- **Unidad nueva o cambio de alícuotas:** la foto de periodos anteriores no cambia. Un cambio de alícuotas requiere modificar el reglamento (fuera de alcance; P-10).
- **Monto con decimales o negativo en la API o en una importación:** se rechaza.

## Fuera de alcance

- Gastos en UF (P-8).
- Prorrateo por lecturas de consumo. En el MVP el consumo se ingresa como monto directo por unidad.
- Prorrateo por sectores (Ley 21.442, art. 38).
- Multas automáticas.
- Convenios de pago (art. 6).
- Suspensión de servicios (art. 36).
- Devolución de saldos a favor.
- Extraordinarios en cuotas automáticas.
- Presupuesto anual, provisiones y fondo operacional inicial.
- Inversión del fondo.
- Cobranza judicial, certificado de deuda y documentos tributarios.
- Conciliación bancaria y saldo de caja automático.
- Elección de la imputación por parte del pagador.
- Anulación de pagos Webpay.
- Carga de saldos de apertura, que irá en la especificación de migración.

## Supuestos (a validar)

| Id | Supuesto | Fuente o razonamiento |
| --- | --- | --- |
| S-1 | Solo el administrador emite y cierra. El comité tiene solo lectura. | La ley encarga el cobro al administrador (Ley 21.442, art. 31). No se encontró una norma que exija que el comité apruebe la emisión. |
| S-2 | Se cobra "mes vencido". | Práctica habitual de las administraciones en Chile. |
| S-3 | El desempate usa `sort_order` único por comunidad. El orden natural del código solo propone el valor inicial. | `docs/qa/comunidades-simuladas.md` y `docs/arquitectura.md` §4. |
| S-4 | Hay un fondo por cada grupo ordinario con base alícuota o partes iguales. No se aplica recargo a los cargos directos, a los extraordinarios, a los intereses ni a las multas. | Ley 21.442, art. 8 letra d: recargo "sobre los gastos comunes ordinarios". Excluir los consumos directos es una decisión prudente (P-3). |
| S-5 | El mínimo de 5 % aplica a toda comunidad. | Ley 21.442, art. 39. Queda P-2 para viviendas sociales. |
| S-6 | `F_g` se redondea hacia arriba al peso (techo). | Con mitad hacia arriba, el fondo podía quedar bajo el mínimo legal de 5 % (Ley 21.442, art. 39), como en la Comunidad D (43.827 < 43.827,15). |
| S-7 | Los 10 días del plazo son corridos y el vencimiento no se corre si cae en día inhábil. | Ley 21.442, art. 7, y Código Civil, art. 50. |
| S-8 | Las multas son manuales. | Ley 21.442, art. 8 letra e: la ley remite las multas al reglamento. |
| S-9 | Solo el capital devenga interés; los intereses y las multas no. El fondo de reserva sí es parte del capital. | Ley 18.010, art. 9 (anatocismo), y Ley 21.442, art. 37 (el régimen de cobro se extiende al fondo). |
| S-10 | Interés simple diario con base actual/actual y tasas anuales. Una tasa mensual del reglamento se multiplica por 12. El interés se calcula al emitir, una vez por ámbito, y se trunca al peso. | El tope legal es una tasa anual (Ley 21.442, art. 7). Los certificados de la CMF expresan las tasas en moneda chilena no reajustable "en forma lineal anual", así que un interés simple diario no supera el tope en meses de 31 días (CA-8). ComunidadFeliz también calcula el interés devengado día a día. |
| S-11 | El tope es el 50 % de la tasa de interés corriente CMF vigente cada día. Es un dato global que carga el equipo de ComVive. | Ley 21.442, art. 7. Certificados CMF publicados en el Diario Oficial. |
| S-12 | ComVive imputa los pagos como lo haría el acreedor, con este orden: intereses vencidos → capital vencido (del más antiguo al más reciente) → multas vencidas → lo no vencido. El pagador no elige. | Código Civil: art. 1595 (los intereses se pagan antes que el capital, salvo que el acreedor consienta otra cosa); art. 1596 (el deudor puede elegir la deuda, pero no preferir una no devengada a una devengada; si no elige, imputa el acreedor en la carta de pago); art. 1597 (sin imputación de ninguna de las partes, se prefiere la deuda devengada). No dejar elegir al deudor es una restricción del MVP (P-7). Poner las multas después del capital y el orden entre cuentas son convenciones propias. |
| S-14 | El arrendatario ve solo su ámbito. El ex propietario y el ex residente pierden el acceso (404) y su historial se entrega a pedido. | Ley 21.719 (minimización de datos) y `docs/qa/plan-de-pruebas.md` ISO-8. |
| S-15 | El aviso tiene contenido adicional al mínimo legal y muestra las remuneraciones agregadas. | Práctica de mercado (boleta de ComunidadFeliz) y protección de datos del personal. |
| S-16 | El administrador ingresa a mano el saldo de caja. | Ley 21.442, art. 31. El MVP no tiene integración bancaria. |
| S-17 | Todo movimiento posterior a la emisión va al borrador vigente, con `paid_on` y `recorded_at`. | Hace cumplir la inmutabilidad de periodos con una sola regla (`docs/arquitectura.md` §4). |
| S-18 | Deuda y saldo a favor nunca coexisten en un mismo ámbito, y las notas de crédito se imputan primero al cargo que ajustan. | Consistencia del estado de cuenta. Convención propia. |
| S-19 | Cada débito tiene un ámbito fijo: el del ocupante responsable a la fecha de emisión, o el del movimiento al que apunta. Los pagos del arrendatario solo se imputan a su ámbito. El aviso legal va al propietario y muestra cada ámbito por separado, sin compensarlos. Al terminar la ocupación, todo pasa al ámbito `unidad`. | Ley 21.442, art. 6 (la deuda sigue al dueño) y minimización de datos (Ley 21.719). Convención propia para separar responsables (P-14). |
| S-20 | No se cobran intereses por días anteriores a la activación del flag o de la tasa en la comunidad. | Evita cobros retroactivos sorpresivos. |
| S-21 | La categoría CMF por defecto para el tope es el interés corriente de operaciones no reajustables en moneda nacional de menos de 90 días. | El gasto común es una obligación mensual en pesos, sin reajuste y de corto plazo (vence a los 10 días). La Ley 18.010, art. 6, define el interés corriente por tipo de operación, y la CMF publica esa categoría en sus certificados. No se encontró una fuente que fije la categoría para la Ley 21.442; queda por validar (P-5). |
| S-22 | Los intereses de días ya cobrados se recalculan en ambos sentidos: nota de crédito si baja el capital, débito de ajuste si sube. | Evita cobrar intereses sobre deuda pagada y no perder intereses de pagos anulados. Usa la misma fórmula de ajustes (regla H-2). |
| S-23 | La fecha efectiva de una imputación es máx(`paid_on`, vencimiento del cargo). | El dinero se recibió en `paid_on`. Antes del vencimiento no hay mora, así que adelantar la fecha no cambia el interés. |

El supuesto S-13 de la versión anterior (autorización de egresos del fondo) se eliminó por estar fuera del alcance de este módulo.

## Preguntas abiertas

- [ ] **P-1** (líder → abogado): verificar la numeración de los artículos de la Ley 21.442 contra bcn.cl y revisar si el DS N° 7 de 2025 del MINVU agrega requisitos al aviso de cobro, al fondo o a los intereses.
- [ ] **P-2** (abogado): ¿el mínimo de 5 % del fondo aplica también a las viviendas sociales o de interés público?
- [ ] **P-3** (contador): ¿los consumos directos (agua por remarcador) deben pagar el recargo del fondo?
- [ ] **P-4** (líder): ¿el comité debe aprobar la emisión o el cierre?
- [ ] **P-5** (abogado o contador): validar la categoría CMF por defecto (S-21) y si es correcto convertir una tasa mensual del reglamento multiplicándola por 12.
- [ ] **P-6** (abogado): ¿qué tipo de firma electrónica necesita el aviso para tener mérito ejecutivo (Ley 19.799)?
- [ ] **P-7** (contador y abogado): ¿es válido el orden de imputación de S-12? ¿Hay que permitir que el pagador elija a qué deuda aplicar su pago (Código Civil, art. 1596) o que cada comunidad configure el orden?
- [ ] **P-8** (líder): ¿el MVP necesita gastos en UF? Si es así, ¿con la UF de qué fecha se convierten?
- [ ] **P-10** (líder): ¿algún reglamento real usa alícuotas con más de 4 decimales de porcentaje, que `aliquot_e6` no puede representar?
- [ ] **P-11** (líder): ¿cómo se tratan los depósitos que llegan sin unidad identificada?
- [ ] **P-14** (abogado): ¿es aceptable que el pago de un arrendatario no se impute a la deuda anterior del propietario, aunque esa deuda sea más antigua y esté vencida? Ver S-19 frente a la regla del Código Civil, art. 1597.
- [ ] **P-15** (ingeniero QA): actualizar la prueba de oro D en `docs/qa/comunidades-simuladas.md`, porque con el techo (S-6) el fondo es $43.828 y GOLD-D-04 pasa a $287.752 (CA-4). La otra opción es que la prueba de oro D mantenga un fondo fijo de $43.827, como prueba del prorrateo puro.

Preguntas cerradas:

- **P-12:** los intereses de días ya cobrados se recalculan en ambos sentidos (regla E-10 y S-22).

- **P-9:** `docs/qa/comunidades-simuladas.md` ya separa la prueba de oro C y agrega la Comunidad D.
- **P-13:** el ex propietario pierde el acceso y su historial se entrega a pedido (S-14).

## Referencias

- **Ley 21.442, texto en LeyChile (BCN):** <https://www.bcn.cl/leychile/navegar?idNorma=1174663> (XML: <https://www.leychile.cl/Consulta/obtxml?opt=7&idNorma=1174663>). Artículos usados: arts. 2 N° 8 a 11, 6, 7 y 8 letras d y e.
- **Ley 21.442, Capítulo VI, en modulor.cl:** <https://modulor.cl/copropiedad/titulo-1/capitulo-vi/de-las-obligaciones-economicas/>. Artículos usados: arts. 31, 32, 36, 37, 38 y 39.
- **Reglamento DS N° 7 de 2025 (MINVU):** <https://www.diarioconstitucional.cl/2025/01/17/publican-reglamento-de-la-nueva-ley-de-copropiedad-inmobiliaria-que-cambios-trae-para-los-condominios/>.
- **Código Civil:**
  - Art. 50 (cómputo de plazos).
  - Arts. 1595 a 1597 (imputación del pago): <https://leyes-cl.com/codigo_civil/1595.htm>, <https://leyes-cl.com/codigo_civil/1596.htm>, <https://leyes-cl.com/codigo_civil/1597.htm>.
- **Ley 18.010:** art. 6 (interés corriente por tipo de operación) y art. 9 (capitalización).
- **Certificados de tasas de la CMF en el Diario Oficial:** <https://www.diariooficial.interior.gob.cl/publicaciones/2026/10/15/44574/01/2885690.pdf>.
- **ComunidadFeliz:**
  - Intereses: <https://ayuda.comunidadfeliz.com/c%C3%B3mo-fijo-la-tasa-de-inter%C3%A9s-de-la-comunidad>.
  - Configuración de la boleta: <https://www.comunidadfeliz.cl/recursos/configurar-la-boleta>.
- **Documentos internos:**
  - `docs/qa/comunidades-simuladas.md`: Comunidades A a D y pruebas de oro.
  - `docs/qa/plan-de-pruebas.md`: casos de aislamiento, incluido ISO-8.
  - `docs/arquitectura.md` §4 y §5.
- **ADR:**
  - 0001: monorepo.
  - 0002: aislamiento.
  - 0003: API y autorización.
  - 0004: libro de movimientos, periodos y prorrateo.
  - 0005: autenticación, auditoría y datos personales.
