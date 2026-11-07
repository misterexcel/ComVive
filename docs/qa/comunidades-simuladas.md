# Comunidades simuladas y pruebas de oro

Estado: **Borrador · pendiente de aprobación del líder del proyecto; validación por contador antes del Piloto**

Comunidades pequeñas y ficticias para diseñar, probar y demostrar ComVive. Cada monto esperado muestra su cálculo para que un contador pueda verificarlo a mano.

**Identificación de pruebas de oro:** cada fila de cargo esperado se identifica como `GOLD-<comunidad>-<nn>`, donde `nn` es la posición de la unidad en la tabla de cargos finales de su comunidad (por ejemplo, `GOLD-D-03` es Depto 3 de la Comunidad D, cargo total $236.341). La prueba automática usa el mismo ID.

## Participación de cada unidad

**Supuesto (a validar):** la participación se guarda como entero, nunca como decimal:

- Alícuota legal: entero en escala 10^-6 (por ejemplo, 18,7345 % se guarda como `187345`).
- Pesos relativos: enteros arbitrarios (por ejemplo, partes iguales = `1`, `1`, `1`).
- La participación de una unidad es `peso de la unidad ÷ suma de pesos de la comunidad`. Si el criterio es por alícuota y las alícuotas no suman 100 % (1.000.000), la emisión se bloquea (`docs/specs/gasto-comun.md`, CA-16). El motor de cálculo reparte siempre por `peso ÷ suma de pesos`.

## Regla de redondeo propuesta (pendiente de aprobación)

Los cargos se calculan en pesos enteros con el **método del resto mayor**:

1. Se calcula el cargo exacto de cada unidad: `total × peso de la unidad ÷ suma de pesos`.
2. Cada unidad recibe la parte entera (sin decimales) de su cargo exacto.
3. Los pesos que faltan para llegar al total se asignan de a uno a las unidades con mayor parte decimal.
4. Si hay empate en la parte decimal, el peso va a la unidad con menor `sort_order` (orden entero de la unidad dentro de la comunidad, definido por el administrador). Nunca se desempata por el nombre de la unidad como texto, porque "Depto 10" quedaría antes que "Depto 9".

Garantiza que la suma de cargos siempre iguala el total y que ninguna unidad paga más de un peso sobre su cargo exacto.

**Supuesto (a validar): redondeo por cuenta.** El gasto ordinario y el fondo de reserva se prorratean y redondean por separado, cada uno con su propio total. El cargo de la unidad es la suma de ambos. Así, la suma de cada cuenta cuadra con su total y el fondo de reserva queda trazable. La Comunidad D muestra que el resultado puede diferir de redondear el total combinado.

> **Pregunta abierta:** confirmar con un contador si esta regla es aceptable o si existe una práctica distinta en Chile. La validación por contador se exige **antes del Piloto** (Etapa 3); mientras tanto rige esta regla como supuesto documentado.

---

## Comunidad A · Edificio Los Aromos

Edificio de 4 departamentos con prorrateo por alícuota. Caso base sin redondeo.

| Unidad | Alícuota | Ocupante |
| --- | --- | --- |
| Depto 101 | 20,00 % | Propietario |
| Depto 102 | 25,00 % | Arrendatario |
| Depto 201 | 25,00 % | Propietario |
| Depto 202 | 30,00 % | Propietario |

**Periodo de prueba: gastos del mes**

| Concepto | Monto |
| --- | --- |
| Remuneración conserje | $650.000 |
| Electricidad áreas comunes | $180.000 |
| Mantención ascensor | $120.000 |
| Aseo y artículos | $50.000 |
| **Gastos ordinarios** | **$1.000.000** |
| Fondo de reserva (5 % de gastos ordinarios) | $50.000 |
| **Total a emitir** | **$1.050.000** |

**Cargos esperados**

| Unidad | Cálculo | Cargo |
| --- | --- | --- |
| Depto 101 | 1.050.000 × 20 % | $210.000 |
| Depto 102 | 1.050.000 × 25 % | $262.500 |
| Depto 201 | 1.050.000 × 25 % | $262.500 |
| Depto 202 | 1.050.000 × 30 % | $315.000 |
| **Suma** | | **$1.050.000** ✔ |

Con redondeo por cuenta el resultado es el mismo, porque ninguna cuenta tiene decimales. Ejemplo Depto 101: ordinario 1.000.000 × 20 % = 200.000; fondo 50.000 × 20 % = 10.000; cargo 200.000 + 10.000 = $210.000.

**Escenario de pago parcial:** Depto 101 paga $100.000. Saldo esperado: 210.000 − 100.000 = **$110.000 adeudado**.

> **Pregunta abierta:** ¿el fondo de reserva se calcula como porcentaje de los gastos ordinarios, como monto fijo, o según el reglamento de cada comunidad? Aquí se asumió 5 % solo para la simulación.

---

## Comunidad B · Condominio Las Brisas

Condominio de 3 casas con prorrateo en partes iguales. Caso de redondeo con empate.

| Unidad | `sort_order` | Peso relativo | Participación |
| --- | --- | --- | --- |
| Casa 1 | 1 | 1 | 1/3 |
| Casa 2 | 2 | 1 | 1/3 |
| Casa 3 | 3 | 1 | 1/3 |

**Total a emitir:** $100.000

| Unidad | Cargo exacto | Parte entera | Peso extra | Cargo |
| --- | --- | --- | --- | --- |
| Casa 1 | 33.333,33 | 33.333 | +1 (empate, menor `sort_order`) | $33.334 |
| Casa 2 | 33.333,33 | 33.333 | 0 | $33.333 |
| Casa 3 | 33.333,33 | 33.333 | 0 | $33.333 |
| **Suma** | | 99.999 | 1 peso a repartir | **$100.000** ✔ |

---

## Comunidad C · Edificio Mirador

Edificio de 5 departamentos con alícuotas no redondas. Caso de redondeo con varios pesos a repartir.

> Esta prueba reparte **un solo monto** (una cuenta). No es la emisión completa de un periodo: si el total incluyera fondo de reserva, cada cuenta se reparte por separado y los cargos por unidad pueden variar en ±1 peso (ver Comunidad D).

**Total a emitir:** $1.234.567

| Unidad | Alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 11 | 18,50 % | 228.394,895 | 228.394 | 0,895 | +1 | $228.395 |
| Depto 12 | 19,50 % | 240.740,565 | 240.740 | 0,565 | +1 | $240.741 |
| Depto 21 | 20,00 % | 246.913,400 | 246.913 | 0,400 | 0 | $246.913 |
| Depto 22 | 21,00 % | 259.259,070 | 259.259 | 0,070 | 0 | $259.259 |
| Depto 31 | 21,00 % | 259.259,070 | 259.259 | 0,070 | 0 | $259.259 |
| **Suma** | 100,00 % | | 1.234.565 | | 2 pesos a repartir | **$1.234.567** ✔ |

---

## Comunidad D · Edificio Alto Quillay

Edificio de 4 departamentos con alícuotas legales no redondas (escala 10^-6), gasto ordinario y fondo de reserva redondeados **por cuenta**.

| Unidad | `sort_order` | Alícuota | Alícuota guardada (10^-6) |
| --- | --- | --- | --- |
| Depto 1 | 1 | 18,7345 % | 187.345 |
| Depto 2 | 2 | 24,3218 % | 243.218 |
| Depto 3 | 3 | 25,6789 % | 256.789 |
| Depto 4 | 4 | 31,2648 % | 312.648 |
| **Suma** | | 100,0000 % | 1.000.000 |

Comprobación de la suma: 187.345 + 243.218 = 430.563; 430.563 + 256.789 = 687.352; 687.352 + 312.648 = 1.000.000.

| Cuenta | Monto |
| --- | --- |
| Gasto ordinario | $876.543 |
| Fondo de reserva (monto fijo de la simulación) | $43.827 |
| **Total a emitir** | **$920.370** |

**Paso 1 · Gasto ordinario ($876.543)**

Cargo exacto = 876.543 × alícuota guardada ÷ 1.000.000.

| Unidad | Producto 876.543 × alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo ordinario |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 1 | 164.215.948.335 | 164.215,948335 | 164.215 | 0,948335 | +1 (1.° mayor) | $164.216 |
| Depto 2 | 213.191.035.374 | 213.191,035374 | 213.191 | 0,035374 | 0 | $213.191 |
| Depto 3 | 225.086.600.427 | 225.086,600427 | 225.086 | 0,600427 | +1 (2.° mayor) | $225.087 |
| Depto 4 | 274.049.415.864 | 274.049,415864 | 274.049 | 0,415864 | 0 | $274.049 |
| **Suma** | 876.543.000.000 | | 876.541 | | 876.543 − 876.541 = 2 pesos | **$876.543** ✔ |

**Paso 2 · Fondo de reserva ($43.827)**

Cargo exacto = 43.827 × alícuota guardada ÷ 1.000.000.

| Unidad | Producto 43.827 × alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo fondo |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 1 | 8.210.769.315 | 8.210,769315 | 8.210 | 0,769315 | +1 (1.° mayor) | $8.211 |
| Depto 2 | 10.659.515.286 | 10.659,515286 | 10.659 | 0,515286 | +1 (2.° mayor) | $10.660 |
| Depto 3 | 11.254.291.503 | 11.254,291503 | 11.254 | 0,291503 | 0 | $11.254 |
| Depto 4 | 13.702.423.896 | 13.702,423896 | 13.702 | 0,423896 | 0 | $13.702 |
| **Suma** | 43.827.000.000 | | 43.825 | | 43.827 − 43.825 = 2 pesos | **$43.827** ✔ |

**Paso 3 · Cargo total por unidad**

| Unidad | Cálculo | Cargo total |
| --- | --- | --- |
| Depto 1 | 164.216 + 8.211 | $172.427 |
| Depto 2 | 213.191 + 10.660 | $223.851 |
| Depto 3 | 225.087 + 11.254 | $236.341 |
| Depto 4 | 274.049 + 13.702 | $287.751 |
| **Suma** | 876.543 + 43.827 | **$920.370** ✔ |

Comprobación de la suma: 172.427 + 223.851 = 396.278; 396.278 + 236.341 = 632.619; 632.619 + 287.751 = 920.370.

**Contraste (no es el resultado esperado):** si se redondeara el total combinado de $920.370 de una vez, las partes decimales serían Depto 1 0,71765; Depto 2 0,55066; Depto 3 0,89193; Depto 4 0,83976, y los 3 pesos faltantes irían a Deptos 3, 4 y 1. El resultado sería Depto 2 $223.850 y Depto 4 $287.752, distinto del redondeo por cuenta. Una implementación que redondee el total combinado debe fallar esta prueba de oro.

---

## Prueba de oro en UF (pendiente de datos)

**Supuesto (a validar):** cuando un gasto está expresado en UF, el **total** de la cuenta se convierte a CLP una sola vez, con el valor de la UF de la fecha que fije la especificación, y se redondea a peso entero; luego ese total en CLP se prorratea con la regla del resto mayor. Nunca se convierte el cargo de cada unidad por separado. El valor en UF y su fecha se guardan aparte.

Pendiente: monto en UF, fecha, valor de la UF de esa fecha y regla de redondeo de la conversión (definidos por la especificación de gasto común). Con esos datos se construye la tabla paso a paso como en las comunidades anteriores.

---

## Propiedades que siempre deben cumplirse

Para pruebas basadas en propiedades (fast-check), con cualquier total entero no negativo y cualquier lista no vacía de **pesos enteros no negativos arbitrarios** con al menos un peso mayor que 0 (no se exige que sumen 100 %):

1. La suma de los cargos es exactamente igual al total emitido.
2. Ningún cargo difiere de su cargo exacto en un peso o más.
3. Ningún cargo es negativo.
4. El resultado es el mismo sin importar el orden en que se procesen las unidades (el desempate depende solo de `sort_order`).
5. Una unidad con peso 0 tiene cargo $0.
6. Con redondeo por cuenta, la suma de cada cuenta iguala su propio total.

Casos borde con resultado fijo (supuestos a validar):

- Comunidad sin unidades: no se emite; error de validación, sin cargos creados.
- Todos los pesos en 0: no se emite; error de validación, sin cargos creados.
- Total $0: se emite con cargo $0 para todas las unidades.
