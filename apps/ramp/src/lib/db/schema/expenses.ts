import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { categories } from './categories';
import { employees } from './employees';

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  amount: real('amount').notNull(),
  description: text('description').notNull(),
  merchant: text('merchant').notNull(),
  date: text('date').notNull(),
  submittedAt: text('submitted_at').notNull(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] })
    .notNull()
    .default('pending'),
  notes: text('notes'),
  receiptUrl: text('receipt_url'),
});
