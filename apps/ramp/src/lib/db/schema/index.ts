export { account, session, user, verification } from './auth';
export type { cards as CardsTable } from './cards';
export { cards } from './cards';
export type { categories as CategoriesTable } from './categories';
export { categories } from './categories';
export type { departmentBudgets as DepartmentBudgetsTable } from './department-budgets';
export { departmentBudgets } from './department-budgets';
export type { employees as EmployeesTable } from './employees';
export { employees } from './employees';
export type { expenses as ExpensesTable } from './expenses';
export { expenses } from './expenses';
export { featureFlagOverrides, variantFlagOverrides } from './feature-flag-overrides';
export {
  cardsRelations,
  categoriesRelations,
  employeesRelations,
  expensesRelations,
  vendorsRelations,
} from './relations';

import type { cards } from './cards';
import type { categories } from './categories';
import type { departmentBudgets } from './department-budgets';
import type { employees } from './employees';
import type { expenses } from './expenses';
import type { vendors } from './vendors';
export type { vendors as VendorsTable } from './vendors';
export { vendors } from './vendors';

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Card = typeof cards.$inferSelect;
export type NewCard = typeof cards.$inferInsert;
export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;
export type DepartmentBudget = typeof departmentBudgets.$inferSelect;
export type NewDepartmentBudget = typeof departmentBudgets.$inferInsert;
