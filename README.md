# Circuit Calculator

An interactive, offline-capable web version of the *Electronics Fundamentals — Formula Reference* cheat sheet (`docs/`).
Every formula is a calculator with a diagram, unit-aware inputs, validation and step-by-step working. All maths runs in your browser — there is no server.

## 🔗 Open the app

**https://wirewedoing.github.io/circuit-calculator/**

Just open the link in any modern browser on a phone, tablet or computer — nothing to install or sign in to.

- **Find a formula:** pick a section in the menu (☰ on phones, the sidebar on wide screens), or press the 🔍 search icon (shortcut: `Ctrl/Cmd + K` or `/`) and type a title.
- **Use it:** choose what to solve for, type your values (pick units like kΩ or µF from the drop-down) and read the result, the diagram and the step-by-step working.
- **Install it as an app:** Android/Chrome → menu → *Install app*. iPhone/iPad Safari → Share → *Add to Home Screen*. After the first visit it also works offline.

## Develop

```bash
pnpm install
pnpm dev            # http://localhost:5173 (hot reload; slower than the real build)
pnpm serve          # production build, served on the network (fast — use this to judge speed)
pnpm test           # unit + contract + UI tests (Vitest)
pnpm e2e:install && pnpm e2e   # Playwright against the production build
pnpm verify         # lint + types + tests + build + e2e
pnpm icons          # regenerate PWA icons from public/favicon.svg
```
 
Adding a formula: see `.claude/skills/add-formula/SKILL.md`. Progress and backlog: `docs/TASKS.md`.

## Deployment (GitHub Pages)

Every push to `main` runs `.github/workflows/deploy.yml`: lint → type-check → tests → build → publish to GitHub Pages.
Pull requests run `.github/workflows/ci.yml` (adds the browser tests).

One-time setup in the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The site is built with relative paths, so it works from the `/circuit-calculator/` sub-path (or any static host).
