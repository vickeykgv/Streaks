import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { BottomNav } from '@/components/BottomNav'
import { SideNav } from '@/components/SideNav'
import { MobileTopBar } from '@/components/MobileTopBar'
import { UpdateToast } from '@/components/UpdateToast'
import { InstallPrompt } from '@/components/InstallPrompt'
import { BottomSheet, Modal } from '@/components/ui'
import { MotoEditorHost } from '@/components/moto/MotoEditorHost'
import { SpendingEditorHost } from '@/components/spending/SpendingEditorHost'

const Editor = lazy(() => import('@/routes/Editor'))
import { MotoFAB } from '@/components/moto/MotoFAB'
import { useAppStore } from '@/store/appStore'
import { useSession } from '@/auth/session'
import { syncNow } from '@/sync/engine'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const isOnline = useAppStore(s => s.isOnline)
  const createComposer = useAppStore(s => s.createComposer)
  const closeCreateComposer = useAppStore(s => s.closeCreateComposer)
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false,
  )
  const { user } = useSession()

  useEffect(() => {
    const onOnline = () => {
      useAppStore.getState().setOnline(true)
      if (useSession.getState().user) syncNow()
    }
    const onOffline = () => useAppStore.getState().setOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Sync on sign-in and every 60 seconds while signed in
  useEffect(() => {
    if (!user) return
    syncNow()
    const id = setInterval(syncNow, 60_000)
    return () => clearInterval(id)
  }, [user])

  // Listen for background sync messages from the service worker
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_NOW') syncNow()
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)')
    const sync = (event?: MediaQueryListEvent) => setIsDesktop(event ? event.matches : media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-clip bg-app">
      {!isOnline && (
        <div className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-full border border-[var(--border-default)] bg-[rgba(30,31,34,0.9)] px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
          Offline mode
        </div>
      )}

      {/* Desktop sidebar — fixed left, hidden on mobile */}
      <SideNav />

      {/* Main content — shifted right by the collapsed sidebar width on desktop */}
      <div className="lg:ml-[112px]">
        <MobileTopBar />
        <main>{children}</main>
      </div>

      {/* Bottom nav — fixed at bottom, hidden on desktop */}
      <BottomNav />

      <UpdateToast />
      <InstallPrompt />

      {isDesktop ? (
        <Modal
          open={createComposer.open}
          onClose={closeCreateComposer}
          size="lg"
        >
          <Suspense fallback={null}>
            <Editor
              embedded
              initialMode={createComposer.type}
              defaultWorld={createComposer.world}
              onClose={closeCreateComposer}
              onSaved={closeCreateComposer}
            />
          </Suspense>
        </Modal>
      ) : (
        <BottomSheet
          open={createComposer.open}
          onClose={closeCreateComposer}
        >
          <Suspense fallback={null}>
            <Editor
              embedded
              initialMode={createComposer.type}
              defaultWorld={createComposer.world}
              onClose={closeCreateComposer}
              onSaved={closeCreateComposer}
            />
          </Suspense>
        </BottomSheet>
      )}

      {/* Moto module editor host — modal-driven CRUD for all moto entities */}
      <MotoEditorHost />

      {/* Spending module editor host — global transaction modal */}
      <SpendingEditorHost />

      {/* Moto module global speed-dial FAB */}
      <MotoFAB />
    </div>
  )
}
