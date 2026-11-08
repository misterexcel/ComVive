# ADR 0004 · Libro de movimientos, periodos y prorrateo

- **Estado:** **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0002 (aislamiento), ADR 0003 (vistas previas, idempotencia, bloqueo único), ADR 0007 (pagos Webpay por ámbito)

## Contexto

Todo lo que toca dinero debe ser auditable y reproducible. `CLAUDE.md` fija como reglas no negociables: montos CLP enteros (regla 1), pruebas de oro (regla 2), suma de cargos igual al total emitido (regla 3), saldos calculados desde un libro (regla 5) y periodos cerrados inmutables (regla 6). La spec de gasto común agrega que en una misma unidad conviven deudores distintos (propietario y arrendatario) cuyas deudas no se compensan entre sí (F-9), que un arrendatario solo ve lo suyo (Ley 21.719) y que la deuda sigue a la unidad (Ley 21.442, art. 6).

Este ADR registra las decisiones estructurales del motor; el detalle vive en `docs/arquitectura.md` §4 y en las reglas de la spec.

## Decisión

1. **Libro de solo inserción (`LEDGER_ENTRY`):** sin `UPDATE` ni `DELETE`, reforzado con permisos de base de datos y trigger. Cada fila es un débito o un crédito con `amount_clp` positivo, cuenta y `type` (`charge`, `interest`, `fine`, `payment`, `credit_note`, `reversal`, `transfer`, `opening`). Los ajustes apuntan a su original con `adjusts_entry_id`. `CHARGE` es el detalle del cargo y tiene exactamente un movimiento gemelo creado en la misma transacción.
2. **Saldo = débitos − créditos por unidad y ámbito**, nunca guardado en un campo editable. Si el rendimiento lo exige, una vista o saldos de cierre generados al cerrar y verificables contra el libro.
3. **Ámbitos de deuda:** cada débito, crédito y pago lleva un ámbito fijo desde su creación: `owner` u `occupancy` (una ocupación concreta). Intereses, ajustes, reversos y notas de crédito heredan el ámbito de su origen. Un pago se imputa solo dentro de su ámbito. Al terminar una ocupación, lo pendiente pasa a `owner` con pares `transfer` enlazados; un saldo a favor traspasado hereda el `paid_on` del crédito que lo originó, con un par por crédito de origen (`source_credit_entry_id`).
4. **Ocupaciones con tres tipos de fecha:** declaradas (historial), de registro (cuándo se anotó) y efectiva de inicio `effective_from = máx(declarada, registro)`. Los estados programada, vigente, terminada y cancelada se **derivan**, sin columna de estado. Un ingreso retroactivo rige desde su registro; un término o una venta con fecha futura se rechazan; un ingreso futuro queda programado y se puede cancelar sin movimientos.
5. **Visibilidad por ámbito, nunca por fecha:** una sola función `visibleScopes(contexto, unidad)` decide qué pares (ámbito, ocupación) ve un residente, y toda consulta de residente filtra por ella. La misma capa marca la auditoría de la lectura del propietario sobre el ámbito del arrendatario (ADR 0005).
6. **Periodos `draft` → `issued` → `closed`:** al emitir se crean cargos y movimientos en una transacción, se verifica que cada cuenta cuadre y se crea el borrador siguiente, de modo que siempre hay un único borrador vigente. Un periodo `closed` rechaza inserciones con su `period_id` (trigger). **Regla única:** todo ajuste, pago tardío o reverso posterior a la emisión va al borrador vigente, conservando `paid_on` y `recorded_at`.
7. **Prorrateo con aritmética entera `bigint` y método del resto mayor:** dos bases (alícuota legal `aliquot_e6` en escala 10^-6 y pesos enteros `share_weight`); cada cuenta se prorratea por separado y cuadra con su total; los pesos faltantes van a los mayores restos y el empate se rompe por `UNIT.sort_order` (menor gana). Al emitir se congela la foto de participaciones (`PERIOD_UNIT_SHARE`) y todo recálculo de ese periodo la usa. No se crean cargos de $0.
8. **UF:** valor diario global en centésimos de peso con su fecha; montos en diezmilésimos de UF con la fecha usada. Un gasto en UF se convierte a CLP una sola vez y luego se prorratea en CLP.
9. **Imputación derivada del libro (`ALLOCATION`):** fecha efectiva = máx(`paid_on` del crédito, vencimiento del débito). Ante un pago, una nota de crédito o un reverso se reimputa el ámbito; la versión anterior queda `superseded`, no se borra.
10. **Intereses (detrás del flag `billing.interest`):** `INTEREST_STATE` evita cobrar dos veces el mismo tramo; `INTEREST_RATE_RULE` versiona la tasa por fecha y se valida contra la tasa corriente CMF. Un crédito con fecha efectiva dentro de días ya cobrados genera el ajuste de intereses en el borrador vigente.
11. **Egresos del fondo de reserva en tabla propia (`RESERVE_FUND_OUTFLOW`):** no se prorratean ni crean movimientos de unidades. Exigen referencia de autorización. Se corrigen con una fila `correction` en el borrador vigente por la diferencia acumulada (único monto con signo de la tabla, nunca $0). El saldo del fondo se calcula, nunca se guarda, y puede quedar negativo con advertencia.
12. **Saldo de caja del aviso:** dato declarado por el administrador al emitir (`PERIOD.cash_balance_clp`, con signo, y su fecha de corte), inmutable desde la emisión y parte de la huella de la vista previa. No es un saldo de unidad ni del libro, así que no choca con la regla 5.
13. **Apertura (`opening`):** único tipo para cargar saldos iniciales en la migración; su detalle queda para la spec de migración.

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Campo de saldo por unidad actualizado en cada pago | Prohibido por la regla 5; no es reproducible ni auditable. |
| Editar o borrar cargos de un periodo emitido para corregir | Prohibido por la regla 6; se pierde la trazabilidad. Las correcciones son notas de crédito o débitos de ajuste en el borrador vigente. |
| Contabilidad de partida doble completa (cuentas de activo, pasivo, caja) | Más fiel contablemente, pero duplica cada movimiento y exige un plan de cuentas que el MVP no necesita. El libro por unidad, ámbito y cuenta basta para saldos, avisos y conciliación. Se puede derivar más adelante. |
| Un solo ámbito por unidad (sin separar propietario y arrendatario) | Compensaría el pago del arrendatario con deuda del propietario y le mostraría datos ajenos (F-9, Ley 21.719). |
| Visibilidad del arrendatario por rango de fechas | Un ingreso o término retroactivo cambiaría lo que ve; el ámbito fijo es estable y auditable (M-6). |
| Columna de estado en `UNIT_OCCUPANCY` | Se desincroniza con las fechas (una ocupación programada se vuelve vigente sin que nadie escriba). El estado derivado no requiere tareas programadas. |
| `numeric` o `Decimal` para CLP; `number` de JavaScript en el cálculo | Viola la regla 1; `number` pierde exactitud desde T × `aliquot_e6` > 2^53 − 1 (S-37). |
| Redondeo independiente por unidad (mitad hacia arriba) | La suma no cuadra con el total (regla 3). |
| Desempate por código de unidad | Depende del formato del código ("10" frente a "9"); `sort_order` es estable y explícito. |
| Leer las alícuotas actuales al recalcular un periodo pasado | No reproducible: un cambio de alícuota alteraría ajustes de periodos ya emitidos. |
| Egresos del fondo como gastos del periodo | Un egreso podría entrar por error a un grupo de prorrateo y cobrarse a las unidades. |

## Consecuencias

### Positivas

- Cualquier cargo, saldo o imputación se puede recalcular desde el libro, la foto de participaciones y los valores UF, y comparar con lo emitido.
- Las pruebas de oro y las de propiedades (fast-check) se aplican sobre un módulo puro de cálculo.
- Los periodos cerrados no cambian nunca; toda corrección queda visible con su motivo.
- Los deudores distintos de una unidad quedan separados, sin perder que la deuda sigue a la unidad.

### Negativas

- Más filas: correcciones, reimputaciones versionadas y pares de traspaso crecen con el tiempo.
- Las consultas de saldo suman el libro; puede requerir vistas materializadas o saldos de cierre.
- La lógica de ámbitos, traspasos y `paid_on` heredado es la parte más compleja del sistema y exige pruebas primero (TDD) en todos sus casos.

### Riesgos

- **Error en la herencia de `paid_on` o en la reimputación:** produce intereses mal calculados. Mitigación: casos CA-26 a CA-28, CA-35, CA-36, CA-50 a CA-52 y pruebas de propiedades.
- **Trigger de periodo cerrado omitido en una tabla nueva:** mitigación con una prueba que recorre todas las tablas con `period_id`.
- **Rendimiento de la suma del libro:** se mide con comunidades simuladas grandes antes del Piloto.

## Supuestos (a validar) y preguntas abiertas

- **Supuestos (a validar) de la arquitectura §4:** dos bases de prorrateo; bloqueo de la emisión si las alícuotas no suman 1.000.000 (A-3.1, CA-19); conversión UF una sola vez con la UF de la fecha de emisión; prorrateo por cuenta; conciliación N:M. Pregunta 1 de §8.
- **Supuestos (a validar) de la spec:** S-3 (desempate por `sort_order`), S-6 (techo del fondo), S-12 (orden de imputación), S-17 (todo va al borrador vigente), S-18, S-19 y S-26 (ámbitos y traspasos), S-22 (recálculo de intereses en ambos sentidos), S-23 y S-39 (fechas de imputación y de "vencido"), S-27 y S-47 (fechas de ocupación), S-35 (anular = corregir a $0), S-37 y S-55 (topes), S-45 (saldo de caja), S-46, S-49 y S-50 (egresos del fondo), S-51 (historia del propietario nuevo), S-54 (`paid_on` del traspaso).
- **Preguntas abiertas de la spec:** P-3, P-5, P-7, P-8, P-10, P-14, P-21, P-26, P-29, P-30, P-33, P-38, P-39, P-40 y P-41.
- **Preguntas de `docs/arquitectura.md` §8:** 5 (intereses en el MVP), 6 (fuente de la UF), 9 (periodo siempre mensual) y 14 (propietario nuevo).

## Referencias

- `docs/arquitectura.md` §4: "Dinero y UF", "Participación y prorrateo", "Libro de movimientos", "Ámbito de deuda", "Ocupaciones", "Visibilidad por ámbito", "Imputación", "Intereses", "Periodos", "Egresos del fondo de reserva" y "Reproducibilidad".
- `docs/specs/gasto-comun.md`: secciones A (ciclo del periodo), B (B-3, B-5, B-6), C (prorrateo y redondeo, C-6), D (D-2, D-3, D-5), E (E-10, E-11), F (F-5, F-6, F-9, F-11, F-13, F-14), G-4 y H (H-1 a H-7); CA-1 a CA-4 (pruebas de oro), CA-13 a CA-15, CA-19, CA-21, CA-22, CA-33, CA-36, CA-37, CA-48, CA-53, CA-58, CA-61 y CA-62.
- `docs/qa/comunidades-simuladas.md` (Comunidades A a D, método del resto mayor, pruebas de oro).
- `CLAUDE.md`: reglas 1, 2, 3, 5 y 6.
