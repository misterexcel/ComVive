# Wireframes: corregir o anular un gasto o un egreso del fondo (web)

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/admin-corregir-gasto.md`. Superficie: web de administración (1280 px). Componentes: `MoneyField` con `allowZero`, `ReasonField` y `PreviewConfirm` (design system 5.2 y 5.10).

Regla de diseño: la pantalla nunca recibe montos de ajuste por unidad. El administrador corrige el gasto de origen y la API calcula los ajustes con la fórmula H-2 y la foto de participaciones del periodo original.

Criterios de aceptación: CA-13, CA-14, CA-24, CA-33, CA-34, CA-36 y CA-62.

## WEB-COR-01 · Gastos de un periodo cerrado

Escenario: CA-13. `2026-10` cerrado; borrador vigente `2026-12`; el 15-12-2026.

```text
+-- Octubre 2026 · <Cerrado> -----------------------------------------------------------------
| [ Gastos y cargos ]  [ Avisos (4) ]  [ Foto de saldos ]
|
| Concepto                     Cuenta      Subcategoría    Base       Monto
| Remuneración conserje        Ordinario   Administración  Alícuota   $650.000   > Corregir > Anular gasto
| Electricidad áreas comunes   Ordinario   Uso o consumo   Alícuota   $180.000   > Corregir > Anular gasto
| Mantención ascensor          Ordinario   Mantención      Alícuota   $120.000   > Corregir > Anular gasto
| Aseo y artículos             Ordinario   Mantención      Alícuota    $50.000   > Corregir > Anular gasto
| Total                                                             $1.000.000
+---------------------------------------------------------------------------------------------
```

- En un periodo emitido o cerrado no hay "Editar" ni "Eliminar": aparecen "Corregir" y "Anular gasto" (A-4, H-6). El comité no ve ninguna de las dos.
- Un gasto anulado muestra el chip "Anulado", su motivo y el monto original tachado; conserva "Corregir" (reactivarlo) y pierde "Anular gasto" (H-6):

```text
| Aseo y artículos  <Anulado>  Ordinario  Mantención  Alícuota  $50.000 (tachado)  > Corregir
|   Motivo: No correspondía a la comunidad · Anulado el 20-11-2026 por Carolina Lagos
```

## WEB-COR-02 · Corregir un gasto

```text
+-- Panel: Corregir gasto -------------------------------------------------------------------
| Electricidad áreas comunes · Octubre 2026
|
|                      Original              Corregido
| Monto                $180.000              [ $ 170.000            ]
| Cuenta               Ordinario             [ Ordinario          v ]
| Subcategoría         Uso o consumo         [ Uso o consumo      v ]
| Base de reparto      Alícuota              [ Alícuota           v ]
|
| Motivo (obligatorio)
| [ corrección factura electricidad                                   ]
| El motivo aparecerá en el aviso de cobro
| No incluyas datos personales
|
| ( Cancelar )                                                     [ Ver vista previa ]
+---------------------------------------------------------------------------------------------
```

- El campo de monto acepta $0. Al escribir $0, el panel pasa a "Anular gasto" (WEB-COR-05) y pide el motivo de la anulación (B-5, H-6).
- Ayudas de H-7 y del design system. Motivo de ejemplo: CA-14.
- **Sin cambios:** el formulario avisa sin llamar a la API: "La corrección no cambia el gasto. No hay nada que corregir" (texto de `CORRECTION_WITHOUT_CHANGE`) y "Ver vista previa" queda desactivado.
- **Solo cambia la subcategoría:** "Ver vista previa" muestra "No hay movimientos. Se registrará como nota en el aviso del borrador vigente." (texto del diseño a partir de H-3, UX-69).

## WEB-COR-03 · Vista previa de la corrección

Escenario: CA-13. O corregido $990.000, F $49.500, con la foto de `2026-10`.

```text
+-- Vista previa: corregir Electricidad áreas comunes ---------------------------------------
| Se registrará en el borrador vigente: diciembre 2026
|
| Ajustes por unidad
| Unidad      Deuda de      Ordinario   Fondo de reserva
| Depto 101   Propietario   −$2.000     −$100
| Depto 102   Propietario   −$2.500     −$125
| Depto 201   Propietario   −$2.500     −$125
| Depto 202   Propietario   −$3.000     −$150
| Total                     −$10.000    −$500
|
| Reimputaciones
| Depto 101 · Propietario: se liberan $2.100 de un pago de octubre 2026 y se aplican a la deuda
| vencida de noviembre 2026. Deuda resultante: $207.900
|
| Línea del aviso: Ajuste periodo 2026-10: corrección factura electricidad
|
| ( Volver a editar )                                                     [[ Continuar ]]
+---------------------------------------------------------------------------------------------
```

- Montos: CA-13. Las notas de crédito van en negativo con el signo `−` (design system 4.1). Los totales los entrega la API.
- Con correcciones previas (CA-14) aparece "Incluye la corrección anterior del 15-12-2026" y los débitos en positivo (+$1.000, +$50…).
- Con el flag `billing.interest` activo, un bloque "Ajustes de intereses" por unidad y deuda (E-10). Sin ajustes, el bloque no aparece.
- Reclasificación (cambio de cuenta o base): dos bloques, "Se revierte de {grupo de origen}" y "Se aplica en {grupo de destino}" (H-3).
- El texto de reimputación es del diseño (UX-69), con los montos de la API.

**Confirmación:**

```text
+-- Diálogo: Registrar corrección ----------------------------------------------
| Se registrarán ajustes en el periodo en borrador diciembre 2026. Los cargos y
| avisos de octubre 2026 no cambian.
| ( Cancelar )                                     [[ Registrar corrección ]]
+-------------------------------------------------------------------------------
```

- Texto del flujo (paso 6). El envío lleva el `previewHash` y una clave de idempotencia generada al abrir el diálogo.
- **409 `PREVIEW_OUTDATED`:** GLB-06 con "El gasto cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar".
- **Resultado:** banner `success` "Se registró la corrección en diciembre 2026." con "Ver ajustes" (texto del diseño, UX-69).

## WEB-COR-04 · Ajuste de un cargo de un arriendo terminado

Escenario: CA-36. Corrección de la electricidad de `2026-11` el 15-12-2026; el cargo del Depto 102 era de O-1, terminada el 05-12-2026.

```text
| Unidad      Deuda de                                   Ordinario   Fondo de reserva
| Depto 102   Arrendatario anterior (pasa al propietario)  −$2.500     −$125
```

- Rótulo del flujo (paso 5). El ex arrendatario no se nombra. Se liberan $2.625, que pasan a la deuda del propietario (F-13).

## WEB-COR-05 · Anular gasto

Escenario: CA-33. "Aseo y artículos" de `2026-10` (emitido), el 20-11-2026; borrador vigente `2026-11`.

```text
+-- Panel: Anular gasto ---------------------------------------------------------------------
| Aseo y artículos · Octubre 2026 · $50.000
|
| El gasto no se borra. Quedará como Anulado, con su motivo y su monto original, y se
| registrarán notas de crédito a las unidades.
|
| Motivo (obligatorio)
| [ No correspondía a la comunidad                                    ]
| El motivo aparecerá en el aviso de cobro
| No incluyas datos personales
|
| ( Cancelar )                                                     [ Ver vista previa ]
+---------------------------------------------------------------------------------------------

+-- Vista previa: anular Aseo y artículos ---------------------------------------------------
| Se registrará en el borrador vigente: noviembre 2026
|
| Unidad      Deuda de      Ordinario   Fondo de reserva   Deuda resultante
| Depto 101   Propietario   −$10.000    −$500              $10.500 a favor
| Depto 102   Propietario   −$12.500    −$625              $249.375
| Depto 201   Propietario   −$12.500    −$625              $249.375
| Depto 202   Propietario   −$15.000    −$750              $299.250
| Total                     −$50.000    −$2.500
|
| ( Volver a editar )                                      [! Anular gasto !]
+---------------------------------------------------------------------------------------------
```

- Texto del panel: flujo (paso 3). Montos: CA-33 y GOLD-A33.
- "Deuda resultante" por unidad y deuda, tal como la entrega la API; "a favor" es el rótulo de la web (glosario del design system).
- Si el grupo queda en $0 (CA-34, Comunidad B), el fondo del grupo también va a $0; en ese caso el extraordinario no tiene fondo.

## WEB-COR-06 · Corregir o anular un egreso del fondo

Escenario: CA-62, el 03-12-2026. Egreso "Cambio de cerradura portón" de `2026-11` ($20.000); borrador vigente `2026-12`.

```text
+-- Panel: Corregir egreso del fondo --------------------------------------------------------
| Cambio de cerradura portón · Noviembre 2026 · $20.000 · Acta comité 24-11-2026
|
| Monto correcto (obligatorio)       [ $ 15.000            ]   ($0 anula el egreso)
| Motivo (obligatorio)
| [ La factura final fue de $15.000                                   ]
| El motivo aparecerá en el aviso de cobro
|
| ( Cancelar )                                                     [ Ver vista previa ]
+---------------------------------------------------------------------------------------------

+-- Vista previa ----------------------------------------------------------------------------
| Se registrará en el borrador vigente diciembre 2026 una corrección de −$5.000.
| No genera cargos ni notas de crédito a las unidades.
| Línea del aviso: Corrección egreso del fondo periodo 2026-11: La factura final fue de $15.000
|
| {!} Con esta corrección, el saldo del fondo de reserva registrado en ComVive queda en
|     −$7.500. Revisa el monto; si el fondo tenía saldo antes de usar ComVive, ese saldo aún
|     no está cargado
|
| ( Volver a editar )                                         [[ Registrar corrección ]]
+---------------------------------------------------------------------------------------------
```

- No pide una autorización nueva (B-3). Montos: CA-62 y GOLD-A62-03.
- La advertencia no bloquea y no forma parte de la huella (S-50).
- "($0 anula el egreso)" y la primera frase de la vista previa: textos del diseño (UX-69).

## Errores

Orden de la API: `INVALID_AMOUNT` o `AMOUNT_TOO_LARGE` → `CORRECTION_WITHOUT_CHANGE` → `REASON_REQUIRED` → `PREVIEW_OUTDATED` (solo al confirmar). Textos de la spec, tal cual.

| Caso | Código | Texto |
| --- | --- | --- |
| Monto correcto negativo o con decimales | 422 `INVALID_AMOUNT` | "El monto correcto debe ser un número entero de pesos, mayor o igual que $0. Usa $0 solo para anular" |
| Sobre el máximo | 422 `AMOUNT_TOO_LARGE` | "El monto supera el máximo permitido de $9.999.999.999" |
| Gasto sin cambios | 422 `CORRECTION_WITHOUT_CHANGE` | "La corrección no cambia el gasto. No hay nada que corregir" |
| Gasto ya anulado | 422 `CORRECTION_WITHOUT_CHANGE` | "Este gasto ya está anulado. No hay nada que corregir" |
| Egreso por su mismo monto vigente | 422 `CORRECTION_WITHOUT_CHANGE` | "El monto correcto es igual al monto vigente del egreso ($15.000). No hay nada que corregir" (CA-62) |
| Egreso ya anulado | 422 `CORRECTION_WITHOUT_CHANGE` | "Este egreso ya está anulado. No hay nada que corregir" |
| Sin motivo, monto mayor que $0 | 422 `REASON_REQUIRED` | "Indica el motivo de la corrección" |
| Sin motivo, monto $0 | 422 `REASON_REQUIRED` | "Indica el motivo de la anulación" |
| Cambió desde la vista previa | 409 `PREVIEW_OUTDATED` | "El gasto cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar" |
| Misma clave con otros datos | 422 `IDEMPOTENCY_KEY_REUSED` | GLB-08 |
| Corte de conexión | — | "Revisando si la corrección quedó registrada…" (GLB-07) |
| Comité | 403 `FORBIDDEN` | GLB-03 |

- Los errores de monto y motivo van bajo su campo; los de "sin cambios" y "ya anulado", como banner arriba del panel.
- **Estados vacíos:** "Este gasto no tiene correcciones." en el historial del gasto. **Carga:** esqueleto de la tabla de ajustes.
