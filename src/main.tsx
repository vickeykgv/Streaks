import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './lib/theme'
import { initServiceWorker } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'

initTheme()

if (import.meta.env.DEV) {
  import('./db/seed').then(({ seedIfEmpty }) => seedIfEmpty())
}

initServiceWorker(() => {
  useAppStore.getState().setUpdateAvailable(true)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
