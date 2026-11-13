# ADR 0010 · Feature flags por ambiente

- **Estado:** Aceptado (2026-11-12) por el líder del proyecto, después de dos pasadas de revisión crítica. Propuesto el mismo día. Responde P-CM-20 de `docs/specs/comunidades-y-membresias.md` (rev. 5) y el punto 24 de sus "Contradicciones y vacíos". Las reglas de producto ya están decididas por el líder (D51, D56 y D69, 2026-11-11; D76, 2026-11-12); este ADR fija solo lo que esas decisiones dejaron al arquitecto. Revisión crítica `docs/revisiones/2026-11-12-adr-0010.md` (primera pasada, "Aprobado con cambios"): cambios aplicados el 2026-11-12 (M-1 a M-7 y m-1 a m-10), con las decisiones del líder D77 a D80, D92 y D96 a D101 del 2026-11-12 (ver "Decisiones del líder"). Segunda pasada de la misma revisión ("Aprobado con cambios"): cambios aplicados el 2026-11-12 (R2-M-1 y R2-m-1 a R2-m-9), con las decisiones del líder D103 y D104 del 2026-11-12.
- **Fecha:** 2026-11-12
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Origen:** spec de comunidades y membresías, regla CM-H1 (mecanismo de los flags), CM-E6 (término y venta detrás de un flag), CM-A5 (alerta de primer ingreso detrás de un flag), supuesto S-CM-31 y pregunta P-CM-20.
- **Relacionados:** ADR 0003 (contrato y orden de evaluación), ADR 0004 (libro de movimientos, donde vivirá el traspaso), ADR 0008 (trabajo `membership.admin_first_access_alert` y barrido de vigías), ADR 0009 (arranque que falla cerrado, D38; propietario de código, D36 y D40), `docs/arquitectura.md` §6

## Contexto

`CLAUDE.md` pide trunk-based development con ramas cortas y feature flags, pero ningún documento decía dónde viven los flags, quién los enciende ni cómo se prueba su valor en producción: `docs/arquitectura.md` §7 lo dejaba en "Cuando haga falta". La rebanada 1 trae los dos primeros:

- **`occupancy.end_and_transfer`** (D51, CM-E6): término de arriendo y venta se implementan en la rebanada 1, pero sin el traspaso de deuda de GC F-9 y F-13, que llega con la rebanada del libro de movimientos. Si este flag se enciende antes, un término o una venta dejarían la deuda en un ámbito sin responsable vigente. Toca dinero (reglas 2, 5 y 6 de `CLAUDE.md`).
- **`platform.admin_first_access_alert`** (CM-A5): como nadie puede ingresar hasta la rebanada "Ingreso e invitaciones" (D37), la alerta de GC S-72 se dispararía para todo administrador. Apagado, no se encola ningún trabajo.

El líder ya decidió (D56, D69): flags por ambiente, con su valor versionado **solo** en el repositorio; no editables por API ni por comunidad; encenderlos es un cambio de configuración aprobado por el líder; sin valor, apagado; y dos barreras para `occupancy.end_and_transfer`: una prueba del CI y una constante del código. Dejó al arquitecto cinco puntos (P-CM-20): (1) en qué archivo vive la configuración y cómo se llaman los ambientes; (2) qué pasa con un valor que llega fuera del repositorio; (3) la variante de la barrera en el código; (4) cómo sabe la web si mostrar término y venta; y (5) el procedimiento de encendido de la alerta.

D56 dijo "sin ADR propio por ahora … y a un ADR si crece". Con D69 el mecanismo creció: tiene dos barreras, una verificación al arrancar, un procedimiento de encendido que encola trabajos y varias alternativas descartadas que conviene dejar registradas. Por eso se propuso este ADR; `docs/arquitectura.md` §6 lleva solo el resumen.

**Estado actual de `apps/api`** (verificado contra el código el 2026-11-12; m-1 de la revisión):

- Solo existe el punto de entrada `src/main.ts`. `main.worker.ts` **no existe**: se crea con el servicio `worker` (ADR 0008, decisión 2).
- `main.ts` lee `PORT` con `parsePort` (`src/config/port.ts`) y llama a `createApiApp(process.env)` (`src/api-app.ts`). `PORT` **no** es obligatoria: ausente, vale 3000.
- `createApiApp` llama a `createApp` (`src/configure-app.ts`), después a `app.init()` y recién entonces a `assertRouteInventory` (ADR 0009, D38). `createApp` es la única fábrica de la aplicación; la usan `main.ts` y las pruebas, y la usará `main.worker.ts`.
- `TRUST_PROXY_HOPS` sí es obligatoria: `createApp` la valida con `parseTrustProxyHops` (`src/config/trust-proxy-hops.ts`) antes de crear la aplicación de NestJS, y con `K_SERVICE` definido no admite 0.
- Una validación de arranque que falla lanza un `RangeError` y el proceso termina sin escuchar. No registra ningún evento estructurado, y el puerto `ACCESS_EVENT_LOG` solo existe después de crear la aplicación.
- No existe todavía `docs/operaciones/`, un identificador de ambiente, el pipeline de despliegue ni el módulo `jobs`.

## Decisiones del líder (2026-11-12)

Cierran las cuatro preguntas que traía este ADR, las siete de la primera pasada de la revisión crítica y las dos de la segunda.

- **D77:** aprobado que la API y el `worker` **no arranquen** ante un valor de flag llegado fuera del repositorio y ante un flag encendido sin su requisito (decisiones 3 y 4).
- **D78:** aprobados los ambientes `local`, `staging` y `production` y la variable `COMVIVE_ENV`, como **Supuesto (a validar)** ADR-0010-S1 hasta que exista `docs/operaciones/` (decisión 2).
- **D79:** aprobado que el archivo de flags quede bajo propietario de código (decisión 6).
- **D80:** `billing.interest` (intereses por mora) es configuración de cada comunidad, no un feature flag de este ADR; lo fija la spec de gasto común. No entra en la lista cerrada de la decisión 1. `docs/arquitectura.md` §4 y §8 (pregunta 5) quedan alineados.
- **D92 (H-CM-12; M-7 y pregunta 6 de la revisión):** la rebanada 1 implementa y prueba el encolado de la alerta de primer ingreso en la transacción, detrás del flag `platform.admin_first_access_alert`, con los dos estados probados con el doble de configuración. El vigía, el manejador con el flag apagado y D76 quedan para la rebanada "Ingreso e invitaciones" (decisión 7).
- **D96 (M-1; pregunta 1):** el CI impide que la constante del traspaso pase a verdadero si no existen las pruebas de oro del traspaso de GC F-9 y F-13 (decisión 4).
- **D97 (M-3; pregunta 2):** el arranque verifica el ambiente declarado en `COMVIVE_ENV` contra el proyecto de Google Cloud; si no coinciden, no arranca. Requisito con plazo "antes del primer encendido de cualquier flag en `staging`"; no se implementa en la rebanada 1 (decisión 2).
- **D98 (M-4; pregunta 3):** si el despliegue enciende un flag que la revisión en servicio tenía apagado y `enabledOn` no es la fecha de hoy en hora de Chile, el despliegue falla. La fecha se corrige con un cambio al archivo (decisión 6).
- **D99 (M-5; pregunta 4):** al apagar y volver a encender la alerta, el plazo de 7 días se reinicia desde el nuevo encendido para las membresías que aún no recibieron alerta (decisión 7).
- **D100 (m-3; pregunta 5):** las barreras valen en todos los ambientes: término y venta tampoco se encienden en `local` ni en `staging` hasta la rebanada del libro. En la rebanada 1 el líder valida en el ambiente de pruebas solo el 422; el flujo completo se valida en la rebanada del libro.
- **D101 (m-6; pregunta 7):** se acepta devolver el tráfico a la revisión anterior de Cloud Run como vía de emergencia para apagar un flag, con aprobación del líder y un PR de regularización después (decisión 6).
- **D103 (R2-m-7; pregunta 1 de la segunda pasada):** la vuelta a la revisión anterior de Cloud Run (D101) sirve **solo para apagar**: nunca se usa hacia una revisión que tenga encendido un flag que la revisión en servicio tiene apagado. Reencender siempre es un PR nuevo con su aprobación. Quien pide la vuelta lo confirma junto con la compatibilidad del esquema (decisión 6).
- **D104 (R2-m-1; pregunta 2 de la segunda pasada):** la lista de pruebas de oro de D96 incluye, por cada acción (término y venta), al menos una prueba de integración por la ruta HTTP que verifica los movimientos en el libro, no solo pruebas de la función del traspaso aislada (decisión 4).

## Decisión

1. **La configuración de los flags es un archivo de código del repositorio, compilado dentro de la imagen.**
   - Archivo: `apps/api/src/config/feature-flags.config.ts`. Contiene la lista cerrada de nombres de flag y, por cada ambiente, el valor de cada uno. La API y el `worker` usan la misma imagen (ADR 0008, decisión 2), así que leen el mismo archivo.
   - **No hay ninguna otra fuente.** El código no lee el valor de un flag desde variables de entorno, la base de datos, Secret Manager, un servicio externo ni una petición. La única entrada externa es **qué ambiente es** (decisión 2).
   - Esquema (prototipo; los nombres finales los fija el desarrollador):

     ```ts
     export const FEATURE_FLAGS = [
       'occupancy.end_and_transfer',
       'platform.admin_first_access_alert',
     ] as const;
     export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

     export const DEPLOY_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
     export type DeployEnvironment = (typeof DEPLOY_ENVIRONMENTS)[number];

     /** `enabledOn`: día (hora de Chile) del despliegue que encendió el flag, `AAAA-MM-DD`. */
     type FlagSetting = { enabled: false } | { enabled: true; enabledOn: string };

     export const FEATURE_FLAG_CONFIG: Record<DeployEnvironment, Partial<Record<FeatureFlag, FlagSetting>>> = {
       local: {},
       staging: {},
       production: {},
     };

     /** Proyecto de Google Cloud esperado por ambiente desplegado (decisión 2, D97). */
     export const DEPLOY_ENVIRONMENT_PROJECTS: Partial<Record<Exclude<DeployEnvironment, 'local'>, string>> = {};
     ```

   - Un flag que no aparece en un ambiente está **apagado** (CM-H1). Un nombre fuera de `FEATURE_FLAGS` no compila. Hoy los tres ambientes van vacíos: los dos flags apagados en todos. `billing.interest` no es un flag de esta lista (D80).
   - **Lectura:** el resto del código solo conoce el puerto `FeatureFlags`, con `isEnabled(flag)` y `enabledOn(flag)` (la fecha, o nada si el flag está apagado), que el módulo de configuración resuelve una vez al arrancar. Una regla de lint prohíbe importar `feature-flags.config.ts` fuera de `src/config/**`, y ese archivo no lee `process.env` (regla de lint; prueba 8).
   - **`isEnabled` nunca depende del reloj (M-4).** Su valor es el `enabled` del archivo para el ambiente y no cambia mientras el proceso vive. Ningún flag se enciende ni se apaga solo al llegar una fecha: solo con un despliegue.
   - **`enabledOn` es un dato, no una condición.** Lo usa únicamente la decisión 7 (plazo y texto de la alerta de primer ingreso). Sigue siendo **obligatorio para todo flag encendido**: para los demás flags, hoy `occupancy.end_and_transfer`, es solo el registro versionado del día del encendido y no tiene ningún efecto en ejecución. Se mantiene obligatorio para tener un solo tipo y una sola validación, sin una lista aparte de "flags que usan la fecha".
   - **Formato de `enabledOn`:** exactamente `AAAA-MM-DD` (cuatro, dos y dos dígitos) y una fecha de calendario que existe; `2026-13-45`, `2026-02-30` o `1-2-3` son inválidas. El tipo es `string` porque TypeScript no puede garantizarlo: lo valida `assertFeatureFlags` (decisión 4).
   - **Un solo proveedor del puerto (M-2).** El token `FeatureFlags` lo provee únicamente el módulo de `src/config/**`, que construye la instancia a partir del archivo y del ambiente ya validado, y la marca como propia en un registro privado del módulo (el mismo recurso que `createApp` usa para `wasCreatedByCreateApp`). Dos reglas de lint lo sostienen: el token solo se provee en `src/config/**`, y los dobles de `test-support` no se importan desde archivos que no sean de prueba (esta segunda ya existe en `eslint.config.mjs`, ADR 0009, menor 10). La verificación al arrancar está en la decisión 4.
   - **Sin valor por comunidad ni por usuario** (D56). Si un piloto necesita encender algo para una sola comunidad, es otro mecanismo y exige un ADR nuevo.

2. **Ambientes: tres identificadores, declarados con `COMVIVE_ENV` y verificados contra el proyecto de Google Cloud (D78, D97).**
   - `local` (equipo de desarrollo y CI), `staging` (el ambiente "Pruebas" de `docs/arquitectura.md` §6) y `production` ("Producción"). Para la prueba del CI, "producción" es la entrada `production` del archivo (**Supuesto (a validar)** ADR-0010-S1, aprobado así por D78: nombres y cantidad de ambientes, hasta que exista `docs/operaciones/`).
   - La variable de entorno `COMVIVE_ENV` es **obligatoria**, como `TRUST_PROXY_HOPS` (y a diferencia de `PORT`, que tiene valor por defecto): ausente, vacía o con un valor fuera de la lista, el proceso no arranca. En Cloud Run (`K_SERVICE` definido; ADR-0010-S4) no puede ser `local`.
   - Hacerla obligatoria exige, en el mismo cambio que la implementa: agregarla a `apps/api/.env.example` (`COMVIVE_ENV=local`), al CI y a las pruebas que llaman a `createApp(…, env)` o a `createApiApp(env)` con un entorno propio.
   - `COMVIVE_ENV` elige una entrada del archivo, no un valor: declarar el ambiente equivocado solo puede traer la configuración versionada de otro ambiente, nunca una que no esté en el repositorio. Aun así es una variable editable desde la consola o con `gcloud`, y cuando `staging` tenga un flag encendido que `production` no, declararla mal encendería ese flag en producción sin PR ni aprobación (M-3). Por eso:
     - **Las barreras de la decisión 4 valen para todos los ambientes**, no solo para `production` (D100).
     - **Verificación contra el proyecto (D97):** `DEPLOY_ENVIRONMENT_PROJECTS` versiona, por ambiente desplegado, el id del proyecto de Google Cloud esperado. Al arrancar en Cloud Run, antes de crear la aplicación, el proceso lee el id del proyecto en el servidor de metadatos y lo compara con el esperado para el ambiente declarado; si no coinciden, si el ambiente no tiene id en el archivo o si el servidor de metadatos no responde, **no arranca** y registra `feature_flags.invalid`. La lectura va detrás de una función inyectada, para probarla sin red.
     - **Fuente del id del proyecto (R2-m-6):** la lectura usa la dirección fija del servidor de metadatos (`http://169.254.169.254/computeMetadata/v1/project/project-id`, con la cabecera `Metadata-Flavor: Google`), con el cliente HTTP de Node y sin una biblioteca que lea `GCE_METADATA_HOST` o `GCE_METADATA_IP`. Además, si alguna de esas dos variables está definida, el proceso no arranca: son editables desde la consola, la misma vía que D69 y D97 cierran. **Nunca** se usa una variable de entorno (`GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT` u otra) como fuente del proyecto.
     - **Plazo:** es requisito "antes del primer encendido de cualquier flag en `staging`". **En la rebanada 1 no se implementa**, porque todo está apagado en todos los ambientes. Los ids se fijan cuando exista `docs/operaciones/` (**Supuesto (a validar)** ADR-0010-S7). Para que el plazo se cumpla solo y no dependa de una regla de proceso (R2-m-4), `assertFeatureFlags` (decisión 4, regla (e)) falla, en el CI y al arrancar, mientras la comparación no esté implementada, si `DEPLOY_ENVIRONMENT_PROJECTS` tiene **cualquier** id ("comparación no implementada") o si `staging` o `production` tienen algún flag encendido.
     - **Cambio que implementa la comparación (R2-m-5):** en un mismo cambio agrega la comparación con el servidor de metadatos y su prueba (prueba 6), agrega los ids de **todos** los ambientes desplegados (`staging` y `production`) y reemplaza la regla anterior por "todo ambiente desplegado tiene su id". Desde entonces el id es obligatorio siempre, con o sin flags encendidos, y un ambiente desplegado sin id no arranca. Así, ningún despliegue posterior de un ambiente queda sin poder arrancar porque el cambio solo agregó el id de otro.

3. **Un valor que llega fuera del repositorio hace fallar el arranque (P-CM-20 (2); D77).**
   - Como no existe una vía de lectura fuera del archivo (decisión 1), un valor externo nunca puede encender un flag. Para que el intento además **se note**, el prefijo `FEATURE_FLAG_` queda reservado: si al arrancar existe cualquier variable de entorno cuyo nombre empieza con `FEATURE_FLAG_` (sin distinguir mayúsculas), la API y el `worker` **no arrancan**, en cualquier ambiente.
   - **Registro del motivo:** `feature_flags.invalid` es un evento **nuevo**; el patrón actual de validación al arrancar solo lanza un error. Como la verificación corre antes de crear la aplicación, no puede usar `ACCESS_EVENT_LOG`: `assertFeatureFlags` recibe un registrador inyectado (en la aplicación real, el `Logger` de NestJS con una línea JSON, como ya hace `configure-app.ts` con `requestAborted`). El evento lleva el nombre de la variable o del flag, el ambiente y la regla incumplida, sin valores ni datos personales. Después lanza el error y el proceso termina sin escuchar.
   - Cloud Run no envía tráfico a una revisión que no arranca y la revisión anterior sigue atendiendo: es el mismo comportamiento que ya se aceptó para el inventario de rutas (ADR 0009, D38; ADR-0010-S2).
   - **Por qué fallar y no "considerarlo apagado":** tratarlo como apagado es silencioso. Quien editó la variable desde la consola o con `gcloud` creería que encendió algo y nadie más se enteraría de que alguien intentó cambiar producción fuera del repositorio. Una revisión que no arranca deja el intento a la vista en el despliegue, sin afectar al servicio en curso.

4. **Barreras para un flag con requisito de código (D69, D77, D96, D100): prueba del CI y arranque que falla (P-CM-20 (3)).**
   - **Tabla de requisitos, exhaustiva (R2-M-1):** `FLAG_PREREQUISITES`, en `apps/api/src/config/feature-flag-prerequisites.ts`, declara para **cada** flag de la lista cerrada su requisito o `'none'` de forma explícita, y con qué pruebas de oro se demuestra el requisito. Su tipo es `Record<FeatureFlag, Prerequisite | 'none'>`: un flag nuevo sin entrada no compila, y "sin fila" deja de existir en la tabla real. Hoy: `occupancy.end_and_transfer` exige el traspaso de deuda de GC F-9 y F-13; `platform.admin_first_access_alert` lleva `'none'`. Prototipo (los nombres finales los fija el desarrollador):

     ```ts
     type GoldTest = {
       id: string; // identificador fijado por QA
       file: string; // ruta desde la raíz del repositorio; debe terminar en `.gold.test.ts`
       level: 'unit' | 'http'; // 'http': integración por la ruta HTTP que verifica los movimientos en el libro (D104)
       action?: 'end_occupancy' | 'sale'; // obligatorio si level = 'http'
     };
     type Prerequisite = {
       key: 'ledger.ownership_transfer'; // lista cerrada de requisitos; hoy uno
       met: boolean;
       goldTests: readonly GoldTest[];
       requiredHttpActions: readonly ('end_occupancy' | 'sale')[];
     };

     export const FLAG_PREREQUISITES: Record<FeatureFlag, Prerequisite | 'none'> = {
       'occupancy.end_and_transfer': {
         key: 'ledger.ownership_transfer',
         met: false, // GC F-9 y F-13: lo cambia solo la rebanada del libro (OWNERSHIP_TRANSFER_IMPLEMENTED)
         goldTests: [],
         requiredHttpActions: ['end_occupancy', 'sale'],
       },
       'platform.admin_first_access_alert': 'none',
     };
     ```

   - **La fila real del traspaso está fijada por una prueba (R2-M-1).** Una prueba del CI sobre la tabla **real**, `apps/api/src/config/feature-flag-prerequisites.pin.test.ts`, parte de `pnpm run check`, verifica que la entrada de `occupancy.end_and_transfer` es distinta de `'none'`, que su `key` es `ledger.ownership_transfer` (el traspaso de GC F-9 y F-13), que `requiredHttpActions` contiene `end_occupancy` y `sale`, y que `met` es exactamente el valor de la constante del traspaso: mientras el módulo del libro no exista, `false`; desde la rebanada del libro, la constante `OWNERSHIP_TRANSFER_IMPLEMENTED` importada de ese módulo. Quitar la fila no compila; cambiarla a `'none'`, a otro requisito o a `true` literal rompe esa prueba, que solo se cambia editándola. La prueba vive en `/apps/api/src/config/`, bajo propietario de código (decisión 6).
   - **La constante del traspaso no vive en `src/config/` (M-1, D96).** La exporta el módulo que implementará el traspaso de GC F-9 y F-13 (el del libro de movimientos), como `OWNERSHIP_TRANSFER_IMPLEMENTED`, y la tabla la importa. Mientras ese módulo no exista, la fila lleva `false` literal con un comentario que nombra GC F-9 y F-13. Solo la rebanada del libro la cambia a `true`, en el mismo cambio que agrega el traspaso con TDD y sus pruebas de oro (D51, CM-E6, CM-H1); ese cambio agrega también el archivo de la constante a `.github/CODEOWNERS` y ajusta la prueba de fijación para comparar `met` con la constante importada.
   - **La constante queda atada a las pruebas de oro (D96, D104).** La fila del requisito lleva la lista de pruebas de oro del traspaso (`goldTests`), cuyos identificadores fija QA (hoy están como casos heredados H-LIB en `docs/qa/casos/comunidades-y-membresias.md`; **Supuesto (a validar)** ADR-0010-S9). Una prueba del CI, parte de `pnpm run check`, falla si el requisito está en verdadero y:
     - la lista está vacía;
     - algún archivo de la lista no existe o no termina en `.gold.test.ts`;
     - algún identificador no está en una **prueba activa** de su archivo (R2-m-1). Prueba activa: una llamada a `it` o `test` sin modificador (`skip`, `todo`, `skipIf`, `runIf` ni `fails`), cuyo nombre es un texto literal que empieza con el identificador, que no está dentro de un `describe` con alguno de esos modificadores y cuyo cuerpo tiene al menos una llamada a `expect`. Se verifica sobre el árbol sintáctico del archivo con el compilador de TypeScript, no con una búsqueda de texto: un comentario o un texto suelto no cuentan;
     - para alguna acción de `requiredHttpActions` no hay al menos una prueba con `level: 'http'` y esa `action` (D104): una prueba de integración que llama a la ruta HTTP de término o de venta, sobre una aplicación creada con `createApp`, y verifica los movimientos del traspaso en el libro. Que la prueba de verdad haga eso no lo puede verificar el CI: lo revisan QA y el líder con la rebanada del libro.

     Así, cambiar la constante sin el traspaso rompe el CI, y ya no basta un cambio de una línea para saltarse las dos barreras.
   - **Las pruebas de oro del traspaso corren sin caché (R2-m-1).** Los archivos `*.gold.test.ts` de `apps/api` entran al job `money-gold` de `.github/workflows/ci.yml`, que en cada cambio a `main` los corre sin la caché de Turbo, como ya hace con `@comvive/shared`. En la rebanada 1 se agrega ese paso (hoy sin archivos, sin fallar por eso) y la verificación de prueba activa, aunque la lista esté vacía; las pruebas de oro mismas llegan con la rebanada del libro.
   - **`assertFeatureFlags`: una sola función pura, en el CI y al arrancar.** Recibe como parámetros el archivo de configuración, la tabla de requisitos (m-4), los ids de proyecto, el valor de `COMVIVE_ENV`, las variables de entorno, la fecha de hoy en hora de Chile y el registrador; nada lo toma de un módulo global, así cada rama se puede probar. Verifica:
     - (a) la decisión 2: `COMVIVE_ENV` válido, y no `local` con `K_SERVICE`;
     - (b) la decisión 3: ninguna variable `FEATURE_FLAG_*`;
     - (c) ningún flag `enabled: true` cuyo requisito esté en falso (R2-M-1). Solo un flag cuya entrada en la tabla es `'none'` no tiene requisito. Un flag sin entrada en la tabla recibida **falla** (falla cerrado): en la tabla real no puede ocurrir porque no compila, pero la función también recibe tablas de entrada;
     - (d) todo flag `enabled: true` trae `enabledOn` con el formato de la decisión 1 y **no posterior a hoy** en hora de Chile (M-4): un `enabledOn` futuro no se puede fusionar ni desplegar;
     - (e) ids de proyecto (decisión 2, D97; R2-m-4 y R2-m-5): mientras la comparación con el servidor de metadatos no esté implementada, `DEPLOY_ENVIRONMENT_PROJECTS` está vacío ("comparación no implementada") y ni `staging` ni `production` tienen flags encendidos. El cambio que implementa la comparación reemplaza esta regla por "`staging` y `production` tienen siempre su id";
     - (f) verificación del despliegue (decisión 6, D98; R2-m-4): mientras la verificación de `enabledOn` no exista en el pipeline, ni `staging` ni `production` tienen flags encendidos ("verificación de despliegue no implementada"). El cambio que agrega esa verificación al pipeline quita esta regla.

     Las reglas (c), (d), (e) y (f) se aplican a **todos** los ambientes del archivo, también al arrancar: el resultado no depende del ambiente declarado (D100). Las reglas (e) y (f) son temporales y cada una la quita, en el mismo cambio, la pieza que la vuelve innecesaria; así, los plazos de D97 y D98 se cumplen solos.
   - **Fecha de hoy:** al arrancar sale del reloj del sistema, convertida a día de Chile con `ChileCalendar` (ADR 0008, decisión 10), leída una sola vez en el arranque y pasada como parámetro; las pruebas pasan la fecha que quieran. En el CI la regla (d) usa la fecha real: una configuración válida hoy lo sigue siendo mañana, así que el resultado nunca pasa de verde a rojo con el tiempo.
   - **Primera barrera, en el CI:** una prueba de Vitest corre (c) a (f) sobre el archivo real y la tabla real, junto con la prueba de fijación de la fila del traspaso y la de D96. Forman parte de `pnpm run check`, obligatoria para fusionar a `main`: un cambio que encienda `occupancy.end_and_transfer` con el requisito en falso no se puede fusionar (CA-CM-26); uno que quite su requisito o lo cambie a `'none'`, tampoco (R2-M-1); y uno que ponga el requisito en verdadero sin las pruebas de oro activas, tampoco (D96, D104).
   - **Segunda barrera, en el código:** `createApp` (`src/configure-app.ts`) llama a `assertFeatureFlags` al comienzo, junto a `parseTrustProxyHops` y **antes** de `NestFactory.create` y de cualquier `onModuleInit`. No va junto a `assertRouteInventory`, que corre después de `app.init()`. Como `createApp` es la única fábrica, la heredan la API, las pruebas y el `worker` cuando exista `main.worker.ts`. Si la imagen llega con el flag encendido y el requisito en falso (por ejemplo, porque se fusionó saltándose el CI), el proceso **no arranca** y registra el motivo. **Alcance de esta barrera (R2-m-2):** el arranque cubre "flag encendido con el requisito en falso" y las reglas (a), (b), (d), (e) y (f); **no** cubre "requisito en verdadero sin pruebas de oro" ni la fijación de la fila del traspaso, que solo verifica el CI, porque los archivos de prueba no van en la imagen. Contra una imagen fusionada saltándose el CI, la defensa es que el pipeline despliega solo commits de `main` con la verificación `check` en verde ("Riesgos", "Imagen construida fuera de `main`").
   - **Verificación del proveedor (M-2):** después de `app.init()`, junto a `assertRouteInventory` en `createApiApp` (y en su equivalente del `worker`), `assertFeatureFlagsProvider(app)` recorre los proveedores del contenedor con `DiscoveryService`, como hace el inventario de rutas, y falla si hay más de un proveedor del token `FeatureFlags` en cualquier módulo, si la instancia no es la que construyó `src/config/`, o si `isEnabled` o `enabledOn` de algún flag difieren del archivo para el ambiente declarado. Se recorre el contenedor, y no solo `app.get`, porque un módulo puede declarar un proveedor local del mismo token que `app.get` no devuelve.
     - **Instancia inmutable (R2-m-3):** la instancia que construye `src/config/` guarda los valores en campos privados (`#`) y se congela con `Object.freeze` antes de entregarse al contenedor; reasignar `isEnabled` o `enabledOn` lanza error en modo estricto. Así, lo que la verificación comparó es lo que el proceso usa mientras vive.
     - **Momento (R2-m-3):** corre después de `app.init()`, cuando los `onModuleInit` y `onApplicationBootstrap` ya se ejecutaron. En la API no importa, porque aún no escucha. En el `worker`, `main.worker.ts` arranca el ciclo que toma trabajos (y la recepción de las peticiones de Scheduler) **solo después** de que `assertFeatureFlagsProvider` pasa; ningún módulo del `worker` toma trabajos en `onModuleInit` ni en `onApplicationBootstrap` (prueba 9).
   - **Variante elegida: negarse a arrancar** (D77), no "tratar el flag como apagado". Es la misma razón de la decisión 3 (un error de configuración en algo que mueve dinero debe ser ruidoso), reutiliza el patrón de ADR 0009 y deja un solo comportamiento que probar. En CA-CM-26 corresponde la rama "la API no arranca y el arranque registra el motivo".
   - **Resultado para las rutas:** con el flag apagado, que es el único estado posible en un ambiente desplegado mientras el requisito esté en falso, el término de arriendo y la venta responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` como primera regla de negocio (CM-E6, S-CM-30). El estado "encendido con el requisito en falso" no existe en una aplicación que atiende.
   - **Pruebas automáticas con el doble:** las pruebas reemplazan el puerto `FeatureFlags` con un doble (`overrideProvider`, en `test-support`) que expone `isEnabled` y `enabledOn` (M-7), sobre una aplicación creada con `createApp` desde un módulo de pruebas. `createApp` valida igual el archivo real; lo que esas pruebas no ejecutan es `assertFeatureFlagsProvider`, que vive en `createApiApp`. Así ejercitan los dos estados del flag con el requisito en falso (CM-H1). Las barreras se prueban aparte, sobre la función pura con configuraciones de entrada.

5. **Ninguna ruta lee ni cambia un flag; la web usa un campo de capacidades (P-CM-20 (4)).**
   - No existe ningún endpoint de flags, ni de comunidad ni de plataforma, y ninguna respuesta lleva el nombre ni el valor de un flag (CM-H1, CA-CM-26).
   - **Rebanada 1 (solo API):** no se agrega nada al contrato. La respuesta 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` es la fuente de verdad.
   - **Rebanada web de este módulo (Supuesto (a validar) ADR-0010-S3):** `GET /communities/{communityId}` devuelve un objeto `capabilities` con booleanos por **acción de producto**, no por flag. Vale verdadero solo si la acción está disponible **y** la persona tiene el permiso (`occupancy.write`); para quien no tiene el permiso, el campo no viaja. La web oculta las acciones de término y venta cuando es falso, y de todos modos trata el 422 como respuesta válida, porque el valor puede cambiar entre la lectura y la acción. El campo entra al contrato OpenAPI con la tarjeta de la web, no antes.
   - **Nombre del campo (m-10):** se decide con la tarjeta de la web. No debe repetir el nombre del flag en otra grafía: se propone uno por acción (por ejemplo `canEndOccupancy` y `canTransferOwnership`). TC-CM-CA26-07, que busca los nombres de los flags en las respuestas, se ajusta entonces.

6. **Encender o apagar un flag es un cambio al archivo, aprobado por el líder (regla 10 de `CLAUDE.md`).**
   - **Procedimiento:**
     1. Un PR **por ambiente** que cambia la entrada de ese ambiente en `feature-flags.config.ts` (`enabled: true` con su `enabledOn`), con la referencia a la tarjeta que lo justifica. El PR de `production` se abre solo después de la validación en `staging`: un solo PR con las dos entradas encendería producción con la misma imagen que se está validando (m-6).
     2. CI en verde, incluida la prueba de la decisión 4.
     3. Aprobación del líder del proyecto.
     4. Despliegue de ese ambiente por el flujo normal; el de `production`, con su aprobación explícita.

     El historial del repositorio es el registro de quién encendió qué y cuándo.
   - **`enabledOn` es el día del despliegue que enciende (D98).** El pipeline de despliegue de cada ambiente compara la entrada de ese ambiente en el archivo de la revisión en servicio con la del commit que va a desplegar. Si el despliegue enciende un flag que la revisión en servicio tenía apagado (o que no existía, o no hay revisión en servicio) y su `enabledOn` no es la fecha de hoy en hora de Chile, **el despliegue falla**. La fecha se corrige con un cambio al archivo, por el mismo procedimiento. Junto con la regla (d) de la decisión 4, el PR de encendido se fusiona y se despliega el mismo día de su `enabledOn`.
   - **`enabledOn` no se edita mientras el flag siga encendido (M-4).** Desde que un ambiente tiene el flag desplegado encendido, su fecha no cambia: los `run_at` ya encolados se calcularon con ella y la alerta la informa (D76). La misma comparación del pipeline falla si un flag encendido en la revisión en servicio llega encendido con otro `enabledOn`. Una fecha distinta solo entra apagando y volviendo a encender, que es un encendido nuevo (decisión 7, D99).
   - **Cómo se implementa la comparación:** una función pura en el repositorio (configuración anterior, configuración nueva, ambiente y fecha de hoy), con sus pruebas de Vitest, que el pipeline invoca con el commit de la revisión en servicio (**Supuesto (a validar)** ADR-0010-S8). El pipeline de despliegue no existe todavía: es requisito "antes del primer encendido de cualquier flag en un ambiente desplegado" y **no se implementa en la rebanada 1**. Mientras no exista, la regla (f) de la decisión 4 impide encender cualquier flag en `staging` o `production`; el cambio que agrega la verificación al pipeline la quita (R2-m-4).
   - **Apagar** es el mismo camino (o revertir el PR): un PR y un despliegue.
   - **Vía de emergencia (D101):** si hay que apagar un flag antes de lo que tarda un PR y un despliegue, se devuelve el tráfico a la revisión anterior de Cloud Run, con aprobación del líder del proyecto. Es la única forma de cambiar el valor efectivo de un flag sin un PR previo y solo puede llevar a un valor que ya estuvo desplegado y aprobado. **Sirve solo para apagar (D103; R2-m-7):** nunca se usa hacia una revisión que tenga encendido un flag que la revisión en servicio tiene apagado, por ejemplo una revisión anterior a un apagado por PR. Después va un **PR de regularización** que deja el archivo como quedó el ambiente (el flag apagado). Volver a encender es siempre un encendido nuevo, con su PR, su `enabledOn` y su aprobación. La revisión anterior trae también el código anterior: quien pide la vuelta confirma antes, junto con la aprobación del líder, dos cosas: que la revisión de destino no enciende ningún flag que la revisión en servicio tiene apagado (comparando el archivo de flags de los dos commits) y que su código es compatible con el esquema de base de datos vigente. El detalle operativo va a `docs/operaciones/` cuando exista.
   - **Propietario de código (D79; m-5):** `.github/CODEOWNERS` agrega, con el mismo propietario y el mismo formato de las entradas actuales (ruta con barra inicial; directorio terminado en barra): `/apps/api/src/config/` completo (archivo de flags, tabla de requisitos, prueba de fijación de la fila del traspaso, ids de proyecto y validaciones), `/apps/api/src/main*.ts`, `/apps/api/src/api-app.ts` y `/apps/api/src/configure-app.ts`, que es donde se podría quitar la llamada a las barreras. `/.github/` ya está, y con él `ci.yml` y su job `money-gold`. La exigencia de revisión se activa cuando exista la cuenta separada de los agentes (ADR 0009, D36, D40 y D68). Lo aplica el coordinador con la implementación. Mientras la exigencia no esté activa, la defensa contra quitar la llamada es la prueba 3.

7. **Alerta de primer ingreso detrás de `platform.admin_first_access_alert` (CM-A5; P-CM-20 (5)): la rebanada 1 implementa el encolado en la transacción detrás del flag (D92); el vigía, el manejador con el flag apagado y D76 se implementan con la rebanada "Ingreso e invitaciones".**
   - **Fecha de encendido:** es el `enabledOn` de la entrada del flag en el ambiente, versionado en el repositorio, que por D98 es el día del despliegue que lo encendió. Nunca se toma del reloj del primer arranque (CM-A5).
   - **Fórmula única de `run_at`:** `startOfDay(máx(enabledOn, fecha del otorgamiento, valid_from) + 8 días)` en hora de Chile. Es una función pura, la misma para la transacción y para el vigía. Para una membresía otorgada desde el día del encendido da lo mismo que ADR 0008, fila 5 (el otorgamiento no es anterior a `enabledOn`); para una anterior, el plazo de 7 días cuenta desde el encendido (S-CM-27); si su `valid_from` es posterior al encendido, cuenta desde `valid_from` (GC S-72, rev. 10).

   **Rebanada 1 (D92; responde H-CM-12):**

   - **Flag apagado**, que es su valor en todos los ambientes durante la rebanada 1: la transacción del alta de comunidad y la de cada otorgamiento de `admin` **no** llaman a `enqueue` para `membership.admin_first_access_alert` (enmienda de ADR 0008, inventario, fila 5). No existe ningún trabajo de ese tipo.
   - **Flag encendido** (solo con el doble de configuración): esas mismas transacciones encolan el trabajo con la clave de ADR 0008 (`membership.admin_first_access_alert:<membershipId>`) y el `run_at` de la fórmula única, leyendo `enabledOn(flag)` del puerto. Si la transacción se deshace, el trabajo no existe.
   - **El doble de configuración expone `enabledOn`** (decisión 4). En un ambiente real, un otorgamiento con el flag encendido nunca es anterior a `enabledOn` (regla (d) y D98), así que en la transacción el resultado coincide con la fila 5; un doble con `enabledOn` posterior al otorgamiento es un estado que no se puede desplegar y solo sirve para probar la fórmula.
   - **TC-CM-CA1-07:** otorgamiento el 2026-11-12, sin `valid_from` futuro. Da `run_at` = 2026-11-20 00:00 en hora de Chile **solo si el `enabledOn` del doble es igual o anterior al 2026-11-12**; se propone fijarlo en `2026-11-12` de forma explícita en el caso. Con un `enabledOn` posterior (por ejemplo 2026-11-15), el resultado sería 2026-11-23 00:00.
   - **Qué no se construye en la rebanada 1:** el manejador del trabajo, el vigía, la plantilla de D76 y las verificaciones de D97 y D98 (sí se construyen las reglas temporales (e) y (f) de la decisión 4, que impiden encender flags en `staging` y `production` mientras esas verificaciones falten).

   **Rebanada "Ingreso e invitaciones":**

   - **Quién encola las membresías anteriores:** un vigía nuevo del barrido de ADR 0008 (decisión 9), `watchdog.admin_first_access_alert_missing`. Con el flag encendido recorre cada comunidad con su contexto y, por cada membresía `admin` no revocada, sin `first_access_at` y sin `first_access_alerted_at`, deja su trabajo según el estado de la fila de `JOB` con la clave de ADR 0008:

     | Fila de `JOB` de esa membresía | Qué hace el vigía |
     | --- | --- |
     | No existe | La inserta con el `run_at` de la fórmula |
     | `pending` | Actualiza `run_at` solo si la fórmula da un instante posterior |
     | `running` | Nada |
     | `done` | La devuelve a `pending` con `attempts = 0` y `run_at` **de la fórmula**, no `now` |
     | `dead` | Nada: la cubre `watchdog.jobs_dead` y la resuelve Operaciones (ADR 0008, decisión 7) |

   - Repetir el barrido cada 5 minutos no duplica trabajos ni adelanta plazos: con el mismo `enabledOn`, la fórmula da siempre el mismo instante. Una membresía que ya tuvo su alerta queda fuera por `first_access_alerted_at`. **Con el flag apagado, el vigía no hace nada.**
   - **Sin evento a Sentry por membresía:** este vigía repone trabajos, no detecta un atraso; a diferencia de los vigías de ADR 0008, no envía eventos. Una alerta que no sale la cubren `watchdog.jobs_backlog` y `watchdog.jobs_dead`.
   - **Conteo (m-7):** el vigía corre con el rol `comvive_worker`, que sí lee `JOB` (ADR 0008, decisión 5), y usa la vía de reencolado del módulo `jobs`, que devuelve qué hizo con cada fila. `items_enqueued` de `JOB_RUN` cuenta solo las filas insertadas o devueltas a `pending`, no los intentos. Así, el primer barrido tras el encendido muestra el número de membresías pendientes y los siguientes, cero.
   - **Manejador con el flag apagado:** si el flag se apaga después de haber estado encendido, los trabajos ya encolados que lleguen a su `run_at` terminan sin alertar (resultado `skipped`, fila `done`), no crean `NOTIFICATION_DELIVERY` y no fijan `first_access_alerted_at`.
   - **Apagar y volver a encender (D99):** el plazo de 7 días **se reinicia desde el nuevo encendido** para toda membresía que aún no recibió alerta. Lo hace la tabla de arriba con el `enabledOn` nuevo: las filas `done` vuelven a `pending` con el plazo nuevo y las `pending` se atrasan a él. Una membresía ya alertada no recibe otra. Esto enmienda ADR 0008, decisión 9, cuyo reencolado usa `run_at = now` y dispararía la alerta de inmediato (enmienda aplicada en ADR 0008, decisión 9, el 2026-11-12 con la aceptación de este ADR; ver sus "Enmiendas de la rebanada 1", punto 2).
   - **Fecha que informa la alerta (D76; M-6):**
     - **Cuándo una membresía fue "otorgada con el flag apagado":** cuando la fecha de su otorgamiento, en hora de Chile, es **anterior** al `enabledOn` vigente. El mismo día cuenta como otorgada con el flag encendido: por fecha no se distingue, y el plazo coincide con el del otorgamiento (**Supuesto (a validar)** ADR-0010-S10). Tras un reencendido, el criterio usa el `enabledOn` nuevo, que es desde donde corre el plazo.
     - **Plantilla:** el manejador elige la plantilla al crear la fila de `NOTIFICATION_DELIVERY`, como fija ADR 0008, decisión 14. Para una membresía otorgada con el flag encendido usa la actual, con los tres datos de GC S-72 (nombre de la comunidad, id de la membresía y fecha del otorgamiento). Para una otorgada con el flag apagado usa una plantilla nueva de la enumeración `template` (nombre propuesto: `admin_first_access_alert_after_enablement`), que agrega la fecha de encendido desde la que corre el plazo. El texto lo fija la spec. La alerta sigue siendo una sola por membresía, por `first_access_alerted_at`.
     - **De dónde sale la fecha:** `notification.send` arma el texto al enviar desde la base de datos (ADR 0008, decisión 14), y la fecha de encendido no está en la base de datos: la lee de `enabledOn(flag)` del puerto. Es el único dato de un aviso que viene de la configuración.
     - **Flag apagado entre el manejador y el envío (R2-m-8):** el manejador fija `first_access_alerted_at` en la misma transacción en que crea la entrega (ADR 0008, fila 5). Si el flag se apaga después, `notification.send` **envía igual** la entrega ya creada; si su plantilla es la que lleva la fecha de encendido y `enabledOn(flag)` ya no existe, envía el texto sin esa fecha (variante que fija la spec junto con la plantilla de D76). El flag solo decide si se **crea** una alerta (manejador y vigía), no si se envía una ya registrada. Se elige esta opción, y no limpiar `first_access_alerted_at` al terminar `skipped`, porque mantiene la regla de ADR 0008 de que esa columna se escribe una sola vez junto con la entrega, y no obliga a crear una segunda entrega para la misma membresía contra el índice único de `NOTIFICATION_DELIVERY` (ADR 0008, decisión 14). El costo es una alerta a Operaciones, sin dinero ni accesos.
     - **Enmienda de ADR 0008**, fila 5, columna "Qué hace": la alerta lleva, además, la fecha de encendido cuando la membresía fue otorgada con el flag apagado, y una entrega ya creada se envía aunque el flag se apague antes del envío (R2-m-8). Aplicada en ADR 0008 el 2026-11-12 con la aceptación de este ADR (ver sus "Enmiendas de la rebanada 1", punto 2).
   - **Pasos del encendido en un ambiente:** (1) la rebanada de ingreso está **desplegada en ese ambiente** (no "en Hecho": "Hecho" incluye la validación en pruebas, que necesita la alerta encendida en `staging`; m-6); (2) PR de ese ambiente con `enabled: true` y `enabledOn` igual al día del despliegue; (3) despliegue aprobado ese mismo día (si se atrasa, el despliegue falla y se corrige la fecha; D98); (4) el primer barrido de vigías encola los trabajos; Operaciones verifica en `JOB_RUN` (`items_enqueued`) que corrió, sin leer datos de negocio.

### Qué se implementa en cada rebanada

| Pieza | Rebanada |
| --- | --- |
| Archivo de flags, puerto `FeatureFlags` (instancia congelada) y doble con `isEnabled` y `enabledOn`; `COMVIVE_ENV`; `assertFeatureFlags` con las reglas (a) a (f), con (e) y (f) en su forma temporal; `assertFeatureFlagsProvider`; reglas de lint; propietario de código | Rebanada 1 |
| Tabla de requisitos exhaustiva (`Record<FeatureFlag, Prerequisite \| 'none'>`) y prueba de fijación de la fila del traspaso (R2-M-1) | Rebanada 1 |
| 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` con el flag apagado; encolado de la alerta en la transacción detrás del flag (D92) | Rebanada 1 |
| Prueba del CI que ata el requisito a pruebas de oro activas, con integración HTTP por acción (D96, D104), y paso de `*.gold.test.ts` de `apps/api` en el job `money-gold` sin caché | Rebanada 1 (con la lista vacía y el requisito en falso) |
| Comparación con el proyecto de Google Cloud con la dirección fija del servidor de metadatos, ids de todos los ambientes desplegados y reemplazo de la regla (e) (D97) | Antes del primer encendido de cualquier flag en `staging` |
| Verificación de `enabledOn` en el pipeline de despliegue y retiro de la regla (f) (D98) | Antes del primer encendido de cualquier flag en un ambiente desplegado |
| Inicio del ciclo del `worker` después de `assertFeatureFlagsProvider` | Con `main.worker.ts` (ADR 0008) |
| Vigía, manejador con el flag apagado, reencendido (D99), plantilla de D76 y envío de una entrega ya creada con el flag apagado (R2-m-8) | Rebanada "Ingreso e invitaciones" |
| Constante del traspaso en verdadero, con sus pruebas de oro (incluida una de integración HTTP por acción, D104), y prueba de fijación comparada con la constante | Rebanada del libro de movimientos |
| Campo de capacidades | Rebanada web de este módulo |

## Pruebas

Con TDD para lo que protege dinero (decisiones 3 y 4). Vitest; las del arranque, sobre la función pura `assertFeatureFlags`, sin levantar la aplicación, salvo donde se indica.

1. **Valores por defecto:** con el archivo real, los dos flags están apagados en `local`, `staging` y `production`; un flag ausente de un ambiente se lee apagado y su `enabledOn` no existe.
2. **Primera barrera (CA-CM-26):** una configuración con `occupancy.end_and_transfer` encendido en cualquier ambiente y el requisito en falso hace fallar la verificación, con un mensaje que nombra el flag y el ambiente, sea cual sea el ambiente declarado. La prueba sobre el archivo real y la tabla real pasa.
3. **Segunda barrera (CA-CM-26):** `assertFeatureFlags` con esa misma configuración y `COMVIVE_ENV = production` lanza error y llama al registrador con `feature_flags.invalid`, sin valores. Además, sobre la fábrica real: `createApp` y `createApiApp` con una variable `FEATURE_FLAG_*` en el entorno fallan **antes** de crear la aplicación de NestJS (ningún `onModuleInit` corre). Esta prueba falla si se quita la llamada (m-5). Cuando exista `main.worker.ts`, su prueba equivalente.
4. **Requisito cumplido, `'none'` y tabla incompleta (m-4; R2-M-1):** con una tabla de entrada que da el requisito en verdadero, el flag encendido pasa; con una tabla de entrada que declara `'none'` para el flag, el flag encendido pasa; con una tabla de entrada sin entrada para un flag encendido (forzada con una conversión de tipo), falla (regla (c), falla cerrado).
5. **Constante atada a pruebas de oro activas (D96, D104; R2-m-1):** con el requisito en verdadero, falla si la lista está vacía; si un archivo no existe o no termina en `.gold.test.ts`; si un identificador solo aparece en un `it.skip`, `it.todo`, `test.skipIf`, dentro de un `describe.skip`, en un comentario, en un texto suelto o en una prueba sin `expect`; o si a `end_occupancy` o a `sale` les falta una prueba `level: 'http'`. Con todas activas y una prueba HTTP por acción, pasa. Las pruebas usan archivos de ejemplo en `test-support`. Con el estado real (requisito en falso, lista vacía) pasa.
6. **Ambiente:** `COMVIVE_ENV` ausente, vacío o desconocido falla; `local` con `K_SERVICE` definido falla. **Proyecto (D97), mientras la comparación no exista (regla (e) temporal):** un id cualquiera en `DEPLOY_ENVIRONMENT_PROJECTS` falla con "comparación no implementada"; un flag encendido en `staging` o `production` falla. **Despliegue (D98), mientras no exista la verificación del pipeline (regla (f)):** un flag encendido en `staging` o `production` falla con "verificación de despliegue no implementada"; en `local`, pasa. **Desde que se implemente la comparación:** `staging` o `production` sin id fallan aunque todo esté apagado; id del servidor de metadatos distinto del esperado o servidor de metadatos sin respuesta no arrancan; con el id esperado, arranca; fuera de Cloud Run no se consulta; con `GCE_METADATA_HOST` o `GCE_METADATA_IP` definidas, no arranca; con `GOOGLE_CLOUD_PROJECT` igual al id esperado y el servidor de metadatos con otro, no arranca (la variable no es fuente); la función de lectura llama solo a la dirección fija.
7. **Valor externo:** con `FEATURE_FLAG_OCCUPANCY_END_AND_TRANSFER=true` (o cualquier `feature_flag_*`) en el entorno, falla el arranque. Con cualquier otra variable de entorno, los flags resueltos son exactamente los del archivo para ese ambiente (prueba de propiedades sobre el entorno).
8. **Lint:** importar `feature-flags.config.ts` fuera de `src/config/**` produce error; leer `process.env` en ese archivo produce error; proveer el token `FeatureFlags` fuera de `src/config/**` produce error; importar un doble de `test-support` desde un archivo que no es de prueba produce error.
9. **Proveedor único (M-2):** una aplicación con un proveedor alternativo del token (en el módulo raíz o local a otro módulo), o con el doble en lugar de la instancia de `src/config/`, no pasa `assertFeatureFlagsProvider`; la aplicación real sí. `createApiApp` la llama (la prueba falla si se quita). **Instancia inmutable (R2-m-3):** la instancia real está congelada; reasignar `isEnabled` o `enabledOn` lanza error y los valores no cambian. **`worker` (R2-m-3; cuando exista `main.worker.ts`):** con un proveedor alternativo, el `worker` no arranca y no toma ningún trabajo ni atiende peticiones de Scheduler (espía sobre la toma); la prueba falla si el ciclo parte antes de la verificación.
10. **`enabledOn` (M-4):** un flag encendido sin `enabledOn` falla; con `2026-13-45`, `2026-02-30`, `1-2-3`, `2026-1-05` o con hora, falla; con una fecha posterior a hoy en hora de Chile, falla; con la de hoy o una anterior, pasa. El límite se prueba cerca de la medianoche de Chile con el proceso en `TZ=UTC`. **`isEnabled` no depende del reloj:** con la misma configuración, `isEnabled` da lo mismo para cualquier fecha de hoy (prueba de propiedades).
11. **Verificación del despliegue (D98; cuando exista el pipeline):** sobre la función pura de comparación: flag apagado en la revisión en servicio y encendido en la nueva con `enabledOn` distinto de hoy, falla; igual a hoy, pasa; sin revisión en servicio, se trata como apagado; encendido en las dos con el mismo `enabledOn`, pasa; encendido en las dos con otro `enabledOn`, falla; encendido y luego apagado, pasa.
12. **Rutas (CA-CM-26):** con el doble de configuración apagado, término y venta responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` sin escribir nada; con el doble encendido, siguen sus reglas. Ninguna ruta del inventario devuelve el nombre ni el valor de un flag.
13. **Alerta de primer ingreso en la transacción (rebanada 1; CA-CM-1; D92):**
    - con el doble apagado, el alta de comunidad y el otorgamiento de `admin` no encolan `membership.admin_first_access_alert` (espía sobre `enqueue`);
    - con el doble encendido y `enabledOn` igual o anterior al otorgamiento, encolan en su transacción un trabajo con la clave de ADR 0008 y el `run_at` de la fila 5 (TC-CM-CA1-07: otorgamiento el 2026-11-12 y `enabledOn` 2026-11-12 dan 2026-11-20 00:00 en hora de Chile); con `valid_from` 2026-11-20, 2026-11-28 00:00;
    - si la transacción se deshace, no queda trabajo;
    - la fórmula, como función pura: `run_at` es siempre `startOfDay(máx de las tres fechas + 8 días)`, también cuando `enabledOn` es la mayor (prueba de propiedades).
14. **Vigía de la alerta (rebanada de ingreso):** con membresías `admin` otorgadas antes de `enabledOn`, el vigía encola un trabajo por cada una con el `run_at` de la fórmula; con `valid_from` posterior a `enabledOn`, cuenta desde `valid_from`; repetirlo no duplica ni cambia `run_at`; una membresía con primer ingreso, revocada o ya alertada no recibe trabajo; **con el flag apagado el vigía no hace nada**; `items_enqueued` cuenta las filas insertadas y es cero en el segundo barrido; el vigía no envía eventos a Sentry. **Aislamiento (m-7):** una persona `admin` sin primer ingreso en A y en B recibe dos trabajos, cada uno con el `community_id` y el `membershipId` de su comunidad, en una transacción por comunidad y ninguno cruzado.
15. **Manejador con el flag apagado y reencendido (rebanada de ingreso; D99):** con el flag apagado, un trabajo que llega a su `run_at` termina `skipped`, sin `NOTIFICATION_DELIVERY` y sin fijar `first_access_alerted_at`. Al reencender con un `enabledOn` nuevo: la fila `done` vuelve a `pending` con `attempts = 0` y `run_at` de la fórmula (no `now`), y la alerta no sale antes de ese instante; una fila `pending` con un `run_at` anterior se atrasa al nuevo y una con uno posterior no cambia; una fila `dead` no se toca; una membresía ya alertada no recibe trabajo.
16. **Fecha que informa la alerta (rebanada de ingreso; D76):** una membresía otorgada antes de `enabledOn` genera la entrega con la plantilla que lleva la fecha de encendido, y el texto enviado contiene la fecha del otorgamiento y `enabledOn`; una otorgada **el mismo día** de `enabledOn` o después usa la plantilla actual, sin fecha de encendido; en los dos casos hay una sola entrega por membresía. **Flag apagado después de crear la entrega (R2-m-8):** `notification.send` la envía igual; con la plantilla de fecha de encendido, el texto sale sin esa fecha; `first_access_alerted_at` queda fijada y, al reencender, el vigía no repone trabajo para esa membresía.
17. **Fila real del traspaso fijada (R2-M-1):** sobre la tabla real, `occupancy.end_and_transfer` tiene un requisito distinto de `'none'`, con `key` `ledger.ownership_transfer`, `requiredHttpActions` con `end_occupancy` y `sale`, y `met` igual a `false` (desde la rebanada del libro, igual a `OWNERSHIP_TRANSFER_IMPLEMENTED` importada de su módulo). Además, con TypeScript, una tabla a la que le falta un flag no compila (prueba de tipos con `@ts-expect-error`).

## Alineaciones pendientes

Estado al 2026-11-12, con este ADR aceptado. Cada punto lleva su responsable; los marcados **Hecho** se aplicaron con la aceptación.

**Hecho el 2026-11-12 (arquitecto):**

- **Hecho.** `docs/arquitectura.md` §6 (viñeta de feature flags), §3 ("Administrador sin primer ingreso"), §7 (lista de ADR) y encabezado: resumen actualizado con lo que rige.
- **Hecho.** ADR 0008: inventario (fila 5) y decisión 9 editados según sus "Enmiendas de la rebanada 1", punto 2, que deja la constancia.

**Hecho · QA (`docs/qa/casos/comunidades-y-membresias.md`; m-2).** QA aplicó estos ajustes en el archivo de casos el 2026-11-12 (casos TC-CM-CA26-04, 05 y 09 a 14, TC-CM-CA1-07 y PROP-CM-21). Sigue pendiente solo el último punto, que depende de la tarjeta de la web:

- **PROP-CM-21:** quitar el estado "encendido en producción con la constante del traspaso en falso … responden 422". Con la variante elegida ese estado no existe: la API no arranca (decisión 4).
- **TC-CM-CA26-04:** deja de estar bloqueado. El archivo es `apps/api/src/config/feature-flags.config.ts` y la prueba cubre **cada** ambiente (`local`, `staging`, `production`), no solo producción.
- **TC-CM-CA26-05:** se escribe para la rama (ii). "Encendido por una variable de entorno" es una variable `FEATURE_FLAG_*`: la API no arranca y el registro nombra la variable y la regla. El caso "archivo con el flag encendido y el requisito en falso" se prueba sobre `assertFeatureFlags` con una configuración de entrada.
- **TC-CM-CA1-07 y H-CM-12:** H-CM-12 queda cerrada por D92. El caso debe fijar el `enabledOn` del doble, igual o anterior al 2026-11-12 (se propone `2026-11-12`), para que `run_at` sea 2026-11-20 00:00.
- **TC-CM-CA26-07:** se ajusta cuando la tarjeta de la web fije el nombre del campo de capacidades (m-10).
- **Casos nuevos:** proveedor único del puerto, instancia congelada y `worker` (prueba 9), `enabledOn` (prueba 10), requisito atado a pruebas de oro activas (prueba 5), tabla de requisitos exhaustiva y fila del traspaso fijada (pruebas 4 y 17) y reglas temporales (e) y (f) (prueba 6). QA fija los identificadores de las pruebas de oro del traspaso (ADR-0010-S9) y, por D104, incluye en la lista al menos una prueba de integración por la ruta HTTP de término y otra de venta que verifiquen los movimientos en el libro; los archivos terminan en `.gold.test.ts`.
- **Segunda pasada (R2-m-8):** el caso del manejador con el flag apagado (prueba 15) no cambia; se agrega el de una entrega ya creada que se envía aunque el flag se apague antes del envío (prueba 16).

**Pendiente · coordinador, analista, desarrollador y Operaciones:**

- **Analista (spec de gasto común, S-72):** texto de la plantilla de la alerta con fecha de encendido (D76), con su variante sin fecha para una entrega enviada con el flag ya apagado (R2-m-8). **Coordinador:** registro en las specs de D92, D96 a D101, D103 y D104 donde falte.
- **Desarrollador (rebanada 1):** implementación de las piezas de la tabla "Qué se implementa en cada rebanada" marcadas "Rebanada 1", con TDD.
- **Desarrollador (con la implementación):** `.github/workflows/ci.yml`, paso del job `money-gold` que corre sin caché los `*.gold.test.ts` de `apps/api` (R2-m-1).
- **Desarrollador (con la implementación):** `apps/api/.env.example`, el CI y las pruebas con entorno propio, agregar `COMVIVE_ENV=local`.
- **Coordinador (con la implementación):** `.github/CODEOWNERS`, entradas de la decisión 6 (D79). La exigencia de revisión se activa con la cuenta separada de los agentes (ADR 0009, D36, D40 y D68).
- **Desarrollador (antes del primer encendido de cualquier flag en `staging`):** comparación con el proyecto de Google Cloud y reemplazo de la regla (e) (D97).
- **Desarrollador y Operaciones (antes del primer encendido en un ambiente desplegado):** verificación de `enabledOn` en el pipeline de despliegue y retiro de la regla (f) (D98).
- **Operaciones (`docs/operaciones/`, cuando exista):** ids de proyecto por ambiente (D97), verificación de `enabledOn` en el pipeline (D98) y vía de emergencia (D101, D103).
- **Analista y diseñador (rebanada web de este módulo):** campo de capacidades y su nombre (ADR-0010-S3; m-10).
- **Antes del Piloto:** supuestos ADR-0010-S1 a S10.

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Solo una sección en `docs/arquitectura.md`, sin ADR | Era la idea de D56 mientras el mecanismo fuera chico. Con D69 hay dos barreras, un arranque que falla y un procedimiento que encola trabajos, con alternativas que conviene dejar registradas (`CLAUDE.md`: "toda decisión técnica relevante queda en `docs/adr/`"). |
| Valor de cada flag en variables de entorno de Cloud Run, definidas por el despliegue desde un archivo del repositorio | Deja una vía de lectura que cualquiera con permiso sobre el servicio puede editar desde la consola o con `gcloud`, que es justo lo que D69 cierra. Compilado en la imagen, no hay vía. |
| Archivo JSON o YAML por ambiente (`config/feature-flags/production.json`) | Hay que copiarlo a la imagen y validarlo en ejecución; un nombre de flag mal escrito se descubre tarde. En TypeScript no compila y la prueba lo importa directo. |
| Flags en una tabla de la base de datos, con una pantalla de Operaciones | Es editable fuera del repositorio y por API, contra D56. Sirve para flags por comunidad, que hoy no existen. |
| Servicio externo de flags (LaunchDarkly, Unleash, Firebase Remote Config) | Sale del stack de `CLAUDE.md`, agrega un proveedor y una dependencia en cada petición, y el valor de producción dejaría de estar en el repositorio. |
| Valor externo "se considera apagado" (la otra opción de D69) | Silencioso: nadie se entera del intento y quien lo hizo cree que funcionó. Fallar el arranque no afecta al servicio en curso y lo deja a la vista (D77). |
| Barrera del código que trata el flag como apagado en vez de impedir el arranque (la otra variante de D69) | Igual de segura para el dinero, pero esconde un error de configuración o un salto del CI. Además obliga a mantener dos comportamientos (apagado por configuración y apagado por la constante) y a probar ambos. |
| Aplicar las barreras solo a `production` | Bastaría declarar otro ambiente (`COMVIVE_ENV`) para saltarlas. La rebanada del libro cambia la constante en el mismo cambio que agrega el traspaso, así que ningún ambiente necesita el flag encendido antes (D100). |
| Constante del traspaso como literal en `src/config/`, protegida solo por la revisión del cambio | Las dos barreras caen con un cambio de una línea, y la exigencia de revisión del propietario aún no está activa (D40). Atarla a las pruebas de oro hace que el CI lo impida (D96). |
| Tabla de requisitos parcial, donde un flag sin fila no tiene requisito | Quitar la fila de `occupancy.end_and_transfer` y encender el flag pasaba las dos barreras y la prueba de D96 con un cambio de dos líneas en `src/config/` (R2-M-1). Con la tabla exhaustiva, cada flag declara `'none'` de forma explícita y la fila del traspaso queda fijada por una prueba. |
| Verificar las pruebas de oro de D96 con una búsqueda de texto | Un `it.skip`, un `it.todo` o un comentario con el identificador la cumplirían (R2-m-1). Se verifica sobre el árbol sintáctico. |
| Aceptar como pruebas de oro solo pruebas de la función del traspaso aislada | Demuestran el cálculo, no que término y venta lo ejecuten. D104 exige una prueba de integración HTTP por acción. |
| Al apagar el flag entre el manejador y el envío, limpiar `first_access_alerted_at` al terminar `skipped` (la otra opción de R2-m-8) | Escribe dos veces la columna de alerta única y obliga a una segunda entrega para la misma membresía contra el índice único de `NOTIFICATION_DELIVERY` (otra ronda). Enviar la entrega ya creada es más simple y el costo es una alerta a Operaciones. |
| Leer el id del proyecto con la biblioteca de metadatos de Google o con `GOOGLE_CLOUD_PROJECT` | La biblioteca acepta `GCE_METADATA_HOST` y `GCE_METADATA_IP`, y `GOOGLE_CLOUD_PROJECT` es una variable: ambas se editan desde la consola, la vía que D97 cierra (R2-m-6). |
| Aceptar el riesgo de un `COMVIVE_ENV` mal declarado, sin verificarlo contra el proyecto | Cuando `staging` tenga un flag encendido que `production` no, una variable editada desde la consola lo encendería en producción sin PR ni aprobación (regla 10). Descartada por D97. |
| `enabledOn` como fecha planificada, corregida a mano si el despliegue se atrasa | Si nadie la corrige, el plazo de 7 días se acorta y la alerta informa una fecha que no es la real (S-CM-27, D76). Descartada por D98. |
| `enabledOn` opcional, obligatorio solo para los flags que lo usan | Exige una segunda lista ("flags con fecha") y dos formas del tipo. Obligatorio para todos es una sola regla y deja además el registro del día del encendido. |
| Validar el proveedor del puerto solo con `app.get` | No ve un proveedor local del mismo token en otro módulo. Se recorre el contenedor, como el inventario de rutas. |
| Al reencender, reencolar con `run_at = now` (el reencolado de ADR 0008, decisión 9, sin cambios) | Dispara la alerta de inmediato, sin los 7 días desde el encendido nuevo (D99). |
| Una sola plantilla de alerta, con la fecha de encendido decidida al enviar | ADR 0008, decisión 14, elige la plantilla en la transacción de origen, y así la fila de la entrega deja constancia de qué variante se envió. |
| Que la web descubra la disponibilidad solo con el 422 | Obliga a mostrar un botón que siempre falla o a hacer una petición de prueba. Se mantiene el 422 como fuente de verdad y se agrega el campo de capacidades para la pantalla. |
| Endpoint `GET /feature-flags` para la web | Expone los flags como tales, contra CM-H1, y revela qué está en construcción. |
| Procedimiento único (script) que encola los trabajos de la alerta al encender | Exige un paso manual contra la base de datos de producción en cada ambiente y su propia auditoría. El vigía usa el patrón ya aprobado de ADR 0008, es repetible y además repone un trabajo que se pierda. |
| Guardar el instante de encendido en una tabla al primer arranque | Depende del reloj del primer arranque, que CM-A5 descarta, y agrega una tabla y una escritura al arrancar. `enabledOn` en el repositorio queda versionado y aprobado. |

## Consecuencias

### Positivas

- El valor de cada flag en cada ambiente está en un solo archivo, con historial y aprobación. Desde la consola de Google Cloud no se puede escribir un valor; lo único que se puede alterar es qué ambiente se declara (`COMVIVE_ENV`), y desde que rija la verificación contra el proyecto (D97) un ambiente mal declarado no arranca. La única vía para cambiar el valor efectivo sin un PR previo es la vuelta a la revisión anterior, con aprobación del líder y solo para apagar (D101, D103).
- Un flag que protege dinero no puede llegar encendido a ningún ambiente con su requisito en falso: ni fusionando (CI) ni desplegando (arranque). Su requisito no se puede quitar ni cambiar a `'none'` sin editar la prueba que lo fija (R2-M-1). Que el requisito no pase a verdadero sin las pruebas de oro activas del traspaso, incluida una de integración HTTP por acción (D96, D104), lo impide **solo el CI**; el arranque no lo puede verificar (R2-m-2).
- Patrón repetible para los agentes: agregar un flag es una línea en la lista cerrada y una entrada en la tabla de requisitos, con su requisito o `'none'`; si falta la entrada, no compila.
- Las pruebas ejercitan los dos estados sin tocar la configuración real, y la aplicación real no puede usar otro proveedor del puerto.
- La fecha de encendido que usa y que informa la alerta es la del despliegue real (D98).

### Negativas

- Encender o apagar exige un PR y un despliegue. Ante un incidente existe la vuelta a la revisión anterior (D101), que también devuelve el código. Se acepta porque en el MVP los flags separan trabajo sin terminar, no experimentos.
- **Término y venta no se pueden encender en ningún ambiente, tampoco en `local` ni en `staging`, hasta la rebanada del libro (D100).** En la rebanada 1 el líder valida en el ambiente de pruebas solo el 422; el flujo completo se valida en la rebanada del libro. Las pruebas automáticas sí ejercitan el flujo, con el doble.
- El PR de encendido se fusiona y se despliega el mismo día de su `enabledOn`; si el despliegue se atrasa, hay que corregir la fecha con otro PR (D98).
- Sin encendido por comunidad: un piloto parcial requiere otro mecanismo y otro ADR.
- `COMVIVE_ENV` es una variable más por ambiente y por servicio, y el arranque en Cloud Run sumará una consulta al servidor de metadatos (D97).
- El vigía de la alerta agrega una consulta por comunidad cada 5 minutos mientras el flag esté encendido.
- Quedan dos verificaciones por construir antes del primer encendido en un ambiente desplegado (D97 y D98). Las reglas temporales (e) y (f) impiden encender cualquier flag en `staging` o `production` mientras falten, así que el plazo se cumple sin depender de la memoria de nadie.

### Riesgos

- **Imagen construida fuera de `main`:** una imagen compilada desde otra rama podría traer otro archivo u otra constante. Mitigación: el despliegue sale solo del pipeline de `main` con Workload Identity Federation y aprobación del líder para producción (`docs/arquitectura.md` §6; regla 10), y el pipeline despliega solo commits de `main` con la verificación `check` en verde (R2-m-2). Importa en especial para el requisito en verdadero sin pruebas de oro, que el arranque no detecta. Es el mismo riesgo de cualquier otro código.
- **Propietario de código sin exigencia activa (D40):** hasta que exista la cuenta separada de los agentes, un cambio a las barreras no exige la revisión del líder. Mitigación: las pruebas 3, 5, 9 y 17 fallan si se quita una llamada, si se cambia la constante sin las pruebas de oro o si se quita o debilita el requisito del traspaso. Lo que queda es editar o borrar esas mismas pruebas, un cambio a la vista en el PR que el líder aprueba y que el propietario de código cubrirá cuando su exigencia esté activa.
- **Lista de pruebas de oro mal armada:** la prueba de D96 verifica que cada identificador esté en una prueba activa con al menos un `expect` y que haya una prueba HTTP declarada por acción (D104), no que prueben bien el traspaso. Mitigación: los fija QA, los aprueba el líder con la rebanada del libro y son pruebas de oro (regla 2), corridas sin caché en el job `money-gold`.
- **Despliegue fuera del pipeline:** la verificación de `enabledOn` (D98) vive en el pipeline; un despliegue manual la salta. Mitigación: la misma del primer riesgo. El efecto sería una alerta a Operaciones con un plazo o una fecha incorrectos, sin dinero ni accesos.
- **El prefijo reservado es una trampa, no la garantía:** una variable con otro nombre no hace fallar el arranque, pero tampoco tiene efecto, porque no existe vía de lectura (prueba 7).
- **Ambiente mal declarado:** `COMVIVE_ENV = staging` en producción traería los flags de `staging`. Mitigación: las barreras valen en todos los ambientes (D100) y, antes del primer encendido en `staging`, el arranque compara el ambiente con el proyecto de Google Cloud leído de la dirección fija del servidor de metadatos (D97, R2-m-6); mientras tanto, la regla (e) impide cualquier flag encendido en `staging` o `production`.
- **Vuelta a la revisión anterior con un esquema incompatible o con un flag encendido:** la vía de emergencia devuelve también el código y el archivo de flags de esa revisión. Mitigación: se usa solo para apagar, con aprobación del líder, y después de confirmar que la revisión de destino no enciende ningún flag que la revisión en servicio tiene apagado y que es compatible con el esquema vigente (decisión 6, D103). Es una verificación de procedimiento, no automática: el detalle va a `docs/operaciones/`.

## Supuestos (a validar)

- **ADR-0010-S1 · Supuesto (a validar):** los ambientes son tres, con identificadores `local`, `staging` (Pruebas) y `production` (Producción), y la variable es `COMVIVE_ENV`. Aprobado como supuesto por D78. `docs/operaciones/` no existe todavía; si Operaciones define otros nombres o un ambiente más, se ajustan la lista y este ADR en el mismo cambio.
- **ADR-0010-S2 · Supuesto (a validar):** Cloud Run no envía tráfico a una revisión cuyo contenedor termina con error al arrancar y mantiene la anterior. Es el supuesto que ya usa ADR 0009 (D38); se verifica en el prototipo de despliegue.
- **ADR-0010-S3 · Supuesto (a validar):** la web sabrá si mostrar término y venta con un campo de capacidades en `GET /communities/{communityId}`. La spec lo dejó abierto para la rebanada web (R3-m-9); el analista y el diseñador lo confirman con esa tarjeta, incluido el nombre del campo, que no debe repetir el del flag (m-10).
- **ADR-0010-S4 · Supuesto (a validar):** `K_SERVICE` definido identifica que el proceso corre en Cloud Run. Heredado de ADR-0009-S8, que ya lo usa para `TRUST_PROXY_HOPS`.
- **ADR-0010-S5 · Supuesto (a validar):** el despliegue promueve la **misma imagen** de `staging` a `production`. De eso depende que el ambiente se declare con una variable y no al compilar. Si Operaciones decide una imagen por ambiente, `COMVIVE_ENV` se puede fijar al compilar y este ADR se ajusta.
- **ADR-0010-S6 · Supuesto (a validar):** el CI y los equipos de desarrollo corren como `local`.
- **ADR-0010-S7 · Supuesto (a validar) (D97):** cada ambiente desplegado vive en su propio proyecto de Google Cloud (ADR 0008, decisión 11, ya habla de un proyecto de pruebas y uno de producción) y el servidor de metadatos de Cloud Run informa el id del proyecto. Los ids se fijan cuando exista `docs/operaciones/`; se verifica en el prototipo de despliegue.
- **ADR-0010-S8 · Supuesto (a validar) (D98):** el pipeline de despliegue puede saber de qué commit salió la revisión en servicio de cada ambiente (por ejemplo, por la etiqueta de la imagen) y leer el archivo de flags de ese commit. Se confirma al diseñar el pipeline.
- **ADR-0010-S9 · Supuesto (a validar) (D96):** las pruebas de oro del traspaso de GC F-9 y F-13 tendrán identificadores fijados por QA, al comienzo del nombre de una prueba activa en archivos `*.gold.test.ts` nombrados en la tabla de requisitos, que el job `money-gold` corre sin caché; entre ellas, al menos una de integración HTTP para término y otra para venta (D104). Hoy son casos heredados (H-LIB).
- **ADR-0010-S10 · Supuesto (a validar) (D76):** una membresía fue "otorgada con el flag apagado" si la fecha de su otorgamiento es anterior a `enabledOn`; el mismo día cuenta como otorgada con el flag encendido y su alerta no lleva fecha de encendido. La plantilla con fecha de encendido se usa también cuando el `valid_from` de esa membresía es posterior al encendido (D76 no distingue ese caso, y entonces el plazo corre desde `valid_from`, que la alerta no informa); el analista lo confirma con el texto de la plantilla.
- **Supuestos heredados de la spec:** S-CM-27 (el plazo de la alerta cuenta desde el encendido), S-CM-30 (422 con el flag apagado) y S-CM-31 (mecanismo general).

No quedan preguntas abiertas para el líder del proyecto: las cuatro de este ADR, las siete de la primera pasada de la revisión crítica y las dos de la segunda están respondidas en "Decisiones del líder". El líder del proyecto aceptó este ADR el 2026-11-12.

## Trazabilidad

| Decisión | Spec (`docs/specs/comunidades-y-membresias.md`) | Otros documentos |
| --- | --- | --- |
| 1 y 2. Archivo y ambientes | CM-H1; S-CM-31; P-CM-20 (1); D56, D69, D78, D80, D97 | `docs/arquitectura.md` §4, §6 y §8; revisión M-2, M-3, M-4, R2-m-4, R2-m-5, R2-m-6 |
| 3. Valor externo | CM-H1; P-CM-20 (2); D69, D77; CA-CM-26 | ADR 0009, D38 |
| 4. Barreras | CM-E6, CM-H1; P-CM-20 (3); D51, D69, D77, D96, D100, D104; CA-CM-26 | ADR 0004 (traspaso); ADR 0009, decisión 4; reglas 2 y 10 de `CLAUDE.md`; `.github/workflows/ci.yml` (job `money-gold`); revisión M-1, M-2, m-1, m-3, m-4, R2-M-1, R2-m-1, R2-m-2, R2-m-3 |
| 5. Web | CM-H1; P-CM-20 (4); R3-m-9 | ADR 0003, decisión 1; revisión m-10 |
| 6. Encendido | CM-H1; D56, D79, D98, D101, D103 | Regla 10 de `CLAUDE.md`; ADR 0009, D36, D40 y D68; revisión M-4, m-5, m-6, R2-m-7 |
| 7. Alerta de primer ingreso | CM-A5; S-CM-27; P-CM-20 (5); R3-m-7; CA-CM-1; D76, D92, D99 | GC S-72 (rev. 10); ADR 0008, inventario (fila 5), decisiones 3, 9 y 14 y "Enmiendas de la rebanada 1"; QA TC-CM-CA1-07 y H-CM-12; revisión M-5, M-6, M-7, m-7, R2-m-8 |

## Referencias

- `docs/specs/comunidades-y-membresias.md` (rev. 5): CM-A5, CM-E6, CM-H1; S-CM-27, S-CM-30, S-CM-31; P-CM-20; CA-CM-1, CA-CM-26; "Contradicciones y vacíos", puntos 21, 24 y 28; decisiones D51, D56, D69, D76 y D92.
- `docs/specs/gasto-comun.md` (rev. 10): S-72, "Alerta detrás de un flag y plazo desde su encendido" y "Fecha que informa la alerta" (D76); F-9 y F-13 (traspaso).
- `docs/revisiones/2026-11-12-adr-0010.md` (revisión crítica de este ADR) y `docs/revisiones/2026-11-11-spec-comunidades-y-membresias.md` (R2-M-3, R3-M-1, R3-m-7 y R3-m-9).
- `docs/qa/casos/comunidades-y-membresias.md`: TC-CM-CA1-07, TC-CM-CA26-04, 05 y 07, PROP-CM-21, H-CM-12 y H-LIB.
- `docs/arquitectura.md` §4 ("Intereses"), §6 (ambientes), §7 y §8 (pregunta 5).
- ADR 0008 (inventario, fila 5; decisiones 2, 3, 5, 7, 9, 10, 11 y 14; "Enmiendas de la rebanada 1") y ADR 0009 (decisión 4, D36, D38, D40, D68 y ADR-0009-S8).
- Código: `apps/api/src/main.ts`, `api-app.ts`, `configure-app.ts`, `config/port.ts`, `config/trust-proxy-hops.ts`, `apps/api/.env.example`, `eslint.config.mjs`, `turbo.json`, `.github/workflows/ci.yml` y `.github/CODEOWNERS`.
- `CLAUDE.md`: metodología (trunk-based development y feature flags) y reglas 2, 5, 6 y 10.
