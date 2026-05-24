import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns'
import type { SpendingRecurring } from '@/types/spending'
import { recurringRepo } from '@/db/repos/spending/recurring'
import { transactionsRepo } from '@/db/repos/spending/transactions'

function advanceNextRunAt(rule: SpendingRecurring): number {
  const base = new Date(rule.nextRunAt)
  switch (rule.interval) {
    case 'daily':    return addDays(base, 1).getTime()
    case 'weekly':   return addWeeks(base, 1).getTime()
    case 'biweekly': return addWeeks(base, 2).getTime()
    case 'yearly':   return addYears(base, 1).getTime()
    case 'monthly':
    default:         return addMonths(base, 1).getTime()
  }
}

export async function runDueRecurring(): Promise<number> {
  const dueRules = await recurringRepo.getDue()
  let created = 0
  for (const rule of dueRules) {
    await transactionsRepo.create({
      type:        rule.type,
      amount:      rule.amount,
      currency:    rule.currency,
      date:        format(new Date(rule.nextRunAt), 'yyyy-MM-dd'),
      accountId:   rule.accountId,
      toAccountId: rule.toAccountId,
      categoryId:  rule.categoryId,
      tags:        rule.tags,
      note:        rule.note,
      payee:       rule.payee,
      recurringId: rule.id,
    })
    await recurringRepo.update(rule.id, {
      lastRunAt: Date.now(),
      nextRunAt: advanceNextRunAt(rule),
    })
    created++
  }
  return created
}

export function intervalLabel(interval: SpendingRecurring['interval']): string {
  switch (interval) {
    case 'daily':    return 'Every day'
    case 'weekly':   return 'Every week'
    case 'biweekly': return 'Every 2 weeks'
    case 'monthly':  return 'Every month'
    case 'yearly':   return 'Every year'
  }
}
