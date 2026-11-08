# Guía de instalación en Windows

Herramientas para trabajar en ComVive desde Windows 10 u 11. Abre **PowerShell** y ejecuta cada comando. `winget` viene incluido en Windows.

## 1. Herramientas base

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id Docker.DockerDesktop -e
winget install --id GitHub.cli -e
```

Cierra y vuelve a abrir PowerShell, y verifica:

```powershell
git --version
node --version
npm --version
docker --version
gh --version
```

Docker Desktop pide activar WSL 2 la primera vez: acepta y reinicia si lo solicita.

## 2. Configurar Git y GitHub

```powershell
git config --global user.name "Tu Nombre"
git config --global user.email "tu-correo@ejemplo.com"
git config --global core.autocrlf input
gh auth login
```

`core.autocrlf input` evita problemas de fin de línea entre Windows y los servidores Linux de la nube.

## 3. Clonar el repositorio

```powershell
cd $HOME
gh repo clone misterexcel/ComVive
cd ComVive
code .
```

### Dependencias del monorepo

El código usa **pnpm** (la versión exacta está en `packageManager` de `package.json`) y **Turbo**. Node debe ser la versión 24 indicada en `.nvmrc`: si `node --version` muestra otra, instala la versión de `.nvmrc`. Corepack viene con Node y descarga la versión correcta de pnpm. Abre PowerShell **como administrador** solo para el primer comando:

```powershell
corepack enable
pnpm install
pnpm run check
```

`pnpm run check` corre lint, revisión de tipos, pruebas y compilación de todos los paquetes, lo mismo que la integración continua. `pnpm run format` aplica el formato de Prettier.

## 4. Instalar Claude Code

Sigue la guía oficial de instalación para Windows: <<https://docs.claude.com/en/docs/claude-code/setup>>

Luego, dentro de la carpeta del repositorio:

```powershell
claude
```

Claude Code lee `CLAUDE.md` y los agentes de `.claude/agents/` automáticamente.

## 5. Extensiones recomendadas de VS Code

- ESLint
- Prettier
- Prisma
- Docker
- GitLens
- Markdown Preview Mermaid Support

## 6. Conectar GitHub con Claude en la web

Para que Claude pueda trabajar en el repositorio desde claude.ai: **Configuración → Conectores → GitHub**, con acceso a `misterexcel/ComVive`.
