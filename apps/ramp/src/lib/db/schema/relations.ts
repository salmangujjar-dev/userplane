import { relations } from 'drizzle-orm';

import { cards } from './cards';
import { categories } from './categories';
import { employees } from './employees';
import { expenses } from './expenses';
import { vendors } from './vendors';

export const employeesRelations = relations(employees, ({ many }) => ({
  cards: many(cards),
  expenses: many(expenses),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  expenses: many(expenses),
  vendors: many(vendors),
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

export const cardsRelations = relations(cards, ({ one }) => ({
  employee: one(employees, {
    fields: [cards.employeeId],
    references: [employees.id],
  }),
}));

export const vendorsRelations = relations(vendors, ({ one }) => ({
  category: one(categories, {
    fields: [vendors.categoryId],
    references: [categories.id],
  }),
}));
