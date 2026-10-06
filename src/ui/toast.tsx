import { useCallback, useMemo, useState, type ReactNode } from 'react'
import Snackbar from '@mui/material/Snackbar'
import { ToastContext, type Notify } from './useToast.ts'

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; n: number } | null>(null)
  const [open, setOpen] = useState(false)
  const notify = useCallback<Notify>((text) => { setMsg((m) => ({ text, n: (m?.n ?? 0) + 1 })); setOpen(true) }, [])
  const value = useMemo(() => notify, [notify])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar key={msg?.n} open={open} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} transitionDuration={{ enter: 0, exit: 150 }} autoHideDuration={2500}
        onClose={(_, reason) => { if (reason !== 'clickaway') setOpen(false) }} message={msg?.text} data-testid="toast"
        slotProps={{ content: { sx: { bgcolor: '#1f2933', color: '#ffffff' }, role: 'status' } }} />
    </ToastContext.Provider>
  )
}
