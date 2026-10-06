import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** "Install app" on Android/desktop (beforeinstallprompt) and an Add-to-Home-Screen hint on iOS Safari. */
export function InstallHint() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  const [hidden, setHidden] = useState(() => { try { return localStorage.getItem('install-hint') === 'x' } catch { return false } })
  useEffect(() => {
    const on = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', on)
    return () => window.removeEventListener('beforeinstallprompt', on)
  }, [])
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone
  const dismiss = () => { setHidden(true); try { localStorage.setItem('install-hint', 'x') } catch { /* ignore */ } }
  if (hidden || standalone || (!evt && !ios)) return null
  return (
    <Alert severity="info" sx={{ mb: 2 }} onClose={dismiss} action={evt ? <Button color="inherit" size="small" onClick={() => { void evt.prompt(); dismiss() }}>Install</Button> : undefined} data-testid="install-hint">
      {evt ? 'Install this app for quick, offline access.' : 'To install on iPhone/iPad: tap Share, then “Add to Home Screen”.'}
    </Alert>
  )
}
