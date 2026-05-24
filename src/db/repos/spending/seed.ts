import { categoriesRepo } from './categories'
import { settingsRepo } from '@/db/repos/settings'

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining',   icon: '🍽️',  color: '#f59e0b' },
  { name: 'Transport',       icon: '🚗',  color: '#3b82f6' },
  { name: 'Bills & Utilities', icon: '💡', color: '#8b5cf6' },
  { name: 'Shopping',        icon: '🛍️',  color: '#ec4899' },
  { name: 'Entertainment',   icon: '🎬',  color: '#06b6d4' },
  { name: 'Health',          icon: '💊',  color: '#10b981' },
  { name: 'Education',       icon: '📚',  color: '#f97316' },
  { name: 'Travel',          icon: '✈️',  color: '#6366f1' },
  { name: 'Other',           icon: '📦',  color: '#6b7280' },
]

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary',          icon: '💼',  color: '#10b981' },
  { name: 'Freelance',       icon: '💻',  color: '#3b82f6' },
  { name: 'Investment',      icon: '📈',  color: '#f59e0b' },
  { name: 'Refund',          icon: '↩️',  color: '#6366f1' },
  { name: 'Gift',            icon: '🎁',  color: '#ec4899' },
  { name: 'Other Income',    icon: '💰',  color: '#6b7280' },
]

export async function seedDefaultCategories() {
  const seeded = await settingsRepo.get<boolean>('spendingCategoriesSeeded', false)
  if (seeded) return

  const existing = await categoriesRepo.getAll(true)
  if (existing.length > 0) {
    await settingsRepo.set('spendingCategoriesSeeded', true)
    return
  }

  await Promise.all([
    ...DEFAULT_EXPENSE_CATEGORIES.map(c =>
      categoriesRepo.create({ ...c, type: 'expense', archived: false }),
    ),
    ...DEFAULT_INCOME_CATEGORIES.map(c =>
      categoriesRepo.create({ ...c, type: 'income', archived: false }),
    ),
  ])

  await settingsRepo.set('spendingCategoriesSeeded', true)
}
