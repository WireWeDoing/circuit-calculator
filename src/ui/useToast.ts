import { createContext, useContext } from 'react'

export type Notify = (message: string) => void
export const ToastContext = createContext<Notify>(() => {})
/** Show a short message at the bottom of the screen (no-op when no provider is mounted, e.g. in isolated component tests). */
export const useToast = (): Notify => useContext(ToastContext)
