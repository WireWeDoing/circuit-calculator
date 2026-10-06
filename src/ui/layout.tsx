import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

/** Horizontal flex row with gap. (MUI 9 removed Stack's system props, so layout lives here.) */
export function Row({ gap = 1, align = 'center', wrap = false, sx, children }: { gap?: number; align?: 'center' | 'flex-start' | 'flex-end' | 'baseline'; wrap?: boolean; sx?: SxProps<Theme>; children: ReactNode }) {
  return <Box sx={[{ display: 'flex', alignItems: align, gap, flexWrap: wrap ? 'wrap' : 'nowrap' }, ...(Array.isArray(sx) ? sx : [sx])]}>{children}</Box>
}
