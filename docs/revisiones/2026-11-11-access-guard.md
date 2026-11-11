# Revisión cruzada de código: implementación del ADR 0009 "Guard global de denegación por defecto"

- **Fecha:** 2026-11-11
- **Revisor:** agente `revisor-critico`. Solo leyó. El coordinador guarda el informe.
- **Base revisada:** rama `feat/access-guard`, 7 commits sobre `main` @ 56b868c. Referencia: `docs/adr/0009-guard-global-denegacion-por-defecto.md` (rev. 4, aceptado) y ADR 0003, decisión 9.
- **Alcance:** fidelidad al ADR, corrección, calidad de las pruebas y complejidad. La revisión de seguridad está en `docs/revisiones/2026-11-11-access-guard-seguridad.md`.
- **Veredicto:** **Aprobado con cambios.** Sin errores de monto (el módulo no mueve dinero) ni vías de fuga entre comunidades en lo que corre hoy; el guard falla cerrado en todos los caminos revisados. Hay que corregir antes de fusionar: una desviación del orden de la decisión 3 en `platform` que un doble oculta, la fuga de mensajes del *framework* antes del guard, el mapa de pruebas (2 y 7 incompletas, 12 matizada) y dos pruebas que pasan por construcción (barrido de la prueba 10 y prueba 14 de producción).
- **Estado de la resolución:** pendiente de las respuestas del líder del proyecto.

## Mayor

### M-1. En `platform`, el contenedor se llena después del paso 3b, al revés de lo que dice el ADR; el doble lo oculta

- **Dónde:** `apps/api/src/access/access.guard.ts:251-273`: `fillPlatformContext(principal, tenant)` va después de `checkPathResources`.
- **Qué dice el ADR:** decisión 3, fila `platform`, paso 3b: si la comunidad existe se "llena el contenedor con el `TenantContext` de esa comunidad" y "después" se verifica cada `pathResources`; `admin-membership` "se verifica con el cliente Prisma por comunidad de la comunidad de la ruta".
- **Por qué importa:** ese cliente lee el `TenantContext` del contenedor y lanza error si está vacío; la implementación real de `admin-membership` fallará con 500 o tendrá que saltarse el contenedor. `FakeAdminMembershipVisibility` (`test-support/doubles.ts:190-197`) lee `check.tenant` del argumento y no del contenedor. En `community` el orden es correcto (`access.guard.ts:166`).
- **Corrección:** llenar el contenedor apenas se valida la comunidad (o al pasar 3a si la ruta no lleva comunidad), antes de `checkPathResources`; que los dobles de `PathResourceVisibility` lean `requireTenantContext()`; un caso que falle si el contenedor está vacío durante 3b.

### M-2. Un parámetro de ruta mal codificado responde 400 con el mensaje de NestJS, antes del guard

- **Dónde:** `access-exception.filter.ts:86-92` devuelve el cuerpo crudo de todo `HttpException` que no sea 401, 403 ni 404. Origen: `@nestjs/platform-express` 12.4.0, `express-adapter.js:494-500`, que convierte el `URIError` de Express en `new BadRequestException(error.message)`.
- **Qué sale hoy:** `{"statusCode":400,"message":"Failed to decode param '%E0'","error":"Bad Request"}`: revela el *framework*, repite el parámetro y rompe el orden de ADR 0003, decisión 9 (un anónimo recibe 400 antes del 401). No hay pruebas.
- **Corrección:** en el filtro, si `status === 400` y `request.route === undefined`, responder 404 `{"code":"NOT_FOUND"}` (bajo `/platform/`, con su fila `anonymous`). En general, normalizar todo `HttpException` sin `code` a `{"code": <código neutro por estado>}`. Pruebas: anónimo y sesión válida con `%E0` en `communityId` y en `unitId`, y la misma ruta bajo `/platform/`.

### M-3. El mapa de pruebas 1 a 16 no es exacto

- **Prueba 2:** ninguna prueba ejecuta "aplicar un decorador de política a una clase lanza error al cargar" (`access-policy.ts:41-44`). Corrección: aplicar `(CommunityRoute({...}) as ClassDecorator)` a una clase y esperar `TypeError`.
- **Prueba 7:** falta "un servicio que lanza `new NotFoundException('Unidad 123')` o `new ForbiddenException('...')` responde exactamente `{"code":"NOT_FOUND"}` o `{"code":"FORBIDDEN"}`" (`access.guard.test.ts:208-241` cubre solo rechazos del guard y ruta inexistente). Corrección: un controlador de prueba con dos *handlers* que las lancen, comparando cuerpo y encabezados con el 404 del guard.
- **Prueba 12:** la parte de plataforma (`access.guard.test.ts:522-547`) pasa porque `createAccessTestApp` reemplaza `PLATFORM_AUDIT_WRITER` por un doble; con los puertos por defecto, toda ruta `/platform/...` responde 500 y no 401. Corrección: decirlo en el nombre y el estado, o agregar un caso con `AppModule` real que fije el 500 actual como esperado.
- **Prueba 13:** las 37 aserciones de "reporta" solo verifican `not.toEqual([])` (`lint-rules.test.ts:219`) (ver m-6).
- **Estado corregido:** 2, 7 y 12 parciales; 13 implementada con aserciones débiles.

### M-4. El barrido de la prueba 10 puede pasar por la razón equivocada: falta un control positivo

- **Dónde:** `test-support/isolation-sweep.ts:132-141` e `isolation-sweep.test.ts:21` (`memberOfCommunity: () => TOKENS.adminA`, fijo).
- **Problema:** "recurso ajeno en `:param`, 404" se da por bueno con cualquier 404; si los roles del miembro no ven `resource`, el 404 sale de 3a y el paso 3b nunca se ejecuta.
- **Corrección:** antes de los casos con recurso ajeno, ejecutar el mismo miembro con todos los parámetros visibles y exigir que **no** responda 404 (si responde 404, registrar "el miembro de control no pasa 3a"), o un espía que confirme la llamada al puerto del parámetro.

### M-5. La prueba 14 de producción pasa por construcción

- **Dónde:** `policy-tables/policy-tables.test.ts:92-98` pasa `PRODUCTION_ACCESS_POLICY_TABLES.platformPathResources` como lista de implementaciones registradas, así que "todo `PlatformPathResource` tiene implementación" se cumple siempre, mientras el `it.todo` de las líneas 113-116 lo declara pendiente.
- **Corrección:** tomar las implementaciones reales con `app.get(PATH_RESOURCE_VISIBILITIES)` sobre `AppModule` (hoy `[]`) y fijar los dos faltantes actuales como esperados, con un comentario que remita al `todo`.

### M-6. Falta `.github/CODEOWNERS` (D36, D40)

- **Corrección:** el coordinador lo agrega en este PR, cubriendo `apps/api/src/access/**`, `docs/adr/**`, `.github/**` y `eslint.config.mjs`, y anota en `docs/operaciones/` que la exigencia sigue sin activarse.

### M-7. D46 no está implementado para los intentos concretos

- **Dónde:** `ports.ts:97` define `isVisible` como `Promise<boolean>`; `platform-access-audit.ts:140` toma `communityId` solo del `tenant` o de la ruta.
- **Efecto:** el detalle, la vista previa y la resolución de un intento de A quedan con `community_id` nulo y su administrador no las ve, contra D46 y la prueba 11. La prueba de 409 (`platform-access-audit.test.ts:156-163`) no verifica `communityId`.
- **Corrección:** cambiar el puerto ahora a `isVisible(check): Promise<{ visible: boolean; auditCommunityId?: string }>` (o un método aparte para recursos de plataforma); el guard guarda `auditCommunityId` en `identified.communityId` y **no** lo pone en el `TenantContext`; caso de la prueba 11 con el doble de `webpay-attempt` devolviendo la comunidad A.

## Menor

1. **m-1. Un rechazo en 3a deja `platformRole: null`.** `access.guard.ts:238-249` y `platform-access-audit.ts:139`; la prueba `platform-access-audit.test.ts:135-143` se llama "leaves a platform row with its role" y espera `null`. La decisión 3 dice que los rechazos de los pasos 2 y 3 llevan persona y rol. Registrar el rol vigente y alinear el nombre.
2. **m-2. En `platform`, un error que no es `AccessDeniedException` no se audita en el guard** (`access.guard.ts:216-220`) y lo escribe el filtro como `anonymous`. Auditar todo error con `outcomeOf(error)`, salvo `PlatformAudit*Exception`.
3. **m-3. El guard y el inventario deciden con reglas distintas cuándo `:communityId` es la comunidad de la ruta** (`access.guard.ts:286-289` frente a `route-inventory.ts:255-258` y `access.guard.ts:254`). Una sola función `routeCommunityParam(path, kind)` en `route-template.ts`.
4. **m-4. `request.aborted` se descarta sin rastro** (`configure-app.ts:84`), aunque el ADR dice que queda en el registro de la API. Un `logger.log` con método y ruta, sin cuerpo.
5. **m-5. El cuerpo del 500 es el de NestJS**, duplicado en `access-exception.filter.ts:29` y `body-parsers.ts:59`. Una sola constante; el cuerpo lo decide el líder.
6. **m-6. Las pruebas de lint "reporta" no verifican qué regla saltó** (`lint-rules.test.ts:219`). Comparar el mensaje esperado de cada fila.
7. **m-7. En la prueba 8, "el parámetro llega como texto sin cambios" es una tautología** (`body-parsers.test.ts:27-35` y `155-160`): `TransformingGlobalPipe` ya cumple la regla por sí mismo. Mantenerlo como pendiente (`ValidationPipe` real con `class-validator`).
8. **m-8. La prueba de *keep-alive* no comprueba que se reutilizó la conexión** (`access.guard.test.ts:330-348`). Comparar `request.socket.remotePort` o usar un `http.Agent({ keepAlive: true, maxSockets: 1 })`.
9. **m-9. Nombre engañoso** en `route-inventory.test.ts:311` ("and a platform route with communityId third" solo monta `WellFormedCommunityController`). Renombrar.
10. **m-10. Mapa de implementaciones de `PathResourceVisibility`** (`access.guard.ts:85`): un segundo registro para el mismo tipo reemplaza al primero sin avisar, y los recursos de comunidad y de plataforma comparten espacio de nombres. Que `assertRouteInventory` falle con duplicados y que la prueba 14 verifique que las dos listas no se cruzan.
11. **m-11. `Authorization` exige `Bearer` con mayúscula** (`access.guard.ts:134`); RFC 7235 no distingue mayúsculas en el esquema. Hoy falla cerrado (401). Decidirlo o usar la bandera `i`.
12. **m-12. Código muerto:** la rama de `GatewayRejectedException` en `outcomeOf` (`platform-access-audit.ts:49-51`); la variante `'nestjs-adapter-hooks (active)'` (`route-inventory.ts:133`) sin caso esperado; el argumento `httpMethod` de `requestAborted`; `PlatformPrincipal.platformRoles` fuera del guard (útil si se aplica m-1).
13. **m-13. El ADR quedó desactualizado en la lista de puertos** (decisión 3, "El guard no conoce..."): la implementación agrega `CommunityDirectory` y `AccessEventLog`. Actualizar ese párrafo en el mismo PR.

## Recomendaciones sobre lo que reportó el desarrollador

1. **Puerto `CommunityDirectory.exists`: aceptar**, y agregarlo con `AccessEventLog` a la lista de puertos de la decisión 3 (m-13). Se consulta después de 3a y su valor por defecto falla cerrado.
2. **Tablas de acceso de comunidad vacías hasta la rebanada 1: aceptar.** `CommunityResource` queda como `never`, así que ningún `@CommunityRoute` de producción compila sin su entrada. Condición: la rebanada 1 agrega en el mismo PR las entradas con su `source`, sus implementaciones de `PathResourceVisibility` y la prueba 14 corregida (M-5).
3. **`it.todo` de la prueba 14: aceptar**, corrigiendo la prueba de al lado que lo simula (M-5).
4. **D46 por intento: implementarlo ahora en el puerto** (M-7); la comunidad va solo a la auditoría, nunca al `TenantContext`.
5. **400 de NestJS con parámetro mal codificado: no aceptarlo** (M-2); mapearlo a 404 `NOT_FOUND`.
6. **500 en todo `/platform/...` hasta que exista el pool de auditoría: aceptar como fallar cerrado**, con dos condiciones: que `assertRouteInventory` falle si la aplicación registra alguna ruta `platform` mientras el escritor sea `UnavailablePlatformAuditWriter`, y que se deje escrito que hoy un sondeo anónimo a `/platform/x` recibe 500 y no 404.
7. **Cuerpo del 500:** `{"code":"INTERNAL_ERROR"}` en una sola constante (m-5); lo decide el líder.
8. **Excepción a TDD en las pruebas de auditoría:** no aceptarla en silencio. Las pruebas no son tautológicas (`onlyRow()` exige exactamente una fila con valores concretos). Recomendación: que el líder la apruebe como desviación puntual, que quede en este informe, que se demuestre por mutación que cada prueba falla al quitar la escritura correspondiente (guard, interceptor, filtro y envoltura del 413) y que no sea precedente para la rebanada 1.

## Complejidad

El tamaño (unas 6.000 líneas) es razonable para lo que pide el ADR y no hay abstracciones de más. Los puntos frágiles son los que el ADR ya acepta en "Riesgos": `describeExpressStack` reconoce las capas anónimas de NestJS por posición y aridad, y `configOf` lee `app.config`, que es privado. Sobra poco: la lógica duplicada de m-3, la constante del 500 duplicada de m-5 y el código muerto de m-12.

## Qué se revisó

- **Código:** `access.guard.ts`, `access-policy.ts`, `ports.ts`, `request-context.ts`, `route-template.ts`, `route-inventory.ts`, `route-exceptions.ts`, `access.module.ts`, `access-exception.filter.ts`, `access-errors.ts`, `body-parsers.ts`, `body-parse-error.interceptor.ts`, `platform-access-audit.ts`, `client-ip.ts`, `policy-tables/*`, `configure-app.ts`, `api-app.ts`, `main.ts`, `app.module.ts`, `config/trust-proxy-hops.ts`, `tsconfig.build.json`, `package.json` y los bloques de `apps/api` en `eslint.config.mjs`.
- **Pruebas y dobles:** todas las pruebas de `access/` y `health/`, y `test-support/*`.
- **Dependencias:** comportamiento de `@nestjs/core` y `@nestjs/platform-express` 12.4.0 instalados (`routes-resolver.js` y `express-adapter.js`).

## Preguntas para el líder del proyecto

1. **Excepción a TDD en las pruebas de auditoría:** ¿se acepta como desviación puntual, con la verificación por mutación de la recomendación 8, o se rehacen esas pruebas en rojo primero?
2. **Cuerpo del 500:** ¿se fija `{"code":"INTERNAL_ERROR"}` como supuesto (a validar) agregado a la tabla de errores de la spec, igual que ADR-0009-S1 con el 401?
3. **Intento existente fuera de la vista `platform_webpay_review` (D44 y D46):** ¿el rechazo 404 se audita con la comunidad del intento o con `community_id` nulo? Recomendación: la comunidad del intento solo cuando es visible.
4. **Prueba 14:** ¿se ajusta el ADR para exigir implementación de `PathResourceVisibility` solo a los tipos que aparecen en algún `pathResources`? Hoy obligaría a implementaciones de relleno para tipos como `billing-config` o `charge`.
5. **Rol en la fila de un rechazo de plataforma con varios roles vigentes (m-1):** ¿se registra el primero o todos? La columna `platform_role` es una sola.
6. **`CODEOWNERS` (M-6):** ¿lo agrega el coordinador en este mismo PR o en uno aparte antes de fusionar?
