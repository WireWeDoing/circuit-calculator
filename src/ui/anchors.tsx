import { useContext, type ReactNode } from 'react'
import LinkIcon from '@mui/icons-material/Link'
import Card, { type CardProps } from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import { AnchorContext, anchorDomId } from './anchorContext.ts'
import { hrefOf } from './router.ts'
import { absoluteUrl, copyText } from './share.ts'
import { useToast } from './useToast.ts'

/**
 * A card with its own permanent link: a small link button in the top-right corner copies
 * `…/#/topic/<topic>/<anchor>`, which opens the page scrolled to this card.
 */
export function AnchorCard({ id, label, children, sx, ...rest }: Omit<CardProps, 'id'> & { id: string; label: string; children: ReactNode }) {
  const { topicId, active, shareQuery } = useContext(AnchorContext)
  const notify = useToast()
  const linked = active === id
  const copy = async () => {
    if (!topicId) return
    const ok = await copyText(absoluteUrl(hrefOf({ page: 'topic', id: topicId, anchor: id, query: shareQuery?.current?.() || undefined })))
    notify(ok ? `Link to “${label}” copied` : 'Could not copy — copy the address from the browser bar')
  }
  return (
    <Card variant="outlined" id={anchorDomId(id)} data-anchor={id} data-linked={linked || undefined}
      sx={[{ position: 'relative', scrollMarginTop: '80px', '& .MuiCardContent-root > h2:first-of-type': { pr: topicId ? 5 : 0 } }, linked && { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}` }, ...(Array.isArray(sx) ? sx : [sx])]} {...rest}>
      {topicId && (
        <IconButton onClick={copy} aria-label={`Copy link to ${label}`} title="Copy link to this section" data-testid={`share-${id}`}
          sx={{ position: 'absolute', top: 2, right: 2, width: 44, height: 44, color: 'text.secondary', zIndex: 1 }}>
          <LinkIcon />
        </IconButton>
      )}
      {children}
    </Card>
  )
}
