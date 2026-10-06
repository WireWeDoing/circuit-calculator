import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Formula } from '../core/types.ts'
import { SECTIONS, topicsOf } from '../formulas/index.ts'
import { SECTION_ICONS } from './icons.tsx'
import { hrefFormula, hrefSection } from './router.ts'
import { TopicIcon } from './topicIcons.tsx'

/*
 * Performance notes (this tree has ~140 rows):
 *  - rows are plain elements styled by the .nav-* rules in index.css — no per-row styled-components / `sx`
 *  - rows are memoised, so toggling one branch or changing the current page re-renders only the rows that changed
 *  - expand/collapse is instant (children are mounted/unmounted); no height animation to measure and tween
 */

const KEY = 'nav-open'
const read = (): string[] | null => { try { const v = localStorage.getItem(KEY); return v ? (JSON.parse(v) as string[]) : null } catch { return null } }
const write = (ids: string[]) => { try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* private mode */ } }

/** test hook: set `navHooks.onRender` to count how often each kind of row renders (see tests/nav-performance.test.tsx) */
export const navHooks: { onRender?: (kind: 'leaf' | 'section' | 'group') => void } = {}

/** remembered open ids, plus whatever is needed to show the current page */
function initialOpen(sectionId?: string, formulaId?: string): Set<string> {
  const open = new Set(read() ?? [])
  if (sectionId) {
    open.add(sectionId)
    const group = formulaId ? topicsOf(sectionId).find((t) => t.formulas.some((f) => f.id === formulaId))?.group?.id : undefined
    if (group) open.add(group)
  }
  return open
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
      <a className={`nav-row nav-leaf${current ? ' is-current' : ''}`} href={hrefFormula(id)} onClick={onNavigate} aria-current={current ? 'page' : undefined} data-testid={`nav-topic-${id}`}>
        <span className="nav-icon"><TopicIcon id={id} size={28} /></span>
        <span className="nav-text">{title}</span>
      </a>
    </li>
  )
})

/** a sub-section: renders its own leaves from primitive props, so memo() really skips it when nothing it shows changed */
const GroupRow = memo(function GroupRow({ id, title, open, listId, formulas, currentTopic, onToggle, onNavigate }: { id: string; title: string; open: boolean; listId: string; formulas: Formula[]; currentTopic?: string; onToggle: (id: string) => void; onNavigate?: () => void }) {
  navHooks.onRender?.('group')
  return (
    <li>
      <div className="nav-group">
        <button type="button" className="nav-row nav-group-title" onClick={() => onToggle(id)} tabIndex={-1} aria-hidden="true"><span className="nav-text">{title}</span></button>
        <Chevron id={id} label={title} open={open} controls={`${listId}-${id}`} onToggle={onToggle} />
      </div>
      {open && <ul className="nav-list" id={`${listId}-${id}`}>{formulas.map((f) => <Leaf key={f.id} id={f.id} title={f.title} current={currentTopic === f.id} onNavigate={onNavigate} />)}</ul>}
    </li>
  )
})

const SectionRow = memo(function SectionRow({ id, number, title, open, selected, currentTopic, openGroups, listId, onToggle, onNavigate }: { id: string; number: string; title: string; open: boolean; selected: boolean; currentTopic?: string; openGroups: string; listId: string; onToggle: (id: string) => void; onNavigate?: () => void }) {
  navHooks.onRender?.('section')
  const Icon = SECTION_ICONS[id]
  return (
    <li data-testid={`nav-section-${id}`}>
      <div className="nav-parent">
        <a className={`nav-row nav-section${selected ? ' is-current' : ''}`} href={hrefSection(id)} onClick={onNavigate} aria-current={selected ? 'page' : undefined}>
          {Icon && <span className="nav-icon nav-icon-section" data-testid={`nav-icon-${id}`}><Icon aria-hidden="true" /></span>}
          <span className="nav-text">{`${number}. ${title}`}</span>
        </a>
        <Chevron id={id} label={title} open={open} controls={`${listId}-${id}`} onToggle={onToggle} />
      </div>
      {open && (
        <ul className="nav-list" id={`${listId}-${id}`} aria-label={`${title} topics`}>
          {topicsOf(id).map((t) => t.group
            ? <GroupRow key={t.group.id} id={t.group.id} title={t.group.title} open={openGroups.split(',').includes(t.group.id)} listId={listId} formulas={t.formulas} currentTopic={currentTopic} onToggle={onToggle} onNavigate={onNavigate} />
            : t.formulas.map((f) => <Leaf key={f.id} id={f.id} title={f.title} current={currentTopic === f.id} onNavigate={onNavigate} />))}
        </ul>
      )}
    </li>
  )
})

/**
 * Hierarchical sidebar: section (with its element icon) → optional sub-section → topic.
 * Parents expand/collapse with their chevron button; the section name still links to the section page.
 * The section holding the current page is always opened, and the open/closed state is remembered.
 */
export function NavTree({ sectionId, formulaId, onNavigate }: { sectionId?: string; formulaId?: string; onNavigate?: () => void }) {
  const base = useId()
  const root = useRef<HTMLElement>(null)
  const clickedHere = useRef(false) // the user clicked a row in this tree → it is visible already
  const [open, setOpen] = useState<Set<string>>(() => initialOpen(sectionId, formulaId))

  // reveal the page you are on whenever it changes (state adjusted while rendering — no effect needed)
  const here = `${sectionId ?? ''}/${formulaId ?? ''}`
  const [seen, setSeen] = useState(here)
  if (seen !== here) {
    setSeen(here)
    if (sectionId) {
      const group = formulaId ? topicsOf(sectionId).find((t) => t.formulas.some((f) => f.id === formulaId))?.group?.id : undefined
      if (!open.has(sectionId) || (group && !open.has(group))) {
        const next = new Set(open); next.add(sectionId); if (group) next.add(group)
        setOpen(next)
      }
    }
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
  }, [sectionId, formulaId])

  const toggle = useCallback((id: string) => setOpen((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n }), [])

  return (
    <nav aria-label="Sections" ref={root} className="nav-tree" onClickCapture={(e) => { if ((e.target as HTMLElement).closest?.('a.nav-row')) clickedHere.current = true }}>
      <ul className="nav-list nav-root">
        <li><a className={`nav-row${!sectionId ? ' is-current' : ''}`} href="#/" onClick={onNavigate} aria-current={!sectionId ? 'page' : undefined}><span className="nav-text">Home</span></a></li>
        {SECTIONS.map((s) => (
          <SectionRow key={s.id} id={s.id} number={s.number} title={s.title} open={open.has(s.id)} selected={sectionId === s.id && !formulaId}
            currentTopic={sectionId === s.id ? formulaId : undefined} openGroups={(s.groups ?? []).filter((g) => open.has(g.id)).map((g) => g.id).join(',')}
            listId={base} onToggle={toggle} onNavigate={onNavigate} />
        ))}
      </ul>
      <p className="nav-foot">{SECTIONS.length} sections</p>
    </nav>
  )
}
