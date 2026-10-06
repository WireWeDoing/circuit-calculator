# Circuit Calculator

Interactive PWA version of `docs/Electronics_Formulas_Cheat_Sheet.pdf`. 100% client-side.

- Stack: React 19, TypeScript, Vite, MUI 9 (MUI MCP in `.mcp.json`), vite-plugin-pwa, Vitest, Playwright.
- Book order: `src/learn/book.ts` (parts → chapters → topic ids). Every topic must be placed there exactly once; ids are permanent URLs (`#/part|chapter|topic/<id>`) — never rename. Cards on topic pages are `AnchorCard`s (`ui/anchors.tsx`): each has a stable anchor id and a link button (`#/topic/<id>/<card>`); use `AnchorCard` instead of `Card` for new sections.
- Formulas: `src/formulas/*` (data-driven; see the **add-formula** skill). Reference pages use `Formula.article`. Engine: `src/core/engine.ts`. Diagrams: `src/visuals`. UI: `src/ui`.
- Commands: `pnpm dev` · `pnpm test` · `pnpm e2e` (builds + serves prod bundle) · `pnpm lint` · `pnpm verify` (everything).
- MUI 9 note: Stack/Typography system props (alignItems, fontWeight…) are gone — use `sx` or `ui/layout.tsx` `Row`.
- Task tracking: `docs/TASKS.md`.

## Performance rules (measured, guarded by tests)
- Judge speed on the production build (`pnpm serve` = build + preview, listens on the network). `pnpm dev` is 3–6× slower (React dev build, StrictMode double render, unbundled modules).
- Long lists (sidebar ~170 rows, chapter pages, search) use plain elements + CSS classes, not MUI components with `sx`. Memoise rows and pass primitive props (a `children` prop defeats `memo`).
- Never call `element.scrollIntoView()` or read layout (`getBoundingClientRect`) synchronously on navigation; use IntersectionObserver.
- Don't use MUI `<Tabs>` or `<Collapse>` on hot paths (they measure layout / animate heights).
- Profile with a CDP CPU profile at 4× throttle; budgets live in `e2e/performance.spec.ts`, render counts in `tests/performance.test.tsx`.
