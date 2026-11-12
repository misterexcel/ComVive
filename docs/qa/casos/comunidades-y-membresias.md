# Casos de prueba: comunidades, unidades y membresías

Estado: **Para revisión del líder del proyecto**
Responsable: ingeniero-qa
Aprobación: líder del proyecto
Especificación de origen: `docs/specs/comunidades-y-membresias.md` rev. 4 (aprobada por el líder del proyecto el 2026-11-11, decisiones D47 a D58 y D69 a D73). Abreviatura del módulo: `CM`. Otras fuentes: `docs/specs/gasto-comun.md` rev. 9 ("Respuestas de error", "Códigos y mensajes de error", "Otorgamiento de roles", "Validaciones de la consola de Operaciones ComVive", reglas F-14 y M-7), `docs/adr/0003-contratos-de-api-y-autorizacion.md` (idempotencia y orden de evaluación), `docs/adr/0008-tareas-en-segundo-plano.md` (inventario, fila 5), `docs/adr/0009-guard-global-denegacion-por-defecto.md` (pasos del guard, 413, auditoría de plataforma), `docs/qa/plan-de-pruebas.md` (secciones 4, 4.2, 4.4 y 5) y `docs/qa/comunidades-simuladas.md` (personas, ocupaciones, GOLD-A, GOLD-C, GOLD-CE, GOLD-A33 y GOLD-ACM7).

Casos derivados de los criterios de aceptación CA-CM-1 a CA-CM-29 (CA-CM-17 está retirado y no tiene casos), de los 44 casos borde de la especificación y de casos borde adicionales de QA. Este módulo no calcula montos: los únicos montos que aparecen son los de las pruebas de oro ya aprobadas (GOLD-ACM7, D75), que se citan con su cálculo y no se recalculan aquí. Las sumas de alícuotas sí muestran su cálculo, con enteros.

## Convenciones

- IDs según `docs/qa/plan-de-pruebas.md` §8: `TC-CM-CA<n>-<nn>` (desde el criterio CA-CM-n), `TC-CM-CB-<nn>` (caso borde), `PROP-CM-<nn>` (propiedad), `ISO-CM-<acción>-<n>` (aislamiento) y `PERM-CM-<rol>-<acción>` o `PERM-CM-orden-<n>` (permisos y orden de validación).
- **Tipo:** unitaria (función pura en `packages/shared`), propiedad (fast-check), integración (API + PostgreSQL), aislamiento, permisos, configuración (prueba del CI sobre archivos del repositorio), e2e (Playwright).
- **Prioridad por riesgo:** 1 = aislamiento, permisos, datos personales o algo que cambia un monto futuro (alícuotas, orden, flag de término y venta); 2 = flujo y mensajes; 3 = presentación.
- **Rebanada** (qué implementa la rebanada 1 según "Alcance de la rebanada 1" de la spec):

  | Marca | Significado |
  | --- | --- |
  | `R1` | Ejecutable en la rebanada 1: base de datos, API y pruebas automáticas, con dobles del verificador de sesión (D37) |
  | `R1-F` | Ejecutable en la rebanada 1 con el flag indicado **encendido en el doble de configuración** (CM-E6, CM-H1) |
  | `R1-P` | Ejecutable en la rebanada 1 **solo si** la prueba puede sembrar un periodo emitido en la comunidad. La spec dice que la rebanada 1 implementa "el cambio después de un periodo emitido", pero no dice cómo sabe la rebanada 1 que hay un periodo emitido (hallazgo H-CM-1). Hasta que se resuelva, **Supuesto (a validar):** la prueba inserta el periodo emitido directo en la base de datos |
  | `H-EMI` | Requisito heredado por la rebanada de emisión (periodos, foto de participaciones, vista previa de emisión, correcciones, avisos) |
  | `H-LIB` | Requisito heredado por la rebanada del libro de movimientos (traspaso de GC F-9 y F-13, ámbitos, encendido del flag `occupancy.end_and_transfer`) |
  | `H-ING` | Requisito heredado por la rebanada "Ingreso e invitaciones" (D47, D55, D72, CM-F3) |
  | `H-NOT` | Requisito heredado por toda rebanada que envíe notificaciones a residentes (D70) |
  | `H-WEB` | Requisito heredado por la web del módulo o la consola de Operaciones (textos de pantalla, e2e) |

  Un caso heredado no bloquea el paso de la rebanada 1 a "Lista para desarrollo", pero su id queda reservado: la rebanada que lo hereda lo automatiza con este mismo id.
- **Sesiones:** en la rebanada 1 nadie ingresa (D37). Cada actor es una sesión entregada por el doble del verificador de sesión, con la persona y el tipo (`community` o `platform`, con segundo factor) que indica el caso. "Sin sesión" es una petición sin credencial.
- **Códigos de error:** todo 404 trae `NOT_FOUND` y "No encontramos lo que buscas o no tienes acceso"; todo 403 trae `FORBIDDEN` y "Tu rol no permite esta acción"; todo 400 trae `BAD_REQUEST` y "No pudimos procesar la solicitud. Actualiza la aplicación e intenta de nuevo"; el 413 trae `PAYLOAD_TOO_LARGE` (ADR 0009). Los demás códigos y textos se copian tal cual de "Códigos y mensajes de error nuevos" de la spec y de la tabla de GC.
- **Orden de validación** (spec, "Orden de validación por acción"; GC "Respuestas de error"): 1 sesión (401) → 2 membresía, visibilidad, recursos de la ruta y permiso (404/403; pasos 3a, 3b y 3c del guard) → 3 forma (400, incluido el encabezado `Idempotency-Key` ausente o que no es uuid) → 4 los 404/403 que dependen de un dato del cuerpo o, por E-CM-1, del recurso de la ruta → 5 idempotencia → 6 reglas de negocio, donde se responde solo la primera que falla.
- **"Nada escrito" (D12; CM-G3):** en un rechazo se verifica por conteo y por contenido que no hay filas nuevas ni cambiadas en `COMMUNITY`, `UNIT`, `PERSON`, la tabla de fichas (`COMMUNITY_PERSON`, nombre por confirmar en P-CM-18), `MEMBERSHIP`, `UNIT_OCCUPANCY`, `ADMIN_TASK`, `JOB` ni `IDEMPOTENCY_KEY`. En una ruta `/communities/...` tampoco hay fila nueva en `AUDIT_LOG`. En una ruta `/platform/...` el rechazo deja **exactamente un** registro en `AUDIT_LOG` con el código de la respuesta (plan §4.2, ISO-P8).
- **Id inexistente:** un uuid canónico que no está en ninguna tabla. Toda prueba de 404 por un id ajeno compara el cuerpo, byte a byte, con el de un id inexistente. Un id de ruta que no es uuid canónico responde el mismo 404 (**Supuesto (a validar):** ADR 0009, decisión 3, fija la forma del id por tipo de recurso; la spec dice "Todos los ids son uuid canónicos").
- **Alícuotas:** siempre como entero `aliquotE6` (18,5000 % = 185000). Las sumas se muestran paso a paso. El texto de la advertencia usa la suma con 4 decimales y coma: `suma div 10.000`, coma, y `suma mod 10.000` con 4 dígitos (999.900 → "99,9900 %").
- **Supuesto (a validar):** marca todo dato o resultado que la spec no define y que este documento fija para poder probar. **Hallazgo (H-CM-n):** la spec no permite fijar el resultado sin ambigüedad; la pregunta concreta está en "Hallazgos para el analista" y el caso queda con el supuesto indicado o bloqueado.

## Datos comunes

- Comunidades A, B y C de `docs/qa/comunidades-simuladas.md`, con los datos nuevos de la sección "Datos de prueba de la rebanada 1" (RUT de cada comunidad, alícuotas de la Comunidad B, personas de B y de C). Los ids de unidades, fichas, membresías y ocupaciones son uuid generados por la prueba; aquí se nombran por su código (por ejemplo, "el `unitId` de la Casa 1").
- **Comunidad A** (RUT 65.111.222-2): Depto 101 = 200000, orden 1; Depto 102 = 250000, orden 2; Depto 201 = 250000, orden 3; Depto 202 = 300000, orden 4; tipo `departamento`. Suma: 200.000 + 250.000 + 250.000 + 300.000 = 1.000.000.
- **Comunidad B** (RUT 65.333.444-3): Casa 1 = 333334, orden 1; Casa 2 = 333333, orden 2; Casa 3 = 333333, orden 3; tipo `casa`. Suma: 333.334 + 333.333 + 333.333 = 1.000.000 (dato de prueba propio; no cambia GOLD-B, que reparte en partes iguales).
- **Comunidad C** (RUT 65.555.666-4): no existe al empezar CA-CM-1. Desde CA-CM-3: Depto 11 = 185000, Depto 12 = 195000, Depto 21 = 200000, Depto 22 = 210000, Depto 31 = 210000, órdenes 1 a 5.
- **Actores:** `admin-A` (Carolina Lagos), `admin2-A` (Héctor Molina), `comite-A` (Rosa Díaz, propietaria del Depto 201), `propietario-101` (Ana Pérez), `propietario-102` (Luis Muñoz), `arrendatario-102` (ocupación indicada en cada caso), `ex-residente-A` (persona con membresía de residente revocada en A), `admin-B` (Felipe Rojas), `comite-B` (Marta Vidal, propietaria de la Casa 3), `propietario-B1` (Gabriel Torres, Casa 1), `admin-C` (Paula Henríquez), `operaciones-1` (`platform_operations`), `soporte-1` (`platform_support`). No existe `conserje-A` en este módulo: la rebanada 1 no tiene membresías `concierge` (D50).
- **Estado por defecto:** salvo que el caso diga otra cosa, ninguna comunidad tiene periodos emitidos; el Depto 102 no tiene arrendatario; los flags `occupancy.end_and_transfer` y `platform.admin_first_access_alert` están apagados; toda escritura lleva un `Idempotency-Key` nuevo (uuid) y toda ficha tiene nombre y, si el caso no fija otro, ningún contacto.
- **Fechas:** hora de Chile. El reloj de la prueba se fija en la fecha que indica cada caso.

## Matriz de trazabilidad

| CA | Casos | Tipo | Rebanada | Propiedades y aislamiento |
| --- | --- | --- | --- | --- |
| CA-CM-1 | TC-CM-CA1-01 a 07 | integración, permisos | R1 (07: R1-F) | ISO-CM-plataforma-1 a 3; PROP-CM-19, 20 |
| CA-CM-2 | TC-CM-CA2-01 a 04 | integración, permisos | R1 | ISO-CM-comunidad-1, 2 |
| CA-CM-3 | TC-CM-CA3-01 a 03 | integración | R1 (03: H-EMI) | GOLD-C, GOLD-CE; PROP-CM-05, 09 |
| CA-CM-4 | TC-CM-CA4-01 a 04 | integración, unitaria | R1 | PROP-CM-01 a 05 |
| CA-CM-5 | TC-CM-CA5-01, 02 | integración | R1 (02: H-EMI) | PROP-CM-05 |
| CA-CM-6 | TC-CM-CA6-01 a 08 | integración | R1 | PROP-CM-10 a 12 |
| CA-CM-7 | TC-CM-CA7-01 a 05 | integración, prueba de oro | R1-P (03 a 05: H-EMI) | GOLD-ACM7-01 a 05; PROP-CM-25 |
| CA-CM-8 | TC-CM-CA8-01 a 03 | integración | H-EMI (parte de 02 y 03: R1-P) | PROP-CM-25 |
| CA-CM-9 | TC-CM-CA9-01 a 06 | integración | R1 (02: R1-P y H-EMI; 05: H-EMI; 06: R1-P) | PROP-CM-26 |
| CA-CM-10 | TC-CM-CA10-01 a 04 | permisos | R1 | PERM-CM (matriz); PROP-CM-22 |
| CA-CM-11 | TC-CM-CA11-01 a 05 | aislamiento | R1 | ISO-CM-unidades-1 a 7; PROP-CM-17 |
| CA-CM-12 | TC-CM-CA12-01 a 04 | aislamiento, datos personales | R1 | ISO-CM-rut-1 a 3; PROP-CM-18 |
| CA-CM-13 | TC-CM-CA13-01 a 03 | integración | R1 | PROP-CM-13, 14, 19 |
| CA-CM-14 | TC-CM-CA14-01 a 04 | integración | R1 (02, 03: R1-F; 04: H-LIB) | PROP-CM-15, 16 |
| CA-CM-15 | TC-CM-CA15-01 a 06 | integración, permisos | R1 (02, 03: R1-F) | PROP-CM-15, 16, 22 |
| CA-CM-16 | TC-CM-CA16-01 a 10 | integración, permisos | R1 (10: R1-F) | PERM-CM-orden-9 a 13 |
| CA-CM-17 | Retirado (D50) | — | — | — |
| CA-CM-18 | TC-CM-CA18-01 a 05 | integración, datos personales | R1 | ISO-CM-membresias-1 |
| CA-CM-19 | TC-CM-CA19-01 a 07 | integración, datos personales | R1 (03: H-ING) | ISO-CM-ficha-1, 2 |
| CA-CM-20 | TC-CM-CA20-01 a 04 | datos personales | R1 (parte de 02: H-EMI) | PROP-CM-24 |
| CA-CM-21 | TC-CM-CA21-01, 02 | integración | R1-F | PERM-CM-orden-16 |
| CA-CM-22 | TC-CM-CA22-01, 02 | integración | R1 | |
| CA-CM-23 | TC-CM-CA23-01 a 06 | aislamiento | R1 | ISO-CM (todas); PROP-CM-17 |
| CA-CM-24 | TC-CM-CA24-01 a 06 | aislamiento | R1 (02 a 06: H-ING) | ISO-17 a ISO-19 del plan |
| CA-CM-25 | TC-CM-CA25-01 a 03 | integración | R1 | PROP-CM-15 |
| CA-CM-26 | TC-CM-CA26-01 a 07 | integración, configuración | R1 | PROP-CM-21 |
| CA-CM-27 | TC-CM-CA27-01 a 06 | integración, aislamiento | R1 (06: H-ING) | ISO-CM-plataforma-2 |
| CA-CM-28 | TC-CM-CA28-01, 02 | integración | R1 (02: H-EMI) | |
| CA-CM-29 | TC-CM-CA29-01 a 03 | aislamiento | H-NOT | ISO-18 del plan |
| Regla 4, una prueba por acción | ISO-CM (sección "Aislamiento") | aislamiento | R1 | PROP-CM-17 |
| Orden de validación por acción | PERM-CM-orden-1 a 24 | integración | R1 (16, 17: R1-F; 6: R1-P) | PROP-CM-19 |
| Idempotencia en toda escritura (S-CM-23) | TC-CM-CB-44, 45 | integración | R1 | PROP-CM-20 |

## Casos derivados de criterios de aceptación

### CA-CM-1 · Alta de una comunidad por Operaciones (Comunidad C)

Petición base, válida: nombre "Edificio Mirador", RUT de comunidad 65.555.666-4, administradora "Paula Henríquez", RUT 16.543.210-K (no existe en ComVive), celular "+56 9 1234 5678", motivo "Contrato de administración del 01-11-2026", sin fecha de término.

#### TC-CM-CA1-01 · Alta sin el nombre del administrador

- **CA:** CA-CM-1, D52 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `operaciones-1` envía `POST /platform/communities` con la petición base **sin** el nombre del administrador; y, en otra petición, con el nombre "   " (solo espacios).
- **Entonces:** en las dos, 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre del administrador". Nada escrito: cero filas nuevas en `COMMUNITY`, `PERSON`, fichas, `MEMBERSHIP` e `IDEMPOTENCY_KEY`. Exactamente un registro en la auditoría de plataforma por petición, con el código `PERSON_NAME_REQUIRED`.

#### TC-CM-CA1-02 · Orden de las validaciones del alta

- **CA:** CA-CM-1, CM-A2, D54 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `operaciones-1` envía la petición base con las fallas de cada fila (una petición por fila, cada una con clave nueva).

  | Variante | Fallas simultáneas | Respuesta esperada (solo una) |
  | --- | --- | --- |
  | (a) | Nombre de la comunidad vacío, RUT de comunidad 65.555.666-5 (dígito inválido), sin nombre del administrador, sin contacto, sin motivo | 422 `COMMUNITY_NAME_REQUIRED` con "Ingresa el nombre de la comunidad" |
  | (b) | RUT de comunidad 65.555.666-5, sin nombre del administrador | 422 `INVALID_RUT` con "Ingresa un RUT válido. Revisa el dígito verificador" |
  | (c) | Sin nombre del administrador y RUT del administrador 16.543.210-1 (dígito inválido) | 422 `INVALID_RUT` (el RUT va antes que el nombre) |
  | (d) | Sin nombre del administrador y sin celular ni correo | 422 `PERSON_NAME_REQUIRED` (el nombre va antes que el contacto) |
  | (e) | Celular "+56 9 123" y `validTo` 2027-12-31 | 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido del administrador" |
  | (f) | `validTo` 2027-12-31 y sin motivo | 422 `ADMIN_END_DATE_NOT_ALLOWED` con "El rol de administrador no lleva fecha de término. Para terminarlo, revoca el rol" |
  | (g) | Sin motivo y RUT de comunidad 65.111.222-2 (el de la Comunidad A) | 422 `REASON_REQUIRED` con "Indica el motivo del alta" |
  | (h) | Todo válido, con el RUT de comunidad 65.111.222-2 | 409 `COMMUNITY_ALREADY_EXISTS` con "Ya existe una comunidad con este RUT en ComVive" |

- **Entonces:** cada variante responde solo el código de su fila, nada escrito, y un registro de auditoría de plataforma por petición con ese código. En (h) la Comunidad A no cambia.
- **Nota (H-CM-13):** el orden entre `INVALID_RUT` de la comunidad e `INVALID_RUT` del administrador no se puede observar: los dos traen el mismo código y el mismo texto.

#### TC-CM-CA1-03 · Alta exitosa

- **CA:** CA-CM-1, CM-A2 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `operaciones-1` envía la petición base el 2026-11-12 y después la reenvía con la misma clave y el mismo cuerpo.
- **Entonces:** 2xx. Existen, creados en una sola transacción: una `COMMUNITY` "Edificio Mirador" con RUT `65555666-4` y dirección, comuna y tipo vacíos; una `PERSON` con RUT `16543210-K`, sin nombre ni contacto en `PERSON`; una ficha (persona, Comunidad C) con nombre "Paula Henríquez" y celular `+56912345678`; una `MEMBERSHIP` `admin` con `valid_from` 2026-11-12, `valid_to` nulo, `granted_via = platform`, `first_access_at` nulo (estado de ingreso "Pendiente"). Cero `UNIT`, cero periodos y cero filas de configuración de cobro de C. Cero filas en `JOB` (flag `platform.admin_first_access_alert` apagado, CM-A5). Un registro `community.create` en la auditoría de plataforma, sin el RUT completo ni el celular en claro. El reenvío devuelve la respuesta original y no crea una segunda comunidad, persona, ficha ni membresía.
- **Heredado (H-EMI):** la vista previa de emisión de C responde 422 `COMMUNITY_WITHOUT_UNITS` con "La comunidad no tiene unidades. Crea las unidades antes de emitir" (TC-CM-CB-15).

#### TC-CM-CA1-04 · Operaciones no lee datos de negocio ni las rutas retiradas

- **CA:** CA-CM-1, D49, CM-A4 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** después del alta, `operaciones-1` pide `GET /communities/{C}/units`, `GET /communities/{C}`, `GET /communities/{C}/memberships`, `GET /platform/communities` y `GET /platform/communities/{C}/admin-memberships`.
- **Entonces:** 404 `NOT_FOUND` en las cinco, con el mismo cuerpo. Las dos últimas no existen en el inventario de rutas de la rebanada 1 (D49). Las dos peticiones bajo `/platform/` dejan su registro mínimo en la auditoría de plataforma (ADR 0009: ruta inexistente bajo `/platform/`).

#### TC-CM-CA1-05 · Primer administrador que ya administra otra comunidad (D54)

- **CA:** CA-CM-1, D54, R3-m-5 · **Tipo:** integración, aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Felipe Rojas (22.456.789-8), administrador de B, con ficha en B (correo `frojas.b@example.com`) y un contacto verificado en `PERSON` sembrado por la prueba (correo `frojas.b@example.com`; dato de escenario, en la rebanada 1 nadie verifica contactos).
- **Cuando:** `operaciones-1` crea "Edificio Mirador" con Felipe Rojas como primer administrador, nombre "Felipe Rojas" y motivo, (a) sin celular ni correo y (b) con el correo `frojas.c@example.com`. En paralelo, la prueba guarda la respuesta de TC-CM-CA1-03 (RUT nuevo).
- **Entonces:** (a) 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido del administrador"; nada creado. (b) 2xx: la ficha de Felipe en C queda con `frojas.c@example.com`; su ficha en B, su contacto verificado en `PERSON` y su membresía `admin` de B quedan idénticos (comparación fila a fila). No se crea una segunda `PERSON`. La respuesta de (b) tiene los mismos campos, la misma estructura y los mismos textos que la de TC-CM-CA1-03 (comparación de la forma del JSON, sin los valores que la propia petición envió ni los ids generados).

#### TC-CM-CA1-06 · Soporte ComVive no usa las rutas de Operaciones

- **CA:** CA-CM-1, R2-m-7 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `soporte-1` envía (a) `POST /platform/communities` con la petición base; (b) `POST /platform/communities/{C}/admin-memberships` con un cuerpo válido; (c) `POST /platform/communities/{C}/admin-memberships/{membresía de Paula Henríquez}/revoke` con motivo; y repite las tres con un JSON mal formado.
- **Entonces:** 404 `NOT_FOUND` en las seis (paso 3a, antes de la forma). Nada cambia. Seis registros en la auditoría de plataforma, uno por petición, con `NOT_FOUND`.

#### TC-CM-CA1-07 · Alerta de primer ingreso detrás de su flag

- **CA:** CA-CM-1, CM-A5 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1-F (flag `platform.admin_first_access_alert`)
- **Cuando:** se repite TC-CM-CA1-03 el 2026-11-12 con el flag encendido en el doble de configuración.
- **Entonces:** además de lo anterior, un trabajo `membership.admin_first_access_alert` en `JOB`, con clave de deduplicación `membership.admin_first_access_alert:<membershipId>` y `run_at` = inicio del día (2026-11-12 + 8 días) = 2026-11-20 00:00 hora de Chile (ADR 0008, inventario, fila 5). Con el flag apagado, cero trabajos (TC-CM-CA1-03).
- **Supuesto (a validar) (H-CM-12):** se asume que la rebanada 1 implementa el encolado detrás del flag. El procedimiento del encendido (R3-m-7) es heredado (H-ING).

### CA-CM-2 · Datos de la comunidad

#### TC-CM-CA2-01 · Edición parcial

- **CA:** CA-CM-2, CM-A3 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Cuando:** `admin-C`, con la comunidad recién creada, envía `PATCH /communities/{C}` (a) con la dirección "Av. Los Leones 1234" y la comuna "Providencia"; (b) después, con el tipo `edificio`.
- **Entonces:** (a) 2xx; dirección y comuna guardadas; el nombre sigue "Edificio Mirador"; el tipo sigue vacío; un registro `community.update` con los dos campos cambiados. (b) 2xx; tipo `edificio`; un registro `community.update` con un campo.

#### TC-CM-CA2-02 · Campos que no se pueden vaciar y su orden

- **CA:** CA-CM-2 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Cuando:** `admin-C` envía (a) nombre ""; (b) nombre "" y comuna ""; (c) dirección nula; (d) comuna "" y tipo nulo; (e) tipo nulo; (f) tipo "".
- **Entonces:** (a) y (b) 422 `COMMUNITY_NAME_REQUIRED` con "Ingresa el nombre de la comunidad"; (c) y (d) 422 `COMMUNITY_ADDRESS_REQUIRED` con "Ingresa la dirección y la comuna de la comunidad"; (e) y (f) 422 `COMMUNITY_TYPE_REQUIRED` con "Elige el tipo de comunidad: edificio o condominio". Nada cambia y no hay auditoría.

#### TC-CM-CA2-03 · Campos que el contrato no acepta

- **CA:** CA-CM-2, CM-A3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía (a) tipo "torre"; (b) un campo `rut` con 65.111.222-2; (c) un nombre de 121 caracteres; (d) una dirección de 201 caracteres; (e) una comuna de 61 caracteres.
- **Entonces:** 400 `BAD_REQUEST` en las cinco; nada cambia; el RUT de C sigue `65555666-4`.

#### TC-CM-CA2-04 · Lectura y edición por los demás roles

- **CA:** CA-CM-2 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** en la Comunidad A, `comite-A`, `propietario-101` y `arrendatario-102` (O-1) (a) leen `GET /communities/{A}`; (b) envían un `PATCH` válido; (c) envían un `PATCH` con JSON mal formado.
- **Entonces:** (a) 2xx con nombre, dirección, comuna, tipo y RUT de la comunidad, y nada más; sin auditoría de lectura (CM-G2). (b) y (c) 403 `FORBIDDEN` (el permiso va antes que la forma); nada cambia.

### CA-CM-3 · Alta de unidades con alícuotas que suman 100 % (Comunidad C)

#### TC-CM-CA3-01 · Lote sin orden: orden propuesto en orden natural

- **CA:** CA-CM-3, CM-B5, CM-B6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía `POST /communities/{C}/units/batch` con cinco filas de alta, en este orden y sin `sortOrder` ni `reason`: Depto 31 (210000), Depto 11 (185000), Depto 22 (210000), Depto 12 (195000), Depto 21 (200000), todas `departamento`.
- **Entonces:** 2xx. Cinco unidades con orden: Depto 11 = 1, Depto 12 = 2, Depto 21 = 3, Depto 22 = 4, Depto 31 = 5. La respuesta trae `aliquotSumE6` = 185.000 + 195.000 = 380.000; 380.000 + 200.000 = 580.000; 580.000 + 210.000 = 790.000; 790.000 + 210.000 = 1.000.000, **sin** advertencia. No se exigió motivo. Un registro `unit.batch` con el detalle de las cinco unidades.

#### TC-CM-CA3-02 · Unidad con alícuota 0

- **CA:** CA-CM-3, CM-B3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` crea con `POST /communities/{C}/units` "Bodega B1", tipo `bodega`, `aliquotE6` 0, sin orden.
- **Entonces:** 2xx; orden 6 (el siguiente al mayor existente, 5); `aliquotE6` = 0; `aliquotSumE6` = 1.000.000 + 0 = 1.000.000, sin advertencia; un registro `unit.create`.
- **Heredado (H-WEB):** la pantalla muestra "Sin participación" en lugar de "0,0000 %".

#### TC-CM-CA3-03 · Las pruebas de oro no cambian con las unidades creadas por la API

- **CA:** CA-CM-3 · **Tipo:** prueba de oro · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Cuando:** con las unidades de TC-CM-CA3-01 creadas por la API (no por fixture), se emite $1.234.567 en un solo grupo por alícuota; y, en otra corrida, ordinario $1.175.778 con fondo $58.789.
- **Entonces:** GOLD-C-01 a 05 ($228.395, $240.741, $246.913, $259.259, $259.259; suma $1.234.567) y GOLD-CE-01 a 05 ($228.395, $240.741, $246.914, $259.259, $259.258; suma $1.234.567), con el cálculo de `docs/qa/comunidades-simuladas.md`. El empate del fondo entre Depto 22 y Depto 31 lo gana el orden 4, que es el que propuso la API.

### CA-CM-4 · Validación de la alícuota

#### TC-CM-CA4-01 · Más de 4 decimales de porcentaje

- **CA:** CA-CM-4, CM-B3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` crea "Depto 41" con `aliquotE6` 185000.5.
- **Entonces:** 422 `INVALID_ALIQUOT` con "La alícuota admite hasta 4 decimales"; no se crea nada.

#### TC-CM-CA4-02 · Fuera de rango, ausente o no numérica

- **CA:** CA-CM-4 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` crea "Depto 41" con `aliquotE6` (a) 1000001; (b) −1; (c) ausente; (d) nulo; (e) "abc".
- **Entonces:** 422 `INVALID_ALIQUOT` con "La alícuota debe estar entre 0 % y 100 %" en las cinco; no se crea nada.

#### TC-CM-CA4-03 · 100 % se acepta y la suma queda sobre 100 %

- **CA:** CA-CM-4, CM-B4 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** las cinco unidades de TC-CM-CA3-01 (suma 1.000.000).
- **Cuando:** `admin-C` crea "Depto 41" con `aliquotE6` 1000000.
- **Entonces:** 2xx; `aliquotSumE6` = 1.000.000 + 1.000.000 = 2.000.000; advertencia "Las alícuotas suman 200,0000 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas" (2.000.000 div 10.000 = 200; 2.000.000 mod 10.000 = 0).

#### TC-CM-CA4-04 · Función de conversión de texto a `aliquotE6`

- **CA:** CA-CM-4, S-CM-6 · **Tipo:** unitaria · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** se llama a la función de `packages/shared` con cada texto.
- **Entonces:** "18,5" → 185000; "18.5" → 185000; "18,5000" → 185000; "100" → 1000000; "0" → 0; "0,0001" → 1; "99,9999" → 999999; "100,0000" → 1000000. Rechaza: "18,50001", "100,0001", "-1", "1e2" y "18,5 %". La implementación no usa `Number`, `parseFloat` ni aritmética de punto flotante (se verifica con PROP-CM-02 y con una regla de lint sobre el archivo).
- **Bloqueado en parte (H-CM-5):** la spec no dice si se aceptan "", " 18,5 ", "018,5", ",5", "18," ni "+18,5". **Supuesto (a validar):** se rechazan todos (gramática: 1 a 3 dígitos, y opcionalmente coma o punto seguido de 1 a 4 dígitos).

### CA-CM-5 · Suma distinta de 100 %: se guarda y bloquea la emisión

#### TC-CM-CA5-01 · La edición se guarda con advertencia

- **CA:** CA-CM-5, CM-B4 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** las unidades de TC-CM-CA3-01.
- **Cuando:** `admin-C` envía `PATCH /communities/{C}/units/{Depto 31}` con `aliquotE6` 209900.
- **Entonces:** 2xx; `aliquotSumE6` = 185.000 + 195.000 + 200.000 + 210.000 + 209.900 = 999.900; advertencia "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas" (999.900 div 10.000 = 99; 999.900 mod 10.000 = 9.900); un registro `unit.update` con `aliquot_e6` 210000 → 209900. `GET /communities/{C}/units` leído por `admin-C` trae la misma suma y la misma advertencia.

#### TC-CM-CA5-02 · La emisión por alícuota se bloquea

- **CA:** CA-CM-5, GC CA-19 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Cuando:** se pide la emisión de un periodo de C con un grupo por alícuota.
- **Entonces:** 422 `ALIQUOTS_NOT_100` con "Las alícuotas suman 99,9900 %; deben sumar 100,0000 %"; no se crea ningún cargo (ya cubierto por TC-GC-CA19-01; aquí se verifica con unidades editadas por la API).

### CA-CM-6 · Código y orden repetidos, y lote todo o nada (Comunidad C)

Estado inicial de cada caso: las cinco unidades de TC-CM-CA3-01.

#### TC-CM-CA6-01 · Código repetido con otra escritura

- **CA:** CA-CM-6, CM-B2 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` crea una unidad con el código "depto  11" (minúscula y dos espacios), alícuota 0.
- **Entonces:** 409 `UNIT_CODE_ALREADY_EXISTS` con "El código Depto 11 ya existe en esta comunidad" (el texto usa el código guardado); no se crea nada.

#### TC-CM-CA6-02 · Orden repetido

- **CA:** CA-CM-6, CM-B5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` crea "Depto 41", alícuota 0, con `sortOrder` 3.
- **Entonces:** 409 `SORT_ORDER_ALREADY_USED` con "El orden 3 ya lo usa Depto 21"; no se crea nada.

#### TC-CM-CA6-03 · Lote con filas inválidas: no se guarda nada

- **CA:** CA-CM-6, CM-B6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía un lote de tres altas: fila 1 "Depto 41" (alícuota 0, válida), fila 2 sin código (alícuota 0), fila 3 "Depto 42" con `aliquotE6` 1000001.
- **Entonces:** 422 `UNITS_INVALID` con "No se guardó nada. Corrige las filas marcadas e intenta de nuevo" y `rows` con exactamente dos elementos: fila 2, `UNIT_CODE_REQUIRED`, "Ingresa el código de la unidad"; fila 3, código "Depto 42", `INVALID_ALIQUOT`, "La alícuota debe estar entre 0 % y 100 %". La fila 1 no aparece. Siguen existiendo solo las cinco unidades iniciales; cero auditoría y cero `IDEMPOTENCY_KEY`.

#### TC-CM-CA6-04 · Dos filas del lote con el mismo código

- **CA:** CA-CM-6, CM-B6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía un lote con dos altas: fila 1 "Depto 41" y fila 2 "depto 41".
- **Entonces:** 422 `UNITS_INVALID` con solo la fila 2: `UNIT_CODE_ALREADY_EXISTS`, "El código Depto 41 está repetido en la fila 1". No se crea nada.

#### TC-CM-CA6-05 · Tope del lote

- **CA:** CA-CM-6, S-CM-8 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Cuando:** `admin-C` envía (a) un lote con 501 altas válidas ("U 1" a "U 501", alícuota 0); (b) un lote con 500 altas válidas ("U 1" a "U 500").
- **Entonces:** (a) 422 `UNITS_BATCH_TOO_LARGE` con "Puedes guardar hasta 500 unidades por vez. Divide la carga en partes"; nada creado. (b) 2xx; 500 unidades con órdenes 6 a 505 en orden natural (U 1 = 6, U 2 = 7, …, U 500 = 505); el cuerpo de la petición pesa menos de 100 kB.

#### TC-CM-CA6-06 · Intercambio de orden en un lote

- **CA:** CA-CM-6, CM-B5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía un lote con dos ediciones: Depto 21 (orden 3) a `sortOrder` 4 y Depto 22 (orden 4) a `sortOrder` 3.
- **Entonces:** 2xx; Depto 21 queda con 4 y Depto 22 con 3; códigos, tipos y alícuotas sin cambio; `aliquotSumE6` 1.000.000; un solo registro `unit.batch` con el valor anterior y el nuevo de cada unidad.

#### TC-CM-CA6-07 · Dos filas del lote con el mismo orden y choque con una unidad fuera del lote

- **CA:** CM-B6 (menor 4) · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía (a) un lote con dos altas, fila 1 "Depto 41" con `sortOrder` 9 y fila 2 "Depto 42" con `sortOrder` 9; (b) un lote con un alta "Depto 41" con `sortOrder` 3 (lo usa Depto 21, que no está en el lote); (c) un lote con un alta "DEPTO 12" (existe "Depto 12" fuera del lote).
- **Entonces:** (a) 422 `UNITS_INVALID` solo con la fila 2: `SORT_ORDER_ALREADY_USED`, "El orden 9 está repetido en la fila 1". (b) 422 `UNITS_INVALID` con la fila 1: `SORT_ORDER_ALREADY_USED`, "El orden 3 ya lo usa Depto 21". (c) 422 `UNITS_INVALID` con la fila 1: `UNIT_CODE_ALREADY_EXISTS`, "El código Depto 12 ya existe en esta comunidad". Nada creado en los tres.

#### TC-CM-CA6-08 · La unicidad se evalúa contra el estado final del lote

- **CA:** CM-B6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` envía un lote con (fila 1) la edición de Depto 11 a código "Depto 13" y (fila 2) un alta "Depto 11" con alícuota 0 y `sortOrder` 7.
- **Entonces:** 2xx: en el estado final no hay dos unidades con el mismo código. La unidad que era Depto 11 se llama "Depto 13" con orden 1; la nueva "Depto 11" tiene orden 7.

### CA-CM-7 · Cambio de alícuotas después de un periodo emitido (Comunidad A; GOLD-ACM7)

Estado: Comunidad A con `2026-10` emitido el 2026-11-01 (GOLD-A-01 a 04: $210.000, $262.500, $262.500, $315.000) y el borrador `2026-11` con gastos ordinarios por $1.000.000 y fondo 500 pb.

#### TC-CM-CA7-01 · Sin motivo, el lote se rechaza

- **CA:** CA-CM-7, CM-B7 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-P
- **Cuando:** el 2026-11-20, `admin-A` envía un lote con dos ediciones: Depto 101 a `aliquotE6` 190000 y Depto 202 a 310000, sin `reason`; y, en otra petición, con `reason` "   ".
- **Entonces:** 422 `REASON_REQUIRED` con "Indica el motivo del cambio y el documento que lo respalda"; Depto 101 sigue en 200000 y Depto 202 en 300000; cero auditoría.
- **Supuesto (a validar):** un motivo de solo espacios equivale a un motivo ausente, como la referencia del pago manual en GC.

#### TC-CM-CA7-02 · Con motivo, el lote se guarda y se audita

- **CA:** CA-CM-7, CM-G1 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-P
- **Cuando:** `admin-A` reenvía el lote con `reason` "Modificación del reglamento, asamblea extraordinaria del 18-11-2026".
- **Entonces:** 2xx; Depto 101 = 190000 y Depto 202 = 310000; `aliquotSumE6` = 190.000 + 250.000 + 250.000 + 310.000 = 1.000.000, sin advertencia; un registro `unit.batch` con, por unidad, `aliquot_e6` anterior y nuevo (200000 → 190000; 300000 → 310000) y el motivo.

#### TC-CM-CA7-03 · El periodo emitido no cambia

- **CA:** CA-CM-7, regla 6 de `CLAUDE.md` · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Entonces:** después de TC-CM-CA7-02, la foto de participaciones de `2026-10` conserva 200000, 250000, 250000 y 300000, y los movimientos de `2026-10` son idénticos fila a fila a los de antes (GOLD-A-01 a 04, suma $1.050.000).

#### TC-CM-CA7-04 · La emisión siguiente usa las alícuotas nuevas (GOLD-ACM7-01 a 04)

- **CA:** CA-CM-7, regla 3 de `CLAUDE.md` · **Tipo:** prueba de oro · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Cuando:** se emite `2026-11` el 2026-12-01, con fondo (1.000.000 × 500 + 9.999) div 10.000 = 500.009.999 div 10.000 = $50.000.
- **Entonces:** GOLD-ACM7-01 Depto 101: 1.000.000 × 190.000 / 1.000.000 = 190.000; 50.000 × 190.000 / 1.000.000 = 9.500; 190.000 + 9.500 = $199.500. GOLD-ACM7-02 Depto 102: 250.000 + 12.500 = $262.500. GOLD-ACM7-03 Depto 201: 250.000 + 12.500 = $262.500. GOLD-ACM7-04 Depto 202: 310.000 + 15.500 = $325.500. Suma: 199.500 + 262.500 = 462.000; 462.000 + 262.500 = 724.500; 724.500 + 325.500 = $1.050.000.

#### TC-CM-CA7-05 · La corrección de un periodo emitido usa su foto (GOLD-ACM7-05)

- **CA:** CA-CM-7, D58 · **Tipo:** prueba de oro · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Cuando:** el 2026-12-02, después de emitir `2026-11`, `admin-A` anula el gasto "Aseo y artículos" ($50.000) de `2026-10`.
- **Entonces:** el Depto 101 recibe dos notas de crédito calculadas con el 20 % de la foto de `2026-10`: ordinario 950.000 × 20 % − 200.000 = 190.000 − 200.000 = −$10.000; fondo corregido (950.000 × 500 + 9.999) div 10.000 = $47.500, y 47.500 × 20 % − 10.000 = 9.500 − 10.000 = −$500; total −$10.500 (GOLD-ACM7-05, igual a GOLD-A33-01). Las notas quedan en el borrador `2026-12`. Los cargos de `2026-11` (GOLD-ACM7-01 a 04) no cambian y siguen sumando $1.050.000. Una implementación que use el 19 % actual daría −$19.500 y −$975 (−$20.475) y debe fallar.

### CA-CM-8 · Cambio de alícuotas y vista previa de emisión (Comunidad A)

#### TC-CM-CA8-01 · El cambio de alícuotas invalida la vista previa

- **CA:** CA-CM-8, GC A-7 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Dado:** el estado de CA-CM-7 antes del cambio y una vista previa de emisión de `2026-11` del 2026-11-30, con su `previewHash`.
- **Cuando:** `admin-A` envía con motivo el lote de TC-CM-CA7-02 y después confirma la emisión con el `previewHash` anterior.
- **Entonces:** 409 `PREVIEW_OUTDATED` con "El borrador cambió desde la vista previa. Revisa la nueva vista previa antes de emitir"; no se crea ningún movimiento; `2026-11` sigue en borrador.

#### TC-CM-CA8-02 · Si la suma deja de ser 100 %, responde `ALIQUOTS_NOT_100` y no 409

- **CA:** CA-CM-8 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-P (guardar con advertencia) y H-EMI (emisión)
- **Cuando:** `admin-A` edita solo el Depto 101 a 190000, con motivo; después confirma la emisión con el `previewHash` anterior.
- **Entonces:** la edición responde 2xx con `aliquotSumE6` = 190.000 + 250.000 + 250.000 + 300.000 = 990.000 y la advertencia "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %. Puedes guardar, pero no podrás emitir gastos por alícuota hasta corregirlas". La emisión responde 422 `ALIQUOTS_NOT_100` con "Las alícuotas suman 99,0000 %; deben sumar 100,0000 %"; no se crea nada.

#### TC-CM-CA8-03 · Cambiar solo el código no exige motivo ni invalida la vista previa

- **CA:** CA-CM-8, CM-B7, R2-m-3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-P (edición) y H-EMI (emisión)
- **Cuando:** `admin-A` envía `PATCH` del Depto 101 con el código "Dpto. 101", sin `reason`; después confirma la emisión con el `previewHash` anterior.
- **Entonces:** la edición responde 2xx sin pedir motivo, con un registro `unit.update` (código "Depto 101" → "Dpto. 101"). La emisión procede y crea los cargos de la vista previa.

### CA-CM-9 · Eliminación de una unidad

#### TC-CM-CA9-01 · Eliminar una unidad creada por error

- **CA:** CA-CM-9, CM-B8 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** la Comunidad C con las unidades de TC-CM-CA3-01 y "Depto 41" (alícuota 50000, orden 6), sin ocupaciones; suma 1.000.000 + 50.000 = 1.050.000.
- **Cuando:** `admin-C` envía `DELETE /communities/{C}/units/{Depto 41}` sin motivo.
- **Entonces:** 2xx; la fila de la unidad ya no existe; `aliquotSumE6` = 1.050.000 − 50.000 = 1.000.000, sin advertencia; un registro `unit.delete` con el código, el tipo, la alícuota y el orden de la unidad eliminada. Un `GET` posterior de esa unidad responde 404.

#### TC-CM-CA9-02 · Unidad referenciada: no se elimina

- **CA:** CA-CM-9 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1 (referencia por ocupación), R1-P (orden con el motivo) y H-EMI (referencia solo por la foto)
- **Cuando:** `admin-A` elimina el Depto 101 (que tiene la ocupación de propietaria de Ana Pérez) (a) sin periodos emitidos; (b) con `2026-10` emitido y sin motivo; (c) con `2026-10` emitido y con motivo.
- **Entonces:** 409 `UNIT_IN_USE` con "Esta unidad ya tiene ocupantes, movimientos, gastos o periodos emitidos. No se puede eliminar" en los tres (en (b) no responde `REASON_REQUIRED`: el estado va antes que el motivo). Nada cambia.
- **Heredado (H-EMI):** una unidad sin ocupaciones que está en la foto de `2026-10` responde el mismo 409.

#### TC-CM-CA9-03 · Una ocupación cancelada también cuenta

- **CA:** CA-CM-9, S-CM-12 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** en la Comunidad C, el Depto 12 con un arriendo programado (registrado el 2026-11-12 con ingreso 2026-12-01) que se canceló el 2026-11-13; sin otras ocupaciones ni periodos emitidos.
- **Cuando:** `admin-C` elimina el Depto 12.
- **Entonces:** 409 `UNIT_IN_USE`; la unidad y la ocupación cancelada siguen.

#### TC-CM-CA9-04 · Toda clave foránea hacia la unidad está cubierta

- **CA:** CA-CM-9, CM-B8 · **Tipo:** integración (esquema) · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** la prueba lee del catálogo de PostgreSQL todas las claves foráneas que apuntan a `UNIT` y, para cada una, crea una fila que referencia a una unidad de prueba y pide eliminarla.
- **Entonces:** cada intento responde 409 `UNIT_IN_USE`. La prueba falla si encuentra una clave foránea que no está en su lista de casos (una tabla nueva sin cubrir). Una migración de prueba que agrega una tabla con referencia a `UNIT` hace fallar la prueba.

#### TC-CM-CA9-05 · Unidad en el conjunto de un gasto de partes iguales del borrador

- **CA:** CM-B8 (requisito heredado) · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Cuando:** el borrador de la Comunidad B tiene un gasto `partes_iguales` cuyo conjunto incluye una unidad sin ocupaciones, y el administrador pide eliminarla.
- **Entonces:** 409 `UNIT_IN_USE`; el borrador, el gasto y su conjunto no cambian (reglas 2 y 3 de `CLAUDE.md`). La rebanada de emisión lo escribe con TDD.

#### TC-CM-CA9-06 · Eliminar con un periodo emitido exige motivo

- **CA:** CM-B8, CM-B7 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-P
- **Dado:** la Comunidad A con `2026-10` emitido y "Depto 301" creado después (con motivo), alícuota 0, sin ocupaciones.
- **Cuando:** `admin-A` lo elimina (a) sin motivo; (b) con el motivo "Unidad creada por error de digitación".
- **Entonces:** (a) 422 `REASON_REQUIRED` con "Indica el motivo de la eliminación"; (b) 2xx y `unit.delete` con el motivo.

### CA-CM-10 · Permisos sobre unidades (Comunidad A)

#### TC-CM-CA10-01 · El comité lista todas las unidades con la suma

- **CA:** CA-CM-10 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `comite-A` pide `GET /communities/{A}/units` y `GET /communities/{A}/units/{Depto 202}`.
- **Entonces:** 2xx; la lista trae las cuatro unidades con código, tipo y `aliquotE6`, y `aliquotSumE6` = 1.000.000; el detalle trae el Depto 202.

#### TC-CM-CA10-02 · El comité no modifica unidades

- **CA:** CA-CM-10 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `comite-A` envía un alta, un `PATCH` del Depto 101, un lote y un `DELETE` del Depto 101, cada uno con cuerpo válido y con JSON mal formado.
- **Entonces:** 403 `FORBIDDEN` en todas; nada cambia.

#### TC-CM-CA10-03 · El residente lista solo sus unidades, sin la suma

- **CA:** CA-CM-10, CM-B4 · **Tipo:** permisos, datos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `propietario-101` (Ana Pérez, sin otros roles) y `arrendatario-102` (O-1 vigente) piden `GET /communities/{A}/units`.
- **Entonces:** 2xx; Ana recibe solo el Depto 101 y el arrendatario solo el Depto 102, con código, tipo y `aliquotE6`. Prueba de contrato: el JSON no contiene las claves `aliquotSumE6` ni la de la advertencia (los campos no viajan, ni con valor nulo).

#### TC-CM-CA10-04 · El residente no ve unidades ajenas ni la configuración

- **CA:** CA-CM-10 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `propietario-101` pide `GET` del Depto 102, envía un alta, un lote, un `PATCH` del Depto 101 y un `DELETE` del Depto 101.
- **Entonces:** 404 `NOT_FOUND` en las cinco, con el mismo cuerpo que un id inexistente; nada cambia.

### CA-CM-11 · Aislamiento de unidades entre comunidades

#### TC-CM-CA11-01 · Vía guard: rutas de la Comunidad B

- **CA:** CA-CM-11, regla 4 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide `GET /communities/{B}/units`, `GET /communities/{B}/units/{Casa 1}` y `PATCH /communities/{B}/units/{Casa 1}` con `aliquotE6` 0; y repite las dos últimas con un id inexistente.
- **Entonces:** 404 `NOT_FOUND` en las cinco, con el mismo cuerpo. Las unidades de B quedan idénticas fila a fila; cero auditoría en B.

#### TC-CM-CA11-02 · Vía capa de datos: id de B en la ruta de A

- **CA:** CA-CM-11, ADR 0009 paso 3b · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía `GET`, `PATCH` (válido y con JSON mal formado) y `DELETE` a `/communities/{A}/units/{id de Casa 1}`.
- **Entonces:** 404 `NOT_FOUND` en las cuatro, antes de validar el cuerpo, con el mismo cuerpo que un id inexistente. Nada cambia en A ni en B.

#### TC-CM-CA11-03 · Lote con un `unitId` de otra comunidad

- **CA:** CA-CM-11, CM-B6 (M-4), ISO-5 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía por la ruta de A un lote con (fila 1) una edición válida del Depto 101 a `aliquotE6` 190000 y (fila 2) una edición con el `unitId` de la Casa 1 de B; lo repite (b) con un `unitId` inexistente en la fila 2; (c) con una clave que ya tiene un éxito guardado con otro cuerpo; (d) agregando una fila 3 inválida (alícuota 1000001).
- **Entonces:** 404 `NOT_FOUND` en las cuatro, con el mismo cuerpo (no `IDEMPOTENCY_KEY_REUSED` en (c) ni `UNITS_INVALID` en (d)). El Depto 101 sigue en 200000; la Casa 1 no cambia; cero auditoría.

#### TC-CM-CA11-04 · `unitId` repetido en el lote

- **CA:** CA-CM-11, CM-B6 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Cuando:** `admin-A` envía un lote con dos filas con el `unitId` del Depto 101.
- **Entonces:** 400 `BAD_REQUEST`; nada cambia.

#### TC-CM-CA11-05 · La unicidad del código es por comunidad

- **CA:** CA-CM-11 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` crea en A una unidad "Casa 1", tipo `casa`, alícuota 0, con `sortOrder` 1 … no: sin `sortOrder`.
- **Entonces:** 2xx; orden 5 (el mayor de A es 4; no cuenta el orden 1 de la Casa 1 de B); `aliquotSumE6` = 1.000.000 (solo unidades de A: 200.000 + 250.000 + 250.000 + 300.000 + 0). La respuesta y el listado de A no incluyen unidades, sumas ni ids de B. La Casa 1 de B no cambia.

### CA-CM-12 · RUT que existe solo en otra comunidad (D48, ISO-7)

#### TC-CM-CA12-01 · La vista previa es idéntica a la de un RUT inexistente

- **CA:** CA-CM-12, CM-C4, D48 · **Tipo:** aislamiento, datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Felipe Rojas (22.456.789-8), administrador de B con ficha en B ("Felipe Rojas", `frojas.b@example.com`) y un contacto verificado sembrado en `PERSON`; sin ficha en A. El RUT 11.111.111-1 no existe en ComVive.
- **Cuando:** `admin-A` pide `POST /communities/{A}/units/{Depto 102}/occupancies/preview` con ingreso 2026-11-15, nombre "F. Rojas" y correo `frojas@example.com`, (a) con el RUT 22.456.789-8 y (b) con el RUT 11.111.111-1.
- **Entonces:** las dos respuestas tienen el mismo código, las mismas claves, la misma estructura y los mismos textos; al reemplazar en cada una el RUT enviado (completo y enmascarado) y el `previewHash` por un marcador, son iguales byte a byte. Ninguna contiene "ya tiene cuenta", "ya está registrada", "Felipe Rojas", `frojas.b@example.com`, el nombre de la Comunidad B ni un indicador de persona nueva o existente. Las vistas previas no escriben nada.
- **Supuesto (a validar) (H-CM-8):** el `previewHash` puede diferir en valor, con el mismo formato y largo.

#### TC-CM-CA12-02 · Al confirmar, la ficha usa los datos de esta comunidad

- **CA:** CA-CM-12 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` confirma el alta de (a) con su `previewHash`.
- **Entonces:** 2xx; una ficha (Felipe, Comunidad A) con nombre "F. Rojas" y correo `frojas@example.com`; una ocupación de arrendatario del Depto 102; una membresía `resident` en A con `valid_from` igual al `effective_from`; ninguna `PERSON` nueva. La respuesta de la ejecución tiene la misma forma que la de un RUT nuevo (se compara con la ejecución de (b) en una corrida aparte).

#### TC-CM-CA12-03 · Nada cambia en la otra comunidad ni en la persona

- **CA:** CA-CM-12 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** después de TC-CM-CA12-02, la membresía `admin` de Felipe en B, su ficha en B y sus contactos en `PERSON` son idénticos fila a fila. `admin-B` no ve nada de A: `GET /communities/{A}/...` responde 404 y `GET /communities/{B}/memberships` no trae la ocupación ni la membresía de A.

#### TC-CM-CA12-04 · La misma regla en el propietario faltante

- **CA:** CM-C4 ("la vista previa de una ocupación") · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-C` pide `POST /communities/{C}/units/{Depto 12}/ownership-transfers/preview` (unidad sin propietario) con fecha 2026-11-01, nombre "F. Rojas" y sin contacto, con el RUT 22.456.789-8 y con el RUT 11.111.111-1.
- **Entonces:** el mismo resultado que TC-CM-CA12-01.

### CA-CM-13 · Datos mínimos y orden de validación del alta de arrendatario

#### TC-CM-CA13-01 · Un error por vez, en orden

- **CA:** CA-CM-13 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide la vista previa del alta en el Depto 102, con ingreso 2026-11-15, en cinco pasos: (1) RUT 15.234.567-9, sin nombre, celular "+56 9 123"; (2) RUT 15.234.567-4, sin nombre, celular "+56 9 123"; (3) con el nombre "Pedro Soto" y el mismo celular; (4) sin celular ni correo; (5) como (4) más un campo "fechaNacimiento".
- **Entonces:** (1) 422 `INVALID_RUT` con "Ingresa un RUT válido. Revisa el dígito verificador"; (2) 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre de la persona"; (3) 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido"; (4) 2xx; (5) 400 `BAD_REQUEST`. Ninguna escribe.

#### TC-CM-CA13-02 · El mismo orden en la ejecución, y la fecha

- **CA:** CA-CM-13, CM-E1 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía `POST .../units/{Depto 102}/occupancies` con (a) las fallas del paso (1); (b) un cuerpo válido sin fecha de ingreso; (c) fecha "15-11-2026" (formato inválido); (d) cuerpo válido con un `previewHash` de otra vista previa.
- **Entonces:** (a) 422 `INVALID_RUT`; (b) y (c) 400 `BAD_REQUEST`; (d) 409 `PREVIEW_OUTDATED`. Nada escrito.

#### TC-CM-CA13-03 · Contacto y RUT se guardan normalizados

- **CA:** CM-C2, CM-C3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` registra a Pedro Soto con RUT "15.234.567-4", celular "+56 9 1111 2222" y correo `Pedro.Soto@Example.com`.
- **Entonces:** `PERSON.rut` = `15234567-4`; la ficha guarda `+56911112222` y `pedro.soto@example.com`.

### CA-CM-14 · Propietario como arrendatario y venta al arrendatario

Estado: Depto 102 de Luis Muñoz, con O-1 de Pedro Soto vigente desde el 2026-11-15; hoy 2026-12-02.

#### TC-CM-CA14-01 · El propietario no es arrendatario de su unidad

- **CA:** CA-CM-14, CM-E2 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide la vista previa y la ejecución del alta de Luis Muñoz (12.345.670-K) como arrendatario del Depto 102.
- **Entonces:** 422 `OWNER_CANNOT_BE_TENANT` con "Esta persona es propietaria de la unidad. No puede ser también su arrendataria" (y no 409 `TENANT_ALREADY_ACTIVE`). Nada escrito. En el Depto 101 (sin arrendatario), el alta de Luis Muñoz como arrendatario se acepta.

#### TC-CM-CA14-02 · Venta al arrendatario vigente

- **CA:** CA-CM-14, CM-E3 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-F (`occupancy.end_and_transfer`)
- **Cuando:** `admin-A` pide la vista previa y la ejecución de la venta del Depto 102 a Pedro Soto con fecha 2026-12-01.
- **Entonces:** 409 `BUYER_IS_CURRENT_TENANT` con "Esta persona es la arrendataria vigente o programada de la unidad. Registra primero el término o la cancelación de su arriendo"; nada cambia.

#### TC-CM-CA14-03 · Primero el término, después la venta

- **CA:** CA-CM-14, CM-D5, CM-E6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-F
- **Cuando:** `admin-A` registra el término de O-1 con fecha 2026-12-02 (vista previa y ejecución) y después la venta del Depto 102 a Pedro Soto con fecha 2026-12-02.
- **Entonces:** las dos responden 2xx. Tras el término: O-1 terminada; la membresía `resident` de Pedro Soto revocada (no le queda otra ocupación), con auditoría `membership.revoke`. Tras la venta: la ocupación de propietario de Luis Muñoz terminada y su membresía `resident` revocada; una ocupación de propietario de Pedro Soto; una membresía `resident` **nueva** de Pedro Soto (otro id); su ficha es la misma. Con esa membresía, `GET .../units` le devuelve el Depto 102. Ninguna de las cuatro respuestas (dos vistas previas, dos ejecuciones) trae una sección ni un texto sobre deuda, saldo a favor, traspaso o dinero (búsqueda de las claves y de las palabras "deuda", "saldo", "traspaso", "dinero" y "$").

#### TC-CM-CA14-04 · Traspaso de la deuda al terminar O-1

- **CA:** CA-CM-14, D51 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-LIB
- **Entonces:** el traspaso del ámbito de O-1 al ámbito `owner` (GC F-9, CA-21; PROP-GC-23) lo verifica la rebanada del libro, que no enciende el flag sin esa prueba.

### CA-CM-15 · Membresía de residente con varias ocupaciones

#### TC-CM-CA15-01 · Una membresía y una ficha con dos unidades

- **CA:** CA-CM-15, CM-D5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** un escenario sin Rosa Díaz: el Depto 201 no tiene propietario.
- **Cuando:** `admin-A` registra a Marco Silva (18.234.765-5), ya propietario del Depto 202, como propietario faltante del Depto 201.
- **Entonces:** 2xx; Marco Silva tiene **una** membresía `resident` no revocada y **una** ficha en A; `GET .../units` le devuelve el Depto 201 y el Depto 202 y nada más.

#### TC-CM-CA15-02 · La venta de una unidad no corta el acceso a la otra

- **CA:** CA-CM-15 · **Tipo:** integración, permisos · **Prioridad:** 1 · **Rebanada:** R1-F
- **Cuando:** `admin-A` registra la venta del Depto 201 a Nicolás Bravo (19.111.222-9).
- **Entonces:** la membresía de Marco Silva sigue vigente (misma fila, sin `revoked_at`). Desde la petición siguiente, `GET .../units/{Depto 201}` le responde 404 y `GET .../units/{Depto 202}` 2xx.

#### TC-CM-CA15-03 · La venta de la última unidad termina la membresía

- **CA:** CA-CM-15, GC S-81 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1-F
- **Cuando:** después, `admin-A` registra la venta del Depto 202 a Nicolás Bravo.
- **Entonces:** la membresía `resident` de Marco Silva queda revocada; se eliminan sus suscripciones push de esa membresía (sembradas por la prueba); `SESSION` no cambia; toda ruta de A le responde 404; `membership.revoke` en auditoría. Nicolás Bravo conserva una sola membresía `resident`.

#### TC-CM-CA15-04 · Ocupación programada: la membresía rige desde su inicio

- **CA:** CA-CM-15, GC CA-53 · **Tipo:** integración, aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** el 2026-11-25, `admin-A` registra a Daniela Fuentes (13.579.246-2) como arrendataria del Depto 102 con ingreso 2026-12-05 (O-4).
- **Entonces:** su membresía `resident` tiene `valid_from` 2026-12-05. Con el reloj en 2026-12-04 23:59, `GET /communities/{A}` y `GET .../units` le responden 404; con el reloj en 2026-12-05 00:00, 2xx con solo el Depto 102.

#### TC-CM-CA15-05 · Adelanto de `valid_from`

- **CA:** CA-CM-15, S-CM-26 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** O-4 registrada el 2026-11-25, y el Depto 202 sin arrendatario.
- **Cuando:** el 2026-11-27, `admin-A` registra a Daniela como arrendataria del Depto 202 con ingreso declarado 2026-11-20.
- **Entonces:** la ocupación nueva queda vigente con `effective_from` 2026-11-27; la **misma** membresía `resident` pasa a `valid_from` 2026-11-27 (no hay una segunda); `first_access_at` sigue nulo; un registro `membership.update_validity` con 2026-12-05 → 2026-11-27. El 2026-11-27, `GET .../units` le devuelve solo el Depto 202 y `GET .../units/{Depto 102}` responde 404; el 2026-12-05, la lista trae los dos.

#### TC-CM-CA15-06 · La cancelación termina la membresía

- **CA:** CA-CM-15, GC CA-61 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Daniela solo tiene O-4.
- **Cuando:** el 2026-11-26, `admin-A` cancela O-4 con el motivo "El contrato no se firmó".
- **Entonces:** O-4 cancelada; la membresía `resident` de Daniela revocada (`membership.revoke`); su ficha sigue; el 2026-12-05, toda ruta de A le responde 404.

### CA-CM-16 · Revocación del comité y límites de la ruta de membresías

Estado: Rosa Díaz integra el comité de A (GC CA-43); Carolina Lagos y Héctor Molina son administradores.

#### TC-CM-CA16-01 · Revocar sin motivo

- **CA:** CA-CM-16, CM-D4 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Cuando:** `admin-A` envía `POST /communities/{A}/memberships/{comité de Rosa}/revoke` sin motivo.
- **Entonces:** 422 `REASON_REQUIRED` con "Indica el motivo de la revocación"; nada cambia.

#### TC-CM-CA16-02 · Revocar con motivo

- **CA:** CA-CM-16, GC S-81 · **Tipo:** integración, permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` la revoca con el motivo "Término del periodo del comité"; en la petición siguiente Rosa pide `GET .../owner-roster`, `GET .../units` y `GET .../units/{Depto 201}`.
- **Entonces:** 2xx; la membresía `committee` queda con `revoked_at`, quién y el motivo; se eliminan las suscripciones push de esa membresía y no las de su membresía `resident`; `SESSION` sin cambios; `membership.revoke` en auditoría. Rosa recibe 404 en el registro de copropietarios; `GET .../units` le devuelve solo el Depto 201, sin `aliquotSumE6`; el detalle del Depto 201 responde 2xx.

#### TC-CM-CA16-03 · Ya revocada, con otra clave y con la misma

- **CA:** CA-CM-16 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** (a) `admin2-A` envía la revocación con motivo y otra clave; (b) `admin-A` reenvía su petición original con la misma clave y el mismo cuerpo.
- **Entonces:** (a) 409 `ROLE_ALREADY_REVOKED` con "Este rol ya fue revocado"; (b) la respuesta original (2xx), sin un segundo registro de auditoría.

#### TC-CM-CA16-04 · Un administrador no revoca administradores por la ruta de comunidad

- **CA:** CA-CM-16, E-CM-1, D57 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía la revocación, con motivo, de (a) la membresía `admin` de Héctor Molina; (b) su propia membresía `admin`; (c) la de Héctor con una clave que ya tiene un éxito guardado con otro cuerpo.
- **Entonces:** 403 `FORBIDDEN` en las tres (paso 4, antes de la idempotencia); nada cambia.

#### TC-CM-CA16-05 · El 403 de E-CM-1 va después de la forma

- **CA:** CA-CM-16, D57 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía la revocación de la membresía `admin` de Héctor Molina (a) con JSON mal formado; (b) sin el encabezado `Idempotency-Key`.
- **Entonces:** 400 `BAD_REQUEST` en las dos; nada cambia.

#### TC-CM-CA16-06 · El rol de residente no se otorga ni se revoca por esta ruta

- **CA:** CA-CM-16, CM-D5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` (a) revoca, con motivo, la membresía `resident` de Ana Pérez; (b) la revoca sin motivo; (c) otorga `role = resident` con el `personRecordId` de Luis Muñoz; (d) revoca la membresía `resident` de Ana con una clave que ya tiene un éxito guardado con otro cuerpo.
- **Entonces:** (a), (b) y (c) 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` con "El rol de residente nace y termina con la ocupación. Registra el arriendo, su término o la venta en la unidad" (en (b) va antes que `REASON_REQUIRED`); (d) 422 `IDEMPOTENCY_KEY_REUSED` con "Esta operación ya se envió con otros datos. Vuelve a abrir el formulario" (el 422 de residente es del paso 6). Nada cambia.

#### TC-CM-CA16-07 · Roles y campos que el contrato no acepta

- **CA:** CA-CM-16, D50, CM-D2 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía `POST /communities/{A}/memberships` con (a) `role = concierge`; (b) `role = committee`, datos válidos y `validTo` 2027-12-31; (c) lo mismo con `validFrom`; (d) `role = owner`; (e) un campo `rut` en lugar de `personRecordId`.
- **Entonces:** 400 `BAD_REQUEST` en las cinco; ninguna membresía nueva.

#### TC-CM-CA16-08 · El comité y el residente no ven las membresías

- **CA:** CA-CM-16 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Rosa Díaz y Marco Silva integran el comité (dato de escenario).
- **Cuando:** Rosa Díaz revoca la membresía `committee` de Marco Silva, con motivo y con JSON mal formado; `propietario-101` hace lo mismo.
- **Entonces:** 404 `NOT_FOUND` en las cuatro; nada cambia.

#### TC-CM-CA16-09 · Otorgar comité sigue GC S-34

- **CA:** CM-D2, GC CA-43, CA-64 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` otorga `role = committee` con el `personRecordId` de Marco Silva, `assemblyDate` 2026-10-20 y `assemblyReference` "Asamblea ordinaria del 20-10-2026"; y después (b) sin `assemblyReference`; (c) con el `personRecordId` de Pedro Soto (arrendatario, O-1); (d) con el de Carolina Lagos (administradora); (e) otra vez con el de Marco Silva y otra clave.
- **Entonces:** primera petición 2xx: membresía `committee` con `granted_via = community`, `granted_by` = Carolina Lagos, sin `valid_to`, y `membership.grant` en auditoría. (b) 422 `ASSEMBLY_REFERENCE_REQUIRED`; (c) 422 `COMMITTEE_REQUIRES_OWNER`; (d) 422 `ADMIN_COMMITTEE_CONFLICT` con "Esta persona es administradora de la comunidad. No puede integrar también el comité"; (e) 409 `ALREADY_COMMITTEE_MEMBER` con "Esta persona ya integra el comité".

#### TC-CM-CA16-10 · La revocación cierra la tarea "Revisar rol de comité"

- **CA:** CM-D4, GC M-7 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1-F
- **Dado:** con el flag encendido, Rosa Díaz vendió el Depto 201 y existe la tarea abierta "Revisar rol de comité de Rosa Díaz" (GC CA-57).
- **Cuando:** `admin-A` revoca su rol de comité por la ruta de membresías, con motivo.
- **Entonces:** la tarea queda cerrada con `revoked_elsewhere`; `GET .../admin-tasks` ya no la trae abierta; un intento posterior de resolverla responde 409 `TASK_ALREADY_RESOLVED` con "Esta tarea ya fue resuelta".

### CA-CM-18 · "Usuarios y roles"

Estado de GC CA-43: Carolina Lagos y Héctor Molina administradores (otorgados por `operaciones-1`); Rosa Díaz en el comité, otorgado por Carolina Lagos el 2026-10-22 con `assemblyDate` 2026-10-20 y "Asamblea ordinaria del 20-10-2026".

#### TC-CM-CA18-01 · Lo que recibe el administrador

- **CA:** CA-CM-18, CM-D7 · **Tipo:** integración, datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide `GET /communities/{A}/memberships`.
- **Entonces:** 2xx. Administradores: Carolina Lagos, RUT 10.987.654-2 completo, desde, "Otorgado por ComVive", estado de ingreso "Pendiente"; Héctor Molina, 11.223.344-K, igual. Comité: Rosa Díaz, unidad "Depto 201", desde 2026-10-22, asamblea 2026-10-20 con su referencia, estado de ingreso "Pendiente". No trae residentes (ni Ana Pérez, ni Luis Muñoz, ni Marco Silva) ni el nombre de la persona de Operaciones. Prueba de contrato con lista cerrada de campos.

#### TC-CM-CA18-02 · Historial de roles

- **CA:** CA-CM-18 (menor 12) · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Dado:** además, el comité de Rosa se revocó con "Término del periodo del comité" (TC-CM-CA16-02).
- **Cuando:** `admin-A` pide la lista con el filtro de historial.
- **Entonces:** cuatro eventos: dos otorgamientos de `admin` con "Quién" = "Operaciones ComVive", vía `platform` y su motivo; el otorgamiento de comité con "Quién" = Carolina Lagos, vía `community` y la referencia de la asamblea; la revocación de comité con "Quién" = Carolina Lagos, vía `community` y su motivo. Cada uno con a quién y cuándo.
- **Nota (H-CM-10):** el nombre del parámetro del filtro lo fija el contrato del arquitecto.

#### TC-CM-CA18-03 · La lectura se audita

- **CA:** CA-CM-18, CM-G2 · **Tipo:** datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** cada `GET .../memberships` de un administrador deja exactamente un registro de auditoría de lectura (actor, comunidad, recurso, fecha), sin copiar los RUT.

#### TC-CM-CA18-04 · Estado de ingreso por membresía

- **CA:** CA-CM-18, GC D27 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Dado:** la prueba fija `first_access_at` en la membresía `admin` de Carolina Lagos en A; Héctor Molina tiene `first_access_at` solo en una membresía de la Comunidad B (dato de escenario). En la rebanada 1 nadie ingresa, así que el valor se siembra.
- **Entonces:** Carolina aparece "Activo" y Héctor "Pendiente".

#### TC-CM-CA18-05 · Los demás roles no ven "Usuarios y roles"

- **CA:** CA-CM-18 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `comite-A`, `propietario-101` y `arrendatario-102` piden `GET /communities/{A}/memberships`.
- **Entonces:** 404 `NOT_FOUND`; sin auditoría de lectura.

### CA-CM-19 · Corrección de la ficha

#### TC-CM-CA19-01 · Corregir nombre y contacto

- **CA:** CA-CM-19, CM-C6 · **Tipo:** integración, datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Pedro Soto, arrendatario del Depto 102 (O-1), con ficha "Pedro Sotto" y celular `+56911112222`.
- **Cuando:** `admin-A` envía `PATCH /communities/{A}/person-records/{ficha de Pedro}` con nombre "Pedro Soto" y celular "+56 9 3333 4444".
- **Entonces:** 2xx; la ficha queda con "Pedro Soto" y `+56933334444`; un registro `person_record.update` con los valores anteriores **enmascarados** (la fila de auditoría no contiene "Pedro Sotto" completo ni `+56911112222`; búsqueda literal). `GET .../units/{Depto 102}/occupancies` leído por `admin-A` muestra "Pedro Soto" con `+56933334444`.

#### TC-CM-CA19-02 · El contacto verificado de la persona no cambia

- **CA:** CA-CM-19 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** `PERSON` de Pedro Soto con el contacto verificado `+56911112222` (sembrado), y una ficha de Pedro en B con el correo `psoto.b@example.com` (dato de escenario).
- **Entonces:** después de TC-CM-CA19-01, las filas de `PERSON` y la ficha de B son idénticas a las de antes.

#### TC-CM-CA19-03 · La sesión obtenida con el contacto anterior deja de ver la comunidad

- **CA:** CA-CM-19, D55-2 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** desde la petición siguiente a la corrección, la sesión de Pedro obtenida con +56 9 1111 2222 recibe 404 en toda ruta de A y A no aparece en "Mis comunidades"; vuelve a entrar con una invitación a +56 9 3333 4444; el cambio queda en auditoría.

#### TC-CM-CA19-04 · El RUT no se edita

- **CA:** CA-CM-19 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía el `PATCH` con un campo `rut` (solo, y junto con un nombre válido).
- **Entonces:** 400 `BAD_REQUEST`; la ficha y `PERSON.rut` no cambian. El inventario de rutas no tiene ninguna escritura que cambie `PERSON.rut`.

#### TC-CM-CA19-05 · Ficha de un ex residente

- **CA:** CA-CM-19, S-CM-29 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1 (por cancelación) y R1-F (por término)
- **Dado:** (a) Daniela Fuentes después de TC-CM-CA15-06 (O-4 cancelada, sin membresías vigentes); (b) con el flag encendido, Pedro Soto después del término de O-1.
- **Cuando:** `admin-A` corrige el nombre de la ficha.
- **Entonces:** 2xx en las dos, con `person_record.update`.

#### TC-CM-CA19-06 · La ficha de un administrador la corrige ComVive

- **CA:** CA-CM-19, D57 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía el `PATCH` sobre la ficha de Héctor Molina (a) con nombre y contacto válidos; (b) con el nombre ""; (c) con el celular "+56 9 123"; y (d) sobre su propia ficha, con datos válidos.
- **Entonces:** 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` con "Los datos de un administrador los corrige ComVive" en las cuatro (en (b) y (c) va antes que `PERSON_NAME_REQUIRED` e `INVALID_CONTACT`); nada cambia.

#### TC-CM-CA19-07 · El comité y el residente no ven las fichas

- **CA:** CA-CM-19 · **Tipo:** permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `comite-A` y `propietario-101` envían el `PATCH` sobre la ficha de Pedro Soto y sobre la propia.
- **Entonces:** 404 `NOT_FOUND` en las cuatro; nada cambia.

### CA-CM-20 · Lo que cada rol ve de las personas

Estado: Depto 102 con Luis Muñoz propietario y Pedro Soto arrendatario (O-1), los dos con celular en su ficha.

#### TC-CM-CA20-01 · El arrendatario no ve al propietario

- **CA:** CA-CM-20, S-CM-18 · **Tipo:** datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `arrendatario-102` pide `GET .../units/{Depto 102}`.
- **Entonces:** 2xx con código "Depto 102", tipo `departamento` y `aliquotE6` 250000, y nada más (lista cerrada de campos). El JSON no contiene "Luis", "Muñoz", "12.345.670", "12345670" ni su celular. `GET .../units/{Depto 102}/occupancies` y `GET .../owner-roster` le responden 404.

#### TC-CM-CA20-02 · El propietario no ve el RUT ni el contacto del arrendatario

- **CA:** CA-CM-20, GC CA-60 · **Tipo:** datos personales · **Prioridad:** 1 · **Rebanada:** R1 (ficha de unidad) y H-EMI (pantallas de deuda de GC S-44)
- **Cuando:** `propietario-102` pide `GET .../units/{Depto 102}` y `GET .../units/{Depto 102}/occupancies`.
- **Entonces:** el detalle trae código, tipo y alícuota, sin datos de Pedro Soto; el historial responde 404.

#### TC-CM-CA20-03 · El comité ve el historial filtrado

- **CA:** CA-CM-20, GC S-33 · **Tipo:** datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `comite-A` pide `GET .../units/{Depto 102}/occupancies`.
- **Entonces:** 2xx; el propietario con su nombre y RUT `12.345.***-*`; el arrendatario solo como "Arrendatario", sin nombre, RUT ni contacto; el JSON no contiene "Pedro", "Soto", "15.234.567", "670-K" ni ningún celular; exactamente un registro de auditoría de lectura.

#### TC-CM-CA20-04 · El administrador ve todo, con auditoría

- **CA:** CA-CM-20 · **Tipo:** datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide el mismo historial.
- **Entonces:** 2xx con RUT completos (12.345.670-K y 15.234.567-4), nombres y contactos; exactamente un registro de auditoría de lectura.

### CA-CM-21 · Término de un arriendo que no está vigente

#### TC-CM-CA21-01 · Arriendo programado

- **CA:** CA-CM-21, CM-E4 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1-F
- **Dado:** O-5 (Ignacio Paz), programada con `effective_from` 2026-12-10; hoy 2026-11-29.
- **Cuando:** `admin-A` pide `POST .../occupancies/{O-5}/end-preview` y `.../end` con fecha 2026-12-15.
- **Entonces:** 409 `OCCUPANCY_NOT_STARTED` con "Este arriendo aún no comienza. Si no comenzará, cancélalo" (y no 422 `END_DATE_IN_FUTURE`); nada cambia.

#### TC-CM-CA21-02 · Arriendo cancelado o terminado

- **CA:** CA-CM-21 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1-F
- **Cuando:** `admin-A` pide la vista previa del término de (a) O-4 cancelada el 2026-11-26; (b) una ocupación de arrendatario ya terminada; (c) la ocupación de propietario de Luis Muñoz.
- **Entonces:** (a) 409 `OCCUPANCY_CANCELLED` con "Este arriendo ya fue cancelado"; (b) 409 `OCCUPANCY_ALREADY_ENDED` con "Este arriendo ya terminó"; (c) 422 `USE_OWNERSHIP_TRANSFER` con "Para cambiar al propietario, registra la venta".

### CA-CM-22 · Carga inicial de propietarios con fecha antigua (Comunidad C)

#### TC-CM-CA22-01 · Propietario faltante con fecha de 2015

- **CA:** CA-CM-22, CM-E5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** la Comunidad C con las unidades de TC-CM-CA3-01, sin periodos emitidos, el 2026-11-12, flag apagado.
- **Cuando:** `admin-C` pide la vista previa y la ejecución de `ownership-transfers` del Depto 11 para Elena Contreras (8.765.432-K), con fecha de inscripción 2015-03-01 y celular "+56 9 5555 0101".
- **Entonces:** la vista previa trae la advertencia "La fecha de venta es anterior a hoy. Los avisos ya emitidos siguen a nombre del propietario anterior y la deuda de la unidad no cambia". La ejecución responde 2xx: ocupación de propietario vigente con fecha declarada 2015-03-01 y `effective_from` 2026-11-12; ficha de Elena en C; membresía `resident` con `valid_from` 2026-11-12. No responde `OCCUPANCY_ACTION_NOT_AVAILABLE`: la unidad no tenía propietario.

#### TC-CM-CA22-02 · Sin efecto en dinero

- **CA:** CA-CM-22 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** las únicas filas nuevas son `PERSON`, la ficha, `UNIT_OCCUPANCY`, `MEMBERSHIP`, `AUDIT_LOG` e `IDEMPOTENCY_KEY`, todas de la Comunidad C. Cuando exista el libro (H-LIB), se agrega la verificación de cero movimientos.

### CA-CM-23 · Aislamiento de membresías, fichas y ocupaciones

Datos de B: Marta Vidal integra el comité de B; Gabriel Torres es propietario de la Casa 1 de B y no tiene ficha en A.

#### TC-CM-CA23-01 · Ids de B en la ruta de A (recursos de la ruta)

- **CA:** CA-CM-23 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía, con cuerpo válido y con JSON mal formado, `POST /communities/{A}/memberships/{comité de Marta Vidal}/revoke` y `PATCH /communities/{A}/person-records/{ficha de Gabriel Torres en B}`; y lo mismo con ids inexistentes.
- **Entonces:** 404 `NOT_FOUND` en todas, antes de validar el cuerpo y con el mismo cuerpo. La membresía y la ficha de B quedan idénticas; cero auditoría.

#### TC-CM-CA23-02 · `personRecordId` de B en el cuerpo, al otorgar comité

- **CA:** CA-CM-23, CM-D2 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía `POST /communities/{A}/memberships` con `role = committee`, datos de asamblea válidos y el `personRecordId` de Gabriel Torres en B; y con un `personRecordId` inexistente; y el primero con una clave que ya tiene un éxito guardado con otro cuerpo.
- **Entonces:** 404 `NOT_FOUND` en las tres, con el mismo cuerpo (paso 4, antes de la idempotencia); ninguna membresía nueva en A ni en B.

#### TC-CM-CA23-03 · Visibilidad antes que permiso al otorgar `admin`

- **CA:** CA-CM-23, R2-m-2 · **Tipo:** aislamiento, permisos · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` otorga `role = admin` (a) con el `personRecordId` de Gabriel Torres en B; (b) con un `personRecordId` inexistente; (c) con el `personRecordId` de Luis Muñoz en A.
- **Entonces:** (a) y (b) 404 `NOT_FOUND` con el mismo cuerpo (un 403 confirmaría que el id existe); (c) 403 `FORBIDDEN`. Nada cambia.

#### TC-CM-CA23-04 · Ocupaciones con ids de B por la ruta de A

- **CA:** CA-CM-23 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía por la ruta de A, con cuerpo válido y mal formado: la vista previa y la ejecución del alta de arrendatario y de `ownership-transfers` con el `unitId` de la Casa 2; el historial `GET .../units/{Casa 2}/occupancies`; y `end-preview`, `end` y `cancel` con el `occupancyId` de una ocupación de B.
- **Entonces:** 404 `NOT_FOUND` en todas, también con el flag apagado (no `OCCUPANCY_ACTION_NOT_AVAILABLE`); ninguna ocupación, ficha ni membresía cambia en A ni en B.

#### TC-CM-CA23-05 · Las lecturas de A no traen nada de B

- **CA:** CA-CM-23, ISO-6 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Carolina Lagos administra A y B (dato de escenario de CA-75) y Rosa Díaz es además propietaria de la Casa 2 de B (dato de escenario).
- **Cuando:** Carolina, en el contexto de A, pide `GET .../memberships`, `GET .../owner-roster`, `GET .../units` y `GET .../admin-tasks`.
- **Entonces:** solo filas de A: Rosa aparece con el Depto 201 y nunca con la Casa 2; ninguna membresía, ficha, ocupación, unidad ni tarea de B; el nombre de cada persona es el de su ficha en A.

#### TC-CM-CA23-06 · Cada endpoint tiene su prueba generada

- **CA:** CA-CM-23, ADR 0002 decisión 5, ADR 0009 prueba 10 · **Tipo:** aislamiento (barrido) · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** una prueba recorre el inventario de rutas del módulo y falla si alguna ruta de la tabla "Acciones de la rebanada" no tiene sus casos `ISO-CM` (vía guard y, si la ruta lleva un id, vía capa de datos) o su fila en la matriz de permisos.

### CA-CM-24 · Contacto sin verificar por comunidad (D47, D55)

Sofía Navarro (persona X, 17.654.321-3), sin contacto verificado. c1 = +56 9 1111 1111; c2 = `x@example.com`; c3 = +56 9 4444 5555.

#### TC-CM-CA24-01 · Una ficha por comunidad, cada una con su contacto

- **CA:** CA-CM-24, CM-C4 · **Tipo:** aislamiento, datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` registra a X como arrendataria del Depto 102 con c1 y `admin-B` la registra como arrendataria de la Casa 2 con c2.
- **Entonces:** una sola `PERSON`, sin contactos verificados; una ficha en A con `+56911111111` y otra en B con `x@example.com`; una membresía `resident` en cada comunidad. `GET .../units/{Depto 102}/occupancies` leído por `admin-A` no contiene `x@example.com`; el de la Casa 2 leído por `admin-B` no contiene `+56911111111` ni "1111 1111". Corregir la ficha de A a c3 no cambia la de B.

#### TC-CM-CA24-02 · La invitación de A habilita solo A

- **CA:** CA-CM-24, D47 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** al ingresar el código enviado a c1, la sesión de X ve A; toda ruta de B responde 404 y B no aparece en "Mis comunidades"; un ingreso posterior con c1 tampoco ve B.

#### TC-CM-CA24-03 · La invitación de B va al contacto de B

- **CA:** CA-CM-24 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** el código de la invitación de B va a c2 y nunca a c1; solo al ingresarlo se habilita B. Si la ficha de B registrara también c1, la verificación de c1 habilitaría B.

#### TC-CM-CA24-04 · Una sesión limitada no cambia la identidad, y responde igual a toda sesión

- **CA:** CA-CM-24, D55-3, D72 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** con la sesión obtenida por c1 y B sin habilitar, agregar o cambiar un contacto verificado, activar un segundo factor o cerrar otras sesiones no cambia nada sin la condición que fije esa rebanada; la respuesta es idéntica, en código, estructura y texto, a la de una persona con membresía solo en A.

#### TC-CM-CA24-05 · Ingreso normal con dos contactos verificados

- **CA:** CA-CM-24, D55-4 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** X recibe un código distinto en c1 y en c2 (o elige uno); con el de c1 ve solo A y con el de c2 solo B.

#### TC-CM-CA24-06 · Corregir el contacto saca a la sesión anterior

- **CA:** CA-CM-24, D55-1, D55-2 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING
- **Entonces:** después de que `admin-A` corrige la ficha a c3, la sesión obtenida con c1 recibe 404 en toda ruta de A desde la petición siguiente, A sale de "Mis comunidades", el cambio queda en auditoría y X vuelve a A solo con una invitación a c3.

### CA-CM-25 · Persona que ya tiene ficha en la comunidad

#### TC-CM-CA25-01 · La vista previa lo dice

- **CA:** CA-CM-25, CM-C4 · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Dado:** Ana Pérez (12.345.678-5), propietaria del Depto 101, con ficha "Ana Pérez" y `+56922223333`; el Depto 202 sin arrendatario.
- **Cuando:** `admin-A` pide la vista previa del alta de Ana como arrendataria del Depto 202 con nombre "Ana P." y correo `ana@example.com`.
- **Entonces:** 2xx con el texto "Esta persona ya está registrada en la comunidad como Ana Pérez. Se conservan su nombre y su contacto; para cambiarlos, usa Corregir datos".

#### TC-CM-CA25-02 · Al confirmar, la ficha no cambia

- **CA:** CA-CM-25, CM-D5 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` confirma el alta.
- **Entonces:** una ocupación de arrendataria del Depto 202; Ana conserva **una** membresía `resident` (la misma fila) y **una** ficha, con "Ana Pérez" y `+56922223333`, sin correo; no hay `person_record.update`. `GET .../units` le devuelve el Depto 101 y el Depto 202.

#### TC-CM-CA25-03 · Un solo nombre en todas las lecturas

- **CA:** CA-CM-25 (M-8 (c)) · **Tipo:** integración · **Prioridad:** 2 · **Rebanada:** R1
- **Dado:** Ana es además administradora de A (escenario de GC CA-43).
- **Entonces:** `GET .../memberships`, `GET .../owner-roster` y `GET .../units/{Depto 101}/occupancies` la muestran con el mismo nombre, el de su única ficha.

### CA-CM-26 · Término y venta con el flag apagado (D51, D56, D69)

#### TC-CM-CA26-01 · Con el flag apagado, 422 sin validar nada más

- **CA:** CA-CM-26, CM-E6 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** flag apagado; O-1 vigente en el Depto 102 (con propietario vigente).
- **Cuando:** `admin-A` envía `end-preview` y `end` de O-1 (con fecha válida, y con fecha futura), y `ownership-transfers/preview` y `ownership-transfers` del Depto 102 (con datos válidos, con el RUT 15.234.567-9 inválido, y con el RUT de Luis Muñoz, que ya es su propietario).
- **Entonces:** 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` con "El registro de términos de arriendo y de ventas aún no está disponible. Mientras tanto, pide ayuda a ComVive" en todas (no `END_DATE_IN_FUTURE`, `INVALID_RUT` ni `ALREADY_OWNER`). Nada escrito.

#### TC-CM-CA26-02 · Lo que no depende del flag sigue funcionando

- **CA:** CA-CM-26 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** con el flag apagado, (a) `admin-C` registra un propietario faltante en el Depto 12 (sin propietario); (b) `admin-A` registra un arrendatario en el Depto 201 (sin arrendatario); (c) `admin-A` cancela con motivo el arriendo programado O-4.
- **Entonces:** 2xx en las tres, con los efectos de TC-CM-CA22-01, TC-CM-CA13-03 y TC-CM-CA15-06.

#### TC-CM-CA26-03 · Ningún texto fijo sobre dinero

- **CA:** CA-CM-26, CM-E6 · **Tipo:** contrato · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** un barrido de todas las respuestas del módulo (éxitos y errores, con el flag apagado y encendido) y del catálogo de textos no encuentra ninguna frase que afirme que no se moverá dinero o que no hay deuda que traspasar (lista de patrones: "no se mueve", "no se moverá", "sin deuda", "no hay deuda", "nada que traspasar"), ni las claves de la sección de deuda de la vista previa.

#### TC-CM-CA26-04 · Primera barrera: la prueba de configuración del CI

- **CA:** CA-CM-26, CM-H1, D56 · **Tipo:** configuración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** la prueba lee la configuración de producción versionada en el repositorio; y, como prueba de la prueba, una copia con `occupancy.end_and_transfer` encendido.
- **Entonces:** pasa con el flag apagado o ausente; **falla** con la copia encendida mientras la constante del traspaso esté en falso. La verificación es obligatoria para fusionar a `main`.
- **Bloqueado en parte (P-CM-20):** la ruta del archivo y el nombre del ambiente "producción" los fija el arquitecto.

#### TC-CM-CA26-05 · Segunda barrera: la constante del código

- **CA:** CA-CM-26, D69 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** la constante del traspaso en falso y la API iniciada con la configuración de producción y `occupancy.end_and_transfer` encendido por una variable de entorno.
- **Cuando:** `admin-A` pide `end-preview` y `end` de O-1.
- **Entonces:** según la variante que elija el arquitecto (P-CM-20): **(i)** 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` y nada cambia, o **(ii)** la API no arranca y el registro del arranque nombra el flag y el motivo. La prueba se escribe para la variante elegida; en las dos, O-1 sigue vigente.

#### TC-CM-CA26-06 · Sin valor, apagado

- **CA:** CA-CM-26, CM-H1 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** la configuración no trae `occupancy.end_and_transfer` ni `platform.admin_first_access_alert`.
- **Entonces:** el término de O-1 responde 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` y un otorgamiento de `admin` no encola ningún trabajo.

#### TC-CM-CA26-07 · Ninguna ruta lee ni cambia un flag

- **CA:** CA-CM-26, CM-H1 · **Tipo:** contrato (barrido) · **Prioridad:** 1 · **Rebanada:** R1
- **Entonces:** el inventario de rutas (comunidad, plataforma, identidad y técnicas) no tiene ninguna ruta cuyo nombre o esquema de respuesta contenga `flag`, `feature` ni los nombres de los dos flags, y ninguna escritura acepta esos campos (un cuerpo con `occupancy.end_and_transfer` responde 400). `operaciones-1` y `soporte-1` no tienen ninguna ruta que cambie la configuración.

### CA-CM-27 · Otorgar administrador con nombre y contacto (D52, D54)

#### TC-CM-CA27-01 · Sin nombre

- **CA:** CA-CM-27 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `operaciones-1` envía `POST /platform/communities/{A}/admin-memberships` para Valentina Ortiz (21.345.678-4), sin nombre, con el correo `vortiz@example.com` y el motivo "Reemplazo acordado con el comité".
- **Entonces:** 422 `PERSON_NAME_REQUIRED` con "Ingresa el nombre del administrador"; nada cambia; un registro en la auditoría de plataforma.

#### TC-CM-CA27-02 · Otorgamiento exitoso

- **CA:** CA-CM-27 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** lo reenvía con el nombre "Valentina Ortiz".
- **Entonces:** 2xx; ficha en A con "Valentina Ortiz" y `vortiz@example.com`; membresía `admin` con `granted_via = platform`, sin `valid_to`; cero trabajos encolados (flag de la alerta apagado); auditoría de plataforma.

#### TC-CM-CA27-03 · Administrador de otra comunidad con contacto verificado

- **CA:** CA-CM-27, D54, R2-C-1 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Felipe Rojas con ficha en B y contacto verificado sembrado; sin ficha en A.
- **Cuando:** `operaciones-1` le otorga `admin` en A con nombre "Felipe Rojas" y motivo, (a) sin celular ni correo; (b) con el correo `frojas.a@example.com`.
- **Entonces:** (a) 422 `INVALID_CONTACT` con "Ingresa un celular o un correo válido del administrador"; cero fichas y membresías nuevas en A. (b) 2xx; la ficha de A queda con `frojas.a@example.com`; la ficha de B y `PERSON` idénticas fila a fila; la respuesta tiene la misma forma que la de TC-CM-CA27-02 (persona nueva).

#### TC-CM-CA27-04 · La ficha que ya existía se reemplaza

- **CA:** CA-CM-27, CM-A2, S-CM-22 · **Tipo:** integración, datos personales · **Prioridad:** 1 · **Rebanada:** R1
- **Dado:** Ana Pérez con ficha en A "Ana P." y `ana@example.com`, como propietaria del Depto 101.
- **Cuando:** `operaciones-1` le otorga `admin` con nombre "Ana Pérez", celular "+56 9 2222 3333" y motivo.
- **Entonces:** 2xx; la **misma** ficha queda con "Ana Pérez" y `+56922223333`, sin el correo anterior; la auditoría guarda los valores anteriores enmascarados (`person_record.update` o el detalle del otorgamiento; la fila no contiene `ana@example.com` en claro); la respuesta tiene la misma forma que la de TC-CM-CA27-02 y no contiene "Ana P.", `ana@example.com` ni un indicador de ficha existente. Ana conserva su membresía `resident`.
- **Nota (H-CM-9):** la spec no dice si el correo anterior se conserva cuando Operaciones ingresa solo un celular. **Supuesto (a validar):** el contacto se reemplaza completo, como dice "reemplazan los de la ficha".

#### TC-CM-CA27-05 · Nadie de la comunidad corrige esa ficha

- **CA:** CA-CM-27, R2-m-9 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` envía el `PATCH` de la ficha de Ana con datos válidos.
- **Entonces:** 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`; la ficha no cambia.

#### TC-CM-CA27-06 · Efectos en el ingreso y en las notificaciones

- **CA:** CA-CM-27, D55-2, R3-m-6 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-ING y H-NOT
- **Entonces:** la sesión de Ana obtenida con `ana@example.com` recibe 404 en A desde la petición siguiente al otorgamiento y vuelve a entrar solo con la invitación enviada a +56 9 2222 3333 (H-ING); sus notificaciones como propietaria del Depto 101 van a ese celular (H-NOT).

### CA-CM-28 · Persona sin RUT (D53)

#### TC-CM-CA28-01 · Sin RUT no se registra

- **CA:** CA-CM-28, CM-C7 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** R1
- **Cuando:** `admin-A` pide la vista previa y la ejecución del alta de arrendatario en el Depto 102 con nombre "John Smith", (a) sin el campo RUT; (b) con RUT ""; (c) con el número de pasaporte "P1234567" en el campo RUT.
- **Entonces:** 422 `INVALID_RUT` con "Ingresa un RUT válido. Revisa el dígito verificador" en las tres; cero fichas, ocupaciones y membresías nuevas. Enviar un campo `passport` responde 400 `BAD_REQUEST` (CM-C1).

#### TC-CM-CA28-02 · La deuda sigue en el ámbito `owner`

- **CA:** CA-CM-28 · **Tipo:** integración · **Prioridad:** 1 · **Rebanada:** H-EMI
- **Entonces:** al emitir, los cargos del Depto 102 quedan en el ámbito `owner` (GC F-9), como en GOLD-A-02.

### CA-CM-29 · Notificaciones solo al contacto de la ficha de esa comunidad (D70)

Estado de TC-CM-CA24-01, con c1 verificado por la invitación de A.

#### TC-CM-CA29-01 · El aviso de B va al contacto de B

- **CA:** CA-CM-29 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-NOT
- **Entonces:** al emitir B, el `NOTIFICATION_DELIVERY` del aviso de la Casa 2 por correo va a `x@example.com`; ningún envío de B tiene como destino `+56911111111` ni otro contacto de `PERSON` o de la ficha de A.

#### TC-CM-CA29-02 · Sin contacto del canal, no se busca otro

- **CA:** CA-CM-29 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-NOT
- **Entonces:** una notificación de B por SMS o WhatsApp, con la ficha de B sin celular, queda `skipped` o `failed` según ADR 0008, decisión 14; el doble del proveedor registra cero envíos a c1.

#### TC-CM-CA29-03 · Las notificaciones de A van solo a c1

- **CA:** CA-CM-29 · **Tipo:** aislamiento · **Prioridad:** 1 · **Rebanada:** H-NOT
- **Entonces:** todo envío de A a X va a c1; el push sigue las suscripciones de cada membresía (GC S-81).

## Aislamiento (CA-CM-11, CA-CM-12, CA-CM-23 y regla 4 de `CLAUDE.md`)

Patrón de `docs/qa/plan-de-pruebas.md` §4, con las dos vías: **guard** (ruta de B) y **capa de datos** (ruta de A con un id de B). Actor: `admin-A`, sin membresía en B, salvo que la fila diga otro; cada caso se repite con `comite-A`, `propietario-101` y `ex-residente-A` cuando tienen acceso a la ruta en A. Después de cada caso se compara, fila a fila, que `UNIT`, fichas, `MEMBERSHIP`, `UNIT_OCCUPANCY`, `ADMIN_TASK`, `PERSON` y `AUDIT_LOG` de B no cambiaron. Todo 404 se compara con el de un id inexistente. Una fila por cada acción de la tabla "Acciones de la rebanada". Todas son `R1`, salvo las que indican el flag.

### Rutas de comunidad

| ID | Acción (ruta) | Vía guard | Vía capa de datos e ids en el cuerpo | Resultado esperado |
| --- | --- | --- | --- | --- |
| ISO-CM-comunidad-1 | Ver datos de la comunidad (`GET …`) | `GET /communities/{B}` | — (la ruta no lleva otro id) | 404; la respuesta de `GET /communities/{A}` solo trae datos de A |
| ISO-CM-comunidad-2 | Editar datos (`PATCH …`) | `PATCH /communities/{B}` válido y mal formado | Cuerpo con `communityId` de B por la ruta de A | 404 por la vía guard; 400 por el campo no admitido; B sin cambios en los dos |
| ISO-CM-unidades-1 | Listar unidades | `GET /communities/{B}/units` | — | 404; el listado de A no trae unidades ni suma de B (ISO-2) |
| ISO-CM-unidades-2 | Ver una unidad | `GET /communities/{B}/units/{Casa 1}` | `GET /communities/{A}/units/{Casa 1}` | 404 en las dos (TC-CM-CA11-01, 02) |
| ISO-CM-unidades-3 | Crear una unidad | `POST /communities/{B}/units` | Cuerpo con `communityId` de B por la ruta de A | 404 por la vía guard; 400 por el campo no admitido; cero unidades nuevas en B (ISO-3). El orden propuesto y los 409 de código y de orden nunca consideran unidades de B (TC-CM-CA11-05) |
| ISO-CM-unidades-4 | Lote | `POST /communities/{B}/units/batch` | Lote por la ruta de A con un `unitId` de B entre filas válidas | 404 en las dos; la fila válida de A no se aplica (TC-CM-CA11-03) |
| ISO-CM-unidades-5 | Editar una unidad | `PATCH /communities/{B}/units/{Casa 1}` | `PATCH /communities/{A}/units/{Casa 1}`, válido y mal formado | 404 en las dos, antes de la forma |
| ISO-CM-unidades-6 | Eliminar una unidad | `DELETE /communities/{B}/units/{Casa 1}` | `DELETE /communities/{A}/units/{Casa 1}` | 404 (no 409 `UNIT_IN_USE`: no revela que la unidad existe ni que está en uso); la Casa 1 sigue |
| ISO-CM-unidades-7 | Residente y unidad ajena de su comunidad (ISO-9) | — | `propietario-101` pide, edita o elimina el Depto 102 | 404 con el mismo cuerpo que una unidad de B o un id inexistente |
| ISO-CM-roster-1 | Registro de copropietarios | `GET /communities/{B}/owner-roster` con `admin-A` y `comite-A` | — | 404; el registro de A no trae personas de B (TC-CM-CA23-05) |
| ISO-CM-ocupaciones-1 | Historial de ocupaciones | `GET /communities/{B}/units/{Casa 2}/occupancies` | `GET /communities/{A}/units/{Casa 2}/occupancies` | 404 en las dos; sin auditoría de lectura |
| ISO-CM-ocupaciones-2 | Alta de arrendatario (vista previa y ejecución) | Ruta de B | Ruta de A con el `unitId` de la Casa 2 | 404 en las cuatro peticiones; cero ocupaciones, fichas y membresías nuevas (TC-CM-CA23-04) |
| ISO-CM-ocupaciones-3 | Venta o propietario faltante (vista previa y ejecución) | Ruta de B | Ruta de A con el `unitId` de la Casa 2 | 404, con el flag apagado y encendido (`R1` y `R1-F`) |
| ISO-CM-ocupaciones-4 | Término de arriendo (vista previa y ejecución) | Ruta de B con un `occupancyId` de B | Ruta de A con el `occupancyId` de B | 404, con el flag apagado (no `OCCUPANCY_ACTION_NOT_AVAILABLE`) y encendido (`R1` y `R1-F`) |
| ISO-CM-ocupaciones-5 | Cancelación de un arriendo programado | Ruta de B | Ruta de A con el `occupancyId` de un arriendo programado de B | 404; el arriendo de B sigue programado y su membresía no se revoca |
| ISO-CM-membresias-1 | "Usuarios y roles" e historial | `GET /communities/{B}/memberships` | — | 404; la lista de A no trae membresías de B aunque la persona tenga las dos (TC-CM-CA23-05) |
| ISO-CM-membresias-2 | Otorgar comité | `POST /communities/{B}/memberships` | Ruta de A con el `personRecordId` de una ficha de B | 404 en las dos; por la vía de datos, en el paso 4 y antes del 403 de `role = admin` (TC-CM-CA23-02, 03) |
| ISO-CM-membresias-3 | Revocar comité | Ruta de B | Ruta de A con el `membershipId` del comité de Marta Vidal | 404 antes de la forma; la membresía de B sigue vigente con sus suscripciones push (TC-CM-CA23-01) |
| ISO-CM-ficha-1 | Corregir una ficha | `PATCH /communities/{B}/person-records/{ficha de B}` | `PATCH /communities/{A}/person-records/{ficha de B}` | 404 en las dos; la ficha de B no cambia |
| ISO-CM-ficha-2 | Corregir en A la ficha de una persona con ficha en A y en B | — | `admin-A` corrige la ficha de Sofía Navarro en A | 2xx; la ficha de B y `PERSON` no cambian; `admin-B` sigue leyendo sus datos de B (TC-CM-CA24-01; ISO-17 del plan) |
| ISO-CM-tareas-1 | Listar tareas | `GET /communities/{B}/admin-tasks` | — | 404; la lista de A no trae tareas de B |
| ISO-CM-tareas-2 | Resolver una tarea | Ruta de B | Ruta de A con el `taskId` de una tarea abierta de B (`R1-F`, o tarea sembrada) | 404 antes de la forma; la tarea de B sigue abierta |
| ISO-CM-rut-1 | Vista previa con un RUT que existe solo en B (ISO-7) | — | Alta de arrendatario en A con el RUT de Felipe Rojas y con 11.111.111-1 | Respuestas idénticas (TC-CM-CA12-01) |
| ISO-CM-rut-2 | Lo mismo en el propietario faltante | — | `ownership-transfers/preview` con los dos RUT | Respuestas idénticas (TC-CM-CA12-04) |
| ISO-CM-rut-3 | Un RUT con ficha en A y en B | — | Vista previa en A con el RUT de Sofía Navarro | El texto de CM-C4 usa solo el nombre de la ficha de A; nunca el nombre, el contacto ni la existencia de la ficha de B |
| ISO-CM-exresidente-1 | Membresía revocada o con `valid_from` futuro (ISO-8) | `ex-residente-A` y Daniela Fuentes antes del 2026-12-05 en toda ruta de A | — | 404 en todas, igual que una persona sin membresía |
| ISO-CM-idempotencia-1 | La misma clave en dos comunidades | — | Carolina Lagos, administradora de A y de B, crea una unidad en A y otra en B con la misma `Idempotency-Key` | Dos altas independientes; la respuesta de B no es la guardada para A |

### Rutas de plataforma

| ID | Acción (ruta) | Caso | Resultado esperado |
| --- | --- | --- | --- |
| ISO-CM-plataforma-1 | Crear comunidad | `operaciones-1` crea C con el RUT de administrador de una persona que existe solo en B (Gabriel Torres) y, en otra corrida, con un RUT nuevo | Las dos respuestas tienen la misma forma; se crea una ficha solo en C; la ficha de B y `PERSON` no cambian; ninguna fila de A ni de B cambia |
| ISO-CM-plataforma-2 | Otorgar administrador | (a) Por la ruta de A, con el RUT de Felipe Rojas (TC-CM-CA27-03); (b) con un `communityId` inexistente en la ruta; (c) con un `communityId` de B en el cuerpo por la ruta de A | (a) Ficha y membresía solo en A; la respuesta no trae datos de B. (b) 404, con un registro de auditoría de plataforma. (c) Nada escrito en B; el código depende de H-CM-11 (ISO-GC-operaciones-2 (a) dice 404; CM-C1 dice 400 para un campo no admitido) |
| ISO-CM-plataforma-3 | Revocar administrador | Por la ruta de A, el `membershipId` de la membresía `admin` de Felipe Rojas en B; el de una membresía `committee` o `resident` de A; uno inexistente | 404 con el mismo cuerpo, antes del 400 y de `REASON_REQUIRED`; nada cambia (ya cubierto por ISO-GC-operaciones-1 y 4; se repite con las fichas: ninguna ficha cambia) |
| ISO-CM-plataforma-4 | Sesiones cruzadas | `admin-A` en las tres rutas `/platform/...`; `operaciones-1` y `soporte-1` en toda ruta `/communities/...` del módulo | 404 en todas; las de plataforma dejan su registro de auditoría |
| ISO-CM-plataforma-5 | Operaciones no lee fichas ni membresías | `operaciones-1` después de otorgar `admin` en A | La respuesta del otorgamiento no trae fichas, membresías ni unidades de A; no existe ninguna ruta de lectura de plataforma en el inventario (D49) |

### Requisitos de aislamiento heredados

| ID | Origen | Rebanada | Resultado esperado |
| --- | --- | --- | --- |
| ISO-CM-ingreso-1 | CA-CM-24, D47, D55 | H-ING | TC-CM-CA24-02 a 06: ninguna sesión ve una comunidad cuya ficha no registra el contacto con que se obtuvo |
| ISO-CM-ingreso-2 | D72 | H-ING | Las acciones de identidad responden igual a toda sesión, limitada o no |
| ISO-CM-notificaciones-1 | CA-CM-29, D70 | H-NOT | TC-CM-CA29-01 a 03: ningún envío de una comunidad va a un contacto que no esté en la ficha de esa comunidad |
| ISO-CM-trabajos-1 | CM-B8, D71 | Rebanada que agregue un `payload` con id de unidad | Con una unidad eliminada, el trabajo termina `skipped` con `ENTITY_NOT_FOUND`, no escribe y envía su evento a Sentry |

## Permisos por rol

Una prueba por celda, con ID `PERM-CM-<rol>-<acción>`. Celdas: **2xx** permitido; **403** ve el recurso pero su rol no permite la acción; **404** no ve el recurso; **401** sin sesión. "Sin membresía" es `admin-B` en una ruta de A (igual que `ex-residente-A`). En cada 403 y 404 se verifica que no hubo escritura y que el cuerpo es el neutro. Todas `R1`; el término y la venta, con el flag encendido para la celda 2xx (`R1-F`).

| Acción | Admin | Comité | Propietario | Arrendatario | Sin membresía o ex residente | Soporte | Operaciones | Sin sesión |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crear comunidad (`platform.community.create`) | 404 | 404 | 404 | 404 | 404 | 404 | 2xx | 401 |
| Otorgar administrador (`platform.admin_role.grant`) | 404 | 404 | 404 | 404 | 404 | 404 | 2xx | 401 |
| Revocar administrador (`platform.admin_role.grant`) | 404 | 404 | 404 | 404 | 404 | 404 | 2xx (último: 409 `LAST_ADMIN`) | 401 |
| Ver datos de la comunidad | 2xx | 2xx | 2xx | 2xx | 404 | 404 | 404 | 401 |
| Editar datos de la comunidad (`community.profile.write`) | 2xx | 403 | 403 | 403 | 404 | 404 | 404 | 401 |
| Listar unidades | 2xx todas, con suma | 2xx todas, con suma | 2xx las suyas, sin suma | 2xx la suya, sin suma | 404 | 404 | 404 | 401 |
| Ver una unidad | 2xx | 2xx | 2xx suya; 404 ajena | 2xx suya; 404 ajena | 404 | 404 | 404 | 401 |
| Crear, editar, lote o eliminar unidades (`unit.write`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Registro de copropietarios (`owner_roster.read`) | 2xx completo + auditoría | 2xx filtrado + auditoría | 404 | 404 | 404 | 404 | 404 | 401 |
| Historial de ocupaciones de una unidad (`owner_roster.read`) | 2xx + auditoría | 2xx filtrado + auditoría | 404 | 404 | 404 | 404 | 404 | 401 |
| Alta de arrendatario, vista previa y ejecución (`occupancy.write`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Propietario faltante, vista previa y ejecución (`occupancy.write`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Venta, vista previa y ejecución (`occupancy.write`) | 2xx con el flag; 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` sin él | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Término de arriendo, vista previa y ejecución (`occupancy.write`) | 2xx con el flag; 422 sin él | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Cancelación de un arriendo programado (`occupancy.write`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| "Usuarios y roles" e historial (`membership`) | 2xx + auditoría | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Otorgar comité (`role-grant`, `committee_role.grant`) | 2xx | 403 | 404 | 404 | 404 | 404 | 404 | 401 |
| Otorgar `admin` por la ruta de comunidad | 403 (paso 4) | 403 (paso 3c) | 404 | 404 | 404 | 404 | 404 | 401 |
| Revocar comité (`membership`, `committee_role.grant`) | 2xx | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Revocar `admin` por la ruta de comunidad (E-CM-1) | 403 (paso 4) | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Corregir una ficha (`person_record.write`) | 2xx; 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` si la persona es administradora | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Listar tareas del administrador | 2xx | 404 | 404 | 404 | 404 | 404 | 404 | 401 |
| Resolver una tarea (`committee_role.grant`) | 2xx | 404 | 404 | 404 | 404 | 404 | 404 | 401 |

- **Roles múltiples (ADR-0009-S4):** `PERM-CM-admin-propietaria` (Ana Pérez, administradora y propietaria del Depto 101): lista las cuatro unidades con `aliquotSumE6` y edita unidades. `PERM-CM-comite-propietaria` (Rosa Díaz): ve las cuatro unidades con la suma, recibe 403 al editar y 404 en "Usuarios y roles". `PERM-CM-propietario-arrendatario` (TC-CM-CB-18): ve sus dos unidades, sin la suma.
- **Sin sesión bajo `/platform/`:** 401 y un registro `anonymous` en la auditoría de plataforma (plan §4.2, ISO-P8).
- **Conserje:** no hay columna; la rebanada 1 no tiene membresías `concierge` y la ruta de membresías responde 400 a ese rol (TC-CM-CA16-07).

### Orden de validación

Cada fila es una petición que falla en dos o más pasos y espera solo el error del primero (plan §4).

| ID | Actor y acción | Resultado esperado | Por qué |
| --- | --- | --- | --- |
| PERM-CM-orden-1 | Sin sesión: alta de unidad con JSON mal formado en A; y alta de comunidad mal formada | 401 en las dos | La sesión va primero |
| PERM-CM-orden-2 | `comite-A` crea una unidad con JSON mal formado, y con alícuota 1000001 | 403, no 400 ni 422 `INVALID_ALIQUOT` | El permiso va antes que la forma y las reglas |
| PERM-CM-orden-3 | `propietario-101` edita el Depto 101 con JSON mal formado | 404, no 403 ni 400 | El residente no ve `unit-config` |
| PERM-CM-orden-4 | `admin-A` crea una unidad sin `Idempotency-Key`, con código vacío | 400, no 422 `UNIT_CODE_REQUIRED` | El encabezado es parte de la forma (paso 3) |
| PERM-CM-orden-5 | `admin-A` crea una unidad sin código, con alícuota 1000001 y orden 0; luego con código, alícuota 1000001 y orden 0; luego con alícuota válida y orden 0 | `UNIT_CODE_REQUIRED` → `INVALID_ALIQUOT` → `INVALID_SORT_ORDER` con "El orden debe ser un número entero entre 1 y 999.999" | Orden de la unidad suelta |
| PERM-CM-orden-6 | Con `2026-10` emitido, `admin-A` crea "depto 101" con orden 2 y sin motivo; luego con motivo; luego con código "Depto 301", orden 2 y motivo | 422 `REASON_REQUIRED` → 409 `UNIT_CODE_ALREADY_EXISTS` → 409 `SORT_ORDER_ALREADY_USED` con "El orden 2 ya lo usa Depto 102" | En la unidad suelta el motivo va antes de los 409 (`R1-P`) |
| PERM-CM-orden-7 | `admin-A` crea una unidad con tipo "oficina" y alícuota 1000001 | 400, no 422 | Un tipo fuera de la lista es de forma |
| PERM-CM-orden-8 | `admin-A` envía un lote de 501 filas con (a) un `unitId` repetido; (b) un `unitId` de B; (c) todas válidas salvo una con alícuota −1 | (a) 400; (b) 404; (c) 422 `UNITS_BATCH_TOO_LARGE`, no `UNITS_INVALID` | Paso 3 → paso 4 → tope → filas |
| PERM-CM-orden-9 | `admin-A` revoca la membresía `admin` de Héctor Molina sin motivo | 403, no 422 `REASON_REQUIRED` | E-CM-1: paso 4 antes de las reglas |
| PERM-CM-orden-10 | `admin-A` revoca, sin motivo y con otra clave, el comité de Rosa ya revocado | 422 `REASON_REQUIRED`, no 409 `ROLE_ALREADY_REVOKED` | `REASON_REQUIRED` va antes del 409 (GC S-68) |
| PERM-CM-orden-11 | `admin-A` otorga `role = admin` con un `personRecordId` de B y JSON bien formado; luego con JSON mal formado | 404; luego 400 | Forma → visibilidad del cuerpo → permiso del cuerpo |
| PERM-CM-orden-12 | `admin-A` otorga `role = resident` con un `personRecordId` de B | 404, no 422 `RESIDENT_ROLE_FOLLOWS_OCCUPANCY` | El 404 del cuerpo es del paso 4; el 422 de residente, del paso 6 |
| PERM-CM-orden-13 | `admin-A` otorga `role = committee` sin referencia de asamblea a Pedro Soto (arrendatario) | 422 `ASSEMBLY_REFERENCE_REQUIRED`, no `COMMITTEE_REQUIRES_OWNER` | GC S-34, CA-64 |
| PERM-CM-orden-14 | `admin-A` corrige la ficha de Héctor Molina con un campo `rut` | 400, no 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE` | La forma va antes del paso 6 |
| PERM-CM-orden-15 | `admin-A` pide el alta de arrendatario en el Depto 102 (con O-1 vigente) con el RUT de Luis Muñoz y celular inválido; luego con celular válido; luego con el RUT de Daniela Fuentes | `INVALID_CONTACT` → `OWNER_CANNOT_BE_TENANT` → 409 `TENANT_ALREADY_ACTIVE` con "La unidad ya tiene un arrendatario vigente o programado. Registra su término o cancela el arriendo programado antes de agregar otro" | Datos antes que estado |
| PERM-CM-orden-16 | Con el flag encendido, `admin-A` termina O-5 (programada) con fecha anterior al ingreso | 409 `OCCUPANCY_NOT_STARTED`, no 422 `END_BEFORE_START` | El estado va antes que la fecha (`R1-F`) |
| PERM-CM-orden-17 | Con el flag encendido, `admin-A` registra la venta del Depto 102 a Pedro Soto (arrendatario vigente) con fecha futura; y a Luis Muñoz con fecha válida | 422 `END_DATE_IN_FUTURE` con "Registra la venta el día que ocurra"; 409 `ALREADY_OWNER` con "Esta persona ya es propietaria de esta unidad" | `END_DATE_IN_FUTURE` → `ALREADY_OWNER` → `BUYER_IS_CURRENT_TENANT` (`R1-F`) |
| PERM-CM-orden-18 | Con el flag apagado: `comite-A` pide el término de O-1; `propietario-102` lo pide; `admin-A` lo pide con JSON mal formado | 403; 404; 400. Ninguno recibe 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` | El flag es una regla de negocio (paso 6) |
| PERM-CM-orden-19 | `admin-A` elimina una unidad en uso, sin `Idempotency-Key` | 400, no 409 `UNIT_IN_USE` | Forma antes que las reglas |
| PERM-CM-orden-20 | `operaciones-1` otorga `admin` en A a Rosa Díaz (integra el comité), sin motivo; luego con motivo | 422 `REASON_REQUIRED` con "Indica el motivo del otorgamiento"; luego 422 `ADMIN_COMMITTEE_CONFLICT` con "Esta persona integra el comité de la comunidad. Primero se debe revocar su rol de comité" | Orden de otorgar administrador |
| PERM-CM-orden-21 | `operaciones-1` otorga `admin` en A a Carolina Lagos (ya administradora) con nombre vacío; luego con todo válido | 422 `PERSON_NAME_REQUIRED`; luego 409 `ALREADY_ADMIN` con "Esta persona ya es administradora de la comunidad". En el 409, la ficha de Carolina **no** se reemplaza | Datos antes que estado; un rechazo no escribe |
| PERM-CM-orden-22 | `admin-A` edita los datos de la comunidad con tipo "torre" y nombre vacío | 400, no 422 `COMMUNITY_NAME_REQUIRED` | Forma antes que las reglas |
| PERM-CM-orden-23 | `admin-A` reenvía la clave de un alta de unidad exitosa con otro cuerpo, que además tiene alícuota "abc" | 422 `IDEMPOTENCY_KEY_REUSED`, no `INVALID_ALIQUOT` | `INVALID_ALIQUOT` es del paso 6 (a diferencia de `INVALID_AMOUNT` de GC, que es de forma) |
| PERM-CM-orden-24 | Cualquier actor, con y sin sesión, envía a una escritura del módulo un cuerpo de más de 100 kB | 413 `PAYLOAD_TOO_LARGE` | El límite se aplica antes del guard (ADR-0009-S3) |

### Auditoría

- Cada escritura exitosa deja exactamente un registro, en la misma transacción: `community.create`, `community.update`, `unit.create`, `unit.update` (por campo, con valor anterior y nuevo, y el motivo si se pidió), `unit.batch` (uno por lote), `unit.delete`, `membership.grant`, `membership.revoke`, `membership.update_validity`, `person_record.update`, y los de ocupaciones y tareas de GC. Prueba: una transacción que falla al auditar no deja la escritura.
- Ningún registro contiene datos personales completos: búsqueda literal de cada RUT, nombre completo, celular y correo de la prueba en `AUDIT_LOG` después de cada caso de fichas y de otorgamientos (CM-G1).
- Lecturas auditadas, una fila por petición: `GET .../memberships`, `GET .../owner-roster` y `GET .../units/{unitId}/occupancies` leídos por el administrador, y las dos últimas leídas por el comité. No se auditan `GET /communities/{id}`, `GET .../units` ni `GET .../units/{unitId}`.
- Un rechazo en una ruta `/communities/...` no deja auditoría de negocio. En `/platform/...`, toda petición deja exactamente un registro, también las rechazadas y las de Soporte (TC-CM-CA1-01, 02 y 06).
- Heredado (H-WEB): el administrador ve en "Registro de auditoría" los eventos de su comunidad; el comité recibe 404; ningún rol de comunidad ve filas de otra comunidad ni con comunidad nula (CM-G4).

## Casos borde

Uno por cada caso borde de la spec, en su orden (TC-CM-CB-01 a 44), más los adicionales de QA (TC-CM-CB-45 a 58). Cuando el resultado ya está en un caso de CA, se cita.

### De la especificación

| ID | Caso borde | Acción y resultado esperado | Rebanada |
| --- | --- | --- | --- |
| TC-CM-CB-01 | Unidad con alícuota 0 | TC-CM-CA3-02: se guarda con `aliquotE6` 0 y cuenta en la suma con 0. Al emitir no recibe cargos de grupos por alícuota (TC-GC-CA18-01, 02) | R1; emisión H-EMI |
| TC-CM-CB-02 | Unidad accesoria con otro propietario | `admin-C` registra en "Bodega B1" (alícuota 0) a Nicolás Bravo como propietario faltante: 2xx; `GET .../units` le devuelve solo la bodega | R1 |
| TC-CM-CB-03 | Suma sobre 100 % | TC-CM-CA4-03: se guarda con la advertencia "…suman 200,0000 %…" | R1; bloqueo H-EMI |
| TC-CM-CB-04 | Carga por partes | En C vacía, `admin-C` crea Depto 11 (185000): suma 185.000, advertencia "Las alícuotas suman 18,5000 %; …". Crea Depto 12 (195000): 185.000 + 195.000 = 380.000, "…38,0000 %…". Ningún error | R1 |
| TC-CM-CB-05 | Más de 500 unidades | Dos lotes: 500 altas con alícuota 1.667 cada una (500 × 1.667 = 833.500, advertencia "…83,3500 %…") y 100 altas con 1.665 (100 × 1.665 = 166.500). Suma final 833.500 + 166.500 = 1.000.000, sin advertencia; 600 unidades con órdenes 1 a 600 | R1 |
| TC-CM-CB-06 | Intercambio de orden con dos ediciones sueltas | `PATCH` de Depto 21 a `sortOrder` 4: 409 `SORT_ORDER_ALREADY_USED` con "El orden 4 ya lo usa Depto 22". Con el lote, TC-CM-CA6-06 | R1 |
| TC-CM-CB-07 | "Depto 9" y "Depto 09" | En C vacía, lote sin orden con "Depto 10", "Depto 09" y "Depto 9": se crean las tres (códigos distintos) con Depto 9 = 1, Depto 09 = 2, Depto 10 = 3 | R1 |
| TC-CM-CB-08 | Cambio de alícuotas con efecto retroactivo | TC-CM-CA7-03: los periodos emitidos no cambian; no existe ninguna acción que recalcule un periodo emitido por un cambio de alícuota (P-CM-1) | H-EMI |
| TC-CM-CB-09 | Cambio entre la vista previa y la emisión | TC-CM-CA8-01 (409 `PREVIEW_OUTDATED`) y TC-CM-CA8-02 (422 `ALIQUOTS_NOT_100`) | H-EMI |
| TC-CM-CB-10 | Unidad nueva después de emitir | Con `2026-10` emitido, `admin-A` crea "Depto 301" (alícuota 0): sin motivo, 422 `REASON_REQUIRED` con "Indica el motivo del cambio y el documento que lo respalda"; con motivo, 2xx y orden 5. La foto de `2026-10` no la incluye (H-EMI) | R1-P |
| TC-CM-CB-11 | Unidad creada por error después de emitir | TC-CM-CA9-06: se elimina con motivo | R1-P |
| TC-CM-CB-12 | Unidad en el conjunto de un gasto de partes iguales | TC-CM-CA9-05: 409 `UNIT_IN_USE` | H-EMI |
| TC-CM-CB-13 | Renombrar una unidad después de emitir | TC-CM-CA8-03: 2xx sin motivo; `unit.update` guarda el código anterior. Los avisos emitidos conservan "Depto 101" (H-EMI) | R1-P |
| TC-CM-CB-14 | Dos administradores editan la misma unidad a la vez | `admin-A` y `admin2-A` envían a la vez `PATCH` del Depto 101 con `aliquotE6` 190000 y 210000: las dos responden 2xx; el valor final es el de la última transacción confirmada; hay dos registros `unit.update` y el segundo tiene como valor anterior el nuevo del primero | R1 |
| TC-CM-CB-15 | Comunidad sin unidades | La emisión de C recién creada responde 422 `COMMUNITY_WITHOUT_UNITS`. En R1: `GET .../units` de C responde 2xx con lista vacía y `aliquotSumE6` 0 (texto de la advertencia: H-CM-7) | H-EMI; lectura R1 |
| TC-CM-CB-16 | Cambio de propietario a mitad de mes | Con el flag, la venta termina la ocupación y la membresía del vendedor (TC-CM-CA15-03). Sin prorrateo por días y aviso al propietario a la fecha de emisión: TC-GC-CA21-01 | R1-F; dinero H-EMI |
| TC-CM-CB-17 | Propietario de varias unidades | TC-CM-CA15-01 a 03 | R1 y R1-F |
| TC-CM-CB-18 | Propietario de una unidad y arrendatario de otra | `admin-A` registra a Marco Silva (propietario del Depto 202) como arrendatario del Depto 102: 2xx; una sola membresía `resident` y una ficha; `GET .../units` le devuelve los Deptos 102 y 202. Los ámbitos que ve en cada una: H-LIB | R1 |
| TC-CM-CB-19 | Ocupación programada más otra vigente | TC-CM-CA15-05 | R1 |
| TC-CM-CB-20 | Termina la vigente y queda solo una programada | Daniela con el Depto 202 vigente y O-4 programada (TC-CM-CA15-05); el 2026-11-30 se termina su arriendo del Depto 202: la membresía sigue vigente con `valid_from` 2026-11-27 (no se atrasa); `GET /communities/{A}` responde 2xx y `GET .../units` una lista vacía hasta el 2026-12-05 | R1-F |
| TC-CM-CB-21 | Arrendatario que compra | TC-CM-CA14-02, 03 | R1-F |
| TC-CM-CB-22 | Terminar un arriendo programado | TC-CM-CA21-01 | R1-F |
| TC-CM-CB-23 | Término o venta con el flag apagado | TC-CM-CA26-01, 02 | R1 |
| TC-CM-CB-24 | Persona que existe solo en otra comunidad | TC-CM-CA12-01 a 04 | R1 |
| TC-CM-CB-25 | Persona con ficha, registrada con otro nombre | TC-CM-CA25-01, 02 | R1 |
| TC-CM-CB-26 | Contactos distintos en dos comunidades | TC-CM-CA24-01 (R1) y 02 a 06 (H-ING) | R1; H-ING |
| TC-CM-CB-27 | Pasa a ser administradora donde era propietaria | TC-CM-CA27-04, 05 | R1 |
| TC-CM-CB-28 | Administrador de otra comunidad con contacto verificado | TC-CM-CA27-03, TC-CM-CA1-05 | R1 |
| TC-CM-CB-29 | Corrección del contacto de quien ya ingresó | TC-CM-CA19-03, TC-CM-CA24-06 | H-ING |
| TC-CM-CB-30 | Código con caracteres compuestos o descompuestos | `admin-C` crea "Depto Ñ" con la Ñ compuesta (U+00D1) y después con N más tilde combinada (U+004E U+0303): la segunda responde 409 `UNIT_CODE_ALREADY_EXISTS` con "El código Depto Ñ ya existe en esta comunidad". El código guardado está en NFC. "Depto N" sí se crea: es otro código | R1 |
| TC-CM-CB-31 | Avisos de dos comunidades a la misma persona | TC-CM-CA29-01 a 03 | H-NOT |
| TC-CM-CB-32 | Contacto verificado que otra comunidad escribe después | Con c1 verificado por A, `admin-B` corrige la ficha de B a c1: desde la petición siguiente la sesión obtenida con c1 ve B; con un contacto no verificado, no | H-ING |
| TC-CM-CB-33 | Trabajo con el id de una unidad eliminada | En R1: una prueba recorre los tipos de trabajo y falla si algún `payload` declara un id de unidad sin su prueba con unidad eliminada (hoy ninguno lo lleva; ADR 0008, prueba 17). El caso con el trabajo es ISO-CM-trabajos-1 | R1 (barrido); heredado |
| TC-CM-CB-34 | Persona sin RUT | TC-CM-CA28-01 | R1 |
| TC-CM-CB-35 | Propietario persona jurídica o comunidad hereditaria | `admin-C` registra como propietario faltante del Depto 21 a "Inversiones Quillay SpA" (76.123.456-0) con el correo de su representante, y del Depto 22 a "Sucesión Contreras" (53.123.456-1): 2xx en las dos, con ficha y membresía `resident`. La rebanada de ingreso no les envía invitaciones (H-ING) | R1; H-ING |
| TC-CM-CB-36 | Unidad con varios propietarios | Registrar un segundo propietario en el Depto 11 (ya tiene a Elena Contreras): con el flag apagado, 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` (es una venta); con el flag, la venta reemplaza al propietario. Nunca quedan dos ocupaciones de propietario vigentes en una unidad (restricción de base de datos) | R1 y R1-F |
| TC-CM-CB-37 | Ocupantes que no son propietarios ni arrendatarios | Prueba de contrato: el módulo solo tiene las rutas de alta de arrendatario y de `ownership-transfers`; un campo de tipo de ocupante en el cuerpo responde 400 | R1 |
| TC-CM-CB-38 | RUT mal registrado | TC-CM-CA19-04: 400 al enviar `rut`; ninguna ruta cambia el RUT de una persona ni la persona de una ocupación (P-CM-7) | R1 |
| TC-CM-CB-39 | Rectificación de un ex residente | TC-CM-CA19-05 | R1 |
| TC-CM-CB-40 | Administrador que es propietario en la misma comunidad | Ana Pérez, administradora y propietaria: una ficha, dos membresías; `admin2-A` le otorga comité: 422 `ADMIN_COMMITTEE_CONFLICT` (TC-CM-CA16-09 (d)) | R1 |
| TC-CM-CB-41 | Revocación de comité con una tarea abierta | TC-CM-CA16-10 | R1-F |
| TC-CM-CB-42 | Revocación en una comunidad de una persona con membresías en otra | Rosa Díaz, comité de A y propietaria de la Casa 2 de B (dato de escenario): tras revocar su comité en A, su membresía `resident` de B, su ficha de B y sus suscripciones push de B no cambian | R1 |
| TC-CM-CB-43 | Pagos, duplicados y periodos cerrados | No son de este módulo. Lo que le toca: PROP-CM-25 (ningún cambio de unidades altera un periodo emitido o cerrado) | H-EMI |
| TC-CM-CB-44 | Reintento con la misma clave de una escritura rechazada | `admin-A` crea "Depto 101" (409 `UNIT_CODE_ALREADY_EXISTS`) y reenvía la **misma** clave con el código "Depto 301": 2xx; no hay fila de `IDEMPOTENCY_KEY` después del rechazo y sí después del éxito | R1 |

### Adicionales de QA

| ID | Caso | Acción y resultado esperado | Rebanada |
| --- | --- | --- | --- |
| TC-CM-CB-45 | Idempotencia en cada escritura del módulo (S-CM-23) | Para cada una de las escrituras de la tabla "Acciones de la rebanada": sin `Idempotency-Key` o con una que no es uuid, 400; misma clave y mismo cuerpo, la respuesta original sin escribir de nuevo (una sola unidad, ficha, membresía u ocupación); misma clave y otro cuerpo, 422 `IDEMPOTENCY_KEY_REUSED` | R1 |
| TC-CM-CB-46 | Largos máximos | Nombre de persona de 121 caracteres, código de unidad de 31, correo de 255 y motivo de 501: 400 `BAD_REQUEST` en cada uno. Con 120, 30, 254 y 500: 2xx | R1 |
| TC-CM-CB-47 | Límites de la alícuota y del orden | `aliquotE6` 0 y 1000000: 2xx. `sortOrder` 1 y 999999: 2xx; 0, 1000000, 1,5 y "abc": 422 `INVALID_SORT_ORDER` | R1 |
| TC-CM-CB-48 | Orden propuesto con órdenes existentes no consecutivos | En A, con órdenes 1, 2, 3 y 10 (Depto 202 movido a 10), un lote sin orden con "Depto 302" y "Depto 301": Depto 301 = 11 y Depto 302 = 12 | R1 |
| TC-CM-CB-49 | Edición con el mismo valor después de emitir | Con `2026-10` emitido, `PATCH` del Depto 101 con `aliquotE6` 200000 (el que ya tiene) y `sortOrder` 1, sin motivo: 2xx sin `REASON_REQUIRED` | R1-P |
| TC-CM-CB-50 | Lote que solo cambia códigos o tipos después de emitir | Con `2026-10` emitido, lote que cambia el código del Depto 101 y el tipo del Depto 102, sin motivo: 2xx. El mismo lote más una fila que cambia la alícuota del Depto 201, sin motivo: 422 `REASON_REQUIRED` y nada cambia | R1-P |
| TC-CM-CB-51 | Ficha de un administrador que aún no rige, y después de la revocación | (a) Membresía `admin` de Valentina Ortiz con `valid_from` futuro (sembrada): el `PATCH` de su ficha responde 422 `ADMIN_RECORD_MANAGED_BY_COMVIVE`. (b) Después de que `operaciones-1` revoca la membresía `admin` de Héctor Molina, `admin-A` corrige su ficha: 2xx | R1 |
| TC-CM-CB-52 | Formatos de RUT | "12.345.678-5", "12345678-5" y "12.345.670-k" se aceptan y se guardan `12345678-5` y `12345670-K`; "12.345.678-9" y "12.345.678" responden 422 `INVALID_RUT`. Registrar dos veces a la misma persona con formatos distintos no crea dos `PERSON`. RUT sin guion: H-CM-14 | R1 |
| TC-CM-CB-53 | Formatos de contacto | "+56 9 1234 5678" y "+56912345678" se guardan `+56912345678`; "+56 2 2345 6789" (fijo), "+56 9 1234 567" y "correo@" responden 422 `INVALID_CONTACT`; `Ana@Example.COM` se guarda `ana@example.com`; celular y correo a la vez se guardan los dos | R1 |
| TC-CM-CB-54 | Propietario faltante a quien es el arrendatario | En una unidad sin propietario y con O-3 de Jorge Vera vigente (escenario de GC CA-38), con el flag apagado, registrar a Jorge Vera como propietario faltante: 409 `BUYER_IS_CURRENT_TENANT`; nada cambia (ver H-CM-15) | R1 |
| TC-CM-CB-55 | Tipos de unidad | `departamento`, `casa`, `estacionamiento`, `bodega` y `local`: 2xx; "oficina", "" y nulo: 400. El tipo no cambia `aliquotSumE6` ni el orden propuesto | R1 |
| TC-CM-CB-56 | Normalización del código | "  Depto   41  " se guarda "Depto 41"; "   " responde 422 `UNIT_CODE_REQUIRED`; "DEPTO 41" después responde 409 con "El código Depto 41 ya existe en esta comunidad"; "Depto Á1" y "Depto A1" son códigos distintos | R1 |
| TC-CM-CB-57 | Dos altas concurrentes con el mismo código | `admin-A` y `admin2-A` crean a la vez "Depto 301" con claves distintas: una responde 2xx y la otra 409 `UNIT_CODE_ALREADY_EXISTS`; queda una sola unidad | R1 |
| TC-CM-CB-58 | Último administrador con fichas | `operaciones-1` revoca a la única administradora de C: 409 `LAST_ADMIN` (TC-GC-CA69-01); la ficha de Paula Henríquez no cambia y `admin-C` sigue recibiendo 422 al corregirla | R1 |

## Propiedades (fast-check)

Generadores:

- `aliquotE6`: enteros de 0 a 1.000.000; aparte, valores fuera de rango, no enteros y no numéricos solo para probar el rechazo. No se generan alícuotas "que suman 100 %": la suma es arbitraria.
- Textos de alícuota: parte entera de 0 a 100, separador coma o punto, de 0 a 4 decimales, con y sin ceros finales; aparte, cadenas arbitrarias (5 o más decimales, signos, exponentes, espacios, símbolo %).
- Códigos de unidad: cadenas de 1 a 30 caracteres con letras (mayúsculas, minúsculas, tildes, ñ, diéresis, en NFC y en NFD), dígitos (tramos de 1 a 30 dígitos, con y sin ceros a la izquierda) y espacios.
- RUT: cuerpos de 1.000.000 a 99.999.999 con su dígito por módulo 11, en formatos con y sin puntos y con el dígito en mayúscula o minúscula; aparte, dígitos alterados.
- Lotes: de 1 a 500 filas, mezcla de altas y ediciones sobre un estado inicial de 0 a 50 unidades, con códigos y órdenes que chocan o no.
- Secuencias de operaciones (modelo): altas y cancelaciones de arriendo, propietario faltante, término y venta (con el flag en el doble), otorgamientos y revocaciones, correcciones de ficha, en dos comunidades con personas compartidas.

| ID | Propiedad | Expresión | Origen | Rebanada |
| --- | --- | --- | --- | --- |
| PROP-CM-01 | Ida y vuelta de la alícuota | para todo entero `n` en [0, 1.000.000]: `parse(format(n)) = n`, con `format(n)` = `n div 10.000`, coma, `n mod 10.000` con 4 dígitos | CA-CM-4, S-CM-6 | R1 |
| PROP-CM-02 | Conversión exacta, sin punto flotante | para todo texto válido con parte entera `e` y decimales `d` (de 0 a 4 dígitos): `parse` = `e × 10.000 + d` completado con ceros a la derecha hasta 4 dígitos, calculado con enteros; coincide con una implementación de referencia con `bigint` | CA-CM-4 | R1 |
| PROP-CM-03 | Coma, punto y ceros finales equivalentes | `parse("e,d") = parse("e.d") = parse("e,d0…")` | CA-CM-4 | R1 |
| PROP-CM-04 | Rechazo fuera de la gramática o del rango | todo texto con 5 o más decimales, signo, exponente, símbolos o valor sobre 100 se rechaza; la función nunca devuelve un no entero ni un valor fuera de [0, 1.000.000]. En la API: `aliquotE6` se acepta si y solo si es un entero en ese rango; un no entero responde el texto de "4 decimales" y lo demás el del rango | CA-CM-4, CM-B3 | R1 |
| PROP-CM-05 | Suma y advertencia | para cualquier conjunto de unidades: `aliquotSumE6` = Σ `aliquotE6` (enteros) de las unidades de **esa** comunidad; la advertencia está presente si y solo si la suma ≠ 1.000.000, y su texto contiene `format(suma)`; ninguna escritura se rechaza por la suma | CA-CM-3, 5; CM-B4 | R1 |
| PROP-CM-06 | El orden natural es un orden total | para códigos guardados distintos `a`, `b`, `c`: exactamente uno de `a < b` o `b < a`; si `a < b` y `b < c`, entonces `a < c`; `comparar(a, a) = 0` | CM-B5, S-CM-24 | R1 |
| PROP-CM-07 | Tramos numéricos por valor, con cualquier largo | para tramos de dígitos de hasta 30 caracteres: `prefijo + x` va antes que `prefijo + y` si y solo si el valor de `x` es menor que el de `y` (comparación con `bigint` o por largo y dígitos, nunca con `Number`); con igual valor, va primero el de menos ceros a la izquierda | CM-B5 | R1 |
| PROP-CM-08 | Independencia del orden de entrada y de la configuración regional | ordenar cualquier permutación de una lista da la misma lista; el resultado es igual con `LANG`, `LC_ALL` y la configuración regional de ICU cambiadas | CM-B5 | R1 |
| PROP-CM-09 | Orden propuesto | para un estado con mayor orden `m` y un lote de `k` altas sin orden: reciben exactamente `m + 1` a `m + k`, en orden natural de sus códigos; los órdenes existentes no cambian; permutar las filas del lote no cambia la asignación | CA-CM-3, S-CM-7 | R1 |
| PROP-CM-10 | Normalización del código | `norm(norm(c)) = norm(c)`; `norm(c)` está en NFC, sin espacios en los extremos ni dobles; dos códigos chocan si y solo si sus formas normalizadas son iguales sin distinguir mayúsculas; las formas NFC y NFD de un mismo texto chocan | CM-B2 | R1 |
| PROP-CM-11 | Lote todo o nada | para cualquier lote: si alguna fila es inválida, el estado de `UNIT` y de `AUDIT_LOG` es idéntico al anterior y `rows` contiene exactamente las filas inválidas, cada una con su primer error; si todas son válidas, el estado final es el del lote y hay un solo `unit.batch` | CA-CM-6, CM-B6 | R1 |
| PROP-CM-12 | Unicidad contra el estado final | cualquier permutación de los órdenes (o de los códigos) entre las unidades existentes, enviada en un lote, se acepta; el conjunto de órdenes y de códigos queda sin repetidos | CM-B6 | R1 |
| PROP-CM-13 | RUT | `norm(norm(r)) = norm(r)`; todos los formatos de un mismo RUT dan la misma forma normalizada y la misma `PERSON`; un RUT es válido si y solo si su dígito es el de módulo 11; cambiar el dígito lo invalida | CM-C2 | R1 |
| PROP-CM-14 | Contacto | la normalización es idempotente; dos contactos se consideran iguales si y solo si sus formas normalizadas son iguales (base de la habilitación de D47) | CM-C3 | R1 |
| PROP-CM-15 | Una ficha y una membresía de residente por persona y comunidad (modelo) | tras cualquier secuencia de operaciones: a lo más una ficha por (persona, comunidad); a lo más una membresía `resident` no revocada por (persona, comunidad); ninguna fila de fichas ni de `MEMBERSHIP` se borra | CM-C4, CM-D5 | R1 y R1-F |
| PROP-CM-16 | La membresía de residente sigue a las ocupaciones (modelo) | existe una membresía `resident` no revocada si y solo si la persona tiene una ocupación vigente o programada en la comunidad; su `valid_from` es menor o igual que el menor `effective_from` de esas ocupaciones y nunca aumenta mientras la membresía no se revoque | CA-CM-15, S-CM-26 | R1 y R1-F |
| PROP-CM-17 | Aislamiento entre comunidades (modelo) | cualquier secuencia de operaciones de actores de A, con ids de A, de B o inexistentes en la ruta y en el cuerpo, deja idénticas todas las filas de B (unidades, fichas, membresías, ocupaciones, tareas, auditoría) y los contactos de `PERSON` | CA-CM-11, 23 | R1 |
| PROP-CM-18 | RUT de otra comunidad indistinguible (D48) | para cualquier RUT válido sin ficha en la comunidad, exista o no en ComVive y con cualesquiera datos en otras comunidades: la vista previa, sin el RUT enviado ni el `previewHash`, es la misma función de la petición | CA-CM-12 | R1 |
| PROP-CM-19 | Orden de validación | para cualquier petición que falla en varios pasos: la respuesta es la del primer paso que falla; dentro del paso 6, la de la primera regla del orden de su acción | "Orden de validación por acción" | R1 |
| PROP-CM-20 | Los rechazos no escriben y la clave guarda solo éxitos | PROP-GC-35 aplicada a toda escritura del módulo: una clave tiene fila en `IDEMPOTENCY_KEY` si y solo si su petición respondió 2xx; N reenvíos de un éxito dejan el mismo estado que uno | S-CM-23, D12 | R1 |
| PROP-CM-21 | Flag apagado | para cualquier cuerpo bien formado y cualquier estado: con `occupancy.end_and_transfer` apagado, ausente, o encendido en producción con la constante del traspaso en falso, el término y la venta responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` y no escriben; el propietario faltante, el alta y la cancelación responden lo mismo que con el flag encendido | CA-CM-26 | R1 |
| PROP-CM-22 | Lo que ve un residente | para cualquier conjunto de ocupaciones: `GET .../units` de un residente sin otros roles = exactamente las unidades donde tiene una ocupación vigente; la respuesta nunca trae `aliquotSumE6` ni la advertencia | CA-CM-10, 15 | R1 |
| PROP-CM-23 | Siempre un administrador | PROP-GC-39, con las fichas: ningún intercalado de otorgamientos y revocaciones deja una comunidad sin administrador ni cambia una ficha en un rechazo | CM-D6 | R1 |
| PROP-CM-24 | RUT enmascarado | para todo RUT: la forma enmascarada conserva solo los primeros dígitos (`12.345.***-*`) y nunca contiene los tres últimos dígitos del cuerpo ni el dígito verificador; las respuestas del comité nunca contienen un RUT completo | CM-C5 | R1 |
| PROP-CM-25 | Los cambios de unidades no tocan periodos emitidos (modelo) | para cualquier secuencia de altas, ediciones, lotes y eliminaciones posteriores a una emisión: la foto de participaciones y los movimientos de todo periodo emitido o cerrado son idénticos, y toda corrección posterior se calcula con la foto (extiende PROP-GC-17 y PROP-GC-14) | CA-CM-7, regla 6 | H-EMI |
| PROP-CM-26 | Eliminación | una eliminación responde 2xx si y solo si ninguna fila referencia la unidad; si responde 409, ninguna fila cambia | CM-B8 | R1 |

Las semillas que encuentren un fallo se agregan como caso fijo de regresión (plan §7).

## Hallazgos para el analista

Puntos de `docs/specs/comunidades-y-membresias.md` rev. 4 que no permiten fijar un resultado sin un supuesto, o que conviene precisar. No se editó la especificación. Los casos afectados usan el supuesto indicado y lo marcan.

| Id | Pregunta concreta | Supuesto usado mientras tanto | Casos afectados |
| --- | --- | --- | --- |
| H-CM-1 | La spec dice que la rebanada 1 implementa el "cambio después de un periodo emitido" (motivo obligatorio, CM-B7 y CM-B8), pero los periodos nacen en la rebanada de emisión. ¿Cómo sabe la rebanada 1 que una comunidad tiene un periodo emitido o cerrado: existe ya la tabla de periodos con su estado, o el motivo obligatorio se implementa en la rebanada de emisión? | La prueba siembra un periodo emitido en la base de datos (marca `R1-P`). Si la tabla no existe en la rebanada 1, los 11 casos `R1-P` pasan a `H-EMI` | TC-CM-CA7-01, 02; TC-CM-CA8-02, 03; TC-CM-CA9-02, 06; TC-CM-CB-10, 11, 13, 49, 50; PERM-CM-orden-6 |
| H-CM-2 | Orden natural (CM-B5, S-CM-24): ¿cómo se compara un tramo de dígitos con un tramo de texto en la misma posición? Por ejemplo, "101" con "B1" o "Depto 1" con "Depto A". La regla solo define dígitos con dígitos y texto con texto | Sin supuesto: los generadores de PROP-CM-06 a 09 no mezclan tipos de tramo en la misma posición hasta que se defina. Propuesta: el tramo de dígitos va primero | PROP-CM-06 a 09; TC-CM-CA3-01 no se ve afectado |
| H-CM-3 | Orden natural: "va primero el que tiene menos ceros a la izquierda", ¿se cuenta el total de ceros del código o se decide en el primer tramo numérico que difiere? Con "A 01 B 1" y "A 1 B 01" las dos lecturas dan órdenes distintos (total: empate y gana "A 01 B 1" por punto de código; por tramo: gana "A 1 B 01") | Por tramo, de izquierda a derecha (consistente con "tramo a tramo") | PROP-CM-07; TC-CM-CB-07 no se ve afectado |
| H-CM-4 | Orden propuesto (CM-B5): (a) en un lote donde unas altas traen `sortOrder` y otras no, ¿"el mayor orden existente" incluye los órdenes explícitos del mismo lote? (b) ¿qué responde un alta sin orden cuando el mayor existente es 999.999? | (a) Sí, se parte del mayor entre los existentes y los explícitos del lote. (b) Sin supuesto; no hay caso | PROP-CM-09 (solo lotes sin órdenes explícitos) |
| H-CM-5 | Función de conversión de texto (CM-B3): ¿se aceptan "", espacios en los extremos, ceros a la izquierda ("018,5"), ",5", "18," y "+18,5"? CA-CM-4 solo lista algunos rechazos | Se rechazan todos | TC-CM-CA4-04; PROP-CM-04 |
| H-CM-6 | `aliquotE6` en el JSON: ¿una cadena numérica ("185000") y un número con decimales en cero (185000.0) se aceptan, o responden `INVALID_ALIQUOT`? "No numérica" no cubre la cadena numérica | Sin caso hasta que se defina. Propuesta: la cadena responde `INVALID_ALIQUOT` y 185000.0 se acepta (es el mismo número JSON) | TC-CM-CA4-02; TC-CM-CB-47 |
| H-CM-7 | Texto de la advertencia de la suma: (a) con 0 unidades (suma 0), ¿viaja la advertencia "Las alícuotas suman 0,0000 %…"? (b) con una suma de 1.000 % o más, ¿lleva separador de miles ("1.500,0000 %")? | (a) Sí, por la lectura literal de CM-B4. (b) Sin separador de miles | TC-CM-CB-15; PROP-CM-05 |
| H-CM-8 | D48, "idéntico": la vista previa trae un `previewHash` que depende de la persona. ¿Se acepta que el valor difiera (mismo formato y largo)? ¿Se exige además que el tiempo de respuesta no distinga los dos casos? | El `previewHash` puede diferir en valor; no se prueba el tiempo de respuesta | TC-CM-CA12-01, 04; PROP-CM-18 |
| H-CM-9 | Semántica del reemplazo y de la corrección del contacto: (a) al otorgar `admin` con solo celular a una ficha que tenía correo, ¿el correo se borra? (b) en `PATCH …/person-records`, ¿un campo ausente no cambia, como en la comunidad? ¿Se puede vaciar el contacto de un residente (es opcional) enviándolo nulo? (c) ¿un `PATCH` sin cambios o con cuerpo vacío responde 2xx y deja auditoría? | (a) Se borra: el contacto se reemplaza completo. (b) y (c) Sin caso hasta que se defina | TC-CM-CA27-04; TC-CM-CA19-01; TC-CM-CA2-01 |
| H-CM-10 | Contrato de las lecturas: nombre del filtro de historial de `GET …/memberships`, orden de las listas (¿`GET …/units` por `sort_order`?) y si el motivo de la revocación de comité es texto libre o una lista ("término del periodo", "renuncia", "otro") | Texto libre; las pruebas de lista comparan conjuntos, no orden | TC-CM-CA18-02; TC-CM-CA16-02 |
| H-CM-11 | Un `communityId` en el cuerpo de una ruta `/platform/...` o de comunidad: el caso aprobado ISO-GC-operaciones-2 (a) espera 404; CM-C1 ("un campo que no está en esta tabla no se acepta (400)") y el supuesto de ISO-GC-plataforma-11 (d) esperan 400. ¿Cuál rige? | Se verifica solo que no se escribe nada en la otra comunidad; el código queda pendiente | ISO-CM-plataforma-2 (c); ISO-CM-comunidad-2; ISO-CM-unidades-3 |
| H-CM-12 | Flag `platform.admin_first_access_alert`: ¿la rebanada 1 implementa el encolado con el flag encendido (para probar los dos estados), o solo "no encolar"? | Lo implementa detrás del flag | TC-CM-CA1-07 |
| H-CM-13 | En el alta de comunidad, `INVALID_RUT` de la comunidad y del administrador traen el mismo código y texto: el orden entre ellos no se puede probar. ¿El error lleva un campo que indique a qué dato se refiere? | No se prueba ese orden | TC-CM-CA1-02 (b) |
| H-CM-14 | Formatos de entrada: (a) ¿se acepta un RUT sin guion ("123456785")? (b) ¿un celular sin "+56" ("912345678")? (c) un nombre con espacios en los extremos, ¿se recorta o responde 400? (d) el largo máximo (30, 120), ¿se mide antes o después de normalizar? (e) un motivo enviado cuando no se exige, ¿se guarda o responde 400? | (a) y (b) Sin caso. (c) Se recorta. (d) Antes de normalizar. (e) Se guarda en la auditoría | TC-CM-CB-46, 52, 53, 56 |
| H-CM-15 | Observación, no ambigüedad: con el flag apagado, `BUYER_IS_CURRENT_TENANT` en un propietario faltante dice "Registra primero el término o la cancelación de su arriendo", pero el término responde 422 `OCCUPANCY_ACTION_NOT_AVAILABLE`. El administrador queda sin salida dentro de la aplicación hasta la rebanada del libro (CM-E6 ya dice que ComVive lo registra a pedido). ¿Se ajusta el texto mientras el flag esté apagado? | El texto de la spec, tal cual | TC-CM-CB-54 |

Preguntas ya abiertas en la spec que bloquean parte de un caso: **P-CM-20** (ruta del archivo de configuración de producción y variante de la segunda barrera: TC-CM-CA26-04 y 05) y **P-CM-18** (nombre de la tabla de fichas: convención "Nada escrito").
