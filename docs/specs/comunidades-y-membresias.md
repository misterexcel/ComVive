# Especificación: Comunidades, unidades y membresías

Estado: Para revisión del líder del proyecto (rev. 1, borrador del analista; antes pasa por el revisor crítico)
Responsable: analista-producto
Aprobación: líder del proyecto

> **Rebanada 1 de la Etapa 2.** Cubre las tarjetas F1 (alta de comunidad y unidades, con alícuotas), F2 (usuarios y roles), F3 (ocupaciones: arriendos y cambios de propietario) y, solo en lo que la rebanada necesita, F4 (primer ingreso por invitación). F4 se deja para una rebanada propia junto con el ingreso de ADR 0005 (ver "Alcance" y regla CM-F1).
>
> **Nombre del archivo.** La plantilla pide una spec por módulo. El módulo es "Comunidades y membresías": la comunidad, sus unidades con alícuotas, las personas y sus membresías por rol. Las ocupaciones son parte del módulo porque crean y terminan las membresías de residente, pero sus reglas de dinero y de ámbito ya están en `docs/specs/gasto-comun.md` (rev. 9, aprobada) y aquí solo se citan y se completan.
>
> **Relación con la spec de gasto común.** Esta spec **no duplica** reglas aprobadas. Donde una regla ya existe, se cita por su sección o su id ("GC" = `docs/specs/gasto-comun.md`; por ejemplo, GC F-14 o GC S-34). Solo se agrega lo que falta. Los vacíos y las contradicciones encontrados están en "Contradicciones y vacíos en documentos aprobados".
>
> **Identificadores propios (prefijo `CM`)**, para no chocar con los de gasto común (S-1 a S-87, P-1 a P-62, CA-1 a CA-77): reglas `CM-A1`, `CM-B1`, etc.; criterios de aceptación `CA-CM-n`; supuestos `S-CM-n`; preguntas `P-CM-n`. Los códigos de error nuevos no repiten ninguno existente salvo donde se dice "se reutiliza".

## Objetivo

Que Operaciones ComVive dé de alta una comunidad con su primer administrador, y que ese administrador cargue las unidades con sus alícuotas, registre a propietarios y arrendatarios y otorgue los roles de comité y conserjería, con datos personales mínimos, auditoría y aislamiento entre comunidades. Es la base de datos y de permisos sobre la que se emite el gasto común.

## Alcance de la rebanada 1

La rebanada 1 se entrega como base de datos, API y pruebas automáticas. Por la decisión del líder D37 (ADR 0009), el ingreso de ADR 0005 queda fuera y la rebanada se prueba con dobles del verificador de sesión; por eso puede llegar a "Validación", pero no a "Hecho", hasta que exista el ingreso. Las pantallas ya están diseñadas y aprobadas (`docs/design/`); esta spec dice qué entrega la API a cada rol.

| Tarjeta | Incluido en la rebanada 1 | Queda fuera (y dónde va) |
| --- | --- | --- |
| F1 · Alta de comunidad y unidades | Alta de comunidad con su primer administrador (ya especificada en GC, "Validaciones de la consola de Operaciones ComVive"); listados de Operaciones; datos de la comunidad; alta, edición, edición en bloque y eliminación de unidades; validación de alícuotas y su cambio después de un periodo emitido | Medios de pago y configuración de cobro (fondo, plazo, primer mes y primer borrador, GC A-2, D-2, E-1): van con la rebanada de emisión. Importación desde planilla (UX-16): tarjeta propia, que reutiliza el alta en bloque (P-CM-3). Lista de puesta en marcha: con la web |
| F2 · Usuarios y roles | Lista de usuarios y roles; otorgar y revocar comité (GC "Otorgamiento de roles") y conserjería; otorgar y revocar administrador (GC, ya especificado); último administrador (GC D9); corrección de nombre y contacto | Lo que ve el conserje en su módulo (spec de conserjería) |
| F3 · Ocupaciones | Alta de arrendatario (vigente o programado), cancelación, término, venta y propietario faltante; membresía de residente; tarea "Revisar rol de comité" (GC M-7) | Movimientos del traspaso al terminar un arriendo: llegan con el libro de movimientos (P-CM-4) |
| F4 · Primer ingreso por invitación | Datos que la invitación necesita (RUT, nombre y contacto validados) y el estado de ingreso de cada membresía | Crear, enviar, aceptar y vencer invitaciones: rebanada propia "Ingreso e invitaciones", con ADR 0005 (regla CM-F1) |

## Definiciones

Se usan las de GC "Definiciones" (ocupación, inicio y fin efectivos, estados programada, vigente, terminada y cancelada, ámbito, traspaso). Se agregan:

- **Comunidad configurada sin emisiones:** comunidad sin ningún periodo emitido ni cerrado. Mientras lo está, los cambios de unidades no exigen motivo (regla CM-B7).
- **Persona:** identidad global de ComVive, reconocida por su RUT (`PERSON`, `docs/arquitectura.md` §2). Guarda solo RUT, contacto de ingreso verificado y credenciales. El nombre y el contacto que registra cada comunidad viven en la membresía de esa comunidad.
- **Membresía:** vínculo de una persona con una comunidad en un rol (`admin`, `committee`, `concierge` o `resident`), con fecha de inicio (`valid_from`), fecha de término opcional (`valid_to`; nunca en `admin`, GC D24), quién la otorgó y por qué vía, y, si se revocó, cuándo, quién y por qué (`docs/arquitectura.md` §3 y §4). Nunca se borra.
- **Membresía vigente:** otorgada, no revocada, con `valid_from` cumplido y `valid_to` vacío o futuro, en hora de Chile (ADR 0009, decisión 3).
- **Estado de ingreso de una membresía:** "Pendiente" si la persona aún no hace su primer ingreso con esa membresía; "Activo" desde que lo hace (`first_access_at`, GC "Validaciones de la consola de Operaciones ComVive", D27; ADR-0008-S9).
- **Alícuota:** porcentaje de participación de la unidad, guardado como `aliquot_e6` (GC "Definiciones"). Una alícuota de 0 % es "Sin participación" (GC C-5).
- **Orden natural del código:** orden de los códigos de unidad comparando los tramos numéricos como números y el resto como texto sin mayúsculas, de modo que "Depto 9" va antes que "Depto 10" (GC C-4).

## Usuarios y permisos

| Rol | Puede ver | Puede hacer |
| --- | --- | --- |
| Administrador | Datos de la comunidad, todas las unidades, el registro de copropietarios completo (GC "Datos de copropietarios que ve el comité"), las ocupaciones con su historial, "Usuarios y roles" con el historial de roles, y las tareas del administrador | Editar los datos de la comunidad (salvo el RUT, regla CM-A3); crear, editar y eliminar unidades y sus alícuotas; registrar ocupaciones (GC F-14); otorgar y revocar comité (GC "Otorgamiento de roles") y conserjería; corregir el nombre y el contacto de una membresía; resolver la tarea "Revisar rol de comité" (GC M-7). **No** otorga ni revoca administradores (GC "Otorgamiento de roles") |
| Comité | Datos de la comunidad, todas las unidades con su alícuota, el registro de copropietarios con datos limitados (GC S-33) y el historial de ocupaciones con el mismo filtro. Solo en la web (decisión del líder, GC "Usuarios y permisos") | Nada en este módulo: 403 en toda acción sobre lo que ve; 404 en "Usuarios y roles" y en las tareas |
| Residente propietario | Datos de la comunidad y la ficha (código, tipo y alícuota) de sus unidades | Nada en este módulo |
| Residente arrendatario | Datos de la comunidad y la ficha de la unidad que arrienda | Nada en este módulo |
| Conserje | Datos de la comunidad (Supuesto (a validar), S-CM-14). Lo que ve de los residentes lo fija la spec de conserjería | Nada en este módulo |
| Operaciones ComVive | Lista de comunidades (nombre, RUT, número de administradores y estado del pago en línea) y las membresías de administrador de cada una (nombre, RUT, desde y quién otorgó). Ningún dato de negocio (GC "Usuarios y permisos") | Crear comunidades con su primer administrador; otorgar y revocar administradores (GC "Validaciones de la consola de Operaciones ComVive") |
| Soporte ComVive | Nada de este módulo (GC EX-1) | Nada |

- **Roles múltiples:** una persona puede tener varias membresías vigentes en la misma comunidad (por ejemplo, residente y comité, o administradora y propietaria). La visibilidad y los permisos son la unión de sus roles (ADR-0009-S4). Los campos que ve los fija esta spec y GC, no el guard.
- **Administrador y comité a la vez:** no se permite (GC S-43). La ley respalda la regla: el administrador "no podrá integrar el Comité de Administración" (MINVU, "Herramientas para la administración", sobre la Ley 21.442; numeración en GC P-1).

### Qué recursos ve cada rol

Completa la matriz de GC "Qué recursos ve cada rol" (S-53) con los recursos de este módulo. Si el rol no ve el recurso, toda lectura o acción responde 404; si lo ve pero no tiene el permiso, 403 (GC "Respuestas de error"; ADR 0009, decisión 3). "Suya" es una unidad donde la persona tiene una ocupación vigente (`docs/arquitectura.md` §4, "Visibilidad por ámbito").

| Recurso (tipo para `@CommunityRoute`) | Administrador | Comité | Propietario | Arrendatario | Conserje |
| --- | --- | --- | --- | --- | --- |
| Datos de la comunidad (`community`) | Ve y edita | Ve (403 al editar) | Ve (403 al editar) | Ve (403 al editar) | Ve (403 al editar) |
| Ficha de una unidad (`unit`): código, tipo, alícuota | Ve todas | Ve todas | Ve las suyas | Ve la suya | No ve (S-CM-14) |
| Configuración de unidades (`unit-config`): alta, edición, edición en bloque, eliminación, orden | Ve y actúa | Ve (403 al actuar) | No ve | No ve | No ve |
| Registro de copropietarios (`owner-roster`) | Ya definido en GC (`owner_roster.read`) | Ya definido en GC | No ve | No ve | No ve |
| Ocupaciones de una unidad (`occupancy`) | Ve y actúa (`occupancy.write`) | Ve el historial con el filtro de GC S-33 (403 al actuar) | No ve | No ve | No ve |
| Membresías y su historial (`membership`, "Usuarios y roles") | Ve todas, incluidas las de administrador | No ve | No ve | No ve | No ve |
| Otorgamiento de roles (`role-grant`) | Ve y actúa | Ve (403 al otorgar; GC CA-43) | No ve | No ve | No ve |
| Tareas del administrador (`admin-task`) | Ya definido en GC M-7 | No ve | No ve | No ve | No ve |

- **Por qué `role-grant` es un recurso aparte:** GC CA-43 exige que el comité reciba 403 (no 404) al pedir otorgar el rol de comité, porque ve el registro de copropietarios; pero el comité no ve "Usuarios y roles" (404, `docs/design/flujos/admin-usuarios-y-roles.md`). Con un solo recurso no se cumplen las dos cosas.
- **Por qué `unit-config` es un recurso aparte de `unit`:** el residente ve la ficha de su unidad, pero no la configuración de unidades. Así, un residente que pide crear o editar una unidad recibe 404 y no 403, igual que con la configuración de cobro (GC S-53).
- Los nombres de los tipos de recurso son propuesta del analista; los fija el arquitecto (ADR 0009, decisión 7, "Rebanada 1").

### Acciones de la rebanada

Contrato funcional: qué acción existe, quién la ejecuta y con qué permiso. Las rutas existentes son las de `docs/arquitectura.md` §3 y §4; las nuevas son una propuesta y el contrato técnico lo fija el arquitecto (ADR 0003). Toda escritura lleva clave de idempotencia (GC A-3.4, S-36): solo se guardan las respuestas exitosas y todo rechazo se reevalúa (GC D12). "R" es residente (propietario o arrendatario); "Op" es Operaciones ComVive.

| Acción | Ruta (existente o propuesta) | Recurso, recursos de ruta y permiso | Admin | Comité | R | Conserje | Op |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Crear comunidad con su primer administrador | `POST /platform/communities` (existente) | Plataforma; permiso propuesto `platform.community.create` | 404 | 404 | 404 | 404 | Sí |
| Listar comunidades | `GET /platform/communities` (nueva) | Plataforma; permiso propuesto `platform.community.read` | 404 | 404 | 404 | 404 | Sí |
| Listar administradores de una comunidad | `GET /platform/communities/{communityId}/admin-memberships` (nueva) | Plataforma; `platform.admin_role.grant` | 404 | 404 | 404 | 404 | Sí |
| Otorgar o revocar administrador | Rutas existentes de §3 | Plataforma; `platform.admin_role.grant`; `membershipId` como `admin-membership` | 404 | 404 | 404 | 404 | Sí |
| Ver datos de la comunidad | `GET /communities/{communityId}` (nueva) | `community`, lectura | Sí | Sí | Sí | Sí | 404 |
| Editar datos de la comunidad | `PATCH /communities/{communityId}` (nueva) | `community`; permiso nuevo `community.profile.write` | Sí | 403 | 403 | 403 | 404 |
| Listar unidades | `GET /communities/{communityId}/units` (nueva) | `unit`, lectura; filtro por fila para el residente | Todas | Todas | Las suyas | 404 | 404 |
| Ver una unidad | `GET .../units/{unitId}` (nueva) | `unit`; `unitId` como `unit` | Sí | Sí | La suya; ajena 404 | 404 | 404 |
| Crear una unidad | `POST .../units` (nueva) | `unit-config`; permiso nuevo `unit.write` | Sí | 403 | 404 | 404 | 404 |
| Crear varias unidades (todo o nada) | `POST .../units/batch` (nueva) | `unit-config`; `unit.write` | Sí | 403 | 404 | 404 | 404 |
| Editar una unidad | `PATCH .../units/{unitId}` (nueva) | `unit-config`; `unitId` como `unit`; `unit.write` (y `community.billing.configure` si cambia el orden, GC "Usuarios y permisos") | Sí | 403 | 404 | 404 | 404 |
| Editar alícuotas y orden en bloque (todo o nada) | `POST .../units/bulk-update` (nueva) | `unit-config`; `unit.write` y `community.billing.configure` | Sí | 403 | 404 | 404 | 404 |
| Eliminar una unidad | `DELETE .../units/{unitId}` (nueva) | `unit-config`; `unitId` como `unit`; `unit.write` | Sí | 403 | 404 | 404 | 404 |
| Registro de copropietarios | `GET .../owner-roster` (GC) | `owner-roster`; `owner_roster.read` | Completo | Filtrado (GC S-33) | 404 | 404 | 404 |
| Historial de ocupaciones de una unidad | `GET .../units/{unitId}/occupancies` (existente) | `occupancy`; `unitId` como `unit` | Sí | Filtrado | 404 | 404 | 404 |
| Alta de arrendatario, término, venta o propietario faltante, cancelación | Rutas existentes de `docs/arquitectura.md` §4 | `occupancy`; `occupancy.write` | Sí | 403 | 404 | 404 | 404 |
| Listar membresías ("Usuarios y roles") e historial de roles | `GET .../memberships` (nueva; incluye revocadas con un filtro) | `membership`, lectura | Sí | 404 | 404 | 404 | 404 |
| Otorgar comité o conserjería | `POST .../memberships` (existente) | `role-grant`; `committee_role.grant` o `concierge_role.grant` según el rol del cuerpo (regla CM-D2) | Sí | 403 | 404 | 404 | 404 |
| Revocar comité o conserjería | `POST .../memberships/{membershipId}/revoke` (existente) | `membership`; `membershipId` como `membership`; permiso según el rol de la membresía (regla CM-D4) | Sí | 404 | 404 | 404 | 404 |
| Corregir nombre y contacto de una membresía | `PATCH .../memberships/{membershipId}/contact` (nueva) | `membership`; `membershipId` como `membership`; permiso nuevo `membership.contact.write` | Sí | 404 | 404 | 404 | 404 |
| Listar y resolver tareas del administrador | Rutas existentes de `docs/arquitectura.md` §3 | `admin-task`; `committee_role.grant` para resolver | Sí | 404 | 404 | 404 | 404 |

- Una sesión de plataforma en una ruta `/communities/...` y una sesión de comunidad en una ruta `/platform/...` responden 404 (GC "Respuestas de error").
- "Mis comunidades" (`/me/`, política `identity`) no es de esta rebanada: llega con el ingreso (ADR-0009-S5).

### Códigos y mensajes de error nuevos

Se suman a la tabla de GC "Códigos y mensajes de error", con su misma convención: 409 para un conflicto con el estado actual, 422 para una entrada que una regla no permite, y 400 `BAD_REQUEST` para un campo sin código propio con tipo o formato inválido (GC S-70). Los textos son propuesta del analista, salvo los que vienen del diseño aprobado, que se indican (Supuesto (a validar), S-CM-1).

| Caso | Regla | HTTP | Código | Mensaje |
| --- | --- | --- | --- | --- |
| Datos de la comunidad con nombre vacío (se reutiliza) | CM-A3 | 422 | `COMMUNITY_NAME_REQUIRED` | "Ingresa el nombre de la comunidad" |
| Datos de la comunidad sin dirección o sin comuna | CM-A3 | 422 | `COMMUNITY_ADDRESS_REQUIRED` | "Ingresa la dirección y la comuna de la comunidad" |
| Unidad sin código, o con un código vacío o de solo espacios | CM-B2 | 422 | `UNIT_CODE_REQUIRED` | "Ingresa el código de la unidad" |
| Código de unidad que ya existe en la comunidad (texto del diseño) | CM-B2 | 409 | `UNIT_CODE_ALREADY_EXISTS` | "El código {código} ya existe en esta comunidad" |
| Alícuota ausente, no numérica, negativa o sobre 1.000.000 (texto del diseño) | CM-B3 | 422 | `INVALID_ALIQUOT` | "La alícuota debe estar entre 0 % y 100 %" |
| Alícuota con más de 4 decimales de porcentaje, es decir, `aliquotE6` no entero (texto del diseño) | CM-B3 | 422 | `INVALID_ALIQUOT` | "La alícuota admite hasta 4 decimales" |
| Orden ausente en una edición que lo pide, no entero, menor que 1 o mayor que 999.999 | CM-B5 | 422 | `INVALID_SORT_ORDER` | "El orden debe ser un número entero entre 1 y 999.999" |
| Orden que ya usa otra unidad (texto del diseño) | CM-B5 | 409 | `SORT_ORDER_ALREADY_USED` | "El orden {n} ya lo usa {código}" |
| Cambio de unidades sin motivo en una comunidad con algún periodo emitido (se reutiliza `REASON_REQUIRED`) | CM-B7 | 422 | `REASON_REQUIRED` | "Indica el motivo del cambio y el documento que lo respalda" |
| Eliminación de una unidad sin motivo en una comunidad con algún periodo emitido | CM-B8 | 422 | `REASON_REQUIRED` | "Indica el motivo de la eliminación" |
| Eliminar una unidad con ocupaciones, movimientos o participación en un periodo emitido | CM-B8 | 409 | `UNIT_IN_USE` | "Esta unidad ya tiene ocupantes, movimientos o periodos emitidos. No se puede eliminar" |
| Alta o edición en bloque con una o más filas inválidas | CM-B6 | 422 | `UNITS_INVALID` | "No se guardó nada. Corrige las filas marcadas e intenta de nuevo" (con la lista de filas, ver CM-B6) |
| Persona sin nombre, o con un nombre vacío o de solo espacios | CM-C2 | 422 | `PERSON_NAME_REQUIRED` | "Ingresa el nombre de la persona" |
| Celular o correo con formato inválido en una ocupación, una membresía de conserjería o una corrección de contacto (se reutiliza `INVALID_CONTACT` con otro texto) | CM-C3 | 422 | `INVALID_CONTACT` | "Ingresa un celular o un correo válido" |
| Registrar como arrendatario a quien es propietario vigente de esa unidad | CM-E2 | 422 | `OWNER_CANNOT_BE_TENANT` | "Esta persona es propietaria de la unidad. No puede ser también su arrendataria" |
| Registrar la venta a quien es el arrendatario vigente o programado de la unidad | CM-E3 | 409 | `BUYER_IS_CURRENT_TENANT` | "Esta persona es la arrendataria vigente o programada de la unidad. Registra primero el término o la cancelación de su arriendo" |
| Terminar un arriendo programado (se reutiliza `OCCUPANCY_NOT_STARTED` con otro texto) | CM-E4 | 409 | `OCCUPANCY_NOT_STARTED` | "Este arriendo aún no comienza. Si no comenzará, cancélalo" |
| Terminar un arriendo cancelado (se reutiliza) | CM-E4 | 409 | `OCCUPANCY_CANCELLED` | "Este arriendo ya fue cancelado" |
| Otorgar o revocar por la ruta de membresías el rol de residente | CM-D5 | 422 | `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` | "El rol de residente nace y termina con la ocupación. Registra el arriendo, su término o la venta en la unidad" |
| Otorgar conserjería a quien ya la integra | CM-D3 | 409 | `ALREADY_CONCIERGE` | "Esta persona ya integra la conserjería" |
| Revocar comité o conserjería sin motivo (se reutiliza `REASON_REQUIRED`, mismo texto que la revocación de administrador) | CM-D4 | 422 | `REASON_REQUIRED` | "Indica el motivo de la revocación" |
| Revocar comité o conserjería ya revocados, con otra clave (se reutiliza) | CM-D4 | 409 | `ROLE_ALREADY_REVOKED` | "Este rol ya fue revocado" |

### Orden de validación por acción

Después de sesión, membresía, visibilidad, recursos de la ruta, permiso, forma (400), verificaciones 404/403 que dependen del cuerpo e idempotencia (GC "Respuestas de error", S-77; ADR 0009, decisión 3), se responde solo la primera regla que falle, en este orden. Criterio, igual que GC S-34, S-63 y CA-61: primero los datos del formulario y al final los conflictos con el estado, salvo donde no tiene sentido pedir un dato de una acción que no se puede hacer (Supuesto (a validar), S-CM-2).

- **Editar datos de la comunidad:** `COMMUNITY_NAME_REQUIRED` → `COMMUNITY_ADDRESS_REQUIRED`.
- **Crear o editar una unidad:** `UNIT_CODE_REQUIRED` → `INVALID_ALIQUOT` → `INVALID_SORT_ORDER` → `REASON_REQUIRED` (solo con algún periodo emitido, CM-B7) → 409 `UNIT_CODE_ALREADY_EXISTS` → 409 `SORT_ORDER_ALREADY_USED`. Un tipo de unidad fuera de la lista responde 400 en el paso de forma.
- **Crear varias unidades o editar en bloque:** cada fila se valida con el orden anterior; los conflictos de código y de orden se evalúan contra el estado final del lote (CM-B6). Con una o más filas inválidas, 422 `UNITS_INVALID`. El motivo es del lote, no de cada fila: sin motivo, con algún periodo emitido, 422 `REASON_REQUIRED` antes de validar las filas.
- **Eliminar una unidad:** 409 `UNIT_IN_USE` → `REASON_REQUIRED`. El estado va antes que el motivo, como la cancelación de un arriendo (GC CA-61).
- **Alta de arrendatario (vista previa y ejecución):** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` → `OWNER_CANNOT_BE_TENANT` → 409 `TENANT_ALREADY_ACTIVE` → `PREVIEW_OUTDATED` (solo en la ejecución). La fecha de ingreso ausente o mal formada responde 400.
- **Venta o propietario faltante (vista previa y ejecución):** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` → `END_DATE_IN_FUTURE` → 409 `ALREADY_OWNER` → 409 `BUYER_IS_CURRENT_TENANT` → `PREVIEW_OUTDATED` (solo en la ejecución).
- **Término de arriendo (vista previa y ejecución):** `USE_OWNERSHIP_TRANSFER` → estado de la ocupación (409 `OCCUPANCY_NOT_STARTED`, `OCCUPANCY_CANCELLED` u `OCCUPANCY_ALREADY_ENDED`) → `END_DATE_IN_FUTURE` → `END_BEFORE_START` → `PREVIEW_OUTDATED` (solo en la ejecución). Como en la cancelación (GC CA-61), no se valida la fecha de una acción que no se puede hacer.
- **Otorgar comité:** el de GC S-34 (`ASSEMBLY_REFERENCE_REQUIRED` → `COMMITTEE_REQUIRES_OWNER` → `ADMIN_COMMITTEE_CONFLICT` → `ALREADY_COMMITTEE_MEMBER`), sin cambios.
- **Otorgar conserjería:** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` → 409 `ALREADY_CONCIERGE`.
- **Otorgar por la ruta de membresías:** `role = admin` responde 403 (GC "Respuestas de error", paso 4) y `role = resident` responde 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`, antes de las reglas del rol; un rol fuera de la lista, 400.
- **Revocar comité o conserjería:** `REASON_REQUIRED` → 409 `ROLE_ALREADY_REVOKED`, como la revocación de administrador (GC S-68). Una membresía de residente responde 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` antes que el motivo; una de administrador, 403 (paso de permiso).
- **Corregir nombre y contacto:** `PERSON_NAME_REQUIRED` → `INVALID_CONTACT`.

## Reglas de negocio

### A. Comunidad

1. **CM-A1 · Alta solo por Operaciones ComVive.** El alta de una comunidad con su primer administrador, sus validaciones, su orden de errores, el último administrador y la alerta por falta de primer ingreso ya están especificados en GC "Validaciones de la consola de Operaciones ComVive" (S-63, S-68, S-72, S-79, S-85, S-86; D9, D10, D12, D24, D27) y GC CA-43, CA-69, CA-75 y CA-76. Esta spec no los cambia. Un administrador no crea comunidades (decisión del líder, 2026-11-07).
2. **CM-A2 · Qué crea el alta.** En una sola transacción: la comunidad (nombre y RUT), la persona del primer administrador si su RUT no existe en ComVive (con el contacto ingresado como contacto propuesto, regla CM-C4) y su membresía `admin` con `granted_via = platform`. No crea unidades, periodos ni configuración de cobro: el primer borrador nace con la configuración de cobro (GC A-2), fuera de esta rebanada. La comunidad recién creada no tiene unidades: su emisión respondería 422 `COMMUNITY_WITHOUT_UNITS` (GC A-3.8).
3. **CM-A3 · Datos de la comunidad que edita el administrador** (`community.profile.write`): nombre (obligatorio), dirección y comuna (obligatorias) y tipo (`edificio` o `condominio`, obligatorio). El RUT de la comunidad lo fija Operaciones en el alta y el administrador **no** lo edita, porque es la clave de unicidad de la comunidad (GC S-63, `COMMUNITY_ALREADY_EXISTS`); si está mal, lo corrige Operaciones por un procedimiento auditado (Supuesto (a validar), S-CM-3; P-CM-5). Los medios de pago del aviso (GC G-2) se configuran con la rebanada de emisión.
4. **CM-A4 · Lo que ve Operaciones.** En la lista de comunidades: nombre, RUT, número de administradores vigentes y estado del pago en línea ("Activo" o "Pendiente", GC F-12). En los administradores de una comunidad: nombre, RUT completo, fecha de inicio, quién otorgó y estado de ingreso. Nada más: ni unidades, ni personas que no sean administradores, ni deudas (GC "Usuarios y permisos"). Cada lectura queda en la auditoría de plataforma (ADR 0006, decisión 8; ADR 0009, D41 a D46).

### B. Unidades y alícuotas

1. **CM-B1 · Datos de una unidad:** código (obligatorio, único en la comunidad), tipo (`departamento`, `casa`, `estacionamiento`, `bodega` o `local`, del diseño; Supuesto (a validar), S-CM-4), alícuota (`aliquot_e6`, obligatoria, 0 a 1.000.000) y orden (`sort_order`, entero único en la comunidad, GC C-4). El tipo es informativo: no cambia ningún cálculo.
2. **CM-B2 · Código.** Se guarda sin espacios al inicio ni al final y con los espacios internos reducidos a uno. Se compara sin distinguir mayúsculas: "depto 101" y "Depto  101" son el mismo código que "Depto 101" (Supuesto (a validar), S-CM-5). Largo máximo: 30 caracteres (un código más largo responde 400). Ausente o vacío: 422 `UNIT_CODE_REQUIRED`. Repetido: 409 `UNIT_CODE_ALREADY_EXISTS`.
3. **CM-B3 · Alícuota.**
   - La API recibe y devuelve la alícuota como entero `aliquotE6` en escala 10^-6 (18,5000 % = 185000; 100 % = 1000000), nunca como número decimal (regla 1 de `CLAUDE.md`, aplicada por analogía; `docs/arquitectura.md` §4) (Supuesto (a validar), S-CM-6).
   - La conversión del texto que escribe la persona (`18,5`, `18.5` o `18,5000`, hasta 4 decimales, coma o punto) a `aliquotE6` se hace leyendo el texto, sin punto flotante (`docs/design/arquitectura-de-informacion.md`, "Alícuotas"). Esa función vive en `packages/shared` para que la usen la web y la futura importación, con pruebas de propiedades (S-CM-6).
   - Rango: 0 a 1.000.000. Fuera de rango, ausente o no numérica: 422 `INVALID_ALIQUOT` con "La alícuota debe estar entre 0 % y 100 %". Un `aliquotE6` con decimales equivale a más de 4 decimales de porcentaje: 422 `INVALID_ALIQUOT` con "La alícuota admite hasta 4 decimales".
   - Una alícuota de 0 se acepta y se muestra "Sin participación" (GC C-5, CA-18).
   - Si algún reglamento usa más de 4 decimales de porcentaje sigue en GC P-10.
4. **CM-B4 · Suma de alícuotas.**
   - Se guarda aunque la suma de la comunidad no sea 1.000.000: la carga suele hacerse por partes. Toda respuesta de alta, edición o eliminación de unidades y el listado de unidades devuelven la suma (`aliquotSumE6`), calculada con enteros.
   - Si la suma no es 1.000.000, la respuesta incluye la advertencia "Las alícuotas suman {suma}; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas", con la suma en 4 decimales y coma (texto del flujo y del wireframe WEB-ALT-04). Es una advertencia, no un error.
   - El bloqueo está en la emisión, no aquí: si algún grupo del periodo usa la base `alicuota` y la suma no es 1.000.000, la emisión responde 422 `ALIQUOTS_NOT_100` (GC A-3.1, CA-19). Una suma sobre 100 % también se guarda con la misma advertencia.
5. **CM-B5 · Orden (`sort_order`).**
   - Entero de 1 a 999.999, único en la comunidad. Fuera de rango o no entero: 422 `INVALID_SORT_ORDER`. Repetido: 409 `SORT_ORDER_ALREADY_USED`.
   - **Propuesta al crear (GC C-4):** si el alta no trae el orden, la API lo asigna: a cada unidad nueva, en el orden natural de los códigos del lote, el siguiente número libre después del mayor orden existente en la comunidad (Supuesto (a validar), S-CM-7). Ejemplo: en una comunidad vacía, el lote "Depto 10", "Depto 9", "Depto 11" recibe Depto 9 = 1, Depto 10 = 2 y Depto 11 = 3.
   - **Cambio del orden:** es configuración de cobro (`community.billing.configure`, GC "Usuarios y permisos") y cambia los desempates de los periodos que se emitan después (GC C-3). Los periodos emitidos usan el orden de su foto de participaciones (GC "Definiciones").
   - Intercambiar el orden de dos unidades se hace con la edición en bloque (CM-B6), porque con dos ediciones sueltas la primera chocaría con la unicidad.
6. **CM-B6 · Alta y edición en bloque, todo o nada.**
   - El alta de varias unidades y la edición en bloque de alícuotas y orden se validan completas antes de escribir. Si una sola fila falla, no se escribe nada y la respuesta es 422 `UNITS_INVALID` con la lista de filas inválidas: posición de la fila, código de la unidad si lo trae, y el código y el texto del **primer** error de esa fila (orden de "Orden de validación por acción"). Es la única respuesta de este módulo con varios errores (Supuesto (a validar), S-CM-8; mismo criterio que la importación del diseño, "No se guardó nada. Corrige estas filas…").
   - La unicidad de código y de orden se evalúa contra el **estado final** del lote: intercambiar el orden 3 y 4 de dos unidades en el mismo lote es válido.
   - Así se pasa de una suma de 100 % a otra de 100 % sin un estado intermedio guardado (CA-CM-7).
   - Tope por lote: 1.000 filas (Supuesto (a validar), S-CM-8). Un lote mayor responde 400.
7. **CM-B7 · Cambios después de un periodo emitido (regla 6 de `CLAUDE.md`).**
   - **Se permiten**: crear unidades, editar su código, tipo, alícuota u orden y editar en bloque, también después de emitir (UX-15 del diseño). La foto de participaciones de cada periodo emitido o cerrado **no cambia** (GC "Definiciones"; ADR 0004, decisión 7): los cargos emitidos, sus ajustes y las correcciones de esos periodos (GC sección H) siguen usando la foto, nunca los valores actuales.
   - **Efecto:** solo sobre el borrador vigente y los periodos que se emitan después. No se recalcula ni se ajusta ningún periodo emitido o cerrado por un cambio de alícuota (Supuesto (a validar), S-CM-9; P-CM-1).
   - **Vista previa de emisión:** un cambio de unidades, alícuotas u orden después de la vista previa hace que la emisión responda 409 `PREVIEW_OUTDATED` (GC A-7, fila de emisión).
   - **Motivo y respaldo obligatorios** desde que la comunidad tiene algún periodo emitido o cerrado: toda alta, edición de alícuota u orden, edición en bloque o eliminación lleva un motivo de texto libre que nombre el documento que la respalda (por ejemplo, "Modificación del reglamento aprobada en asamblea extraordinaria del 18-11-2026, escritura del 25-11-2026"), con la ayuda "No incluyas datos personales". Sin motivo: 422 `REASON_REQUIRED`. ComVive guarda el texto y no valida el acuerdo, igual que la autorización de los egresos del fondo (GC S-49). Fundamento: las alícuotas las fija el reglamento de copropiedad, cuya modificación exige asamblea extraordinaria (Ley 21.442, art. 15, según MINVU; numeración en GC P-1); GC "Casos borde" ya dice que un cambio de alícuotas requiere modificar el reglamento (Supuesto (a validar), S-CM-10).
   - Cambiar solo el código o el tipo de una unidad no exige motivo: no cambia ningún monto (S-CM-10).
   - Los avisos ya emitidos conservan el código que tenían al generarse (GC G-5). Las pantallas de periodos anteriores muestran el código actual; el historial de códigos queda en la auditoría (Supuesto (a validar), S-CM-11).
8. **CM-B8 · Eliminación de una unidad.** Solo si la unidad nunca tuvo una ocupación (de cualquier estado, también cancelada), no tiene movimientos, pagos ni intentos Webpay, y no aparece en la foto de ningún periodo emitido o cerrado. Si no, 409 `UNIT_IN_USE`. Sirve para corregir un error de carga; una unidad real no desaparece (fusiones y subdivisiones quedan fuera de alcance). Con algún periodo emitido, exige motivo (CM-B7). La eliminación es física solo si nada la referencia; la auditoría conserva sus datos (Supuesto (a validar), S-CM-12).
9. **CM-B9 · Concurrencia con la emisión.** Una emisión y un cambio de unidades de la misma comunidad no se intercalan: la emisión usa las unidades y alícuotas vigentes al tomar su bloqueo (GC A-3.3; `docs/arquitectura.md` §4, "Bloqueo único por comunidad") y un cambio confirmado después de la vista previa produce 409 `PREVIEW_OUTDATED`. El mecanismo lo fija el arquitecto. Dos ediciones concurrentes de la misma unidad: gana la última confirmada y ambas quedan en auditoría (Supuesto (a validar), S-CM-13).

### C. Personas y datos personales (Ley 21.719)

1. **CM-C1 · Datos mínimos por rol.** ComVive pide solo lo necesario para cobrar, notificar y dar acceso (regla 7 de `CLAUDE.md`):

   | Dato | Administrador | Comité | Conserje | Propietario | Arrendatario |
   | --- | --- | --- | --- | --- | --- |
   | RUT | Obligatorio (GC S-63) | Ya registrado como propietario (GC S-34) | Obligatorio | Obligatorio | Obligatorio (UX-8; S-CM-15) |
   | Nombre | Obligatorio (P-CM-6) | Ya registrado | Obligatorio | Obligatorio | Obligatorio |
   | Celular o correo | Obligatorio (GC S-63) | Ya registrado | Opcional | Opcional; sin él no se puede invitar | Opcional; sin él no se puede invitar |

   No se piden dirección personal, fecha de nacimiento, estado civil, profesión, patente ni otros datos. Un campo que no está en esta tabla no se acepta (400).
2. **CM-C2 · RUT y nombre.** El RUT se normaliza (sin puntos, con guion, dígito verificador en mayúscula) y se valida con módulo 11; ausente o inválido: 422 `INVALID_RUT` (GC, tabla de errores). Se aceptan RUT de personas jurídicas y de comunidades hereditarias (S-CM-16). El nombre es texto libre de 1 a 120 caracteres sin espacios al inicio ni al final; vacío: 422 `PERSON_NAME_REQUIRED`.
3. **CM-C3 · Contacto.** Un celular chileno (+56 9 y ocho dígitos) o un correo con formato válido, o ambos (mismo formato que GC "Validaciones de la consola de Operaciones ComVive"). Formato inválido: 422 `INVALID_CONTACT`.
4. **CM-C4 · Persona existente y contacto de ingreso.**
   - La persona se identifica por su RUT. Si ya existe en ComVive, se le agrega la membresía sin mostrar sus datos ni sus otras comunidades: la vista previa solo dice "Esta persona ya tiene cuenta en ComVive; se le agregará esta unidad" (`docs/arquitectura.md` §2; `docs/design/flujos/admin-ocupaciones.md`).
   - El nombre y el contacto que registra cada comunidad se guardan en la membresía de esa comunidad, nunca en la persona: el administrador de la Comunidad A no puede cambiar lo que ve la Comunidad B (`docs/arquitectura.md` §2, "Datos que cruzan comunidades").
   - El contacto de ingreso de una persona nueva es el primero que se registra para ella, sin verificar, hasta que lo verifique en su primer ingreso. Si otra comunidad registra después un contacto distinto, queda en su membresía y no cambia el contacto de ingreso (Supuesto (a validar), S-CM-17; UX-30). Si la persona ya tiene un contacto verificado, el código va siempre a ese (`docs/design/flujos/residente-primer-ingreso.md`).
5. **CM-C5 · Quién ve qué de cada persona.** Lo fijan GC "Datos del arrendatario que ve el propietario" (S-44) y GC "Datos de copropietarios que ve el comité" (S-33). Se agrega:
   - El arrendatario no ve ningún dato del propietario de la unidad (nombre, RUT ni contacto) (Supuesto (a validar), S-CM-18).
   - Un residente no ve datos de otras unidades ni de otros residentes.
   - Operaciones ve solo los datos de los administradores (CM-A4).
   - El RUT completo lo ven el titular y el administrador; los demás roles que lo vean, enmascarado (`12.345.***-*`) (`docs/design/arquitectura-de-informacion.md`, "RUT"). El filtro lo aplica la API: los campos excluidos no viajan.
6. **CM-C6 · Rectificación (Ley 21.719).** El administrador corrige el nombre y el contacto de una membresía de residente, comité o conserjería de su comunidad (`membership.contact.write`). El cambio vale solo para esa comunidad y queda en auditoría con el valor anterior enmascarado. El RUT no se edita: es la identidad global de la persona; el caso de un RUT mal registrado queda en P-CM-7. El nombre y el contacto de un administrador los corrige la propia persona en "Mi cuenta", con el ingreso (fuera de esta rebanada).

### D. Membresías y roles

1. **CM-D1 · Quién otorga cada rol.** Es la tabla de GC "Otorgamiento de roles" y `docs/arquitectura.md` §3, "Quién otorga cada rol", sin cambios: administrador, solo Operaciones; comité, el administrador; conserjería, el administrador (`concierge_role.grant`); residente, a través de la ocupación.
2. **CM-D2 · Otorgar comité o conserjería por la ruta de membresías.** El cuerpo trae el rol. El permiso se decide por el rol del cuerpo, después del paso de forma (GC "Respuestas de error", paso 4): `committee` exige `committee_role.grant`; `concierge`, `concierge_role.grant`; `admin` responde 403; `resident`, 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` (CM-D5). Para el comité aplican todas las reglas de GC S-34 y S-43, sin cambios.
3. **CM-D3 · Conserjería (Supuesto (a validar), S-CM-14; P-CM-8).** El administrador otorga el rol de conserje a una persona, sea o no propietaria, con RUT, nombre y contacto opcional (CM-C1). No exige referencia a un acuerdo: el conserje es un trabajador de la comunidad, no un cargo electivo. Si ya tiene una membresía de conserjería vigente: 409 `ALREADY_CONCIERGE`. Lo que ve el conserje lo fija la spec de conserjería; en esta rebanada solo ve los datos de la comunidad (CA-CM-15).
4. **CM-D4 · Revocar comité o conserjería.**
   - Motivo obligatorio (el diseño ya lo pide: "término del periodo", "renuncia" u "otro" con texto libre): sin motivo, 422 `REASON_REQUIRED` con "Indica el motivo de la revocación". Ya revocada (otra clave): 409 `ROLE_ALREADY_REVOKED`. Un reintento con la misma clave de una revocación aplicada devuelve el resultado original (GC A-3.4).
   - Efecto inmediato, sin cerrar sesiones y con la eliminación de las suscripciones push de esa membresía (GC S-81). Si la persona tenía una tarea "Revisar rol de comité" abierta, se cierra con `revoked_elsewhere` (GC M-7).
   - Permiso según el rol de la membresía de la ruta: comité, `committee_role.grant`; conserjería, `concierge_role.grant`. Una membresía `admin` responde 403, también la propia (`docs/arquitectura.md` §3). Una de residente, 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`.
   - El comité no ve las membresías: su pedido de revocar responde 404.
5. **CM-D5 · Membresía de residente.**
   - Nace con la ocupación: al registrar una ocupación de propietario o arrendatario, si la persona no tiene una membresía de residente vigente o programada en la comunidad, se crea una con `valid_from` = `effective_from` de la ocupación (GC F-14; `docs/arquitectura.md` §4, "Ocupaciones"). Si ya la tiene, no se crea otra: una persona tiene **una** membresía de residente por comunidad, aunque ocupe varias unidades o sea propietaria de una y arrendataria de otra.
   - Termina, con la revocación de GC S-81, cuando la persona ya no tiene ninguna ocupación vigente ni programada en la comunidad: por término de arriendo, venta o cancelación de un arriendo programado (GC F-14). Si le queda otra, sigue vigente y solo cambian las unidades que ve.
   - Si la persona tiene una ocupación programada y otra vigente, la membresía rige desde la vigente. Si solo tiene una programada, rige desde su `effective_from`: antes, el guard no la considera vigente y la persona recibe 404 (GC CA-53).
   - No se otorga ni se revoca por la ruta de membresías: 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`.
6. **CM-D6 · Último administrador.** GC D9, D10, S-68 y CA-69, sin cambios: Operaciones no revoca al único administrador vigente; ningún administrador revoca administradores. Cómo cuenta un administrador con `valid_from` futuro sigue en GC P-61. Si la comunidad no tiene administrador, la ley permite que el presidente del comité ejerza sus funciones (MINVU, "Herramientas para la administración"); ComVive no lo modela, porque la comunidad nunca queda sin administrador (P-CM-9).
7. **CM-D7 · "Usuarios y roles" (lo que entrega la API al administrador).**
   - **Administradores** (solo lectura): nombre, RUT completo, desde, "Otorgado por ComVive" y estado de ingreso.
   - **Comité:** nombre, unidad o unidades de las que es propietario, desde, fecha y referencia de la asamblea (GC S-34), estado de ingreso y, si tiene una tarea "Revisar rol de comité" abierta o resuelta como mantener, ese dato (`docs/design/flujos/admin-usuarios-y-roles.md`).
   - **Conserjería:** nombre, RUT completo, desde y estado de ingreso.
   - **Historial de roles:** cada otorgamiento y cada revocación de la comunidad, también los de administrador hechos por Operaciones: quién, a quién, cuándo, por qué vía (`community` o `platform`) y referencia o motivo.
   - Los residentes no se listan aquí: están en el registro de copropietarios y en las ocupaciones de cada unidad.
   - La lectura queda en auditoría, porque devuelve RUT completos (`docs/arquitectura.md` §5).

### E. Ocupaciones (complementos de GC F-9, F-13, F-14 y F-15)

Las reglas de ocupaciones están en GC: estados y fechas efectivas ("Definiciones"; F-14), ámbitos y visibilidad (F-9), ocupación terminada (F-13), unidad sin propietario (F-15), vistas previas con huella (A-7), cancelación (F-14), comité que vende (M-7), errores (tabla de GC) y CA-21, CA-22, CA-37, CA-38, CA-53, CA-56, CA-57 y CA-61. Aquí solo se agrega lo que falta.

1. **CM-E1 · Datos de la persona en una ocupación:** RUT, nombre y contacto opcional, con las reglas CM-C1 a CM-C4. La fecha declarada de ingreso (alta de arrendatario) o de inscripción o entrega (venta o propietario faltante) es obligatoria. Se permite cualquier fecha pasada, porque es historial (GC F-14: el efecto rige desde el registro).
2. **CM-E2 · El propietario no es arrendatario de su propia unidad.** Registrar como arrendatario a quien tiene la ocupación de propietario vigente de esa unidad responde 422 `OWNER_CANNOT_BE_TENANT`. Puede ser arrendatario de otra unidad de la misma comunidad (Supuesto (a validar), S-CM-19).
3. **CM-E3 · Venta al arrendatario.** Registrar la venta de una unidad a la persona que es su arrendataria vigente o programada responde 409 `BUYER_IS_CURRENT_TENANT`. Primero se registra el término (con su traspaso, GC F-9) o la cancelación del arriendo, y después la venta. Así nunca coinciden en la misma persona y la misma unidad los ámbitos `owner` y `occupancy` (S-CM-19).
4. **CM-E4 · Término de un arriendo que no está vigente.** Terminar un arriendo programado responde 409 `OCCUPANCY_NOT_STARTED` con "Este arriendo aún no comienza. Si no comenzará, cancélalo"; uno cancelado, 409 `OCCUPANCY_CANCELLED`; uno terminado, 409 `OCCUPANCY_ALREADY_ENDED` (ya en GC). Orden en "Orden de validación por acción" (Supuesto (a validar), S-CM-2).
5. **CM-E5 · Carga inicial de ocupantes.** En una comunidad configurada sin emisiones, el administrador registra a los propietarios con la acción "propietario faltante" y a los arrendatarios con el alta de arrendatario, con sus fechas declaradas reales (por ejemplo, una compra de 2015). Rigen desde el registro (GC F-14) y, como no hay cargos emitidos, no cambian ningún ámbito. Las advertencias de fecha pasada de GC F-14 se muestran igual; el diseño puede agregar una ayuda propia para la carga inicial (Supuesto (a validar), S-CM-20).
6. **CM-E6 · Ocupación sin libro de movimientos.** En la rebanada 1 todavía no existe el libro (ADR 0004). El término de un arriendo y la venta se implementan con sus validaciones, su vista previa y su efecto en las membresías y la tarea de comité; el traspaso de lo pendiente (GC F-9, F-13; movimientos `transfer`) y la deuda que muestran las vistas previas llegan con la rebanada del libro, con TDD (P-CM-4). Hasta entonces, la vista previa del término muestra "El arrendatario no tiene deuda ni saldo a favor. No se moverá dinero." (texto del diseño para un traspaso vacío).

### F. Primer ingreso por invitación

1. **CM-F1 · F4 va en una rebanada propia, "Ingreso e invitaciones".** Justificación:
   - La aceptación de la invitación **es** el ingreso: RUT y código de un solo uso que deben coincidir con la invitación (`docs/design/flujos/residente-primer-ingreso.md`). El líder dejó el ingreso de ADR 0005 fuera de la rebanada 1 (D37).
   - Enviar una invitación necesita el proveedor de correo y SMS, que aún no está elegido (ADR 0005, decisión 1; `docs/arquitectura.md` §7).
   - El modelo de datos aprobado no tiene una entidad de invitación (vigencia, uso único, reenvío, vencimiento): la diseña el arquitecto junto con el ingreso.
   - Separarla no bloquea nada: en la rebanada 1 nadie ingresa, así que nadie necesita una invitación.
2. **CM-F2 · Lo que la rebanada 1 deja listo para F4.** RUT, nombre y contacto validados en cada membresía (sección C); el estado de ingreso de cada membresía (pendiente o activo); y, en el alta de arrendatario, el aviso de privacidad de GC S-44 en la respuesta de la vista previa, para que el administrador lo vea antes de confirmar (`docs/design/flujos/admin-ocupaciones.md`).
3. **CM-F3 · Requisitos que hereda la rebanada de invitaciones** (del diseño aprobado; se especifican allí): mensaje genérico sin datos de la comunidad ni de la unidad; el texto de GC S-44 para el arrendatario en el mensaje y en el primer ingreso; validez de 14 días y código de 10 minutos (supuestos del flujo); invitación ligada a una membresía, que deja de servir si la membresía termina o se revoca; RUT de la invitación igual al RUT que ingresa, con el mismo mensaje de error que un código errado; persona existente que ya tiene contacto verificado recibe el código ahí; y registro de cada envío en `NOTIFICATION_DELIVERY` (ADR 0008, decisión 14). La invitación del primer administrador, que hoy describe el flujo de usuarios y roles ("Te dieron acceso como administrador de una comunidad en ComVive…"), va en la misma rebanada.

### G. Auditoría

1. **CM-G1 · Escrituras.** En la misma transacción que la operación (ADR 0005, decisión 5) y sin copiar datos personales completos (`docs/arquitectura.md` §5): `community.create` y los de membresía de administrador (GC, ya definidos), `community.update` (campos cambiados), `unit.create`, `unit.update` (por campo, con el valor anterior y el nuevo de código, tipo, `aliquot_e6` y orden, y el motivo si se pidió), `unit.bulk_update` y `unit.bulk_create` (un evento por lote con el detalle por unidad), `unit.delete` (datos de la unidad y motivo), `membership.grant`, `membership.revoke` (con motivo y suscripciones eliminadas, GC S-81), `membership.contact_update` (valores anteriores enmascarados) y los de ocupaciones y tareas ya definidos en GC (`occupancy.cancel`, `admin_task.create`, `admin_task.resolve`, etc.).
2. **CM-G2 · Lecturas.** Se audita cada petición que devuelva RUT completo de terceros (Supuesto (a validar) de `docs/arquitectura.md` §5): "Usuarios y roles", el registro de copropietarios y el historial de ocupaciones leídos por el administrador; y cada lectura del comité del registro de copropietarios (GC "Datos de copropietarios que ve el comité"). No se audita la lectura de la ficha de la propia unidad ni de los datos de la comunidad.
3. **CM-G3 · Rechazos.** Un rechazo en una ruta de comunidad no escribe datos de negocio ni auditoría de negocio (GC D12). En las rutas `/platform/...`, toda petición queda en la auditoría de plataforma, también las rechazadas (ADR 0006, decisión 8; ADR 0009, D41 a D46).
4. **CM-G4 · Quién ve la auditoría.** El administrador ve, en "Registro de auditoría", los eventos de roles, tareas y ocupaciones de su comunidad y los de Operaciones sobre sus administradores (`docs/design/flujos/admin-usuarios-y-roles.md`). Ningún rol de comunidad ve filas de otra comunidad ni filas con comunidad nula (`docs/arquitectura.md` §4, `AUDIT_LOG`).

## Criterios de aceptación

Datos de prueba de `docs/qa/comunidades-simuladas.md`. Fechas en hora de Chile. Los CA de GC citados siguen vigentes y no se repiten.

**CA-CM-1 · Alta de una comunidad por Operaciones (Comunidad C)**

- Dada una persona de Operaciones ComVive (`operaciones-1`) con sesión de plataforma y segundo factor
- Cuando crea "Edificio Mirador" con un RUT de comunidad válido, primer administrador con un RUT válido que no existe en ComVive, celular +56 9 1234 5678 y motivo "Contrato de administración del 01-11-2026"
- Entonces existen la comunidad, la persona del administrador y una membresía `admin` vigente, sin fecha de término, con `granted_via = platform` y estado de ingreso "Pendiente".
- Y la comunidad no tiene unidades, periodos ni configuración de cobro; una vista previa de emisión respondería 422 `COMMUNITY_WITHOUT_UNITS` (GC A-3.8).
- Y la lista de comunidades de Operaciones muestra "Edificio Mirador", su RUT, 1 administrador y "Pendiente" en pago en línea, sin ningún otro dato.
- Y la misma persona de Operaciones, al pedir `GET /communities/{id de Edificio Mirador}/units`, recibe 404 `NOT_FOUND`.
- Y el alta y cada lectura de Operaciones quedan en la auditoría de plataforma.
- Y las validaciones y su orden son los de GC CA-69, CA-76 y "Validaciones de la consola de Operaciones ComVive", sin cambios.

**CA-CM-2 · Datos de la comunidad**

- Dado el administrador de la Comunidad C
- Cuando guarda dirección "Av. Los Leones 1234", comuna "Providencia" y tipo "edificio"
- Entonces quedan guardados y en auditoría (`community.update`).
- Cuando guarda el nombre vacío
- Entonces recibe 422 `COMMUNITY_NAME_REQUIRED` con "Ingresa el nombre de la comunidad" y nada cambia.
- Cuando guarda el nombre vacío y la comuna vacía
- Entonces recibe solo 422 `COMMUNITY_NAME_REQUIRED` (orden de validación).
- Cuando envía un RUT de comunidad distinto
- Entonces recibe 400 `BAD_REQUEST` y el RUT no cambia (CM-A3).
- Dado un miembro del comité o un residente de la Comunidad C
- Cuando intenta editar los datos
- Entonces recibe 403 `FORBIDDEN` y nada cambia; al leerlos, recibe nombre, dirección, comuna, tipo y RUT.

**CA-CM-3 · Alta de unidades con alícuotas que suman 100 % (Comunidad C)**

- Dada la Comunidad C sin unidades y sin periodos emitidos
- Cuando el administrador crea en un lote, sin indicar orden, Depto 31 (210000), Depto 11 (185000), Depto 22 (210000), Depto 12 (195000) y Depto 21 (200000)
- Entonces se crean las cinco unidades con el orden propuesto en orden natural: Depto 11 = 1, Depto 12 = 2, Depto 21 = 3, Depto 22 = 4 y Depto 31 = 5 (los de GOLD-CE).
- Y la respuesta trae `aliquotSumE6` = 185.000 + 195.000 + 200.000 + 210.000 + 210.000 = 1.000.000, sin advertencia.
- Y no se pidió motivo, porque la comunidad no tiene periodos emitidos.
- Cuando después crea "Bodega B1" con alícuota 0 y sin orden
- Entonces recibe el orden 6, se muestra "Sin participación" y la suma sigue en 1.000.000 (GC CA-18).
- Y con estas unidades, una emisión de $1.234.567 en un solo grupo por alícuota reparte los cargos de GOLD-C, y con ordinario $1.175.778 y fondo $58.789, los de GOLD-CE (sin cambios en las pruebas de oro).

**CA-CM-4 · Validación de la alícuota**

- Dado el administrador de la Comunidad C
- Cuando crea "Depto 41" con `aliquotE6` 185000.5 (18,50005 %)
- Entonces recibe 422 `INVALID_ALIQUOT` con "La alícuota admite hasta 4 decimales" y no se crea nada.
- Cuando la crea con 1000001, con −1 o sin alícuota
- Entonces en los tres casos recibe 422 `INVALID_ALIQUOT` con "La alícuota debe estar entre 0 % y 100 %".
- Cuando la crea con 1000000 (100 %)
- Entonces se crea y la suma de la comunidad pasa a 2.000.000, con la advertencia "Las alícuotas suman 200,0000 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas".
- Y la función de conversión de `packages/shared` convierte "18,5", "18.5" y "18,5000" en 185000, "100" en 1000000 y "0" en 0, y rechaza "18,50001", "100,0001", "-1", "1e2" y "18,5 %" (prueba de propiedades: convertir y volver a texto con 4 decimales devuelve el mismo valor).

**CA-CM-5 · Suma distinta de 100 %: se guarda y bloquea la emisión (Comunidad C, GC CA-19)**

- Dadas las unidades de CA-CM-3
- Cuando el administrador cambia Depto 31 a 209900 (20,9900 %)
- Entonces el cambio se guarda, la suma es 999.900 y la respuesta trae la advertencia "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas".
- Y una emisión con un grupo por alícuota responde 422 `ALIQUOTS_NOT_100` con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %" y no crea nada (GC CA-19).

**CA-CM-6 · Código y orden repetidos, y lote todo o nada (Comunidad C)**

- Dadas las unidades de CA-CM-3
- Cuando el administrador crea "depto  11" (minúscula y doble espacio)
- Entonces recibe 409 `UNIT_CODE_ALREADY_EXISTS` con "El código Depto 11 ya existe en esta comunidad".
- Cuando crea "Depto 41" con orden 3
- Entonces recibe 409 `SORT_ORDER_ALREADY_USED` con "El orden 3 ya lo usa Depto 21".
- Cuando crea un lote de tres filas: fila 1 "Depto 41" válida, fila 2 sin código y fila 3 "Depto 42" con alícuota 1000001
- Entonces recibe 422 `UNITS_INVALID` con la fila 2 (`UNIT_CODE_REQUIRED`) y la fila 3 (`INVALID_ALIQUOT`, "La alícuota debe estar entre 0 % y 100 %"), y no se crea ninguna de las tres, tampoco Depto 41.
- Cuando en una edición en bloque intercambia los órdenes de Depto 21 (3) y Depto 22 (4)
- Entonces el lote se acepta, Depto 21 queda con 4 y Depto 22 con 3, y un `unit.bulk_update` queda en auditoría.

**CA-CM-7 · Cambio de alícuotas después de un periodo emitido (Comunidad A, regla 6)**

- Dada la Comunidad A del estado de CA-1, sin arrendatarios, con `2026-10` emitido el 2026-11-01 (cargos GOLD-A: Depto 101 $210.000, Depto 102 $262.500, Depto 201 $262.500, Depto 202 $315.000) y el borrador `2026-11` con gastos ordinarios por $1.000.000 y fondo 5 %
- Cuando el 2026-11-20 el administrador edita en bloque Depto 101 de 200000 a 190000 y Depto 202 de 300000 a 310000, sin motivo
- Entonces recibe 422 `REASON_REQUIRED` con "Indica el motivo del cambio y el documento que lo respalda" y nada cambia.
- Cuando lo reenvía con el motivo "Modificación del reglamento, asamblea extraordinaria del 18-11-2026"
- Entonces el cambio se guarda, la suma sigue en 1.000.000 (190.000 + 250.000 + 250.000 + 310.000) y queda en auditoría con los valores anteriores y nuevos y el motivo.
- Y los cargos de `2026-10` no cambian: la foto de `2026-10` conserva 200000 y 300000.
- Cuando se emite `2026-11` el 2026-12-01, con fondo (1.000.000 × 500 + 9.999) div 10.000 = $50.000
- Entonces los cargos son Depto 101: 190.000 + 9.500 = $199.500; Depto 102: 250.000 + 12.500 = $262.500; Depto 201: $262.500; Depto 202: 310.000 + 15.500 = $325.500; suma 199.500 + 262.500 + 262.500 + 325.500 = $1.050.000 (regla 3 de `CLAUDE.md`).
- Y si después se anula el gasto "Aseo y artículos" de `2026-10` (GC CA-33), la nota de crédito del Depto 101 es −$10.500, calculada con la foto de `2026-10` (20 %), igual que GOLD-A33-01, y no con el 19 % actual.

**CA-CM-8 · Cambio de alícuota suelto y vista previa desactualizada (Comunidad A)**

- Dado el estado de CA-CM-7 antes del cambio, y una vista previa de emisión de `2026-11` pedida el 2026-11-30
- Cuando el administrador edita solo Depto 101 a 190000, con motivo
- Entonces el cambio se guarda con la advertencia "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas".
- Cuando confirma la emisión con el `previewHash` de la vista previa anterior
- Entonces recibe 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir" (GC A-7).
- Cuando pide una vista previa nueva
- Entonces recibe 422 `ALIQUOTS_NOT_100` con "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %" y no se crea nada.

**CA-CM-9 · Eliminación de una unidad**

- Dada la Comunidad C con las unidades de CA-CM-3, sin periodos emitidos, y "Depto 41" creada por error, sin ocupaciones
- Cuando el administrador elimina "Depto 41"
- Entonces la unidad deja de existir, la suma vuelve a 1.000.000 y `unit.delete` queda en auditoría.
- Dada la Comunidad A con `2026-10` emitido
- Cuando el administrador intenta eliminar el Depto 101, con o sin motivo
- Entonces recibe 409 `UNIT_IN_USE` con "Esta unidad ya tiene ocupantes, movimientos o periodos emitidos. No se puede eliminar" y nada cambia.
- Dada una unidad con un arriendo programado que luego se canceló, sin periodos emitidos
- Cuando el administrador intenta eliminarla
- Entonces recibe 409 `UNIT_IN_USE`.

**CA-CM-10 · Permisos sobre unidades (Comunidad A)**

- Dado un miembro del comité de la Comunidad A (`comite-A`, Rosa Díaz)
- Cuando lista las unidades
- Entonces recibe las cuatro, con código, tipo y alícuota.
- Cuando intenta crear, editar, editar en bloque o eliminar una unidad
- Entonces recibe 403 `FORBIDDEN` y nada cambia.
- Dada la propietaria del Depto 101 (`propietario-101`, Ana Pérez, sin otros roles)
- Cuando lista las unidades
- Entonces recibe solo el Depto 101.
- Cuando pide el Depto 102, crea una unidad o edita el Depto 101
- Entonces recibe 404 `NOT_FOUND` en los tres casos (no ve el Depto 102 ni la configuración de unidades).
- Dado el conserje de la Comunidad A (`conserje-A`, Juan Castro)
- Cuando lista las unidades o pide el Depto 101
- Entonces recibe 404 `NOT_FOUND`; al pedir los datos de la comunidad, los recibe.

**CA-CM-11 · Aislamiento de unidades entre comunidades (regla 4)**

- Dado el administrador de la Comunidad A (`admin-A`), sin membresía en la Comunidad B
- Cuando lista las unidades de la Comunidad B, pide la Casa 1 de B por la ruta de B, o edita la Casa 1 de B por la ruta de B
- Entonces recibe 404 `NOT_FOUND` con el mismo cuerpo en los tres casos y en un id inexistente, y nada cambia en B.
- Cuando pide o edita la Casa 1 de B por la ruta de la Comunidad A (`/communities/{A}/units/{id de Casa 1}`)
- Entonces recibe 404 `NOT_FOUND` antes de validar el cuerpo, también con un JSON mal formado (ADR 0009, paso 3b), y nada cambia.
- Cuando crea en A una unidad con el código "Casa 1", que existe en B
- Entonces se crea: la unicidad del código es por comunidad.
- Y la respuesta de A nunca incluye unidades, sumas de alícuotas ni datos de B.

**CA-CM-12 · Persona que ya existe en otra comunidad (Comunidades A y B)**

- Dado el administrador de la Comunidad A y Felipe Rojas (RUT 22.456.789-8), administrador de la Comunidad B con contacto verificado
- Cuando pide la vista previa del alta de Felipe Rojas como arrendatario del Depto 102, con el nombre "F. Rojas" y el correo `frojas@example.com`
- Entonces la vista previa dice "Esta persona ya tiene cuenta en ComVive; se le agregará esta unidad" y no trae su nombre registrado en B, su contacto, sus comunidades ni sus roles.
- Cuando confirma el alta
- Entonces se crea una membresía de residente en A con el nombre "F. Rojas" y el correo `frojas@example.com`, y el contacto de ingreso de la persona no cambia.
- Y la membresía `admin` de Felipe en B, su nombre en B y su contacto no cambian, y el administrador de B no ve nada de A.

**CA-CM-13 · Datos mínimos y orden de validación del alta de arrendatario (Comunidad A, Depto 102)**

- Dado el administrador de la Comunidad A y el Depto 102 sin arrendatario
- Cuando pide la vista previa con RUT 15.234.567-9 (dígito verificador inválido), sin nombre y con el celular +56 9 123
- Entonces recibe solo 422 `INVALID_RUT` con "Ingresa un RUT válido. Revisa el dígito verificador".
- Cuando corrige el RUT a 15.234.567-4 (Pedro Soto)
- Entonces recibe 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre de la persona".
- Cuando agrega el nombre "Pedro Soto"
- Entonces recibe 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido".
- Cuando quita el celular
- Entonces la vista previa responde sin error: el contacto es opcional y, sin él, la persona no se podrá invitar.
- Cuando envía además un campo "fechaNacimiento"
- Entonces recibe 400 `BAD_REQUEST` (CM-C1).

**CA-CM-14 · Propietario como arrendatario y venta al arrendatario (Comunidad A)**

- Dado el Depto 102, de Luis Muñoz (12.345.670-K), con O-1 de Pedro Soto (15.234.567-4) vigente desde el 2026-11-15
- Cuando el administrador registra a Luis Muñoz como arrendatario del Depto 102
- Entonces recibe 422 `OWNER_CANNOT_BE_TENANT` con "Esta persona es propietaria de la unidad. No puede ser también su arrendataria" (antes que el 409 `TENANT_ALREADY_ACTIVE`, que también aplicaría).
- Cuando registra la venta del Depto 102 a Pedro Soto, con fecha 2026-12-01
- Entonces recibe 409 `BUYER_IS_CURRENT_TENANT` con "Esta persona es la arrendataria vigente o programada de la unidad. Registra primero el término o la cancelación de su arriendo" y nada cambia.
- Cuando primero registra el término de O-1 y después la venta a Pedro Soto
- Entonces ambas se aceptan; la deuda del ámbito de O-1 pasa al ámbito `owner` con el traspaso de GC F-9 (cuando exista el libro, CM-E6) y sigue a la unidad (GC CA-21).
- Y al terminar O-1, Pedro Soto pierde su membresía de residente (no le queda otra ocupación, CM-D5); al registrarse la venta recibe una membresía nueva, con la que ve el Depto 102 como propietario y no ve nada del ámbito de O-1 (GC S-14, S-51).

**CA-CM-15 · Membresía de residente con varias ocupaciones (Comunidad A)**

- Dado Marco Silva (18.234.765-5), propietario del Depto 202, a quien se registra también como propietario faltante del Depto 201 en un escenario sin Rosa Díaz
- Entonces tiene una sola membresía de residente en la Comunidad A y ve las fichas del Depto 201 y del Depto 202.
- Cuando se registra la venta del Depto 201 a otra persona
- Entonces su membresía sigue vigente y desde ese momento recibe 404 en el Depto 201 y sigue viendo el Depto 202.
- Cuando se registra la venta del Depto 202
- Entonces su membresía de residente termina con la revocación de GC S-81: se eliminan sus suscripciones push de esa membresía, su sesión no cambia y la Comunidad A le responde 404.
- Dada Daniela Fuentes (O-4, 13.579.246-2), arrendataria programada del Depto 102 con `effective_from` 2026-12-05
- Entonces su membresía de residente tiene `valid_from` 2026-12-05 y, antes de esa fecha, la Comunidad A le responde 404 (GC CA-53).
- Cuando el arriendo se cancela el 2026-11-26 (GC CA-61)
- Entonces su membresía de residente termina, porque no tiene otra ocupación en la comunidad.

**CA-CM-16 · Revocación del comité y límites de la ruta de membresías (Comunidad A)**

- Dado que Rosa Díaz integra el comité (GC CA-43)
- Cuando el administrador revoca su rol sin motivo
- Entonces recibe 422 `REASON_REQUIRED` con "Indica el motivo de la revocación" y nada cambia.
- Cuando la revoca con el motivo "Término del periodo del comité"
- Entonces el rol queda revocado y en auditoría; desde la petición siguiente, el registro de copropietarios le responde 404 y sigue viendo el Depto 201 como propietaria (GC CA-43, S-81).
- Cuando otro administrador reenvía la revocación con otra clave
- Entonces recibe 409 `ROLE_ALREADY_REVOKED` con "Este rol ya fue revocado".
- Cuando un administrador intenta revocar la membresía `admin` de Héctor Molina por la ruta de comunidad, o la propia
- Entonces recibe 403 `FORBIDDEN` y nada cambia.
- Cuando intenta revocar la membresía de residente de Ana Pérez, u otorgar a alguien el rol `resident`, por la ruta de membresías
- Entonces recibe 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` con "El rol de residente nace y termina con la ocupación. Registra el arriendo, su término o la venta en la unidad".
- Dado un miembro vigente del comité
- Cuando intenta revocar la membresía de otro miembro del comité
- Entonces recibe 404 `NOT_FOUND`, porque no ve las membresías.

**CA-CM-17 · Conserjería (Comunidad A)**

- Dado el administrador de la Comunidad A
- Cuando otorga el rol de conserje a Juan Castro (9.876.543-3), con nombre y sin contacto
- Entonces se crea una membresía `concierge` vigente con estado de ingreso "Pendiente", en auditoría.
- Cuando vuelve a otorgarlo con otra clave
- Entonces recibe 409 `ALREADY_CONCIERGE` con "Esta persona ya integra la conserjería".
- Cuando lo otorga a otra persona con RUT inválido y sin nombre
- Entonces recibe solo 422 `INVALID_RUT`.
- Dado un miembro del comité
- Cuando intenta otorgar el rol de conserje
- Entonces recibe 403 `FORBIDDEN`.
- Dado Juan Castro como conserje
- Cuando pide los datos de la comunidad, las unidades, el registro de copropietarios, las ocupaciones o "Usuarios y roles"
- Entonces recibe los datos de la comunidad y 404 `NOT_FOUND` en todo lo demás.

**CA-CM-18 · "Usuarios y roles" (Comunidad A)**

- Dado el estado de GC CA-43 (Carolina Lagos y Héctor Molina administradores; Rosa Díaz en el comité desde el 2026-10-20 con "Asamblea ordinaria del 20-10-2026") y Juan Castro conserje
- Cuando el administrador pide "Usuarios y roles"
- Entonces recibe: administradores (nombre, RUT completo, desde, "Otorgado por ComVive", estado de ingreso), comité (Rosa Díaz, Depto 201, desde, fecha y referencia de la asamblea, estado de ingreso), conserjería (Juan Castro, RUT completo, desde, estado de ingreso) y no recibe residentes.
- Y con el filtro de historial recibe cada otorgamiento y revocación con quién, a quién, cuándo, vía y referencia o motivo, incluidos los de Operaciones.
- Y la lectura queda en auditoría.
- Y una membresía cuya persona ya hizo su primer ingreso en esa comunidad muestra "Activo"; una cuya persona solo ingresó a otra comunidad, "Pendiente" (GC D27).
- Dado un miembro del comité o un residente
- Cuando pide "Usuarios y roles"
- Entonces recibe 404 `NOT_FOUND`.

**CA-CM-19 · Corrección de nombre y contacto (Comunidad A)**

- Dado Pedro Soto, arrendatario del Depto 102, registrado con el nombre "Pedro Sotto" y el celular +56 9 1111 2222
- Cuando el administrador corrige el nombre a "Pedro Soto" y el celular a +56 9 3333 4444
- Entonces la membresía de la Comunidad A queda con los datos nuevos, el propietario del Depto 102 ve "Deuda del arrendatario Pedro Soto" (GC S-44) y `membership.contact_update` queda en auditoría con los valores anteriores enmascarados.
- Y si Pedro Soto ya tenía un contacto de ingreso verificado, ese contacto no cambia.
- Cuando intenta cambiar el RUT por esta acción
- Entonces recibe 400 `BAD_REQUEST`.
- Dado un miembro del comité
- Cuando intenta la misma corrección
- Entonces recibe 404 `NOT_FOUND`.

**CA-CM-20 · Lo que cada rol ve de las personas (Comunidad A, estado de GC CA-22)**

- Dado el Depto 102 con Luis Muñoz propietario y Pedro Soto arrendatario (O-1)
- Cuando Pedro Soto pide la ficha del Depto 102
- Entonces recibe código, tipo y alícuota (25,0000 %), y ningún dato de Luis Muñoz (S-CM-18).
- Cuando Luis Muñoz pide la ficha del Depto 102
- Entonces recibe código, tipo y alícuota; del arrendatario, solo lo de GC S-44 en las pantallas de deuda, nunca su RUT ni su contacto (GC CA-60).
- Cuando un miembro del comité lee el historial de ocupaciones del Depto 102
- Entonces recibe el propietario con RUT `12.345.***-*` y el arrendatario solo como "Arrendatario", sin nombre, RUT ni contacto (GC S-33), y la lectura queda en auditoría.
- Cuando el administrador lee el mismo historial
- Entonces recibe RUT completos, nombres y contactos, y la lectura queda en auditoría.

**CA-CM-21 · Término de un arriendo que no está vigente (Comunidad A)**

- Dado O-5 (Ignacio Paz), arriendo programado del Depto 102 con `effective_from` 2026-12-10, consultado el 2026-11-29
- Cuando el administrador pide la vista previa del término con fecha 2026-12-15 (futura)
- Entonces recibe 409 `OCCUPANCY_NOT_STARTED` con "Este arriendo aún no comienza. Si no comenzará, cancélalo", y no 422 `END_DATE_IN_FUTURE`, porque el estado va antes que la fecha.
- Dado O-4 cancelado el 2026-11-26 (GC CA-61)
- Cuando pide la vista previa de su término
- Entonces recibe 409 `OCCUPANCY_CANCELLED` con "Este arriendo ya fue cancelado".

**CA-CM-22 · Carga inicial de propietarios con fecha antigua (Comunidad C)**

- Dada la Comunidad C con las unidades de CA-CM-3, sin periodos emitidos, el 2026-11-12
- Cuando el administrador registra como propietario faltante del Depto 11 a una persona con fecha de inscripción declarada 2015-03-01
- Entonces la ocupación queda vigente con fecha declarada 2015-03-01 y `effective_from` 2026-11-12, y su membresía de residente con `valid_from` 2026-11-12.
- Y la vista previa muestra la advertencia de GC F-14 "La fecha de venta es anterior a hoy. Los avisos ya emitidos siguen a nombre del propietario anterior y la deuda de la unidad no cambia" (S-CM-20).
- Y no se crea ningún movimiento ni cambia ningún ámbito, porque no hay cargos emitidos.

**CA-CM-23 · Aislamiento de membresías y ocupaciones entre comunidades (regla 4)**

- Dado el administrador de la Comunidad A, sin membresía en B
- Cuando revoca, por la ruta de A, el `membershipId` de un miembro del comité de B, o corrige su contacto
- Entonces recibe 404 `NOT_FOUND` antes de validar el cuerpo, con el mismo cuerpo que un id inexistente, y nada cambia en A ni en B.
- Cuando registra un arrendatario en una unidad de B por la ruta de A
- Entonces recibe 404 `NOT_FOUND`.
- Cuando pide "Usuarios y roles" o el registro de copropietarios de A
- Entonces la respuesta no incluye ninguna persona, membresía ni ocupación de B, aunque la persona tenga membresías en ambas.
- Y cada endpoint nuevo de esta spec tiene su prueba de aislamiento generada desde la matriz "Qué recursos ve cada rol" (ADR 0002, decisión 5; ADR 0009, prueba de barrido).

## Casos borde

- **Unidad sin alícuota (0 %):** se guarda como "Sin participación"; no recibe cargos de grupos por alícuota, sí cargos directos y de partes iguales si está en el conjunto (GC C-5, CA-18). Cuenta en la suma con 0.
- **Unidad accesoria (bodega o estacionamiento) cuya alícuota está incluida en la del departamento:** se registra con 0 % (CM-B3). Si tiene otro propietario, se registra su propia ocupación de propietario.
- **Suma sobre 100 %:** se guarda con advertencia; la emisión por alícuota se bloquea (CM-B4, GC A-3.1).
- **Carga por partes:** cada alta deja la suma intermedia con advertencia; no hay error hasta emitir (CM-B4).
- **Intercambio de orden entre dos unidades:** solo con la edición en bloque (CM-B5, CA-CM-6).
- **Cambio de alícuotas con efecto retroactivo acordado por la asamblea:** ComVive no recalcula periodos emitidos ni cerrados; el cambio rige desde el borrador vigente (CM-B7, P-CM-1).
- **Cambio de alícuota entre la vista previa y la emisión:** 409 `PREVIEW_OUTDATED` (GC A-7, CA-CM-8).
- **Unidad nueva después de emitir (subdivisión o error de carga):** se acepta con motivo; no entra en ningún periodo emitido (CM-B7).
- **Unidad creada por error después de emitir y sin ocupaciones:** se puede eliminar con motivo, porque no está en ninguna foto (CM-B8).
- **Renombrar una unidad después de emitir:** se acepta sin motivo; los avisos emitidos conservan el código anterior (CM-B7, S-CM-11).
- **Dos administradores editan la misma unidad a la vez:** gana la última confirmada; ambas ediciones quedan en auditoría (CM-B9, S-CM-13).
- **Comunidad configurada sin unidades:** no se puede emitir (GC A-3.8).
- **Cambio de propietario a mitad de mes:** sin prorrateo por días; el aviso va al propietario a la fecha de emisión (GC CA-21). El vendedor pierde la membresía de residente si no le quedan ocupaciones (CM-D5).
- **Propietario de varias unidades:** una sola membresía de residente; la venta de una no le corta el acceso a las otras (CM-D5, CA-CM-15).
- **Propietario de una unidad y arrendatario de otra en la misma comunidad:** una sola membresía de residente; ve el ámbito `owner` de la suya y el de su arriendo en la otra (S-CM-19).
- **Arrendatario que compra la unidad que arrienda:** primero el término o la cancelación, después la venta (CM-E3, CA-CM-14).
- **Arriendo programado que se intenta terminar:** 409; se cancela (CM-E4, CA-CM-21).
- **Persona que ya existe en otra comunidad:** se agrega la membresía sin revelar nada de la otra comunidad; su contacto de ingreso no cambia (CM-C4, CA-CM-12).
- **Dos comunidades registran contactos distintos para una persona nueva que aún no ingresa:** el contacto de ingreso es el primero registrado, hasta su verificación (CM-C4, S-CM-17).
- **Propietario persona jurídica o comunidad hereditaria:** se registra con su RUT y el nombre de la entidad, y el contacto de su representante (S-CM-16, P-CM-10).
- **Unidad con varios propietarios (copropiedad de la unidad):** se registra uno; los demás quedan fuera del MVP (`docs/arquitectura.md` §4, "Unicidad"; UX-40; P-CM-10).
- **Ocupantes que no son propietarios ni arrendatarios (familiares, ocupantes por otro título):** no se registran en el MVP (P-CM-11).
- **RUT mal registrado:** no se edita; ver P-CM-7.
- **Administrador que es propietario en la misma comunidad:** se permite (roles unidos, ADR-0009-S4); no puede integrar el comité (GC S-43).
- **Conserje que además es propietario:** se permite; tiene dos membresías (conserjería y residente) (S-CM-14).
- **Revocación de comité con una tarea "Revisar rol de comité" abierta:** la tarea se cierra con `revoked_elsewhere` (GC M-7, CM-D4).
- **Revocación en una comunidad de una persona con membresías en otra:** la otra no cambia (GC S-81, CA-75).
- **Pagos parciales, pagos duplicados y periodos cerrados con movimientos:** no son de este módulo; ver GC F-1 a F-6, CA-10, CA-11 y la sección H. Lo que toca a este módulo es que ningún cambio de unidades altera un periodo emitido o cerrado (CM-B7).
- **Reintento con la misma clave de una escritura rechazada:** se reevalúa (GC D12).

## Fuera de alcance

- Crear, enviar, reenviar, aceptar y vencer invitaciones, y el ingreso con RUT y código: rebanada "Ingreso e invitaciones" (CM-F1).
- "Mis comunidades", "Mi cuenta" y el segundo factor del administrador (rutas `/me/` y `/auth/`, ADR-0009-S5).
- Medios de pago, configuración de cobro, primer mes a cobrar y primer borrador (GC A-2, D-2, E-1, G-2): rebanada de emisión.
- Importación desde planilla (UX-16), con su archivo y su tabla de errores: tarjeta propia que reutiliza el alta en bloque (P-CM-3).
- Lista de puesta en marcha y etiqueta "Configuración pendiente": con la web.
- Traspaso de deuda al terminar un arriendo y deuda en las vistas previas de ocupaciones: con el libro de movimientos (CM-E6, P-CM-4).
- Lo que ve y hace el conserje (visitas, encomiendas, bitácora): spec de conserjería.
- Autoservicio del administrador para crear comunidades (decisión del líder; supuesto del flujo de alta).
- Fusión y subdivisión de unidades como operación propia; varios propietarios por unidad; coarrendatarios (UX-35); ocupantes que no son propietarios ni arrendatarios.
- Pesos relativos por unidad (`UNIT.share_weight`) distintos de 1 (P-CM-2).
- Registro Nacional de Administradores: ComVive no guarda ni verifica la inscripción del administrador (P-CM-12).
- Ejercicio de derechos de la Ley 21.719 desde la app ("Ejercer mis derechos"), retención y supresión de datos de ex residentes (`docs/arquitectura.md` §8, pregunta 7).

## Supuestos (a validar)

| Id | Supuesto | Fuente o razonamiento |
| --- | --- | --- |
| S-CM-1 | Códigos y textos nuevos de la tabla "Códigos y mensajes de error nuevos". Los de alícuota, código y orden repetidos vienen del diseño aprobado; el resto los propone el analista. Se reutilizan `COMMUNITY_NAME_REQUIRED`, `REASON_REQUIRED`, `INVALID_CONTACT`, `OCCUPANCY_NOT_STARTED`, `OCCUPANCY_CANCELLED` y `ROLE_ALREADY_REVOKED` con textos por acción, como ya hace GC con `REASON_REQUIRED` y `END_DATE_IN_FUTURE`. | Convención de GC "Códigos y mensajes de error" (409 estado, 422 entrada). Textos del diseño: `docs/design/flujos/admin-alta-comunidad.md` y WEB-ALT-04. Convención propia, sin efecto legal. |
| S-CM-2 | Órdenes de validación de "Orden de validación por acción", incluido que en el término de un arriendo el estado va antes que la fecha, y en la eliminación de una unidad, antes que el motivo. | Mismo criterio que GC S-34, S-63 y CA-61: datos primero, conflictos al final, salvo que no tenga sentido pedir un dato de una acción imposible. Propuesta del analista. |
| S-CM-3 | El administrador no edita el RUT de la comunidad; lo corrige Operaciones por un procedimiento auditado. | El RUT es la clave de unicidad de la comunidad en ComVive (GC S-63, `COMMUNITY_ALREADY_EXISTS`, P-49). El flujo de alta dice que el RUT "se puede revisar", no editar. |
| S-CM-4 | Tipos de unidad: departamento, casa, estacionamiento, bodega y local. El tipo es informativo. | Lista del flujo de alta (`docs/design/flujos/admin-alta-comunidad.md`, paso 4). Puede faltar "oficina" en edificios mixtos (P-CM-13). |
| S-CM-5 | El código de unidad se compara sin mayúsculas y con espacios normalizados; máximo 30 caracteres. | Evita "Depto 101" y "depto 101" como dos unidades, que confundirían avisos y pagos. Convención propia. |
| S-CM-6 | La API recibe la alícuota como entero `aliquotE6`; la conversión desde el texto (hasta 4 decimales, coma o punto) es una función de `packages/shared`, sin punto flotante. | `docs/arquitectura.md` §4 (`aliquot_e6`), `docs/design/arquitectura-de-informacion.md` ("Alícuotas") y la regla 1 de `CLAUDE.md` aplicada por analogía. Así la API no interpreta formatos regionales y la importación futura usa la misma función. |
| S-CM-7 | Si el alta no trae el orden, la API asigna los números siguientes al mayor existente, en orden natural de los códigos del lote. | GC C-4 ("el sistema propone un valor inicial en orden natural del código"). Asignar después del mayor existente evita mover órdenes ya usados en periodos emitidos. Convención propia. |
| S-CM-8 | El alta y la edición en bloque son todo o nada, responden 422 `UNITS_INVALID` con el primer error de cada fila inválida y aceptan hasta 1.000 filas. | El diseño de la importación ya es todo o nada con tabla de errores por fila (`docs/design/flujos/admin-alta-comunidad.md`). El tope protege a la API y supera con holgura el condominio más grande esperado. Es la única excepción a "una respuesta, un código" (GC "Orden entre reglas de negocio"); lo debe aceptar el arquitecto (ADR 0003). |
| S-CM-9 | Un cambio de alícuotas rige desde el borrador vigente; no se recalcula ni se ajusta ningún periodo emitido o cerrado. | Regla 6 de `CLAUDE.md`; foto de participaciones (GC "Definiciones"; ADR 0004, decisión 7 y "Alternativas": leer las alícuotas actuales al recalcular un periodo pasado no es reproducible). Si la asamblea acuerda un efecto retroactivo, cómo se cobra queda en P-CM-1. |
| S-CM-10 | Desde el primer periodo emitido, todo cambio que afecte el prorrateo (alta, alícuota, orden, eliminación) exige un motivo que nombre el documento que lo respalda. Antes de emitir, no. El código y el tipo nunca lo exigen. | Las alícuotas las fija el reglamento de copropiedad y su modificación exige asamblea extraordinaria (Ley 21.442, art. 15, según MINVU; numeración en GC P-1); GC "Casos borde" ya dice que un cambio de alícuotas requiere modificar el reglamento. El diseño propone "edición con advertencia, motivo obligatorio y auditoría; afecta solo a periodos futuros" (UX-15). Antes de emitir, el administrador está cargando datos y pedir motivo en cada fila no agrega control. ComVive guarda el texto sin validar el acuerdo, como GC S-49. |
| S-CM-11 | Los avisos emitidos conservan el código de unidad con que se generaron; las pantallas muestran el código actual. | GC G-5 (el PDF se genera una vez). Guardar el código en la foto de cada periodo sería más exacto, pero no lo pide ninguna regla; lo decide el arquitecto. |
| S-CM-12 | Una unidad se elimina solo si nada la referencia (ocupaciones de cualquier estado, movimientos, pagos, intentos ni fotos); la auditoría conserva sus datos. | Regla 5 y 6 de `CLAUDE.md`: nada que haya participado en dinero se borra. Una ocupación cancelada también cuenta, porque está en el historial y en la auditoría. |
| S-CM-13 | Dos ediciones concurrentes de la misma unidad: gana la última confirmada, sin control de versión. La emisión no se intercala con un cambio de unidades. | Comunidades pequeñas con pocos administradores; la emisión ya está protegida por su vista previa con huella (GC A-7). Si el Piloto muestra conflictos, se agrega una versión por unidad. |
| S-CM-14 | La rebanada 1 incluye otorgar y revocar conserjería con RUT, nombre y contacto opcional, sin referencia a un acuerdo; en esta rebanada el conserje ve solo los datos de la comunidad (404 en unidades y personas). | La tarjeta F2 incluye conserjería y `docs/arquitectura.md` §3 fija sus endpoints y su permiso; las pruebas de permisos de GC (CA-24) ya usan al conserje. El diseño deja sus pantallas para después y GC remite su detalle a la spec de conserjería; lo que ve de los residentes (nombre y unidad, `docs/arquitectura.md` §3) lo fija esa spec (P-CM-8). |
| S-CM-15 | El RUT es obligatorio también para el arrendatario. | UX-8 del diseño y `docs/design/flujos/residente-primer-ingreso.md`: la persona se reconoce por su RUT y sin él no puede ingresar. Minimización (Ley 21.719): es el único identificador que se pide. |
| S-CM-16 | Se aceptan como propietarios personas jurídicas y comunidades hereditarias, con su RUT, el nombre de la entidad y el contacto de su representante, que ingresa con el RUT de la entidad. | El registro de copropietarios individualiza al copropietario de cada unidad (Ley 21.442 y DS N° 7 de 2025, art. 6, según MINVU), que puede ser una empresa o una sucesión con RUT propio (SII). Ingresar con el RUT de la entidad evita inventar un propietario natural. Riesgo: el código va al contacto del representante. P-CM-10. |
| S-CM-17 | El contacto de ingreso de una persona nueva es el primero registrado, hasta que lo verifique; los demás quedan en la membresía de su comunidad. | Evita que un administrador de otra comunidad cambie a dónde llega el código de una persona (`docs/design/flujos/residente-primer-ingreso.md`, UX-30). |
| S-CM-18 | El arrendatario no ve datos del propietario. | Minimización (Ley 21.719): el arrendatario paga su ámbito y no necesita identificar al propietario en ComVive (GC S-25 ya le oculta la deuda del ámbito `owner`). |
| S-CM-19 | Una persona no es arrendataria de una unidad de la que es propietaria, ni compra la unidad que arrienda sin terminar antes su arriendo; sí puede ser propietaria de una unidad y arrendataria de otra. | Los ámbitos `owner` y `occupancy` de una misma unidad separan responsables distintos (GC F-9, S-19); con la misma persona en ambos, el pago y la visibilidad por ámbito pierden sentido. Convención propia. |
| S-CM-20 | En la carga inicial se usan las mismas acciones y advertencias de GC F-14, con las fechas declaradas reales. | GC F-14 y P-27 (cerrada): todo rige desde el registro. Sin cargos emitidos no hay efecto en ámbitos. El diseño puede ajustar la ayuda de pantalla. |

## Preguntas abiertas

- [ ] **P-CM-1** (contador y abogado): si la asamblea aprueba nuevas alícuotas con efecto desde una fecha pasada, ¿cómo se cobran las diferencias de los periodos ya emitidos? Supuesto mientras tanto (S-CM-9): el cambio rige desde el borrador vigente y ComVive no recalcula periodos emitidos ni cerrados; las diferencias, si se acuerdan, se cobran con cargos directos del administrador.
- [ ] **P-CM-2** (líder y arquitecto): `docs/arquitectura.md` §4 y ADR 0004 guardan un peso relativo por unidad (`UNIT.share_weight`), pero GC C-2 define las partes iguales con un conjunto de unidades por gasto, con peso 1. ¿Se elimina `share_weight` del modelo o se agrega una base "pesos relativos" a GC? Supuesto mientras tanto: la rebanada 1 no lo captura y queda en 1.
- [ ] **P-CM-3** (líder): ¿la importación desde planilla (UX-16) va en una tarjeta propia después de la rebanada 1? Propuesta: sí; la rebanada 1 deja el alta en bloque todo o nada, que la importación reutiliza. ¿Se aceptan exportaciones de Edifito o ComunidadFeliz (UX-16)?
- [ ] **P-CM-4** (líder y arquitecto): ¿se acepta que el término de arriendo y la venta se entreguen en la rebanada 1 sin el traspaso de movimientos, que llega con el libro (CM-E6)? La alternativa es mover término y venta a la rebanada del libro y dejar en la rebanada 1 solo el alta, la cancelación y el propietario faltante.
- [ ] **P-CM-5** (líder): ¿cómo corrige Operaciones el nombre o el RUT de una comunidad mal ingresados en el alta? No hay acción en la consola (CON-11). Supuesto (S-CM-3): procedimiento auditado fuera de la aplicación, como la activación del pago en línea.
- [ ] **P-CM-6** (líder y diseño): la consola de Operaciones muestra el nombre de cada administrador (CON-11), pero el alta y el otorgamiento no lo piden (GC S-63). ¿Se agrega el nombre como campo obligatorio, con un código nuevo antes de `INVALID_CONTACT`, o lo completa la persona en su primer ingreso? Mientras no se decida, la consola muestra "Nombre pendiente" (propuesta del analista, sin cambiar el orden aprobado de GC S-63).
- [ ] **P-CM-7** (líder y abogado): ¿cómo se corrige una ocupación registrada con el RUT equivocado? El RUT no se edita (CM-C6). Para un arriendo programado basta cancelarlo; para uno vigente, terminarlo traspasa su deuda al propietario, y para un propietario, registrar una venta falsearía el historial. Propuesta: una acción de "corrección de identidad" del administrador, con motivo, que reemplaza la persona de la ocupación sin mover dinero y queda en auditoría, válida solo si la persona equivocada nunca ingresó.
- [ ] **P-CM-8** (líder): ¿se incluye la conserjería en la rebanada 1 (S-CM-14) o se pospone a la spec de conserjería, como dice el diseño ("Posterior")?
- [ ] **P-CM-9** (abogado): si la comunidad queda sin administrador, la ley permite que el presidente del comité ejerza sus funciones. ComVive exige siempre un administrador (GC D9). ¿Debe ComVive permitir que el presidente del comité opere como administrador, o basta que Operaciones le otorgue el rol de administrador (lo que hoy choca con GC S-43, porque integra el comité)?
- [ ] **P-CM-10** (abogado y líder): ¿se aceptan propietarios personas jurídicas y comunidades hereditarias con el RUT de la entidad y el contacto de su representante (S-CM-16)? ¿Y unidades con varios propietarios (UX-40)? La Ley 21.442, art. 21, según fuentes secundarias, permite integrar el comité a los cónyuges y a los representantes de personas jurídicas propietarias; eso afecta a GC S-34 y GC P-25.
- [ ] **P-CM-11** (abogado): el registro de copropietarios debe individualizar también a los "demás ocupantes", distinguiendo permanentes y transitorios (Ley 21.442 y DS N° 7, según MINVU). ComVive solo registra propietarios y arrendatarios. ¿Es suficiente para el MVP o hay que agregar ocupantes sin acceso ni deuda?
- [ ] **P-CM-12** (abogado y líder): ¿ComVive debe guardar o verificar la inscripción del administrador en el Registro Nacional de Administradores de Condominios antes de otorgarle el rol? Supuesto mientras tanto: Operaciones lo verifica fuera del sistema y ComVive no lo guarda.
- [ ] **P-CM-13** (líder): ¿faltan tipos de unidad (por ejemplo, "oficina" u "otro") en la lista del diseño (S-CM-4)?
- [ ] **P-CM-14** (líder): ¿aprueba los códigos y textos nuevos de S-CM-1, en especial `UNITS_INVALID` con varios errores en una respuesta (S-CM-8), y los órdenes de validación de S-CM-2?
- [ ] **P-CM-15** (líder): ¿aprueba dejar F4 (invitaciones) para la rebanada "Ingreso e invitaciones" (CM-F1)?

## Contradicciones y vacíos en documentos aprobados

Ninguno bloquea la rebanada; cada uno queda con su supuesto y su pregunta.

1. **Cambio de alícuotas:** GC "Casos borde" dice "Un cambio de alícuotas requiere modificar el reglamento (fuera de alcance; P-10)", mientras el diseño aprobado permite editar alícuotas después de emitir (UX-15; `docs/design/arquitectura-de-informacion.md`, "Unidades … (edición: A)"). No se contradicen si "fuera de alcance" se lee como "el acto legal no lo modela ComVive". Esta spec lo lee así (CM-B7, S-CM-10). Si el líder lo lee como "no se edita", hay que quitar la edición después de emitir.
2. **`UNIT.share_weight`:** la arquitectura y ADR 0004 lo modelan; GC C-2 no lo usa (P-CM-2).
3. **Nombre del administrador:** CON-11 lo muestra, pero GC S-63 no lo pide (P-CM-6).
4. **Tipo de comunidad:** el flujo de alta dice que el tipo y el RUT "los trae Operaciones", pero la consola (CON-11) no pide el tipo. Aquí lo completa el administrador (CM-A3).
5. **Contacto en `MEMBERSHIP`:** el modelo tiene `phone` pero no correo, y el contacto puede ser un correo (GC S-63). Observación para el arquitecto: agregar el correo por membresía.
6. **Rutas de Operaciones:** la consola lista comunidades y administradores (CON-11), pero `docs/arquitectura.md` §3 no tiene esos `GET`. Se proponen en "Acciones de la rebanada".
7. **Motivo al revocar comité:** el diseño lo pide; GC no lo tenía en la tabla de errores. Se agrega (CM-D4).
8. **Sesión al revocar en el diseño:** `docs/design/flujos/admin-usuarios-y-roles.md`, paso 6 del ingreso del administrador, dice "Si se revoca el rol, la siguiente acción devuelve al ingreso", lo que contradice GC S-81 y el mismo documento más abajo (la sesión no se cierra; la comunidad responde 404). Rige GC S-81; el diseño debería corregir esa línea.
9. **Conserjería:** la tarjeta F2 la incluye; el diseño la marca "Posterior" (P-CM-8).
10. **Comité y la ley:** según fuentes secundarias, la Ley 21.442, art. 21, admite en el comité a cónyuges y representantes de personas jurídicas propietarias; GC S-34 solo admite propietarios registrados. Ya está abierto en GC P-25; esta spec agrega la fuente en P-CM-10.

## Referencias

- `docs/specs/gasto-comun.md` (rev. 9, aprobada): "Definiciones"; "Usuarios y permisos"; "Qué recursos ve cada rol" (S-53); "Respuestas de error" (S-70, S-77); "Códigos y mensajes de error"; "Otorgamiento de roles" (S-34, S-43, S-81); "Validaciones de la consola de Operaciones ComVive" (S-63, S-68, S-72, S-79, S-85, S-86; D9, D10, D12, D24, D27); "Comité que deja de ser propietario" (M-7); "Datos del arrendatario que ve el propietario" (S-44); "Datos de copropietarios que ve el comité" (S-33); reglas A-2, A-3.1, A-3.4, A-3.8, A-7, C-2 a C-5, F-9, F-13, F-14, F-15, G-5; S-14, S-19, S-27, S-47; CA-18, CA-19, CA-21, CA-22, CA-24, CA-33, CA-37, CA-38, CA-43, CA-53, CA-56, CA-57, CA-60, CA-61, CA-64, CA-69, CA-75, CA-76; P-1, P-10, P-25, P-61.
- `docs/arquitectura.md`: §2 (aislamiento, datos que cruzan comunidades, búsqueda por RUT, regla 404/403), §3 (roles, quién otorga cada rol, revocación, usuarios de plataforma), §4 (modelo de datos, participación y prorrateo, ocupaciones, visibilidad por ámbito) y §5 (auditoría y datos personales).
- ADR 0002 (aislamiento), ADR 0003 (contratos, idempotencia y orden de errores), ADR 0004 (libro, periodos, foto de participaciones), ADR 0005 (identidad por RUT, auditoría, RUT), ADR 0006 (usuarios de plataforma), ADR 0008 (tareas en segundo plano, `NOTIFICATION_DELIVERY`), ADR 0009 (guard global; D37 sobre el ingreso en la rebanada 1; D39 sobre recursos de ruta).
- `docs/design/`: `flujos/admin-alta-comunidad.md`, `flujos/admin-usuarios-y-roles.md`, `flujos/admin-ocupaciones.md`, `flujos/residente-primer-ingreso.md`, `arquitectura-de-informacion.md`, `mapa-de-usuarios.md` (UX-8, UX-15, UX-16, UX-30, UX-35, UX-40), `wireframes/web-alta-comunidad.md` y `wireframes/consola-plataforma.md` (CON-11).
- `docs/qa/comunidades-simuladas.md`: Comunidades A a D, personas y ocupaciones de prueba, GOLD-A, GOLD-C, GOLD-CE y GOLD-A33.
- **Ley 21.442** (texto oficial en LeyChile, BCN): <https://www.bcn.cl/leychile/navegar?idNorma=1174663>. Numeración por verificar en GC P-1.
- **MINVU, "Herramientas para la administración"** (registro de copropietarios y ocupantes, el administrador no integra el comité, el presidente del comité ejerce sin administrador): <https://www.minvu.gob.cl/wp-content/uploads/2024/04/herramientas-administracion.pdf>.
- **MINVU, "Acuerdos y resolución de conflictos"** (asambleas extraordinarias y quórum para modificar el reglamento): <https://www.minvu.gob.cl/wp-content/uploads/2024/04/acuerdos-y-resolucion-de-conflictos.pdf>.
- **MINVU, Registro Nacional de Administradores:** <https://www.minvu.gob.cl/wp-content/uploads/2024/04/registro-de-administradores.pdf>.
- **Reglamento DS N° 7 de 2025 (MINVU):** <https://www.diarioconstitucional.cl/2025/01/17/publican-reglamento-de-la-nueva-ley-de-copropiedad-inmobiliaria-que-cambios-trae-para-los-condominios/>.
- **Ley 21.442, art. 21 (quién integra el comité):** solo se encontraron fuentes secundarias no verificadas; se cita sin URL y se verifica contra BCN en GC P-1 y P-CM-10.
- `CLAUDE.md`: reglas 1, 3, 4, 5, 6, 7 y 8.
