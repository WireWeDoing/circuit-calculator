import { useEffect, useMemo, useState } from 'react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import BrightnessAutoIcon from '@mui/icons-material/BrightnessAuto'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import MenuIcon from '@mui/icons-material/Menu'
import SearchIcon from '@mui/icons-material/Search'
import ShareIcon from '@mui/icons-material/Share'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { ThemeProvider } from '@mui/material/styles'
import { formulaById } from './formulas/index.ts'
import { FormulaPage } from './ui/FormulaPage.tsx'
import { Home } from './ui/Home.tsx'
import { ChapterPage, PartPage } from './ui/BookPages.tsx'
import { useRoute, type Route } from './ui/router.ts'
import { popHistory, pushHistory, routeHref, routeKey, routeLabel } from './ui/navHistory.ts'
import { makeTheme } from './ui/theme.ts'
import { InstallHint } from './ui/InstallHint.tsx'
import { locate, NavTree } from './ui/NavTree.tsx'
import { SearchDialog } from './ui/SearchDialog.tsx'
import { shareLink } from './ui/share.ts'
import { ToastProvider } from './ui/toast.tsx'
import { useToast } from './ui/useToast.ts'

type Pref = 'system' | 'light' | 'dark'
const SIDEBAR_W = 330
const readPref = (): Pref => { try { const v = localStorage.getItem('theme'); return v === 'light' || v === 'dark' ? v : 'system' } catch { return 'system' } }

/** Share the page you are on: the address as it is now (including a section anchor). Native share sheet on phones, copy elsewhere. */
function ShareButton() {
  const notify = useToast()
  const share = async () => {
    const r = await shareLink({ url: window.location.href, title: document.title })
    if (r === 'copied') notify('Link copied')
    else if (r === 'failed') notify('Could not copy — copy the address from the browser bar')
  }
  return <IconButton color="inherit" aria-label="Share this page" onClick={share} data-testid="share-button"><ShareIcon /></IconButton>
}

export default function App(props: { offlineReady?: boolean; onDismissOffline?: () => void }) {
  return <ToastProvider><AppShell {...props} /></ToastProvider>
}

function AppShell({ offlineReady = false, onDismissOffline }: { offlineReady?: boolean; onDismissOffline?: () => void }) {
  const route = useRoute()
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const wide = useMediaQuery('(min-width: 1200px)')
  const [pref, setPref] = useState<Pref>(readPref)
  const [drawer, setDrawer] = useState(false)
  const [searching, setSearching] = useState(false)
  const mode = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref
  const theme = useMemo(() => makeTheme(mode), [mode])
  const cycle = () => { const n: Pref = pref === 'system' ? 'light' : pref === 'light' ? 'dark' : 'system'; setPref(n); try { localStorage.setItem('theme', n) } catch { /* private mode */ } }

  // "Back": the last few pages you opened (in memory only). Tracked while rendering — no effect needed.
  const [history, setHistory] = useState<Route[]>([])
  const [lastRoute, setLastRoute] = useState<Route>(route)
  const [viaBack, setViaBack] = useState(false)
  if (routeKey(route) !== routeKey(lastRoute)) {
    setLastRoute(route)
    if (viaBack) setViaBack(false) // arrived by pressing Back: the page we left is not remembered again
    else setHistory(pushHistory(history, lastRoute))
  }
  const previous = history[history.length - 1]
  const goBack = () => {
    const { target, rest } = popHistory(history)
    if (!target) return
    setHistory(rest)
    setViaBack(true)
    window.location.hash = routeHref(target)
  }

  const formula = route.page === 'topic' ? formulaById(route.id) : undefined
  const here = useMemo(() => locate({ part: route.page === 'part' ? route.id : undefined, chapter: route.page === 'chapter' ? route.id : undefined, topic: formula?.id }), [route, formula])
  const title = route.page === 'home' ? 'Circuit Calculator' : routeLabel(route)

  useEffect(() => { document.title = route.page === 'home' ? 'Circuit Calculator' : `${title} · Circuit Calculator`; if (!(route.page === 'topic' && route.anchor)) window.scrollTo(0, 0) }, [route, title]) // a link to a card scrolls to it instead (FormulaPage)
  // Ctrl/Cmd+K, or "/" outside a text field, opens the search
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const typing = !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)) { e.preventDefault(); setSearching(true) }
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [])
  useEffect(() => { document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.palette.primary.main) }, [theme])

  const ThemeIcon = pref === 'system' ? BrightnessAutoIcon : pref === 'light' ? LightModeIcon : DarkModeIcon

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* colours for the plain-CSS parts (sidebar tree, diagrams): set once per theme instead of per element */}
      <GlobalStyles styles={(t) => ({
        ':root': {
          '--nav-text': t.palette.text.primary, '--nav-muted': t.palette.text.secondary, '--nav-bar': t.palette.primary.main, '--nav-hover': t.palette.action.hover, '--nav-selected': t.palette.action.selected,
          '--ink': t.palette.text.primary, '--muted': t.palette.text.secondary, '--accent': t.palette.primary.main, '--hot': t.palette.warning.main, '--good': t.palette.success.main, '--bad': t.palette.error.main,
          '--soft': t.palette.mode === 'dark' ? 'rgba(144,202,249,0.16)' : 'rgba(11,92,173,0.10)', '--paper': t.palette.background.paper,
        },
      })} />
      <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar sx={{ gap: 0.5, pt: 'env(safe-area-inset-top)' }}>
          {/* the menu button is always the first control (hidden only when the sidebar is permanently open) */}
          {!wide && <IconButton color="inherit" edge="start" aria-label="Open contents menu" onClick={() => setDrawer(true)} data-testid="menu-button"><MenuIcon /></IconButton>}
          {previous && (
            <Button color="inherit" onClick={goBack} aria-label={`Back to ${routeLabel(previous)}`} data-testid="back-button" startIcon={<ArrowBackIcon />}
              sx={{ minWidth: 44, px: { xs: 1.25, sm: 1.5 }, maxWidth: { sm: 220 }, '& .MuiButton-startIcon': { mr: { xs: 0, sm: 0.75 }, ml: { xs: 0, sm: -0.25 } } }}>
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{routeLabel(previous)}</Box>
              {history.length > 1 && <Box component="span" aria-hidden="true" data-testid="back-count" sx={{ ml: 0.75, fontSize: 11, px: 0.75, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.28)' }}>{history.length}</Box>}
            </Button>
          )}
          <Typography component="p" variant="h3" noWrap sx={{ flex: 1, color: 'inherit', ml: 0.5 }}>{route.page === 'home' ? 'Circuit Calculator' : title}</Typography>
          {route.page !== 'home' && <Button color="inherit" component="a" href="#/" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>Home</Button>}
          <ShareButton />
          <IconButton color="inherit" aria-label="Search chapters and topics" onClick={() => setSearching(true)} data-testid="search-button"><SearchIcon /></IconButton>
          <IconButton color="inherit" aria-label={`Theme: ${pref}. Switch theme`} onClick={cycle} data-testid="theme-toggle"><ThemeIcon /></IconButton>
        </Toolbar>
      </AppBar>
      {/* wide screens: permanent sidebar; phones/tablets: slide-in drawer from the menu button */}
      <Drawer variant={wide ? 'permanent' : 'temporary'} open={wide ? true : drawer} onClose={() => setDrawer(false)} ModalProps={{ keepMounted: false }}
        sx={{ display: 'block', ...(wide ? { zIndex: (t) => t.zIndex.appBar - 1 } : {}), '& .MuiDrawer-paper': { width: wide ? SIDEBAR_W : 'min(88vw, 360px)', boxSizing: 'border-box', top: wide ? 64 : 0, height: wide ? 'calc(100% - 64px)' : '100%' } }}>
        <NavTree here={here} onNavigate={() => setDrawer(false)} />
      </Drawer>
      <Box sx={{ ml: wide ? `${SIDEBAR_W}px` : 0 }}>
      <Container component="main" id="main" tabIndex={-1} maxWidth="lg" sx={{ py: 2, pb: 'calc(32px + env(safe-area-inset-bottom))', outline: 'none' }}>
        <InstallHint />
        {route.page === 'home' && <Home />}
        {route.page === 'part' && <PartPage id={route.id} />}
        {route.page === 'chapter' && <ChapterPage id={route.id} />}
        {route.page === 'topic' && (formula ? <FormulaPage key={formula.id} formula={formula} anchor={route.anchor} query={route.query} /> : <Typography role="alert">Topic not found. <a href="#/">Go home</a>.</Typography>)}
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 4 }}>
          Quick reference only — always confirm device-specific limits (VCE(max), RDS(on), PD(max), pin currents) against the actual datasheet. PCB and RF formulas are simplified approximations.
        </Typography>
      </Container>
      </Box>
      <SearchDialog open={searching} onClose={() => setSearching(false)} />
      <Snackbar open={offlineReady} transitionDuration={{ enter: 0, exit: 150 }} autoHideDuration={5000} onClose={onDismissOffline} message="Ready to work offline" slotProps={{ content: { sx: { bgcolor: '#1f2933', color: '#ffffff' } } }} />
    </ThemeProvider>
  )
}
