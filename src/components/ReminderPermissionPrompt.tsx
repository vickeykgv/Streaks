export function ReminderPermissionPrompt({ onDismiss }: { onDismiss: () => void }) {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  if (!isIOS || isStandalone) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-[var(--bg-overlay)] px-3 pb-3 pt-12"
      onClick={onDismiss}
    >
      <div
        className="w-full rounded-[28px] p-6"
        style={{ background: 'var(--bg-surface)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-3 text-3xl text-center">📲</div>
        <h2 className="font-sans text-[18px] font-bold text-[var(--text-primary)] text-center mb-2">
          One more step for reminders on iOS
        </h2>
        <p className="font-body text-[13px] text-[var(--text-secondary)] text-center mb-5">
          To receive push reminders on iPhone, add this app to your Home Screen first.
        </p>

        <ol className="space-y-3 mb-6">
          {[
            { n: 1, text: 'Tap the Share button (□↑) in the Safari toolbar' },
            { n: 2, text: 'Scroll down and tap "Add to Home Screen"' },
            { n: 3, text: 'Open the app from your Home Screen' },
            { n: 4, text: 'Come back to this habit and set the reminder again' },
          ].map(({ n, text }) => (
            <li key={n} className="flex items-start gap-3">
              <span
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-sans text-[12px] font-bold text-[var(--text-on-brand)]"
                style={{ background: 'var(--color-brand-500)' }}
              >
                {n}
              </span>
              <span className="font-body text-[13px] text-[var(--text-primary)] pt-0.5">{text}</span>
            </li>
          ))}
        </ol>

        <button
          onClick={onDismiss}
          className="w-full h-12 rounded-2xl font-sans text-[15px] font-extrabold text-[var(--text-on-brand)]"
          style={{ background: 'var(--color-brand-500)' }}
        >
          Got it
        </button>
      </div>
    </div>
  )
}
