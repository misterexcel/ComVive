# Revisión de seguridad: implementación del ADR 0009 "Guard global de denegación por defecto"

- **Fecha:** 2026-11-11
- **Revisor:** agente `revisor-seguridad`. Solo leyó; no editó nada. El coordinador guarda el informe.
- **Base revisada:** rama `feat/access-guard`, 7 commits sobre `main` @ 56b868c.
- **Veredicto:** **Aprobado con cambios.** No hay ninguna vía para llegar a un *handler* sin pasar por el guard, ni fugas entre comunidades; tampoco secretos ni tokens en código o registros, y `test-support` no entra al build. Los puertos por defecto fallan cerrados. Hay un mayor de gobernanza (falta `CODEOWNERS`, comprometido en D36) y siete menores.
- **Estado de la resolución:** pendiente de las respuestas del líder del proyecto.

## Qué se revisó

- **Guard y pasos:** `access.guard.ts` completo: orden 401, 404 y 403 por política, pasos 3a, 3b y 3c, plataforma, `gateway` e `internal-job`.
- **Filtro y cuerpos neutros:** `access-exception.filter.ts`, `access-errors.ts` y `body-parse-error.interceptor.ts`.
- **Analizadores de cuerpo:** `body-parsers.ts`, con su tabla de errores frente a la decisión 6.
- **Contexto de la petición:** `request-context.ts` (`AsyncLocalStorage`, *middleware*, `runInCommunity`) y la prueba de *keep-alive*.
- **IP del cliente:** `client-ip.ts`, `config/trust-proxy-hops.ts` y `.env.example`.
- **Auditoría de plataforma:** `platform-access-audit.ts` (servicio e interceptor).
- **Inventario y lista cerrada:** `route-inventory.ts` (comprobaciones 1 a 8, pila de Express) y `route-exceptions.ts`.
- **Tablas y puertos:** `policy-tables/*` y `ports.ts` con sus valores por defecto.
- **Arranque:** `access.module.ts`, `configure-app.ts`, `api-app.ts`, `main.ts` y `health.controller.ts`.
- **Lint:** `eslint.config.mjs`, todos los bloques de `apps/api`.
- **Build y dependencias:** `tsconfig.build.json`, `package.json` y `pnpm-lock.yaml` (una sola copia de `express@5.3.0`, la misma de `@nestjs/platform-express@12.4.0`).
- **Pruebas:** `test-support/*` y las pruebas de guard, inventario, barrido y auditoría.
- **CI:** `.github/workflows/ci.yml`.

Vías comprobadas en concreto:

- **`HEAD`:** pasa por el mismo *handler* `GET` y, por lo tanto, por el guard.
- **`OPTIONS`:** la respuesta automática de Express nunca se alcanza; el manejador de ruta inexistente de NestJS la intercepta antes y termina en 404 neutro.
- **Mayúsculas y barra final:** cubiertas por `case sensitive` y `strict routing`, con pruebas.
- **Barras dobles y `%2F` en segmentos estáticos:** no calzan con ninguna ruta; responden 404.
- **Parámetros mal codificados:** responden 400 antes del guard (m-2).
- **Capas antes del guard:** el *middleware* de NestJS, `app.use` y los *routers* de Express los detecta la comparación de la pila; queda un hueco en `router.params` (m-4).
- **`trust proxy`:** el número de saltos es correcto; queda un riesgo de configuración (m-5).

## Mayor

### M-1. Falta `.github/CODEOWNERS`; la lista cerrada y las tablas de acceso no tienen dueño

- **Ubicación:** ausencia de `.github/CODEOWNERS` (en `.github/` solo existe `workflows/ci.yml`). Lo exigen ADR 0009, decisión 4 ("Tablas de acceso y propietario de código") y D36 ("Lo configura el coordinador junto con la implementación de este ADR"), ampliado por D40.
- **Escenario:** un PR puede, sin revisión del líder, agregar una entrada a `ROUTE_EXCEPTIONS` (`apps/api/src/access/route-exceptions.ts:22`), darle a `resident` un permiso de comunidad en `policy-tables/community.ts` o desactivar una regla de lint en `eslint.config.mjs`. `assertExceptionsAuthorized` solo exige que el ADR citado esté Aceptado: citando `'ADR 0009, decisión 5'`, una ruta `public-technical` nueva pasa CI.
- **Corrección:** agregar `.github/CODEOWNERS` con el líder como dueño de `apps/api/src/access/**`, `docs/adr/**`, `.github/**` y `eslint.config.mjs`. Según D40, puede entrar sin activar todavía "Require review from Code Owners". Si va en un PR aparte, este PR no se fusiona antes que ese.

## Menor

### m-1. El cuerpo del 500 y de los demás errores no neutros sale con el formato de NestJS

- **Ubicación:** `access-exception.filter.ts:29` (`INTERNAL_ERROR_BODY = { statusCode: 500, message: 'Internal server error' }`); `access-exception.filter.ts:86-92` (todo `HttpException` distinto de 401, 403 y 404 devuelve `exception.getResponse()` tal cual); `body-parsers.ts:59`.
- **Escenario:** el 500 delata el *framework* (lo que ADR-0009-S1 busca evitar). Además, un servicio que lance `new BadRequestException('El RUT 12.345.678-9 ya existe en la unidad 1203')` publica ese texto, porque el filtro solo neutraliza 401, 403 y 404; las rebanadas de negocio heredarán ese comportamiento.
- **Corrección:** 500 con cuerpo neutro `{"code":"INTERNAL_ERROR"}` en `NEUTRAL_BODIES`; para los demás estados, dejar pasar solo cuerpos con la forma del contrato de ADR 0003 (`{ code, ... }` con campos declarados) y, si no, `{ code: <neutro del estado> }`. Prueba: `new BadRequestException('texto con datos')` no sale.

### m-2. Un parámetro de ruta mal codificado responde 400 con el mensaje de NestJS antes del guard

- **Ubicación:** Express decodifica el parámetro al calzar la ruta; `mapExternalException` de NestJS convierte el `URIError` en `BadRequestException(err.message)` y `access-exception.filter.ts:86-92` deja pasar ese cuerpo.
- **Escenario:** `GET /communities/%E0%A4%A/billing-config` anónimo responde 400 `{"message":"Failed to decode param '%E0%A4%A'",...}`: rompe "401 primero" (ADR 0003, decisión 9), refleja la entrada del atacante y, con sesión válida, se distingue de una ruta inexistente (la prueba 7 exige que sean idénticas). No expone datos de negocio: es menor.
- **Corrección:** en el filtro, si `request.route === undefined` y el estado es 400, responder 404 `{"code":"NOT_FOUND"}`, como una ruta inexistente. Agregar el caso a las pruebas 7 y 9.

### m-3. En plataforma, el contenedor se llena después del paso 3b, y un error que no es de acceso pierde a la persona en la auditoría

- **Ubicación:** `access.guard.ts:251-273` (`fillPlatformContext` en la línea 273, después de `checkPathResources` en la 268); `access.guard.ts:214-221` (solo audita `AccessDeniedException`).
- **Escenario A (aislamiento):** la decisión 3 (fila `platform`) dice que en 3b se llena el contenedor y que `admin-membership` se verifica con el cliente Prisma por comunidad, que lee `requireTenantContext()` (`request-context.ts:120`) y hoy lanzaría error con el contenedor vacío. El riesgo está en la próxima rebanada: el implementador del puerto podría esquivarlo con un cliente sin RLS (rompe la barrera 2 de ADR 0002).
- **Escenario B (auditoría, ADR 0006, decisión 8):** si un puerto lanza un error de base de datos después de identificar a la persona, el `catch` no lo audita y el filtro escribe la fila como `anonymous`, en vez de `platform` con persona y rol.
- **Corrección:** llenar el contenedor con `principal` y `tenant` apenas pasa la existencia de la comunidad en 3b, antes de los `pathResources`; en `checkPlatform`, auditar con `identified` cualquier error usando `outcomeOf(error)`. Pruebas con un puerto que lee `requireTenantContext()` y con uno que lanza error.

### m-4. Vías para ejecutar código antes del guard o cambiar la configuración de Express que no detectan el inventario ni el lint

- **Ubicación:** `route-inventory.ts:113-175` (solo inspecciona `router.stack`); `eslint.config.mjs:113-138` (no restringe `HttpAdapterHost`, `.param(` ni `.set(`).
- **Escenario:** un módulo de negocio inyecta `HttpAdapterHost` y llama a `getInstance().param('communityId', loader)`: queda en `router.params` y corre antes del guard en toda ruta con `:communityId` (consultas con peticiones anónimas, oráculo de tiempo). Del mismo modo, `getInstance().set('trust proxy', true)` en un `onModuleInit` cambia `req.ip` en tiempo de ejecución; la prueba 15 solo lo detecta si el módulo está en `AppModule`.
- **Corrección:** en `assertRouteInventory`, verificar `router.params` vacío, `x-powered-by` en `false`, `case sensitive routing` y `strict routing` en `true` y `trust proxy` igual a `TRUST_PROXY_HOPS`. Restringir `HttpAdapterHost` por lint a `src/access/**` y `configure-app.ts`.

### m-5. Con `TRUST_PROXY_HOPS=2` y la URL `run.app` accesible, la IP del cliente se puede falsificar

- **Ubicación:** `config/trust-proxy-hops.ts:11-21`; `apps/api/.env.example:4-5`; tabla de la decisión 7 del ADR.
- **Escenario:** con 2 saltos para el balanceador pero ingreso `all`, una llamada directa a `*.run.app` con `X-Forwarded-For: 203.0.113.7` hace que Express tome esa IP: elude el límite por IP del ingreso (ADR 0005, decisión 4) y la IP del registro anónimo. El código es correcto; es un riesgo de configuración que debe quedar resuelto antes del módulo de sesión.
- **Corrección:** dejar escrito en la tabla del ADR y en `docs/operaciones/` que el valor 2 exige ingreso `internal-and-cloud-load-balancing` (sin URL `run.app` pública), y una prueba de humo por ambiente: un `X-Forwarded-For` inventado no cambia la IP registrada.

### m-6. `runInCommunity` abre un contenedor desligado del de la petición (latente)

- **Ubicación:** `request-context.ts:134-142`, con `platform-access-audit.ts:99-105`.
- **Escenario:** cuando exista `recordPlatformAction`, la marca de auditoría quedaría en el contenedor interno de `runInCommunity`; el interceptor encontraría el externo sin marca y escribiría una segunda fila (contra D45 y R3-m-2). Además, `container.platform` es `undefined` en el anidado.
- **Corrección:** que `runInCommunity` guarde una referencia al contenedor padre (o comparta el objeto de marca) y copie `platform`; que `recordPlatformAction` marque el contenedor de la petición; prueba junto con `recordPlatformAction`.

### m-7. El filtro registra la pila completa de errores desconocidos

- **Ubicación:** `access-exception.filter.ts:94-98` (`this.logger.error(exception.stack ...)`).
- **Escenario:** con la capa de datos, un `PrismaClientValidationError` incluye la invocación con sus valores (RUT, montos), que quedarían en Cloud Logging y Sentry (regla 7).
- **Corrección:** registrar solo la clase, el código del error (`P2002` y similares) y la ruta-plantilla; enviar la pila a Sentry con limpieza (`beforeSend`) definida antes de la rebanada 1.

## Evaluación de las desviaciones reportadas por el desarrollador

| # | Desviación | Evaluación de seguridad |
| --- | --- | --- |
| 1 | Puerto `CommunityDirectory.exists` | Aceptable y necesario para el "inexistente: 404" de 3b. Solo se consulta después de 3a; el valor por defecto falla cerrado |
| 2 | Tres capas internas de NestJS en la lista cerrada | Aceptable: se identifican por posición, aridad y anonimato; los *hooks* activos hacen fallar la comparación. El hueco es `router.params` (m-4) |
| 3 | Prefijos con al menos un segmento extra | Aceptable; más restrictivo que el ADR |
| 4 | Puertos que niegan por defecto; 500 en todo `/platform/...` | Correcto: falla cerrado, en línea con ADR 0006, decisión 8 |
| 5 | `TRUST_PROXY_HOPS=0` solo sin `K_SERVICE` | Correcto; el riesgo restante es de configuración (m-5) |
| 6 | Formularios solo bajo `/gateway/` con `extended: false`; 413 sin verificador responde 404 | Aceptable |
| 7 | 400 por parámetro mal codificado | Ver m-2 |
| 8 | Cuerpo del 500 de NestJS | Ver m-1 |
| 9 | Pruebas de auditoría escritas después del servicio | Aceptable con la validación por mutaciones; la excepción a TDD debe quedar anotada en la revisión cruzada |
| 10 | `express@5.3.0`, `@types/express@5.0.6`, `eslint@10.14.0` | Sin objeción: versiones fijas, una sola copia de `express` |

## Puntos verificados sin hallazgo

- **Denegación por defecto:** un método sin política o con dos responde 404 sin ejecutarse (`access.guard.ts:97-104`); un contexto no HTTP también; un decorador sobre una clase lanza error al cargar; la clave de metadatos no se exporta.
- **Sesión:** solo se lee de `Authorization: Bearer`, nunca de *cookies* ni de la consulta; `auth-entry` y `public-technical` no leen `Authorization`.
- **Comunidad:** uuid canónico validado antes de consultar; una sola lectura de membresía por (persona, comunidad); orden 3a, 3b y 3c; `first_access_at` solo si pasa todo.
- **`AsyncLocalStorage`:** contenedor nuevo por petición después de los analizadores; sin `enterWith` (prohibido por lint); llenar dos veces lanza error; la prueba de *keep-alive* y la de concurrencia cubren la fuga entre peticiones.
- **IP truncada:** `/24` y `/48`, con IPv4 mapeado normalizado; la fila `anonymous` no guarda encabezados, token, cuerpo ni parámetros.
- **Eventos de seguridad:** sin datos personales; `programmingError` registra solo la ruta-plantilla y el nombre del *handler*.
- **Dobles de prueba fuera del build:** `test-support` excluido en `tsconfig.build.json:9`; ningún archivo que no sea de prueba lo importa; el lint lo prohíbe, con prueba en `lint-rules.test.ts` (`exclude` no impide compilar un archivo importado, así que la barrera real es esa regla).
- **Secretos:** los tokens de `fixtures.ts` son textos de prueba evidentes; `.env.example` sin valores sensibles; CI corre Gitleaks.
- **Barrido de aislamiento:** un parámetro sin identificador de prueba se registra como diferencia, no se salta.

## Preguntas para el líder del proyecto

1. **`CODEOWNERS` (M-1):** ¿entra en este mismo PR o en uno previo del coordinador? Recomendación: no fusionar la rama sin él.
2. **Cuerpo del 500 (m-1):** ¿se fija un 500 neutro `{"code":"INTERNAL_ERROR"}` y se restringe el cuerpo de los demás errores a la forma del contrato de ADR 0003? Toca el contrato de errores de ADR 0003 y ADR 0009.
3. **Ingreso con dos saltos (m-5):** ¿se fija como condición de operaciones que el servicio `api` con `TRUST_PROXY_HOPS=2` tenga ingreso `internal-and-cloud-load-balancing`, sin URL `run.app` pública? Debe resolverse antes del módulo de ingreso.
4. **Encabezados de respuesta:** ¿se agregan `Cache-Control: no-store` y `X-Content-Type-Options: nosniff` en `createApp` antes del primer endpoint con datos personales (rebanada 1)? El ADR no lo trata.
5. **Desviación 7 (m-2):** ¿se acepta que un parámetro mal codificado responda 404 neutro, como una ruta inexistente, en vez de 400?
