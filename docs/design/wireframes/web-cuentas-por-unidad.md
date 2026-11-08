# Wireframes: cuentas por unidad y estado de cuenta (web)

Estado: **Aprobado** (aprobado por el líder del proyecto el 2026-11-08, cierre de la Etapa 1)
Responsable: disenador-ux
Aprobación: líder del proyecto

IA: `../arquitectura-de-informacion.md`, sección 1, "Cuentas por unidad" y "Tabla de unidades". Flujos relacionados: `../flujos/admin-pago-manual.md` (desde el estado de cuenta) y `../flujos/admin-ocupaciones.md` (traspasos). Superficie: web de administración (1280 px).

Reglas que se ven en estas pantallas (spec F-8, F-9, "Datos de copropietarios que ve el comité"):

- Deuda y saldo a favor **por ámbito**, en columnas separadas. Sin columna de saldo neto.
- El comité ve nombre y RUT enmascarado del propietario, y el arrendatario solo como "Arrendatario" (S-33). Los campos que no ve no viajan en la respuesta.
- Cada lectura de deudas de terceros queda en auditoría (regla 7 de `CLAUDE.md`).

Criterios de aceptación: CA-22, CA-24, CA-35, CA-44, CA-49 y CA-56.

## WEB-CTA-01 · Tabla de unidades (administrador)

Escenario: Comunidad A, el 02-12-2026. `2026-10` y `2026-11` emitidos con los gastos de CA-1; pago de $100.000 del Depto 101 (CA-5); O-1 (Pedro Soto) vigente en el Depto 102 desde el 15-11-2026, así que el cargo de `2026-11` del Depto 102 está en su ámbito (CA-22). Flag apagado.

```text
+-- Cuentas por unidad -----------------------------------------------------------------------
| Unidad: [ Buscar código ]   [ Con deuda vencida x ]                     [ Exportar planilla ]
|
| Unidad      Propietario    Deuda del      A favor del    Deuda del      A favor del    Vencido                Cuotas
|                            propietario    propietario    arrendatario   arrendatario   desde                  impagas
| Depto 101   Ana Pérez      $320.000       $0             —              —              Venció el 11-11-2026   1
| Depto 102   Luis Muñoz     $262.500       $0             $262.500       $0             Venció el 11-11-2026   1
|             Arrendatario: Pedro Soto
| Depto 201   Rosa Díaz      $525.000       $0             —              —              Venció el 11-11-2026   1
| Depto 202   Marco Silva    $630.000       $0             —              —              Venció el 11-11-2026   1
| Total                      $1.737.500     $0             $262.500       $0
+---------------------------------------------------------------------------------------------
```

- Cada columna de monto tiene su total, que entrega la API. No hay total que sume columnas de distinto ámbito.
- "—" cuando la unidad no tiene arrendatario vigente.
- "Vencido desde" (F-8, S-64; UX-50 cerrada): una fecha por unidad que entrega la API, la de vencimiento más antigua entre los débitos pendientes y vencidos de cualquier ámbito. Es la fecha de vencimiento, no el primer día de mora, así que la celda dice "Venció el {dd-mm-aaaa}" (texto del diseño, UX-69). Sin nada vencido, la celda queda vacía. El comité la ve igual (S-33).- Cuotas impagas (F-8): periodos emitidos y vencidos con capital pendiente; `2026-11` aún no vence.
- Comprobación: emitido $2.100.000 − pagado $100.000 = $2.000.000 = $1.737.500 + $262.500. La pantalla no la hace; la anota este documento.
- Unidad sin propietario registrado (CA-38): "Propietario sin registrar" con chip `warning` en la columna Propietario.
- Primera columna fija al desplazar en horizontal (design system 5.4).

## WEB-CTA-02 · Tabla de unidades (comité)

Escenario: CA-44, mismo estado.

```text
| Unidad      Propietario                 Deuda del     A favor del   Deuda del      A favor del   Vencido                Cuotas
|                                         propietario   propietario   arrendatario   arrendatario  desde                  impagas
| Depto 102   Luis Muñoz · 12.345.***-*   $262.500      $0            $262.500       $0            Venció el 11-11-2026   1
|             Arrendatario
```

- Sin "Exportar planilla" (solo administrador, IA). Sin teléfonos, correos, RUT completo ni nombre del arrendatario (CA-44).
- RUT enmascarado según design system 4.3; con cuerpos de 7 dígitos, UX-53.

## WEB-CTA-03 · Estado de cuenta de la unidad

Escenario: Depto 102, mismo estado del 02-12-2026.

```text
+-- Depto 102 · Estado de cuenta -------------------------------------------------------------
| Propietario: Luis Muñoz · Alícuota 25,0000 %              [[ Registrar pago ]]  > Ocupantes
|
| +-- Deuda del propietario ------------------- <Vencida> ---+ +-- Deuda del arrendatario --- <Por vencer> ---
| | $262.500                                                 | | Pedro Soto
| | Vencido desde 11-11-2026: $262.500                       | | $262.500
| +----------------------------------------------------------+ | Por vencer el 11-12-2026: $262.500
|                                                              +-----------------------------------------
|
| [ Deuda del propietario ]  Deuda del arrendatario
|
| Fecha        Periodo        Concepto                 Cuenta       Cargo       Pago o ajuste   Vence        Pendiente
| 01-11-2026   Octubre 2026   Gasto común              Ordinario    $250.000                    11-11-2026   $250.000
| 01-11-2026   Octubre 2026   Gasto común              Fondo        $12.500                     11-11-2026   $12.500
| Total                                                             $262.500    $0                           $262.500
+---------------------------------------------------------------------------------------------
```

- Una tarjeta por ámbito, en versión compacta (design system 5.8). Entre las tarjetas no hay total.
- La pestaña de cada deuda lista sus movimientos: cargos, pagos, ajustes ("Ajuste periodo AAAA-MM: motivo"), reversos y traspasos.
- Traspasos en la deuda del propietario (F-17): "Traspaso desde arriendo terminado el 05-12-2026" (CA-35) y "Saldo a favor traspasado desde arriendo terminado el {dd-mm-aaaa}". El administrador ve en la pestaña del arrendatario terminado su nombre y el traspaso de salida.
- Un pago anulado aparece con el chip "Anulado" y su reverso en la fila siguiente.
- La columna "Pendiente" la entrega la API (imputaciones de F-5); la pantalla no la calcula.
- El comité ve la misma pantalla sin "Registrar pago", y "Arrendatario" en lugar del nombre.

**Ejemplo con saldo a favor en un ámbito** (CA-49, después de emitir `2026-12`):

```text
| +-- Deuda del propietario ------- <Vencida> ---+ +-- Deuda del arrendatario --- <Saldo a favor> ---
| | $262.500                                     | | Pedro Soto
| | Vencido desde 11-11-2026: $262.500           | | A favor $37.500
| +----------------------------------------------+ +---------------------------------------------
```

- No se muestran $225.000 en ninguna parte (F-9, H-8).

## WEB-CTA-04 · Exportar planilla

```text
+-- Diálogo: Exportar planilla ------------------------------------------------
| Esta planilla contiene datos personales y deudas. Quedará registrada
|
| Contenido: unidad, nombre del propietario, RUT enmascarado, deuda y saldo a
| favor por deuda, vencido desde y cuotas impagas.
|
| ( Cancelar )                                         [[ Exportar planilla ]]
+-------------------------------------------------------------------------------
```

- Texto y contenido de la IA (menor 16; **Supuesto (a validar)**, UX-45). Solo administrador; el comité recibe GLB-01 si llega a la ruta.

## Estados

- **Vacío:** "Agrega unidades para poder emitir el gasto común." con "Importar planilla" y "Agregar unidad" (flujo de alta), si la comunidad no tiene unidades. Con filtro sin resultados: "No hay unidades con deuda vencida." (texto del diseño, UX-69).
- **Carga:** esqueleto de 5 filas con las columnas reales (GLB-10).
- **Error:** banner dentro de la tabla con "Reintentar" (GLB-05).
- **Unidad de otra comunidad por URL:** GLB-01 (CA-23).
