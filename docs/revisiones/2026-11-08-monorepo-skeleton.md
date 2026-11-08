# Revisión crítica: esqueleto del monorepo y módulo de dinero

- **Fecha:** 2026-11-08
- **Revisor:** agente `revisor-critico` (informe guardado por el coordinador, porque el revisor no tiene herramienta de escritura)
- **Base revisada:** rama `chore/monorepo-skeleton`:
  - `packages/shared/src/money/{clp,largest-remainder}{,.test}.ts` y `packages/shared/src/index.ts`;
  - configuración raíz: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.mjs`, `.gitignore`, `.gitattributes`, `.nvmrc`, `.prettierignore`;
  - `apps/api/**` y `.github/workflows/ci.yml`.
- **Contrastado con:** `CLAUDE.md` (reglas 1 a 4 y 9); `docs/specs/gasto-comun.md` rev. 9 (B-6, C-1 a C-6, S-3); ADR 0001; ADR 0003, decisión 2; ADR 0004, decisión 7; `docs/arquitectura.md` §1, §2 y §4; `docs/qa/comunidades-simuladas.md`; `docs/qa/casos/gasto-comun.md` (TC-GC-CB-01 a CB-11, PROP-GC-01 a PROP-GC-10).
- **Veredicto:** **Aprobado con cambios.**
  - Sin bloqueantes. El algoritmo implementa exactamente C-3: parte entera `(T × w) div W` y resto `(T × w) mod W` en `bigint`, los pesos faltantes a los mayores restos, empate al menor `sort_order`; la suma iguala el total, el orden de salida es el de entrada y no hay `number` en productos intermedios.
  - Verificado a mano el fondo de la Comunidad D ($43.828): restos 956.660, 758.504, 548.292 y 736.544 dan 8.211, 10.660, 11.254 y 13.703, igual que "Paso 2" de `comunidades-simuladas.md`.
  - Una unidad con peso 0 nunca recibe un peso extra: la suma de los restos es `faltantes × W` y cada resto es menor que W.
  - Cubiertos los casos borde fijos: sin unidades, todos los pesos en 0 y total $0.
  - No se aprueba tal cual por la trazabilidad falsa de la prueba de oro (M-2), los casos de prioridad 1 faltantes (M-3) y porque CI no ejecuta estas pruebas (M-1).

## Bloqueante

Ninguno.

## Mayor

### M-1. CI no ejecuta lint, tipos, pruebas ni compilación

- **Dónde:** `.github/workflows/ci.yml`: solo jobs `docs` (markdownlint) y `secrets` (Gitleaks).
- **Evidencia:** el archivo anuncia que "en la Etapa 2 se suman build, tipos y pruebas del monorepo". ADR 0001 pide que CI corra lint, pruebas y compilación, y que las pruebas de oro corran siempre en `main` sin caché, en un job aparte. `turbo.json` declara `test` con `outputs: []`, así que Turbo puede reutilizar un resultado del caché.
- **Por qué importa:** es el primer PR con código que calcula montos. La regla 2 solo se cumple si CI corre esas pruebas.
- **Propuesta:**
  1. Job `check`: `actions/checkout`, `pnpm/action-setup` (versión de `packageManager`), `actions/setup-node` con `node-version-file: .nvmrc` y `cache: pnpm`; `pnpm install --frozen-lockfile`, `pnpm run format:check` y `pnpm run check`.
  2. Job `money-gold`, solo en `push` a `main`: `pnpm turbo run test --filter=@comvive/shared --force`.
  3. Alinear el job `docs` a `.nvmrc` (hoy Node 22).
  4. Marcar `check` como obligatorio en la protección de `main` (lo hace el líder en GitHub).
- **Responsable:** devops.

### M-2. La prueba dice cubrir GOLD-D-01 a GOLD-D-04, pero solo verifica el reparto del fondo

- **Dónde:** `largest-remainder.test.ts`, líneas 37 a 51.
- **Evidencia:** GOLD-D-01 a 04 son los **totales** por unidad ($172.427, $223.851, $236.341 y $287.752). La prueba solo verifica el Paso 2 (fondo). El Paso 1 (ordinario $876.543: 164.216, 213.191, 225.087 y 274.049) no se prueba. Ninguna prueba usa B, C ni CE, todos repartos puros que el módulo ya resuelve: GOLD-B-01 a 03 ($100.000 en partes iguales, con empate), GOLD-C-01 a 05 ($1.234.567 por alícuota), GOLD-CE-01 a 05 (ordinario $1.175.778 y fondo $58.789 por separado, con el empate real del Depto 22 contra el Depto 31, resto 690.000).
- **Por qué importa:** las pruebas de oro se rastrean por ID (regla 2); una prueba que declara un ID que no verifica da cobertura falsa. GOLD-CE detecta el reparto del total combinado en vez de cuenta por cuenta (C-6).
- **Propuesta:** renombrar la prueba actual a "Comunidad D, Paso 2 · fondo (CA-4)"; agregar GOLD-B-01 a 03, GOLD-C-01 a 05, Comunidad D Paso 1, GOLD-D-01 a 04 como suma de los dos repartos y GOLD-CE-01 a 05 (distintos de GOLD-C en los Deptos 21 y 31). Fijar los totales del fondo ($43.828 y $58.789) como constantes, porque el techo D-3 aún no existe en código.
- **Responsable:** ingeniero-qa y desarrollador del módulo.

### M-3. Faltan casos unitarios de prioridad 1 y propiedades del catálogo

- **Dónde:** `largest-remainder.test.ts`, bloque `properties` y generadores.
- **Evidencia:**
  - No existen TC-GC-CB-11 (T = 9.999.999.999, pesos 999.999 y 1 → $9.999.989.999 y $10.000), CB-02 ($2 entre 3 → 1, 1, 0), CB-07 (`sort_order` 20, 10, 30 → $33.334 al de 10) ni la parte de reparto de CB-01 ($3 entre 3 → 1, 1, 1; fondo $1 a la Casa 1).
  - Faltan PROP-GC-06 (desempate), PROP-GC-07 (invariancia a la escala de pesos) y PROP-GC-08 (pesos extra menos que unidades con `w > 0`).
  - Los generadores llegan a 40 unidades (la guía pide 1 a 50) y no tienen la familia de pesos 0 a 1.000, que produce empates. Ninguna propiedad fuerza empates.
  - Las propiedades 4 y 5 sí prueban lo que dicen.
- **Propuesta:** agregar CB-01, CB-02, CB-07 y CB-11 con los valores exactos de la guía; agregar PROP-GC-06, 07 y 08; generadores hasta 50 unidades, `fc.oneof` con pesos 0 a 1.000 y 0 a 1.000.000 y un generador que duplique pesos; nombrar cada propiedad con su ID.
- **Responsable:** ingeniero-qa y desarrollador del módulo.

## Menor

1. **`sortOrder` sin validar como entero seguro** (`largest-remainder.ts`): `NaN` o `Infinity` dejan el comparador inconsistente. Rechazar con `RangeError` todo valor que no cumpla `Number.isSafeInteger` y probarlo. Desarrollador.
2. **`clpFromJson` acepta negativos por defecto** (`clp.ts`), contra ADR 0003, decisión 2 (rango `0..MAX_SAFE_INTEGER`; campos con signo en lista cerrada). Separar `clpFromJson` (no negativo) y `signedClpFromJson`, con pruebas de −1 y −0. Desarrollador.
3. **El motor de cálculo queda disponible para web y app** (`packages/shared/src/index.ts`), contra `arquitectura.md` §1. Publicar el reparto en un subpath (`@comvive/shared/money-engine`) y prohibirlo en `apps/web/**` y `apps/mobile/**` con `no-restricted-imports`. Desarrollador.
4. **Falta lint contra flotantes en `packages/shared/src/money/**`:** `parseFloat`, `Math.round`/`floor`/`ceil`, `.toFixed` y literales con decimales en `no-restricted-syntax`. El `Number(total - allocated)` es legítimo (un conteo): comentario de excepción o conteo en `bigint`. Desarrollador.
5. **La API envía `X-Powered-By: Express` y no valida `PORT`** (`apps/api/src/main.ts`). Desactivar el encabezado y probarlo; fallar al arrancar si `PORT` no es entero entre 1 y 65535. Desarrollador.
6. **`/health` sin documentar y sin guard por defecto:** anotar `/health` en `arquitectura.md` §2 como ruta técnica sin datos y abrir una tarjeta para el guard global de denegación por defecto, con lista blanca de rutas públicas, antes del primer endpoint de negocio. Arquitecto.
7. **Inyección por constructor en Vitest:** el transformador puede no emitir `design:paramtypes`. Agregar una prueba con un provider inyectado; si falla, configurar `unplugin-swc`. Desarrollador.
8. **`.gitattributes` y `.gitignore` incompletos:** `*.pdf binary` y `.claude/worktrees/` en `.gitignore`. Devops.
9. **La documentación no refleja el monorepo:** `README.md`, `README.en.md`, `docs/guia-instalacion-windows.md` y `CLAUDE.md` ("Mapa del repositorio", "Integración continua"). Coordinador.
10. **El tope de B-6 no se aplica en el reparto:** documentar en el JSDoc que lo valida quien llama. Desarrollador.

## Preguntas para el líder del proyecto

1. **Prototipo de EAS antes del código de dinero** (ADR 0001, "Riesgos"): ¿se acepta fijar Node 24.22.2 ahora y validar Expo y Prisma después, con el riesgo de rehacer el lockfile y CI?
2. **Alcance de este PR:** ¿los jobs `check` y `money-gold` de M-1 entran en este mismo PR? Recomendación del revisor: sí.
3. **Protección de `main`:** ¿se activa en GitHub `check` como obligatorio?
4. **Ubicación del módulo de dinero:** ¿en `packages/shared` con uso restringido a la API por lint (menor 3), o en `apps/api/src/**/domain`?

**Decisiones del líder (2026-11-08):**

- **D32 (pregunta 1):** se fija Node 24.22.2 como Supuesto (a validar); Expo (EAS) y Prisma se validan en sus propias rebanadas, y si no calzan se cambia la versión y el lockfile.
- **D33 (pregunta 2):** los jobs `check` y `money-gold` entran en este mismo PR.
- **D34 (pregunta 3):** se activa `check` como verificación obligatoria para fusionar a `main`; la configura el coordinador con `gh`.
- **D35 (pregunta 4):** el reparto sigue en `packages/shared`, publicado en el subpath `@comvive/shared/money-engine` y prohibido por lint en `apps/web/**` y `apps/mobile/**`; los tipos de CLP siguen en el paquete raíz.

## Resolución

| Hallazgo | Estado | Cómo se resolvió |
| --- | --- | --- |
| M-1 CI | Resuelto | `ci.yml`: job "Verificación de código" (`check`: `pnpm install --frozen-lockfile`, `format:check` y `check`) en cada PR y en `main`; job "Pruebas de oro de dinero" (`money-gold`: `turbo run test --filter=@comvive/shared --force`) en cada cambio a `main`; `docs` con Node de `.nvmrc`. El coordinador dejó `cancel-in-progress` solo para PR, para que un cambio seguido a `main` no cancele las pruebas de oro del anterior. La protección de `main` (D34) se activa al fusionar |
| M-2 Pruebas de oro | Resuelto | `gold.test.ts`: GOLD-B-01 a 03, GOLD-C-01 a 05, Comunidad C por cuenta (Paso 1 y Paso 2 con el empate de resto 690.000 que gana el Depto 22), GOLD-CE-01 a 05 (con su diferencia contra GOLD-C: solo Deptos 21 y 31), Comunidad D Paso 1 y Paso 2 (CA-4) y GOLD-D-01 a 04 como suma de los dos repartos. Totales del fondo como constantes (techo D-3 sin código). Ningún valor difiere de `docs/qa` |
| M-3 Casos y propiedades | Resuelto | TC-GC-CB-01 (parte de reparto), CB-02, CB-07 y CB-11; PROP-GC-01, 02, 03, 05, 06, 07 y 08 con su ID; generadores de 1 a 50 unidades, familias de pesos 0 a 1.000 y 0 a 1.000.000 y generador de empates. Prueba de mutación del coordinador: con el desempate invertido fallan 12 pruebas, entre ellas PROP-GC-06 y GOLD-B y GOLD-CE |
| Menor 1 `sortOrder` | Resuelto | `RangeError` si no es entero seguro; comparador sin resta; `largest-remainder.validation.test.ts` |
| Menor 2 `clpFromJson` | Resuelto | `clpFromJson` solo `0..MAX_SAFE_INTEGER`; `signedClpFromJson` para la lista cerrada de campos con signo; pruebas de −1 y −0 |
| Menor 3 Motor de cálculo (D35) | Resuelto | Subpath `@comvive/shared/money-engine`; el índice raíz solo exporta CLP; `no-restricted-imports` lo prohíbe en `apps/web/**` y `apps/mobile/**`, también por ruta relativa o `dist` |
| Menor 4 Lint contra flotantes | Resuelto | `no-restricted-syntax` en `packages/shared/src/money/**`: `parseFloat`, `Math.round`/`floor`/`ceil`/`trunc`, `.toFixed` y literales con decimales (pruebas excluidas, justificado); el conteo pasó a `bigint` |
| Menor 5 API | Resuelto | `configureApp` desactiva `X-Powered-By` (probado); `parsePort` exige entero 1 a 65535 y corta el arranque si no |
| Menor 6 `/health` y guard | Resuelto | `arquitectura.md` §2: lista cerrada de rutas técnicas sin sesión con `GET /health`, y tarjeta pendiente del arquitecto para el guard global de denegación por defecto antes del primer endpoint de negocio |
| Menor 7 Inyección en Vitest | Resuelto | `dependency-injection.test.ts`: `design:paramtypes` presente y provider resuelto con el transformador por defecto; no hizo falta `unplugin-swc` |
| Menor 8 `.gitattributes` y `.gitignore` | Resuelto | `*.pdf binary` y `.claude/worktrees/` |
| Menor 9 Documentación | Resuelto | `README.md` y `README.en.md` (mismo commit), `docs/guia-instalacion-windows.md` (pnpm con Corepack y `pnpm run check`) y `CLAUDE.md` (mapa del repositorio e integración continua) |
| Menor 10 Tope de B-6 | Resuelto | JSDoc de `allocateLargestRemainder`: el tope lo valida quien llama |
