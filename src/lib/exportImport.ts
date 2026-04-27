import { db } from '@/db/database'

interface ExportPayload {
  version: number
  exportedAt: string
  data: {
    habits: unknown[]
    tasks: unknown[]
    entries: unknown[]
    tags: unknown[]
    settings: unknown[]
  }
}

export async function exportAll(): Promise<string> {
  const [habits, tasks, entries, tags, settings] = await Promise.all([
    db.habits.toArray(),
    db.tasks.toArray(),
    db.habitEntries.toArray(),
    db.tags.toArray(),
    db.settings.toArray(),
  ])

  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: { habits, tasks, entries, tags, settings },
  }

  return JSON.stringify(payload, null, 2)
}

export async function downloadExport(): Promise<void> {
  const json = await exportAll()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `streaks-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importAll(json: string): Promise<{ imported: number }> {
  const payload = JSON.parse(json) as ExportPayload

  if (payload.version !== 1) {
    throw new Error(`Unsupported export version: ${payload.version}`)
  }

  const { data } = payload
  let imported = 0

  await db.transaction('rw', [db.habits, db.tasks, db.habitEntries, db.tags, db.settings], async () => {
    if (data.habits?.length)   { await db.habits.bulkPut(data.habits as never);             imported += data.habits.length }
    if (data.tasks?.length)    { await db.tasks.bulkPut(data.tasks as never);               imported += data.tasks.length }
    if (data.entries?.length)  { await db.habitEntries.bulkPut(data.entries as never);      imported += data.entries.length }
    if (data.tags?.length)     { await db.tags.bulkPut(data.tags as never);                 imported += data.tags.length }
    if (data.settings?.length) { await db.settings.bulkPut(data.settings as never) }
  })

  return { imported }
}
