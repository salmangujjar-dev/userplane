import type {
  ApprovalQueueItem,
  BudgetSummary,
  CardSummary,
  CategoryBreakdownPoint,
  DashboardMetrics,
  EmployeeSpendSummary,
  SpendingTrendPoint,
  TopSpender,
  VendorSummary,
} from './mock-finance';
import type { Category, ExpenseWithRelations } from './types';

export interface DashboardSummary {
  cards: CardSummary[];
  vendors: VendorSummary[];
  budgets: BudgetSummary[];
  metrics: DashboardMetrics;
  approvals: ApprovalQueueItem[];
  receiptExceptions: ExpenseWithRelations[];
  spendingTrend: SpendingTrendPoint[];
}

export interface AnalyticsSummary {
  totalSpend: number;
  avgExpense: number;
  pendingCount: number;
  approvalRate: number;
  receiptCoverage: number;
  vendorCount: number;
  budgets: BudgetSummary[];
  vendors: VendorSummary[];
  cards: CardSummary[];
  categorySpend: Array<{ category: Category; spend: number; count: number }>;
  categoryBreakdown: CategoryBreakdownPoint[];
  topSpenders: TopSpender[];
  spendingTrends: Record<'30' | '90' | '365', SpendingTrendPoint[]>;
  cardReviewCount: number;
}

export interface ApprovalSummary {
  approvals: ApprovalQueueItem[];
  departments: string[];
  total: number;
  page: number;
  pageSize: number;
  totals: {
    pendingAmount: number;
    highRiskCount: number;
    agingCount: number;
  };
}

export interface CardDirectorySummary {
  cards: CardSummary[];
  departments: string[];
  total: number;
  page: number;
  pageSize: number;
  totals: {
    issued: number;
    active: number;
    locked: number;
    review: number;
    availableCredit: number;
  };
}

export interface VendorDirectorySummary {
  vendors: VendorSummary[];
  categories: Category[];
  expenseCount: number;
  total: number;
  page: number;
  pageSize: number;
  totals: {
    visibleSpend: number;
    visibleVendors: number;
    recurring: number;
    review: number;
  };
}

export interface EmployeeDirectorySummary {
  employees: EmployeeSpendSummary[];
  departments: string[];
  total: number;
  page: number;
  pageSize: number;
  totals: {
    visibleEmployees: number;
    approvedSpend: number;
    pendingItems: number;
    avgReceiptCoverage: number;
  };
}
