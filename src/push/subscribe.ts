import { supabase } from '@/lib/supabase'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return Notification.requestPermission()
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  const permission = await requestPushPermission()
  if (permission !== 'granted') return null

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidKey) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set')
    return null
  }

  const registration = await navigator.serviceWorker.ready
  const existing = await registration.pushManager.getSubscription()
  const subscription = existing ?? await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!)))
  const auth   = btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))

  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: subscription.endpoint,
    p256dh,
    auth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }, { onConflict: 'endpoint' })

  if (error) console.error('[Push] Failed to save subscription:', error)
  return subscription
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
  await subscription.unsubscribe()
}
