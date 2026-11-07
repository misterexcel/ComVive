# Flujo: registrar un pago manual y anularlo

Estado: Borrador
Actor: administrador (el comité ve pagos y anulaciones en modo lectura)
Superficie: web de administración
Alcance: MVP
Referencias en `docs/specs/gasto-comun.md`:

- Movimientos posteriores a la emisión: A-4 (S-17).
- Versión confirmada: A-7.
- Pagos: F-1 a F-4, F-6, F-9 (ámbito de los créditos), F-12 (un pago, un crédito por ámbito), F-13 (ocupación terminada) y F-15 (unidad sin propietario).
- Criterios de aceptación: CA-5, CA-11, CA-12, CA-15, CA-31, CA-32 y CA-40.

Otras referencias: `docs/arquitectura.md` §4 (vistas previas con `previewHash` y 409 `PREVIEW_OUTDATED`; idempotencia de pagos manuales).

En la interfaz, la corrección se llama **"Anular pago"**: un pago nunca se edita ni se borra; se registra un reverso que apunta al original (F-4). En los mensajes, `{dato}` marca un valor variable.

## Diagrama

```mermaid
flowchart TD
  A["Pagos o estado de cuenta de la unidad"] --> B["Registrar pago"]
  B --> C["Buscar unidad por código"]
  C --> C1{"¿Arrendatario vigente?"}
  C1 -->|No| D["Formulario: monto, fecha, medio, referencia"]
  C1 -->|Sí| C2["Aplicar a la deuda de: sin valor por defecto"]
  C2 --> C3{"¿Elección?"}
  C3 -->|Propietario o Arrendatario| D
  C3 -->|Ambos| C4["Monto por cada deuda"]
  C4 --> D
  D --> E["Aviso fijo: se registrará en el borrador vigente"]
  E --> F{"¿Posible duplicado?"}
  F -->|Sí| G["Advertencia sin bloqueo"]
  F -->|No| H["Guardar con la clave del formulario"]
  G --> H
  H --> I{"Respuesta"}
  I -->|Error de validación| J["Errores en el campo"]
  J --> D
  I -->|Corte de conexión| K["Consultar si el pago quedó registrado"]
  K --> L{"¿Registrado?"}
  L -->|No| H
  L -->|Sí| M
  I -->|Correcta| M["Comprobante con imputaciones por deuda"]

  M -.-> N["Detalle de pago"]
  N --> O{"¿Pago manual y no anulado?"}
  O -->|No| P["Anular no disponible, con explicación"]
  O -->|Sí| Q["Anular pago"]
  Q --> R["Motivo obligatorio"]
  R --> S["Vista previa de la anulación"]
  S --> S1["Confirmar con la versión de la vista previa"]
  S1 --> S2{"Respuesta"}
  S2 -->|409 cambió la cuenta| S
  S2 -->|409 ya anulado| P
  S2 -->|Correcta| T["Reverso en el borrador vigente"]
  T --> U["Pago Anulado e imputaciones recalculadas"]
```

## Pasos

**Registrar**

1. "Registrar pago" desde Pagos o desde el estado de cuenta de una unidad (en ese caso la unidad ya viene elegida). Al abrirse, el formulario genera su clave de idempotencia (F-2).
2. Se busca la unidad por código, con autocompletado.
3. **Aplicar a la deuda de** (F-9, M2). Va antes del monto y muestra la situación de cada deuda con los datos de la API:
   - **Unidad sin arrendatario vigente:** no se pregunta. El pago va a la deuda del propietario (ámbito `unidad`) y el formulario lo dice: "Se aplicará a la deuda del propietario".
   - **Unidad con arrendatario vigente:** opciones sin valor por defecto, cada una con su deuda y su saldo a favor:
     - "Propietario {nombre}: deuda ${monto} · a favor ${monto}"
     - "Arrendatario {nombre}: deuda ${monto} · a favor ${monto}"
     - "Ambos"
   - **"Ambos":** aparecen dos campos de monto, "Para la deuda del propietario" y "Para la deuda del arrendatario". Debajo, "Total del pago: ${suma}" como control contra el comprobante bancario; es la suma de los dos montos escritos, no un cálculo de deuda, y el comprobante final lo entrega la API (F-12).
   - **Unidad sin propietario registrado** (F-15): la opción "Propietario" se llama "Deuda de la unidad (propietario sin registrar)". Es la única forma de pagar ese ámbito.
   - **Ex arrendatario que paga después del término:** no hay opción para ocupaciones terminadas. La ayuda dice: "Los pagos de un arrendatario que ya no está se aplican a la deuda del propietario" (F-9, P-26).
4. **Formulario** (F-1):
   - **Monto:** campo de dígitos con máscara de miles. Envía un entero mayor que 0. Con "Ambos", cada campo es mayor que 0.
   - **Fecha de pago:** hoy por defecto. No se aceptan fechas futuras en hora de Chile (F-1, CA-15).
   - **Medio:** transferencia, depósito, efectivo, cheque u otro.
   - **Referencia:** obligatoria (F-1). La ayuda dice "Número de comprobante o de recibo. No incluyas datos personales". La referencia no tiene que ser única (F-2).
5. **Aviso fijo** bajo el formulario (A-4, S-17): "Se registrará en el periodo en borrador {mes} con fecha de pago {dd-mm-aaaa}."
6. **Posible duplicado** (F-3, CA-11, CA-31). El formulario consulta a la API y advierte sin bloquear en dos casos:
   - Misma unidad, monto, fecha y medio: "Ya existe un pago de ${monto} para {unidad} con fecha {dd-mm-aaaa} por {medio}. Revisa que no sea un duplicado".
   - Misma referencia (sin distinguir mayúsculas ni espacios), mismo medio y mismo monto en la comunidad: "Ya existe un pago de ${monto} por {medio} con la referencia "{referencia}" ({unidad}, {dd-mm-aaaa}). Revisa que no sea un duplicado".
7. **Guardar:** el envío lleva la clave del formulario. Un doble clic o un reintento con la misma clave devuelve el mismo pago (F-2). Ante un corte de conexión, la pantalla consulta si el pago quedó registrado antes de permitir reintentar, y reintenta con la misma clave.
8. **Comprobante:** muestra las imputaciones que hizo la API, separadas por deuda ("Deuda del propietario" y "Deuda del arrendatario"), por periodo y cuenta, más el saldo a favor si queda en cada una, y la deuda y el saldo a favor resultantes de cada ámbito. Botones "Registrar otro pago" y "Ver estado de cuenta".

**Anular**

1. Desde el detalle del pago, "Anular pago". Solo está disponible en pagos manuales no anulados (permiso `payment.void`).
2. Motivo obligatorio (UX-17), con la ayuda "No incluyas datos personales".
3. **Vista previa de la anulación** (`void-preview`, A-7): la pantalla muestra lo que entrega la API, por ámbito:
   - El reverso de ${monto} en el borrador vigente {mes}.
   - Los cargos que vuelven a quedar pendientes.
   - Los saldos a favor que se reimputan (F-6).
   - Con el flag `billing.interest` activo, los ajustes de intereses (E-10).
   - La deuda y el saldo a favor resultantes de cada ámbito.
   - Si el pago tiene un crédito por ámbito, la anulación revierte los dos: "Este pago se aplicó a dos deudas. Se anulará completo" (F-4).
4. **Confirmación:** "Se registrará un reverso de ${monto} en el periodo en borrador {mes}. El pago original no se borra." El envío lleva la versión de la vista previa (`previewHash`) y una clave de idempotencia.
5. **Resultado:** el pago queda con la etiqueta **Anulado**, enlazado a su reverso, y la pantalla muestra las imputaciones nuevas. El pago y el reverso siguen visibles en el estado de cuenta.

## Estados vacíos

- **Sin pagos en el filtro:** "No hay pagos registrados en este periodo." con "Registrar pago".
- **Deuda elegida en $0:** "Esta deuda no tiene saldo pendiente. El pago quedará como saldo a favor de {propietario o arrendatario}." (F-5). No bloquea.

## Errores

| Caso | Mensaje | Comportamiento |
| --- | --- | --- |
| Monto vacío o 0 | "Ingresa un monto mayor que $0" | El campo no acepta otros caracteres (B-5) |
| Fecha futura | "La fecha de pago no puede ser futura" (F-1, CA-15) | El campo es inválido |
| Unidad con arrendatario vigente sin elegir a qué deuda | "Elige a qué deuda aplicar el pago" (F-9, CA-32) | No se envía; si llega a la API, se rechaza sin escribir nada |
| Unidad no encontrada | "No hay unidades con ese código en esta comunidad" | Sugiere revisar el código |
| Posible duplicado | Textos del paso 6 (F-3) | Advertencia; permite guardar |
| Doble envío con la misma clave | Sin mensaje | Muestra el comprobante del pago ya registrado (F-2) |
| La cuenta cambió entre la vista previa y la anulación (409 `PREVIEW_OUTDATED`) | "La cuenta de la unidad cambió desde la vista previa. Revisa la nueva vista previa antes de anular" (A-7, CA-40) | Pide una vista previa nueva y marca lo que cambió |
| Anular un pago ya anulado | "El pago ya fue anulado" (409, CA-40) | Recarga el detalle con la etiqueta Anulado |
| Anular un pago Webpay | "Los pagos Webpay no se anulan desde ComVive" | Botón oculto con texto explicativo (F-4; 422 `PAYMENT_NOT_VOIDABLE`) |
| Sin conexión | "No se pudo confirmar el registro. Revisando…" | Consulta el estado y conserva los datos del formulario |
| Comité | Los botones "Registrar pago" y "Anular pago" no se muestran | 403 en la API (CA-24) |

## Carga

- **Búsqueda de unidad:** resultados al escribir, con un indicador pequeño.
- **Deudas por ámbito y advertencia de duplicado:** esqueleto en las opciones de "Aplicar a la deuda de" mientras responde la API.
- **Vista previa de la anulación:** esqueleto de la tabla.
- **Guardar y anular:** botón con indicador y bloqueo del doble envío.

## Supuestos (a validar)

- Los pagos sin unidad identificada quedan fuera de este flujo (UX-11).
- La lista de motivos de anulación está en UX-17.
- El "Total del pago" con "Ambos" se muestra como suma de lo escrito, solo como control visual.
