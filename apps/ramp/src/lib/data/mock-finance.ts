import { format, isAfter, startOfDay, subDays } from 'date-fns';

import type {
  CardStatus,
  Category,
  CorporateCardWithEmployee,
  DepartmentBudget,
  Employee,
  ExpenseWithRelations,
  VendorStatus,
  VendorWithCategory,
} from './types';

export type RiskLevel = 'low' | 'medium' | 'high';
export type BudgetStatus = 'healthy' | 'watch' | 'over';
export type CardDisplayType = 'Virtual' | 'Physical';

export interface EmployeeSpendSummary extends Employee {
  approvedSpend: number;
  pendingSpend: number;
  rejectedSpend: number;
  totalSpend: number;
  pendingCount: number;
  expenseCount: number;
  avgExpense: number;
  lastExpenseDate: string | null;
  receiptCoverage: number;
}

export interface BudgetSummary {
  department: string;
  monthlyBudget: number;
  approvedSpend: number;
  pendingSpend: number;
  employeeCount: number;
  utilization: number;
  remaining: number;
  status: BudgetStatus;
}

export interface VendorSummary {
  id: string;
  merchant: string;
  totalSpend: number;
  approvedSpend: number;
  pendingSpend: number;
  transactionCount: number;
  employeeCount: number;
  lastChargeDate: string | null;
  categoryName: string;
  categoryId: string;
  averageAmount: number;
  recurring: boolean;
  savingsOpportunity: string;
  ownerDepartment: string;
  status: VendorStatus;
}

export interface CardSummary {
  id: string;
  employee: Employee;
  type: CardDisplayType;
  status: CardStatus;
  monthlyLimit: number;
  spentThisMonth: number;
  pendingAmount: number;
  utilization: number;
  available: number;
  lastActivityDate: string | null;
  lastMerchant: string;
  controlsLabel: string;
  issuedAt: string;
  lastFour: string;
}

export interface ApprovalQueueItem {
  expense: ExpenseWithRelations;
  submittedAgeDays: number;
  riskLevel: RiskLevel;
  policyNote: string;
}

export interface DashboardMetrics {
  periodSpend: number;
  pendingSpend: number;
  pendingCount: number;
  approvalRate: number;
  receiptCoverage: number;
  activeCards: number;
  vendorCount: number;
  budgetUtilization: number;
}

export interface SpendingTrendPoint {
  name: string;
  total: number;
}

export interface CategoryBreakdownPoint {
  name: string;
  value: number;
}

export interface TopSpender {
  name: string;
  total: number;
}

export function deriveEmployeeSpendSummaries(
  employees: Employee[],
  expenses: ExpenseWithRelations[]
): EmployeeSpendSummary[] {
  return employees.map((employee) => {
    const employeeExpenses = expenses.filter((expense) => expense.employeeId === employee.id);
    const approved = employeeExpenses.filter((expense) => expense.status === 'approved');
    const pending = employeeExpenses.filter((expense) => expense.status === 'pending');
    const rejected = employeeExpenses.filter((expense) => expense.status === 'rejected');
    const receiptCount = employeeExpenses.filter((expense) => Boolean(expense.receiptUrl)).length;
    const lastExpense = [...employeeExpenses].sort(sortByDateDesc)[0];
    const totalSpend = employeeExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      ...employee,
      approvedSpend: sumAmounts(approved),
      pendingSpend: sumAmounts(pending),
      rejectedSpend: sumAmounts(rejected),
      totalSpend,
      pendingCount: pending.length,
      expenseCount: employeeExpenses.length,
      avgExpense: employeeExpenses.length > 0 ? totalSpend / employeeExpenses.length : 0,
      lastExpenseDate: lastExpense?.date ?? null,
      receiptCoverage: percentage(receiptCount, employeeExpenses.length),
    };
  });
}

export function deriveBudgetSummaries(
  budgets: DepartmentBudget[],
  employees: Employee[],
  expenses: ExpenseWithRelations[],
  days = 30
): BudgetSummary[] {
  const periodExpenses = expenses.filter((expense) => isWithinDays(expense.date, days));
  const departments = Array.from(
    new Set([
      ...budgets.map((budget) => budget.department),
      ...employees.map((employee) => employee.department),
    ])
  ).sort();

  return departments.map((department) => {
    const departmentEmployees = employees.filter((employee) => employee.department === department);
    const budget = budgets.find((item) => item.department === department);
    const departmentExpense = periodExpenses.filter(
      (expense) => expense.employee?.department === department
    );
    const approvedSpend = sumAmounts(
      departmentExpense.filter((expense) => expense.status === 'approved')
    );
    const pendingSpend = sumAmounts(
      departmentExpense.filter((expense) => expense.status === 'pending')
    );
    const monthlyBudget = budget?.monthlyBudget ?? 25000;
    const utilization = percentage(approvedSpend + pendingSpend, monthlyBudget);
    const remaining = monthlyBudget - approvedSpend - pendingSpend;

    return {
      department,
      monthlyBudget,
      approvedSpend,
      pendingSpend,
      employeeCount: departmentEmployees.length,
      utilization,
      remaining,
      status: utilization >= 100 ? 'over' : utilization >= 82 ? 'watch' : 'healthy',
    };
  });
}

export function deriveVendorSummaries(
  vendors: VendorWithCategory[],
  expenses: ExpenseWithRelations[]
): VendorSummary[] {
  const spendByMerchant = new Map<
    string,
    {
      approvedSpend: number;
      pendingSpend: number;
      totalSpend: number;
      transactionCount: number;
      employeeIds: Set<string>;
      categoryCounts: Map<string, { name: string; count: number }>;
      lastChargeDate: string;
    }
  >();

  expenses.forEach((expense) => {
    const current = spendByMerchant.get(expense.merchant) ?? {
      approvedSpend: 0,
      pendingSpend: 0,
      totalSpend: 0,
      transactionCount: 0,
      employeeIds: new Set<string>(),
      categoryCounts: new Map<string, { name: string; count: number }>(),
      lastChargeDate: expense.date,
    };

    current.totalSpend += expense.amount;
    current.transactionCount += 1;
    current.employeeIds.add(expense.employeeId);
    if (expense.status === 'approved') current.approvedSpend += expense.amount;
    if (expense.status === 'pending') current.pendingSpend += expense.amount;
    if (new Date(expense.date).getTime() > new Date(current.lastChargeDate).getTime()) {
      current.lastChargeDate = expense.date;
    }

    const categoryId = expense.categoryId;
    const categoryName = expense.category?.name ?? 'Uncategorized';
    const category = current.categoryCounts.get(categoryId) ?? { name: categoryName, count: 0 };
    category.count += 1;
    current.categoryCounts.set(categoryId, category);
    spendByMerchant.set(expense.merchant, current);
  });

  return vendors
    .map((vendor) => {
      const spend = spendByMerchant.get(vendor.merchant);
      const [categoryId, category] = spend
        ? (Array.from(spend.categoryCounts.entries()).sort(
            (a, b) => b[1].count - a[1].count
          )[0] ?? [vendor.categoryId, { name: vendor.category?.name ?? 'Uncategorized', count: 0 }])
        : [vendor.categoryId, { name: vendor.category?.name ?? 'Uncategorized', count: 0 }];
      const transactionCount = spend?.transactionCount ?? 0;
      const totalSpend = spend?.totalSpend ?? 0;

      return {
        id: vendor.id,
        merchant: vendor.merchant,
        totalSpend: roundCurrency(totalSpend),
        approvedSpend: roundCurrency(spend?.approvedSpend ?? 0),
        pendingSpend: roundCurrency(spend?.pendingSpend ?? 0),
        transactionCount,
        employeeCount: spend?.employeeIds.size ?? 0,
        lastChargeDate: spend?.lastChargeDate ?? null,
        categoryName: category.name,
        categoryId,
        averageAmount: transactionCount > 0 ? roundCurrency(totalSpend / transactionCount) : 0,
        recurring: vendor.recurring,
        savingsOpportunity: vendor.savingsOpportunity,
        ownerDepartment: vendor.ownerDepartment,
        status: vendor.status,
      };
    })
    .sort((a, b) => b.totalSpend - a.totalSpend);
}

export function deriveCardSummaries(
  cards: CorporateCardWithEmployee[],
  expenses: ExpenseWithRelations[]
): CardSummary[] {
  return cards.map((card) => {
    const employee = card.employee;
    const employeeExpenses = expenses.filter((expense) => expense.employeeId === employee.id);
    const periodExpenses = employeeExpenses.filter((expense) => isWithinDays(expense.date, 30));
    const lastExpense = [...employeeExpenses].sort(sortByDateDesc)[0];
    const spentThisMonth = sumAmounts(
      periodExpenses.filter((expense) => expense.status === 'approved')
    );
    const pendingAmount = sumAmounts(
      periodExpenses.filter((expense) => expense.status === 'pending')
    );
    const monthlyLimit = card.monthlyLimit;
    const utilization = percentage(spentThisMonth + pendingAmount, monthlyLimit);

    return {
      id: card.id,
      employee,
      type: card.type === 'virtual' ? 'Virtual' : 'Physical',
      status: card.status,
      monthlyLimit,
      spentThisMonth: roundCurrency(spentThisMonth),
      pendingAmount: roundCurrency(pendingAmount),
      utilization,
      available: roundCurrency(Math.max(0, monthlyLimit - spentThisMonth - pendingAmount)),
      lastActivityDate: lastExpense?.date ?? null,
      lastMerchant: lastExpense?.merchant ?? 'No activity',
      controlsLabel: card.controlsLabel,
      issuedAt: card.issuedAt,
      lastFour: card.lastFour,
    };
  });
}

export function deriveApprovalQueue(expenses: ExpenseWithRelations[]): ApprovalQueueItem[] {
  return expenses
    .filter((expense) => expense.status === 'pending')
    .map((expense) => {
      const submittedAgeDays = getAgeDays(expense.submittedAt);
      const riskLevel = getRiskLevel(expense, submittedAgeDays);

      return {
        expense,
        submittedAgeDays,
        riskLevel,
        policyNote: getPolicyNote(expense, submittedAgeDays, riskLevel),
      };
    })
    .sort((a, b) => {
      const riskRank: Record<RiskLevel, number> = { high: 3, medium: 2, low: 1 };
      return (
        riskRank[b.riskLevel] - riskRank[a.riskLevel] || b.submittedAgeDays - a.submittedAgeDays
      );
    });
}

export function deriveDashboardMetrics(
  expenses: ExpenseWithRelations[],
  cards: CardSummary[],
  vendors: VendorSummary[],
  budgets: BudgetSummary[],
  days = 30
): DashboardMetrics {
  const periodExpenses = expenses.filter((expense) => isWithinDays(expense.date, days));
  const approved = expenses.filter((expense) => expense.status === 'approved');
  const pending = expenses.filter((expense) => expense.status === 'pending');
  const receiptCount = expenses.filter((expense) => Boolean(expense.receiptUrl)).length;

  return {
    periodSpend: sumAmounts(periodExpenses.filter((expense) => expense.status === 'approved')),
    pendingSpend: sumAmounts(pending),
    pendingCount: pending.length,
    approvalRate: percentage(approved.length, expenses.length),
    receiptCoverage: percentage(receiptCount, expenses.length),
    activeCards: cards.filter((card) => card.status === 'active').length,
    vendorCount: vendors.length,
    budgetUtilization:
      budgets.length > 0
        ? Math.round(budgets.reduce((sum, budget) => sum + budget.utilization, 0) / budgets.length)
        : 0,
  };
}

export function getCategorySpend(
  categories: Category[],
  expenses: ExpenseWithRelations[]
): Array<{ category: Category; spend: number; count: number }> {
  return categories
    .map((category) => {
      const categoryExpenses = expenses.filter(
        (expense) => expense.categoryId === category.id && expense.status === 'approved'
      );

      return {
        category,
        spend: sumAmounts(categoryExpenses),
        count: categoryExpenses.length,
      };
    })
    .sort((a, b) => b.spend - a.spend);
}

export function getSpendingTrendData(
  expenses: ExpenseWithRelations[],
  days: number
): SpendingTrendPoint[] {
  const now = new Date();
  const start = startOfDay(subDays(now, days));
  const buckets: Record<string, number> = {};

  for (let i = 0; i <= days; i++) {
    const d = subDays(now, days - i);
    const key = format(d, days > 90 ? 'MMM yyyy' : 'MMM d');
    buckets[key] = 0;
  }

  expenses
    .filter((expense) => expense.status === 'approved' && isAfter(new Date(expense.date), start))
    .forEach((expense) => {
      const key = format(new Date(expense.date), days > 90 ? 'MMM yyyy' : 'MMM d');
      if (key in buckets && buckets[key] !== undefined) {
        buckets[key] += expense.amount;
      }
    });

  const entries = Object.entries(buckets);
  const seen = new Set<string>();
  const deduped =
    days > 90
      ? entries.filter(([key]) => {
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
      : entries;

  return deduped.map(([name, total]) => ({ name, total: roundCurrency(total) }));
}

export function getCategoryBreakdownData(
  expenses: ExpenseWithRelations[]
): CategoryBreakdownPoint[] {
  const map = new Map<string, { name: string; value: number }>();

  expenses
    .filter((expense) => expense.status === 'approved')
    .forEach((expense) => {
      const categoryName = expense.category?.name ?? 'Unknown';
      const existing = map.get(categoryName) ?? { name: categoryName, value: 0 };
      existing.value += expense.amount;
      map.set(categoryName, existing);
    });

  return Array.from(map.values())
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ ...item, value: roundCurrency(item.value) }));
}

export function getTopSpenders(expenses: ExpenseWithRelations[]): TopSpender[] {
  const map = new Map<string, { name: string; total: number }>();

  expenses
    .filter((expense) => expense.status === 'approved')
    .forEach((expense) => {
      const name = expense.employee?.name ?? 'Unknown';
      const existing = map.get(expense.employeeId) ?? { name, total: 0 };
      existing.total += expense.amount;
      map.set(expense.employeeId, existing);
    });

  return Array.from(map.values())
    .map((spender) => ({ ...spender, total: roundCurrency(spender.total) }))
    .sort((a, b) => b.total - a.total);
}

export function getReceiptExceptions(expenses: ExpenseWithRelations[]) {
  return expenses
    .filter((expense) => !expense.receiptUrl && expense.amount >= 250)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);
}

function sortByDateDesc(a: ExpenseWithRelations, b: ExpenseWithRelations) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function sumAmounts(expenses: ExpenseWithRelations[]) {
  return roundCurrency(expenses.reduce((sum, expense) => sum + expense.amount, 0));
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function isWithinDays(date: string, days: number) {
  const current = new Date();
  const start = new Date(current);
  start.setDate(current.getDate() - days);
  return new Date(date).getTime() >= start.getTime();
}

function getAgeDays(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function getRiskLevel(expense: ExpenseWithRelations, ageDays: number): RiskLevel {
  if (expense.amount >= 2500 || ageDays >= 10 || !expense.receiptUrl) return 'high';
  if (expense.amount >= 750 || ageDays >= 5) return 'medium';
  return 'low';
}

function getPolicyNote(expense: ExpenseWithRelations, ageDays: number, riskLevel: RiskLevel) {
  if (!expense.receiptUrl) return 'Receipt missing';
  if (expense.amount >= 2500) return 'High-value review';
  if (ageDays >= 10) return 'Aging approval';
  if (riskLevel === 'medium') return 'Manager review';
  return 'Ready to approve';
}
