import { useEffect, useState } from 'react'
import { chapterOf } from '../learn/book.ts'
import { SECTIONS } from '../formulas/sections.ts'

/**
 * Every page has one permanent URL (hash routing, so it works offline and on a static host such as GitHub Pages):
 *   #/                      home
 *   #/part/<part id>        a part of the book
 *   #/chapter/<chapter id>  a chapter
 *   #/topic/<topic id>      a calculator, worked problem or reference page
 *   #/topic/<topic id>/<section>  the same page, scrolled to one of its cards (what the card's link button copies)
 * Anything after "?" is kept as `query` (the calculator inputs of a shared link — see `shareState.ts`).
 * Old cheat-sheet links (#/f/<id>, #/s/<section>) still resolve — see `legacyTarget`.
 */
export type Route =
  | { page: 'home'; query?: string }
  | { page: 'part'; id: string; query?: string }
  | { page: 'chapter'; id: string; query?: string }
  | { page: 'topic'; id: string; anchor?: string; query?: string }

export const hrefPart = (id: string) => `#/part/${encodeURIComponent(id)}`
export const hrefChapter = (id: string) => `#/chapter/${encodeURIComponent(id)}`
export const hrefTopic = (id: string) => `#/topic/${encodeURIComponent(id)}`

export function hrefOf(r: Route): string {
  const base = r.page === 'home' ? '#/' : r.page === 'part' ? hrefPart(r.id) : r.page === 'chapter' ? hrefChapter(r.id) : r.anchor ? `${hrefTopic(r.id)}/${encodeURIComponent(r.anchor)}` : hrefTopic(r.id)
  return r.query ? `${base}?${r.query}` : base
}

const decode = (s: string) => { try { return decodeURIComponent(s) } catch { return s } }

/** an old cheat-sheet URL → the page that replaced it (a section opens the chapter that holds its main topic) */
function legacyTarget(kind: string, id: string): Route | undefined {
  if (kind === 'f') return { page: 'topic', id }
  if (kind === 's') {
    const hero = SECTIONS.find((s) => s.id === id)?.hero
    const chapter = hero ? chapterOf(hero) : undefined
    return chapter ? { page: 'chapter', id: chapter.id } : { page: 'home' }
  }
  return undefined
}

/** `legacy` is set when the URL was an old cheat-sheet link, so the address bar can be rewritten to the new one */
export function parseHash(hash: string): Route & { legacy?: boolean } {
  const raw = hash.replace(/^#\/?/, '')
  const q = raw.indexOf('?')
  const path = q >= 0 ? raw.slice(0, q) : raw
  const query = q >= 0 ? raw.slice(q + 1) || undefined : undefined
  const [kind, id, anchor] = path.split('/').filter(Boolean).map(decode)
  const withQuery = <R extends Route>(r: R): R => (query ? { ...r, query } : r)
  if (id && kind === 'topic') return withQuery(anchor ? { page: 'topic', id, anchor } : { page: 'topic', id })
  if (id && (kind === 'part' || kind === 'chapter')) return withQuery({ page: kind, id })
  const old = id && kind ? legacyTarget(kind, id) : undefined
  if (old) return { ...withQuery(old), legacy: true }
  return withQuery({ page: 'home' })
}

const read = (): Route => {
  const { legacy, ...route } = parseHash(window.location.hash)
  // rewrite old links in place (no extra history entry) so copying the address always gives the permanent URL
  if (legacy) history.replaceState(history.state, '', hrefOf(route))
  return route
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(read)
  useEffect(() => {
    const on = () => setRoute(read())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
