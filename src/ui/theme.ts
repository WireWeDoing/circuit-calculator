import { createTheme } from '@mui/material/styles'

export const makeTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: { main: mode === 'light' ? '#0b5cad' : '#90caf9' },
      secondary: { main: mode === 'light' ? '#a14b00' : '#ffb74d' },
      warning: { main: mode === 'light' ? '#b45309' : '#ffb74d' },
      success: { main: mode === 'light' ? '#1b6e3a' : '#81c784' },
      error: { main: mode === 'light' ? '#b3261e' : '#f2b8b5' },
      background: mode === 'light' ? { default: '#f5f7fa', paper: '#ffffff' } : { default: '#0f1418', paper: '#182028' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontSize: '1.7rem', fontWeight: 700 },
      h2: { fontSize: '1.3rem', fontWeight: 700 },
      h3: { fontSize: '1.1rem', fontWeight: 700 },
    },
    components: {
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 44, textTransform: 'none' } } },
      MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
      MuiToggleButton: { styleOverrides: { root: { minHeight: 44, minWidth: 44, textTransform: 'none' } } },
      MuiTab: { styleOverrides: { root: { minHeight: 48, textTransform: 'none' } } },
      MuiCssBaseline: { styleOverrides: { 'a:focus-visible, button:focus-visible': { outline: '3px solid currentColor', outlineOffset: 2 } } },
    },
  })
