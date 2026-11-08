# Wireframes: Mis comunidades, Inicio y tareas pendientes (web)

Estado: Borrador
Responsable: disenador-ux
Aprobación: líder del proyecto

Flujos: `../flujos/admin-usuarios-y-roles.md` ("Tarea Revisar rol de comité") y `../flujos/admin-emitir-cerrar-periodo.md` (alertas de avisos). IA: `../arquitectura-de-informacion.md`, sección 1, "Inicio". Superficie: web de administración (1280 px). Marco: `comunes-estados-globales.md`.

Criterios de aceptación: CA-41 (intento en revisión en lectura), CA-45 (avisos sin notificar), CA-57 (tarea de comité) y CA-24 (el comité no actúa).

## WEB-INI-01 · Mis comunidades

Escenario: Carolina Lagos, administradora de la Comunidad A. La segunda comunidad es ilustrativa (recién creada por Operaciones ComVive).

```text
+-- Barra superior ---------------------------------------------------------------------------
| ComVive                                                             Mi cuenta   Cerrar sesión
+---------------------------------------------------------------------------------------------
| Mis comunidades
|
| +-----------------------------------------------------------------------------------------
| | Edificio Los Aromos                         Administración                    [ Entrar ]
| +-----------------------------------------------------------------------------------------
| | Edificio Mirador                            Administración  <Configuración pendiente>
| |                                                                               [ Entrar ]
| +-----------------------------------------------------------------------------------------
+---------------------------------------------------------------------------------------------
```

- Sin cifras agregadas entre comunidades (IA; panel consolidado **Posterior**, UX-18).
- No hay botón "Nueva comunidad": las crea Operaciones ComVive (UX-32 cerrada).
- Estado vacío: "Aún no tienes comunidades en ComVive. Cuando ComVive cree tu primera comunidad, aparecerá aquí." (flujo de alta).

## WEB-INI-02 · Inicio del administrador

Escenario compuesto, el 26-11-2026, Comunidad A: `2026-10` emitido el 01-11-2026 como en CA-1 ($1.050.000, vence el 11-11-2026); pago de $100.000 del Depto 101 (CA-5); aviso del Depto 101 sin notificar (CA-45); intento `OC-2026-0002` en revisión (CA-41); venta del Depto 201 de Rosa Díaz registrada el 15-11-2026 por Héctor Molina (CA-57); borrador `2026-11` con los gastos de CA-1.

```text
+-- Inicio · Edificio Los Aromos -------------------------------------------------------------
|
| +-[borde ámbar]- Tareas pendientes (1) ---------------------------------------------------
| | (user-round-cog)  Revisar rol de comité de Rosa Díaz
| |                   Venta registrada el 15-11-2026 por Héctor Molina          [[ Decidir ]]
| +------------------------------------------------------------------------------------------
|
| Alertas
| +------------------------------------------------------------------------------------------
| | {!} Avisos sin notificar: Depto 101                  [ Reenviar ]  > Ver contactos
| | {i} 1 pago en línea en revisión por Soporte ComVive                 > Ver intentos Webpay
| +------------------------------------------------------------------------------------------
|
| +-- Borrador vigente -------------------------+  +-- Último periodo emitido --------------
| | Noviembre 2026            <Borrador>        |  | Octubre 2026              <Emitido>
| | 4 gastos · $1.000.000                       |  | Emitido el 01-11-2026
| | 0 cargos directos · 0 egresos del fondo     |  | Vence el 11-11-2026
| | > Ir al borrador                            |  | Total emitido $1.050.000
| +---------------------------------------------+  | > Ver periodo
|                                                  +----------------------------------------
| +-- Recaudación ---------------------------------------------------------------------------
| | Recaudado de octubre 2026: $100.000 de $1.050.000 (9 %)
| | Pagos recibidos este mes: $100.000
| +------------------------------------------------------------------------------------------
|
| +-- Unidades con cuotas impagas -----------------------------------------------------------
| | Unidad      Cuotas impagas   Vencido desde
| | Depto 101   1                Venció el 11-11-2026
| | Depto 102   1                Venció el 11-11-2026
| | Depto 201   1                Venció el 11-11-2026
| | Depto 202   1                Venció el 11-11-2026
| | > Ver cuentas por unidad
| +------------------------------------------------------------------------------------------
+---------------------------------------------------------------------------------------------
```

- **Tareas pendientes** (design system 5.12): arriba de todo, sin botón de cerrar ni de posponer. Título de la spec ("Revisar rol de comité de {nombre}"). Si no hay tareas, el bloque no aparece.
- **Avisos sin notificar**: texto de G-6 y CA-45. "Reenviar" envía de nuevo la notificación; el vencimiento no cambia (E-1).
- **Pago en línea en revisión**: texto del diseño (UX-69). El administrador no resuelve: solo enlaza a la lectura de `web-pagos.md`, WEB-PAG-08.
- **Recaudación** (**Supuesto (a validar)**, UX-43): los dos montos y el porcentaje los entrega la API. La pantalla no divide.
- **Unidades con cuotas impagas** (F-8, S-64; UX-50 y UX-51 cerradas): cantidad de periodos emitidos y vencidos con capital pendiente, contada por unidad (un periodo con deuda en dos ámbitos cuenta una vez). Orden: cuotas impagas de mayor a menor; a igual cantidad, "Vencido desde" de la más antigua a la más reciente, y al final `sort_order`. Sin umbral ni marca para 3 o más cuotas (P-47 de la spec). "Vencido desde" es una fecha por unidad, la de vencimiento más antigua, y se rotula "Venció el {dd-mm-aaaa}" para que no se lea como el primer día de mora (texto del diseño, UX-69). En el ejemplo, las cuatro unidades empatan en cuotas y fecha, así que el orden es el de `sort_order`.
- Montos: CA-1, CA-5 y CA-48 (foto del 30-11: $110.000, $262.500, $262.500 y $315.000).

**Carga:** esqueleto de cada bloque; el de Tareas pendientes se pide primero (`admin-tasks?status=open`) para que no aparezca después y mueva la pantalla. **Error de un bloque:** banner `danger` dentro del bloque con "Reintentar" (GLB-05); los demás bloques siguen visibles.

## WEB-INI-03 · Decidir la tarea "Revisar rol de comité"

Panel lateral de 480 px sobre Inicio. La clave de idempotencia se genera al abrir el panel.

```text
+-- Inicio (velado) --------------------------+-- Panel: Revisar rol de comité ---------------
|                                             | Rosa Díaz dejó de ser propietario en la
|                                             | comunidad y sigue en el comité. Mientras no
|                                             | decidas, conserva su acceso de comité.
|                                             |
|                                             | Venta registrada el 15-11-2026 por
|                                             | Héctor Molina
|                                             |
|                                             | Decisión (obligatorio)
|                                             | +----------------------------------------
|                                             | | ( ) Revocar el rol
|                                             | +----------------------------------------
|                                             | +----------------------------------------
|                                             | | ( ) Mantener el rol
|                                             | |     Por ejemplo, si representa a una
|                                             | |     persona jurídica propietaria o la
|                                             | |     asamblea la mantuvo.
|                                             | +----------------------------------------
|                                             |
|                                             | Motivo (obligatorio)
|                                             | [ Ya no es copropietaria               ]
|                                             | No incluyas datos personales
|                                             |
|                                             | ( Cancelar )      [[ Confirmar decisión ]]
+---------------------------------------------+-----------------------------------------------
```

- Textos del flujo. Opciones sin valor por defecto (`RadioGroup`, design system 5.2). El motivo "Ya no es copropietaria" es el de CA-57.
- Con "Revocar el rol" marcado, el botón pasa a `danger` con el texto "Revocar el rol" (design system 5.1, acciones que quitan).

**Resultado** (banner `success` en Inicio, que se queda hasta que la persona lo cierra):

```text
| {ok} Revocaste el rol de comité de Rosa Díaz. La tarea quedó cerrada
```

o, al mantener: "Mantuviste el rol de comité de Rosa Díaz. La tarea quedó cerrada" (F-17). La tarea sale del bloque para todos los administradores.

**Errores** (spec, tal cual):

| Caso | Texto | Comportamiento |
| --- | --- | --- |
| 422 `REASON_REQUIRED` | "Indica el motivo de tu decisión" | Error en el campo Motivo; el foco va al campo |
| Sin decisión elegida | "Elige una decisión" (texto del diseño, UX-69) | Validación del formulario; no llama a la API |
| 409 `TASK_ALREADY_RESOLVED` | "Esta tarea ya fue resuelta" | Cierra el panel, muestra el texto como banner `warning` y recarga Tareas pendientes |
| 422 `IDEMPOTENCY_KEY_REUSED` | GLB-08 | Cierra el panel |
| Corte de conexión | "Revisando si el cambio quedó registrado…" | GLB-07 |

## WEB-INI-04 · Inicio del comité

Escenario: Rosa Díaz como comité, mismo momento que WEB-INI-02 (conserva el rol mientras la tarea está abierta).

```text
+-- Inicio · Edificio Los Aromos -------------------------------------------------------------
|
| Alertas
| +------------------------------------------------------------------------------------------
| | {!} Avisos sin notificar: Depto 101
| | {i} 1 pago en línea en revisión por Soporte ComVive                 > Ver intentos Webpay
| +------------------------------------------------------------------------------------------
|
| (Borrador vigente, Último periodo emitido, Recaudación y Unidades con cuotas impagas
|  iguales que el administrador, sin botones de acción)
+---------------------------------------------------------------------------------------------
```

- Sin bloque Tareas pendientes: la API responde 404 a `admin-tasks` y la web no lo pide (CA-57).
- Sin "Reenviar" ni "Ver contactos" (el comité no ve teléfonos ni correos).
- Si un miembro del comité abre por enlace la URL de la tarea: GLB-01.
- Estado vacío del comité sin periodos emitidos: "Todavía no hay periodos emitidos para revisar." (flujo de emisión).

## WEB-INI-05 · Notificaciones de la tarea (fuera de la web)

```text
Push (pantalla bloqueada)                     Correo
+------------------------------------------   +---------------------------------------------
| ComVive                                     | Asunto: Revisa el rol de comité de Rosa Díaz
| Tienes una tarea pendiente sobre el         |
| comité de Edificio Los Aromos               | Rosa Díaz dejó de ser propietario en Edificio
+------------------------------------------   | Los Aromos y sigue en el comité. Decide si
                                              | mantienes o revocas su rol en Inicio > Tareas
                                              | pendientes
                                              +---------------------------------------------
```

- Textos de la spec ("Comité que deja de ser propietario"). Sin montos, deudas ni la unidad vendida; el push no lleva el nombre.
- CA-57 escribe "{comunidad}" como "Comunidad A"; en la interfaz se usa el nombre de la comunidad, "Edificio Los Aromos".
