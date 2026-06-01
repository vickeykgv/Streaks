import { syncNow } from './engine'
import { requestBackgroundSync } from '@/pwa/registerSW'

let timer: ReturnType<typeof setTimeout> | null = null

export function scheduleSyncSoon(delay = 3000) {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    syncNow()
  }, delay)
  requestBackgroundSync()
}
