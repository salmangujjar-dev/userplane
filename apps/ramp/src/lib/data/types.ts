export type ExpenseStatus = 'pending' | 'approved' | 'rejected';
export type CardStatus = 'active' | 'locked' | 'review';
export type CardType = 'virtual' | 'physical';
export type VendorStatus = 'active' | 'review' | 'monitor';

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

export interface CorporateCard {
  id: string;
  employeeId: string;
  type: CardType;
  status: CardStatus;
  monthlyLimit: number;
  controlsLabel: string;
  issuedAt: string;
  lastFour: string;
}

export interface CorporateCardWithEmployee extends CorporateCard {
  employee: Employee;
}

export interface Vendor {
  id: string;
  merchant: string;
  categoryId: string;
  recurring: boolean;
  savingsOpportunity: string;
  ownerDepartment: string;
  status: VendorStatus;
}

export interface VendorWithCategory extends Vendor {
  category: Category;
}

export interface DepartmentBudget {
  id: string;
  department: string;
  monthlyBudget: number;
  ownerEmail: string;
  resetCadence: 'monthly';
}
