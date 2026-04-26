import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { categories } from './categories';

export const vendors = sqliteTable('vendors', {
  id: text('id').primaryKey(),
  merchant: text('merchant').notNull().unique(),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
  savingsOpportunity: text('savings_opportunity').notNull(),
  ownerDepartment: text('owner_department').notNull(),
  status: text('status', { enum: ['active', 'review', 'monitor'] })
    .notNull()
    .default('active'),
});
