# Comunidades simuladas y pruebas de oro

Estado: **Borrador · pendiente de validación por contador y aprobación del líder del proyecto**

Comunidades pequeñas y ficticias para diseñar, probar y demostrar ComVive. Cada monto esperado muestra su cálculo para que un contador pueda verificarlo a mano.

## Regla de redondeo propuesta (pendiente de aprobación)

Los cargos se calculan en pesos enteros con el **método del resto mayor**:

1. Se calcula el cargo exacto de cada unidad: `total × participación`.
2. Cada unidad recibe la parte entera (sin decimales) de su cargo exacto.
3. Los pesos que faltan para llegar al total se asignan de a uno a las unidades con mayor parte decimal.
4. Si hay empate en la parte decimal, el peso va a la unidad con menor número.

Garantiza que la suma de cargos siempre iguala el total y que ninguna unidad paga más de un peso sobre su cargo exacto.

> **Pregunta abierta:** confirmar con un contador si esta regla es aceptable o si existe una práctica distinta en Chile.

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

**Escenario de pago parcial:** Depto 101 paga $100.000. Saldo esperado: 210.000 − 100.000 = **$110.000 adeudado**.

> **Pregunta abierta:** ¿el fondo de reserva se calcula como porcentaje de los gastos ordinarios, como monto fijo, o según el reglamento de cada comunidad? Aquí se asumió 5 % solo para la simulación.

---

## Comunidad B · Condominio Las Brisas

Condominio de 3 casas con prorrateo en partes iguales. Caso de redondeo con empate.

| Unidad | Participación |
| --- | --- |
| Casa 1 | 1/3 |
| Casa 2 | 1/3 |
| Casa 3 | 1/3 |

**Total a emitir:** $100.000

| Unidad | Cargo exacto | Parte entera | Peso extra | Cargo |
| --- | --- | --- | --- | --- |
| Casa 1 | 33.333,33 | 33.333 | +1 (empate, menor número) | $33.334 |
| Casa 2 | 33.333,33 | 33.333 | 0 | $33.333 |
| Casa 3 | 33.333,33 | 33.333 | 0 | $33.333 |
| **Suma** | | 99.999 | 1 peso a repartir | **$100.000** ✔ |

---

## Comunidad C · Edificio Mirador

Edificio de 5 departamentos con alícuotas no redondas. Caso de redondeo con varios pesos a repartir.

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

## Propiedades que siempre deben cumplirse

Para pruebas basadas en propiedades (fast-check), con cualquier total y cualquier conjunto de participaciones que sume 100 %:

1. La suma de los cargos es exactamente igual al total emitido.
2. Ningún cargo difiere de su cargo exacto en un peso o más.
3. Ningún cargo es negativo.
4. El resultado es el mismo sin importar el orden en que se procesen las unidades.
5. Una unidad con participación 0 % tiene cargo $0.
