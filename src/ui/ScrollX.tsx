import type { ReactNode } from 'react'
import Box from '@mui/material/Box'

/** Horizontally scrollable wrapper (wide tables on phones). Focusable so keyboard users can scroll it (WCAG 2.1.1). */
export function ScrollX({ label, children }: { label: string; children: ReactNode }) {
  return <Box role="region" aria-label={label} tabIndex={0} sx={{ overflowX: 'auto' }}>{children}</Box>
}
