import { memo, useRef } from 'react'

export interface TabSpec { id: string; label: string }

/**
 * "Solve for" tabs. A plain, accessible tab list (WAI-ARIA tabs pattern: roving tabindex, ←/→/Home/End).
 * MUI's <Tabs> measures every tab and re-measures on each render/resize, which dominated the cost of opening
 * a calculator; this renders buttons and lets the browser scroll them natively when they overflow.
 */
export const ModeTabs = memo(function ModeTabs({ tabs, value, onChange, label }: { tabs: TabSpec[]; value: string; onChange: (id: string) => void; label: string }) {
  const list = useRef<HTMLDivElement>(null)
  const select = (id: string) => {
    onChange(id)
    // keep the chosen tab in view (after the browser has applied the change; only measures when it was clicked)
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(id)}"]`)?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }))
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = tabs.findIndex((t) => t.id === value)
    let next = -1
    if (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = tabs.length - 1
    if (next < 0) return
    e.preventDefault()
    select(tabs[next]!.id)
    list.current?.querySelector<HTMLElement>(`[data-tab="${CSS.escape(tabs[next]!.id)}"]`)?.focus()
  }
  return (
    <div className="mode-tabs" role="tablist" aria-label={label} ref={list} onKeyDown={onKeyDown}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={t.id === value} tabIndex={t.id === value ? 0 : -1} data-tab={t.id} data-testid={`mode-${t.id}`} className="mode-tab" onClick={() => select(t.id)}>{t.label}</button>
      ))}
    </div>
  )
})
