# Wireframes: ocupantes, arriendos y ventas (web)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujo: `../flujos/admin-ocupaciones.md`. Superficie: web de administración (1280 px). Personas y ocupaciones: `docs/qa/comunidades-simuladas.md`, "Comunidad A · personas y ocupaciones".

Reglas que se ven en estas pantallas (spec F-9, F-13, F-14, F-15, A-7, "Comité que deja de ser propietario"):

- Un ingreso o término con fecha pasada rige desde que se registra. Los cargos ya emitidos no cambian de responsable.
- Alta, término y venta se confirman contra su vista previa (`previewHash`) con clave de idempotencia. La cancelación de un arriendo programado no tiene vista previa.
- Cada ocupación muestra su fecha declarada y la fecha y hora de registro, con quién registró.
- Solo el administrador actúa. El comité ve la pestaña con datos limitados.

Criterios de aceptación: CA-21, CA-22, CA-35, CA-37, CA-38, CA-44, CA-53, CA-54, CA-56, CA-57 y CA-61.

## WEB-OCU-01 · Pestaña Ocupantes

Escenario: Depto 102, el 02-12-2026, con O-1 vigente (CA-22).

```text
+-- Unidades y residentes · Depto 102 --------------------------------------------------------
| Datos de la unidad   [ Ocupantes ]   Estado de cuenta
|
| Propietario
| Luis Muñoz · 12.345.670-K · +56 9 **** 5678 · <Activo>
| Ingreso declarado: {fecha} · Registrado: {fecha y hora} por Carolina Lagos     [ Registrar venta ]
|
| Arrendatario vigente                                                       <Vigente>
| Pedro Soto · 15.234.567-4 · pedro@{dominio} · <Activo>
| Ingreso declarado: 15-11-2026 · Registrado: 15-11-2026 por Carolina Lagos  [ Terminar arriendo ]
|
| Deuda por ámbito
| Deuda del propietario: $262.500 · A favor: $0            > Estado de cuenta
| Deuda del arrendatario: $262.500 · A favor: $0           > Estado de cuenta
|
| Historial
| Relación       Persona               Ingreso (declarado / registrado)   Término (declarado / registrado)   Estado
| Arrendatario   {arrendatario anterior}  {fecha} / {fecha}              31-10-2026 / {fecha}               <Terminada>
+---------------------------------------------------------------------------------------------
```

- Datos de las personas: `comunidades-simuladas.md`. Contactos y fechas que no fija la tabla de personas van entre llaves. CA-22 solo dice que la ocupación anterior terminó el 31-10-2026.
- Chip "Activo" o "Pendiente": estado de la invitación (design system 5.6). "Vigente" y "Terminada": textos del diseño (UX-61).
- "Terminar arriendo" solo existe en el arrendatario; el propietario cambia solo con "Registrar venta". Si una petición de término o cancelación sobre la ocupación del propietario llega a la API, responde 422 `USE_OWNERSHIP_TRANSFER`, "Para cambiar al propietario, registra la venta".
- **Estados vacíos:** "Esta unidad no tiene propietario ni arrendatario registrados." con "Registrar propietario"; "Sin arrendatario" con "Registrar arrendatario"; "No hay ocupaciones anteriores."

## WEB-OCU-02 · Registrar arrendatario

```text
+-- Panel: Registrar arrendatario -----------------------------------------------------------
| RUT (obligatorio)                 [ 13.579.246-2            ]
| Nombre (obligatorio)              [ Daniela Fuentes         ]
| Teléfono o correo (obligatorio)   [ +56 9 ________          ]
| Fecha de ingreso (obligatorio)    [ 05-12-2026 (calendario) ]
|
| ( Cancelar )                                                       [ Ver vista previa ]
+---------------------------------------------------------------------------------------------
```

- La fecha de ingreso sí acepta fechas futuras (arriendo programado, F-14). RUT inválido: "Ingresa un RUT válido. Revisa el dígito verificador" (`INVALID_RUT`).

**Vista previa según la fecha** (textos de la spec y del flujo):

```text
Hoy (texto del diseño, flujo paso 3)
| Desde hoy, los cargos que se emitan para Depto 102 irán a la deuda de Daniela Fuentes. Los
| cargos ya emitidos siguen siendo del propietario.

Pasada (CA-37: Camila Rojas, ingreso 15-11-2026 registrado el 03-12-2026)
| {!} La fecha de ingreso es anterior a hoy. Los cargos ya emitidos no cambian de responsable
| El arriendo rige en ComVive desde hoy, 03-12-2026. Si el arrendatario debe pagar cargos
| anteriores, acuérdenlo entre propietario y arrendatario.

Futura (CA-53: Daniela Fuentes, ingreso 05-12-2026 registrado el 25-11-2026)
| {i} El arriendo comienza el 05-12-2026. Hasta entonces, los cargos siguen siendo del
|     propietario y Daniela Fuentes no tiene acceso
```

```text
+-- Vista previa: registrar arrendatario ----------------------------------------------------
| (texto según la fecha, arriba)
|
| {i} Esta persona ya tiene cuenta en ComVive; se le agregará esta unidad.  <- solo si existe
|
| Se le informará en la invitación:
| "El propietario de la unidad puede ver tu nombre, tu deuda de gasto común y los pagos que se
| aplican a ella. La administración de la comunidad ve todos tus datos de cobro"
|
| ( Volver a editar )                                         [[ Registrar arrendatario ]]
+---------------------------------------------------------------------------------------------
```

- Si la persona ya existe, no se muestran sus datos ni sus otras comunidades (arquitectura §2).
- **Resultado:** ocupación vigente o programada y la oferta "Enviar invitación ahora" (`app-ingreso.md`). Con fecha futura, la persona no recibe acceso ni notificaciones hasta su fecha.

**Errores:**

| Caso | Código | Texto (spec) | Comportamiento |
| --- | --- | --- | --- |
| Ya hay arrendatario vigente o programado (CA-53) | 409 `TENANT_ALREADY_ACTIVE` | "La unidad ya tiene un arrendatario vigente o programado. Registra su término o cancela el arriendo programado antes de agregar otro" | Banner con enlaces a "Terminar arriendo" o "Cancelar arriendo programado" |
| La persona ya es propietaria de la unidad | 409 `ALREADY_OWNER` | "Esta persona ya es propietaria de esta unidad" | Banner; no se guarda |
| RUT inválido | 422 `INVALID_RUT` | "Ingresa un RUT válido. Revisa el dígito verificador" | Bajo el campo |
| Cambió la cuenta desde la vista previa | 409 `PREVIEW_OUTDATED` | Sin texto en la spec. **Supuesto (a validar), UX-55:** "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar" | GLB-06 |

## WEB-OCU-03 · Arriendo programado y su cancelación

Escenario: CA-61, Depto 102, el 26-11-2026. O-4 (Daniela Fuentes) programada desde el 05-12-2026.

```text
| Arrendatario programado                   <Programado: comienza el 05-12-2026>
| Daniela Fuentes · 13.579.246-2 · <Pendiente>
| Ingreso declarado: 05-12-2026 · Registrado: 25-11-2026 por Carolina Lagos
|                                                        [ Cancelar arriendo programado ]

+-- Diálogo: Cancelar arriendo programado --------------------------------------
| El arriendo de Daniela Fuentes no comenzará. Quedará como Cancelado en el
| historial. No hay cargos ni traspasos.
|
| Motivo (obligatorio)
| [ El arrendatario desistió del contrato                       ]
| No incluyas datos personales
|
| ( Volver )                              [! Cancelar arriendo programado !]
+-------------------------------------------------------------------------------
```

- Texto del flujo. Motivo: CA-61. Sin vista previa: no mueve dinero.
- Resultado: en el historial, "Cancelada" con su motivo, fecha y hora, y quién canceló. Después se puede registrar otro arrendatario (O-5, CA-61).

| Caso | Código | Texto (spec) |
| --- | --- | --- |
| Ocupación de propietario | 422 `USE_OWNERSHIP_TRANSFER` | "Para cambiar al propietario, registra la venta" |
| Ya comenzó (el mismo día de su ingreso) | 409 `OCCUPANCY_ALREADY_STARTED` | "Este arriendo ya comenzó. Para terminarlo, registra su término" |
| Ya terminó | 409 `OCCUPANCY_ALREADY_ENDED` | "Este arriendo ya terminó" |
| Ya cancelado (otra clave) | 409 `OCCUPANCY_CANCELLED` | "Este arriendo ya fue cancelado" |
| Sin motivo | 422 `REASON_REQUIRED` | "Indica el motivo de la cancelación" |

- Los 409 cierran el diálogo, muestran el texto como banner y recargan la pestaña. El estado se valida antes que el motivo (CA-61).

## WEB-OCU-04 · Terminar arriendo

Escenario: CA-56, Depto 102, el 08-12-2026. O-1 (Pedro Soto); ámbito del arrendatario con $262.500 de `2026-11` (vence el 11-12-2026); ámbito del propietario con $262.500 de `2026-10`.

```text
+-- Panel: Terminar arriendo de Pedro Soto --------------------------------------------------
| Fecha de término (obligatorio)    [ 08-12-2026 (calendario) ]
|                                                                    [ Ver vista previa ]
|
| Vista previa
| Pasa a la deuda del propietario
| Periodo          Cuenta              Monto       Vence
| Noviembre 2026   Ordinario           $250.000    11-12-2026
| Noviembre 2026   Fondo de reserva    $12.500     11-12-2026
|
| Saldo a favor del arrendatario que pasa: $0
| Deuda del propietario: $262.500 antes · $525.000 después
|
| Pedro Soto dejará de tener acceso a la unidad de inmediato.
|
| ( Cancelar )                                                   [! Terminar arriendo !]
+---------------------------------------------------------------------------------------------
```

- Montos: CA-56 (vista previa h1). Los vencimientos se conservan (E-11).
- La fecha no permite días posteriores a hoy. Con el 10-12-2026: "Registra el término el día que ocurra" (422 `END_DATE_IN_FUTURE`). Anterior al ingreso: "La fecha de término no puede ser anterior al ingreso (15-11-2026)" (`END_BEFORE_START`).
- **Advertencias** que pueden aparecer en la vista previa (F-13, F-14):

```text
| {!} La fecha de término es anterior a hoy. Lo pendiente del arriendo, incluidos los cargos
|     emitidos desde esa fecha, pasa hoy a la deuda del propietario
| {!} Hay un pago en línea en curso del arrendatario. Si se confirma, se aplicará a la deuda
|     de la unidad                                                              <- CA-35
| {!} Hay un pago en línea del arrendatario en revisión por ComVive. Si se registra, se
|     aplicará a la deuda de la unidad                                          <- CA-54
```

- **Sin nada pendiente:** "El arrendatario no tiene deuda ni saldo a favor. No se moverá dinero." (flujo).

**409 por cambios en la cuenta** (CA-56: otro administrador registró $100.000 en la deuda del arrendatario):

```text
| {!} La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes
|     de confirmar
| | Noviembre 2026   Ordinario           $150.000    11-12-2026   <Cambió>
|   Noviembre 2026   Fondo de reserva    $12.500     11-12-2026
| | Deuda del propietario: $262.500 antes · $425.000 después        <Cambió>
```

- Montos: CA-56 (vista previa h2).
- **Resultado:** banner `success` "Se registró el término del arriendo de Pedro Soto." (texto del diseño, UX-69). En el estado de cuenta del propietario aparece "Traspaso desde arriendo terminado el 08-12-2026" (F-17, CA-56). El ex arrendatario recibe GLB-02 o APP-09 desde ese momento.
- **Ya terminado:** 409 `OCCUPANCY_ALREADY_ENDED`, "Este arriendo ya terminó"; recarga la pestaña.

## WEB-OCU-05 · Registrar venta

Escenario: CA-57, Depto 201, el 15-11-2026. Rosa Díaz (propietaria e integrante del comité, sin otras unidades) vende. Comprador ilustrativo: Sofía Herrera, 21.098.765-{dv} (no está en `comunidades-simuladas.md`).

```text
+-- Panel: Registrar venta de Depto 201 -----------------------------------------------------
| Nuevo propietario
| RUT (obligatorio)                       [ 21.098.765-_            ]
| Nombre (obligatorio)                    [ Sofía Herrera           ]
| Teléfono o correo (obligatorio)         [ ________________        ]
| Fecha de inscripción o entrega (oblig.) [ 15-11-2026 (calendario) ]
|                                                                    [ Ver vista previa ]
| Vista previa
| Sale: Rosa Díaz · Entra: Sofía Herrera
| La deuda del propietario, $262.500, sigue a la unidad y pasa a ser responsabilidad de Sofía
| Herrera, incluida la anterior a la compra (Ley 21.442, art. 6).
|
| {!} Rosa Díaz integra el comité y dejará de ser propietario en la comunidad. Su rol de
|     comité no se revoca automáticamente: decide si lo mantienes o lo revocas
|
| Rosa Díaz dejará de tener acceso a la unidad de inmediato.
|
| ( Cancelar )                                                       [[ Registrar venta ]]
+---------------------------------------------------------------------------------------------
```

- Textos del flujo y de la spec ("Comité que deja de ser propietario"). La venta no mueve dinero: $262.500 siguen en el ámbito del propietario (CA-57).
- Con saldo a favor: "El saldo a favor de ${monto} queda en la unidad" (UX-38). Con arriendo vigente: "El arriendo vigente de Depto 201 no cambia".
- Fecha pasada: "La fecha de venta es anterior a hoy. Los avisos ya emitidos siguen a nombre del propietario anterior y la deuda de la unidad no cambia". Fecha futura: "Registra la venta el día que ocurra" (`END_DATE_IN_FUTURE`).
- 409 `PREVIEW_OUTDATED`: "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de confirmar" (GLB-06).

**Resultado:**

```text
| {ok} Se registró la venta de Depto 201. Sofía Herrera es la nueva propietaria.
|      [ Enviar invitación ahora ]
| {i}  Se creó la tarea Revisar rol de comité de Rosa Díaz   > Ir a la tarea
```

- Segunda línea: texto del flujo. Primera: texto del diseño (UX-69). La tarea se resuelve en `web-inicio-y-tareas.md`, WEB-INI-03.

## WEB-OCU-06 · Registrar propietario faltante

Escenario: CA-38, Depto 102 sin propietario registrado y con O-3 (Jorge Vera) vigente.

```text
| Propietario                                    <Propietario sin registrar>
| Su aviso sale a nombre de "Propietario: sin registrar" y no se notifica a ningún propietario.
|                                                                [ Registrar propietario ]
```

- Usa el mismo formulario y las mismas rutas de la venta, sin la parte del propietario que sale (flujo). La primera frase cita F-15; la frase completa es del diseño (UX-69).

## WEB-OCU-07 · Vista del comité

```text
| Propietario
| Luis Muñoz · 12.345.***-* · Alícuota 25,0000 %
| Arrendatario vigente
| Arrendatario
| Deuda del propietario: $262.500 · A favor: $0
| Deuda del arrendatario: $262.500 · A favor: $0
```

- Sin contactos, sin nombre ni RUT del arrendatario y sin botones (S-33, CA-44). Si una acción llega a la API: GLB-03 (CA-61).

## Carga y conexión

- Esqueleto de la tabla en las vistas previas del alta, del término y de la venta.
- Confirmar: botón con indicador y bloqueo del doble envío. Corte de conexión: "Revisando si el cambio quedó registrado…" (GLB-07).
- Misma clave con otros datos: GLB-08.
