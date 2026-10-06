# Circuit Calculator

An interactive, offline-capable web version of the *Electronics Fundamentals — Formula Reference* cheat sheet (`docs/`).
Every formula is a calculator with a diagram, unit-aware inputs, validation and step-by-step working. All maths runs in the browser.

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm build          # production PWA in dist/ (static files — host anywhere, HTTPS needed for install)
pnpm preview
pnpm test           # unit + contract + UI tests (Vitest)
pnpm e2e:install && pnpm e2e   # Playwright against the production build
pnpm verify         # lint + types + tests + build + e2e
```

## Install as an app
Deploy `dist/` to any static HTTPS host. Android/Chrome: menu → *Install app* (or the in-app banner). iOS Safari: Share → *Add to Home Screen*.
Icons are regenerated from `public/favicon.svg` with `pnpm icons`.

## Adding a formula
See `.claude/skills/add-formula/SKILL.md`. Progress: `docs/TASKS.md`.
