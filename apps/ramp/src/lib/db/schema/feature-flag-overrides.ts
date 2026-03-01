import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const featureFlagOverrides = sqliteTable('feature_flag_overrides', {
  flag: text('flag').primaryKey(),
  value: integer('value', { mode: 'boolean' }).notNull(),
  updatedAt: text('updated_at').notNull(),
});
