# Comunidades simuladas y pruebas de oro

Estado: **Borrador · pendiente de aprobación del líder del proyecto; validación por contador antes del Piloto**

Comunidades pequeñas y ficticias para diseñar, probar y demostrar ComVive. Cada monto esperado muestra su cálculo para que un contador pueda verificarlo a mano.

**Identificación de pruebas de oro:** cada fila de cargo esperado se identifica como `GOLD-<comunidad>-<nn>`, donde `nn` es la posición de la unidad en la tabla de cargos finales de su comunidad (por ejemplo, `GOLD-D-03` es Depto 3 de la Comunidad D, cargo total $236.341). La prueba automática usa el mismo ID.

## Participación de cada unidad

**Supuesto (a validar):** la participación se guarda como entero, nunca como decimal:

- Alícuota legal: entero en escala 10^-6 (por ejemplo, 18,7345 % se guarda como `187345`).
- Pesos relativos: enteros arbitrarios (por ejemplo, partes iguales = `1`, `1`, `1`).
- La participación de una unidad es `peso de la unidad ÷ suma de pesos de la comunidad`. Si el criterio es por alícuota y las alícuotas no suman 100 % (1.000.000), la emisión se bloquea (`docs/specs/gasto-comun.md`, CA-19). El motor de cálculo reparte siempre por `peso ÷ suma de pesos`.

## Regla de redondeo propuesta (pendiente de aprobación)

Los cargos se calculan en pesos enteros con el **método del resto mayor**:

1. Se calcula el cargo exacto de cada unidad: `total × peso de la unidad ÷ suma de pesos`.
2. Cada unidad recibe la parte entera (sin decimales) de su cargo exacto.
3. Los pesos que faltan para llegar al total se asignan de a uno a las unidades con mayor parte decimal.
4. Si hay empate en la parte decimal, el peso va a la unidad con menor `sort_order` (orden entero de la unidad dentro de la comunidad, definido por el administrador). Nunca se desempata por el nombre de la unidad como texto, porque "Depto 10" quedaría antes que "Depto 9".

Garantiza que la suma de cargos siempre iguala el total y que ninguna unidad paga más de un peso sobre su cargo exacto.

**Supuesto (a validar): redondeo por cuenta.** El gasto ordinario y el fondo de reserva se prorratean y redondean por separado, cada uno con su propio total. El cargo de la unidad es la suma de ambos. Así, la suma de cada cuenta cuadra con su total y el fondo de reserva queda trazable. La Comunidad D muestra que el resultado puede diferir de redondear el total combinado.

> **Pregunta abierta:** confirmar con un contador si esta regla es aceptable o si existe una práctica distinta en Chile. La validación por contador se exige **antes del Piloto** (Etapa 3); mientras tanto rige esta regla como supuesto documentado.

## Total del fondo de reserva: techo al peso

**Supuesto (a validar)** (`docs/specs/gasto-comun.md`, regla D-3 y S-6): el total del fondo de cada grupo ordinario se redondea **hacia arriba** al peso, con enteros:

```text
F = (O × pb + 9.999) div 10.000
```

- `O` es el total del grupo ordinario y `pb` el porcentaje del fondo en puntos base (500 = 5,00 %).
- Sumar 9.999 antes de la división entera equivale a tomar el techo de `O × pb ÷ 10.000`.
- Así el fondo nunca queda bajo el porcentaje mínimo legal (Ley 21.442, art. 39).
- Después, `F` se reparte con el método del resto mayor y los mismos pesos del grupo ordinario.

| Comunidad | `O` | Exacto (`O` × 5 %) | Cálculo | Fondo | ¿Cambia con el techo? |
| --- | --- | --- | --- | --- | --- |
| A | 1.000.000 | 50.000 | (500.000.000 + 9.999) div 10.000 | $50.000 | No: el exacto es entero |
| B (CA-2) | 95.238 | 4.761,9 | (47.619.000 + 9.999) div 10.000 = 47.628.999 div 10.000 | $4.762 | No: mitad hacia arriba también daba $4.762 |
| C (CA-3) | 1.175.778 | 58.788,9 | (587.889.000 + 9.999) div 10.000 = 587.898.999 div 10.000 | $58.789 | No: mitad hacia arriba también daba $58.789 |
| D | 876.543 | 43.827,15 | (438.271.500 + 9.999) div 10.000 = 438.281.499 div 10.000 | $43.828 | **Sí:** mitad hacia arriba daba $43.827, bajo el mínimo legal |

---

## Comunidad A · Edificio Los Aromos

Edificio de 4 departamentos con prorrateo por alícuota. Caso base sin redondeo.

| Unidad | Alícuota | Ocupante |
| --- | --- | --- |
| Depto 101 | 20,00 % | Propietario |
| Depto 102 | 25,00 % | Arrendatario (sin ocupación registrada en CA-1 a CA-21: sus cargos van al ámbito `owner`; ver CA-22) |
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
| Fondo de reserva: (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 | $50.000 |
| **Total a emitir** | **$1.050.000** |

**Cargos esperados**

| Prueba | Unidad | Cálculo | Cargo |
| --- | --- | --- | --- |
| GOLD-A-01 | Depto 101 | 1.050.000 × 20 % | $210.000 |
| GOLD-A-02 | Depto 102 | 1.050.000 × 25 % | $262.500 |
| GOLD-A-03 | Depto 201 | 1.050.000 × 25 % | $262.500 |
| GOLD-A-04 | Depto 202 | 1.050.000 × 30 % | $315.000 |
| | **Suma** | | **$1.050.000** ✔ |

Con redondeo por cuenta el resultado es el mismo, porque ninguna cuenta tiene decimales. Ejemplo Depto 101: ordinario 1.000.000 × 20 % = 200.000; fondo 50.000 × 20 % = 10.000; cargo 200.000 + 10.000 = $210.000.

**Escenario de pago parcial:** Depto 101 paga $100.000. Saldo esperado: 210.000 − 100.000 = **$110.000 adeudado**.

El fondo es un porcentaje de los gastos ordinarios configurado por comunidad, nunca bajo 5 % (`docs/specs/gasto-comun.md`, regla D-2). Aquí se usa 5 % (500 pb), el valor por defecto de los criterios de aceptación.

---

## Comunidad B · Condominio Las Brisas

Condominio de 3 casas con prorrateo en partes iguales. Caso de redondeo con empate.

| Unidad | `sort_order` | Peso relativo | Participación |
| --- | --- | --- | --- |
| Casa 1 | 1 | 1 | 1/3 |
| Casa 2 | 2 | 1 | 1/3 |
| Casa 3 | 3 | 1 | 1/3 |

**Total a emitir:** $100.000

| Prueba | Unidad | Cargo exacto | Parte entera | Peso extra | Cargo |
| --- | --- | --- | --- | --- | --- |
| GOLD-B-01 | Casa 1 | 33.333,33 | 33.333 | +1 (empate, menor `sort_order`) | $33.334 |
| GOLD-B-02 | Casa 2 | 33.333,33 | 33.333 | 0 | $33.333 |
| GOLD-B-03 | Casa 3 | 33.333,33 | 33.333 | 0 | $33.333 |
| | **Suma** | | 99.999 | 1 peso a repartir | **$100.000** ✔ |

Esta prueba reparte un solo monto. La emisión por cuenta de CA-2 (ordinario $95.238 + fondo $4.762, con el techo) llega a los mismos totales:

- Ordinario: 95.238 ÷ 3 = 31.746 exacto para cada casa.
- Fondo: 4.762 ÷ 3 = 1.587 con resto 1 para cada casa (empate). Falta 4.762 − 3 × 1.587 = 1 peso, que va a la Casa 1 por menor `sort_order`: 1.588, 1.587 y 1.587.
- Totales: Casa 1 31.746 + 1.588 = $33.334; Casa 2 y Casa 3 31.746 + 1.587 = $33.333. Suma 33.334 + 33.333 + 33.333 = $100.000.

---

## Comunidad C · Edificio Mirador

Edificio de 5 departamentos con alícuotas no redondas. Caso de redondeo con varios pesos a repartir.

> Esta prueba reparte **un solo monto** (una cuenta). No es la emisión completa de un periodo: si el total incluyera fondo de reserva, cada cuenta se reparte por separado y los cargos por unidad pueden variar en ±1 peso (ver Comunidad D).

**Total a emitir:** $1.234.567

| Prueba | Unidad | Alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GOLD-C-01 | Depto 11 | 18,50 % | 228.394,895 | 228.394 | 0,895 | +1 | $228.395 |
| GOLD-C-02 | Depto 12 | 19,50 % | 240.740,565 | 240.740 | 0,565 | +1 | $240.741 |
| GOLD-C-03 | Depto 21 | 20,00 % | 246.913,400 | 246.913 | 0,400 | 0 | $246.913 |
| GOLD-C-04 | Depto 22 | 21,00 % | 259.259,070 | 259.259 | 0,070 | 0 | $259.259 |
| GOLD-C-05 | Depto 31 | 21,00 % | 259.259,070 | 259.259 | 0,070 | 0 | $259.259 |
| | **Suma** | 100,00 % | | 1.234.565 | | 2 pesos a repartir | **$1.234.567** ✔ |

### Comunidad C · emisión por cuenta (CA-3)

**Aprobada por el líder del proyecto (2026-11-07):** IDs `GOLD-CE-nn`, con `nn` igual a la posición de la unidad. Es la prueba de oro que detecta una implementación que redondea el total combinado en vez de cada cuenta, porque con el techo la Comunidad D ya no lo detecta (ver su contraste).

Gasto ordinario $1.175.778 por alícuota. Fondo (1.175.778 × 500 + 9.999) div 10.000 = 587.898.999 div 10.000 = $58.789 (exacto 58.788,9). `sort_order`: 11 = 1, 12 = 2, 21 = 3, 22 = 4, 31 = 5.

**Paso 1 · Ordinario ($1.175.778).** Producto = 1.175.778 × alícuota guardada; parte entera = producto div 1.000.000; resto = producto mod 1.000.000.

| Unidad | Alícuota guardada | Producto | Parte entera | Resto | Peso extra | Cargo ordinario |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 11 | 185.000 | 217.518.930.000 | 217.518 | 930.000 | +1 (1.° mayor) | $217.519 |
| Depto 12 | 195.000 | 229.276.710.000 | 229.276 | 710.000 | +1 (2.° mayor) | $229.277 |
| Depto 21 | 200.000 | 235.155.600.000 | 235.155 | 600.000 | +1 (3.° mayor) | $235.156 |
| Depto 22 | 210.000 | 246.913.380.000 | 246.913 | 380.000 | 0 | $246.913 |
| Depto 31 | 210.000 | 246.913.380.000 | 246.913 | 380.000 | 0 | $246.913 |
| **Suma** | 1.000.000 | 1.175.778.000.000 | 1.175.775 | | 1.175.778 − 1.175.775 = 3 pesos | **$1.175.778** ✔ |

**Paso 2 · Fondo ($58.789).** Producto = 58.789 × alícuota guardada.

| Unidad | Producto | Parte entera | Resto | Peso extra | Cargo fondo |
| --- | --- | --- | --- | --- | --- |
| Depto 11 | 10.875.965.000 | 10.875 | 965.000 | +1 (1.° mayor) | $10.876 |
| Depto 12 | 11.463.855.000 | 11.463 | 855.000 | +1 (2.° mayor) | $11.464 |
| Depto 21 | 11.757.800.000 | 11.757 | 800.000 | +1 (3.° mayor) | $11.758 |
| Depto 22 | 12.345.690.000 | 12.345 | 690.000 | +1 (empate con Depto 31; gana `sort_order` 4) | $12.346 |
| Depto 31 | 12.345.690.000 | 12.345 | 690.000 | 0 (pierde el empate, `sort_order` 5) | $12.345 |
| **Suma** | 58.789.000.000 | 58.785 | | 58.789 − 58.785 = 4 pesos | **$58.789** ✔ |

**Paso 3 · Cargo total por unidad**

| Prueba | Unidad | Cálculo | Cargo total | Diferencia con GOLD-C |
| --- | --- | --- | --- | --- |
| GOLD-CE-01 | Depto 11 | 217.519 + 10.876 | $228.395 | 0 |
| GOLD-CE-02 | Depto 12 | 229.277 + 11.464 | $240.741 | 0 |
| GOLD-CE-03 | Depto 21 | 235.156 + 11.758 | $246.914 | +1 |
| GOLD-CE-04 | Depto 22 | 246.913 + 12.346 | $259.259 | 0 |
| GOLD-CE-05 | Depto 31 | 246.913 + 12.345 | $259.258 | −1 |
| | **Suma** | 1.175.778 + 58.789 | **$1.234.567** ✔ | 0 |

Comprobación de la suma: 228.395 + 240.741 = 469.136; 469.136 + 246.914 = 716.050; 716.050 + 259.259 = 975.309; 975.309 + 259.258 = 1.234.567. Una implementación que reparta $1.234.567 de una vez obtiene GOLD-C (Depto 21 $246.913 y Depto 31 $259.259) y debe fallar esta prueba.

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

| Cuenta | Cálculo | Monto |
| --- | --- | --- |
| Gasto ordinario | | $876.543 |
| Fondo de reserva (5 %, techo; regla D-3) | (876.543 × 500 + 9.999) div 10.000 = (438.271.500 + 9.999) div 10.000 = 438.281.499 div 10.000 | $43.828 |
| **Total a emitir** | 876.543 + 43.828 | **$920.371** |

El fondo exacto es 876.543 × 5 % = 43.827,15. El techo da $43.828. Con el redondeo anterior (mitad hacia arriba) daba $43.827, que queda bajo el 5 % legal (`docs/specs/gasto-comun.md`, CA-4, S-6 y P-15).

**Paso 1 · Gasto ordinario ($876.543)**

Cargo exacto = 876.543 × alícuota guardada ÷ 1.000.000.

| Unidad | Producto 876.543 × alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo ordinario |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 1 | 164.215.948.335 | 164.215,948335 | 164.215 | 0,948335 | +1 (1.° mayor) | $164.216 |
| Depto 2 | 213.191.035.374 | 213.191,035374 | 213.191 | 0,035374 | 0 | $213.191 |
| Depto 3 | 225.086.600.427 | 225.086,600427 | 225.086 | 0,600427 | +1 (2.° mayor) | $225.087 |
| Depto 4 | 274.049.415.864 | 274.049,415864 | 274.049 | 0,415864 | 0 | $274.049 |
| **Suma** | 876.543.000.000 | | 876.541 | | 876.543 − 876.541 = 2 pesos | **$876.543** ✔ |

Comprobación de las partes enteras: 164.215 + 213.191 = 377.406; 377.406 + 225.086 = 602.492; 602.492 + 274.049 = 876.541.

**Paso 2 · Fondo de reserva ($43.828)**

Cargo exacto = 43.828 × alícuota guardada ÷ 1.000.000. Cada producto es el de 43.827 más una alícuota (por ejemplo, Depto 1: 8.210.769.315 + 187.345 = 8.210.956.660).

| Unidad | Producto 43.828 × alícuota | Cargo exacto | Parte entera | Parte decimal | Peso extra | Cargo fondo |
| --- | --- | --- | --- | --- | --- | --- |
| Depto 1 | 8.210.956.660 | 8.210,956660 | 8.210 | 0,956660 | +1 (1.° mayor) | $8.211 |
| Depto 2 | 10.659.758.504 | 10.659,758504 | 10.659 | 0,758504 | +1 (2.° mayor) | $10.660 |
| Depto 3 | 11.254.548.292 | 11.254,548292 | 11.254 | 0,548292 | 0 (4.° resto) | $11.254 |
| Depto 4 | 13.702.736.544 | 13.702,736544 | 13.702 | 0,736544 | +1 (3.° mayor) | $13.703 |
| **Suma** | 43.828.000.000 | | 43.825 | | 43.828 − 43.825 = 3 pesos | **$43.828** ✔ |

Comprobación de las partes enteras: 8.210 + 10.659 = 18.869; 18.869 + 11.254 = 30.123; 30.123 + 13.702 = 43.825. No hay empates de resto, así que el `sort_order` no interviene.

**Paso 3 · Cargo total por unidad**

| Prueba | Unidad | Cálculo | Cargo total |
| --- | --- | --- | --- |
| GOLD-D-01 | Depto 1 | 164.216 + 8.211 | $172.427 |
| GOLD-D-02 | Depto 2 | 213.191 + 10.660 | $223.851 |
| GOLD-D-03 | Depto 3 | 225.087 + 11.254 | $236.341 |
| GOLD-D-04 | Depto 4 | 274.049 + 13.703 | $287.752 |
| | **Suma** | 876.543 + 43.828 | **$920.371** ✔ |

Comprobación de la suma: 172.427 + 223.851 = 396.278; 396.278 + 236.341 = 632.619; 632.619 + 287.752 = 920.371.

**Cambio respecto de la versión anterior:** con el fondo fijo de $43.827, el Depto 4 recibía $13.702 de fondo y GOLD-D-04 era $287.751 (total $920.370). Con el techo, el Depto 4 sube al 3.° mayor resto (0,736544) y recibe $13.703: GOLD-D-04 = $287.752. GOLD-D-01 a 03 no cambian. Una implementación que redondee el fondo a la mitad hacia arriba debe fallar GOLD-D-04.

**Contraste 1 · redondeo del total combinado (no es el método esperado):** si se repartiera $920.371 de una vez, los productos serían 172.426.904.995; 223.850.793.878; 236.341.148.719 y 287.752.152.408. Las partes enteras suman 920.369 y los 2 pesos faltantes van a los restos 0,904995 (Depto 1) y 0,793878 (Depto 2). El resultado ($172.427, $223.851, $236.341, $287.752) **coincide** con el redondeo por cuenta. Por eso, con el techo, la Comunidad D ya no detecta una implementación que redondee el total combinado. Esa detección queda en GOLD-CE (Comunidad C, emisión por cuenta).

**Contraste 2 · fondo con mitad hacia arriba (no es el resultado esperado):** con un fondo de $43.827, el total combinado de $920.370 repartido de una vez daba Depto 2 $223.850 y Depto 4 $287.752; repartido por cuenta daba Depto 4 $287.751. Ninguno de esos resultados es válido con la regla D-3.

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
7. El total del fondo de un grupo nunca queda bajo su porcentaje y lo supera en menos de un peso: `O × pb ≤ F × 10.000 < O × pb + 10.000`.

Casos borde con resultado fijo (supuestos a validar):

- Comunidad sin unidades: no se emite; error de validación, sin cargos creados.
- Todos los pesos en 0: no se emite; error de validación, sin cargos creados.
- Total $0: se emite con cargo $0 para todas las unidades.
