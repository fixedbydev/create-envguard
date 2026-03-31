# create-envguard

Scaffold [envguard](https://github.com/fixedbydev/envguard) into any Node.js project in one command.

## Quick Start

```bash
npx create-envguard
```

That's it. The interactive wizard will:

1. Detect your framework (Next.js, NestJS, Vite, Express, or plain Node)
2. Ask about Docker/Kubernetes usage
3. Install the right `@stacklance/envguard-*` packages
4. Create `env.schema.ts` with framework-appropriate defaults
5. Create `.env.example` from your existing `.env`
6. Add `env-guard check` to your `predev` and `prebuild` scripts
7. Add `.env` to `.gitignore`

## Framework-Specific Setup

### Next.js

```bash
npx create-envguard --framework next
```

Creates a schema with `NEXT_PUBLIC_*` pattern support.

### NestJS

```bash
npx create-envguard --framework nestjs
```

Installs `@stacklance/envguard-nestjs` and creates a schema with `PORT` and `DATABASE_URL`.

### Vite

```bash
npx create-envguard --framework vite
```

Creates a schema with `VITE_*` prefix support.

### Express

```bash
npx create-envguard --framework express
```

### Plain Node.js

```bash
npx create-envguard --framework node
```

## Non-Interactive Mode

Use the `add` subcommand to skip prompts:

```bash
npx create-envguard add
npx create-envguard add --framework next
npx create-envguard add --framework nestjs --docker --k8s
```

## Flags

| Flag | Description |
| --- | --- |
| `--framework <name>` | `next`, `nestjs`, `vite`, `express`, `node` |
| `--docker` | Include `@stacklance/envguard-docker` |
| `--k8s` | Include `@stacklance/envguard-k8s` |
| `--skip-install` | Skip package installation |
| `--dry-run` | Show what would be done without writing files |

## What It Creates

```
your-project/
├── env.schema.ts          ← Zod schema for your env vars
├── .env.example           ← .env with values stripped
├── .gitignore             ← .env added if missing
└── package.json           ← predev/prebuild scripts added
```

## Package Manager Support

Automatically detects and uses your project's package manager:
- npm
- pnpm
- yarn
- bun

## License

MIT
