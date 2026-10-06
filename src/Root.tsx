import { useState } from 'react'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'

/** Registers the service worker (offline support) and shows a "ready offline" toast once. */
export default function Root() {
  const [offlineReady, setOfflineReady] = useState(false)
  useState(() => { registerSW({ immediate: true, onOfflineReady: () => setOfflineReady(true) }) })
  return <App offlineReady={offlineReady} onDismissOffline={() => setOfflineReady(false)} />
}
