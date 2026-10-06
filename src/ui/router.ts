import { useEffect, useState } from 'react'

export type Route =
  | { page: 'home' }
  | { page: 'section'; id: string }
  | { page: 'formula'; id: string }

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (parts[0] === 's' && parts[1]) return { page: 'section', id: decodeURIComponent(parts[1]) }
  if (parts[0] === 'f' && parts[1]) return { page: 'formula', id: decodeURIComponent(parts[1]) }
  return { page: 'home' }
}
export const hrefFormula = (id: string) => `#/f/${encodeURIComponent(id)}`
export const hrefSection = (id: string) => `#/s/${encodeURIComponent(id)}`

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))
  useEffect(() => {
    const on = () => setRoute(parseHash(window.location.hash))
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
