import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT')!,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

serve(async () => {
  const now = new Date()
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000)

  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('active', true)
    .lte('next_fire_at', now.toISOString())
    .gte('next_fire_at', fiveMinutesAgo.toISOString())

  if (error) return new Response(error.message, { status: 500 })
  if (!reminders?.length) return new Response('No reminders due', { status: 200 })

  // Fetch subscriptions for all affected users in one query
  const userIds = [...new Set(reminders.map((r: Record<string, string>) => r.user_id))]
  const { data: allSubs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds)

  const subsByUser = (allSubs ?? []).reduce<Record<string, typeof allSubs>>((acc, sub) => {
    ;(acc[sub.user_id] ??= []).push(sub)
    return acc
  }, {})

  let sent = 0

  for (const reminder of reminders) {
    const subs = subsByUser[reminder.user_id] ?? []
    if (!subs.length) continue

    // Fetch entity name
    const table = reminder.entity_type === 'habit' ? 'habits' : 'tasks'
    const { data: entity } = await supabase
      .from(table)
      .select('title, icon')
      .eq('id', reminder.entity_id)
      .single()

    // Check quiet hours
    if (await isQuietHour(reminder.user_id, reminder.timezone)) {
      continue
    }

    const payload = JSON.stringify({
      title:      `${entity?.icon ?? '🎯'} ${entity?.title ?? 'Time to check in'}`,
      body:       'Tap to log your progress.',
      tag:        `${reminder.entity_type}_${reminder.entity_id}`,
      url:        `/${reminder.entity_type}s/${reminder.entity_id}`,
      entityId:   reminder.entity_id,
      entityType: reminder.entity_type,
    })

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
        sent++
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    // Advance next_fire_at to the next matching day
    const nextFire = computeNextFireAt(reminder.local_time, reminder.days_of_week, reminder.timezone, now)
    await supabase.from('reminders').update({ next_fire_at: nextFire }).eq('id', reminder.id)
  }

  return new Response(`Sent ${sent} notifications`, { status: 200 })
})

async function isQuietHour(userId: string, timezone: string): Promise<boolean> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'quietHours')
    .single()

  if (!data?.value) return false
  const { enabled, from: quietFrom, to: quietTo } = data.value as {
    enabled: boolean
    from: string
    to: string
  }
  if (!enabled) return false

  const localNow = new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
  const [fh, fm] = quietFrom.split(':').map(Number)
  const [th, tm] = quietTo.split(':').map(Number)
  const nowMin = localNow.getHours() * 60 + localNow.getMinutes()
  const fromMin = fh * 60 + fm
  const toMin   = th * 60 + tm

  // Handle overnight range (e.g. 22:00 → 08:00)
  return fromMin > toMin
    ? nowMin >= fromMin || nowMin < toMin
    : nowMin >= fromMin && nowMin < toMin
}

function computeNextFireAt(localTime: string, daysOfWeek: number[], timezone: string, after: Date): string {
  const [hours, minutes] = localTime.split(':').map(Number)

  for (let offset = 1; offset <= 8; offset++) {
    const candidate = new Date(after)
    candidate.setDate(candidate.getDate() + offset)
    const local = new Date(candidate.toLocaleString('en-US', { timeZone: timezone }))
    local.setHours(hours, minutes, 0, 0)

    if (daysOfWeek.includes(local.getDay())) {
      return local.toISOString()
    }
  }
  return after.toISOString()
}
