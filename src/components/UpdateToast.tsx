import { applyUpdate } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'
import { toast } from '@/store/toastStore'
import { RefreshCw, X } from 'lucide-react'

export function UpdateToast() {
  const updateAvailable = useAppStore(s => s.updateAvailable)
  const setUpdateAvailable = useAppStore(s => s.setUpdateAvailable)
  if (!updateAvailable) return null

  const handleUpdate = async () => {
    setUpdateAvailable(false)

    try {
      await applyUpdate()
    } catch {
      setUpdateAvailable(true)
      toast.error('Update failed. Please try again.')
    }
  }

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl border p-4 text-white shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
        borderColor: 'rgba(255,255,255,0.18)',
        boxShadow: '0 18px 40px rgba(0, 0, 0, 0.28)',
      }}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-white/12 p-2">
          <RefreshCw size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">New version available</p>
          <p className="mt-1 text-xs text-white/82">
            Reload to switch to the latest version.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleUpdate}
              className="rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-[var(--text-strong,#111827)] transition hover:bg-white/90"
            >
              Update now
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="text-sm font-medium text-white/90 underline underline-offset-2 transition hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="rounded-full p-1 text-white/75 transition hover:bg-white/10 hover:text-white"
          aria-label="Close update notice"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
