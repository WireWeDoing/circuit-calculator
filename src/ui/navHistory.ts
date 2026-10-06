import { formulaById, SECTIONS } from '../formulas/index.ts'
import { hrefFormula, hrefSection, type Route } from './router.ts'

/** How many previously opened pages the Back button remembers. */
export const MAX_HISTORY = 3

export const routeKey = (r: Route): string => (r.page === 'home' ? 'home' : `${r.page}:${r.id}`)
export const routeHref = (r: Route): string => (r.page === 'home' ? '#/' : r.page === 'section' ? hrefSection(r.id) : hrefFormula(r.id))

/** Human name of a page, for "Back to …". Unknown pages get a neutral name. */
export function routeLabel(r: Route): string {
  if (r.page === 'home') return 'Home'
  if (r.page === 'section') { const s = SECTIONS.find((x) => x.id === r.id); return s ? s.title : 'Section' }
  return formulaById(r.id)?.title ?? 'Page'
}

/**
 * The page you just left goes on top of the stack (most recent last). The stack holds at most MAX_HISTORY pages —
 * the oldest falls off — and the same page is never stacked twice in a row.
 */
export function pushHistory(stack: Route[], left: Route): Route[] {
  const top = stack[stack.length - 1]
  if (top && routeKey(top) === routeKey(left)) return stack
  return [...stack, left].slice(-MAX_HISTORY)
}

/** Back: take the most recent page off the stack. */
export function popHistory(stack: Route[]): { target: Route | undefined; rest: Route[] } {
  if (!stack.length) return { target: undefined, rest: stack }
  return { target: stack[stack.length - 1], rest: stack.slice(0, -1) }
}
