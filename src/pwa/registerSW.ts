import { registerSW } from 'virtual:pwa-register'

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined

export function initServiceWorker(onUpdateAvailable: () => void) {
  updateSWFn = registerSW({
    onNeedRefresh() {
      onUpdateAvailable()
    },
    onOfflineReady() {
      console.log('[SW] App ready to work offline')
    },
    onRegisteredSW(_swUrl, registration) {
      setInterval(() => registration?.update(), 60 * 60 * 1000)
    },
  })
}

export function applyUpdate() {
  updateSWFn?.(true)
}
