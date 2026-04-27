import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader ?? '' } } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const body = await req.json()
  const { habits = [], tasks = [], entries = [], tags = [] } = body.changes ?? {}

  // Stamp user_id on all records to enforce ownership
  const stamp = (records: Record<string, unknown>[]) =>
    records.map(r => ({ ...r, user_id: user.id }))

  const results = await Promise.allSettled([
    habits.length  && supabase.from('habits')       .upsert(stamp(habits),  { onConflict: 'id' }),
    tasks.length   && supabase.from('tasks')        .upsert(stamp(tasks),   { onConflict: 'id' }),
    entries.length && supabase.from('habit_entries').upsert(stamp(entries), { onConflict: 'id' }),
    tags.length    && supabase.from('tags')         .upsert(stamp(tags),    { onConflict: 'id' }),
  ])

  const errors = results.filter(r => r.status === 'rejected')
  if (errors.length > 0) {
    console.error('Push errors:', errors)
    return new Response(
      JSON.stringify({ ok: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ ok: true, syncedAt: Date.now() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
