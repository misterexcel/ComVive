# ADR 0002 · Aislamiento multi-comunidad

- **Estado:** Propuesto (requiere aprobación del líder del proyecto)
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0003 (orden de validación y permisos), ADR 0006 (excepción acotada EX-1)

## Contexto

La regla 4 de `CLAUDE.md` exige que toda consulta a datos de negocio filtre por comunidad y que ningún usuario vea datos de otra comunidad. Un olvido es una falla crítica: expone deudas y RUT de terceros (regla 7, Ley 21.719). Al mismo tiempo, ComVive atenderá muchas comunidades pequeñas con un equipo pequeño, y una misma persona puede tener membresías en varias comunidades (administrador multi-comunidad, propietario de unidades en dos condominios).

También hay que decidir qué responde la API cuando alguien pide algo que no puede ver o no puede hacer, de forma que la respuesta no revele si un recurso existe (decisión del líder M-4, 2026-11-07).

## Decisión

**Base de datos y esquema compartidos, con columna `community_id` en toda tabla de negocio y dos barreras** (`docs/arquitectura.md` §2):

1. **Barrera 1 · Aplicación (obligatoria):**
   - Toda ruta de negocio lleva la comunidad en la URL (`/communities/{communityId}/...`).
   - Un guard de NestJS valida en **cada petición** la membresía vigente y arma el `TenantContext` (comunidad, persona, roles). Revocar una membresía corta el acceso en la petición siguiente, sin revocar la sesión de la persona ni afectar sus otras comunidades (ADR 0005, decisión 3; H-42).
   - El acceso a datos pasa por un **cliente Prisma extendido** que agrega y exige `community_id` en cada lectura y escritura. Usar el cliente sin extender fuera de su módulo queda prohibido por regla de lint.
   - **Claves foráneas compuestas `(community_id, id)`**, para que la base de datos impida que una fila de la comunidad A apunte a una de B.
2. **Barrera 2 · Row Level Security de PostgreSQL (recomendada, sujeta a prototipo):** políticas que comparan `community_id` con `current_setting('app.community_id')`, fijado con `SET LOCAL` en la transacción de cada petición; la API se conecta con un rol sin `BYPASSRLS` y las migraciones con otro.
   - **Criterio para posponer:** si el prototipo de la Etapa 2 muestra que la transacción por petición complica el pool de conexiones o el uso de Prisma dentro de ella, RLS se pospone, la barrera 1 queda sola y las pruebas de aislamiento por endpoint se mantienen obligatorias. La decisión del prototipo se registra como actualización de este ADR.
3. **Datos globales en una lista cerrada:** `PERSON` (solo identidad), `UF_VALUE`, tasa de interés corriente CMF, `PUBLIC_HOLIDAY`, ingreso (`SESSION`, `LOGIN_THROTTLE`), "Mis comunidades", `PLATFORM_ROLE_GRANT` y la vista `platform_webpay_review` (única lectura transversal, ADR 0006). Todo lo demás es por comunidad. Agregar un elemento a la lista exige actualizar este ADR. La búsqueda por RUT nunca devuelve datos de otra comunidad.
4. **Regla única de errores (M-4):** **404 si el actor no puede ver el recurso; 403 solo si lo ve pero su rol no permite la acción.** Orden fijo de validación: sesión → membresía (o rol de plataforma) → visibilidad del recurso → permiso de la acción → forma (400) → idempotencia → estado y reglas de negocio (detalle en ADR 0003, decisión 9; H-34). Los 404 tienen un cuerpo único (`NOT_FOUND`) y los 403 otro (`FORBIDDEN`). La visibilidad se decide con la matriz "Qué recursos ve cada rol" de la spec, implementada como tabla de visibilidad por (rol, tipo de recurso) y aplicada antes de la matriz de permisos (ADR 0003). Para residentes, además, la visibilidad por ámbito (ADR 0004).
5. **Cada endpoint nuevo lleva su prueba de aislamiento** (regla 4), generada a partir de la tabla de visibilidad y la matriz de permisos, más las pruebas de 404 entre comunidades.

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Una base de datos por comunidad | Costo y operación desproporcionados para muchas comunidades pequeñas; cada migración se multiplica por el número de comunidades. |
| Un esquema PostgreSQL por comunidad | Prisma no maneja bien esquemas dinámicos; complejidad alta para un equipo pequeño. |
| Solo filtro en la aplicación, sin RLS y sin FK compuestas | Un olvido produce una fuga (falla crítica, regla 4). Queda solo como respaldo si el prototipo pospone RLS, y aun así con FK compuestas y pruebas obligatorias. |
| `community_id` tomado de la sesión o de un encabezado, no de la URL | Oculta la comunidad en la petición, complica el administrador multi-comunidad y hace más difícil probar el aislamiento por ruta. |
| 403 siempre que falte permiso, aunque el actor no vea el recurso | Revela que el recurso existe. Descartado por el líder (M-4). |

## Consecuencias

### Positivas

- Una sola base de datos y un solo esquema: migraciones simples y operación barata en Cloud SQL.
- Defensa en profundidad: la FK compuesta y RLS detienen errores que la aplicación no vio.
- Respuestas que no filtran existencia: un atacante no distingue "no existe" de "no es tuyo".
- Un patrón repetible para los agentes: ruta con `communityId`, guard, cliente extendido, prueba de aislamiento.

### Negativas

- Toda clave primaria de negocio se acompaña de `community_id` en las FK, lo que agranda índices y migraciones.
- La lectura de la membresía en cada petición agrega una consulta (aceptable para el volumen del MVP).
- Con RLS, cada petición abre una transacción y fija `app.community_id`, lo que condiciona cómo se usa Prisma.

### Riesgos

- **RLS con Prisma y el pool de conexiones:** si `SET LOCAL` se ejecuta fuera de la transacción, la variable no aplica o se filtra a otra petición. Mitigación: prototipo con prueba que alterna dos comunidades en la misma conexión del pool.
- **Datos globales que crecen sin control:** mitigación con la lista cerrada y su actualización obligatoria en este ADR.
- **Rutas sin prueba de aislamiento:** mitigación con la generación automática de pruebas desde la tabla de visibilidad y una verificación en CI de que todo endpoint del contrato OpenAPI tiene su prueba.

## Supuestos (a validar) y preguntas abiertas

- **ADR-0002-S1 · Supuesto (a validar):** RLS es viable con Prisma y el pool de Cloud SQL; si no, se aplica el criterio para posponer.
- **Supuesto (a validar) S-53 de la spec:** la matriz "Qué recursos ve cada rol" decide entre 404 y 403.
- **Supuesto (a validar) de la arquitectura §3:** el panel consolidado multi-comunidad queda fuera del MVP; no hay endpoints que agreguen varias comunidades.
- Preguntas de `docs/arquitectura.md` §8: 2 (empresa administradora con varios empleados, que podría cambiar el modelo de membresía) y 4 (datos que necesita el conserje).
- Spec: P-24 (otorgamiento de roles de plataforma, que alimenta la lista de datos globales).

## Referencias

- `docs/arquitectura.md` §2 (aislamiento, datos que cruzan comunidades, regla única 404/403, alternativas descartadas) y §3 (control de acceso por rol).
- `docs/specs/gasto-comun.md`: "Usuarios y permisos", "Respuestas de error", "Qué recursos ve cada rol" (H-20, S-53), EX-1, CA-23 (aislamiento entre comunidades y unidades), CA-24 (permisos por rol) y CA-42 (aislamiento de Soporte ComVive).
- `docs/qa/plan-de-pruebas.md` (ISO-8: 404 para no revelar existencia).
- `CLAUDE.md`: reglas 4 y 7.
