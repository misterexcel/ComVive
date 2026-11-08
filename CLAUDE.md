# ComVive

Software de administración de edificios y condominios para Chile. Web para administradores y comité; app iOS y Android para residentes y conserjería.

Este archivo es la fuente de verdad para todos los agentes. Léelo completo antes de cualquier tarea.

## Visión

ComVive digitaliza el gasto común, los pagos, la conciliación y la vida en comunidad de edificios y condominios. Compite con Edifito y ComunidadFeliz. Se diferencia por migración asistida, cierre de mes rápido, precio simple y notificaciones por WhatsApp.

Quien compra es el administrador (multi-comunidad). Quien más usa la app es el residente.

## Roles

- **Líder del proyecto:** dueño del producto. Prioriza el backlog, aprueba especificaciones, casos de prueba y cada paso a producción. Ningún entregable avanza sin su aprobación.
- **Claude (coordinador):** reparte el trabajo entre los agentes de `.claude/agents/`, integra entregas y mantiene este archivo y `docs/` al día.
- **Agentes:** ver `.claude/agents/`. Cada agente trabaja solo dentro de su rol.

## Etapa actual

**Etapa 2 · MVP.** Objetivo: construir el MVP en rebanadas verticales (base de datos → API → web/app → pruebas) desde el diseño aprobado de la Etapa 1, con TDD en todo lo que mueve dinero o datos de otra comunidad. Primera tarjeta: ADR 0008 "Tareas en segundo plano" (decisión del líder D14), **aceptado el 2026-11-08** tras tres pasadas de revisión crítica (decisiones D22 a D31); con eso se cumple su condición para que Webpay pase a "Lista para desarrollo". La spec de gasto común rev. 9 quedó aprobada el mismo día. Hito de cierre: MVP aprobado por el líder del proyecto en el ambiente de pruebas.

**Etapa 1 · Diseño: cerrada el 2026-11-08** con la aprobación en bloque del líder del proyecto (ADR 0001 a 0007, arquitectura, spec de gasto común rev. 8, design system, wireframes y QA). Quedan para antes del Piloto los supuestos marcados **(a validar)** y las preguntas P-55 y P-56.

Etapas: 0 Cimientos (cerrada) → 1 Diseño (cerrada) → 2 MVP → 3 Piloto → 4 Lanzamiento. Cada etapa cierra con un hito aprobado por el líder del proyecto. No trabajamos con plazos; trabajamos por etapas.

Por ahora se trabaja con **comunidades pequeñas simuladas** (`docs/qa/comunidades-simuladas.md`). El segmento comercial se define más adelante.

**Fase de prueba y desarrollo:** donde falte una definición legal o contable, no se bloquea el avance. Se toma el supuesto más realista posible, investigado (ley, práctica en Chile, competidores), se marca como **Supuesto (a validar)** con su fuente y se registra como pregunta abierta. Los supuestos se validan con contador y abogado antes del Piloto.

## Metodología

Kanban con desarrollo guiado por especificaciones.

Flujo del tablero: Backlog → Especificación → Lista para desarrollo → En desarrollo → En revisión → Validación → Hecho.

- **Lista para desarrollo:** especificación aprobada en `docs/specs/`, criterios de aceptación en formato Dado / Cuando / Entonces, casos de prueba revisados.
- **Hecho:** pruebas en verde, revisión cruzada y de seguridad aprobadas, documentación actualizada, validación del líder del proyecto en el ambiente de pruebas.
- Pocas tarjetas en curso a la vez.
- Entregas en rebanadas verticales: base de datos → API → web/app → pruebas.
- Pruebas primero (TDD) en todo lo que mueve dinero o datos de otra comunidad: gasto común (incluidos redondeo, saldos y periodos cerrados), intereses por mora, imputación de pagos (incluido Webpay), conciliación, permisos y aislamiento.
- Cada revisión crítica queda en `docs/revisiones/AAAA-MM-DD-<entregable>.md`, con sus hallazgos y cómo se resolvió cada uno.
- Trunk-based development con ramas cortas y feature flags.
- Toda decisión técnica relevante queda en `docs/adr/`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Lenguaje | TypeScript en todo el monorepo |
| API | NestJS |
| Base de datos | PostgreSQL + Prisma |
| Web | Next.js |
| App | React Native + Expo (EAS para compilar y publicar) |
| Pruebas | Vitest, fast-check, Playwright (web), Maestro (app) |
| CI | GitHub Actions |
| Nube | Google Cloud, región Santiago (Cloud Run, Cloud SQL) |
| Monitoreo | Sentry |
| Pagos | Transbank Webpay |

## Reglas no negociables

1. **Dinero:** montos en CLP como enteros. Nunca `float` ni decimales para dinero. Valores en UF se guardan aparte con su fecha.
2. **Pruebas de oro:** ningún cambio que afecte un monto se acepta si falla `docs/qa/` o sus pruebas automáticas.
3. **Redondeo:** la suma de los cargos de un periodo siempre iguala el total emitido. La diferencia por redondeo se asigna con una regla documentada en la especificación.
4. **Aislamiento:** toda consulta a datos de negocio filtra por comunidad. Ningún usuario ve datos de otra comunidad. Cada endpoint nuevo lleva su prueba de aislamiento.
5. **Saldos:** se calculan desde un libro de movimientos (cargos y abonos). Nunca un campo de saldo editable.
6. **Periodos cerrados** son inmutables. Las correcciones se hacen con ajustes en el periodo siguiente.
7. **Datos personales:** RUT, deudas y datos de visitas se tratan según la Ley 21.719. Solo lo mínimo necesario, acceso por rol y registro de auditoría.
8. **Normativa:** el diseño respeta la Ley 21.442 de Copropiedad Inmobiliaria y su reglamento. Ante dudas legales, se deja una pregunta abierta para el líder del proyecto y, mientras tanto, un supuesto documentado y marcado como tal (ver "Fase de prueba y desarrollo"); nunca un supuesto implícito.
9. **Secretos:** nunca en el código ni en commits. Solo variables de entorno o Google Secret Manager (credenciales por comunidad, como Webpay; ver ADR 0007).
10. **Sin aprobación no hay producción.**

## Convenciones

- Idioma: código, nombres de variables y commits en inglés; documentación, especificaciones y textos de la interfaz en español de Chile.
- README bilingüe: `README.md` (español) y `README.en.md` (inglés) se actualizan siempre juntos, en el mismo commit.
- Commits con formato Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`).
- Especificaciones: una por módulo en `docs/specs/<modulo>.md`, con la plantilla de `docs/specs/_plantilla.md`.
- ADR: `docs/adr/NNNN-titulo.md`.

## Glosario

- **Gasto común:** cobro mensual a cada unidad por los gastos de la comunidad.
- **Alícuota:** porcentaje de participación de cada unidad en los gastos comunes.
- **Fondo de reserva:** aporte separado para gastos extraordinarios o urgentes.
- **Comité de administración:** copropietarios elegidos que supervisan al administrador.
- **Conciliación:** cruce de los pagos registrados con los movimientos de la cartola bancaria.
- **Cartola:** extracto de movimientos de la cuenta bancaria de la comunidad.

## Mapa del repositorio

```text
CLAUDE.md               este archivo
.claude/agents/         definición de cada agente
.github/workflows/      integración continua (lint de Markdown y detección de secretos)
docs/arquitectura.md    componentes, modelo de datos y flujos técnicos
docs/specs/             especificaciones por módulo
docs/adr/               decisiones de arquitectura
docs/design/            flujos, wireframes, design system
docs/qa/                plan de pruebas, comunidades simuladas, pruebas de oro
docs/revisiones/        informes del revisor crítico y su resolución
docs/operaciones/       ambientes y procedimientos (desde la Etapa 2)
docs/contexto/          investigación de mercado y plan de puesta en marcha
apps/api | web | mobile se crean en la Etapa 2
packages/shared         se crea en la Etapa 2
```

## Integración continua

Cada pull request y cada cambio a `main` corre `.github/workflows/ci.yml`. Para revisar la documentación en local antes de subir: `npx markdownlint-cli2@0.17.2` (con `--fix` corrige lo automático).
