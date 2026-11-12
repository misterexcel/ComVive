# ADR 0010 · Feature flags por ambiente

- **Estado:** Propuesto (2026-11-12). Pendiente de aprobación del líder del proyecto. Responde P-CM-20 de `docs/specs/comunidades-y-membresias.md` (rev. 4) y el punto 24 de sus "Contradicciones y vacíos". Las reglas de producto ya están decididas por el líder (D51, D56 y D69, 2026-11-11); este ADR fija solo lo que esas decisiones dejaron al arquitecto.
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

D56 dijo "sin ADR propio por ahora … y a un ADR si crece". Con D69 el mecanismo creció: tiene dos barreras, una verificación al arrancar, un procedimiento de encendido que encola trabajos y varias alternativas descartadas que conviene dejar registradas. Por eso se propone este ADR; `docs/arquitectura.md` §6 lleva solo el resumen.

Estado actual de `apps/api`: la configuración por variable de entorno se valida al arrancar (`PORT`, `TRUST_PROXY_HOPS`, en `src/config/`) y la API no arranca si el inventario de rutas no coincide con su lista cerrada (ADR 0009, D38). No existe todavía `docs/operaciones/` ni un identificador de ambiente.

## Decisión

1. **La configuración de los flags es un archivo de código del repositorio, compilado dentro de la imagen.**
   - Archivo: `apps/api/src/config/feature-flags.config.ts`. Contiene la lista cerrada de nombres de flag y, por cada ambiente, el valor de cada uno. La API y el `worker` usan la misma imagen (ADR 0008, decisión 2), así que leen el mismo archivo.
   - **No hay ninguna otra fuente.** El código no lee el valor de un flag desde variables de entorno, la base de datos, Secret Manager, un servicio externo ni una petición. La única entrada externa es **qué ambiente es** (punto 2).
   - Esquema (prototipo; los nombres finales los fija el desarrollador):

     ```ts
     export const FEATURE_FLAGS = [
       'occupancy.end_and_transfer',
       'platform.admin_first_access_alert',
     ] as const;
     export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

     export const DEPLOY_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
     export type DeployEnvironment = (typeof DEPLOY_ENVIRONMENTS)[number];

     /** `enabledOn`: fecha (hora de Chile) desde la que rige el encendido; obligatoria si `enabled`. */
     type FlagSetting = { enabled: false } | { enabled: true; enabledOn: `${number}-${number}-${number}` };

     export const FEATURE_FLAG_CONFIG: Record<DeployEnvironment, Partial<Record<FeatureFlag, FlagSetting>>> = {
       local: {},
       staging: {},
       production: {},
     };
     ```

   - Un flag que no aparece en un ambiente está **apagado** (CM-H1). Un nombre fuera de `FEATURE_FLAGS` no compila. Hoy los tres ambientes van vacíos: los dos flags apagados en todos.
   - **Lectura:** el resto del código solo conoce el puerto `FeatureFlags` (`isEnabled(flag)` y `enabledOn(flag)`), que el módulo de configuración resuelve una vez al arrancar. Una regla de lint prohíbe importar `feature-flags.config.ts` fuera de `src/config/**`, y `process.env` no se lee en ese archivo.
   - **Sin valor por comunidad ni por usuario** (D56). Si un piloto necesita encender algo para una sola comunidad, es otro mecanismo y exige un ADR nuevo.

2. **Ambientes: tres identificadores, declarados con `COMVIVE_ENV`.**
   - `local` (equipo de desarrollo y CI), `staging` (el ambiente "Pruebas" de `docs/arquitectura.md` §6) y `production` ("Producción"). Para la prueba del CI, "producción" es la entrada `production` del archivo (**Supuesto (a validar)** ADR-0010-S1: nombres y cantidad de ambientes, hasta que exista `docs/operaciones/`).
   - La variable de entorno `COMVIVE_ENV` es obligatoria y se valida al arrancar, como `PORT` y `TRUST_PROXY_HOPS`: ausente o con un valor fuera de la lista, el proceso no arranca. En Cloud Run (`K_SERVICE` definido) no puede ser `local`.
   - `COMVIVE_ENV` elige una entrada del archivo, no un valor: declarar el ambiente equivocado solo puede traer la configuración versionada de otro ambiente, nunca una que no esté en el repositorio. Por eso las barreras del punto 4 valen para **todos** los ambientes, no solo para `production`.

3. **Un valor que llega fuera del repositorio hace fallar el arranque (P-CM-20 (2)).**
   - Como no existe una vía de lectura fuera del archivo (punto 1), un valor externo nunca puede encender un flag. Para que el intento además **se note**, el prefijo `FEATURE_FLAG_` queda reservado: si al arrancar existe cualquier variable de entorno cuyo nombre empieza con `FEATURE_FLAG_` (sin distinguir mayúsculas), la API y el `worker` **no arrancan**, en cualquier ambiente.
   - El arranque registra el motivo en el registro de la aplicación (evento `feature_flags.invalid`, con el nombre de la variable o del flag y la regla incumplida, sin valores ni datos personales) y termina con error. Cloud Run no envía tráfico a una revisión que no arranca y la revisión anterior sigue atendiendo: es el mismo comportamiento que ya se aceptó para el inventario de rutas (ADR 0009, D38).
   - **Por qué fallar y no "considerarlo apagado":** tratarlo como apagado es silencioso. Quien editó la variable desde la consola o con `gcloud` creería que encendió algo y nadie más se enteraría de que alguien intentó cambiar producción fuera del repositorio. Una revisión que no arranca deja el intento a la vista en el despliegue, sin afectar al servicio en curso.

4. **Barreras para un flag con requisito de código (D69): prueba del CI y arranque que falla (P-CM-20 (3)).**
   - **Constante del requisito:** `OWNERSHIP_TRANSFER_IMPLEMENTED = false`, en `apps/api/src/config/feature-flag-prerequisites.ts`, junto a una tabla `FLAG_PREREQUISITES` que dice qué flag exige qué constante (hoy una fila: `occupancy.end_and_transfer` exige `OWNERSHIP_TRANSFER_IMPLEMENTED`). Solo la rebanada del libro de movimientos la cambia a `true`, en el mismo cambio que agrega el traspaso de GC F-9 y F-13 con TDD y sus pruebas de oro (D51, CM-E6).
   - **Una sola función, dos lugares:** `assertFeatureFlags(config, environment, env)` verifica: (a) el punto 2 (`COMVIVE_ENV` válido); (b) el punto 3 (ninguna variable `FEATURE_FLAG_*`); (c) ningún flag `enabled: true` cuyo requisito esté en falso; y (d) todo flag `enabled: true` trae `enabledOn` con una fecha válida.
     - **Primera barrera, en el CI:** una prueba de Vitest corre (c) y (d) sobre el archivo real para **cada** ambiente. Forma parte de `pnpm run check`, obligatoria para fusionar a `main`: un cambio que encienda `occupancy.end_and_transfer` con la constante en falso no se puede fusionar (CA-CM-26).
     - **Segunda barrera, en el código:** `main.ts` y `main.worker.ts` llaman a la misma función antes de `listen`, junto a `assertRouteInventory`. Si la imagen llega con el flag encendido y la constante en falso (por ejemplo, porque se fusionó saltándose el CI), **la API no arranca** y registra el motivo.
   - **Variante elegida: negarse a arrancar**, no "tratar el flag como apagado". Es la misma razón del punto 3 (un error de configuración en algo que mueve dinero debe ser ruidoso), reutiliza el patrón de ADR 0009 y deja un solo comportamiento que probar. En CA-CM-26 corresponde la rama "la API no arranca y el arranque registra el motivo".
   - **Resultado para las rutas:** con el flag apagado, que es el único estado posible en un ambiente desplegado mientras la constante esté en falso, el término de arriendo y la venta responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` como primera regla de negocio (CM-E6, S-CM-30).
   - **Pruebas automáticas:** reemplazan el puerto `FeatureFlags` con un doble (`overrideProvider`, en `test-support`), que no pasa por `assertFeatureFlags`; así ejercitan los dos estados del flag con la constante en falso (CM-H1). La segunda barrera se prueba aparte, con el archivo real y un ambiente de entrada.

5. **Ninguna ruta lee ni cambia un flag; la web usa un campo de capacidades (P-CM-20 (4)).**
   - No existe ningún endpoint de flags, ni de comunidad ni de plataforma, y ninguna respuesta lleva el nombre ni el valor de un flag (CM-H1, CA-CM-26).
   - **Rebanada 1 (solo API):** no se agrega nada al contrato. La respuesta 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` es la fuente de verdad.
   - **Rebanada web de este módulo (Supuesto (a validar) ADR-0010-S3):** `GET /communities/{communityId}` devuelve un objeto `capabilities` con booleanos por **acción de producto**, no por flag; el primero, `occupancyEndAndTransfer`. Vale verdadero solo si la acción está disponible **y** la persona tiene el permiso (`occupancy.write`); para quien no tiene el permiso, el campo no viaja. La web oculta las acciones de término y venta cuando es falso, y de todos modos trata el 422 como respuesta válida, porque el valor puede cambiar entre la lectura y la acción. El campo entra al contrato OpenAPI con la tarjeta de la web, no antes.

6. **Encender o apagar un flag es un cambio al archivo, aprobado por el líder (regla 10 de `CLAUDE.md`).**
   - Procedimiento: (1) un PR que cambia la entrada del ambiente en `feature-flags.config.ts` (`enabled: true` con su `enabledOn`), con la referencia a la tarjeta que lo justifica; (2) CI en verde, incluida la prueba del punto 4; (3) aprobación del líder del proyecto; (4) despliegue por el flujo normal: primero `staging`, validación, y después `production` con su aprobación explícita. El historial del repositorio es el registro de quién encendió qué y cuándo.
   - Apagar es el mismo camino (o revertir el PR). No hay un interruptor más rápido que un despliegue.
   - **Propietario de código:** `.github/CODEOWNERS` agrega `apps/api/src/config/feature-flag*.ts` con el líder como propietario, igual que `apps/api/src/access/**` (ADR 0009, D36 y D68; la exigencia de revisión se activa cuando exista la cuenta separada de los agentes). Lo aplica el coordinador con la implementación.

7. **Encendido de `platform.admin_first_access_alert` (CM-A5; P-CM-20 (5)). Se implementa con la rebanada "Ingreso e invitaciones", no en la rebanada 1.**
   - **Rebanada 1 (flag apagado):** la transacción del alta de comunidad y la de cada otorgamiento de `admin` **no** encolan el trabajo `membership.admin_first_access_alert` ni crean su `NOTIFICATION_DELIVERY` (enmienda de ADR 0008, inventario, fila 5). No existe ningún trabajo de ese tipo.
   - **Fecha de encendido:** es el `enabledOn` de la entrada del flag en el ambiente, versionado en el repositorio. Nunca se toma del reloj del primer arranque (CM-A5).
   - **Fórmula única de `run_at`:** `startOfDay(máx(enabledOn, fecha del otorgamiento, valid_from) + 8 días)` en hora de Chile. Para una membresía otorgada después del encendido da lo mismo que ADR 0008, fila 5 (el otorgamiento es posterior a `enabledOn`); para una anterior, el plazo de 7 días cuenta desde el encendido (S-CM-27).
   - **Quién encola las membresías anteriores:** un vigía nuevo del barrido de ADR 0008 (decisión 9), `watchdog.admin_first_access_alert_missing`. Con el flag encendido recorre cada comunidad con su contexto y, por cada membresía `admin` no revocada, sin `first_access_at` y sin `first_access_alerted_at`, encola el trabajo con la clave de ADR 0008 (`membership.admin_first_access_alert:<membershipId>`) y la fórmula de arriba. Encolar con una clave existente no hace nada (`ON CONFLICT DO NOTHING`), así que repetirlo cada 5 minutos no duplica trabajos, y una membresía que ya tuvo su alerta queda fuera por `first_access_alerted_at`. Con el flag apagado, el vigía no hace nada.
   - **Pasos del encendido:** (1) la rebanada de ingreso está en "Hecho" en ese ambiente; (2) PR que pone `enabled: true` y `enabledOn` = fecha planificada del despliegue en ese ambiente; si el despliegue se atrasa, se corrige `enabledOn` antes de desplegar; (3) despliegue aprobado; (4) el primer barrido de vigías encola los trabajos; Operaciones verifica en `JOB_RUN` (`items_enqueued`) que corrió, sin leer datos de negocio.
   - **Manejador con el flag apagado:** si el flag se apaga después de haber estado encendido, los trabajos ya encolados terminan sin alertar (resultado `skipped`) y no fijan `first_access_alerted_at`; al volver a encender, el vigía los repone con el `enabledOn` nuevo.

## Pruebas

Con TDD para lo que protege dinero (puntos 3 y 4). Vitest; las del arranque, sobre la función pura `assertFeatureFlags`, sin levantar la aplicación.

1. **Valores por defecto:** con el archivo real, los dos flags están apagados en `local`, `staging` y `production`; un flag ausente de un ambiente se lee apagado.
2. **Primera barrera (CA-CM-26):** una configuración con `occupancy.end_and_transfer` encendido en cualquier ambiente y `OWNERSHIP_TRANSFER_IMPLEMENTED` en falso hace fallar la verificación, con un mensaje que nombra el flag y el ambiente. La prueba sobre el archivo real pasa.
3. **Segunda barrera (CA-CM-26):** `assertFeatureFlags` con esa misma configuración y `COMVIVE_ENV = production` lanza error y registra `feature_flags.invalid`; `main.ts` y `main.worker.ts` la llaman antes de `listen` (prueba de que el proceso termina con error).
4. **Valor externo:** con `FEATURE_FLAG_OCCUPANCY_END_AND_TRANSFER=true` (o cualquier `feature_flag_*`) en el entorno, falla el arranque. Con cualquier otra variable de entorno, los flags resueltos son exactamente los del archivo para ese ambiente (prueba de propiedades sobre el entorno).
5. **Ambiente:** `COMVIVE_ENV` ausente, vacío o desconocido falla; `local` con `K_SERVICE` definido falla.
6. **`enabledOn`:** un flag encendido sin `enabledOn`, o con una fecha inválida, falla en el CI y al arrancar.
7. **Rutas (CA-CM-26):** con el doble de configuración apagado, término y venta responden 422 `OCCUPANCY_ACTION_NOT_AVAILABLE` sin escribir nada; con el doble encendido, siguen sus reglas. Ninguna ruta del inventario devuelve el nombre ni el valor de un flag.
8. **Lint:** importar `feature-flags.config.ts` fuera de `src/config/**` produce error.
9. **Alerta de primer ingreso, flag apagado (rebanada 1; CA-CM-1):** el alta de comunidad y el otorgamiento de `admin` no encolan `membership.admin_first_access_alert` (espía sobre `enqueue`) ni crean `NOTIFICATION_DELIVERY`.
10. **Alerta de primer ingreso, encendido (rebanada de ingreso):** con membresías `admin` otorgadas antes de `enabledOn`, el vigía encola un trabajo por cada una con el `run_at` de la fórmula; repetirlo no duplica; una membresía con primer ingreso, revocada o ya alertada no recibe trabajo; un otorgamiento posterior encola en su transacción con el mismo `run_at` que ADR 0008, fila 5; el aislamiento del vigía sigue las pruebas de ADR 0008 (cada comunidad con su contexto).

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| Solo una sección en `docs/arquitectura.md`, sin ADR | Era la idea de D56 mientras el mecanismo fuera chico. Con D69 hay dos barreras, un arranque que falla y un procedimiento que encola trabajos, con alternativas que conviene dejar registradas (`CLAUDE.md`: "toda decisión técnica relevante queda en `docs/adr/`"). |
| Valor de cada flag en variables de entorno de Cloud Run, definidas por el despliegue desde un archivo del repositorio | Deja una vía de lectura que cualquiera con permiso sobre el servicio puede editar desde la consola o con `gcloud`, que es justo lo que D69 cierra. Compilado en la imagen, no hay vía. |
| Archivo JSON o YAML por ambiente (`config/feature-flags/production.json`) | Hay que copiarlo a la imagen y validarlo en ejecución; un nombre de flag mal escrito se descubre tarde. En TypeScript no compila y la prueba lo importa directo. |
| Flags en una tabla de la base de datos, con una pantalla de Operaciones | Es editable fuera del repositorio y por API, contra D56. Sirve para flags por comunidad, que hoy no existen. |
| Servicio externo de flags (LaunchDarkly, Unleash, Firebase Remote Config) | Sale del stack de `CLAUDE.md`, agrega un proveedor y una dependencia en cada petición, y el valor de producción dejaría de estar en el repositorio. |
| Valor externo "se considera apagado" (la otra opción de D69) | Silencioso: nadie se entera del intento y quien lo hizo cree que funcionó. Fallar el arranque no afecta al servicio en curso y lo deja a la vista. |
| Barrera del código que trata el flag como apagado en vez de impedir el arranque (la otra variante de D69) | Igual de segura para el dinero, pero esconde un error de configuración o un salto del CI. Además obliga a mantener dos comportamientos (apagado por configuración y apagado por la constante) y a probar ambos. |
| Aplicar las barreras solo a `production` | Bastaría declarar otro ambiente (`COMVIVE_ENV`) para saltarlas. La rebanada del libro cambia la constante en el mismo cambio que agrega el traspaso, así que ningún ambiente necesita el flag encendido antes. |
| Que la web descubra la disponibilidad solo con el 422 | Obliga a mostrar un botón que siempre falla o a hacer una petición de prueba. Se mantiene el 422 como fuente de verdad y se agrega el campo de capacidades para la pantalla. |
| Endpoint `GET /feature-flags` para la web | Expone los flags como tales, contra CM-H1, y revela qué está en construcción. |
| Procedimiento único (script) que encola los trabajos de la alerta al encender | Exige un paso manual contra la base de datos de producción en cada ambiente y su propia auditoría. El vigía usa el patrón ya aprobado de ADR 0008, es repetible y además repone un trabajo que se pierda. |
| Guardar el instante de encendido en una tabla al primer arranque | Depende del reloj del primer arranque, que CM-A5 descarta, y agrega una tabla y una escritura al arrancar. `enabledOn` en el repositorio queda versionado y aprobado. |

## Consecuencias

### Positivas

- El valor de cada flag en cada ambiente está en un solo archivo, con historial y aprobación; no hay forma de cambiarlo desde la consola de Google Cloud ni desde la aplicación.
- Un flag que protege dinero no puede llegar encendido a ningún ambiente sin su requisito: ni fusionando (CI) ni desplegando (arranque).
- Patrón repetible para los agentes: agregar un flag es una línea en la lista cerrada, y si tiene requisito, una fila en la tabla de requisitos.
- Las pruebas ejercitan los dos estados sin tocar la configuración real.

### Negativas

- Encender o apagar exige un PR y un despliegue: no hay interruptor inmediato ante un incidente. Se acepta porque en el MVP los flags separan trabajo sin terminar, no experimentos.
- Sin encendido por comunidad: un piloto parcial requiere otro mecanismo y otro ADR.
- `COMVIVE_ENV` es una variable más por ambiente y por servicio.
- El vigía de la alerta agrega una consulta por comunidad cada 5 minutos mientras el flag esté encendido.

### Riesgos

- **Imagen construida fuera de `main`:** una imagen compilada desde otra rama podría traer otro archivo u otra constante. Mitigación: el despliegue sale solo del pipeline de `main` con Workload Identity Federation y aprobación del líder para producción (`docs/arquitectura.md` §6; regla 10). Es el mismo riesgo de cualquier otro código.
- **`enabledOn` que no coincide con el despliegue real:** si queda anterior al despliegue, las alertas de primer ingreso salen antes de los 7 días. Mitigación: el paso 2 del procedimiento del punto 7; el efecto es una alerta adelantada a Operaciones, sin dinero ni accesos.
- **El prefijo reservado es una trampa, no la garantía:** una variable con otro nombre no hace fallar el arranque, pero tampoco tiene efecto, porque no existe vía de lectura (prueba 4).
- **Ambiente mal declarado:** `COMVIVE_ENV = staging` en producción traería los flags de `staging`. Mitigación: las barreras valen en todos los ambientes y Operaciones verifica la variable al crear cada ambiente (`docs/operaciones/`, cuando exista).

## Supuestos (a validar) y preguntas abiertas

- **ADR-0010-S1 · Supuesto (a validar):** los ambientes son tres, con identificadores `local`, `staging` (Pruebas) y `production` (Producción), y CI usa `local`. `docs/operaciones/` no existe todavía; si Operaciones define otros nombres o un ambiente más, se ajustan la lista y este ADR en el mismo cambio.
- **ADR-0010-S2 · Supuesto (a validar):** Cloud Run no envía tráfico a una revisión cuyo contenedor termina con error al arrancar y mantiene la anterior. Es el supuesto que ya usa ADR 0009 (D38); se verifica en el prototipo de despliegue.
- **ADR-0010-S3 · Supuesto (a validar):** la web sabrá si mostrar término y venta con `capabilities.occupancyEndAndTransfer` en `GET /communities/{communityId}`. La spec lo dejó abierto para la rebanada web (R3-m-9); el analista y el diseñador lo confirman con esa tarjeta.
- **Supuestos heredados de la spec:** S-CM-27 (el plazo de la alerta cuenta desde el encendido), S-CM-30 (422 con el flag apagado) y S-CM-31 (mecanismo general).

**Preguntas para el líder del proyecto:**

1. ¿Aprueba que la API y el `worker` **no arranquen** ante un valor de flag llegado fuera del repositorio y ante un flag encendido sin su requisito (puntos 3 y 4), en vez de tratarlo como apagado?
2. ¿Aprueba los nombres de ambiente `local`, `staging` y `production` y la variable `COMVIVE_ENV` (ADR-0010-S1)?
3. ¿Aprueba que el archivo de flags quede bajo propietario de código (punto 6)?
4. `billing.interest` (intereses por mora, `docs/arquitectura.md` §4 y §8, pregunta 5) se nombra como flag desde la Etapa 1. ¿Es por ambiente, como estos, o cada comunidad decide si cobra intereses? Si es por comunidad, no es un feature flag de este ADR sino configuración de cobro, y lo fija la spec de gasto común. **Supuesto (a validar) mientras tanto:** es configuración de la comunidad y no entra en la lista de este ADR.

## Trazabilidad

| Decisión | Spec (`docs/specs/comunidades-y-membresias.md`) | Otros documentos |
| --- | --- | --- |
| 1 y 2. Archivo y ambientes | CM-H1; S-CM-31; P-CM-20 (1); D56, D69 | `docs/arquitectura.md` §6 |
| 3. Valor externo | CM-H1; P-CM-20 (2); D69; CA-CM-26 | ADR 0009, D38 |
| 4. Barreras | CM-E6, CM-H1; P-CM-20 (3); D51, D69; CA-CM-26 | ADR 0004 (traspaso); reglas 2 y 10 de `CLAUDE.md` |
| 5. Web | CM-H1; P-CM-20 (4); R3-m-9 | ADR 0003, decisión 1 |
| 6. Encendido | CM-H1; D56 | Regla 10 de `CLAUDE.md`; ADR 0009, D36 y D68 |
| 7. Alerta de primer ingreso | CM-A5; S-CM-27; P-CM-20 (5); R3-m-7; CA-CM-1 | ADR 0008, inventario (fila 5) y decisiones 3 y 9 |

## Referencias

- `docs/specs/comunidades-y-membresias.md` (rev. 4): CM-A5, CM-E6, CM-H1; S-CM-27, S-CM-30, S-CM-31; P-CM-20; CA-CM-1, CA-CM-26; "Contradicciones y vacíos", puntos 24 y 28; decisiones D51, D56 y D69.
- `docs/revisiones/2026-11-11-spec-comunidades-y-membresias.md`: R2-M-3, R3-M-1, R3-m-7 y R3-m-9.
- `docs/arquitectura.md` §6 (ambientes) y §7.
- ADR 0008 (inventario, fila 5; decisiones 3, 5 y 9) y ADR 0009 (decisión 4 y D38).
- `apps/api/src/config/port.ts` y `trust-proxy-hops.ts` (patrón de validación al arrancar).
- `CLAUDE.md`: metodología (trunk-based development y feature flags) y reglas 2, 5, 6 y 10.
