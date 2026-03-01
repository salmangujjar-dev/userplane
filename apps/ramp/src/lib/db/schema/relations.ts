import { relations } from 'drizzle-orm';

import { categories } from './categories';
import { employees } from './employees';
import { expenses } from './expenses';

export const employeesRelations = relations(employees, ({ many }) => ({
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  employee: one(employees, {
    fields: [expenses.employeeId],
    references: [employees.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
}));
