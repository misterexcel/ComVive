# ADR 0001 · Monorepo y herramientas

- **Estado:** Propuesto (requiere aprobación del líder del proyecto)
- **Fecha:** 2026-11-07
- **Propone:** arquitecto de software
- **Decide:** líder del proyecto
- **Relacionados:** ADR 0003 (contratos de API, cliente generado en `packages/shared`)

## Contexto

`CLAUDE.md` fija TypeScript en todo el monorepo, con `apps/api` (NestJS), `apps/web` (Next.js), `apps/mobile` (React Native + Expo, compilado con EAS) y `packages/shared` (tipos y cliente generados desde OpenAPI, validaciones comunes y módulo de cálculo de dinero). `docs/arquitectura.md` §1 define esos componentes, pero deja abierto el gestor de paquetes y el orquestador de tareas (§7, ADR 0001).

Lo que la decisión tiene que resolver:

- Que las cuatro piezas compartan una sola versión de `packages/shared`, sin publicar paquetes a un registro.
- Que CI (GitHub Actions) corra lint, pruebas (Vitest, fast-check, Playwright, Maestro) y compilación solo de lo afectado por un cambio, para mantener ramas cortas (trunk-based).
- Que EAS Build compile la app desde el monorepo sin pasos manuales.
- Que el equipo sea pequeño y los agentes sigan un patrón simple y repetible: pocos archivos de configuración y comandos idénticos en local y en CI.
- Que las dependencias no declaradas (dependencias "fantasma") no lleguen a producción, en especial en la API, que es la única que toca dinero y PostgreSQL.

## Decisión

Se propone **pnpm workspaces como gestor de paquetes y Turborepo como orquestador de tareas**.

- **pnpm** (versión fijada en el campo `packageManager` del `package.json` raíz y en CI con la acción oficial de pnpm). Un solo `pnpm-lock.yaml`. Los paquetes internos se referencian con el protocolo `workspace:*`.
- **Turborepo** con un `turbo.json` que declara las tareas `lint`, `typecheck`, `test`, `build` y `generate` (generación del cliente OpenAPI, ADR 0003), sus dependencias (`generate` antes de `typecheck` y `build`) y sus salidas para el caché.
- **Caché remoto desactivado** en el MVP: se usa el caché local y el caché de GitHub Actions. El caché remoto de Vercel queda fuera porque es un servicio externo al stack (Google Cloud); si hiciera falta, se evalúa en otro ADR.
- **Node.js en una versión LTS única** para todo el monorepo, fijada en `.nvmrc` y en `engines`. La versión concreta se fija al crear el repositorio en la Etapa 2, según la compatibilidad de Expo, Prisma y NestJS de ese momento.
- **Regla de dependencias:** cada paquete declara lo que importa. `apps/web` y `apps/mobile` no pueden depender de `@prisma/client` ni de `apps/api` (regla de lint de importaciones), coherente con "solo la API toca PostgreSQL" (`docs/arquitectura.md` §1).
- **Expo y pnpm:** si Metro o algún módulo nativo no resuelve bien la estructura aislada de `node_modules` de pnpm, se usa `node-linker=hoisted` en `.npmrc` solo para lo que haga falta. Se verifica en el prototipo inicial de la Etapa 2 (ver Riesgos).

## Alternativas consideradas

| Opción | Por qué se descarta |
| --- | --- |
| npm workspaces, sin orquestador | Es lo que ya trae Node (la guía `docs/guia-instalacion-windows.md` instala Node y npm). Pero npm "aplana" `node_modules` y permite dependencias fantasma, y sin orquestador CI corre todo en cada cambio, sin caché ni orden entre tareas. Agregar Turborepo sobre npm resuelve el orden, pero no las dependencias fantasma. |
| Yarn (Berry) workspaces | Plug'n'Play no es compatible de forma confiable con React Native y Metro; con `nodeLinker: node-modules` se pierde su ventaja y queda equivalente a npm, con una herramienta más que aprender. |
| Nx | Muy capaz (grafo de proyectos, generadores, reglas de límites entre módulos), pero agrega plugins, generadores y una configuración extensa que el equipo y los agentes tendrían que aprender y mantener. Para cuatro paquetes, Turborepo con un solo `turbo.json` es suficiente. Se puede migrar más adelante sin cambiar la estructura de carpetas. |
| Repositorios separados (polyrepo) | Obliga a publicar `packages/shared` y sincronizar versiones del contrato OpenAPI entre repositorios; contradice el monorepo de `CLAUDE.md`. |

## Consecuencias

### Positivas

- Instalación rápida y estricta: un paquete solo ve lo que declara, lo que evita que una dependencia de la web termine usándose en la API por accidente.
- CI ejecuta solo lo afectado (`turbo run test --filter=...[origin/main]`) y reutiliza el caché, lo que acorta el ciclo de las ramas cortas.
- Un patrón único para agentes y personas: `pnpm install`, `pnpm turbo run <tarea>`.
- EAS Build y Cloud Run detectan pnpm por el archivo de bloqueo.

### Negativas

- El equipo tiene que instalar pnpm además de Node (se actualiza la guía de instalación en la Etapa 2, en un commit aparte; este ADR no la edita).
- Dos herramientas nuevas (pnpm y Turborepo) en lugar de una incluida en Node.

### Riesgos

- **Compatibilidad de Expo y Metro con pnpm:** mitigación con `node-linker=hoisted` si el prototipo lo exige. Se prueba una compilación de EAS al inicio de la Etapa 2, antes de escribir funcionalidades.
- **Caché incorrecto:** una tarea con salidas mal declaradas podría saltarse una prueba. Mitigación: las pruebas de oro y de aislamiento corren siempre en `main` sin caché (job aparte en CI), porque la regla 2 de `CLAUDE.md` no admite falsos verdes en montos.
- **Prisma en el monorepo:** el cliente se genera dentro de `apps/api`; se valida en el mismo prototipo.

## Supuestos (a validar) y preguntas abiertas

- **ADR-0001-S1 · Supuesto (a validar):** el caché remoto no es necesario en el MVP; el tiempo de CI con caché local y de GitHub Actions es aceptable para comunidades simuladas. Se revisa si CI supera 10 minutos por cambio.
- **ADR-0001-S2 · Supuesto (a validar):** Expo funciona con pnpm, con `node-linker=hoisted` como respaldo. Se confirma con el prototipo de la Etapa 2.
- No hay preguntas abiertas de la spec ni de `docs/arquitectura.md` §8 vinculadas a esta decisión.

## Referencias

- `docs/arquitectura.md` §1 (componentes y monorepo) y §7 (ADR recomendados, 0001).
- `CLAUDE.md`: Stack, reglas 2 y 9, sección "Integración continua".
- `docs/specs/gasto-comun.md`: regla C-6 y pruebas de oro (CA-1 a CA-4) que deben correr sin caché.
