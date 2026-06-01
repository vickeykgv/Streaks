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
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const { entityId, entityType } = await req.json() as {
    entityId: string
    entityType: 'habit' | 'task'
  }

  if (!entityId || !entityType) {
    return new Response('Missing entityId or entityType', { status: 400, headers: corsHeaders })
  }

  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10)

  if (entityType === 'habit') {
    await supabase.from('habit_entries').upsert({
      habit_id:   entityId,
      user_id:    user.id,
      date:       today,
      status:     'done',
      value:      1,
      updated_at: now,
      dirty:      false,
    }, { onConflict: 'habit_id,date' })
  } else {
    await supabase.from('tasks').update({
      status:       'done',
      completed_at: now,
      updated_at:   now,
    }).eq('id', entityId).eq('user_id', user.id)
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
