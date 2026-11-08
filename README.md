# ComVive

**Español** | [English](README.en.md)

Software de administración de edificios y condominios para Chile.

- **Web** para administradores y comité.
- **App iOS y Android** para residentes y conserjería.

ComVive digitaliza el gasto común, los pagos, la conciliación bancaria y la vida en comunidad, respetando la Ley 21.442 de Copropiedad Inmobiliaria y la Ley 21.719 de datos personales.

## Estado

Etapa 2 · MVP. El diseño de la Etapa 1 está aprobado (2026-11-08); el código de la aplicación se construye en esta etapa. Las Etapas 0 (cimientos) y 1 (diseño) están cerradas.

Etapas: 0 Cimientos → 1 Diseño → 2 MVP → 3 Piloto → 4 Lanzamiento.

## Empezar

1. Instala las herramientas: [docs/guia-instalacion-windows.md](docs/guia-instalacion-windows.md)
2. Instala las dependencias y verifica el código: `corepack enable`, `pnpm install` y `pnpm run check`.
3. Lee [CLAUDE.md](CLAUDE.md): visión, metodología, stack y reglas del proyecto.
4. Revisa el contexto en [docs/contexto/](docs/contexto/).

## Stack

TypeScript en todo el monorepo · NestJS · PostgreSQL + Prisma · Next.js · React Native + Expo · Vitest, fast-check, Playwright, Maestro · GitHub Actions · Google Cloud (región Santiago) · Sentry · Transbank Webpay.

## Estructura

| Carpeta | Contenido |
| --- | --- |
| `apps/api/` | API (NestJS) |
| `packages/shared/` | Tipos y reglas compartidas: montos en CLP y reparto con redondeo (solo la API usa el motor de cálculo) |
| `.claude/agents/` | Equipo de agentes de IA |
| `.github/workflows/` | Integración continua |
| `docs/arquitectura.md` | Componentes, modelo de datos y flujos técnicos |
| `docs/specs/` | Especificaciones por módulo |
| `docs/adr/` | Decisiones de arquitectura |
| `docs/design/` | Mapa de usuarios, flujos, wireframes y design system |
| `docs/qa/` | Plan de pruebas, comunidades simuladas y pruebas de oro |
| `docs/revisiones/` | Informes de revisión crítica y su resolución |
| `docs/contexto/` | Investigación de mercado y plan de puesta en marcha |

## Integración continua

Cada pull request corre el lint de Markdown, la detección de secretos y la verificación de código (formato, lint, tipos, pruebas y compilación). Cada cambio a `main` corre además las pruebas de oro de dinero sin caché. Ningún cambio llega a `main` si alguno falla.

## Idioma

La documentación del proyecto está en español de Chile; el código y los commits, en inglés. Este README se mantiene en ambos idiomas.
