import { createContext } from 'react'

/** Which topic page the cards belong to, and which card its URL points at (highlighted). Without a provider no link buttons are shown. */
export const AnchorContext = createContext<{
  topicId?: string
  active?: string
  /** the calculator on the page registers a function here that returns its current inputs as a query string, so a card's link carries them */
  shareQuery?: { current?: () => string }
}>({})

/** DOM id of an anchored card */
export const anchorDomId = (anchor: string) => `sec-${anchor}`
export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
