export { account, session, user, verification } from './auth';
export type { categories as CategoriesTable } from './categories';
export { categories } from './categories';
export type { employees as EmployeesTable } from './employees';
export { employees } from './employees';
export type { expenses as ExpensesTable } from './expenses';
export { expenses } from './expenses';
export { featureFlagOverrides, variantFlagOverrides } from './feature-flag-overrides';
export { categoriesRelations, employeesRelations, expensesRelations } from './relations';

import type { categories } from './categories';
import type { employees } from './employees';
import type { expenses } from './expenses';

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
