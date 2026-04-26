import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const departmentBudgets = sqliteTable('department_budgets', {
  id: text('id').primaryKey(),
  department: text('department').notNull().unique(),
  monthlyBudget: real('monthly_budget').notNull(),
  ownerEmail: text('owner_email').notNull(),
  resetCadence: text('reset_cadence', { enum: ['monthly'] })
    .notNull()
    .default('monthly'),
});
