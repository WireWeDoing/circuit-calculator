/** Absolute URL for an in-app hash link (keeps the current origin, path and query: works from the /circuit-calculator/ sub-path too). */
export const absoluteUrl = (hash: string): string => new URL(hash, window.location.href).href

/** Copy text to the clipboard. Falls back to a hidden textarea where the async clipboard API is missing (older iOS, http). */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true }
  } catch { /* permission denied → try the fallback */ }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch { return false }
}

export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** a touch device is where the native share sheet (Messages, WhatsApp…) is the natural way to share */
const prefersNativeShare = (): boolean => typeof navigator.share === 'function' && !!window.matchMedia?.('(pointer: coarse)').matches

/** Share a link: the native share sheet on phones and tablets, a clipboard copy everywhere else. */
export async function shareLink({ url, title }: { url: string; title: string }): Promise<ShareResult> {
  if (prefersNativeShare()) {
    try { await navigator.share({ url, title }); return 'shared' } catch (e) {
      if ((e as { name?: string })?.name === 'AbortError') return 'cancelled' // the user closed the sheet
      /* any other failure → fall back to copying */
    }
  }
  return (await copyText(url)) ? 'copied' : 'failed'
}
