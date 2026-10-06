import { createContext } from 'react'

/** Which topic page the cards belong to, and which card its URL points at (highlighted). Without a provider no link buttons are shown. */
export const AnchorContext = createContext<{ topicId?: string; active?: string }>({})

/** DOM id of an anchored card */
export const anchorDomId = (anchor: string) => `sec-${anchor}`
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
