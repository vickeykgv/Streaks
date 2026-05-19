// Best-effort home-screen badge sync.
// Supported on iOS 16.4+ (installed PWA), Chrome on Android/Windows, Edge.
// Silently no-ops on unsupported browsers — never throws.

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

export function isAppBadgeSupported(): boolean {
  return typeof navigator !== 'undefined' && 'setAppBadge' in navigator
}

export async function setAppBadge(count: number): Promise<void> {
  const nav = navigator as BadgeNavigator
  if (!nav.setAppBadge) return
  try {
    if (count > 0) await nav.setAppBadge(count)
    else await nav.clearAppBadge?.()
  } catch {
    // Badge API can throw on some platforms when the PWA isn't installed yet —
    // failing silently is the right call.
  }
}

export async function clearAppBadge(): Promise<void> {
  const nav = navigator as BadgeNavigator
  if (!nav.clearAppBadge) return
  try { await nav.clearAppBadge() } catch { /* noop */ }
}
