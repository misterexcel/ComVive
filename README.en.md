# ComVive

[Español](README.md) | **English**

Property management software for residential buildings and condominiums in Chile.

- **Web app** for property managers and the owners' committee.
- **iOS and Android app** for residents and front-desk staff.

ComVive digitizes common expenses (*gasto común*), payments, bank reconciliation and community life, in compliance with Chile's Condominium Law (Ley 21.442) and Personal Data Protection Law (Ley 21.719).

## Status

Stage 1 · Design. There is no application code yet; Stage 0 (foundations) is complete.

Stages: 0 Foundations → 1 Design → 2 MVP → 3 Pilot → 4 Launch.

## Getting started

1. Install the tools: [docs/guia-instalacion-windows.md](docs/guia-instalacion-windows.md) (Spanish)
2. Read [CLAUDE.md](CLAUDE.md): vision, methodology, stack and project rules (Spanish).
3. Review the background material in [docs/contexto/](docs/contexto/).

## Stack

TypeScript across the monorepo · NestJS · PostgreSQL + Prisma · Next.js · React Native + Expo · Vitest, fast-check, Playwright, Maestro · GitHub Actions · Google Cloud (Santiago region) · Sentry · Transbank Webpay.

## Repository layout

| Folder | Contents |
| --- | --- |
| `.claude/agents/` | AI agent team definitions |
| `.github/workflows/` | Continuous integration |
| `docs/arquitectura.md` | Components, data model and technical flows |
| `docs/specs/` | Per-module specifications |
| `docs/adr/` | Architecture decision records |
| `docs/design/` | User map, flows, wireframes and design system |
| `docs/qa/` | Test plan, simulated communities and golden tests |
| `docs/revisiones/` | Critical review reports and how each was resolved |
| `docs/contexto/` | Market research and launch plan |

## Continuous integration

Every pull request runs a Markdown lint and a secret scan. Nothing reaches `main` if either check fails.

## Language

Project documentation is written in Chilean Spanish; code and commit messages are in English. This README is maintained in both languages.
