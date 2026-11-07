# Flujo: emitir y cerrar el periodo de gasto común

Estado: Borrador
Actor: administrador (el comité ve las mismas pantallas en modo lectura)
Superficie: web de administración
Alcance: MVP
Referencias en `docs/specs/gasto-comun.md`:

- Ciclo del periodo: A-2, A-3.1 a A-3.7, A-5 y A-7 (versión confirmada).
- Gastos y cargos: B-1 a B-5.
- Unidad sin propietario registrado: F-15.
- Aviso de cobro y notificación: G-2, G-4 a G-6.
- Vencimiento: E-1 (S-29). Intereses: E-7, solo con el flag `billing.interest`.
- Criterios de aceptación: CA-1, CA-19, CA-20, CA-24, CA-25, CA-38, CA-39, CA-45 y CA-46.
- Casos borde: "Comunidad sin unidades".

Otras referencias: `docs/arquitectura.md` §4 (`issue-preview`, `previewHash` y 409 `PREVIEW_OUTDATED`; idempotencia).

Este flujo no define montos ni cálculos: los calcula la API según la spec. La interfaz ordena los pasos y muestra lo que devuelve la API. En los mensajes, `{dato}` marca un valor variable.

## Diagrama

```mermaid
flowchart TD
  A["Gasto común: periodos"] --> B["Borrador vigente"]
  B --> C["Gastos"]
  B --> D["Cargos directos"]
  B --> E["Egresos del fondo"]
  C --> F["Preparar emisión"]
  D --> F
  E --> F
  F --> G["Ingresar saldo de caja y fecha de corte"]
  G --> H["Vista previa y validaciones de la API, con su versión"]
  H --> I{"¿Bloqueos?"}
  I -->|Sí| J["Lista de bloqueos con enlace para corregir"]
  J --> B
  I -->|No| K{"¿Advertencias?"}
  K -->|Sí| L["Mostrar advertencias"]
  L --> M{"¿Continuar?"}
  M -->|No| B
  M -->|Sí| N["Confirmar emisión con resumen"]
  K -->|No| N
  N --> O["Emitir con versión y clave de idempotencia"]
  O --> P{"Respuesta"}
  P -->|Correcta| Q["Periodo Emitido y nuevo borrador creado"]
  P -->|409 el borrador cambió| H
  P -->|409 ya emitido| S["El periodo ya fue emitido"]
  S --> Q
  P -->|Error| R["No se emitió nada"]
  R --> B
  P -->|Corte de conexión| T["Consultar estado del periodo"]
  T --> U{"¿Quedó emitido?"}
  U -->|Sí| Q
  U -->|No| O
  Q --> V["Avisos PDF y notificación automática"]
  V --> V1{"¿Avisos sin notificar o PDF con error?"}
  V1 -->|Sí| V2["Alerta: reenviar o reintentar"]
  V1 -->|No| W
  V2 --> W["Cerrar periodo"]
  W --> X["Confirmar cierre irreversible"]
  X --> Y["Periodo Cerrado con foto de saldos"]
```

## Pasos

**Borrador vigente**

1. Siempre existe un único borrador vigente (A-2). "Periodos" lo muestra arriba. No hay botón para crear periodos.
2. **Gastos:** tabla con concepto, cuenta, subcategoría, base de pesos, monto y respaldo. El formulario lateral para agregar tiene:
   - **Cuenta:** ordinario, con una subcategoría (administración, mantención, reparación, uso o consumo), o extraordinario (B-1, B-2).
   - **Base:** alícuota (por defecto) o partes iguales. Con partes iguales se eligen las unidades del conjunto.
   - **Monto:** campo de dígitos con máscara de miles y mayor que 0 (B-5).
   - **Concepto:** ayuda "Aparece en el resumen que ven los residentes. No incluyas nombres de personas". Las remuneraciones se agrupan solas en "Remuneraciones del personal" (G-8).
3. **Cargos directos** por unidad (B-4):
   - Consumo individual: se ingresa el monto, que se calcula fuera de ComVive.
   - Multa: con motivo y referencia al reglamento o al acuerdo. Ayuda: "El motivo aparece en el aviso. No incluyas datos personales".
   - Otro: a la cuenta ordinario o extraordinario.
4. **Egresos del fondo de reserva:** monto y referencia de texto libre a la autorización (B-3).
5. **Ajustes recibidos:** lista de solo lectura con los ajustes que dejaron las correcciones y anulaciones de gastos de periodos anteriores (ver `admin-corregir-gasto.md`), con su ámbito.

**Emisión**

1. "Preparar emisión" pide el **saldo de caja** (G-4, S-16):
   - **Monto:** campo de dígitos con máscara de miles que **acepta $0** y un selector "Saldo positivo / Saldo negativo (sobregiro)" (menor 4). Es la única excepción a la regla de montos mayores que 0 de la interfaz, porque no es un cobro sino un dato informativo del aviso (pregunta UX-27).
   - **Fecha de corte:** no puede ser futura; por defecto, el último día del mes del periodo.
2. La pantalla llama a `issue-preview` (arquitectura §4), que devuelve la vista previa y su versión (`previewHash`). Muestra:
   - **Bloqueos:**
     - La comunidad no tiene unidades (casos borde).
     - Las alícuotas no suman 100 %, solo si algún grupo usa alícuota (A-3.1).
     - Un grupo tiene total y ninguna unidad con participación (A-3.2).
   - **Advertencias:**
     - Periodo sin gastos (CA-20).
     - Unidades sin propietario registrado (F-15, CA-38).
     - Unidades sin ningún canal de notificación (sin app ni correo): "{n} unidades no recibirán la notificación del aviso. Revisa sus contactos". Ayuda a prevenir "Avisos sin notificar".
     - Falta la tasa CMF, solo con el flag `billing.interest` activo (E-7).
   - **Vista previa:** tabla por unidad y ámbito, con una columna por cuenta (ordinario, fondo de reserva, extraordinario, intereses y multas) y la suma de cada columna. Las unidades con $0 aparecen con $0 (C-5). Si la unidad tiene arrendatario vigente, su fila dice "Arrendatario" o "Propietario" según el ámbito al que irán los cargos (F-9).
   - **Bloque aparte, "No forma parte del total emitido":** ajustes recibidos de periodos anteriores y saldos anteriores por unidad y ámbito, que sí aparecerán en cada aviso (menor 5).
3. **Confirmación:** "Vas a emitir el periodo octubre 2026: 4 avisos, total emitido $1.050.000, vencimiento 11-11-2026. Después no podrás editar sus gastos. Se creará el borrador de noviembre 2026 y se notificará a los residentes." Botón "Emitir periodo".
   - "Total emitido" es siempre Σ cargos del periodo, tal como lo entrega la API. Nunca incluye ajustes ni saldos anteriores.
4. **Envío:** lleva la versión de la vista previa confirmada (A-3.6, A-7) y una clave de idempotencia generada al abrir la confirmación (A-3.4). Si el administrador hace doble clic o reintenta con la misma clave, recibe el mismo resultado (CA-25).
5. **El borrador cambió (409 `PREVIEW_OUTDATED`, CA-39):** "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir". La pantalla pide una vista previa nueva, marca las filas y totales que cambiaron y vuelve a pedir confirmación. También pasa si la vista previa es de otro día (cambia la fecha de emisión).
6. **Resultado:** el periodo queda **Emitido**, con los avisos en PDF y el borrador M+1 creado.
   - **Notificación automática (G-6, menor 6):** al terminar la emisión, ComVive notifica a cada propietario y a cada arrendatario vigente. No hay botón "Notificar a residentes".
   - **Avisos sin notificar (CA-45):** alerta en el periodo y en Resumen: "Avisos sin notificar: {unidades}". Cada unidad tiene "Reenviar" y el enlace a sus contactos. El vencimiento no cambia (E-1, S-29).
   - **Avisos PDF:** cada aviso muestra su estado: "Generando", "Listo" o "Error al generar" con "Reintentar". El RUT del propietario va siempre enmascarado (G-2, S-30, CA-46).

**Cierre**

1. Desde el periodo Emitido, "Cerrar periodo" (A-5).
2. Confirmación: "Al cerrar octubre 2026 no se podrá modificar. Las correcciones se harán con ajustes en el borrador vigente." Para confirmar, el administrador escribe el periodo (`2026-10`).
3. Resultado: el periodo queda **Cerrado** y la foto de saldos se puede descargar.
4. El cierre no muestra advertencias de conciliación (A-5.2).

## Estados vacíos

- **Borrador sin gastos:** "Aún no hay gastos en este periodo." con "Agregar gasto". La emisión pide confirmación (CA-20).
- **Sin cargos directos:** "No hay multas ni consumos este mes."
- **Sin ajustes recibidos:** "No hay ajustes de periodos anteriores."
- **Sin periodos emitidos (vista del comité):** "Todavía no hay periodos emitidos para revisar."
- **Todos los avisos notificados:** la alerta no aparece.

## Errores

| Caso | Mensaje | Comportamiento |
| --- | --- | --- |
| Comunidad sin unidades | "Agrega unidades para poder emitir el gasto común" | Bloqueo con enlace a Unidades |
| Alícuotas no suman 100 % | "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" (A-3.1, CA-19) | Bloqueo con enlace a Unidades |
| Grupo sin participación | "El grupo {cuenta} / {base} no tiene unidades con participación para repartir ${total}" (A-3.2) | Bloqueo con enlace al gasto |
| Periodo sin gastos | "El periodo no tiene gastos. Se emitirán avisos con cargo $0" (CA-20) | Pide confirmación |
| Unidad sin propietario registrado | "Unidades sin propietario registrado: {lista}. Su aviso se emitirá a nombre de 'Propietario sin registrar'" (F-15, CA-38) | Advertencia con enlace a Ocupantes; se puede emitir |
| Falta tasa CMF (solo con el flag activo) | "Falta la tasa de referencia CMF desde {fecha}. Se emitirá sin intereses y se cobrarán en la próxima emisión" (E-7) | Advertencia; se puede emitir |
| Monto de gasto 0 o vacío | "Ingresa un monto mayor que $0" | El campo no acepta otros caracteres (B-5) |
| Fecha de corte futura | "La fecha de corte no puede ser futura" | El campo es inválido |
| Saldo de caja vacío | "Ingresa el saldo de caja. Puede ser $0" | El campo es inválido |
| El borrador cambió desde la vista previa | "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir" (409, A-7, CA-39) | Nueva vista previa con los cambios marcados |
| Falla en la emisión | "No se pudo emitir. No se creó ningún cargo. Intenta de nuevo." | El periodo sigue en Borrador (A-3.3) |
| Otra emisión con otra clave | "El periodo ya fue emitido" (409, A-3.4) | Recarga el periodo |
| Corte de conexión al emitir | "Revisando si el periodo quedó emitido…" | Consulta el estado; si no quedó emitido, reintenta con la misma clave |
| Error al generar un PDF | "No se pudo generar el aviso de {unidad}" | El periodo sigue Emitido; "Reintentar" genera el mismo aviso con los mismos montos (G-5) |
| Notificación no entregada | "Avisos sin notificar: {unidades}" (G-6, CA-45) | "Reenviar"; la emisión no se revierte |
| Intento de editar un periodo Emitido o Cerrado | Los botones de edición no se muestran; aparecen "Corregir" y "Anular gasto" | Sección H |
| Comité | Los botones de acción no se muestran | 403 en la API (CA-24) |

## Carga

- **Vista previa:** esqueleto de tabla mientras responde `issue-preview`.
- **Emisión:** pantalla bloqueante "Emitiendo periodo… no cierres esta ventana". Si los PDF tardan, el periodo ya figura como Emitido y cada aviso muestra "Generando".
- **Notificaciones:** el periodo muestra "Notificando a residentes: {n} de {total}" hasta terminar; luego la alerta si hubo fallas.
- **Cierre:** indicador en el botón y bloqueo del doble clic.

## Supuestos (a validar)

- El cierre se confirma escribiendo el periodo, porque es irreversible.
- El saldo de caja acepta $0 y negativos (UX-27).
- La fecha de corte propuesta es el último día del mes del periodo.
- La advertencia de unidades sin canal de notificación sale de la vista previa (requisito para el arquitecto, UX-28).
