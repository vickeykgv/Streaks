import { registerSW } from 'virtual:pwa-register'

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined

export function initServiceWorker(onUpdateAvailable: () => void) {
  updateSWFn = registerSW({
    immediate: true,
    onNeedRefresh() {
      onUpdateAvailable()
    },
    onOfflineReady() {
      console.log('[SW] App ready to work offline')
    },
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      // Check for updates on a short interval AND when the PWA regains focus
      // (covers Android standalone where the app may be backgrounded for hours).
      const check = () => { void registration.update() }
      setInterval(check, 15 * 60 * 1000)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
      window.addEventListener('focus', check)
    },
  })
}

export async function applyUpdate() {
  if (!updateSWFn) {
    window.location.reload()
    return false
  }

  await updateSWFn(true)
  return true
}

export async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker.ready
    if ('sync' in reg) {
      await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } })
        .sync.register('habit-sync')
    }
  } catch {
    // Background Sync not supported in this browser — ok
  }
}
