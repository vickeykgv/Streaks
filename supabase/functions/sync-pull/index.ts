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

  const url = new URL(req.url)
  const since = parseInt(url.searchParams.get('since') ?? '0', 10)
  const serverTime = Date.now()

  const [
    habits, tasks, entries, tags,
    spendingAccounts, spendingCategories, spendingTransactions, spendingBudgets, spendingRecurring,
    motoVehicles, motoFuelLogs, motoServices, motoParts, motoIssues, motoNotes, motoDocuments,
  ] = await Promise.all([
    supabase.from('habits')               .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('tasks')                .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('habit_entries')        .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('tags')                 .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('spending_accounts')    .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('spending_categories')  .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('spending_transactions').select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('spending_budgets')     .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('spending_recurring')   .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_vehicles')        .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_fuel_logs')       .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_services')        .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_parts')           .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_issues')          .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_notes')           .select('*').eq('user_id', user.id).gt('updated_at', since),
    supabase.from('moto_documents')       .select('*').eq('user_id', user.id).gt('updated_at', since),
  ])

  return new Response(
    JSON.stringify({
      serverTime,
      changes: {
        habits:               habits.data               ?? [],
        tasks:                tasks.data                ?? [],
        entries:              entries.data              ?? [],
        tags:                 tags.data                 ?? [],
        spendingAccounts:     spendingAccounts.data     ?? [],
        spendingCategories:   spendingCategories.data   ?? [],
        spendingTransactions: spendingTransactions.data ?? [],
        spendingBudgets:      spendingBudgets.data      ?? [],
        spendingRecurring:    spendingRecurring.data    ?? [],
        motoVehicles:  motoVehicles.data  ?? [],
        motoFuelLogs:  motoFuelLogs.data  ?? [],
        motoServices:  motoServices.data  ?? [],
        motoParts:     motoParts.data     ?? [],
        motoIssues:    motoIssues.data    ?? [],
        motoNotes:     motoNotes.data     ?? [],
        motoDocuments: motoDocuments.data ?? [],
      },
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
