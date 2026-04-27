import { supabase } from '@/lib/supabase'

export interface ReminderParams {
  entityType: 'habit' | 'task'
  entityId: string
  localTime: string      // 'HH:mm'
  daysOfWeek: number[]   // 0=Sun … 6=Sat
}

export const reminderApi = {
  async set(params: ReminderParams) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const nextFire = computeNextFireAt(params.localTime, params.daysOfWeek, timezone)

    const { error } = await supabase.from('reminders').upsert({
      entity_type:  params.entityType,
      entity_id:    params.entityId,
      local_time:   params.localTime,
      days_of_week: params.daysOfWeek,
      timezone,
      next_fire_at: nextFire.toISOString(),
      active:       true,
    }, { onConflict: 'entity_id' })

    if (error) throw error
  },

  async cancel(entityId: string) {
    await supabase.from('reminders').update({ active: false }).eq('entity_id', entityId)
  },

  async cancelAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('reminders').update({ active: false }).eq('user_id', user.id)
  },
}

function computeNextFireAt(localTime: string, daysOfWeek: number[], timezone: string): Date {
  const [hours, minutes] = localTime.split(':').map(Number)
  const now = new Date()

  for (let offset = 0; offset < 8; offset++) {
    const candidate = new Date(now)
    candidate.setDate(candidate.getDate() + offset)
    // Interpret candidate in the target timezone to get its local day-of-week
    const local = new Date(candidate.toLocaleString('en-US', { timeZone: timezone }))
    local.setHours(hours, minutes, 0, 0)

    if (daysOfWeek.includes(local.getDay()) && local > now) {
      return local
    }
  }
  return now
}
