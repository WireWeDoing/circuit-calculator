import { useEffect, useId, useMemo, useRef, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import ListItemIcon from '@mui/material/ListItemIcon'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import useMediaQuery from '@mui/material/useMediaQuery'
import { normalize, search, searchIndex, type SearchEntry } from '../formulas/search.ts'
import { BOOK_ICONS } from './icons.tsx'
import { TopicIcon } from './topicIcons.tsx'

/** the part of `title` that matches the query is shown in bold */
function Highlighted({ title, query }: { title: string; query: string }) {
  const tokens = normalize(query).split(' ').filter(Boolean)
  if (!tokens.length) return <>{title}</>
  const lower = title.toLowerCase() // matched on the visible text so apostrophes etc. keep positions aligned
  const marks = new Array<boolean>(title.length).fill(false)
  for (const t of tokens) { let i = lower.indexOf(t); while (i >= 0) { for (let k = i; k < i + t.length; k++) marks[k] = true; i = lower.indexOf(t, i + t.length) } }
  const parts: Array<{ text: string; on: boolean }> = []
  for (let i = 0; i < title.length; i++) { const last = parts[parts.length - 1]; if (last && last.on === marks[i]) last.text += title[i]; else parts.push({ text: title[i]!, on: marks[i]! }) }
  return <>{parts.map((p, i) => (p.on ? <Box key={i} component="mark" sx={{ bgcolor: 'transparent', color: 'primary.main', fontWeight: 800 }}>{p.text}</Box> : <span key={i}>{p.text}</span>))}</>
}

/** Search-by-title dialog. Parts, chapters and topics; arrow keys + Enter; Esc closes. */
export function SearchDialog({ open, onClose, onOpenResult }: { open: boolean; onClose: () => void; onOpenResult?: () => void }) {
  const fullScreen = useMediaQuery('(max-width: 599.95px)')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()
  const listRef = useRef<HTMLUListElement>(null)

  const hits = useMemo(() => search(query), [query])
  const browsing = !query.trim()
  // with no query: show the chapters as a starting point
  const entries: SearchEntry[] = useMemo(() => (browsing ? searchIndex().filter((e) => e.kind === 'chapter') : hits), [browsing, hits])
  const safeActive = Math.min(active, Math.max(entries.length - 1, 0))

  useEffect(() => { listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest' }) }, [safeActive, entries])

  const go = (e: SearchEntry | undefined) => {
    if (!e) return
    window.location.hash = e.href
    onOpenResult?.()
    onClose()
  }
  const onKeyDown = (ev: React.KeyboardEvent) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); setActive(Math.min(safeActive + 1, entries.length - 1)) }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); setActive(Math.max(safeActive - 1, 0)) }
    else if (ev.key === 'Home' && ev.ctrlKey) { setActive(0) }
    else if (ev.key === 'Enter') { ev.preventDefault(); go(entries[safeActive]) }
  }

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby={`${listId}-title`}
      slotProps={{ transition: { onExited: () => { setQuery(''); setActive(0) } }, paper: { sx: fullScreen ? {} : { position: 'fixed', top: 72, m: 0, maxHeight: 'calc(100% - 96px)' } } }}>
      <Box sx={{ p: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography id={`${listId}-title`} component="h2" className="sr-only">Search chapters and topics</Typography>
        <TextField
          autoFocus fullWidth type="search" label="Search by title" placeholder="e.g. capacitors, ohm, 555, LED…"
          value={query} onChange={(e) => { setQuery(e.target.value); setActive(0) }} onKeyDown={onKeyDown}
          slotProps={{
            input: { startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> },
            htmlInput: { role: 'combobox', 'aria-expanded': true, 'aria-controls': listId, 'aria-autocomplete': 'list', 'aria-activedescendant': entries.length ? `${listId}-${safeActive}` : undefined, 'data-testid': 'search-input', autoComplete: 'off', enterKeyHint: 'go' },
          }}
        />
        <IconButton aria-label="Close search" onClick={onClose} data-testid="search-close"><CloseIcon /></IconButton>
      </Box>
      <Typography role="status" variant="caption" color="text.secondary" sx={{ px: 2.5 }} data-testid="search-status">
        {browsing ? 'Type to search chapter and topic titles — or pick a chapter.' : `${hits.length} result${hits.length === 1 ? '' : 's'}`}
      </Typography>
      <Box component="ul" id={listId} ref={listRef} role="listbox" aria-label={browsing ? 'Chapters' : 'Search results'} data-testid="search-results" sx={{ listStyle: 'none', m: 0, p: 1, overflowY: 'auto', flex: 1 }}>
        {entries.map((e, i) => {
          const selected = i === safeActive
          const BookIcon = e.kind === 'topic' ? undefined : BOOK_ICONS[e.id]
          return (
            <Box component="li" key={`${e.kind}-${e.id}`} id={`${listId}-${i}`} role="option" aria-selected={selected} data-testid={`result-${e.kind}-${e.id}`}
              onMouseMove={() => setActive(i)} onClick={() => go(e)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, minHeight: 52, py: 0.75, borderRadius: 2, cursor: 'pointer', bgcolor: selected ? 'action.selected' : 'transparent', boxShadow: selected ? (t) => `inset 4px 0 0 ${t.palette.primary.main}` : 'none' }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'text.secondary' }}>{e.kind === 'topic' ? <TopicIcon id={e.id} size={28} /> : BookIcon ? <BookIcon aria-hidden="true" /> : null}</ListItemIcon>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: e.kind === 'topic' ? 500 : 700, overflowWrap: 'anywhere' }}><Highlighted title={e.title} query={query} /></Typography>
                <Typography variant="caption" color="text.secondary">{e.where}</Typography>
              </Box>
            </Box>
          )
        })}
        {!browsing && entries.length === 0 && (
          <Box component="li" role="presentation" data-testid="search-empty" sx={{ p: 3, textAlign: 'center' }}>
            <Typography>No chapter or topic title matches “{query.trim()}”.</Typography>
            <Typography variant="body2" color="text.secondary">Try a shorter word, e.g. “cap”, “ohm” or “led”.</Typography>
          </Box>
        )}
      </Box>
    </Dialog>
  )
}
