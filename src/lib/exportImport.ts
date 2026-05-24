import { db } from '@/db/database'
import type { SpendingTransaction } from '@/types/spending'

interface ExportPayload {
  version: number
  exportedAt: string
  data: {
    habits: unknown[]
    tasks: unknown[]
    entries: unknown[]
    tags: unknown[]
    settings: unknown[]
    // Spending (added in v2)
    spendingAccounts?: unknown[]
    spendingCategories?: unknown[]
    spendingTransactions?: unknown[]
    spendingBudgets?: unknown[]
    spendingRecurring?: unknown[]
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function exportAll(): Promise<string> {
  const [habits, tasks, entries, tags, settings,
    spendingAccounts, spendingCategories, spendingTransactions, spendingBudgets, spendingRecurring] =
    await Promise.all([
      db.habits.toArray(),
      db.tasks.toArray(),
      db.habitEntries.toArray(),
      db.tags.toArray(),
      db.settings.toArray(),
      db.spendingAccounts.toArray(),
      db.spendingCategories.toArray(),
      db.spendingTransactions.toArray(),
      db.spendingBudgets.toArray(),
      db.spendingRecurring.toArray(),
    ])

  const payload: ExportPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    data: {
      habits, tasks, entries, tags, settings,
      spendingAccounts, spendingCategories, spendingTransactions, spendingBudgets, spendingRecurring,
    },
  }

  return JSON.stringify(payload, null, 2)
}

export async function downloadExport(): Promise<void> {
  const json = await exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  triggerDownload(blob, `streaks-backup-${new Date().toISOString().split('T')[0]}.json`)
}

export async function importAll(json: string): Promise<{ imported: number }> {
  const payload = JSON.parse(json) as ExportPayload

  if (payload.version !== 1 && payload.version !== 2) {
    throw new Error(`Unsupported export version: ${payload.version}`)
  }

  const { data } = payload
  let imported = 0

  await db.transaction('rw', [
    db.habits, db.tasks, db.habitEntries, db.tags, db.settings,
    db.spendingAccounts, db.spendingCategories, db.spendingTransactions, db.spendingBudgets, db.spendingRecurring,
  ], async () => {
    if (data.habits?.length)   { await db.habits.bulkPut(data.habits as never);             imported += data.habits.length }
    if (data.tasks?.length)    { await db.tasks.bulkPut(data.tasks as never);               imported += data.tasks.length }
    if (data.entries?.length)  { await db.habitEntries.bulkPut(data.entries as never);      imported += data.entries.length }
    if (data.tags?.length)     { await db.tags.bulkPut(data.tags as never);                 imported += data.tags.length }
    if (data.settings?.length) { await db.settings.bulkPut(data.settings as never) }
    // Spending (v2+)
    if (data.spendingAccounts?.length)     { await db.spendingAccounts.bulkPut(data.spendingAccounts as never);         imported += data.spendingAccounts.length }
    if (data.spendingCategories?.length)   { await db.spendingCategories.bulkPut(data.spendingCategories as never);     imported += data.spendingCategories.length }
    if (data.spendingTransactions?.length) { await db.spendingTransactions.bulkPut(data.spendingTransactions as never); imported += data.spendingTransactions.length }
    if (data.spendingBudgets?.length)      { await db.spendingBudgets.bulkPut(data.spendingBudgets as never);           imported += data.spendingBudgets.length }
    if (data.spendingRecurring?.length)    { await db.spendingRecurring.bulkPut(data.spendingRecurring as never);       imported += data.spendingRecurring.length }
  })

  return { imported }
}

// ── CSV export for transactions ───────────────────────────────────────────────

function csvRow(cells: (string | number | undefined)[]): string {
  return cells.map(c => {
    const s = String(c ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')
}

export async function exportTransactionsCsv(
  categoryNames: Record<string, string>,
  accountNames: Record<string, string>,
): Promise<void> {
  const txns = await db.spendingTransactions
    .filter(t => !t.deletedAt)
    .toArray() as SpendingTransaction[]

  txns.sort((a, b) => b.date.localeCompare(a.date))

  const header = csvRow(['Date', 'Type', 'Amount', 'Currency', 'Account', 'To Account', 'Category', 'Payee', 'Tags', 'Note'])
  const rows = txns.map(t =>
    csvRow([
      t.date,
      t.type,
      t.amount,
      t.currency,
      accountNames[t.accountId]  ?? t.accountId,
      t.toAccountId ? (accountNames[t.toAccountId] ?? t.toAccountId) : '',
      t.categoryId  ? (categoryNames[t.categoryId] ?? t.categoryId)  : '',
      t.payee,
      (t.tags ?? []).join(';'),
      t.note,
    ]),
  )

  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `spending-transactions-${new Date().toISOString().split('T')[0]}.csv`)
}
