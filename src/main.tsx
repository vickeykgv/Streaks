import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { initServiceWorker } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'
import { authClient } from '@/auth/client'
import { useSession } from '@/auth/session'
import { logError } from '@/lib/errorLog'

initTheme()

// Global error reporting — capture uncaught errors and promise rejections.
window.addEventListener('error', (e) => {
  void logError(e.error ?? e.message, 'window.onerror')
})
window.addEventListener('unhandledrejection', (e) => {
  void logError(e.reason, 'unhandledrejection')
})

if (import.meta.env.DEV) {
  import('./db/seed').then(({ seedIfEmpty }) => seedIfEmpty())
}

initServiceWorker(() => {
  useAppStore.getState().setUpdateAvailable(true)
})

// Restore session on startup
authClient.getUser().then(user => {
  useSession.getState().setUser(user)
  useSession.getState().setLoading(false)
})

// React to auth state changes (e.g. magic link redirect)
authClient.onAuthStateChange(user => {
  useSession.getState().setUser(user)
  useSession.getState().setLoading(false)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
