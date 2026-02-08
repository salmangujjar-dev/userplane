import {
  categories as seedCategories,
  employees as seedEmployees,
  expenses as seedExpenses,
} from './seed';
import type { Category, Employee, Expense } from './types';

class DataStore {
  employees: Employee[];
  categories: Category[];
  expenses: Expense[];

  constructor() {
    this.employees = [...seedEmployees];
    this.categories = [...seedCategories];
    this.expenses = [...seedExpenses];
  }

  getExpenses(filters?: {
    status?: string;
    categoryId?: string;
    employeeId?: string;
    search?: string;
    sortField?: string;
    sortDir?: string;
    page?: number;
    pageSize?: number;
  }) {
    let result = [...this.expenses];

    if (filters?.status) {
      result = result.filter((e) => e.status === filters.status);
    }
    if (filters?.categoryId) {
      result = result.filter((e) => e.categoryId === filters.categoryId);
    }
    if (filters?.employeeId) {
      result = result.filter((e) => e.employeeId === filters.employeeId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.merchant.toLowerCase().includes(q) ||
          this.getEmployee(e.employeeId)?.name.toLowerCase().includes(q)
      );
    }

    // Sort
    const sortField = filters?.sortField ?? 'date';
    const sortDir = filters?.sortDir === 'asc' ? 1 : -1;
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'employee':
          cmp = (this.getEmployee(a.employeeId)?.name ?? '').localeCompare(
            this.getEmployee(b.employeeId)?.name ?? ''
          );
          break;
        case 'category':
          cmp = (this.getCategory(a.categoryId)?.name ?? '').localeCompare(
            this.getCategory(b.categoryId)?.name ?? ''
          );
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'date':
        default:
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
      }
      return cmp * sortDir;
    });

    const total = result.length;

    // Paginate only when page is explicitly provided
    if (filters?.page != null) {
      const page = filters.page;
      const pageSize = filters.pageSize ?? 10;
      result = result.slice(page * pageSize, (page + 1) * pageSize);
    }

    return { data: result, total };
  }

  getExpense(id: string) {
    return this.expenses.find((e) => e.id === id) ?? null;
  }

  createExpense(data: Omit<Expense, 'id' | 'submittedAt' | 'status'>) {
    const expense: Expense = {
      ...data,
      id: `exp_${Date.now().toString(16)}`,
      submittedAt: new Date().toISOString(),
      status: 'pending',
    };
    this.expenses.unshift(expense);
    return expense;
  }

  updateExpense(id: string, data: Partial<Expense>) {
    const index = this.expenses.findIndex((e) => e.id === id);
    if (index === -1) return null;
    this.expenses[index] = { ...this.expenses[index], ...data };
    return this.expenses[index];
  }

  getEmployee(id: string) {
    return this.employees.find((e) => e.id === id) ?? null;
  }

  getEmployees() {
    return [...this.employees];
  }

  getCategories() {
    return [...this.categories];
  }

  getCategory(id: string) {
    return this.categories.find((c) => c.id === id) ?? null;
  }
}

// Singleton
const globalForStore = globalThis as unknown as { store: DataStore };
export const store = globalForStore.store || new DataStore();
if (process.env.NODE_ENV !== 'production') globalForStore.store = store;
