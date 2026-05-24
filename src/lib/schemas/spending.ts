import { z } from 'zod'

export const accountSchema = z.object({
  name:           z.string().min(1, 'Name is required').max(100),
  type:           z.enum(['cash', 'bank', 'credit_card', 'wallet', 'other']).default('bank'),
  openingBalance: z.coerce.number().default(0),
  color:          z.string().default('#6366f1'),
  icon:           z.string().default('🏦'),
})

export const transactionSchema = z.object({
  type:        z.enum(['income', 'expense', 'transfer']).default('expense'),
  amount:      z.coerce.number({ invalid_type_error: 'Enter a valid amount' })
                 .positive('Amount must be greater than 0'),
  date:        z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date is required'),
  accountId:   z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  categoryId:  z.string().optional(),
  tags:        z.array(z.string()).default([]),
  note:        z.string().max(500).optional().or(z.literal('')).transform(v => v || undefined),
  payee:       z.string().max(100).optional().or(z.literal('')).transform(v => v || undefined),
}).superRefine((data, ctx) => {
  if (data.type === 'transfer' && !data.toAccountId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Destination account required', path: ['toAccountId'] })
  }
  if (data.type !== 'transfer' && !data.categoryId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category is required', path: ['categoryId'] })
  }
})

export const categorySchema = z.object({
  name:     z.string().min(1, 'Name is required').max(60),
  type:     z.enum(['income', 'expense']).default('expense'),
  parentId: z.string().optional(),
  color:    z.string().default('#6366f1'),
  icon:     z.string().default('📦'),
})

export const budgetSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(100),
  amount:      z.coerce.number({ invalid_type_error: 'Enter a valid amount' }).positive('Amount must be greater than 0'),
  period:      z.enum(['monthly', 'weekly', 'yearly', 'custom']).default('monthly'),
  startDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date required'),
  endDate:     z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  rollover:    z.boolean().default(false),
})

export type AccountFormValues     = z.infer<typeof accountSchema>
export type TransactionFormValues = z.infer<typeof transactionSchema>
export type CategoryFormValues    = z.infer<typeof categorySchema>
export type BudgetFormValues      = z.infer<typeof budgetSchema>
