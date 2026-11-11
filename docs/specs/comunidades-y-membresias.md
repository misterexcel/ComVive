# Especificación: Comunidades, unidades y membresías

Estado: Para revisión del líder del proyecto (rev. 3, 2026-11-11; incorpora la primera y la segunda pasada de la revisión crítica `docs/revisiones/2026-11-11-spec-comunidades-y-membresias.md` y las decisiones del líder D47 a D58; pendiente de la tercera pasada del revisor crítico)
Responsable: analista-producto
Aprobación: líder del proyecto

> **Rebanada 1 de la Etapa 2.** Cubre las tarjetas F1 (alta de comunidad y unidades, con alícuotas), F2 (usuarios y roles, sin conserjería: D50), F3 (ocupaciones; término de arriendo y venta detrás de un feature flag apagado: D51) y, solo en lo que la rebanada necesita, F4 (primer ingreso por invitación). F4 se deja para una rebanada propia junto con el ingreso de ADR 0005 (ver "Alcance" y regla CM-F1).
>
> **Nombre del archivo.** La plantilla pide una spec por módulo. El módulo es "Comunidades y membresías": la comunidad, sus unidades con alícuotas, las personas con su ficha en cada comunidad y sus membresías por rol. Las ocupaciones son parte del módulo porque crean y terminan las membresías de residente, pero sus reglas de dinero y de ámbito ya están en `docs/specs/gasto-comun.md` (rev. 9, aprobada) y aquí solo se citan y se completan.
>
> **Relación con la spec de gasto común.** Esta spec **no duplica** reglas aprobadas. Donde una regla ya existe, se cita por su sección o su id ("GC" = `docs/specs/gasto-comun.md`; por ejemplo, GC F-14 o GC S-34). Solo se agrega lo que falta. Los vacíos, las contradicciones y los cambios que esta spec pide a documentos aprobados están en "Contradicciones y vacíos en documentos aprobados".
>
> **Identificadores propios (prefijo `CM`)**, para no chocar con los de gasto común (S-1 a S-87, P-1 a P-62, CA-1 a CA-77): reglas `CM-A1`, `CM-B1`, etc.; criterios de aceptación `CA-CM-n`; supuestos `S-CM-n`; preguntas `P-CM-n`; excepciones de orden `E-CM-n`. Un id retirado en una revisión no se reutiliza. Los códigos de error nuevos no repiten ninguno existente salvo donde se dice "se reutiliza".
>
> **Cambios de la rev. 2.** La tabla "Resolución" del informe de revisión dice dónde quedó cada hallazgo. En resumen: contacto sin verificar por persona y comunidad, con ingreso habilitado solo por el contacto que la comunidad registró (C-1, D47); vista previa idéntica para un RUT de otra comunidad (M-3, D48); fuera de la rebanada las lecturas de Operaciones (M-2, D49) y la conserjería (D50); término y venta detrás de un flag apagado (M-7, D51); nombre del administrador obligatorio en la consola (M-9, D52); solo personas con RUT (D53); cada ruta con su `resource`, `pathResources` y un único `permission` (M-5); y un solo endpoint de lote para unidades.
>
> **Cambios de la rev. 3.** Resuelve la segunda pasada (sección "R2 · Resolución" del informe). En resumen: el celular o correo del administrador es siempre obligatorio y vive solo en la ficha de esa comunidad (R2-C-1, D54); cuatro requisitos más para la rebanada de ingreso en CM-F3 (R2-M-1, D55); feature flags por ambiente en la configuración de despliegue, con una prueba que impide encender en producción el de término y venta (R2-M-3, D56); la excepción E-CM-1 queda solo para revocar una membresía `admin`, y la ficha de un administrador responde 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` (R2-m-8, D57; P-CM-17 cerrada); las notas de GOLD-ACM7-05 van al borrador `2026-12` (R2-M-4, D58); ocho puntos nuevos en "Contradicciones y vacíos" (R2-M-2); y los menores R2-m-1 a R2-m-9.

## Objetivo

Que Operaciones ComVive dé de alta una comunidad con su primer administrador, y que ese administrador cargue las unidades con sus alícuotas, registre a propietarios y arrendatarios y otorgue el rol de comité, con datos personales mínimos, auditoría y aislamiento entre comunidades. Es la base de datos y de permisos sobre la que se emite el gasto común.

## Alcance de la rebanada 1

La rebanada 1 se entrega como base de datos, API y pruebas automáticas. Por la decisión del líder D37 (ADR 0009), el ingreso de ADR 0005 queda fuera y la rebanada se prueba con dobles del verificador de sesión; por eso puede llegar a "Validación", pero no a "Hecho", hasta que exista el ingreso. Las pantallas ya están diseñadas y aprobadas (`docs/design/`); esta spec dice qué entrega la API a cada rol.

| Tarjeta | Incluido en la rebanada 1 | Queda fuera (y dónde va) |
| --- | --- | --- |
| F1 · Alta de comunidad y unidades | Alta de comunidad con su primer administrador (GC "Validaciones de la consola de Operaciones ComVive", con el nombre del administrador obligatorio, D52); otorgar y revocar administradores por la consola; datos de la comunidad; alta, edición, lote y eliminación de unidades; validación de alícuotas y su cambio después de un periodo emitido | Las lecturas de la consola de Operaciones (lista de comunidades y administradores de una comunidad, CON-11): tarjeta de la consola de Operaciones, con la actualización de ADR 0002 y ADR 0006 (D49). Medios de pago y configuración de cobro (GC A-2, D-2, E-1): rebanada de emisión. Importación desde planilla (UX-16): tarjeta propia que reutiliza el lote (P-CM-3). Lista de puesta en marcha: con la web |
| F2 · Usuarios y roles | Lista de usuarios y roles con su historial; otorgar y revocar comité (GC "Otorgamiento de roles"); último administrador (GC D9); ficha de la persona en la comunidad y su corrección | Conserjería completa (otorgar, revocar, datos del conserje y lo que ve): spec de conserjería (D50) |
| F3 · Ocupaciones | Alta de arrendatario (vigente o programado), cancelación y propietario faltante; membresía de residente; término de arriendo y venta **implementados detrás del flag `occupancy.end_and_transfer`, apagado** (D51), con la tarea "Revisar rol de comité" (GC M-7) | Activar el flag: solo la rebanada del libro de movimientos, después de implementar con TDD el traspaso de GC F-9 y F-13 (D51, CM-E6) |
| F4 · Primer ingreso por invitación | Datos que la invitación necesita (RUT, nombre y contacto validados en la ficha) y el estado de ingreso de cada membresía | Crear, enviar, aceptar y vencer invitaciones, y la habilitación por contacto de D47: rebanada propia "Ingreso e invitaciones", con ADR 0005 (reglas CM-F1 y CM-F3) |

## Definiciones

Se usan las de GC "Definiciones" (ocupación, inicio y fin efectivos, estados programada, vigente, terminada y cancelada, ámbito, traspaso). Se agregan:

- **Comunidad configurada sin emisiones:** comunidad sin ningún periodo emitido ni cerrado. Mientras lo está, los cambios de unidades no exigen motivo (regla CM-B7).
- **Persona:** identidad global de ComVive, reconocida por su RUT (`PERSON`, `docs/arquitectura.md` §2). Guarda solo RUT, contactos de ingreso verificados y credenciales. Nunca guarda el nombre ni el contacto que registra una comunidad.
- **Ficha de la persona en la comunidad** (recurso `person-record`; nombre de tabla propuesto `COMMUNITY_PERSON`, lo fija el arquitecto, P-CM-18): una por cada par (persona, comunidad). Guarda el nombre y el contacto registrado (celular, correo o ambos) que esa comunidad usa para esa persona, en todos sus roles. Nace con la primera membresía de la persona en la comunidad y no se borra. Regla CM-C4.
- **Contacto registrado:** el celular o el correo de la ficha. No está verificado: lo escribió el administrador o Operaciones.
- **Contacto de ingreso verificado:** un contacto que la persona demostró controlar al ingresar un código enviado a él (rebanada "Ingreso e invitaciones"). Habilita solo las membresías de las comunidades cuya ficha registra ese mismo contacto (D47, CM-F3).
- **Membresía:** vínculo de una persona con una comunidad en un rol (`admin`, `committee` o `resident` en esta rebanada; `concierge` llega con la spec de conserjería, D50), con fecha de inicio (`valid_from`), fecha de término opcional (`valid_to`; nunca en `admin`, GC D24), quién la otorgó y por qué vía, y, si se revocó, cuándo, quién y por qué (`docs/arquitectura.md` §3 y §4). Nunca se borra.
- **Membresía vigente:** otorgada, no revocada, con `valid_from` cumplido y `valid_to` vacío o futuro, en hora de Chile (ADR 0009, decisión 3).
- **Estado de ingreso de una membresía:** "Pendiente" si la persona aún no hace su primer ingreso con esa membresía; "Activo" desde que lo hace (`first_access_at`, GC "Validaciones de la consola de Operaciones ComVive", D27; ADR-0008-S9). En la rebanada 1 nadie ingresa (D37), así que toda membresía está "Pendiente".
- **Alícuota:** porcentaje de participación de la unidad, guardado como `aliquot_e6` (GC "Definiciones"). Una alícuota de 0 % se muestra "Sin participación" (`docs/design/flujos/admin-alta-comunidad.md`, paso 4; GC CA-18).
- **Orden natural del código:** orden de los códigos de unidad que compara los tramos numéricos como números y el resto como texto, de modo que "Depto 9" va antes que "Depto 10" (GC C-4). Desempates en CM-B5 (S-CM-24).
- **Flag `occupancy.end_and_transfer`:** feature flag de término de arriendo y venta, apagado por defecto (D51, CM-E6).
- **Feature flag (D56):** interruptor por ambiente que vive en la configuración de despliegue. No se edita por API ni por comunidad, y encenderlo es un cambio de configuración aprobado por el líder del proyecto (regla CM-H1).

## Usuarios y permisos

| Rol | Puede ver | Puede hacer |
| --- | --- | --- |
| Administrador | Datos de la comunidad, todas las unidades con la suma de alícuotas, el registro de copropietarios completo (GC "Datos de copropietarios que ve el comité"), las ocupaciones con su historial, "Usuarios y roles" con el historial de roles, las fichas de las personas de su comunidad y las tareas del administrador | Editar los datos de la comunidad (salvo el RUT, regla CM-A3); crear, editar y eliminar unidades y sus alícuotas y su orden; registrar ocupaciones (GC F-14); otorgar y revocar comité (GC "Otorgamiento de roles"); corregir la ficha de una persona que no es administradora vigente (CM-C6); resolver la tarea "Revisar rol de comité" (GC M-7). **No** otorga ni revoca administradores (GC "Otorgamiento de roles") ni corrige la ficha de un administrador vigente (D57) |
| Comité | Datos de la comunidad, todas las unidades con su alícuota y la suma, el registro de copropietarios con datos limitados (GC S-33) y el historial de ocupaciones con el mismo filtro. Solo en la web (decisión del líder, GC "Usuarios y permisos") | Nada en este módulo: 403 en toda acción sobre lo que ve; 404 en "Usuarios y roles", en las fichas y en las tareas |
| Residente propietario | Datos de la comunidad y la ficha de unidad (código, tipo y alícuota) de sus unidades, sin la suma de alícuotas | Nada en este módulo |
| Residente arrendatario | Datos de la comunidad y la ficha de la unidad que arrienda, sin la suma de alícuotas | Nada en este módulo |
| Conserje | Fuera de la rebanada 1 (D50): no existen membresías `concierge` hasta la spec de conserjería | — |
| Operaciones ComVive | En esta rebanada, nada que se lea por una ruta propia: las lecturas de la consola van en su tarjeta (D49). Ningún dato de negocio (GC "Usuarios y permisos") | Crear comunidades con su primer administrador; otorgar y revocar administradores (GC "Validaciones de la consola de Operaciones ComVive", con el nombre obligatorio de D52 y el contacto obligatorio de D54) |
| Soporte ComVive | Nada de este módulo (GC EX-1) | Nada: las tres rutas de plataforma de este módulo le responden 404 en el paso 3a, porque son de `platform_operations` (ADR 0009, decisión 3; ADR 0006, decisión 1; CA-CM-1) |

- **Roles múltiples:** una persona puede tener varias membresías vigentes en la misma comunidad (por ejemplo, residente y comité, o administradora y propietaria). La visibilidad y los permisos son la unión de sus roles (ADR-0009-S4). Su nombre y su contacto son los de su única ficha en esa comunidad (CM-C4).
- **Administrador y comité a la vez:** no se permite (GC S-43). La ley respalda la regla: el administrador "no podrá integrar el Comité de Administración" (MINVU, "Herramientas para la administración", sobre la Ley 21.442; numeración en GC P-1).

### Qué recursos ve cada rol

Completa la matriz de GC "Qué recursos ve cada rol" (S-53) con los tipos de recurso de este módulo, que fija esta spec (ADR 0009, decisión 7, "Rebanada 1"). Si el rol no ve el recurso, toda lectura o acción responde 404; si lo ve pero no tiene el permiso, 403 (GC "Respuestas de error"; ADR 0009, decisión 3). "Suya" es una unidad donde la persona tiene una ocupación vigente (`docs/arquitectura.md` §4, "Visibilidad por ámbito"). La columna del conserje la agrega la spec de conserjería (D50).

| Recurso (tipo para `@CommunityRoute`) | Administrador | Comité | Propietario | Arrendatario |
| --- | --- | --- | --- | --- |
| Datos de la comunidad (`community`) | Ve y edita | Ve (403 al editar) | Ve (403 al editar) | Ve (403 al editar) |
| Ficha de una unidad (`unit`): código, tipo, alícuota | Ve todas | Ve todas | Ve las suyas | Ve la suya |
| Configuración de unidades (`unit-config`): alta, edición, lote, eliminación y orden | Ve y actúa | Ve (403 al actuar) | No ve | No ve |
| Registro de copropietarios (`owner-roster`; permiso y campos en GC "Datos de copropietarios que ve el comité") | Ve | Ve, filtrado (GC S-33) | No ve | No ve |
| Ocupaciones de la comunidad (`occupancy`), de cualquier estado | Ve y actúa (`occupancy.write`) | Ve el historial con el filtro de GC S-33 (403 al actuar) | No ve | No ve |
| Membresías y su historial (`membership`, "Usuarios y roles"), incluidas las revocadas | Ve todas, incluidas las de administrador | No ve | No ve | No ve |
| Otorgamiento de roles (`role-grant`) | Actúa. **No tiene lectura**: ninguna ruta `GET` usa este recurso | "Ve" (403 al otorgar; GC CA-43). Tampoco tiene lectura | No ve | No ve |
| Fichas de las personas de la comunidad (`person-record`), también de ex residentes | Ve y corrige (422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` en la ficha de un administrador vigente, CM-C6, D57) | No ve | No ve | No ve |
| Tareas del administrador (`admin-task`; reglas en GC M-7) | Ve y resuelve | No ve | No ve | No ve |

- **Por qué `role-grant` es un recurso aparte:** GC CA-43 exige que el comité reciba 403 (no 404) al pedir otorgar el rol de comité, porque ve el registro de copropietarios; pero el comité no ve "Usuarios y roles" (404, `docs/design/flujos/admin-usuarios-y-roles.md`). Con un solo recurso no se cumplen las dos cosas. Es una construcción formal: `role-grant` existe solo para la acción de otorgar.
- **Por qué `unit-config` es un recurso aparte de `unit`:** el residente ve la ficha de su unidad, pero no la configuración de unidades. Así, un residente que pide crear o editar una unidad recibe 404 y no 403, igual que con la configuración de cobro (GC S-53).
- **El orden (`sort_order`) pasa a `unit-config` con `unit.write`** (menor 2 de la revisión): hoy GC S-53 lo pone en "Configuración de cobro" (`community.billing.configure`). Los dos permisos son solo del administrador, así que nadie gana ni pierde acceso, y cada ruta queda con un único permiso (ADR 0009). Cambio a GC que registra el coordinador ("Contradicciones y vacíos", punto 13).

### Acciones de la rebanada

Contrato funcional: qué acción existe, con qué política de ADR 0009 y quién la ejecuta. Para cada ruta, esta spec fija el tipo de recurso (`resource`), los recursos de la ruta (`pathResources`) y **un único** permiso (`permission`), como pide ADR 0009, decisión 7. Las rutas existentes son las de `docs/arquitectura.md` §3 y §4; las nuevas son propuesta del analista y el contrato técnico lo fija el arquitecto (ADR 0003). Los permisos nuevos (`platform.community.create`, `community.profile.write`, `unit.write` y `person_record.write`) se agregan a la tabla de permisos de ADR 0003, decisión 3 y a la lista de permisos de `docs/arquitectura.md` §3 (P-CM-14). "R" es residente (propietario o arrendatario); "Op" es Operaciones ComVive (`platform_operations`); Soporte ComVive (`platform_support`) recibe 404 en las tres rutas de plataforma (paso 3a); "…" abrevia `/communities/{communityId}`.

| Acción | Ruta | `resource` | `pathResources` | `permission` | Admin | Comité | R | Op |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crear comunidad con su primer administrador | `POST /platform/communities` (existente) | Política `platform` | — | `platform.community.create` (nuevo) | 404 | 404 | 404 | Sí |
| Otorgar administrador | `POST /platform/communities/{communityId}/admin-memberships` (existente) | Política `platform` | — (el paso 3b de `platform` verifica `communityId`) | `platform.admin_role.grant` | 404 | 404 | 404 | Sí |
| Revocar administrador | `POST /platform/communities/{communityId}/admin-memberships/{membershipId}/revoke` (existente) | Política `platform` | `{ membershipId: 'admin-membership' }` | `platform.admin_role.grant` | 404 | 404 | 404 | Sí |
| Ver datos de la comunidad | `GET …` (nueva) | `community` | — | — (lectura) | Sí | Sí | Sí | 404 |
| Editar datos de la comunidad | `PATCH …` (nueva) | `community` | — | `community.profile.write` (nuevo) | Sí | 403 | 403 | 404 |
| Listar unidades | `GET …/units` (nueva) | `unit` | — | — (lectura; filtro por fila para el residente) | Todas | Todas | Las suyas | 404 |
| Ver una unidad | `GET …/units/{unitId}` (nueva) | `unit` | `{ unitId: 'unit' }` | — (lectura) | Sí | Sí | La suya; ajena 404 | 404 |
| Crear una unidad | `POST …/units` (nueva) | `unit-config` | — | `unit.write` (nuevo) | Sí | 403 | 404 | 404 |
| Crear y editar unidades en lote, todo o nada | `POST …/units/batch` (nueva) | `unit-config` | — (los `unitId` del cuerpo se verifican en el paso 4, CM-B6) | `unit.write` | Sí | 403 | 404 | 404 |
| Editar una unidad | `PATCH …/units/{unitId}` (nueva) | `unit-config` | `{ unitId: 'unit' }` | `unit.write` | Sí | 403 | 404 | 404 |
| Eliminar una unidad | `DELETE …/units/{unitId}` (nueva) | `unit-config` | `{ unitId: 'unit' }` | `unit.write` | Sí | 403 | 404 | 404 |
| Registro de copropietarios | `GET …/owner-roster` (GC) | `owner-roster` | — | `owner_roster.read` | Completo | Filtrado (GC S-33) | 404 | 404 |
| Historial de ocupaciones de una unidad | `GET …/units/{unitId}/occupancies` (existente) | `occupancy` | `{ unitId: 'unit' }` | `owner_roster.read` (`docs/arquitectura.md` §4) | Sí | Filtrado (GC S-33) | 404 | 404 |
| Alta de arrendatario: vista previa y ejecución | `POST …/units/{unitId}/occupancies/preview` y `POST …/units/{unitId}/occupancies` (existentes) | `occupancy` | `{ unitId: 'unit' }` | `occupancy.write` | Sí | 403 | 404 | 404 |
| Venta o propietario faltante: vista previa y ejecución | `POST …/units/{unitId}/ownership-transfers/preview` y `POST …/units/{unitId}/ownership-transfers` (existentes) | `occupancy` | `{ unitId: 'unit' }` | `occupancy.write` | Sí (la venta, solo con el flag, CM-E6) | 403 | 404 | 404 |
| Término de arriendo: vista previa y ejecución | `POST …/occupancies/{occupancyId}/end-preview` y `POST …/occupancies/{occupancyId}/end` (existentes) | `occupancy` | `{ occupancyId: 'occupancy' }` | `occupancy.write` | Solo con el flag (CM-E6) | 403 | 404 | 404 |
| Cancelación de un arriendo programado | `POST …/occupancies/{occupancyId}/cancel` (existente) | `occupancy` | `{ occupancyId: 'occupancy' }` | `occupancy.write` | Sí | 403 | 404 | 404 |
| "Usuarios y roles" e historial de roles | `GET …/memberships` (nueva; incluye revocadas con un filtro) | `membership` | — | — (lectura) | Sí | 404 | 404 | 404 |
| Otorgar comité | `POST …/memberships` (existente) | `role-grant` | — (el `personRecordId` del cuerpo se verifica en el paso 4, CM-D2) | `committee_role.grant` | Sí | 403 | 404 | 404 |
| Revocar comité | `POST …/memberships/{membershipId}/revoke` (existente) | `membership` | `{ membershipId: 'membership' }` | `committee_role.grant` | Sí | 404 | 404 | 404 |
| Corregir nombre y contacto de una ficha | `PATCH …/person-records/{personRecordId}` (nueva) | `person-record` | `{ personRecordId: 'person-record' }` | `person_record.write` (nuevo) | Sí | 404 | 404 | 404 |
| Listar tareas del administrador | `GET …/admin-tasks` (existente) | `admin-task` | — | — (lectura) | Sí | 404 | 404 | 404 |
| Resolver una tarea | `POST …/admin-tasks/{taskId}/resolve` (existente) | `admin-task` | `{ taskId: 'admin-task' }` | `committee_role.grant` | Sí | 404 | 404 | 404 |

- **Visibilidad de cada recurso de ruta** (puerto `PathResourceVisibility`, ADR 0009, decisión 3): `unit`, toda unidad de la comunidad para el administrador y el comité, y solo las suyas para el residente; `occupancy`, toda ocupación de la comunidad, de cualquier estado, para el administrador y el comité; `membership`, toda membresía de la comunidad, también revocada, para el administrador (así la revocación de una ya revocada llega al servicio y responde 409 `ROLE_ALREADY_REVOKED`); `person-record`, toda ficha de la comunidad para el administrador; `admin-task`, toda tarea de la comunidad, abierta o cerrada, para el administrador. Fuera de eso, 404 en el paso 3b. Todos los ids son uuid canónicos.
- **Idempotencia:** toda escritura de este módulo lleva clave de idempotencia (`Idempotency-Key`). Solo se guardan las respuestas exitosas y todo rechazo se reevalúa (GC A-3.4, D12). GC S-36 y ADR 0003, decisión 6 la exigen en las escrituras que mueven dinero o el responsable de una deuda; **extenderla a toda escritura del módulo es una decisión nueva de esta spec** (Supuesto (a validar), S-CM-23; P-CM-14), para que un reintento por red nunca cree dos unidades o dos membresías.
- Una sesión de plataforma en una ruta `/communities/...` y una sesión de comunidad en una ruta `/platform/...` responden 404 (GC "Respuestas de error").
- "Mis comunidades" (`/me/`, política `identity`) no es de esta rebanada: llega con el ingreso (ADR-0009-S5).
- **Fuera de la rebanada (D49):** `GET /platform/communities` y `GET /platform/communities/{communityId}/admin-memberships`. Son lecturas transversales que ADR 0002 (decisión 3) y ADR 0006 (decisión 5) no autorizan; van a la tarjeta de la consola de Operaciones con una vista propia ("Contradicciones y vacíos", punto 6).

### Excepción de orden por el recurso de la ruta (E-CM-1, D57)

Una sola acción tiene un **403** que depende de **qué** recurso nombra la ruta, no solo de si se ve: revocar una membresía `admin` por la ruta de membresías de la comunidad (`docs/arquitectura.md` §3). El guard de ADR 0009 verifica en el paso 3c un permiso estático por ruta y no conoce la instancia. Las demás respuestas que dependen de la instancia no son 403 y van en el paso 6, como cualquier regla de negocio: revocar una membresía `resident` (422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`, CM-D4; R2-m-1) y corregir la ficha de un administrador vigente (422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`, CM-C6; R2-m-8).

**Decisión del líder D57: opción (b), limitada a esa revocación.** El 403 de revocar una membresía `admin` lo evalúa el servicio en el **paso 4** (404/403 que dependen de un dato, justo después de la forma y antes de la idempotencia; GC "Respuestas de error"), igual que el 403 de `role = admin` al otorgar. No revela nada: el administrador ya pasó el paso 3b y ve esa membresía; solo cambia que un JSON mal formado responde 400 antes que el 403 (CA-CM-16). Se descartó (a), un verificador de permiso por instancia en el guard; conviene reconsiderarla si otras rebanadas traen más rutas con un 403 según la instancia.

**Lo que exige en documentos aprobados** ("Contradicciones y vacíos", punto 15): el arquitecto enmienda ADR 0009, decisión 2, "Lo que sigue en el servicio", con una **lista cerrada** de verificaciones 403 por la instancia de la ruta, cada una citada a la spec que la define (hoy solo esta), que se evalúan después de la forma y antes de la idempotencia; y alinea `docs/arquitectura.md` §3 para que diga que el 403 de revocar una membresía `admin` sale en el paso 4.

### Códigos y mensajes de error nuevos

Se suman a la tabla de GC "Códigos y mensajes de error", con su misma convención: 409 para un conflicto con el estado actual, 422 para una entrada que una regla no permite, y 400 `BAD_REQUEST` para un campo sin código propio con tipo o formato inválido (GC S-70). Los textos son propuesta del analista, salvo los que vienen del diseño aprobado, que se indican (Supuesto (a validar), S-CM-1).

| Caso | Regla | HTTP | Código | Mensaje |
| --- | --- | --- | --- | --- |
| Datos de la comunidad con nombre vacío (se reutiliza) | CM-A3 | 422 | `COMMUNITY_NAME_REQUIRED` | "Ingresa el nombre de la comunidad" |
| Datos de la comunidad con la dirección o la comuna vacías o nulas | CM-A3 | 422 | `COMMUNITY_ADDRESS_REQUIRED` | "Ingresa la dirección y la comuna de la comunidad" |
| Datos de la comunidad con el tipo nulo o vacío | CM-A3 | 422 | `COMMUNITY_TYPE_REQUIRED` | "Elige el tipo de comunidad: edificio o condominio" |
| Unidad sin código, o con un código vacío o de solo espacios | CM-B2 | 422 | `UNIT_CODE_REQUIRED` | "Ingresa el código de la unidad" |
| Código de unidad que ya existe en la comunidad (texto del diseño) | CM-B2 | 409 | `UNIT_CODE_ALREADY_EXISTS` | "El código {código} ya existe en esta comunidad" |
| Código repetido entre dos filas del mismo lote (solo dentro de `UNITS_INVALID`) | CM-B6 | — | `UNIT_CODE_ALREADY_EXISTS` | "El código {código} está repetido en la fila {n}" |
| Alícuota ausente, no numérica, negativa o sobre 1.000.000 (texto del diseño) | CM-B3 | 422 | `INVALID_ALIQUOT` | "La alícuota debe estar entre 0 % y 100 %" |
| Alícuota con más de 4 decimales de porcentaje, es decir, `aliquotE6` no entero (texto del diseño) | CM-B3 | 422 | `INVALID_ALIQUOT` | "La alícuota admite hasta 4 decimales" |
| Orden no entero, menor que 1 o mayor que 999.999 | CM-B5 | 422 | `INVALID_SORT_ORDER` | "El orden debe ser un número entero entre 1 y 999.999" |
| Orden que ya usa otra unidad (texto del diseño) | CM-B5 | 409 | `SORT_ORDER_ALREADY_USED` | "El orden {n} ya lo usa {código}" |
| Orden repetido entre dos filas del mismo lote (solo dentro de `UNITS_INVALID`) | CM-B6 | — | `SORT_ORDER_ALREADY_USED` | "El orden {n} está repetido en la fila {m}" |
| Cambio de unidades sin motivo en una comunidad con algún periodo emitido (se reutiliza `REASON_REQUIRED`) | CM-B7 | 422 | `REASON_REQUIRED` | "Indica el motivo del cambio y el documento que lo respalda" |
| Eliminación de una unidad sin motivo en una comunidad con algún periodo emitido | CM-B8 | 422 | `REASON_REQUIRED` | "Indica el motivo de la eliminación" |
| Eliminar una unidad que alguna fila de negocio referencia | CM-B8 | 409 | `UNIT_IN_USE` | "Esta unidad ya tiene ocupantes, movimientos, gastos o periodos emitidos. No se puede eliminar" |
| Lote con una o más filas inválidas | CM-B6 | 422 | `UNITS_INVALID` | "No se guardó nada. Corrige las filas marcadas e intenta de nuevo" (con la lista de filas, ver CM-B6) |
| Lote con más de 500 filas | CM-B6 | 422 | `UNITS_BATCH_TOO_LARGE` | "Puedes guardar hasta 500 unidades por vez. Divide la carga en partes" |
| Persona sin nombre, o con un nombre vacío o de solo espacios, en una ocupación o una corrección de ficha | CM-C2 | 422 | `PERSON_NAME_REQUIRED` | "Ingresa el nombre de la persona" |
| Alta de comunidad u otorgamiento de administrador sin el nombre del administrador (D52) | CM-A2 | 422 | `PERSON_NAME_REQUIRED` | "Ingresa el nombre del administrador" |
| Alta de comunidad u otorgamiento de administrador sin celular ni correo, o con uno de formato inválido, también si la persona ya existe en ComVive (D54; se reutiliza con el texto de GC) | CM-A2 | 422 | `INVALID_CONTACT` | "Ingresa un celular o un correo válido del administrador" |
| Celular o correo con formato inválido en una ocupación o una corrección de ficha (se reutiliza `INVALID_CONTACT` con otro texto) | CM-C3 | 422 | `INVALID_CONTACT` | "Ingresa un celular o un correo válido" |
| Corregir la ficha de una persona con membresía `admin` vigente en la comunidad (D57) | CM-C6 | 422 | `ADMIN_RECORD_MANAGED_BY_COMVIVE` | "Los datos de un administrador los corrige ComVive" |
| Registrar como arrendatario a quien es propietario vigente de esa unidad | CM-E2 | 422 | `OWNER_CANNOT_BE_TENANT` | "Esta persona es propietaria de la unidad. No puede ser también su arrendataria" |
| Registrar la venta a quien es el arrendatario vigente o programado de la unidad | CM-E3 | 409 | `BUYER_IS_CURRENT_TENANT` | "Esta persona es la arrendataria vigente o programada de la unidad. Registra primero el término o la cancelación de su arriendo" |
| Terminar un arriendo programado (se reutiliza `OCCUPANCY_NOT_STARTED` con otro texto) | CM-E4 | 409 | `OCCUPANCY_NOT_STARTED` | "Este arriendo aún no comienza. Si no comenzará, cancélalo" |
| Terminar un arriendo cancelado (se reutiliza) | CM-E4 | 409 | `OCCUPANCY_CANCELLED` | "Este arriendo ya fue cancelado" |
| Término de arriendo o venta con el flag `occupancy.end_and_transfer` apagado | CM-E6 | 422 | `OCCUPANCY_ACTION_NOT_AVAILABLE` | "El registro de términos de arriendo y de ventas aún no está disponible. Mientras tanto, pide ayuda a ComVive" |
| Otorgar o revocar por la ruta de membresías el rol de residente | CM-D5 | 422 | `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` | "El rol de residente nace y termina con la ocupación. Registra el arriendo, su término o la venta en la unidad" |
| Revocar comité sin motivo (se reutiliza `REASON_REQUIRED`, mismo texto que la revocación de administrador) | CM-D4 | 422 | `REASON_REQUIRED` | "Indica el motivo de la revocación" |
| Revocar comité ya revocado, con otra clave (se reutiliza) | CM-D4 | 409 | `ROLE_ALREADY_REVOKED` | "Este rol ya fue revocado" |

- **Largos máximos (menor 6):** el contrato OpenAPI declara `maxLength` y la interfaz no permite escribir más: nombre de la comunidad y de la persona, 120 caracteres; dirección, 200; comuna, 60; código de unidad, 30; correo, 254; motivo, 500. Como las pantallas no pueden producirlo, un texto más largo responde 400 `BAD_REQUEST`, igual que cualquier campo sin código propio (GC S-70).
- **Esquema de error nuevo:** `UNITS_INVALID` es la única respuesta del módulo con una lista (`rows`). Su esquema se agrega al contrato OpenAPI (ADR 0003, decisión 1) y lo define el arquitecto (CM-B6).

### Orden de validación por acción

Se aplica el orden fijo de GC "Respuestas de error" (S-77; ADR 0003, decisión 9; ADR 0009, decisión 3): 1 sesión (401), 2 membresía, visibilidad, recursos de la ruta y permiso (404/403), 3 forma (400), 4 los 404/403 que dependen de un dato del cuerpo o, por E-CM-1, del recurso de la ruta, 5 idempotencia y 6 reglas de negocio. En el paso 6 se responde solo la primera regla que falle, en el orden de abajo. Criterio, igual que GC S-34, S-63 y CA-61: primero los datos del formulario y al final los conflictos con el estado, salvo donde no tiene sentido pedir un dato de una acción que no se puede hacer (Supuesto (a validar), S-CM-2).

- **Alta de comunidad (D52 y D54, extienden GC S-63):** `COMMUNITY_NAME_REQUIRED` → `INVALID_RUT` (comunidad) → `INVALID_RUT` (administrador) → `PERSON_NAME_REQUIRED` ("Ingresa el nombre del administrador") → `INVALID_CONTACT` (siempre, D54) → `ADMIN_END_DATE_NOT_ALLOWED` → `REASON_REQUIRED` → 409 `COMMUNITY_ALREADY_EXISTS`.
- **Otorgar administrador (D52 y D54, extienden GC S-63):** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` (siempre, tenga o no la persona cuenta en ComVive, D54) → `ADMIN_END_DATE_NOT_ALLOWED` → `REASON_REQUIRED` → 422 `ADMIN_COMMITTEE_CONFLICT` → 409 `ALREADY_ADMIN`.
- **Editar datos de la comunidad:** `COMMUNITY_NAME_REQUIRED` → `COMMUNITY_ADDRESS_REQUIRED` → `COMMUNITY_TYPE_REQUIRED`. Un tipo fuera de la lista o un campo `rut` en el cuerpo responden 400 en el paso de forma.
- **Crear o editar una unidad:** `UNIT_CODE_REQUIRED` → `INVALID_ALIQUOT` → `INVALID_SORT_ORDER` → `REASON_REQUIRED` (solo con algún periodo emitido, y solo si es un alta o si cambia la alícuota o el orden, CM-B7) → 409 `UNIT_CODE_ALREADY_EXISTS` → 409 `SORT_ORDER_ALREADY_USED`. Un tipo de unidad fuera de la lista responde 400 en el paso de forma.
- **Lote de unidades:** paso 3, forma, incluido un `unitId` repetido en el lote (400); paso 4, todo `unitId` que la persona no ve (404); paso 6: `UNITS_BATCH_TOO_LARGE` → `UNITS_INVALID` (cada fila con el orden de la unidad suelta, sin el motivo, y los conflictos de código y de orden contra el estado final del lote) → `REASON_REQUIRED` (solo con algún periodo emitido, y solo si alguna fila es un alta o cambia una alícuota o un orden, CM-B6). La diferencia con la unidad suelta, donde el motivo va antes de los 409, es intencional: en el lote los conflictos son errores de fila que se corrigen junto con los demás, y el motivo, que es uno para todo el lote, se pide cuando las filas ya son válidas (CM-B6).
- **Eliminar una unidad:** 409 `UNIT_IN_USE` → `REASON_REQUIRED`. El estado va antes que el motivo, como la cancelación de un arriendo (GC CA-61).
- **Alta de arrendatario (vista previa y ejecución):** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` → `OWNER_CANNOT_BE_TENANT` → 409 `TENANT_ALREADY_ACTIVE` → `PREVIEW_OUTDATED` (solo en la ejecución). La fecha de ingreso ausente o mal formada responde 400.
- **Propietario faltante (vista previa y ejecución):** `INVALID_RUT` → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT` → `END_DATE_IN_FUTURE` → 409 `ALREADY_OWNER` → 409 `BUYER_IS_CURRENT_TENANT` → `PREVIEW_OUTDATED` (solo en la ejecución).
- **Venta (unidad con propietario vigente; vista previa y ejecución):** `OCCUPANCY_ACTION_NOT_AVAILABLE` (solo con el flag apagado) → el mismo orden del propietario faltante.
- **Término de arriendo (vista previa y ejecución):** `OCCUPANCY_ACTION_NOT_AVAILABLE` (solo con el flag apagado) → `USE_OWNERSHIP_TRANSFER` → estado de la ocupación (409 `OCCUPANCY_NOT_STARTED`, `OCCUPANCY_CANCELLED` u `OCCUPANCY_ALREADY_ENDED`) → `END_DATE_IN_FUTURE` → `END_BEFORE_START` → `PREVIEW_OUTDATED` (solo en la ejecución). Como en la cancelación (GC CA-61), no se valida la fecha de una acción que no se puede hacer, y con el flag apagado no se valida nada más.
- **Otorgar por la ruta de membresías:** paso 3: un rol fuera de la lista del contrato de esta rebanada (`admin`, `committee`, `resident`; `concierge` se agrega con la spec de conserjería, D50) o un campo `validFrom` o `validTo` responden 400. Paso 4, en este orden (visibilidad antes que permiso, como el guard; R2-m-2): primero, un `personRecordId` que el administrador no ve responde 404; después, `role = admin` responde 403 (GC "Respuestas de error"). Paso 6: `role = resident` responde 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`; `role = committee` sigue el orden de GC S-34 sin cambios (`ASSEMBLY_REFERENCE_REQUIRED` → `COMMITTEE_REQUIRES_OWNER` → `ADMIN_COMMITTEE_CONFLICT` → `ALREADY_COMMITTEE_MEMBER`).
- **Revocar por la ruta de membresías:** paso 4 (E-CM-1, D57): membresía `admin`, 403. Paso 6: membresía `resident`, 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` → `REASON_REQUIRED` → 409 `ROLE_ALREADY_REVOKED`, como la revocación de administrador (GC S-68). El 422 de residente va en el paso 6, después de la idempotencia: con una clave que antes tuvo éxito con otro cuerpo, responde 422 `IDEMPOTENCY_KEY_REUSED` antes que ese 422 (R2-m-1; ADR 0003, decisión 9, paso 4).
- **Corregir una ficha (D57):** paso 6: `ADMIN_RECORD_MANAGED_BY_COMVIVE` (ficha de una persona con membresía `admin` vigente en la comunidad) → `PERSON_NAME_REQUIRED` → `INVALID_CONTACT`. La ficha de un administrador va primero porque no tiene sentido validar datos de una corrección que no se puede hacer (S-CM-2). Un campo `rut` en el cuerpo responde 400.

## Reglas de negocio

### A. Comunidad

1. **CM-A1 · Alta solo por Operaciones ComVive.** El alta de una comunidad con su primer administrador, sus validaciones, su orden de errores, el último administrador y la alerta por falta de primer ingreso están especificados en GC "Validaciones de la consola de Operaciones ComVive" (S-63, S-68, S-72, S-79, S-85, S-86; D9, D10, D12, D24, D27) y GC CA-43, CA-69, CA-75 y CA-76. Esta spec solo agrega el nombre obligatorio del administrador (D52, CM-A2), su contacto siempre obligatorio (D54, CM-A2) y la alerta con flag (CM-A5). Un administrador no crea comunidades (decisión del líder, 2026-11-07).
2. **CM-A2 · Qué crea el alta y el nombre del administrador (D52).**
   - En una sola transacción: la comunidad (nombre y RUT); la persona del primer administrador si su RUT no existe en ComVive; su ficha en la comunidad con el nombre y el contacto que ingresó Operaciones; y su membresía `admin` con `granted_via = platform`. No crea unidades, periodos ni configuración de cobro: el primer borrador nace con la configuración de cobro (GC A-2), fuera de esta rebanada. Una comunidad recién creada no tiene unidades: su emisión respondería 422 `COMMUNITY_WITHOUT_UNITS` (GC A-3.8).
   - **Nombre del administrador:** Operaciones lo ingresa, obligatorio, en el alta de la comunidad y en cada otorgamiento del rol `admin`. Sin nombre, vacío o de solo espacios: 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre del administrador", después de `INVALID_RUT` del administrador y antes de `INVALID_CONTACT` ("Orden de validación por acción"). Es el nombre que el aviso de cobro muestra como administrador y como firma (GC G-2 y G-3; Ley 21.442, art. 32, mérito ejecutivo). **Extiende GC S-63**: el coordinador registra el cambio en la spec de gasto común. Debe estar implementado antes de que la rebanada de emisión pase a "Lista para desarrollo" (D52); como el alta y el otorgamiento están en esta rebanada, se implementa aquí.
   - **Contacto del administrador (D54; R2-C-1):** Operaciones ingresa el celular o el correo del administrador, **siempre obligatorio**, en el alta de la comunidad y en cada otorgamiento del rol `admin`, aunque la persona ya exista en ComVive, administre otra comunidad o tenga un contacto verificado. Se guarda solo en la ficha de esa comunidad: **nunca** se usa ni se copia el contacto de `PERSON` (verificado o no) ni el de la ficha de otra comunidad. Sin contacto o con uno de formato inválido: 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido del administrador" (texto de GC), sin condición, después de `PERSON_NAME_REQUIRED` ("Orden de validación por acción"). Así, un contacto que una comunidad registró o verificó nunca abre otra (D47; CM-F3), y el formulario de Operaciones es el mismo para un RUT nuevo y uno existente, sin revelar si la persona ya está en ComVive. **Extiende GC S-63** (quita "si la persona ya tiene cuenta en ComVive … se usa su contacto verificado y no se pide de nuevo" y la condición "solo si la persona no tiene cuenta" del orden de errores): lo registra el coordinador; CON-11 lo alinea el diseñador ("Contradicciones y vacíos", punto 17).
   - **Ficha que ya existe:** si la persona ya tiene ficha en esa comunidad (por ejemplo, es propietaria), el nombre y el contacto que ingresa Operaciones al otorgar `admin` **reemplazan** los de la ficha, y la auditoría guarda los anteriores enmascarados. La respuesta a Operaciones no dice si la ficha existía ni qué decía (Operaciones no ve datos de negocio). Así el nombre del administrador siempre es el que fijó Operaciones (Supuesto (a validar), S-CM-22).
   - **Efecto del reemplazo en sus roles de residente (R2-m-9):** como la ficha es una por comunidad (CM-C4), el contacto que ingresa Operaciones pasa a ser también el de sus notificaciones como propietaria o arrendataria en esa comunidad, y, con la rebanada de ingreso, deshabilita esa comunidad para las sesiones obtenidas con el contacto anterior (CM-F3, requisito D55-2). Mientras la persona sea administradora vigente, nadie de la comunidad puede corregir ese contacto (422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`, CM-C6). Por eso P-CM-16 (cómo se corrigen los datos de un administrador) debe resolverse antes de que la rebanada "Ingreso e invitaciones" pase a "Lista para desarrollo".
3. **CM-A3 · Datos de la comunidad que edita el administrador** (`community.profile.write`):
   - Nombre, dirección, comuna y tipo (`edificio` o `condominio`). Después del alta, la dirección, la comuna y el tipo están vacíos.
   - **Semántica del `PATCH` (menor 5):** cambia solo los campos presentes en el cuerpo; un campo ausente no cambia. "Obligatorio" significa que no se puede vaciar: un nombre vacío responde 422 `COMMUNITY_NAME_REQUIRED`; una dirección o una comuna vacías o nulas, 422 `COMMUNITY_ADDRESS_REQUIRED`; un tipo nulo o vacío, 422 `COMMUNITY_TYPE_REQUIRED`; un tipo fuera de la lista, 400. Que la dirección, la comuna y el tipo estén completos lo exigirá la rebanada de emisión si el aviso los necesita (GC G-2), no esta.
   - El RUT de la comunidad lo fija Operaciones en el alta y el administrador **no** lo edita, porque es la clave de unicidad de la comunidad (GC S-63, `COMMUNITY_ALREADY_EXISTS`): un campo `rut` en el cuerpo responde 400. Si está mal, lo corrige Operaciones por un procedimiento auditado (Supuesto (a validar), S-CM-3; P-CM-5). Los medios de pago del aviso (GC G-2) se configuran con la rebanada de emisión.
4. **CM-A4 · Lecturas de Operaciones: fuera de la rebanada (D49).** La lista de comunidades y la de administradores de una comunidad (CON-11) van a la tarjeta de la consola de Operaciones, con una vista propia autorizada por una actualización de ADR 0002 (decisión 3) y ADR 0006 (decisión 5). En esta rebanada Operaciones solo escribe (alta, otorgar, revocar) y cada petición queda en la auditoría de plataforma (CM-G3).
5. **CM-A5 · Alerta por falta de primer ingreso en la rebanada 1 (menor 16).** Como nadie puede ingresar hasta la rebanada "Ingreso e invitaciones" (D37), la alerta de GC S-72 (`membership.admin_first_access_alert`, ADR 0008) se dispararía para todo administrador. Por eso queda detrás del flag `platform.admin_first_access_alert`, apagado: con el flag apagado no se encola ningún trabajo. El flag sigue el mecanismo de CM-H1 (D56) y se enciende con la rebanada de ingreso; al encenderlo, el plazo de 7 días de cada membresía `admin` vigente sin primer ingreso cuenta desde el encendido, no desde un otorgamiento anterior (Supuesto (a validar), S-CM-27). **Extiende GC S-72 y D27** (desde cuándo corre el plazo): lo registra el coordinador ("Contradicciones y vacíos", punto 21).

### B. Unidades y alícuotas

1. **CM-B1 · Datos de una unidad:** código (obligatorio, único en la comunidad), tipo (`departamento`, `casa`, `estacionamiento`, `bodega` o `local`, del diseño; Supuesto (a validar), S-CM-4), alícuota (`aliquot_e6`, obligatoria, 0 a 1.000.000) y orden (`sort_order`, entero único en la comunidad, GC C-4). El tipo es informativo: no cambia ningún cálculo.
2. **CM-B2 · Código.** Se guarda normalizado a Unicode NFC (forma compuesta: "Depto Ñ" escrito con la Ñ compuesta o con N más tilde combinada se guarda igual; R2-m-5), sin espacios al inicio ni al final y con los espacios internos reducidos a uno. Las tildes y la ñ se conservan. Se compara sin distinguir mayúsculas: "depto 101" y "Depto  101" son el mismo código que "Depto 101" (Supuesto (a validar), S-CM-5). Largo máximo: 30 caracteres (`maxLength`). Ausente o vacío: 422 `UNIT_CODE_REQUIRED`. Repetido: 409 `UNIT_CODE_ALREADY_EXISTS`.
3. **CM-B3 · Alícuota.**
   - La API recibe y devuelve la alícuota como entero `aliquotE6` en escala 10^-6 (18,5000 % = 185000; 100 % = 1000000), nunca como número decimal (regla 1 de `CLAUDE.md`, aplicada por analogía; `docs/arquitectura.md` §4) (Supuesto (a validar), S-CM-6).
   - La conversión del texto que escribe la persona (`18,5`, `18.5` o `18,5000`, hasta 4 decimales, coma o punto) a `aliquotE6` se hace leyendo el texto, sin punto flotante (`docs/design/arquitectura-de-informacion.md`, "Alícuotas"). Esa función vive en `packages/shared` para que la usen la web y la futura importación, con pruebas de propiedades (S-CM-6).
   - Rango: 0 a 1.000.000. Fuera de rango, ausente o no numérica: 422 `INVALID_ALIQUOT` con "La alícuota debe estar entre 0 % y 100 %". Un `aliquotE6` con decimales equivale a más de 4 decimales de porcentaje: 422 `INVALID_ALIQUOT` con "La alícuota admite hasta 4 decimales".
   - Una alícuota de 0 se acepta y se muestra "Sin participación" (`docs/design/flujos/admin-alta-comunidad.md`, paso 4; GC CA-18).
   - Si algún reglamento usa más de 4 decimales de porcentaje sigue en GC P-10.
4. **CM-B4 · Suma de alícuotas.**
   - Se guarda aunque la suma de la comunidad no sea 1.000.000: la carga suele hacerse por partes.
   - **Quién recibe la suma (menor 9):** solo el administrador y el comité. Toda respuesta de alta, edición, lote o eliminación de unidades y el listado de unidades leído por ellos devuelven `aliquotSumE6`, calculada con enteros, y la advertencia de abajo. El listado y la ficha de unidad que recibe un residente no traen la suma ni la advertencia: los campos no viajan (CA-CM-10).
   - Si la suma no es 1.000.000, la respuesta incluye la advertencia "Las alícuotas suman {suma}; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas", con la suma en 4 decimales y coma (texto del flujo y del wireframe WEB-ALT-04). Es una advertencia, no un error.
   - El bloqueo está en la emisión, no aquí: si algún grupo del periodo usa la base `alicuota` y la suma no es 1.000.000, la emisión responde 422 `ALIQUOTS_NOT_100` (GC A-3.1, CA-19). Una suma sobre 100 % también se guarda con la misma advertencia.
5. **CM-B5 · Orden (`sort_order`).**
   - Entero de 1 a 999.999, único en la comunidad. Fuera de rango o no entero: 422 `INVALID_SORT_ORDER`. Repetido: 409 `SORT_ORDER_ALREADY_USED`. Se edita con `unit.write` (menor 2; "Qué recursos ve cada rol").
   - **Propuesta al crear (GC C-4):** si el alta no trae el orden, la API lo asigna: a cada unidad nueva, en el orden natural de los códigos del lote, el siguiente número libre después del mayor orden existente en la comunidad (Supuesto (a validar), S-CM-7). Ejemplo: en una comunidad vacía, el lote "Depto 10", "Depto 9", "Depto 11" recibe Depto 9 = 1, Depto 10 = 2 y Depto 11 = 3.
   - **Orden natural, con desempates (menor 15; Supuesto (a validar), S-CM-24):** el código se divide en tramos de dígitos y de no dígitos. Se comparan tramo a tramo: los de dígitos por su valor numérico; los de texto en minúsculas y sin tildes ni diéresis (á → a, ü → u, ñ → n). Si todo empata (por ejemplo, "Depto 09" y "Depto 9", o "Depto Ñ" y "Depto N"), va primero el que tiene menos ceros a la izquierda y, al final, el código **guardado** según CM-B2 (NFC, con sus tildes, su ñ y sus mayúsculas) comparado por punto de código Unicode (R2-m-5). Ese último desempate nunca empata: dos códigos guardados distintos son cadenas distintas, y la unicidad sin mayúsculas de CM-B2 impide dos códigos que difieran solo en mayúsculas. La comparación no depende de la configuración regional del servidor.
   - **Cambio del orden:** cambia los desempates de los periodos que se emitan después (GC C-3). Los periodos emitidos usan el orden de su foto de participaciones (GC "Definiciones").
   - Intercambiar el orden de dos unidades se hace con el lote (CM-B6), porque con dos ediciones sueltas la primera chocaría con la unicidad.
6. **CM-B6 · Lote de unidades, todo o nada** (`POST …/units/batch`; observación de la revisión: un solo endpoint para alta y edición en bloque).
   - **Cuerpo:** una lista `rows` y, si la comunidad tiene algún periodo emitido y alguna fila es un alta o cambia una alícuota o un orden, un `reason` para todo el lote (CM-B7). Una fila sin `unitId` es un alta (código, tipo y alícuota obligatorios; orden opcional, CM-B5). Una fila con `unitId` es una edición: cambia solo los campos presentes.
   - **Identificadores (M-4):** un `unitId` repetido en el lote responde 400 en el paso de forma. Todo `unitId` que la persona no ve (de otra comunidad o inexistente) responde 404 `NOT_FOUND` en el paso 4, antes de la idempotencia y de validar las filas, con el mismo cuerpo en ambos casos: la respuesta no revela si el id existe en otra comunidad (ISO-5).
   - **Tope:** 500 filas (menor 3; Supuesto (a validar), S-CM-8). Un lote mayor responde 422 `UNITS_BATCH_TOO_LARGE`. Con 500 filas el cuerpo queda bajo el límite de 100 kB de ADR-0009-S3 (una fila de edición ocupa unos 150 bytes, así que 500 filas suman unos 75 kB); un cuerpo sobre ese límite responde 413 antes del guard, como cualquier ruta.
   - **Validación completa antes de escribir:** cada fila se valida con el orden de la unidad suelta, sin el motivo. La unicidad de código y de orden se evalúa contra el **estado final** del lote: intercambiar el orden 3 y 4 de dos unidades en el mismo lote es válido. Si una sola fila falla, no se escribe nada y la respuesta es 422 `UNITS_INVALID` con la lista `rows`: posición de la fila (desde 1), código de la unidad si lo trae, y el código y el texto del **primer** error de esa fila. Los conflictos de código y de orden (409 en la unidad suelta) aparecen como errores de fila dentro del 422, con su propio código. Es la única respuesta del módulo con varios errores (Supuesto (a validar), S-CM-8; mismo criterio que la importación del diseño, "No se guardó nada. Corrige estas filas…").
   - **Dos filas que chocan entre sí (menor 4):** se marca la fila de mayor posición, con "El código {código} está repetido en la fila {n}" o "El orden {n} está repetido en la fila {m}", donde la fila nombrada es la primera que lo usa. Un choque con una unidad que no está en el lote usa el texto de la unidad suelta.
   - **Motivo:** se evalúa después de las filas (ver "Orden de validación por acción"). Sin motivo, con algún periodo emitido, filas válidas y al menos una fila que sea un alta o cambie una alícuota o un orden: 422 `REASON_REQUIRED`. Un lote que solo cambia códigos o tipos no lo exige (CM-B7; R2-m-3).
   - Así se pasa de una suma de 100 % a otra de 100 % sin un estado intermedio guardado (CA-CM-7).
7. **CM-B7 · Cambios después de un periodo emitido (regla 6 de `CLAUDE.md`).**
   - **Se permiten**: crear unidades, editar su código, tipo, alícuota u orden y usar el lote, también después de emitir (UX-15 del diseño). La foto de participaciones de cada periodo emitido o cerrado **no cambia** (GC "Definiciones"; ADR 0004, decisión 7): los cargos emitidos, sus ajustes y las correcciones de esos periodos (GC sección H) siguen usando la foto, nunca los valores actuales.
   - **Efecto:** solo sobre el borrador vigente y los periodos que se emitan después. No se recalcula ni se ajusta ningún periodo emitido o cerrado por un cambio de alícuota (Supuesto (a validar), S-CM-9; P-CM-1).
   - **Vista previa de emisión (M-1):** un cambio de unidades, alícuotas u orden confirmado después de la vista previa produce 409 `PREVIEW_OUTDATED` al emitir **solo si cambia lo que se va a escribir** (GC A-7: la huella cubre cada movimiento con su unidad, monto y vencimiento). Cambiar el código o el tipo de una unidad no cambia la huella. Y si el cambio deja la suma distinta de 100 % con un grupo por alícuota, la emisión responde 422 `ALIQUOTS_NOT_100` y no el 409, porque en la ejecución `PREVIEW_OUTDATED` va al final (ADR 0003, decisión 9, paso 5; GC "Orden entre reglas de negocio") (CA-CM-8).
   - **Motivo y respaldo obligatorios** desde que la comunidad tiene algún periodo emitido o cerrado: toda alta, toda edición que cambie la alícuota o el orden, todo lote con al menos una fila así y toda eliminación lleva un motivo de texto libre que nombre el documento que la respalda (por ejemplo, "Modificación del reglamento aprobada en asamblea extraordinaria del 18-11-2026, escritura del 25-11-2026"), con la ayuda "No incluyas datos personales". Sin motivo: 422 `REASON_REQUIRED`. ComVive guarda el texto y no valida el acuerdo, igual que la autorización de los egresos del fondo (GC S-49). Fundamento: las alícuotas las fija el reglamento de copropiedad, cuya modificación exige asamblea extraordinaria (Ley 21.442, art. 15, según MINVU; numeración en GC P-1); GC "Casos borde" ya dice que un cambio de alícuotas requiere modificar el reglamento (Supuesto (a validar), S-CM-10).
   - Cambiar solo el código o el tipo de una unidad, suelta o en lote, no exige motivo: no cambia ningún monto (S-CM-10; R2-m-3; CA-CM-8, tercer escenario). Una edición que trae la alícuota o el orden con el mismo valor que ya tienen no cuenta como cambio.
   - Los avisos ya emitidos conservan el código que tenían al generarse (GC G-5). Las pantallas de periodos anteriores muestran el código actual; el historial de códigos queda en la auditoría (Supuesto (a validar), S-CM-11).
8. **CM-B8 · Eliminación de una unidad (M-6).**
   - Solo si **ninguna fila de negocio la referencia**. Hoy eso incluye: ocupaciones de cualquier estado (también canceladas); movimientos del libro; pagos e intentos Webpay; la foto de participaciones de cualquier periodo emitido o cerrado; el conjunto de unidades de un gasto `partes_iguales` del borrador (GC C-2); un cargo directo del borrador (GC B-4); el estado de intereses de la unidad (`INTEREST_STATE`); una tarea del administrador (`ADMIN_TASK.unit_id`); y un envío de notificación (`NOTIFICATION_DELIVERY.unit_id`). Si alguna la referencia: 409 `UNIT_IN_USE`.
   - **Regla para tablas futuras:** toda tabla nueva con una referencia a la unidad entra en esta verificación en el mismo cambio que la crea. La prueba de la eliminación recorre las claves foráneas hacia `UNIT` y falla si alguna no está cubierta (Supuesto (a validar), S-CM-12).
   - **Referencias sin clave foránea (R2-m-6):** hay referencias lógicas que la prueba de claves foráneas no ve, como el `payload` de un trabajo de `JOB` (ADR 0008) con el id de una unidad. No impiden la eliminación; en cambio, **todo trabajo que lea una unidad por su id tolera que ya no exista**: termina sin efecto, sin reintentos y sin error que alerte, y deja el hecho en su registro. Cada tipo de trabajo que reciba un id de unidad tiene una prueba que lo ejecuta con una unidad eliminada. Es coherente con ADR 0008, que ya exige trabajos idempotentes y reejecutables. Se eligió tolerar en vez de bloquear porque buscar ids dentro de `payload` acopla esta regla a cada tipo de trabajo, y una unidad que se puede eliminar no tiene movimientos ni ocupaciones que un trabajo deba procesar (Supuesto (a validar), S-CM-12). Toda referencia lógica nueva fuera de `JOB` (por ejemplo, un id de unidad dentro de un JSON) entra en la lista de arriba o en esta tolerancia, con su prueba, en el mismo cambio que la crea.
   - **Requisito heredado para la rebanada de emisión:** un CA con TDD en el que un gasto de partes iguales del borrador con la unidad en su conjunto hace que la eliminación responda 409 `UNIT_IN_USE`, y el borrador no cambia (reglas 2 y 3 de `CLAUDE.md`).
   - Sirve para corregir un error de carga; una unidad real no desaparece (fusiones y subdivisiones quedan fuera de alcance). Con algún periodo emitido, exige motivo (CM-B7). La eliminación es física solo si nada la referencia; la auditoría conserva sus datos.
9. **CM-B9 · Concurrencia con la emisión.** Una emisión y un cambio de unidades de la misma comunidad no se intercalan: la emisión usa las unidades y alícuotas vigentes al tomar su bloqueo (GC A-3.3; `docs/arquitectura.md` §4, "Bloqueo único por comunidad") y un cambio confirmado después de la vista previa se trata como dice CM-B7. El mecanismo lo fija el arquitecto. Dos ediciones concurrentes de la misma unidad: gana la última confirmada y ambas quedan en auditoría (Supuesto (a validar), S-CM-13).

### C. Personas, fichas y datos personales (Ley 21.719)

1. **CM-C1 · Datos mínimos por rol.** ComVive pide solo lo necesario para cobrar, notificar y dar acceso (regla 7 de `CLAUDE.md`). En el MVP solo se registran personas con RUT (D53, CM-C7).

   | Dato | Administrador | Comité | Propietario | Arrendatario |
   | --- | --- | --- | --- | --- |
   | RUT | Obligatorio (GC S-63) | Ya registrado como propietario (GC S-34) | Obligatorio | Obligatorio (UX-8; S-CM-15) |
   | Nombre | Obligatorio, lo ingresa Operaciones (D52; extiende GC S-63) | Ya registrado en su ficha | Obligatorio | Obligatorio |
   | Celular o correo | Obligatorio siempre, en el alta y en cada otorgamiento de `admin`; se guarda solo en la ficha de esa comunidad, nunca se copia de `PERSON` ni de otra ficha (D54; extiende GC S-63) | Ya registrado en su ficha | Opcional; sin él no se puede invitar | Opcional; sin él no se puede invitar |

   No se piden dirección personal, fecha de nacimiento, estado civil, profesión, patente ni otros datos. Un campo que no está en esta tabla no se acepta (400). Los datos del conserje los fija la spec de conserjería (D50).
2. **CM-C2 · RUT y nombre.** El RUT se normaliza (sin puntos, con guion, dígito verificador en mayúscula) y se valida con módulo 11; ausente o inválido: 422 `INVALID_RUT` (GC, tabla de errores). Se aceptan RUT de personas jurídicas y de comunidades hereditarias como propietarias, con el límite de ingreso de S-CM-16. El nombre es texto libre de 1 a 120 caracteres sin espacios al inicio ni al final; vacío: 422 `PERSON_NAME_REQUIRED`.
3. **CM-C3 · Contacto.** Un celular chileno (+56 9 y ocho dígitos) o un correo con formato válido, o ambos (mismo formato que GC "Validaciones de la consola de Operaciones ComVive"). Formato inválido: 422 `INVALID_CONTACT`. Se guarda normalizado (celular como `+569XXXXXXXX`, correo en minúsculas), porque la habilitación de D47 compara contactos (CM-F3).
4. **CM-C4 · Persona, ficha y contacto (C-1, M-3, M-8; D47, D48).**
   - **Identificación:** la persona se identifica por su RUT, que es global. El nombre y el contacto que registra cada comunidad viven en la **ficha de la persona en esa comunidad**, una por par (persona, comunidad), nunca en la persona: el administrador de la Comunidad A no puede cambiar lo que ve ni a dónde notifica la Comunidad B (`docs/arquitectura.md` §2, "Datos que cruzan comunidades").
   - **Por qué por persona y comunidad y no por membresía (D47; Supuesto (a validar), S-CM-21):** todas las membresías de una persona en una comunidad las registra la misma administración (o Operaciones, para `admin`), así que no hay razón para que tengan nombres o contactos distintos. Con una ficha por comunidad, la persona tiene **un solo nombre por comunidad** aunque tenga varios roles (M-8 (c)); la corrección de CM-C6 se hace una vez; y la habilitación de D47 sigue separando comunidades, que es lo que protege C-1.
   - **Vista previa sin revelar otras comunidades (D48; ISO-7):** la vista previa de una ocupación con un RUT que existe solo en otra comunidad responde **idéntico** a la de un RUT inexistente en ComVive: los mismos campos, la misma estructura y los mismos textos, sin ningún aviso del tipo "ya tiene cuenta en ComVive". La respuesta no dice si se creará una persona nueva. La ficha y la membresía se crean igual, con el nombre y el contacto que registra esta comunidad.
   - **Persona que ya tiene ficha en esta comunidad (M-8 (b)):** como el administrador ya la ve, la vista previa sí lo dice: "Esta persona ya está registrada en la comunidad como {nombre de la ficha}. Se conservan su nombre y su contacto; para cambiarlos, usa Corregir datos". El nombre y el contacto de la petición no cambian la ficha (solo CM-C6 la corrige; S-CM-21). La excepción es el otorgamiento de `admin` por Operaciones (CM-A2).
   - **Contacto de ingreso (C-1, D47):** se elimina la regla de la rev. 1 "el primer contacto registrado es el contacto de ingreso". Mientras una persona no tenga un contacto verificado, su contacto sin verificar es el de la ficha de **cada** comunidad, y ningún contacto registrado por una comunidad sirve para ingresar a otra. Tampoco al otorgar `admin`: Operaciones siempre ingresa el contacto de esa comunidad (D54, CM-A2). Cómo se verifica y qué habilita está en CM-F3.
5. **CM-C5 · Quién ve qué de cada persona.** Lo fijan GC "Datos del arrendatario que ve el propietario" (S-44) y GC "Datos de copropietarios que ve el comité" (S-33). Se agrega:
   - El arrendatario no ve ningún dato del propietario de la unidad (nombre, RUT ni contacto) (Supuesto (a validar), S-CM-18).
   - Un residente no ve datos de otras unidades ni de otros residentes.
   - Operaciones no lee fichas ni membresías en esta rebanada (D49).
   - El RUT completo lo ven el titular y el administrador; los demás roles que lo vean, enmascarado (`12.345.***-*`) (`docs/design/arquitectura-de-informacion.md`, "RUT"). El filtro lo aplica la API: los campos excluidos no viajan.
   - El nombre que el propietario ve del arrendatario ("Deuda del arrendatario {nombre}", GC S-44) es el de la ficha del arrendatario en la comunidad (hoy `MEMBERSHIP.display_name` en `docs/arquitectura.md` §4; "Contradicciones y vacíos", punto 5).
6. **CM-C6 · Rectificación (Ley 21.719; menor 7).**
   - El administrador corrige el nombre y el contacto de la ficha de una persona de su comunidad (`PATCH …/person-records/{personRecordId}`, `person_record.write`). Vale para todos los roles de la persona en esa comunidad y solo para esa comunidad, y queda en auditoría (`person_record.update`) con los valores anteriores enmascarados.
   - **Persona con membresía `admin` vigente en la comunidad (D57; R2-m-8):** 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` con "Los datos de un administrador los corrige ComVive", como primera regla del paso 6, y nada cambia. Es un 422 y no un 403 porque el rechazo depende del estado de otra persona, no del rol de quien actúa. Su nombre y su contacto los fija Operaciones (D52, D54); cómo se corrigen después queda en P-CM-16.
   - **Ex residentes y membresías revocadas:** la ficha se puede corregir aunque la persona ya no tenga ninguna membresía vigente en la comunidad, porque la comunidad conserva sus datos en el historial y el titular tiene derecho a rectificarlos (Ley 21.719) (Supuesto (a validar), S-CM-29).
   - **El RUT no se edita:** es la identidad global de la persona; un campo `rut` responde 400. El caso de un RUT mal registrado queda en P-CM-7.
   - **Contacto e ingreso:** corregir el contacto de una ficha no verifica nada. Si la persona ya tenía un contacto verificado, ese contacto no cambia en `PERSON`, pero deja de habilitar esta comunidad si la ficha ya no lo registra: desde la petición siguiente, las sesiones obtenidas con el contacto anterior no ven esta comunidad, y el cambio queda en auditoría (requisito D55-2 de CM-F3, que implementa la rebanada de ingreso). Un contacto nuevo nunca habilita sin verificarlo.
7. **CM-C7 · Solo personas con RUT (D53; menor 13).** En el MVP solo se registran personas con RUT. Los extranjeros con residencia en Chile tienen RUN, que es su RUT, y se registran como cualquier persona. Una persona sin RUT (por ejemplo, con solo pasaporte) no se registra: no se le crea ficha, ocupación ni membresía, y sin ocupación propia la deuda de la unidad queda en el ámbito `owner` (GC F-9, F-15). Supuesto (a validar), S-CM-15; P-CM-19.

### D. Membresías y roles

1. **CM-D1 · Quién otorga cada rol.** Es la tabla de GC "Otorgamiento de roles" y `docs/arquitectura.md` §3, "Quién otorga cada rol": administrador, solo Operaciones; comité, el administrador; residente, a través de la ocupación. La conserjería se pospone (D50).
2. **CM-D2 · Otorgar comité por la ruta de membresías (M-4, M-5; menor 8).**
   - **Cuerpo:** `role`, `personRecordId` (la ficha de la persona en esta comunidad), `assemblyDate` y `assemblyReference` (GC S-34; `docs/arquitectura.md` §3). La persona se identifica por su ficha, no por un `personId` global ni por el RUT.
   - **Permiso estático de la ruta:** `committee_role.grant` (paso 3c). Después de la forma (paso 4), en este orden (R2-m-2): primero, un `personRecordId` que el administrador no ve (de otra comunidad o inexistente) responde 404 `NOT_FOUND`, con el mismo cuerpo en ambos casos; después, `role = admin` responde 403 (GC "Respuestas de error"). Visibilidad antes que permiso, como en el guard (ADR 0009, decisión 3): así un 403 nunca confirma que un `personRecordId` ajeno existe. En el paso 6, `role = resident` responde 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` (CM-D5) y `role = committee` sigue GC S-34 y S-43 sin cambios.
   - **Vigencia:** la membresía de comité rige desde el otorgamiento, sin fecha de término. El cuerpo no acepta `validFrom` ni `validTo`: 400 (menor 8; `docs/arquitectura.md` §5: en el MVP ninguna membresía termina por `valid_to`).
3. **CM-D3 · Conserjería: retirada de la rebanada 1 (D50).** No se otorgan membresías `concierge`, no se pide el RUT de ningún trabajador y la ruta de membresías responde 400 a `role = concierge`. Quién puede ser conserje, qué datos se piden y qué ve, en la spec de conserjería.
4. **CM-D4 · Revocar comité.**
   - Motivo obligatorio (el diseño ya lo pide: "término del periodo", "renuncia" u "otro" con texto libre): sin motivo, 422 `REASON_REQUIRED` con "Indica el motivo de la revocación". Ya revocada (otra clave): 409 `ROLE_ALREADY_REVOKED`. Un reintento con la misma clave de una revocación aplicada devuelve el resultado original (GC A-3.4).
   - Efecto inmediato, sin cerrar sesiones y con la eliminación de las suscripciones push de esa membresía (GC S-81). Si la persona tenía una tarea "Revisar rol de comité" abierta, se cierra con `revoked_elsewhere` (GC M-7).
   - Permiso estático de la ruta: `committee_role.grant`. Una membresía `admin` responde 403, también la propia (`docs/arquitectura.md` §3), en el paso 4 (E-CM-1, D57). Una de residente, 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` en el paso 6 (R2-m-1).
   - El comité no ve las membresías: su pedido de revocar responde 404.
5. **CM-D5 · Membresía de residente (M-8 (a)).**
   - **Nace con la ocupación:** al registrar una ocupación de propietario o arrendatario, si la persona no tiene una membresía de residente vigente o programada en la comunidad, se crea una con `valid_from` = `effective_from` de la ocupación (GC F-14; `docs/arquitectura.md` §4, "Ocupaciones"). Si ya la tiene, no se crea otra: una persona tiene **una** membresía de residente por comunidad, aunque ocupe varias unidades o sea propietaria de una y arrendataria de otra.
   - **Adelanto de `valid_from`:** si la membresía de residente tiene `valid_from` futuro (solo tenía ocupaciones programadas) y se registra una ocupación con `effective_from` anterior (por ejemplo, vigente hoy), `valid_from` pasa a ese `effective_from`, en la misma transacción, con auditoría `membership.update_validity` (valor anterior y nuevo). No se crea otra membresía. `first_access_at` sigue vacío, porque antes la persona no podía ingresar (Supuesto (a validar), S-CM-26). `valid_from` nunca se atrasa.
   - **Termina**, con la revocación de GC S-81, cuando la persona ya no tiene ninguna ocupación vigente ni programada en la comunidad: por cancelación de un arriendo programado y, con el flag, por término de arriendo o venta (GC F-14). Si le queda otra, sigue vigente y solo cambian las unidades que ve. Si después se le registra una ocupación nueva, nace una membresía nueva (como GC D27 para `admin`).
   - Con solo una ocupación programada, la membresía rige desde su `effective_from`: antes, el guard no la considera vigente y la persona recibe 404 (GC CA-53).
   - No se otorga ni se revoca por la ruta de membresías: 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY`.
6. **CM-D6 · Último administrador.** GC D9, D10, S-68 y CA-69, sin cambios: Operaciones no revoca al único administrador vigente; ningún administrador revoca administradores. Cómo cuenta un administrador con `valid_from` futuro sigue en GC P-61. Si la comunidad no tiene administrador, la ley permite que el presidente del comité ejerza sus funciones (MINVU, "Herramientas para la administración"); ComVive no lo modela, porque la comunidad nunca queda sin administrador (P-CM-9).
7. **CM-D7 · "Usuarios y roles" (lo que entrega la API al administrador).**
   - **Administradores** (solo lectura): nombre de la ficha, RUT completo, desde, "Otorgado por ComVive" y estado de ingreso.
   - **Comité:** nombre de la ficha, unidad o unidades de las que es propietario, desde (fecha del otorgamiento), fecha y referencia de la asamblea (GC S-34), estado de ingreso y, si tiene una tarea "Revisar rol de comité" abierta o resuelta como mantener, ese dato (`docs/design/flujos/admin-usuarios-y-roles.md`).
   - **Historial de roles (menor 12):** cada otorgamiento y cada revocación de la comunidad, también los de administrador: quién, a quién, cuándo, por qué vía (`community` o `platform`) y referencia o motivo. En los de vía `platform`, "Quién" es "Operaciones ComVive", nunca la persona del equipo (CON-11; `admin-usuarios-y-roles.md`).
   - Los residentes no se listan aquí: están en el registro de copropietarios y en las ocupaciones de cada unidad.
   - La lectura queda en auditoría, porque devuelve RUT completos (`docs/arquitectura.md` §5).

### E. Ocupaciones (complementos de GC F-9, F-13, F-14 y F-15)

Las reglas de ocupaciones están en GC: estados y fechas efectivas ("Definiciones"; F-14), ámbitos y visibilidad (F-9), ocupación terminada (F-13), unidad sin propietario (F-15), vistas previas con huella (A-7), cancelación (F-14), comité que vende (M-7), errores (tabla de GC) y CA-21, CA-22, CA-37, CA-38, CA-53, CA-56, CA-57 y CA-61. Aquí solo se agrega lo que falta.

1. **CM-E1 · Datos de la persona en una ocupación:** RUT, nombre y contacto opcional, con las reglas CM-C1 a CM-C4 y CM-C7. La fecha declarada de ingreso (alta de arrendatario) o de inscripción o entrega (venta o propietario faltante) es obligatoria. Se permite cualquier fecha pasada, porque es historial (GC F-14: el efecto rige desde el registro).
2. **CM-E2 · El propietario no es arrendatario de su propia unidad.** Registrar como arrendatario a quien tiene la ocupación de propietario vigente de esa unidad responde 422 `OWNER_CANNOT_BE_TENANT`. Puede ser arrendatario de otra unidad de la misma comunidad (Supuesto (a validar), S-CM-19).
3. **CM-E3 · Venta al arrendatario.** Registrar la venta de una unidad a la persona que es su arrendataria vigente o programada responde 409 `BUYER_IS_CURRENT_TENANT`. Primero se registra el término (con su traspaso, GC F-9) o la cancelación del arriendo, y después la venta. Así nunca coinciden en la misma persona y la misma unidad los ámbitos `owner` y `occupancy` (S-CM-19).
4. **CM-E4 · Término de un arriendo que no está vigente.** Terminar un arriendo programado responde 409 `OCCUPANCY_NOT_STARTED` con "Este arriendo aún no comienza. Si no comenzará, cancélalo"; uno cancelado, 409 `OCCUPANCY_CANCELLED`; uno terminado, 409 `OCCUPANCY_ALREADY_ENDED` (ya en GC). Orden en "Orden de validación por acción" (Supuesto (a validar), S-CM-2).
5. **CM-E5 · Carga inicial de ocupantes.** En una comunidad configurada sin emisiones, el administrador registra a los propietarios con la acción "propietario faltante" y a los arrendatarios con el alta de arrendatario, con sus fechas declaradas reales (por ejemplo, una compra de 2015). Rigen desde el registro (GC F-14) y, como no hay cargos emitidos, no cambian ningún ámbito. Las advertencias de fecha pasada de GC F-14 se muestran igual; el diseño puede agregar una ayuda propia para la carga inicial (Supuesto (a validar), S-CM-20). Las dos acciones funcionan con el flag apagado.
6. **CM-E6 · Término y venta detrás de un flag hasta el libro de movimientos (D51; M-7).**
   - **Flag `occupancy.end_and_transfer`, apagado por defecto** en todos los ambientes, con el mecanismo de CM-H1 (D56): vive en la configuración de despliegue de cada ambiente y una prueba falla si la configuración de producción lo trae encendido antes de que exista el traspaso. Con el flag apagado, la vista previa y la ejecución del término de arriendo, y las de una venta (`ownership-transfers` sobre una unidad con ocupación de propietario vigente), responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE`, como primera regla de negocio, sin escribir nada. El propietario faltante (misma ruta, unidad sin propietario vigente), el alta de arrendatario y la cancelación no dependen del flag (Supuesto (a validar), S-CM-30).
   - **Qué se implementa en la rebanada 1, detrás del flag:** las validaciones y su orden, el efecto en las ocupaciones y en las membresías de residente (CM-D5) y la tarea "Revisar rol de comité" (GC M-7). Las pruebas automáticas los ejercitan con el flag encendido en el doble de configuración.
   - **Ningún texto fijo sobre dinero:** mientras no exista el libro (ADR 0004), la vista previa del término y de la venta **no incluye** la sección de deuda, saldo a favor ni traspaso, ni ningún texto que afirme que no se moverá dinero. Los textos de esa sección (incluido el del diseño para un traspaso vacío) solo se muestran calculados desde el libro.
   - **Criterio de activación (D51):** la rebanada del libro de movimientos **no puede activar el flag** sin implementar con TDD el traspaso de GC F-9 y F-13 (movimientos `transfer`, reimputación y huella con los movimientos del traspaso, GC A-7). Es parte de su definición de "Hecho". Hasta entonces, un término o una venta reales los registra ComVive a pedido, fuera de la aplicación, o esperan.

### F. Primer ingreso por invitación

1. **CM-F1 · F4 va en una rebanada propia, "Ingreso e invitaciones".** Justificación:
   - La aceptación de la invitación **es** el ingreso: RUT y código de un solo uso que deben coincidir con la invitación (`docs/design/flujos/residente-primer-ingreso.md`). El líder dejó el ingreso de ADR 0005 fuera de la rebanada 1 (D37).
   - Enviar una invitación necesita el proveedor de correo y SMS, que aún no está elegido (ADR 0005, decisión 1; `docs/arquitectura.md` §7).
   - El modelo de datos aprobado no tiene una entidad de invitación (vigencia, uso único, reenvío, vencimiento): la diseña el arquitecto junto con el ingreso.
   - Separarla no bloquea nada: en la rebanada 1 nadie ingresa, así que nadie necesita una invitación.
2. **CM-F2 · Lo que la rebanada 1 deja listo para F4.** RUT, nombre y contacto validados y normalizados en cada ficha (sección C); el estado de ingreso de cada membresía (pendiente o activo); y, en el alta de arrendatario, el aviso de privacidad de GC S-44 en la respuesta de la vista previa, para que el administrador lo vea antes de confirmar (`docs/design/flujos/admin-ocupaciones.md`).
3. **CM-F3 · Requisitos que hereda la rebanada de invitaciones** (del diseño aprobado y de D47; se especifican allí):
   - **Habilitación por contacto (D47; C-1):**
     - Mientras una persona no tenga ningún contacto verificado, solo ingresa con la invitación de una membresía, y el código va al contacto registrado en la ficha de **esa** comunidad.
     - Al ingresar el código, ese contacto queda verificado y habilita **solo** las membresías de las comunidades cuya ficha registra ese mismo contacto (normalizado, CM-C3). Las membresías de las demás comunidades exigen su propia invitación o confirmación, con un código enviado al contacto que registra **su** ficha, nunca a un contacto verificado por otra comunidad.
     - Una sesión obtenida con un código enviado a un contacto da acceso solo a las membresías habilitadas por ese contacto, también en los ingresos siguientes. Esto ajusta la sesión global de ADR 0005 (decisión 3), que hoy da acceso a todas las membresías vigentes de la persona: lo resuelve el arquitecto en esa rebanada (P-CM-18).
     - Un contacto que un administrador escribe o corrige en una ficha nunca queda verificado ni habilita nada sin que la persona ingrese el código enviado a él.
     - **D55-1 · Evaluación en cada petición (R2-M-1 (a)):** la habilitación por contacto se evalúa en cada petición, igual que la membresía vigente (ADR 0005, decisión 3; ADR 0009, decisión 3, paso 2), y no se fija al verificar ni se copia en la sesión.
     - **D55-2 · Corrección o reemplazo del contacto de una ficha:** cuando el administrador corrige el contacto de una ficha (CM-C6) u Operaciones lo reemplaza al otorgar `admin` (CM-A2), esa comunidad queda deshabilitada, desde la petición siguiente, para las sesiones obtenidas con el contacto anterior: toda ruta de esa comunidad les responde 404 y deja de aparecer en "Mis comunidades". El cambio queda en auditoría (`person_record.update`, más el evento de deshabilitación que fije la rebanada de ingreso). La persona vuelve a entrar con una invitación al contacto nuevo. Así, corregir un contacto mal digitado saca a quien lo había verificado (remedio de C-1 dentro de una comunidad).
     - **D55-3 · Una sesión limitada no toca la identidad de otras comunidades (R2-M-1 (b)):** una sesión que no tiene habilitadas todas las comunidades donde la persona tiene membresías vigentes no puede modificar datos de identidad que afecten a las comunidades no habilitadas: agregar, cambiar o quitar contactos verificados, activar o cambiar un segundo factor, cerrar otras sesiones ni ninguna otra acción de `/me/` o `/auth/` con efecto fuera de lo habilitado. Cuáles acciones de identidad se permiten y con qué condición lo fija la rebanada de ingreso. "Mis comunidades" lista solo las comunidades habilitadas para esa sesión.
     - **D55-4 · Ingreso normal con varios contactos verificados (R2-M-1 (c)):** el código va a cada contacto verificado de la persona, y la sesión queda limitada a las comunidades habilitadas por el contacto con que se ingresó el código. El arquitecto puede elegir otra regla si es equivalente: que ninguna sesión vea una comunidad cuya ficha no registra el contacto con que se obtuvo. Esto cambia el "contacto de ingreso verificado … único por persona" de ADR 0005, decisión 1 ("Contradicciones y vacíos", punto 19).
     - CA de aislamiento obligatorio: CA-CM-24, con los cuatro requisitos D55.
   - **Personas jurídicas y sucesiones con ingreso compartido entre comunidades:** pospuestas hasta la respuesta del abogado (D47; S-CM-16, P-CM-10). La rebanada de ingreso no envía invitaciones a sus RUT mientras P-CM-10 siga abierta.
   - **Del diseño aprobado:** mensaje genérico sin datos de la comunidad ni de la unidad; el texto de GC S-44 para el arrendatario en el mensaje y en el primer ingreso; validez de 14 días y código de 10 minutos (supuestos del flujo); invitación ligada a una membresía, que deja de servir si la membresía termina o se revoca; RUT de la invitación igual al RUT que ingresa, con el mismo mensaje de error que un código errado; y registro de cada envío en `NOTIFICATION_DELIVERY` (ADR 0008, decisión 14). La invitación del primer administrador, que hoy describe el flujo de usuarios y roles ("Te dieron acceso como administrador de una comunidad en ComVive…"), va en la misma rebanada.
   - **Persona que ya tiene un contacto verificado:** el código va a ese contacto solo para las comunidades cuya ficha lo registra; para las demás rige la habilitación por contacto de arriba (y D55-4 si tiene varios). Esto reemplaza la regla de UX-30 y de `residente-primer-ingreso.md` ("el código va siempre al contacto verificado"), que el diseñador debe alinear ("Contradicciones y vacíos", punto 12).

### G. Auditoría

1. **CM-G1 · Escrituras.** En la misma transacción que la operación (ADR 0005, decisión 5) y sin copiar datos personales completos (`docs/arquitectura.md` §5): `community.create` y los de membresía de administrador (GC, ya definidos), `community.update` (campos cambiados), `unit.create`, `unit.update` (por campo, con el valor anterior y el nuevo de código, tipo, `aliquot_e6` y orden, y el motivo si se pidió), `unit.batch` (un evento por lote con el detalle por unidad), `unit.delete` (datos de la unidad y motivo), `membership.grant`, `membership.revoke` (con motivo y suscripciones eliminadas, GC S-81), `membership.update_validity` (CM-D5), `person_record.update` (valores anteriores enmascarados, también cuando Operaciones reemplaza la ficha al otorgar `admin`, CM-A2) y los de ocupaciones y tareas ya definidos en GC (`occupancy.cancel`, `admin_task.create`, `admin_task.resolve`, etc.).
2. **CM-G2 · Lecturas.** Se audita cada petición que devuelva RUT completo de terceros (Supuesto (a validar) de `docs/arquitectura.md` §5): "Usuarios y roles", el registro de copropietarios y el historial de ocupaciones leídos por el administrador; y cada lectura del comité del registro de copropietarios y del historial de ocupaciones (GC "Datos de copropietarios que ve el comité"). No se audita la lectura de la ficha de la propia unidad ni de los datos de la comunidad.
3. **CM-G3 · Rechazos.** Un rechazo en una ruta de comunidad no escribe datos de negocio ni auditoría de negocio (GC D12). En las rutas `/platform/...`, toda petición queda en la auditoría de plataforma, también las rechazadas (ADR 0006, decisión 8; ADR 0009, D41 a D46).
4. **CM-G4 · Quién ve la auditoría (menor 17).** El administrador verá, en "Registro de auditoría", los eventos de su comunidad de este módulo: roles, tareas, ocupaciones, datos de la comunidad, unidades y alícuotas (`unit.*`, con su motivo), fichas (`person_record.update`) y los de Operaciones sobre sus administradores (`docs/design/flujos/admin-usuarios-y-roles.md`). El comité no ve la auditoría (404) (Supuesto (a validar), S-CM-28). Ningún rol de comunidad ve filas de otra comunidad ni filas con comunidad nula (`docs/arquitectura.md` §4, `AUDIT_LOG`). La ruta de lectura de la auditoría no es de esta rebanada: llega con la web; aquí solo se fija qué eventos se escriben y quién los verá.

### H. Feature flags

1. **CM-H1 · Mecanismo de los flags (D56; R2-M-3).** Los dos flags de esta spec (`occupancy.end_and_transfer`, CM-E6, y `platform.admin_first_access_alert`, CM-A5) y los que vengan después siguen estas reglas (Supuesto (a validar), S-CM-31; P-CM-20):
   - **Por ambiente, en la configuración de despliegue:** cada ambiente (desarrollo, pruebas, producción) tiene su valor en la configuración con que se despliega la API (`docs/operaciones/`). No hay valor por comunidad ni por usuario.
   - **No editables por API:** ninguna ruta, de comunidad ni de plataforma, lee ni cambia un flag; ningún rol, tampoco Operaciones ni Soporte, puede encenderlo desde la aplicación.
   - **Encender un flag es un cambio de configuración aprobado por el líder del proyecto**, como cualquier paso a producción (regla 10 de `CLAUDE.md`). El cambio queda en el historial del repositorio o del despliegue.
   - **Valor por defecto apagado:** si la configuración no trae un flag, se considera apagado.
   - **Prueba obligatoria:** una prueba automática del CI falla si la configuración de producción trae `occupancy.end_and_transfer` encendido mientras no exista el traspaso de GC F-9 y F-13 (CM-E6). Cómo sabe la prueba que el traspaso existe (por ejemplo, una constante que solo la rebanada del libro cambia, junto con sus pruebas de oro) lo fija el arquitecto. La rebanada del libro, al encender el flag, cambia esa prueba en el mismo cambio que agrega el traspaso y sus pruebas.
   - **En las pruebas automáticas** los flags se inyectan con un doble de configuración, para ejercitar los dos estados (CA-CM-26).
   - Sin ADR propio por ahora: el arquitecto lo lleva a `docs/arquitectura.md` ("Cuando haga falta: … ambientes y feature flags") y a un ADR si el mecanismo crece ("Contradicciones y vacíos", punto 24).

## Criterios de aceptación

Datos de prueba de `docs/qa/comunidades-simuladas.md`. Fechas en hora de Chile. Los CA de GC citados siguen vigentes y no se repiten. Los CA que usan término de arriendo o venta corren con el flag `occupancy.end_and_transfer` encendido en el doble de configuración, salvo CA-CM-26. CA-CM-17 se retiró en la rev. 2 (D50) y su id no se reutiliza.

**CA-CM-1 · Alta de una comunidad por Operaciones (Comunidad C)**

- Dada una persona de Operaciones ComVive (`operaciones-1`) con sesión de plataforma y segundo factor
- Cuando crea "Edificio Mirador" con un RUT de comunidad válido, sin el nombre del primer administrador, con un RUT de administrador válido que no existe en ComVive, celular +56 9 1234 5678 y motivo "Contrato de administración del 01-11-2026"
- Entonces recibe 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre del administrador", no se crea nada y la petición queda en la auditoría de plataforma (D52).
- Cuando la envía sin nombre y con el RUT del administrador inválido
- Entonces recibe solo 422 `INVALID_RUT` (el RUT va antes que el nombre).
- Cuando la envía sin nombre y sin contacto
- Entonces recibe solo 422 `PERSON_NAME_REQUIRED` (el nombre va antes que el contacto).
- Cuando la envía con el nombre "Paula Henríquez"
- Entonces existen la comunidad, la persona del administrador, su ficha en la Comunidad C con el nombre "Paula Henríquez" y el celular `+56912345678`, y una membresía `admin` vigente, sin fecha de término, con `granted_via = platform` y estado de ingreso "Pendiente".
- Y la comunidad no tiene unidades, periodos ni configuración de cobro; una vista previa de emisión respondería 422 `COMMUNITY_WITHOUT_UNITS` (GC A-3.8).
- Y con el flag `platform.admin_first_access_alert` apagado no se encola ninguna alerta de primer ingreso (CM-A5).
- Y la misma persona de Operaciones, al pedir `GET /communities/{id de Edificio Mirador}/units`, recibe 404 `NOT_FOUND`, y al pedir `GET /platform/communities` recibe 404 `NOT_FOUND`, porque esa ruta no existe en esta rebanada (D49).
- Y el alta queda en la auditoría de plataforma.
- Y las demás validaciones y su orden son los de GC CA-69, CA-76 y "Validaciones de la consola de Operaciones ComVive", con el nombre agregado (CM-A2) y el contacto sin condición (D54).
- Dada una persona de Soporte ComVive (`soporte-1`, rol `platform_support`) con sesión de plataforma y segundo factor (R2-m-7)
- Cuando pide crear una comunidad con un cuerpo válido, otorgar `admin` en la Comunidad C o revocar la membresía `admin` de Paula Henríquez
- Entonces recibe 404 `NOT_FOUND` en los tres casos, también con un JSON mal formado (paso 3a: su rol no tiene el permiso; ADR 0009, decisión 3; ADR 0006, decisión 1), nada cambia y las tres peticiones quedan en la auditoría de plataforma (CM-G3).

**CA-CM-2 · Datos de la comunidad**

- Dado el administrador de la Comunidad C, recién creada (dirección, comuna y tipo vacíos)
- Cuando guarda solo la dirección "Av. Los Leones 1234" y la comuna "Providencia"
- Entonces quedan guardadas, el nombre no cambia y el tipo sigue vacío, y `community.update` queda en auditoría con los dos campos.
- Cuando guarda el tipo "edificio"
- Entonces queda guardado.
- Cuando guarda el nombre vacío
- Entonces recibe 422 `COMMUNITY_NAME_REQUIRED` con "Ingresa el nombre de la comunidad" y nada cambia.
- Cuando guarda el nombre vacío y la comuna vacía
- Entonces recibe solo 422 `COMMUNITY_NAME_REQUIRED` (orden de validación).
- Cuando guarda el tipo con valor nulo
- Entonces recibe 422 `COMMUNITY_TYPE_REQUIRED` con "Elige el tipo de comunidad: edificio o condominio".
- Cuando envía el tipo "torre" o un campo `rut`
- Entonces recibe 400 `BAD_REQUEST` y nada cambia (CM-A3).
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
- Cuando envía un lote de tres filas de alta: fila 1 "Depto 41" válida, fila 2 sin código y fila 3 "Depto 42" con alícuota 1000001
- Entonces recibe 422 `UNITS_INVALID` con la fila 2 (`UNIT_CODE_REQUIRED`) y la fila 3 (`INVALID_ALIQUOT`, "La alícuota debe estar entre 0 % y 100 %"), y no se crea ninguna de las tres, tampoco Depto 41.
- Cuando envía un lote con dos filas de alta "Depto 41" y "depto 41"
- Entonces recibe 422 `UNITS_INVALID` solo con la fila 2, código `UNIT_CODE_ALREADY_EXISTS` y "El código Depto 41 está repetido en la fila 1", y no se crea nada.
- Cuando envía un lote con 501 filas
- Entonces recibe 422 `UNITS_BATCH_TOO_LARGE` con "Puedes guardar hasta 500 unidades por vez. Divide la carga en partes".
- Cuando en un lote edita el orden de Depto 21 (3) a 4 y el de Depto 22 (4) a 3
- Entonces el lote se acepta, Depto 21 queda con 4 y Depto 22 con 3, y un `unit.batch` queda en auditoría.

**CA-CM-7 · Cambio de alícuotas después de un periodo emitido (Comunidad A, regla 6; GOLD-ACM7)**

- Dada la Comunidad A del estado de CA-1, sin arrendatarios, con `2026-10` emitido el 2026-11-01 (cargos GOLD-A: Depto 101 $210.000, Depto 102 $262.500, Depto 201 $262.500, Depto 202 $315.000) y el borrador `2026-11` con gastos ordinarios por $1.000.000 y fondo 5 %
- Cuando el 2026-11-20 el administrador envía un lote que edita Depto 101 de 200000 a 190000 y Depto 202 de 300000 a 310000, sin motivo
- Entonces recibe 422 `REASON_REQUIRED` con "Indica el motivo del cambio y el documento que lo respalda" y nada cambia.
- Cuando lo reenvía con el motivo "Modificación del reglamento, asamblea extraordinaria del 18-11-2026"
- Entonces el cambio se guarda, la suma sigue en 1.000.000 (190.000 + 250.000 + 250.000 + 310.000) y queda en auditoría con los valores anteriores y nuevos y el motivo.
- Y los cargos de `2026-10` no cambian: la foto de `2026-10` conserva 200000 y 300000.
- Cuando se emite `2026-11` el 2026-12-01, con fondo (1.000.000 × 500 + 9.999) div 10.000 = $50.000
- Entonces los cargos son GOLD-ACM7-01 a 04: Depto 101: 190.000 + 9.500 = $199.500; Depto 102: 250.000 + 12.500 = $262.500; Depto 201: $262.500; Depto 202: 310.000 + 15.500 = $325.500; suma 199.500 + 262.500 + 262.500 + 325.500 = $1.050.000 (regla 3 de `CLAUDE.md`).
- Cuando el 2026-12-02, después de emitir `2026-11`, el administrador anula el gasto "Aseo y artículos" de `2026-10` (la acción de GC CA-33, con otra fecha; D58)
- Entonces el Depto 101 recibe dos notas de crédito, −$10.000 en el ordinario y −$500 en el fondo, en total −$10.500, calculadas con la foto de `2026-10` (20 %), igual que GOLD-A33-01 (GOLD-ACM7-05), y no con el 19 % actual.
- Y las notas quedan en el borrador `2026-12`, porque `2026-11` ya está emitido; los cargos de `2026-11` (GOLD-ACM7-01 a 04, suma $1.050.000) no las incluyen y no cambian.

**CA-CM-8 · Cambio de alícuotas y vista previa de emisión (Comunidad A, M-1)**

- Dado el estado de CA-CM-7 antes del cambio, y una vista previa de emisión de `2026-11` pedida el 2026-11-30, con su `previewHash`
- Cuando el administrador, con motivo, envía el lote de CA-CM-7 (Depto 101 a 190000 y Depto 202 a 310000; la suma sigue en 1.000.000)
- Y confirma la emisión con el `previewHash` de la vista previa anterior
- Entonces recibe 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir" y no se crea nada (GC A-7).
- Dado, en cambio, el mismo estado inicial y la misma vista previa
- Cuando el administrador edita solo Depto 101 a 190000, con motivo
- Entonces el cambio se guarda con la advertencia "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas".
- Cuando confirma la emisión con el `previewHash` anterior
- Entonces recibe 422 `ALIQUOTS_NOT_100` con "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %", y no 409, porque `PREVIEW_OUTDATED` va al final (ADR 0003, decisión 9), y no se crea nada.
- Dado, en otro escenario, el mismo estado inicial y la misma vista previa
- Cuando el administrador cambia el código "Depto 101" a "Dpto. 101", sin motivo
- Entonces el cambio se guarda sin pedir motivo, aunque `2026-10` está emitido: cambiar solo el código no lo exige (CM-B7; R2-m-3).
- Cuando confirma la emisión con el `previewHash` anterior
- Entonces la emisión procede: cambiar el código no cambia lo que se va a escribir (CM-B7).

**CA-CM-9 · Eliminación de una unidad (M-6)**

- Dada la Comunidad C con las unidades de CA-CM-3, sin periodos emitidos, y "Depto 41" creada por error, sin ocupaciones
- Cuando el administrador elimina "Depto 41"
- Entonces la unidad deja de existir, la suma vuelve a 1.000.000 y `unit.delete` queda en auditoría.
- Dada la Comunidad A con `2026-10` emitido
- Cuando el administrador intenta eliminar el Depto 101, con o sin motivo
- Entonces recibe 409 `UNIT_IN_USE` con "Esta unidad ya tiene ocupantes, movimientos, gastos o periodos emitidos. No se puede eliminar" y nada cambia.
- Dada una unidad con un arriendo programado que luego se canceló, sin periodos emitidos
- Cuando el administrador intenta eliminarla
- Entonces recibe 409 `UNIT_IN_USE`.
- Y la prueba de eliminación verifica que cada clave foránea hacia la unidad está cubierta por la regla CM-B8; una tabla nueva con referencia a la unidad que no esté cubierta hace fallar la prueba.

**CA-CM-10 · Permisos sobre unidades (Comunidad A)**

- Dado un miembro del comité de la Comunidad A (`comite-A`, Rosa Díaz)
- Cuando lista las unidades
- Entonces recibe las cuatro, con código, tipo y alícuota, y `aliquotSumE6` = 1.000.000.
- Cuando intenta crear, editar, enviar un lote o eliminar una unidad
- Entonces recibe 403 `FORBIDDEN` y nada cambia.
- Dada la propietaria del Depto 101 (`propietario-101`, Ana Pérez, sin otros roles)
- Cuando lista las unidades
- Entonces recibe solo el Depto 101, sin `aliquotSumE6` ni advertencia de suma.
- Cuando pide el Depto 102, crea una unidad o edita el Depto 101
- Entonces recibe 404 `NOT_FOUND` en los tres casos (no ve el Depto 102 ni la configuración de unidades).

**CA-CM-11 · Aislamiento de unidades entre comunidades (regla 4; M-4)**

- Dado el administrador de la Comunidad A (`admin-A`), sin membresía en la Comunidad B
- Cuando lista las unidades de la Comunidad B, pide la Casa 1 de B por la ruta de B, o edita la Casa 1 de B por la ruta de B
- Entonces recibe 404 `NOT_FOUND` con el mismo cuerpo en los tres casos y en un id inexistente, y nada cambia en B.
- Cuando pide o edita la Casa 1 de B por la ruta de la Comunidad A (`/communities/{A}/units/{id de Casa 1}`)
- Entonces recibe 404 `NOT_FOUND` antes de validar el cuerpo, también con un JSON mal formado (ADR 0009, paso 3b), y nada cambia.
- Cuando envía por la ruta de A un lote con una fila válida que edita el Depto 101 y otra fila con el `unitId` de la Casa 1 de B
- Entonces recibe 404 `NOT_FOUND`, con el mismo cuerpo que con un `unitId` inexistente, antes de la idempotencia y de validar las filas, y no cambia nada en A ni en B.
- Cuando envía un lote con el mismo `unitId` en dos filas
- Entonces recibe 400 `BAD_REQUEST`.
- Cuando crea en A una unidad con el código "Casa 1", que existe en B
- Entonces se crea: la unicidad del código es por comunidad.
- Y la respuesta de A nunca incluye unidades, sumas de alícuotas ni datos de B.

**CA-CM-12 · RUT que existe solo en otra comunidad (Comunidades A y B; D48, ISO-7)**

- Dado el administrador de la Comunidad A, el Depto 102 sin arrendatario (estado de CA-1), Felipe Rojas (RUT 22.456.789-8), administrador de la Comunidad B con contacto verificado y sin ficha en A, y el RUT 11.111.111-1, que no existe en ComVive
- Cuando pide la vista previa del alta de Felipe Rojas como arrendatario del Depto 102, con el nombre "F. Rojas" y el correo `frojas@example.com`
- Y pide la misma vista previa con el RUT 11.111.111-1, el mismo nombre y el mismo correo
- Entonces las dos respuestas tienen los mismos campos, la misma estructura y los mismos textos, y solo difieren en el RUT que se envió; ninguna dice que la persona ya tiene cuenta en ComVive ni si se creará una persona nueva, y ninguna trae su nombre registrado en B, su contacto, sus comunidades ni sus roles.
- Cuando confirma el alta de Felipe Rojas
- Entonces se crean su ficha en A con el nombre "F. Rojas" y el correo `frojas@example.com`, y una membresía de residente en A, y su contacto verificado no cambia.
- Y su membresía `admin` en B, su ficha en B y su contacto no cambian, y el administrador de B no ve nada de A.

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

**CA-CM-14 · Propietario como arrendatario y venta al arrendatario (Comunidad A, flag encendido)**

- Dado el Depto 102, de Luis Muñoz (12.345.670-K), con O-1 de Pedro Soto (15.234.567-4) vigente desde el 2026-11-15, y hoy 2026-12-02
- Cuando el administrador registra a Luis Muñoz como arrendatario del Depto 102
- Entonces recibe 422 `OWNER_CANNOT_BE_TENANT` con "Esta persona es propietaria de la unidad. No puede ser también su arrendataria" (antes que el 409 `TENANT_ALREADY_ACTIVE`, que también aplicaría).
- Cuando registra la venta del Depto 102 a Pedro Soto, con fecha 2026-12-01 (pasada, así que no aplica `END_DATE_IN_FUTURE`)
- Entonces recibe 409 `BUYER_IS_CURRENT_TENANT` con "Esta persona es la arrendataria vigente o programada de la unidad. Registra primero el término o la cancelación de su arriendo" y nada cambia.
- Cuando primero registra el término de O-1 con fecha 2026-12-02 y después la venta a Pedro Soto con fecha 2026-12-02
- Entonces ambas se aceptan, y las vistas previas no traen ninguna sección ni texto sobre deuda o dinero (CM-E6).
- Y al terminar O-1, Pedro Soto pierde su membresía de residente (no le queda otra ocupación, CM-D5); al registrarse la venta recibe una membresía nueva, con la que ve el Depto 102 como propietario (GC S-14, S-51).
- Y el traspaso de la deuda del ámbito de O-1 al ámbito `owner` (GC F-9, CA-21) no se verifica aquí: es un CA de la rebanada del libro, que no puede encender el flag sin él (D51).

**CA-CM-15 · Membresía de residente con varias ocupaciones (Comunidad A; M-8 (a))**

- Dado Marco Silva (18.234.765-5), propietario del Depto 202, a quien se registra también como propietario faltante del Depto 201 en un escenario sin Rosa Díaz
- Entonces tiene una sola membresía de residente y una sola ficha en la Comunidad A, y ve las fichas de unidad del Depto 201 y del Depto 202.
- Cuando se registra la venta del Depto 201 a otra persona (flag encendido)
- Entonces su membresía sigue vigente y desde ese momento recibe 404 en el Depto 201 y sigue viendo el Depto 202.
- Cuando se registra la venta del Depto 202 (flag encendido)
- Entonces su membresía de residente termina con la revocación de GC S-81: se eliminan sus suscripciones push de esa membresía, su sesión no cambia y la Comunidad A le responde 404.
- Dada Daniela Fuentes (O-4, 13.579.246-2), arrendataria programada del Depto 102 con `effective_from` 2026-12-05, registrada el 2026-11-25
- Entonces su membresía de residente tiene `valid_from` 2026-12-05 y, antes de esa fecha, la Comunidad A le responde 404 (GC CA-53).
- Cuando el 2026-11-27 el administrador la registra además como arrendataria del Depto 202, en un escenario donde esa unidad no tiene arrendatario, con ingreso declarado 2026-11-20
- Entonces la nueva ocupación queda vigente con `effective_from` 2026-11-27, su membresía de residente pasa a `valid_from` 2026-11-27 (no se crea otra), `membership.update_validity` queda en auditoría con 2026-12-05 y 2026-11-27, y desde ese momento ve el Depto 202 y recibe 404 en el Depto 102 hasta el 2026-12-05.
- Dado, en otro escenario, que Daniela solo tiene O-4
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
- Cuando un administrador intenta revocar la membresía `admin` de Héctor Molina por la ruta de comunidad, o la propia, con un cuerpo válido
- Entonces recibe 403 `FORBIDDEN` y nada cambia.
- Cuando lo intenta con un JSON mal formado
- Entonces recibe 400 `BAD_REQUEST`, porque ese 403 se evalúa en el paso 4 (E-CM-1, D57), y nada cambia.
- Cuando intenta revocar la membresía de residente de Ana Pérez, u otorgar a alguien el rol `resident`, por la ruta de membresías
- Entonces recibe 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` con "El rol de residente nace y termina con la ocupación. Registra el arriendo, su término o la venta en la unidad".
- Cuando intenta otorgar el rol `concierge`, o el rol de comité con un `validTo`
- Entonces recibe 400 `BAD_REQUEST` (D50; CM-D2).
- Dado un miembro vigente del comité
- Cuando intenta revocar la membresía de otro miembro del comité
- Entonces recibe 404 `NOT_FOUND`, porque no ve las membresías.

**CA-CM-17 · Retirado en la rev. 2 (conserjería pospuesta, D50).**

**CA-CM-18 · "Usuarios y roles" (Comunidad A)**

- Dado el estado de GC CA-43: Carolina Lagos y Héctor Molina administradores, otorgados por Operaciones; Rosa Díaz en el comité, otorgado por Carolina Lagos el 2026-10-22 con la asamblea del 2026-10-20 y la referencia "Asamblea ordinaria del 20-10-2026" (fecha del otorgamiento: dato de escenario)
- Cuando el administrador pide "Usuarios y roles"
- Entonces recibe: administradores (nombre, RUT completo, desde, "Otorgado por ComVive", estado de ingreso) y comité (Rosa Díaz, Depto 201, desde 2026-10-22, asamblea 2026-10-20 con su referencia, estado de ingreso), y no recibe residentes.
- Y con el filtro de historial recibe cada otorgamiento y revocación con quién, a quién, cuándo, vía y referencia o motivo; en los de administrador, "Quién" es "Operaciones ComVive" y la vía es `platform`.
- Y la lectura queda en auditoría.
- Y una membresía cuya persona ya hizo su primer ingreso en esa comunidad muestra "Activo"; una cuya persona solo ingresó a otra comunidad, "Pendiente" (GC D27).
- Dado un miembro del comité o un residente
- Cuando pide "Usuarios y roles"
- Entonces recibe 404 `NOT_FOUND`.

**CA-CM-19 · Corrección de la ficha (Comunidad A; menor 7)**

- Dado Pedro Soto, arrendatario del Depto 102 (O-1), con ficha "Pedro Sotto" y celular +56 9 1111 2222
- Cuando el administrador corrige la ficha a "Pedro Soto" y +56 9 3333 4444
- Entonces la ficha queda con los datos nuevos, `person_record.update` queda en auditoría con los valores anteriores enmascarados, y el historial de ocupaciones del Depto 102 leído por el administrador muestra a "Pedro Soto" con el celular `+56933334444`.
- Y si Pedro Soto ya tenía un contacto de ingreso verificado, ese contacto no cambia en `PERSON`.
- Y, como requisito de la rebanada "Ingreso e invitaciones" (D55-2), que lo verifica allá: si Pedro Soto tenía una sesión obtenida con +56 9 1111 2222, desde la petición siguiente a la corrección toda ruta de la Comunidad A le responde 404 y A no aparece en "Mis comunidades"; vuelve a entrar con una invitación a +56 9 3333 4444.
- Cuando intenta cambiar el RUT por esta acción
- Entonces recibe 400 `BAD_REQUEST`.
- Dado que O-1 terminó y Pedro Soto ya no tiene membresías vigentes en la Comunidad A
- Cuando el administrador corrige su nombre en la ficha
- Entonces la corrección se acepta (S-CM-29).
- Dada la ficha de Héctor Molina, administrador vigente de la Comunidad A
- Cuando otro administrador intenta corregirla con un cuerpo válido, o con el nombre vacío
- Entonces en los dos casos recibe 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` con "Los datos de un administrador los corrige ComVive" (antes que `PERSON_NAME_REQUIRED`; D57) y nada cambia.
- Dado un miembro del comité
- Cuando intenta corregir cualquier ficha
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

**CA-CM-21 · Término de un arriendo que no está vigente (Comunidad A, flag encendido)**

- Dado O-5 (Ignacio Paz), arriendo programado del Depto 102 con `effective_from` 2026-12-10, consultado el 2026-11-29
- Cuando el administrador pide la vista previa del término con fecha 2026-12-15 (futura)
- Entonces recibe 409 `OCCUPANCY_NOT_STARTED` con "Este arriendo aún no comienza. Si no comenzará, cancélalo", y no 422 `END_DATE_IN_FUTURE`, porque el estado va antes que la fecha.
- Dado O-4 cancelado el 2026-11-26 (GC CA-61)
- Cuando pide la vista previa de su término
- Entonces recibe 409 `OCCUPANCY_CANCELLED` con "Este arriendo ya fue cancelado".

**CA-CM-22 · Carga inicial de propietarios con fecha antigua (Comunidad C)**

- Dada la Comunidad C con las unidades de CA-CM-3, sin periodos emitidos, el 2026-11-12, con el flag apagado
- Cuando el administrador registra como propietario faltante del Depto 11 a una persona con fecha de inscripción declarada 2015-03-01
- Entonces la ocupación queda vigente con fecha declarada 2015-03-01 y `effective_from` 2026-11-12, y su membresía de residente con `valid_from` 2026-11-12.
- Y la vista previa muestra la advertencia de GC F-14 "La fecha de venta es anterior a hoy. Los avisos ya emitidos siguen a nombre del propietario anterior y la deuda de la unidad no cambia" (S-CM-20).
- Y no se crea ningún movimiento ni cambia ningún ámbito, porque no hay cargos emitidos.

**CA-CM-23 · Aislamiento de membresías, fichas y ocupaciones entre comunidades (regla 4; M-4)**

- Dado el administrador de la Comunidad A, sin membresía en B
- Cuando revoca, por la ruta de A, el `membershipId` de un miembro del comité de B, o corrige, por la ruta de A, el `personRecordId` de una ficha de B
- Entonces recibe 404 `NOT_FOUND` antes de validar el cuerpo, con el mismo cuerpo que un id inexistente, y nada cambia en A ni en B.
- Cuando otorga, por la ruta de A, el rol de comité con el `personRecordId` de la ficha de una persona que solo es propietaria en B
- Entonces recibe 404 `NOT_FOUND` en el paso 4, con el mismo cuerpo que con un id inexistente, y nada cambia.
- Cuando otorga, por la ruta de A, el rol `admin` con ese mismo `personRecordId` de B
- Entonces recibe 404 `NOT_FOUND` y no 403: en el paso 4 la visibilidad del `personRecordId` va antes que el permiso de `role = admin` (CM-D2; R2-m-2). Con un `personRecordId` de A y `role = admin`, recibe 403 `FORBIDDEN`.
- Cuando registra un arrendatario en una unidad de B por la ruta de A
- Entonces recibe 404 `NOT_FOUND`.
- Cuando pide "Usuarios y roles" o el registro de copropietarios de A
- Entonces la respuesta no incluye ninguna persona, ficha, membresía ni ocupación de B, aunque la persona tenga membresías en ambas.
- Y cada endpoint de esta spec tiene su prueba de aislamiento generada desde la matriz "Qué recursos ve cada rol" (ADR 0002, decisión 5; ADR 0009, prueba de barrido 10).

**CA-CM-24 · Contacto sin verificar por comunidad (Comunidades A y B; D47, D55, C-1)**

- Dada Sofía Navarro, la persona X (RUT 17.654.321-3, de `docs/qa/comunidades-simuladas.md`; R2-m-4), sin ningún contacto verificado, registrada por el administrador de A como arrendataria del Depto 102 con el celular c1 = +56 9 1111 1111, y por el administrador de B como arrendataria de la Casa 2 con el correo c2 = `x@example.com`
- Entonces X tiene una ficha en A con c1 y otra en B con c2, ningún contacto de ingreso verificado, y el administrador de A no ve c2 ni el de B ve c1 (se verifica en la rebanada 1).
- Y, como requisito de la rebanada "Ingreso e invitaciones" (CM-F3), que lo verifica allá:
  - Cuando X acepta la invitación de A ingresando el código enviado a c1
  - Entonces su sesión ve la Comunidad A y no la B: toda ruta de B le responde 404 y B no aparece en "Mis comunidades"; un ingreso posterior con c1 tampoco ve B.
  - Cuando B le envía su propia invitación
  - Entonces el código va a c2, nunca a c1, y solo al ingresarlo se habilita B.
  - Y si B hubiera registrado también c1 en su ficha, la verificación de c1 por la invitación de A habilitaría también B (D47).
  - Cuando, con la sesión obtenida por c1 y B aún no habilitada, X intenta agregar o cambiar un contacto verificado, activar un segundo factor o cerrar otras sesiones
  - Entonces la acción se rechaza y nada cambia en su identidad (D55-3).
  - Cuando X ya tiene c1 y c2 verificados y hace un ingreso normal
  - Entonces el código va a c1 y a c2, y si ingresa el código recibido en c1, su sesión ve solo A (D55-4).
  - Cuando, después de que X habilitó A con c1, el administrador de A corrige su ficha a c3 = +56 9 4444 5555
  - Entonces desde la petición siguiente la sesión obtenida con c1 recibe 404 en toda ruta de A, A deja de aparecer en "Mis comunidades", el cambio queda en auditoría y X vuelve a entrar a A solo con una invitación a c3 (D55-1 y D55-2).

**CA-CM-25 · Persona que ya tiene ficha en la comunidad (Comunidad A; M-8 (b) y (c))**

- Dada Ana Pérez (12.345.678-5), propietaria del Depto 101, con ficha "Ana Pérez" y celular +56 9 2222 3333
- Cuando el administrador pide la vista previa del alta de Ana como arrendataria del Depto 202, en un escenario donde esa unidad no tiene arrendatario, con el nombre "Ana P." y el correo `ana@example.com`
- Entonces la vista previa dice "Esta persona ya está registrada en la comunidad como Ana Pérez. Se conservan su nombre y su contacto; para cambiarlos, usa Corregir datos".
- Cuando confirma el alta
- Entonces se crea la ocupación del Depto 202, Ana conserva una sola membresía de residente (CM-D5) y su ficha sigue con "Ana Pérez" y +56 9 2222 3333.
- Dado, en el escenario de GC CA-43, que Ana es además administradora de la Comunidad A
- Entonces "Usuarios y roles", el registro de copropietarios y el historial de ocupaciones la muestran con el mismo nombre de su única ficha.

**CA-CM-26 · Término y venta con el flag apagado (Comunidades A y C; D51)**

- Dado el flag `occupancy.end_and_transfer` apagado (valor por defecto) y O-1 vigente en el Depto 102
- Cuando el administrador pide la vista previa o la ejecución del término de O-1, o la de la venta del Depto 102 (que tiene propietario vigente), también con un RUT inválido
- Entonces recibe 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` con "El registro de términos de arriendo y de ventas aún no está disponible. Mientras tanto, pide ayuda a ComVive", y nada cambia.
- Cuando registra un propietario faltante en una unidad sin propietario de la Comunidad C, un arrendatario en una unidad sin arrendatario o la cancelación de un arriendo programado
- Entonces cada acción funciona como dice su regla.
- Y ninguna respuesta del módulo contiene un texto fijo que afirme que no se moverá dinero.
- Dada la configuración de despliegue de producción (CM-H1; D56)
- Cuando trae `occupancy.end_and_transfer` encendido y el traspaso de GC F-9 y F-13 aún no existe
- Entonces la prueba de configuración del CI falla y el cambio no se puede fusionar a `main`.
- Cuando no trae el flag
- Entonces la API lo considera apagado.
- Y ninguna ruta de la API, de comunidad ni de plataforma, permite leer ni cambiar el valor de un flag.

**CA-CM-27 · Otorgar administrador con nombre y contacto (Comunidad A; D52, D54)**

- Dada una persona de Operaciones y la Comunidad A
- Cuando otorga el rol `admin` a Valentina Ortiz (21.345.678-4) sin nombre, con un contacto válido y un motivo
- Entonces recibe 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre del administrador" y nada cambia.
- Cuando lo otorga con el nombre "Valentina Ortiz"
- Entonces se crean su ficha en A con ese nombre y ese contacto, y su membresía `admin`.
- Dado, en otro escenario, Felipe Rojas (22.456.789-8), administrador de la Comunidad B con un contacto verificado (dato de escenario) y sin ficha en A (R2-C-1)
- Cuando Operaciones le otorga `admin` en A con el nombre "Felipe Rojas", un motivo y sin celular ni correo
- Entonces recibe 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido del administrador", no se crea ficha ni membresía en A y no se usa su contacto verificado ni el de su ficha en B (D54).
- Cuando lo otorga con el correo `frojas.a@example.com`
- Entonces su ficha en A queda con ese correo, su ficha en B y su contacto verificado no cambian, y la respuesta a Operaciones es la misma que para una persona nueva en ComVive.
- Dado, en otro escenario, que Ana Pérez ya tiene ficha en A como propietaria con el nombre "Ana P."
- Cuando Operaciones le otorga `admin` con el nombre "Ana Pérez" y el celular +56 9 2222 3333
- Entonces su ficha en A queda con "Ana Pérez" y ese celular, la auditoría guarda los anteriores enmascarados y la respuesta a Operaciones no dice que la ficha existía (CM-A2).
- Y ese celular pasa a ser también el contacto de sus notificaciones como propietaria del Depto 101, y un administrador de A que intenta corregir su ficha recibe 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` (CM-A2; R2-m-9).

**CA-CM-28 · Persona sin RUT (Comunidad A; D53)**

- Dado el Depto 102 sin arrendatario
- Cuando el administrador intenta registrar como arrendatario a una persona extranjera que solo tiene pasaporte, sin RUT
- Entonces recibe 422 `INVALID_RUT` y no se crea ninguna ficha, ocupación ni membresía.
- Y los cargos que se emitan para el Depto 102 siguen en el ámbito `owner` (GC F-9).

## Casos borde

- **Unidad sin alícuota (0 %):** se guarda como "Sin participación"; no recibe cargos de grupos por alícuota, sí cargos directos y de partes iguales si está en el conjunto (GC C-5, CA-18). Cuenta en la suma con 0.
- **Unidad accesoria (bodega o estacionamiento) cuya alícuota está incluida en la del departamento:** se registra con 0 % (CM-B3). Si tiene otro propietario, se registra su propia ocupación de propietario.
- **Suma sobre 100 %:** se guarda con advertencia; la emisión por alícuota se bloquea (CM-B4, GC A-3.1).
- **Carga por partes:** cada alta deja la suma intermedia con advertencia; no hay error hasta emitir (CM-B4).
- **Comunidad con más de 500 unidades:** la carga y los cambios se hacen en varios lotes; entre lotes la suma puede quedar distinta de 100 % con advertencia, sin efecto hasta emitir (CM-B6, S-CM-8).
- **Intercambio de orden entre dos unidades:** solo con el lote (CM-B5, CA-CM-6).
- **Códigos "Depto 9" y "Depto 09" en la misma comunidad:** son códigos distintos; en el orden propuesto va primero "Depto 9" (CM-B5, S-CM-24).
- **Cambio de alícuotas con efecto retroactivo acordado por la asamblea:** ComVive no recalcula periodos emitidos ni cerrados; el cambio rige desde el borrador vigente (CM-B7, P-CM-1).
- **Cambio de alícuota entre la vista previa y la emisión:** 409 `PREVIEW_OUTDATED` si la suma sigue en 100 %; 422 `ALIQUOTS_NOT_100` si no (CM-B7, CA-CM-8).
- **Unidad nueva después de emitir (subdivisión o error de carga):** se acepta con motivo; no entra en ningún periodo emitido (CM-B7).
- **Unidad creada por error después de emitir, sin ocupaciones ni gastos que la nombren:** se puede eliminar con motivo, porque no está en ninguna foto (CM-B8).
- **Unidad que está en el conjunto de un gasto de partes iguales del borrador:** no se elimina, 409 `UNIT_IN_USE` (CM-B8; CA heredado por la rebanada de emisión).
- **Renombrar una unidad después de emitir:** se acepta sin motivo; los avisos emitidos conservan el código anterior (CM-B7, S-CM-11).
- **Dos administradores editan la misma unidad a la vez:** gana la última confirmada; ambas ediciones quedan en auditoría (CM-B9, S-CM-13).
- **Comunidad configurada sin unidades:** no se puede emitir (GC A-3.8).
- **Cambio de propietario a mitad de mes:** sin prorrateo por días; el aviso va al propietario a la fecha de emisión (GC CA-21). En la rebanada 1 la venta está detrás del flag (CM-E6). El vendedor pierde la membresía de residente si no le quedan ocupaciones (CM-D5).
- **Propietario de varias unidades:** una sola membresía de residente y una sola ficha; la venta de una no le corta el acceso a las otras (CM-D5, CA-CM-15).
- **Propietario de una unidad y arrendatario de otra en la misma comunidad:** una sola membresía de residente; ve el ámbito `owner` de la suya y el de su arriendo en la otra (S-CM-19).
- **Persona con una ocupación programada a la que se registra otra vigente:** su membresía de residente adelanta `valid_from`; no se crea otra (CM-D5, CA-CM-15).
- **Persona cuya ocupación vigente termina y le queda solo una programada:** su membresía de residente sigue vigente (CM-D5) y no ve ninguna unidad hasta que la programada comience (Supuesto (a validar), S-CM-26).
- **Arrendatario que compra la unidad que arrienda:** primero el término o la cancelación, después la venta (CM-E3, CA-CM-14).
- **Arriendo programado que se intenta terminar:** 409; se cancela (CM-E4, CA-CM-21).
- **Término o venta con el flag apagado:** 422 `OCCUPANCY_ACTION_NOT_AVAILABLE`; el propietario faltante, el alta y la cancelación siguen funcionando (CM-E6, CA-CM-26).
- **Persona que ya existe solo en otra comunidad:** la vista previa es idéntica a la de un RUT inexistente; se crean su ficha y su membresía con los datos de esta comunidad (CM-C4, CA-CM-12).
- **Persona que ya tiene ficha en esta comunidad, registrada con otro nombre o contacto:** se conservan los de la ficha y la vista previa lo dice; se cambian con la corrección (CM-C4, CA-CM-25).
- **Persona sin contacto verificado registrada con contactos distintos en dos comunidades:** cada ficha guarda el suyo; verificar uno habilita solo las comunidades que registran ese contacto (CM-C4, CM-F3, CA-CM-24).
- **Persona que pasa a ser administradora en una comunidad donde ya era propietaria:** el nombre y el contacto de Operaciones reemplazan los de su ficha, con auditoría; ese contacto pasa a ser también el de sus notificaciones de residente y nadie de la comunidad lo corrige mientras sea administradora (CM-A2, CA-CM-27, P-CM-16).
- **Administrador de otra comunidad, con contacto verificado, que recibe `admin` en una nueva:** Operaciones ingresa igual su contacto para esta comunidad; nunca se usa el verificado ni el de otra ficha (D54, CA-CM-27).
- **Corrección del contacto de una persona que ya ingresó con el anterior:** con la rebanada de ingreso, sus sesiones obtenidas con el contacto anterior dejan de ver la comunidad desde la petición siguiente (D55-2, CM-C6, CA-CM-24).
- **Código de unidad escrito con caracteres compuestos o descompuestos ("Ñ" o "N" más tilde combinada):** se guarda en NFC, así que es el mismo código (CM-B2).
- **Trabajo en segundo plano con el id de una unidad eliminada:** termina sin efecto y lo registra (CM-B8).
- **Persona sin RUT (solo pasaporte):** no se registra; la deuda de la unidad queda en el ámbito `owner` (CM-C7, CA-CM-28).
- **Propietario persona jurídica o comunidad hereditaria:** se registra con su RUT y el nombre de la entidad, con el contacto de su representante; su ingreso queda pospuesto (S-CM-16, P-CM-10).
- **Unidad con varios propietarios (copropiedad de la unidad):** se registra uno; los demás quedan fuera del MVP (`docs/arquitectura.md` §4, "Unicidad"; UX-40; P-CM-10).
- **Ocupantes que no son propietarios ni arrendatarios (familiares, ocupantes por otro título):** no se registran en el MVP (P-CM-11).
- **RUT mal registrado:** no se edita; ver P-CM-7.
- **Rectificación de un ex residente:** su ficha se corrige aunque no tenga membresías vigentes (CM-C6, CA-CM-19).
- **Administrador que es propietario en la misma comunidad:** se permite (roles unidos, ADR-0009-S4), con una sola ficha; no puede integrar el comité (GC S-43).
- **Revocación de comité con una tarea "Revisar rol de comité" abierta:** la tarea se cierra con `revoked_elsewhere` (GC M-7, CM-D4).
- **Revocación en una comunidad de una persona con membresías en otra:** la otra no cambia (GC S-81, CA-75).
- **Pagos parciales, pagos duplicados y periodos cerrados con movimientos:** no son de este módulo; ver GC F-1 a F-6, CA-10, CA-11 y la sección H. Lo que toca a este módulo es que ningún cambio de unidades altera un periodo emitido o cerrado (CM-B7).
- **Reintento con la misma clave de una escritura rechazada:** se reevalúa (GC D12).

## Fuera de alcance

- Crear, enviar, reenviar, aceptar y vencer invitaciones, el ingreso con RUT y código y la habilitación por contacto de D47: rebanada "Ingreso e invitaciones" (CM-F1, CM-F3).
- "Mis comunidades", "Mi cuenta" y el segundo factor del administrador (rutas `/me/` y `/auth/`, ADR-0009-S5).
- Las lecturas de la consola de Operaciones (`GET /platform/communities` y `GET /platform/communities/{communityId}/admin-memberships`): tarjeta de la consola, con la actualización de ADR 0002 y ADR 0006 (D49).
- La conserjería completa: otorgar, revocar, datos del conserje y lo que ve (spec de conserjería, D50).
- Activar término de arriendo y venta, y el traspaso de deuda con su sección de la vista previa: rebanada del libro de movimientos (CM-E6, D51).
- Medios de pago, configuración de cobro, primer mes a cobrar y primer borrador (GC A-2, D-2, E-1, G-2): rebanada de emisión.
- Importación desde planilla (UX-16), con su archivo y su tabla de errores: tarjeta propia que reutiliza el lote (P-CM-3).
- Lista de puesta en marcha, etiqueta "Configuración pendiente" y la pantalla "Registro de auditoría": con la web.
- Autoservicio del administrador para crear comunidades (decisión del líder; supuesto del flujo de alta).
- Fusión y subdivisión de unidades como operación propia; varios propietarios por unidad; coarrendatarios (UX-35); ocupantes que no son propietarios ni arrendatarios; personas sin RUT (D53).
- Pesos relativos por unidad (`UNIT.share_weight`) distintos de 1 (P-CM-2).
- Registro Nacional de Administradores: ComVive no guarda ni verifica la inscripción del administrador (P-CM-12).
- Ejercicio de derechos de la Ley 21.719 desde la app ("Ejercer mis derechos"), retención y supresión de datos de ex residentes (`docs/arquitectura.md` §8, pregunta 7).

## Supuestos (a validar)

| Id | Supuesto | Fuente o razonamiento |
| --- | --- | --- |
| S-CM-1 | Códigos y textos nuevos de la tabla "Códigos y mensajes de error nuevos". Los de alícuota, código y orden repetidos vienen del diseño aprobado; el resto los propone el analista. Se reutilizan `COMMUNITY_NAME_REQUIRED`, `REASON_REQUIRED`, `INVALID_CONTACT`, `OCCUPANCY_NOT_STARTED`, `OCCUPANCY_CANCELLED` y `ROLE_ALREADY_REVOKED` con textos por acción, como ya hace GC con `REASON_REQUIRED` y `END_DATE_IN_FUTURE`. | Convención de GC "Códigos y mensajes de error" (409 estado, 422 entrada). Textos del diseño: `docs/design/flujos/admin-alta-comunidad.md` y WEB-ALT-04. Convención propia, sin efecto legal. |
| S-CM-2 | Órdenes de validación de "Orden de validación por acción", incluido que en el término de un arriendo el estado va antes que la fecha; en la eliminación de una unidad, el estado antes que el motivo; en el lote, el motivo después de las filas; en la corrección de una ficha, `ADMIN_RECORD_MANAGED_BY_COMVIVE` antes que los datos; al otorgar, el 404 del `personRecordId` antes que el 403 de `role = admin`; y que con el flag apagado el término y la venta responden antes de validar cualquier dato. | Mismo criterio que GC S-34, S-63 y CA-61: datos primero, conflictos al final, salvo que no tenga sentido pedir un dato de una acción imposible. Propuesta del analista. |
| S-CM-3 | El administrador no edita el RUT de la comunidad; lo corrige Operaciones por un procedimiento auditado. | El RUT es la clave de unicidad de la comunidad en ComVive (GC S-63, `COMMUNITY_ALREADY_EXISTS`, P-49). El flujo de alta dice que el RUT "se puede revisar", no editar. |
| S-CM-4 | Tipos de unidad: departamento, casa, estacionamiento, bodega y local. El tipo es informativo. | Lista del flujo de alta (`docs/design/flujos/admin-alta-comunidad.md`, paso 4). Puede faltar "oficina" en edificios mixtos (P-CM-13). |
| S-CM-5 | El código de unidad se guarda en Unicode NFC, con tildes y ñ, y se compara sin mayúsculas y con espacios normalizados; máximo 30 caracteres. | Evita "Depto 101" y "depto 101" como dos unidades, que confundirían avisos y pagos, y que "Depto Ñ" escrito con caracteres compuestos o descompuestos sean dos códigos que se ven iguales (R2-m-5). NFC es la forma que usan por defecto los teclados y navegadores. Convención propia. |
| S-CM-6 | La API recibe la alícuota como entero `aliquotE6`; la conversión desde el texto (hasta 4 decimales, coma o punto) es una función de `packages/shared`, sin punto flotante. | `docs/arquitectura.md` §4 (`aliquot_e6`), `docs/design/arquitectura-de-informacion.md` ("Alícuotas") y la regla 1 de `CLAUDE.md` aplicada por analogía. Así la API no interpreta formatos regionales y la importación futura usa la misma función. |
| S-CM-7 | Si el alta no trae el orden, la API asigna los números siguientes al mayor existente, en orden natural de los códigos del lote. | GC C-4 ("el sistema propone un valor inicial en orden natural del código"). Asignar después del mayor existente evita mover órdenes ya usados en periodos emitidos. Convención propia. |
| S-CM-8 | Un solo endpoint de lote (altas y ediciones), todo o nada, que responde 422 `UNITS_INVALID` con el primer error de cada fila inválida y acepta hasta 500 filas (422 `UNITS_BATCH_TOO_LARGE` sobre eso). | El diseño de la importación ya es todo o nada con tabla de errores por fila (`docs/design/flujos/admin-alta-comunidad.md`). 500 filas caben en el límite de 100 kB de ADR-0009-S3 (menor 3) y superan con holgura las comunidades del Piloto. Es la única excepción a "una respuesta, un código" (GC "Orden entre reglas de negocio"); el esquema de error lo define el arquitecto (ADR 0003, decisión 1). |
| S-CM-9 | Un cambio de alícuotas rige desde el borrador vigente; no se recalcula ni se ajusta ningún periodo emitido o cerrado. | Regla 6 de `CLAUDE.md`; foto de participaciones (GC "Definiciones"; ADR 0004, decisión 7 y "Alternativas": leer las alícuotas actuales al recalcular un periodo pasado no es reproducible). Si la asamblea acuerda un efecto retroactivo, cómo se cobra queda en P-CM-1. |
| S-CM-10 | Desde el primer periodo emitido, todo cambio que afecte el prorrateo (alta, alícuota, orden, eliminación) exige un motivo que nombre el documento que lo respalda. Antes de emitir, no. El código y el tipo nunca lo exigen. | Las alícuotas las fija el reglamento de copropiedad y su modificación exige asamblea extraordinaria (Ley 21.442, art. 15, según MINVU; numeración en GC P-1); GC "Casos borde" ya dice que un cambio de alícuotas requiere modificar el reglamento. El diseño propone "edición con advertencia, motivo obligatorio y auditoría; afecta solo a periodos futuros" (UX-15). Antes de emitir, el administrador está cargando datos y pedir motivo en cada fila no agrega control. ComVive guarda el texto sin validar el acuerdo, como GC S-49. |
| S-CM-11 | Los avisos emitidos conservan el código de unidad con que se generaron; las pantallas muestran el código actual. | GC G-5 (el PDF se genera una vez). Guardar el código en la foto de cada periodo sería más exacto, pero no lo pide ninguna regla; lo decide el arquitecto. |
| S-CM-12 | Una unidad se elimina solo si ninguna fila de negocio la referencia (lista de CM-B8), y toda tabla nueva que la referencie entra en la verificación, con una prueba que recorre las claves foráneas; la auditoría conserva sus datos. Las referencias sin clave foránea (el `payload` de `JOB`) no impiden eliminar: todo trabajo que lea una unidad por id tolera que no exista, con su prueba. | Reglas 2, 3, 5 y 6 de `CLAUDE.md`: nada que haya participado en dinero, ni que cambie un reparto del borrador, se borra. Una ocupación cancelada también cuenta, porque está en el historial y en la auditoría (M-6). Tolerar en los trabajos (R2-m-6) sigue a ADR 0008, que ya exige trabajos idempotentes y reejecutables, y evita buscar ids dentro de cada `payload`. Lo confirma el arquitecto (P-CM-20). |
| S-CM-13 | Dos ediciones concurrentes de la misma unidad: gana la última confirmada, sin control de versión. La emisión no se intercala con un cambio de unidades. | Comunidades pequeñas con pocos administradores; la emisión ya está protegida por su vista previa con huella (GC A-7). Si el Piloto muestra conflictos, se agrega una versión por unidad. |
| S-CM-14 | Retirado en la rev. 2 (conserjería pospuesta, D50). | — |
| S-CM-15 | En el MVP solo se registran personas con RUT, también arrendatarios. Los extranjeros con residencia en Chile tienen RUN, que es su RUT. Sin RUT no se crea ocupación propia y la deuda de la unidad queda en el ámbito `owner` (D53). | UX-8 del diseño y `docs/design/flujos/residente-primer-ingreso.md`: la persona se reconoce por su RUT y sin él no puede ingresar. Práctica en Chile: el Servicio de Registro Civil e Identificación entrega cédula con RUN a los extranjeros con residencia, y el SII asigna RUT a quien no tiene RUN y lo necesita para actos tributarios (fuentes por verificar con el abogado). UX-40 menciona residentes con pasaporte: quedan fuera del MVP (P-CM-19). Minimización (Ley 21.719): es el único identificador que se pide. |
| S-CM-16 | Se aceptan como propietarios personas jurídicas y comunidades hereditarias, con su RUT, el nombre de la entidad y el contacto de su representante. Su ingreso queda pospuesto hasta P-CM-10: la rebanada de ingreso no les envía invitaciones. Cómo se distingue su RUT lo fija esa rebanada (por ejemplo, el rango desde 50.000.000, práctica del SII por verificar). | El registro de copropietarios individualiza al copropietario de cada unidad (Ley 21.442 y DS N° 7 de 2025, art. 6, según MINVU), que puede ser una empresa o una sucesión con RUT propio (SII). Riesgo (C-1): una entidad con representantes distintos en varias comunidades; el ingreso compartido queda pospuesto por D47. |
| S-CM-17 | Retirado en la rev. 2 (D47: se elimina "el primero registrado es el contacto de ingreso"; ver S-CM-21 y CM-F3). | — |
| S-CM-18 | El arrendatario no ve datos del propietario. | Minimización (Ley 21.719): el arrendatario paga su ámbito y no necesita identificar al propietario en ComVive (GC S-25 ya le oculta la deuda del ámbito `owner`). |
| S-CM-19 | Una persona no es arrendataria de una unidad de la que es propietaria, ni compra la unidad que arrienda sin terminar antes su arriendo; sí puede ser propietaria de una unidad y arrendataria de otra. | Los ámbitos `owner` y `occupancy` de una misma unidad separan responsables distintos (GC F-9, S-19); con la misma persona en ambos, el pago y la visibilidad por ámbito pierden sentido. Convención propia. |
| S-CM-20 | En la carga inicial se usan las mismas acciones y advertencias de GC F-14, con las fechas declaradas reales. | GC F-14 y P-27 (cerrada): todo rige desde el registro. Sin cargos emitidos no hay efecto en ámbitos. El diseño puede ajustar la ayuda de pantalla. |
| S-CM-21 | El nombre y el contacto registrado se guardan en una ficha por (persona, comunidad), compartida por todas las membresías de la persona en esa comunidad. Un registro posterior en la misma comunidad conserva la ficha; solo la corrección de CM-C6 la cambia (salvo el otorgamiento de `admin`, S-CM-22). | D47 permite elegir entre membresía y (persona, comunidad) si lo segundo resuelve M-8 (c): una sola administración registra todas las membresías de una comunidad, así que un nombre por comunidad evita dos nombres para la misma persona y mantiene la separación entre comunidades que exige C-1. Conservar en vez de sobrescribir evita que un alta cambie en silencio el nombre que ve el propietario (GC S-44) o el contacto de notificación (M-8 (b)). Cambia el modelo de `docs/arquitectura.md` §2 y §4 (P-CM-18). |
| S-CM-22 | Al otorgar `admin`, el nombre y el contacto que ingresa Operaciones (los dos siempre obligatorios, D52 y D54) reemplazan los de una ficha existente en esa comunidad, con auditoría de los anteriores, sin informarlo a Operaciones. El contacto nuevo vale también para las notificaciones de residente de esa persona en esa comunidad. | D52: el nombre del administrador lo fija Operaciones y es el que firma el aviso (GC G-2 y G-3). D54: el contacto siempre lo ingresa Operaciones para esa comunidad, así que no hay ambigüedad sobre de dónde sale. Operaciones no ve datos de negocio, así que no se le muestra la ficha anterior. Efecto en las notificaciones y en el ingreso: CM-A2 (R2-m-9) y P-CM-16. |
| S-CM-23 | Toda escritura del módulo exige clave de idempotencia, no solo las que mueven dinero o el responsable de una deuda. | Extiende GC S-36 y ADR 0003, decisión 6 (menor 1): un reintento por red no debe crear dos unidades, dos fichas o dos membresías. Costo bajo: el mecanismo ya existe. |
| S-CM-24 | Desempates del orden natural del código: tramos numéricos por valor, texto en minúsculas sin tildes ni diéresis (ñ como n), luego menos ceros a la izquierda y al final el código guardado (NFC, con tildes y mayúsculas) comparado por punto de código Unicode. | GC C-4 pide orden natural sin definir desempates (menor 15). Una regla independiente de la configuración regional da el mismo orden en todos los servidores. Solo afecta al orden **propuesto**; el administrador puede cambiarlo. |
| S-CM-25 | Excepción E-CM-1: solo el 403 de revocar una membresía `admin` por la ruta de la comunidad se evalúa en el paso 4, después de la forma (opción (b), D57). El 422 de revocar una membresía de residente y el 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` van en el paso 6. | Decidido por el líder (D57; P-CM-17 cerrada). Precedente en GC "Respuestas de error", paso 4 (`role = admin` al otorgar). No revela nada porque el administrador ya pasó el paso 3b y ve esa membresía. Evita un puerto nuevo en ADR 0009, pero exige enmendar su decisión 2 con una lista cerrada (punto 15 de "Contradicciones y vacíos"). Sigue como supuesto hasta que el arquitecto enmiende ADR 0009. |
| S-CM-26 | Una membresía de residente con `valid_from` futuro se adelanta, sin crear otra, cuando se registra una ocupación que rige antes; `valid_from` nunca se atrasa, y una persona con solo una ocupación programada después de terminar la vigente conserva su membresía vigente. | M-8 (a): una membresía por persona y comunidad (CM-D5); adelantar `valid_from` evita que la persona reciba 404 en una unidad que ya es suya. No atrasarla evita cortar un acceso ya dado; mientras no tenga unidades vigentes, no ve ninguna (ámbitos de GC F-9). |
| S-CM-27 | La alerta de primer ingreso de GC S-72 queda detrás del flag `platform.admin_first_access_alert`, apagado hasta la rebanada de ingreso; al encenderlo, el plazo de 7 días cuenta desde el encendido. | Menor 16: sin ingreso (D37), la alerta se dispararía para todos los administradores. Contar desde el encendido evita alertas masivas por membresías que nunca pudieron ingresar. |
| S-CM-28 | El comité no ve la auditoría de la comunidad (404). | Menor 17. El diseño solo describe el registro de auditoría del administrador (`admin-usuarios-y-roles.md`); la auditoría contiene RUT y motivos de terceros, y el comité ya ve lo que supervisa en el registro de copropietarios y los reportes. Si el líder quiere dar al comité esa supervisión, se agrega con su filtro. |
| S-CM-29 | La ficha de una persona sin membresías vigentes en la comunidad (ex residente o rol revocado) se puede corregir. | Derecho de rectificación de la Ley 21.719 sobre datos que la comunidad conserva en su historial (menor 7). |
| S-CM-30 | Con el flag de término y venta apagado, esas acciones responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` como primera regla de negocio, y la ruta de venta sigue sirviendo para el propietario faltante. | D51 exige el flag pero no fija la respuesta. Un 422 con texto, como `ONLINE_PAYMENT_NOT_AVAILABLE` de GC F-12, evita un 404 que confundiría con un recurso ajeno y mantiene las rutas en el inventario de ADR 0009. |
| S-CM-31 | Los feature flags son por ambiente y viven en la configuración de despliegue; no se editan por API ni por comunidad; encender uno es un cambio de configuración aprobado por el líder; sin valor, apagado; una prueba del CI falla si producción trae `occupancy.end_and_transfer` encendido antes de que exista el traspaso (CM-H1). | Decisión del líder D56 (R2-M-3), marcada (a validar) por el líder. Es el mecanismo más simple compatible con trunk-based development y con la regla 10 de `CLAUDE.md`: el valor de producción queda en el repositorio o en el despliegue, con su historial y su aprobación, y no lo puede cambiar un usuario. Un flag por comunidad (para pilotos) queda para cuando haga falta, con ADR. `docs/arquitectura.md` lo deja en "Cuando haga falta"; lo lleva el arquitecto (P-CM-20). |

## Preguntas abiertas

- [ ] **P-CM-1** (contador y abogado): si la asamblea aprueba nuevas alícuotas con efecto desde una fecha pasada, ¿cómo se cobran las diferencias de los periodos ya emitidos? Supuesto mientras tanto (S-CM-9): el cambio rige desde el borrador vigente y ComVive no recalcula periodos emitidos ni cerrados; las diferencias, si se acuerdan, se cobran con cargos directos del administrador.
- [ ] **P-CM-2** (líder y arquitecto): `docs/arquitectura.md` §4 y ADR 0004 guardan un peso relativo por unidad (`UNIT.share_weight`), pero GC C-2 define las partes iguales con un conjunto de unidades por gasto, con peso 1. ¿Se elimina `share_weight` del modelo o se agrega una base "pesos relativos" a GC? Supuesto mientras tanto: la rebanada 1 no lo captura y queda en 1.
- [ ] **P-CM-3** (líder): ¿la importación desde planilla (UX-16) va en una tarjeta propia después de la rebanada 1? Propuesta: sí; la rebanada 1 deja el lote todo o nada, que la importación reutiliza. ¿Se aceptan exportaciones de Edifito o ComunidadFeliz (UX-16)?
- [x] **P-CM-4** (líder y arquitecto): término y venta sin traspaso en la rebanada 1. **Cerrada por D51:** detrás del flag `occupancy.end_and_transfer`, apagado hasta la rebanada del libro, que no puede activarlo sin el traspaso con TDD (CM-E6).
- [ ] **P-CM-5** (líder): ¿cómo corrige Operaciones el nombre o el RUT de una comunidad mal ingresados en el alta? No hay acción en la consola (CON-11). Supuesto (S-CM-3): procedimiento auditado fuera de la aplicación, como la activación del pago en línea.
- [x] **P-CM-6** (líder y diseño): nombre del administrador. **Cerrada por D52:** lo ingresa Operaciones, obligatorio, en el alta y al otorgar `admin` (CM-A2). Lo que queda abierto (corregirlo después) pasa a P-CM-16.
- [ ] **P-CM-7** (líder y abogado): ¿cómo se corrige una ocupación registrada con el RUT equivocado? El RUT no se edita (CM-C6). Para un arriendo programado basta cancelarlo; para uno vigente, terminarlo traspasa su deuda al propietario, y para un propietario, registrar una venta falsearía el historial. Propuesta: una acción de "corrección de identidad" del administrador, con motivo, que reemplaza la persona de la ocupación sin mover dinero y queda en auditoría, válida solo si la persona equivocada nunca ingresó.
- [x] **P-CM-8** (líder): conserjería en la rebanada 1. **Cerrada por D50:** se pospone a la spec de conserjería.
- [ ] **P-CM-9** (abogado): si la comunidad queda sin administrador, la ley permite que el presidente del comité ejerza sus funciones. ComVive exige siempre un administrador (GC D9). ¿Debe ComVive permitir que el presidente del comité opere como administrador, o basta que Operaciones le otorgue el rol de administrador (lo que hoy choca con GC S-43, porque integra el comité)?
- [ ] **P-CM-10** (abogado y líder): ¿se aceptan propietarios personas jurídicas y comunidades hereditarias con el RUT de la entidad y el contacto de su representante (S-CM-16)? ¿Cómo ingresa una entidad con representantes distintos en varias comunidades, sabiendo que, con la sesión global de ADR 0005, quien verifica el contacto controla la identidad de la entidad (riesgo de C-1)? Mientras tanto su ingreso se pospone (D47). ¿Y unidades con varios propietarios (UX-40)? La Ley 21.442, art. 21, según fuentes secundarias, permite integrar el comité a los cónyuges y a los representantes de personas jurídicas propietarias; eso afecta a GC S-34 y GC P-25.
- [ ] **P-CM-11** (abogado): el registro de copropietarios debe individualizar también a los "demás ocupantes", distinguiendo permanentes y transitorios (Ley 21.442 y DS N° 7, según MINVU). ComVive solo registra propietarios y arrendatarios. ¿Es suficiente para el MVP o hay que agregar ocupantes sin acceso ni deuda?
- [ ] **P-CM-12** (abogado y líder): ¿ComVive debe guardar o verificar la inscripción del administrador en el Registro Nacional de Administradores de Condominios antes de otorgarle el rol? Supuesto mientras tanto: Operaciones lo verifica fuera del sistema y ComVive no lo guarda.
- [ ] **P-CM-13** (líder): ¿faltan tipos de unidad (por ejemplo, "oficina" u "otro") en la lista del diseño (S-CM-4)?
- [ ] **P-CM-14** (líder y arquitecto): ¿aprueba los códigos y textos nuevos de S-CM-1 (incluidos `COMMUNITY_TYPE_REQUIRED`, `UNITS_BATCH_TOO_LARGE` y `OCCUPANCY_ACTION_NOT_AVAILABLE`), `UNITS_INVALID` con varios errores en una respuesta (S-CM-8), los órdenes de validación de S-CM-2, los permisos nuevos (`platform.community.create`, `community.profile.write`, `unit.write`, `person_record.write`) para la tabla de ADR 0003, decisión 3, y la idempotencia en toda escritura (S-CM-23)?
- [ ] **P-CM-15** (líder): ¿aprueba dejar F4 (invitaciones) para la rebanada "Ingreso e invitaciones" (CM-F1)?
- [ ] **P-CM-16** (líder; **prioritaria: resolver antes de que la rebanada "Ingreso e invitaciones" pase a "Lista para desarrollo"**, R2-m-9): ¿cómo se corrigen el nombre y el contacto de un administrador después del otorgamiento? Hoy el administrador de la comunidad no puede (422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`, CM-C6, D57) y la consola no tiene la acción. Urge porque ese contacto es también el de sus notificaciones de residente en esa comunidad y, con la rebanada de ingreso, el que habilita su acceso (CM-A2, D55-2): un contacto mal digitado por Operaciones dejaría a la persona sin acceso ni notificaciones. Propuesta: una acción de Operaciones en la tarjeta de la consola, con motivo y auditoría, que reemplaza nombre y contacto como el otorgamiento (CM-A2); "Mi cuenta" del propio administrador no sirve para el contacto de la ficha, porque una sesión no puede cambiar el contacto que la habilita.
- [x] **P-CM-17** (arquitecto y líder): 403 que depende del recurso de la ruta. **Cerrada por D57:** opción (b), limitada a la revocación de una membresía `admin` (paso 4, después de la forma); la ficha de un administrador pasa a 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`. Queda pendiente que el arquitecto enmiende ADR 0009, decisión 2, y alinee `docs/arquitectura.md` §3 ("Contradicciones y vacíos", punto 15).
- [ ] **P-CM-18** (arquitecto): la ficha por (persona, comunidad) (S-CM-21) cambia el modelo: hoy el nombre y el teléfono están en `MEMBERSHIP` (`display_name`, `phone`) y no hay correo. ¿Se acepta una entidad propia (por ejemplo, `COMMUNITY_PERSON`)? Y para D47 y D55, en la rebanada "Ingreso e invitaciones": ¿cómo se limita una sesión a las comunidades habilitadas por el contacto con que se ingresó (CM-F3), si ADR 0005, decisión 3 hoy da acceso a todas las membresías vigentes? En particular: (1) cómo se evalúa la habilitación en cada petición junto con la membresía, en el paso 2 del guard (D55-1); (2) cómo se deshabilita una comunidad para las sesiones obtenidas con un contacto que su ficha ya no registra, desde la petición siguiente y con auditoría (D55-2); (3) qué acciones de `/me/` y `/auth/` se bloquean a una sesión limitada para que no cambie la identidad que usan otras comunidades, y cómo "Mis comunidades" lista solo las habilitadas (D55-3); y (4) a qué contactos va el código en un ingreso normal con varios contactos verificados (D55-4: a todos, con la sesión limitada al contacto usado, o una regla equivalente).
- [ ] **P-CM-19** (abogado y líder): ¿basta con registrar solo personas con RUT o RUN (D53, S-CM-15)? ¿Cómo se registran los residentes extranjeros con solo pasaporte (UX-40) antes del Piloto, y qué pasa con su deber de pago si la deuda queda en el ámbito `owner`?
- [ ] **P-CM-20** (arquitecto): para llevar D56 a `docs/arquitectura.md` (y a un ADR si crece): ¿dónde vive cada flag en la configuración de despliegue de Cloud Run, cómo lee la prueba del CI la configuración de producción y cómo sabe que el traspaso existe (CM-H1, S-CM-31)? ¿Confirma que los trabajos de ADR 0008 que reciben el id de una unidad toleran que ya no exista, en vez de bloquear su eliminación (CM-B8, S-CM-12; R2-m-6)?

## Contradicciones y vacíos en documentos aprobados

Ninguno bloquea la rebanada; cada uno queda con su supuesto y su pregunta. Esta spec **no edita** los documentos aprobados: el responsable de cada uno los alinea cuando el líder apruebe esta spec.

1. **Cambio de alícuotas:** GC "Casos borde" dice "Un cambio de alícuotas requiere modificar el reglamento (fuera de alcance; P-10)", mientras el diseño aprobado permite editar alícuotas después de emitir (UX-15; `docs/design/arquitectura-de-informacion.md`, "Unidades … (edición: A)"). No se contradicen si "fuera de alcance" se lee como "el acto legal no lo modela ComVive". Esta spec lo lee así (CM-B7, S-CM-10). Si el líder lo lee como "no se edita", hay que quitar la edición después de emitir.
2. **`UNIT.share_weight`:** la arquitectura y ADR 0004 lo modelan; GC C-2 no lo usa (P-CM-2).
3. **Nombre del administrador (resuelto por D52):** CON-11 lo muestra en la tabla de administradores, pero sus formularios no lo piden (punto 18), y GC S-63 no lo pedía. D52 lo hace obligatorio en el alta y al otorgar `admin`, con `PERSON_NAME_REQUIRED` entre `INVALID_RUT` e `INVALID_CONTACT`. **Extiende GC S-63** (orden de errores y tabla de errores): cambio a la spec de gasto común que registra el coordinador. Condición: implementado antes de que la rebanada de emisión pase a "Lista para desarrollo" (GC G-2, G-3).
4. **Tipo de comunidad:** el flujo de alta dice que el tipo y el RUT "los trae Operaciones", pero la consola (CON-11) no pide el tipo. Aquí lo completa el administrador (CM-A3).
5. **Nombre y contacto en `MEMBERSHIP`:** `docs/arquitectura.md` §2 y §4 los guardan por membresía (`display_name`, `phone`, sin correo). Esta spec los lleva a una ficha por (persona, comunidad), con celular y correo (S-CM-21). Lo alinea el arquitecto (P-CM-18).
6. **Lecturas de Operaciones (D49):** el diseño CON-11 (aprobado) muestra la lista de comunidades y los administradores de cada una, pero ADR 0002, decisión 3 nombra `platform_webpay_review` como la única lectura transversal y ADR 0006, decisión 5 limita el módulo `platform` a esa vista. Las dos lecturas salen de la rebanada 1 y pasan a la tarjeta de la consola de Operaciones, que requerirá actualizar ADR 0002 (decisión 3) y ADR 0006 (decisión 5) con una vista propia (por ejemplo, `platform_community_directory`, con columnas mínimas y su rol de base de datos) y auditar la lista con `community_id` nulo, como el listado de D46.
7. **Motivo al revocar comité:** el diseño lo pide; GC no lo tenía en la tabla de errores. Se agrega (CM-D4).
8. **Sesión al revocar en el diseño:** `docs/design/flujos/admin-usuarios-y-roles.md`, paso 6 del ingreso del administrador, dice "Si se revoca el rol, la siguiente acción devuelve al ingreso", lo que contradice GC S-81 y el mismo documento más abajo (la sesión no se cierra; la comunidad responde 404). Rige GC S-81; el diseño debería corregir esa línea.
9. **Conserjería (D50):** la tarjeta F2 la incluía y el diseño la marca "Posterior". Se pospone a la spec de conserjería; el coordinador ajusta la tarjeta F2.
10. **Comité y la ley:** según fuentes secundarias, la Ley 21.442, art. 21, admite en el comité a cónyuges y representantes de personas jurídicas propietarias; GC S-34 solo admite propietarios registrados. Ya está abierto en GC P-25; esta spec agrega la fuente en P-CM-10.
11. **Revelar que un RUT ya tiene cuenta (D48):** `docs/qa/plan-de-pruebas.md`, ISO-7 exige que un RUT que existe solo en otra comunidad responda idéntico a uno inexistente; `docs/arquitectura.md` §2 ("la búsqueda por RUT … solo indica si se crea una membresía nueva para una persona existente") y §4 (la vista previa del alta devuelve "si la persona ya existe en ComVive") y `docs/design/flujos/admin-ocupaciones.md` (paso 2: "Esta persona ya tiene cuenta en ComVive; se le agregará esta unidad") lo admiten. **Rige ISO-7** (D48). Deben alinearse §2 y §4 (arquitecto) y `admin-ocupaciones.md` (diseñador).
12. **Contacto de ingreso (D47):** `docs/design/flujos/residente-primer-ingreso.md` ("A dónde va el código": siempre al contacto verificado, y para una persona nueva el contacto registrado en la ocupación pasa a ser el de ingreso), UX-30 y ADR 0005, decisión 3 (sesión global con todas las membresías) no contemplan la habilitación por contacto. Los alinean el diseñador y el arquitecto con la rebanada "Ingreso e invitaciones" (CM-F3, P-CM-18).
13. **`sort_order` y su permiso (menor 2):** GC "Usuarios y permisos" lo pone en `community.billing.configure` y GC S-53, en "Configuración de cobro". Esta spec lo pasa a `unit-config` con `unit.write`. Cambio a GC que registra el coordinador.
14. **"Otorga y revoca … residentes" (menor 1):** `docs/arquitectura.md` §3, tabla de roles, dice que el administrador otorga y revoca "comité, conserjería y residentes"; el rol de residente nace y termina con la ocupación (la misma §3, "Quién otorga cada rol", y CM-D5), y la conserjería se pospone (D50). Lo alinea el arquitecto.
15. **Verificaciones por recurso de ruta (M-5; D57):** ADR 0009, decisión 2 dice que todo lo que se sabe por la ruta lo decide el guard, y `docs/arquitectura.md` §3 pide 403 al revocar una membresía `admin`. Con un permiso estático por ruta, ese 403 no puede salir del guard. D57 acepta la excepción E-CM-1 solo para esa revocación. **Responsable: arquitecto.** Enmienda ADR 0009, decisión 2, "Lo que sigue en el servicio", con una lista cerrada de verificaciones 403 por la instancia de la ruta, cada una citada a su spec (hoy solo E-CM-1), que se evalúan después de la forma y antes de la idempotencia; y alinea `docs/arquitectura.md` §3 (el 403 de revocar `admin` sale en el paso 4).
16. **Permisos nuevos:** `platform.community.create`, `community.profile.write`, `unit.write` y `person_record.write` no están en la tabla de permisos de ADR 0003, decisión 3 ni en las listas cerradas de ADR 0009 (`CommunityPermission`, `PlatformPermission`). Los agrega el arquitecto (P-CM-14), junto con la lista de permisos de `docs/arquitectura.md` §3 (punto 22).
17. **Contacto del administrador (D54; R2-C-1):** GC "Validaciones de la consola de Operaciones ComVive" (S-63: "Si la persona ya tiene cuenta en ComVive … se usa su contacto verificado y no se pide de nuevo", y `INVALID_CONTACT` "solo si la persona no tiene cuenta" en el orden de otorgar) y CON-11 (`docs/design/wireframes/consola-plataforma.md`, nota del otorgamiento y fila "Otorgar administrador") usan el contacto verificado de otra comunidad. D54 lo hace siempre obligatorio y solo de la ficha de esa comunidad (CM-A2). **Responsables:** el coordinador registra el cambio en GC S-63 y en su tabla de errores; el diseñador alinea CON-11.
18. **Formularios de CON-11 sin el nombre del administrador (D52):** los formularios "Crear comunidad" y "Otorgar administrador" de `docs/design/wireframes/consola-plataforma.md` no tienen el campo nombre ni el error `PERSON_NAME_REQUIRED` ("Ingresa el nombre del administrador"), y deben pedir siempre el contacto (punto 17). **Responsable: diseñador.**
19. **Contacto de ingreso único por persona (D47, D55-4):** ADR 0005, decisión 1 y su supuesto hablan del "contacto de ingreso verificado de `PERSON` (único por persona)". Con la habilitación por contacto, una persona puede tener varios contactos verificados, cada uno habilita las comunidades que lo registran y el código del ingreso normal va a cada uno (CM-F3). El punto 12 solo citaba la decisión 3. **Responsable: arquitecto**, con la rebanada "Ingreso e invitaciones" (P-CM-18).
20. **El guard y "Mis comunidades" ante la habilitación por contacto (D55-1, D55-3):** ADR 0009, decisión 3, paso 2 de la política `community` solo verifica la membresía vigente; deberá considerar también que la comunidad esté habilitada para el contacto con que se obtuvo la sesión. `docs/arquitectura.md` §2, fila "Mis comunidades", lista todas las comunidades con membresía vigente; deberá listar solo las habilitadas. **Responsable: arquitecto**, con la rebanada de ingreso.
21. **Plazo de la alerta de primer ingreso (CM-A5; S-CM-27):** GC S-72 y D27 cuentan los 7 días desde el otorgamiento; CM-A5 los cuenta desde el encendido del flag para las membresías otorgadas antes. Es una extensión de una regla aprobada. **Responsable: coordinador** (registro en la spec de gasto común).
22. **Lista de permisos de `docs/arquitectura.md` §3:** no tiene los permisos nuevos de esta spec (punto 16). **Responsable: arquitecto.**
23. **Acción "Corregir datos" sin diseño (CM-C4, CM-C6):** la vista previa de CM-C4 dice "para cambiarlos, usa Corregir datos", pero ni `docs/design/flujos/admin-usuarios-y-roles.md` ni `docs/design/flujos/admin-ocupaciones.md` tienen esa acción ni una pantalla para corregir la ficha, con el error `ADMIN_RECORD_MANAGED_BY_COMVIVE` para la ficha de un administrador (D57). **Responsable: diseñador**, antes de la rebanada web de este módulo.
24. **Mecanismo de feature flags (D56; R2-M-3):** `docs/arquitectura.md` deja "ambientes y feature flags" en "Cuando haga falta" y ningún ADR dice dónde viven los flags, quién los enciende ni cómo se prueba su valor en producción. D56 fija el mecanismo como supuesto (CM-H1, S-CM-31). **Responsable: arquitecto**, en `docs/arquitectura.md` y en un ADR si el mecanismo crece (P-CM-20).

## Decisiones del líder del proyecto

Respuestas del líder (2026-11-11) a las preguntas 1 a 7 de la revisión crítica `docs/revisiones/2026-11-11-spec-comunidades-y-membresias.md`:

- **D47 (pregunta 1, C-1):** mientras una persona no tenga un contacto verificado, el contacto sin verificar se guarda por membresía o por persona y comunidad (esta spec elige persona y comunidad, S-CM-21, porque también resuelve M-8 (c)). Verificar un contacto habilita solo las membresías cuyo contacto registrado coincide con el verificado; las demás exigen su propia invitación o confirmación. Se elimina la regla "el primero registrado es el contacto de ingreso" (CM-C4, S-CM-17). Las personas jurídicas con ingreso compartido entre comunidades quedan pospuestas hasta la respuesta del abogado (S-CM-16, P-CM-10). Requisito heredado en CM-F3 y CA de aislamiento CA-CM-24.
- **D48 (pregunta 2, M-3):** rige ISO-7: la vista previa con un RUT que existe solo en otra comunidad responde idéntico a un RUT inexistente; no hay aviso "ya tiene cuenta en ComVive" (CM-C4, CA-CM-12). `docs/arquitectura.md` §2 y §4 y `docs/design/flujos/admin-ocupaciones.md` deben alinearse ("Contradicciones y vacíos", punto 11).
- **D49 (pregunta 3, M-2):** `GET /platform/communities` y `GET /platform/communities/{communityId}/admin-memberships` salen de la rebanada 1 y pasan a la tarjeta de la consola de Operaciones, que requerirá actualizar ADR 0002 (decisión 3) y ADR 0006 (decisión 5) con una vista propia (CM-A4; "Contradicciones y vacíos", punto 6).
- **D50 (pregunta 4, menor 14, P-CM-8):** la conserjería se pospone; sale de la rebanada 1 con sus roles, permisos, CA y datos personales (CM-D3).
- **D51 (pregunta 5, M-7, P-CM-4):** término de arriendo y venta quedan detrás de un feature flag apagado hasta la rebanada del libro de movimientos; ningún texto fijo afirma que no se mueve dinero. La rebanada del libro no puede activar el flag sin implementar con TDD el traspaso de GC F-9 y F-13 (CM-E6).
- **D52 (pregunta 6, M-9, P-CM-6):** el nombre del administrador lo ingresa Operaciones en el alta de la comunidad y al otorgar el rol `admin`; es obligatorio y debe estar implementado antes de que la rebanada de emisión pase a "Lista para desarrollo" (GC G-2, G-3). Extiende GC S-63; el coordinador registra el cambio en la spec de gasto común (CM-A2, CM-C1).
- **D53 (pregunta 7, menor 13):** en el MVP solo se registran personas con RUT (los extranjeros con residencia tienen RUN). Sin RUT no se crea ocupación propia y la deuda queda en el ámbito `owner`. Supuesto (a validar) antes del Piloto (CM-C7, S-CM-15, P-CM-19).

Respuestas del líder (2026-11-11) a las preguntas 1 a 5 de la segunda pasada de la revisión crítica (sección "R2 · Preguntas para el líder del proyecto" del mismo informe):

- **D54 (R2 pregunta 1, R2-C-1):** el celular o correo del administrador es **siempre obligatorio** en el alta de la comunidad y en cada otorgamiento de `admin`, y se guarda solo en la ficha de esa comunidad; nunca se usa ni se copia el contacto de `PERSON` ni de otra ficha. `INVALID_CONTACT` sin condición en CM-C1 y en los órdenes de validación; caso nuevo en CA-CM-27 (Felipe Rojas, administrador de B con contacto verificado, recibe `admin` en A sin contacto: 422 `INVALID_CONTACT`). Extiende GC S-63 y cambia CON-11 ("Contradicciones y vacíos", punto 17) (CM-A2).
- **D55 (R2 pregunta 2, R2-M-1):** requisitos heredados para la rebanada de ingreso en CM-F3: (1) la habilitación por contacto se evalúa en cada petición, como la membresía; (2) corregir o reemplazar el contacto de una ficha deshabilita esa comunidad para las sesiones obtenidas con el contacto anterior desde la petición siguiente, con auditoría; (3) una sesión limitada no modifica datos de identidad que afecten a comunidades no habilitadas, y "Mis comunidades" lista solo las habilitadas; (4) en el ingreso normal con varios contactos verificados, el código va a cada contacto verificado y la sesión queda limitada al contacto usado, salvo una regla equivalente que elija el arquitecto. Se suma a P-CM-18 y CA-CM-24 (CM-F3, D55-1 a D55-4).
- **D56 (R2 pregunta 3, R2-M-3):** los feature flags se manejan **por ambiente, en la configuración de despliegue**, no editables por API ni por comunidad; encenderlos es un cambio de configuración aprobado por el líder. Supuesto (a validar), S-CM-31. Requisito: una prueba que falle si la configuración de producción trae `occupancy.end_and_transfer` encendido antes de que exista el traspaso. Sin ADR propio por ahora; el arquitecto lo lleva a `docs/arquitectura.md` y a un ADR si crece (CM-H1; "Contradicciones y vacíos", punto 24; P-CM-20).
- **D57 (R2 pregunta 4, P-CM-17 y R2-m-8):** opción **(b)** limitada a la revocación de una membresía `admin`: ese 403 se evalúa en el paso 4, después de la forma (E-CM-1). La corrección de la ficha de un administrador pasa a **422** con código propio `ADMIN_RECORD_MANAGED_BY_COMVIVE` ("Los datos de un administrador los corrige ComVive") (CM-C6). Hay que enmendar ADR 0009, decisión 2 ("Lo que sigue en el servicio": lista cerrada de verificaciones 403 por la instancia de la ruta, citada a esta spec, antes de la idempotencia) y alinear `docs/arquitectura.md` §3 ("Contradicciones y vacíos", punto 15). Cierra P-CM-17.
- **D58 (R2 pregunta 5, R2-M-4):** en GOLD-ACM7-05 la anulación es posterior a la emisión de `2026-11` (2026-12-02) y las notas van al borrador `2026-12`; GOLD-ACM7-01 a 04 no las incluyen (CA-CM-7; `docs/qa/comunidades-simuladas.md`).

## Referencias

- `docs/specs/gasto-comun.md` (rev. 9, aprobada): "Definiciones"; "Usuarios y permisos"; "Qué recursos ve cada rol" (S-53); "Respuestas de error" (S-70, S-77); "Códigos y mensajes de error"; "Otorgamiento de roles" (S-34, S-43, S-81); "Validaciones de la consola de Operaciones ComVive" (S-63, S-68, S-72, S-79, S-85, S-86; D9, D10, D12, D24, D27); "Comité que deja de ser propietario" (M-7); "Datos del arrendatario que ve el propietario" (S-44); "Datos de copropietarios que ve el comité" (S-33); reglas A-2, A-3.1, A-3.4, A-3.8, A-7, B-4, C-2 a C-5, F-9, F-12, F-13, F-14, F-15, G-2, G-3, G-5; S-14, S-19, S-27, S-36, S-47; CA-18, CA-19, CA-21, CA-22, CA-33, CA-37, CA-38, CA-43, CA-53, CA-56, CA-57, CA-60, CA-61, CA-64, CA-69, CA-75, CA-76; P-1, P-10, P-25, P-61.
- `docs/arquitectura.md`: §2 (aislamiento, datos que cruzan comunidades, búsqueda por RUT, regla 404/403), §3 (roles, quién otorga cada rol, revocación, usuarios de plataforma, comité que deja de ser propietario), §4 (modelo de datos, participación y prorrateo, ocupaciones, visibilidad por ámbito) y §5 (auditoría y datos personales).
- ADR 0002 (aislamiento; decisión 3, lectura transversal), ADR 0003 (contratos, permisos, idempotencia y orden de errores), ADR 0004 (libro, periodos, foto de participaciones), ADR 0005 (identidad por RUT, sesión, auditoría), ADR 0006 (usuarios de plataforma; decisión 5, vista de plataforma), ADR 0008 (tareas en segundo plano, `NOTIFICATION_DELIVERY`), ADR 0009 (guard global; decisiones 2, 3, 4 y 7; D37 sobre el ingreso en la rebanada 1; D39 sobre recursos de ruta; ADR-0009-S3 sobre el límite del cuerpo).
- `docs/design/`: `flujos/admin-alta-comunidad.md`, `flujos/admin-usuarios-y-roles.md`, `flujos/admin-ocupaciones.md`, `flujos/residente-primer-ingreso.md`, `arquitectura-de-informacion.md`, `mapa-de-usuarios.md` (UX-8, UX-15, UX-16, UX-30, UX-35, UX-40), `wireframes/web-alta-comunidad.md` y `wireframes/consola-plataforma.md` (CON-11).
- `docs/qa/`: `plan-de-pruebas.md` (ISO-1 a ISO-9; en particular ISO-5 e ISO-7) y `comunidades-simuladas.md` (Comunidades A a D, personas y ocupaciones de prueba, GOLD-A, GOLD-C, GOLD-CE, GOLD-A33 y GOLD-ACM7).
- `docs/revisiones/2026-11-11-spec-comunidades-y-membresias.md`: revisión crítica de la rev. 1 y de la rev. 2 (segunda pasada), con su resolución.
- **Ley 21.442** (texto oficial en LeyChile, BCN): `https://www.bcn.cl/leychile/navegar?idNorma=1174663`. Numeración por verificar en GC P-1.
- **MINVU, "Herramientas para la administración"** (registro de copropietarios y ocupantes, el administrador no integra el comité, el presidente del comité ejerce sin administrador): `https://www.minvu.gob.cl/wp-content/uploads/2024/04/herramientas-administracion.pdf`.
- **MINVU, "Acuerdos y resolución de conflictos"** (asambleas extraordinarias y quórum para modificar el reglamento): `https://www.minvu.gob.cl/wp-content/uploads/2024/04/acuerdos-y-resolucion-de-conflictos.pdf`.
- **MINVU, Registro Nacional de Administradores:** `https://www.minvu.gob.cl/wp-content/uploads/2024/04/registro-de-administradores.pdf`.
- **Reglamento DS N° 7 de 2025 (MINVU):** `https://www.diarioconstitucional.cl/2025/01/17/publican-reglamento-de-la-nueva-ley-de-copropiedad-inmobiliaria-que-cambios-trae-para-los-condominios/`.
- **Ley 21.442, art. 21 (quién integra el comité):** solo se encontraron fuentes secundarias no verificadas; se cita sin URL y se verifica contra BCN en GC P-1 y P-CM-10.
- **RUN y RUT de extranjeros (D53):** Servicio de Registro Civil e Identificación (cédula de identidad para extranjeros con RUN) y SII (RUT para quien no tiene RUN); se cita sin URL y lo verifica el abogado en P-CM-19.
- `CLAUDE.md`: reglas 1, 2, 3, 4, 5, 6, 7 y 8.
