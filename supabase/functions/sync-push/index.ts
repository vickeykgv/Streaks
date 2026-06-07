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
  const {
    habits = [], tasks = [], entries = [], tags = [],
    spendingAccounts = [], spendingCategories = [], spendingTransactions = [],
    spendingBudgets = [], spendingRecurring = [],
    motoVehicles = [], motoFuelLogs = [], motoServices = [], motoParts = [],
    motoIssues = [], motoNotes = [], motoDocuments = [],
  } = body.changes ?? {}

  // Stamp every record with the server clock so all updated_at values and the
  // pull cursor (serverTime) share one clock. Without this, records carry the
  // writing device's Date.now(); if that clock is behind another device's
  // lastPulledAt, the record's updated_at < since and it is never pulled. See KAN-9.
  const serverNow = Date.now()
  const stamp = (records: Record<string, unknown>[]) =>
    records.map(r => ({ ...r, user_id: user.id, updated_at: serverNow }))

  const results = await Promise.allSettled([
    habits.length               && supabase.from('habits')               .upsert(stamp(habits),               { onConflict: 'id' }),
    tasks.length                && supabase.from('tasks')                .upsert(stamp(tasks),                { onConflict: 'id' }),
    entries.length              && supabase.from('habit_entries')        .upsert(stamp(entries),              { onConflict: 'id' }),
    tags.length                 && supabase.from('tags')                 .upsert(stamp(tags),                 { onConflict: 'id' }),
    spendingAccounts.length     && supabase.from('spending_accounts')    .upsert(stamp(spendingAccounts),     { onConflict: 'id' }),
    spendingCategories.length   && supabase.from('spending_categories')  .upsert(stamp(spendingCategories),   { onConflict: 'id' }),
    spendingTransactions.length && supabase.from('spending_transactions').upsert(stamp(spendingTransactions), { onConflict: 'id' }),
    spendingBudgets.length      && supabase.from('spending_budgets')     .upsert(stamp(spendingBudgets),      { onConflict: 'id' }),
    spendingRecurring.length    && supabase.from('spending_recurring')   .upsert(stamp(spendingRecurring),    { onConflict: 'id' }),
    motoVehicles.length  && supabase.from('moto_vehicles') .upsert(stamp(motoVehicles),  { onConflict: 'id' }),
    motoFuelLogs.length  && supabase.from('moto_fuel_logs').upsert(stamp(motoFuelLogs),  { onConflict: 'id' }),
    motoServices.length  && supabase.from('moto_services') .upsert(stamp(motoServices),  { onConflict: 'id' }),
    motoParts.length     && supabase.from('moto_parts')    .upsert(stamp(motoParts),     { onConflict: 'id' }),
    motoIssues.length    && supabase.from('moto_issues')   .upsert(stamp(motoIssues),    { onConflict: 'id' }),
    motoNotes.length     && supabase.from('moto_notes')    .upsert(stamp(motoNotes),     { onConflict: 'id' }),
    motoDocuments.length && supabase.from('moto_documents').upsert(stamp(motoDocuments), { onConflict: 'id' }),
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
    JSON.stringify({ ok: true, syncedAt: serverNow }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
