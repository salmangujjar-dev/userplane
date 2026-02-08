export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Expense {
  id: string;
  employeeId: string;
  categoryId: string;
  amount: number;
  description: string;
  merchant: string;
  date: string; // ISO date string
  submittedAt: string; // ISO date string
  status: ExpenseStatus;
  notes?: string;
  receiptUrl?: string;
}

export interface ExpenseWithRelations extends Expense {
  employee: Employee;
  category: Category;
}
