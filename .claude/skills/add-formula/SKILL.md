---
name: add-formula
description: Add a new calculation formula (or a new mode of an existing one) to the Circuit Calculator PWA. Use when the user asks to add/extend a formula, calculator, cheat-sheet entry or problem. Covers definition, validation criteria, visual, tests and verification.
---

# Adding a formula

The app is **data-driven**: a formula is one `Formula` object. The UI, search, navigation, validation, diagrams, and the generic test-suite pick it up automatically. Do not write per-formula UI.

## 0. Before you start
1. Find the formula in `docs/Electronics_Formulas_Cheat_Sheet.pdf` (`pdftotext -layout`) — or get the source from the user. **Take the worked example from the source; never invent expected values.**
2. Pick the section file in `src/formulas/` (`s01.ts` … `s17b.ts`). Section ids live in `src/formulas/sections.ts`.
3. Check `docs/TASKS.md`; tick/add the row when done.

## 1. Define it
```ts
export const myFormula = defineFormula({
  id: 'kebab-unique-id', section: 's5', title: 'Plain name', page: 6,
  equation: 'f = 1 / T',                       // as printed
  meaning: 'Plain-English meaning (from the sheet).',
  analogy: 'Optional newcomer analogy (water pipes, swing…).',
  fields: [ field('f', 'f', 'Frequency', 'frequency', { sign: 'pos', description: '…' }), … ],
  unitsNote: 'UNITS & CONVERSION text from the sheet.',
  exampleText: 'Worked example text from the sheet.',
  visual: 'period',                            // key in src/visuals/index.ts
  concepts: ['ln'],                            // glossary ids (src/core/glossary.ts) for scary symbols
  modes: [ mode({ id, inputs, outputs, equation, compute, check?, warn?, steps, examples }) ],
})
```
Export it in the section array (`export const s05 = [...]`) — `formulas/index.ts` already spreads sections. A brand-new file must also be added to `FORMULAS` in `formulas/index.ts`.

Rules:
- **`compute` works in BASE units** (V, A, Ω, F, H, Hz, s, W, m, J, C). The engine converts user prefixes (kΩ, µF…) before calling it. Never convert inside `compute`, except where the formula itself needs it (e.g. FSPL km/MHz).
- One mode per "solve for" (and per alternative method, e.g. P1 method A/B). Add reverse modes if the sheet gives them.
- `steps` returns human sentences with the real numbers (use `N()` for plain numbers, `S(dim, x)` for values with units). Explain *why* for complex steps (reciprocal, flip, KVL/KCL…). Never print NaN/undefined.
- Use `mode.warn` for advice (round to E12, 2× rating, regulators) — never for errors.

## 2. Validation criteria (this is what reviewers check)
Every input must be rejected, with a clear message, when physically/mathematically invalid. The engine enforces what you declare:
- `sign: 'pos'` for anything that is divided by, is a ratio's denominator, a log/√ argument, or physically >0 (R, C, L, f, T, Vref, hFE…).
- `sign: 'nonneg'` where 0 is legitimate (series R, current, Vin, Cstray).
- `sign: 'any'` (default) only where negative is meaningful (KVL, dI, X, dB, temperature).
- `integer: true`, `min`/`max` for bits, counts, Γ ≤ 1, εr ≥ 1.
- **Cross-field rules go in `mode.check`** and must return a message that tells the user what to re-measure: Rt < R1 for reverse parallel, I > V/R1, Vsupply > Vf, ton ≤ T, PF ≤ 1, ln-argument > 1, Vout < Vin, radicand ≥ 0, V < Vs for charging time, etc.
- Division by zero / infinity / NaN must never reach the screen: if a divide can be zero, either `sign: 'pos'` or a `check`.
- Don't "fix" bad input silently (no clamping, no abs()).
- Numerically ill-conditioned subtraction (Ct − C1 with huge ratios) is inherent — document in `unitsNote`, don't hide.
- Lists (`list: true`): set `listMin`/`listMax`; per-item validation reports "value n".

## 3. Visual (required — every formula has a diagram)
Reuse an id from `src/visuals/index.ts` if one fits (series-R, divider, rc-charge, resonance, sine, …). Otherwise add a component in `src/visuals/*.tsx` built from `kit.tsx` (`Diagram`, `Two`, `Wire`, `Plot`, `Arrow`, `Txt`, `Caption`) and register it. Visuals receive live `v` (inputs), `o` (outputs) and must **render with partial/empty inputs** (fallback to symbols with `fv(dim, x, 'R1')`) and never output NaN. Keep an accessible `title` sentence that explains the picture.

## 3b. Per-part breakdown (when the formula has several components)
If the answer splits across parts (resistors, capacitors, LED strings, branches), add `breakdown: (v, o, l) => BreakdownRow[]` to the mode (helpers in `src/core/breakdown.ts`: series/parallel R and C). Rows carry whichever of `V, I, P, Q, E, share` apply. Then register how to read the table in `TABLES` in `src/formulas/index.ts` (`share` label + which columns `sums`). The UI shows the table and the network diagrams annotate each part automatically. Add a supply-voltage / total-current mode so the numbers appear. Tests: add a conservation-law check (KVL/KCL/energy) in `tests/breakdown.test.ts`.

## 3c. Current arrows (circuit diagrams)
Draw each current with `<FlowArrow x y dir len name signed? />` from `visuals/kit.tsx`, placed right beside the part with its value as text. `dir` is the **conventional** direction (leaves the battery's +, so draw sources with + on top: `Two kind="V"` puts + at its *first* point); the component flips it for electron-flow mode and for a negative `signed` value. Pass `name` (part label) — tests read `data-part` / `data-dir`. Add the visual id to `FLOW_VISUALS` in `visuals/index.ts` so the conventional/electron switch appears. Keep everything inside the viewBox (use `Diagram padTop` if a label sits over a rail near the top) — the e2e test fails on clipped or overlapping labels.

## 4. Tests (required)
- `examples` on every mode: ≥ 1 with inputs/outputs **from the source document** (label it `§N …`); add `tol` (e.g. `0.002`) when the sheet rounds. Add an inverse example for design modes.
- The generic suites (`tests/registry.test.ts`, `tests/ui.test.tsx`, `e2e/formulas.spec.ts`) then automatically check: metadata, examples, missing-input, NaN/∞/negative/zero rejection, no non-finite output, steps without NaN, page renders a diagram, "use example" works, no console errors, no horizontal scroll.
- Add an **independent** check in `tests/identities.test.ts` where physics gives one (round-trip with its inverse, equals another formula, conservation law, limiting case such as equal resistors → R/2). Use the helpers `run()`, `status()`, `rng()`, `logu()`, `close()`. Pick well-conditioned ranges.
- Add a negative test (`status(...).status === 'invalid'`) for each `check` you wrote.
- Custom tool (not a plain calculator)? put logic in `src/core/*.ts` with unit tests in `tests/core.test.ts`, UI in `src/ui/tools.tsx`, and register in `TOOLS`.

## 5. Verify (must all pass)
```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm e2e   # e2e builds + serves the production bundle
```
Then look at the page once (`pnpm dev`, or screenshot via Playwright) on a 390px-wide viewport: no overlap, no sideways scroll, labels readable.
Finally update `docs/TASKS.md`.

## Common mistakes
- Forgetting the reciprocal flip in parallel-type formulas.
- Typing example values in prefixed units — examples are in **base units**.
- Using `fmtNum` text in input fields (use `toInputText`).
- Lists max out at 12 rows (`DEFAULT_LIST_MAX`) — the diagrams are laid out for that.
- A mode whose output key is also an input key (the contract test rejects it).
- New visual id not registered → registry test fails.
