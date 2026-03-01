import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  position: text('position').notNull(),
  department: text('department').notNull(),
  avatarUrl: text('avatar_url'),
});
