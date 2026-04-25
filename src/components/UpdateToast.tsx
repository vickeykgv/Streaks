import { applyUpdate } from '@/pwa/registerSW'
import { useAppStore } from '@/store/appStore'

export function UpdateToast() {
  const updateAvailable = useAppStore(s => s.updateAvailable)
  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-brand-600 text-white
                    rounded-xl p-4 shadow-lg flex items-center justify-between">
      <span className="text-sm font-medium">New version available</span>
      <button
        onClick={applyUpdate}
        className="ml-4 text-sm font-semibold underline"
      >
        Update now
      </button>
    </div>
  )
}
