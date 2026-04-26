import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { employees } from './employees';

export const cards = sqliteTable('cards', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id')
    .notNull()
    .references(() => employees.id),
  type: text('type', { enum: ['virtual', 'physical'] }).notNull(),
  status: text('status', { enum: ['active', 'locked', 'review'] })
    .notNull()
    .default('active'),
  monthlyLimit: real('monthly_limit').notNull(),
  controlsLabel: text('controls_label').notNull(),
  issuedAt: text('issued_at').notNull(),
  lastFour: text('last_four').notNull(),
});
