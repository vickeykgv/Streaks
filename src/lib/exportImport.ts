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
    // Moto (added in v3)
    motoVehicles?: unknown[]
    motoFuelLogs?: unknown[]
    motoServices?: unknown[]
    motoParts?: unknown[]
    motoIssues?: unknown[]
    motoNotes?: unknown[]
    motoDocuments?: unknown[]
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
    spendingAccounts, spendingCategories, spendingTransactions, spendingBudgets, spendingRecurring,
    motoVehicles, motoFuelLogs, motoServices, motoParts, motoIssues, motoNotes, motoDocuments] =
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
      db.motoVehicles.toArray(),
      db.motoFuelLogs.toArray(),
      db.motoServices.toArray(),
      db.motoParts.toArray(),
      db.motoIssues.toArray(),
      db.motoNotes.toArray(),
      db.motoDocuments.toArray(),
    ])

  const payload: ExportPayload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    data: {
      habits, tasks, entries, tags, settings,
      spendingAccounts, spendingCategories, spendingTransactions, spendingBudgets, spendingRecurring,
      motoVehicles, motoFuelLogs, motoServices, motoParts, motoIssues, motoNotes, motoDocuments,
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

  if (payload.version !== 1 && payload.version !== 2 && payload.version !== 3) {
    throw new Error(`Unsupported export version: ${payload.version}`)
  }

  const { data } = payload
  let imported = 0

  await db.transaction('rw', [
    db.habits, db.tasks, db.habitEntries, db.tags, db.settings,
    db.spendingAccounts, db.spendingCategories, db.spendingTransactions, db.spendingBudgets, db.spendingRecurring,
    db.motoVehicles, db.motoFuelLogs, db.motoServices, db.motoParts, db.motoIssues, db.motoNotes, db.motoDocuments,
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
    // Moto (v3+)
    if (data.motoVehicles?.length)   { await db.motoVehicles.bulkPut(data.motoVehicles as never);   imported += data.motoVehicles.length }
    if (data.motoFuelLogs?.length)   { await db.motoFuelLogs.bulkPut(data.motoFuelLogs as never);   imported += data.motoFuelLogs.length }
    if (data.motoServices?.length)   { await db.motoServices.bulkPut(data.motoServices as never);   imported += data.motoServices.length }
    if (data.motoParts?.length)      { await db.motoParts.bulkPut(data.motoParts as never);         imported += data.motoParts.length }
    if (data.motoIssues?.length)     { await db.motoIssues.bulkPut(data.motoIssues as never);       imported += data.motoIssues.length }
    if (data.motoNotes?.length)      { await db.motoNotes.bulkPut(data.motoNotes as never);         imported += data.motoNotes.length }
    if (data.motoDocuments?.length)  { await db.motoDocuments.bulkPut(data.motoDocuments as never); imported += data.motoDocuments.length }
  })

  return { imported }
}

// ── Moto-only JSON export ─────────────────────────────────────────────────────

export async function downloadMotoExport(): Promise<void> {
  const [vehicles, fuelLogs, services, parts, issues, notes, documents] = await Promise.all([
    db.motoVehicles.toArray(),
    db.motoFuelLogs.toArray(),
    db.motoServices.toArray(),
    db.motoParts.toArray(),
    db.motoIssues.toArray(),
    db.motoNotes.toArray(),
    db.motoDocuments.toArray(),
  ])
  const payload = {
    version: 1,
    module: 'moto',
    exportedAt: new Date().toISOString(),
    data: { vehicles, fuelLogs, services, parts, issues, notes, documents },
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  triggerDownload(blob, `moto-backup-${new Date().toISOString().split('T')[0]}.json`)
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
