import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('install-dismissed') === 'true'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const install = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'dismissed') {
      localStorage.setItem('install-dismissed', 'true')
      setDismissed(true)
    }
    setDeferredPrompt(null)
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-surface
                    border border-slate-200 dark:border-slate-700
                    rounded-xl p-4 shadow-lg flex items-center gap-3">
      <span className="text-2xl">📲</span>
      <div className="flex-1">
        <p className="text-sm font-semibold">Install Habit Tracker</p>
        <p className="text-xs text-slate-500">Add to your home screen for the best experience</p>
      </div>
      <button onClick={install} className="text-sm font-semibold text-brand-600">Install</button>
      <button onClick={() => setDismissed(true)} className="text-slate-400 text-xs">✕</button>
    </div>
  )
}
