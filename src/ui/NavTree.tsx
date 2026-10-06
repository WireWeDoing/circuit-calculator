import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import { formulaById } from '../formulas/index.ts'
import { chapterById, chapterOf, PARTS, type Chapter } from '../learn/book.ts'
import { BOOK_ICONS } from './icons.tsx'
import { hrefChapter, hrefPart, hrefTopic } from './router.ts'
import { TopicIcon } from './topicIcons.tsx'

/*
 * Performance notes (this tree has ~170 rows):
 *  - rows are plain elements styled by the .nav-* rules in index.css — no per-row styled-components / `sx`
 *  - rows are memoised, so toggling one branch or changing the current page re-renders only the rows that changed
 *  - expand/collapse is instant (children are mounted/unmounted); no height animation to measure and tween
 */

const KEY = 'nav-open-book'
const read = (): string[] | null => { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as string[]) : null } catch { return null } }
const write = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } }

/** test hook: set `navHooks.onRender` to count how often each kind of row renders (see tests/performance.test.tsx) */
export const navHooks: { onRender?: (kind: 'leaf' | 'part' | 'chapter') => void } = {}

/** where the current page sits in the book: its part and chapter (both open in the tree) */
export interface Here { partId?: string; chapterId?: string; topicId?: string }

/** remembered open ids, plus whatever is needed to show the current page */
function initialOpen(here: Here): Set<string> {
  const open = new Set(read() ?? [])
  if (here.partId) open.add(here.partId)
  if (here.chapterId) open.add(here.chapterId)
  return open
}

/** part / chapter of a page, from whatever the route gives */
export function locate(page: { part?: string; chapter?: string; topic?: string }): Here {
  const chapter = page.topic ? chapterOf(page.topic) : page.chapter ? chapterById(page.chapter) : undefined
  return { partId: chapter?.partId ?? page.part, chapterId: chapter?.id, topicId: page.topic }
}

const Chevron = memo(function Chevron({ id, label, open, controls, onToggle }: { id: string; label: string; open: boolean; controls: string; onToggle: (id: string) => void }) {
  return (
    <button type="button" className="nav-chev" aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`} aria-expanded={open} aria-controls={controls} onClick={() => onToggle(id)} data-testid={`toggle-${id}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={open ? 'M7 10l5 5 5-5z' : 'M10 7l5 5-5 5z'} fill="currentColor" /></svg>
    </button>
  )
})

const Leaf = memo(function Leaf({ id, title, current, onNavigate }: { id: string; title: string; current: boolean; onNavigate?: () => void }) {
  navHooks.onRender?.('leaf')
  return (
    <li>
      <a className={`nav-row nav-leaf${current ? ' is-current' : ''}`} href={hrefTopic(id)} onClick={onNavigate} aria-current={current ? 'page' : undefined} data-testid={`nav-topic-${id}`}>
        <span className="nav-icon"><TopicIcon id={id} size={28} /></span>
        <span className="nav-text">{title}</span>
      </a>
    </li>
  )
})

/** a chapter: renders its own leaves from primitive props, so memo() really skips it when nothing it shows changed */
const ChapterRow = memo(function ChapterRow({ chapter, open, selected, currentTopic, listId, onToggle, onNavigate }: { chapter: Chapter; open: boolean; selected: boolean; currentTopic?: string; listId: string; onToggle: (id: string) => void; onNavigate?: () => void }) {
  navHooks.onRender?.('chapter')
  const Icon = BOOK_ICONS[chapter.id]
  const label = `${chapter.number} ${chapter.title}`
  return (
    <li data-testid={`nav-chapter-${chapter.id}`}>
      <div className="nav-parent">
        <a className={`nav-row nav-chapter${selected ? ' is-current' : ''}`} href={hrefChapter(chapter.id)} onClick={onNavigate} aria-current={selected ? 'page' : undefined}>
          {Icon && <span className="nav-icon nav-icon-section" data-testid={`nav-icon-${chapter.id}`}><Icon aria-hidden="true" /></span>}
          <span className="nav-text"><span className="nav-num">{chapter.number}</span> {chapter.title}</span>
        </a>
        <Chevron id={chapter.id} label={label} open={open} controls={`${listId}-${chapter.id}`} onToggle={onToggle} />
      </div>
      {open && (
        <ul className="nav-list" id={`${listId}-${chapter.id}`} aria-label={`${chapter.title} topics`}>
          {chapter.items.map((id) => <Leaf key={id} id={id} title={formulaById(id)?.title ?? id} current={currentTopic === id} onNavigate={onNavigate} />)}
        </ul>
      )}
    </li>
  )
})

const PartRow = memo(function PartRow({ id, number, title, open, selected, openChapters, currentChapter, currentTopic, listId, onToggle, onNavigate }: { id: string; number: string; title: string; open: boolean; selected: boolean; openChapters: string; currentChapter?: string; currentTopic?: string; listId: string; onToggle: (id: string) => void; onNavigate?: () => void }) {
  navHooks.onRender?.('part')
  const Icon = BOOK_ICONS[id]
  const chapters = PARTS.find((p) => p.id === id)!.chapters
  const opened = openChapters.split(',')
  return (
    <li data-testid={`nav-part-${id}`}>
      <div className="nav-parent">
        <a className={`nav-row nav-section nav-part${selected ? ' is-current' : ''}`} href={hrefPart(id)} onClick={onNavigate} aria-current={selected ? 'page' : undefined}>
          {Icon && <span className="nav-icon nav-icon-section" data-testid={`nav-icon-${id}`}><Icon aria-hidden="true" /></span>}
          <span className="nav-text">{`${number}. ${title}`}</span>
        </a>
        <Chevron id={id} label={title} open={open} controls={`${listId}-${id}`} onToggle={onToggle} />
      </div>
      {open && (
        <ul className="nav-list" id={`${listId}-${id}`} aria-label={`${title} chapters`}>
          {chapters.map((c) => (
            <ChapterRow key={c.id} chapter={c} open={opened.includes(c.id)} selected={currentChapter === c.id && !currentTopic}
              currentTopic={currentChapter === c.id ? currentTopic : undefined} listId={listId} onToggle={onToggle} onNavigate={onNavigate} />
          ))}
        </ul>
      )}
    </li>
  )
})

/**
 * Hierarchical sidebar in reading order: part → chapter (with its icon) → topic.
 * Parents expand/collapse with their chevron button; the name still links to the part / chapter page.
 * The branch holding the current page is always opened, and the open/closed state is remembered.
 */
export function NavTree({ here, onNavigate }: { here: Here; onNavigate?: () => void }) {
  const { partId, chapterId, topicId } = here
  const base = useId()
  const root = useRef<HTMLElement>(null)
  const clickedHere = useRef(false) // the user clicked a row in this tree → it is visible already
  const [open, setOpen] = useState<Set<string>>(() => initialOpen(here))

  // reveal the page you are on whenever it changes (state adjusted while rendering — no effect needed)
  const key = `${partId ?? ''}/${chapterId ?? ''}/${topicId ?? ''}`
  const [seen, setSeen] = useState(key)
  if (seen !== key) {
    setSeen(key)
    const need = [partId, chapterId].filter((x): x is string => !!x && !open.has(x))
    if (need.length) setOpen(new Set([...open, ...need]))
  }
  useEffect(() => { write([...open]) }, [open])
  // Keep the highlighted page visible when the tree appears or the page changes — NOT on every expand/collapse.
  // Cheap on purpose: an IntersectionObserver tells us (without forcing a layout) whether the row is fully in view,
  // and only when it is not do we measure once and scroll the sidebar's own scroller. (element.scrollIntoView()
  // and a synchronous getBoundingClientRect() each forced a whole-page layout on every navigation.)
  useEffect(() => {
    if (clickedHere.current) { clickedHere.current = false; return }
    const el = root.current?.querySelector<HTMLElement>('[aria-current="page"]')
    const scroller = root.current?.closest<HTMLElement>('.MuiDrawer-paper') ?? root.current
    if (!el || !scroller) return
    const center = () => {
      const r = el.getBoundingClientRect(), c = scroller.getBoundingClientRect()
      if (r.top >= c.top + 8 && r.bottom <= c.bottom - 8) return
      scroller.scrollTop += r.top - c.top - (c.height - r.height) / 2
    }
    if (typeof IntersectionObserver === 'undefined') {
      const frame = requestAnimationFrame(center)
      return () => cancelAnimationFrame(frame)
    }
    const io = new IntersectionObserver(([entry]) => { io.disconnect(); if (entry && entry.intersectionRatio < 1) center() }, { root: scroller, threshold: 1 })
    io.observe(el)
    return () => io.disconnect()
  }, [partId, chapterId, topicId])

  const toggle = useCallback((id: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n }), [])

  return (
    <nav aria-label="Book contents" ref={root} className="nav-tree" onClickCapture={(e) => { if ((e.target as HTMLElement).closest?.('a.nav-row')) clickedHere.current = true }}>
      <ul className="nav-list nav-root">
        <li><a className={`nav-row${!partId ? ' is-current' : ''}`} href="#/" onClick={onNavigate} aria-current={!partId ? 'page' : undefined}><span className="nav-text">Home</span></a></li>
        {PARTS.map((p) => (
          <PartRow key={p.id} id={p.id} number={p.number} title={p.title} open={open.has(p.id)} selected={partId === p.id && !chapterId}
            openChapters={p.chapters.filter((c) => open.has(c.id)).map((c) => c.id).join(',')}
            currentChapter={partId === p.id ? chapterId : undefined} currentTopic={partId === p.id ? topicId : undefined}
            listId={base} onToggle={toggle} onNavigate={onNavigate} />
        ))}
      </ul>
      <p className="nav-foot">{PARTS.length} parts · {PARTS.reduce((n, p) => n + p.chapters.length, 0)} chapters</p>
    </nav>
  )
}
