import { format, subDays } from 'date-fns';

import type {
  BudgetStatus,
  BudgetSummary,
  CardSummary,
  CategoryBreakdownPoint,
  EmployeeSpendSummary,
  SpendingTrendPoint,
  TopSpender,
  VendorSummary,
} from '@/lib/data/mock-finance';
import type {
  AnalyticsSummary,
  ApprovalSummary,
  CardDirectorySummary,
  DashboardSummary,
  EmployeeDirectorySummary,
  VendorDirectorySummary,
} from '@/lib/data/summary-types';
import * as repo from '@/lib/db/repository';

type PaginationFilters = {
  page?: number;
  pageSize?: number;
};

type ApprovalSummaryFilters = PaginationFilters & {
  search?: string;
  risk?: repo.ApprovalRisk;
  department?: string;
};

type CardSummaryFilters = PaginationFilters & {
  search?: string;
  status?: string;
  department?: string;
};

type VendorSummaryFilters = PaginationFilters & {
  search?: string;
  categoryId?: string;
  signal?: string;
};

type EmployeeSummaryFilters = PaginationFilters & {
  search?: string;
  department?: string;
};

const DEFAULT_PAGE_SIZE = 25;

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [
    rollup,
    cardAggregates,
    vendorAggregates,
    budgets,
    departmentSpend,
    approvals,
    receiptExceptions,
    spendingBuckets,
  ] = await Promise.all([
    repo.getExpenseRollup(30),
    repo.getCardSpendAggregates(),
    repo.getVendorSpendAggregates(),
    repo.getDepartmentBudgets(),
    repo.getDepartmentSpendAggregates(30),
    repo.getApprovalQueue({ page: 0, pageSize: 6 }),
    repo.getReceiptExceptions(4),
    repo.getSpendingTrendBuckets(30),
  ]);

  const cards = cardAggregates.map(toCardSummary);
  const vendors = vendorAggregates.map(toVendorSummary).sort((a, b) => b.totalSpend - a.totalSpend);
  const budgetSummaries = toBudgetSummaries(budgets, departmentSpend);

  return {
    cards,
    vendors: vendors.slice(0, 5),
    budgets: budgetSummaries.sort((a, b) => b.utilization - a.utilization).slice(0, 5),
    metrics: {
      periodSpend: roundCurrency(rollup.periodApprovedSpend),
      pendingSpend: roundCurrency(rollup.pendingSpend),
      pendingCount: rollup.pendingCount,
      approvalRate: percentage(rollup.approvedCount, rollup.totalCount),
      receiptCoverage: percentage(rollup.receiptCount, rollup.totalCount),
      activeCards: cards.filter((card) => card.status === 'active').length,
      vendorCount: vendors.length,
      budgetUtilization:
        budgetSummaries.length > 0
          ? Math.round(
              budgetSummaries.reduce((sum, budget) => sum + budget.utilization, 0) /
                budgetSummaries.length
            )
          : 0,
    },
    approvals: approvals.data,
    receiptExceptions,
    spendingTrend: toSpendingTrend(spendingBuckets, 30),
  };
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [
    rollup,
    cardAggregates,
    vendorAggregates,
    budgets,
    departmentSpend,
    categorySpend,
    topSpenders,
    trend30,
    trend90,
    trend365,
  ] = await Promise.all([
    repo.getExpenseRollup(30),
    repo.getCardSpendAggregates(),
    repo.getVendorSpendAggregates(),
    repo.getDepartmentBudgets(),
    repo.getDepartmentSpendAggregates(30),
    repo.getCategorySpendAggregates(),
    repo.getTopSpenderAggregates(),
    repo.getSpendingTrendBuckets(30),
    repo.getSpendingTrendBuckets(90),
    repo.getSpendingTrendBuckets(365),
  ]);

  const cards = cardAggregates.map(toCardSummary);
  const vendors = vendorAggregates.map(toVendorSummary).sort((a, b) => b.totalSpend - a.totalSpend);

  return {
    totalSpend: roundCurrency(rollup.approvedSpend),
    avgExpense:
      rollup.approvedCount > 0 ? roundCurrency(rollup.approvedSpend / rollup.approvedCount) : 0,
    pendingCount: rollup.pendingCount,
    approvalRate: percentage(rollup.approvedCount, rollup.totalCount),
    receiptCoverage: percentage(rollup.receiptCount, rollup.totalCount),
    vendorCount: vendors.length,
    budgets: toBudgetSummaries(budgets, departmentSpend)
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 6),
    vendors: vendors.slice(0, 6),
    cards,
    categorySpend: categorySpend.slice(0, 6),
    categoryBreakdown: toCategoryBreakdown(categorySpend),
    topSpenders: topSpenders.map(toTopSpender),
    spendingTrends: {
      '30': toSpendingTrend(trend30, 30),
      '90': toSpendingTrend(trend90, 90),
      '365': toSpendingTrend(trend365, 365),
    },
    cardReviewCount: cards.filter((card) => card.status !== 'active').length,
  };
}

export async function getApprovalSummary(
  filters: ApprovalSummaryFilters = {}
): Promise<ApprovalSummary> {
  const page = filters.page ?? 0;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const [approvals, totals, departments] = await Promise.all([
    repo.getApprovalQueue({ ...filters, page, pageSize }),
    repo.getApprovalQueueTotals(),
    repo.getApprovalDepartments(),
  ]);

  return {
    approvals: approvals.data,
    departments,
    total: approvals.total,
    page,
    pageSize,
    totals,
  };
}

export async function getCardDirectorySummary(
  filters: CardSummaryFilters = {}
): Promise<CardDirectorySummary> {
  const summaries = (await repo.getCardSpendAggregates()).map(toCardSummary);
  const departments = Array.from(new Set(summaries.map((card) => card.employee.department))).sort();
  const filtered = filterCardSummaries(summaries, filters);
  const page = paginate(filtered, filters);

  return {
    cards: page.items,
    departments,
    total: filtered.length,
    page: page.page,
    pageSize: page.pageSize,
    totals: {
      issued: summaries.length,
      active: summaries.filter((card) => card.status === 'active').length,
      locked: summaries.filter((card) => card.status === 'locked').length,
      review: summaries.filter((card) => card.status === 'review').length,
      availableCredit: roundCurrency(filtered.reduce((sum, card) => sum + card.available, 0)),
    },
  };
}

export async function getVendorDirectorySummary(
  filters: VendorSummaryFilters = {}
): Promise<VendorDirectorySummary> {
  const [vendorAggregates, categories, rollup] = await Promise.all([
    repo.getVendorSpendAggregates(),
    repo.getCategories(),
    repo.getExpenseRollup(),
  ]);
  const summaries = vendorAggregates
    .map(toVendorSummary)
    .sort((a, b) => b.totalSpend - a.totalSpend);
  const filtered = filterVendorSummaries(summaries, filters);
  const page = paginate(filtered, filters);

  return {
    vendors: page.items,
    categories,
    expenseCount: rollup.totalCount,
    total: filtered.length,
    page: page.page,
    pageSize: page.pageSize,
    totals: {
      visibleSpend: roundCurrency(filtered.reduce((sum, vendor) => sum + vendor.totalSpend, 0)),
      visibleVendors: filtered.length,
      recurring: summaries.filter((vendor) => vendor.recurring).length,
      review: summaries.filter((vendor) => vendor.savingsOpportunity !== 'Monitor').length,
    },
  };
}

export async function getEmployeeDirectorySummary(
  filters: EmployeeSummaryFilters = {}
): Promise<EmployeeDirectorySummary> {
  const summaries = (await repo.getEmployeeSpendAggregates())
    .map(toEmployeeSummary)
    .sort((a, b) => b.approvedSpend + b.pendingSpend - (a.approvedSpend + a.pendingSpend));
  const departments = [
    'All',
    ...Array.from(new Set(summaries.map((employee) => employee.department))).sort(),
  ];
  const filtered = filterEmployeeSummaries(summaries, filters);
  const page = paginate(filtered, filters);

  return {
    employees: page.items,
    departments,
    total: filtered.length,
    page: page.page,
    pageSize: page.pageSize,
    totals: {
      visibleEmployees: filtered.length,
      approvedSpend: roundCurrency(
        filtered.reduce((sum, employee) => sum + employee.approvedSpend, 0)
      ),
      pendingItems: filtered.reduce((sum, employee) => sum + employee.pendingCount, 0),
      avgReceiptCoverage:
        filtered.length > 0
          ? Math.round(
              filtered.reduce((sum, employee) => sum + employee.receiptCoverage, 0) /
                filtered.length
            )
          : 0,
    },
  };
}

function toCardSummary(card: repo.CardSpendAggregate): CardSummary {
  const spentThisMonth = roundCurrency(card.spentThisMonth);
  const pendingAmount = roundCurrency(card.pendingAmount);

  return {
    id: card.id,
    employee: card.employee,
    type: card.type === 'virtual' ? 'Virtual' : 'Physical',
    status: card.status,
    monthlyLimit: card.monthlyLimit,
    spentThisMonth,
    pendingAmount,
    utilization: percentage(spentThisMonth + pendingAmount, card.monthlyLimit),
    available: roundCurrency(Math.max(0, card.monthlyLimit - spentThisMonth - pendingAmount)),
    lastActivityDate: card.lastActivityDate,
    lastMerchant: card.lastMerchant ?? 'No activity',
    controlsLabel: card.controlsLabel,
    issuedAt: card.issuedAt,
    lastFour: card.lastFour,
  };
}

function toVendorSummary(vendor: repo.VendorSpendAggregate): VendorSummary {
  return {
    id: vendor.id,
    merchant: vendor.merchant,
    totalSpend: roundCurrency(vendor.totalSpend),
    approvedSpend: roundCurrency(vendor.approvedSpend),
    pendingSpend: roundCurrency(vendor.pendingSpend),
    transactionCount: vendor.transactionCount,
    employeeCount: vendor.employeeCount,
    lastChargeDate: vendor.lastChargeDate,
    categoryName: vendor.category.name,
    categoryId: vendor.categoryId,
    averageAmount:
      vendor.transactionCount > 0 ? roundCurrency(vendor.totalSpend / vendor.transactionCount) : 0,
    recurring: vendor.recurring,
    savingsOpportunity: vendor.savingsOpportunity,
    ownerDepartment: vendor.ownerDepartment,
    status: vendor.status,
  };
}

function toEmployeeSummary(employee: repo.EmployeeSpendAggregate): EmployeeSpendSummary {
  return {
    ...employee,
    approvedSpend: roundCurrency(employee.approvedSpend),
    pendingSpend: roundCurrency(employee.pendingSpend),
    rejectedSpend: roundCurrency(employee.rejectedSpend),
    totalSpend: roundCurrency(employee.totalSpend),
    avgExpense:
      employee.expenseCount > 0 ? roundCurrency(employee.totalSpend / employee.expenseCount) : 0,
    receiptCoverage: percentage(employee.receiptCount, employee.expenseCount),
  };
}

function toBudgetSummaries(
  budgets: Array<{ department: string; monthlyBudget: number }>,
  departmentSpend: repo.DepartmentSpendAggregate[]
): BudgetSummary[] {
  const spendByDepartment = new Map(departmentSpend.map((item) => [item.department, item]));
  const departments = Array.from(
    new Set([
      ...budgets.map((budget) => budget.department),
      ...departmentSpend.map((item) => item.department),
    ])
  ).sort();

  return departments.map((department) => {
    const budget = budgets.find((item) => item.department === department);
    const spend = spendByDepartment.get(department);
    const approvedSpend = roundCurrency(spend?.approvedSpend ?? 0);
    const pendingSpend = roundCurrency(spend?.pendingSpend ?? 0);
    const monthlyBudget = budget?.monthlyBudget ?? 25000;
    const utilization = percentage(approvedSpend + pendingSpend, monthlyBudget);

    return {
      department,
      monthlyBudget,
      approvedSpend,
      pendingSpend,
      employeeCount: spend?.employeeCount ?? 0,
      utilization,
      remaining: roundCurrency(monthlyBudget - approvedSpend - pendingSpend),
      status: getBudgetStatus(utilization),
    };
  });
}

function getBudgetStatus(utilization: number): BudgetStatus {
  if (utilization >= 100) return 'over';
  if (utilization >= 82) return 'watch';
  return 'healthy';
}

function toCategoryBreakdown(items: repo.CategorySpendAggregate[]): CategoryBreakdownPoint[] {
  return items
    .filter((item) => item.spend > 0)
    .map((item) => ({ name: item.category.name, value: roundCurrency(item.spend) }));
}

function toTopSpender(item: repo.TopSpenderAggregate): TopSpender {
  return {
    name: item.name,
    total: roundCurrency(item.total),
  };
}

function toSpendingTrend(rows: repo.SpendingTrendBucket[], days: number): SpendingTrendPoint[] {
  const totalsByBucket = new Map(rows.map((row) => [row.bucket, row.total]));
  const now = new Date();

  if (days > 90) {
    const seen = new Set<string>();
    const points: SpendingTrendPoint[] = [];
    for (let i = 0; i <= days; i += 1) {
      const date = subDays(now, days - i);
      const key = format(date, 'yyyy-MM');
      if (seen.has(key)) continue;
      seen.add(key);
      points.push({
        name: format(date, 'MMM yyyy'),
        total: roundCurrency(totalsByBucket.get(key) ?? 0),
      });
    }
    return points;
  }

  return Array.from({ length: days + 1 }).map((_, index) => {
    const date = subDays(now, days - index);
    const key = format(date, 'yyyy-MM-dd');
    return {
      name: format(date, 'MMM d'),
      total: roundCurrency(totalsByBucket.get(key) ?? 0),
    };
  });
}

function paginate<T>(items: T[], filters: PaginationFilters) {
  const page = filters.page ?? 0;
  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const start = page * pageSize;
  return { items: items.slice(start, start + pageSize), page, pageSize };
}

function filterCardSummaries(cards: CardSummary[], filters: CardSummaryFilters) {
  const query = filters.search?.trim().toLowerCase();
  const status = filters.status && filters.status !== 'all' ? filters.status : undefined;
  const department =
    filters.department && filters.department !== 'all' ? filters.department : undefined;

  return cards.filter((card) => {
    const searchMatches =
      !query ||
      card.employee.name.toLowerCase().includes(query) ||
      card.employee.email.toLowerCase().includes(query) ||
      card.lastMerchant.toLowerCase().includes(query) ||
      card.controlsLabel.toLowerCase().includes(query);
    const statusMatches = !status || card.status === status;
    const departmentMatches = !department || card.employee.department === department;
    return searchMatches && statusMatches && departmentMatches;
  });
}

function filterVendorSummaries(vendors: VendorSummary[], filters: VendorSummaryFilters) {
  const query = filters.search?.trim().toLowerCase();
  const categoryId =
    filters.categoryId && filters.categoryId !== 'all' ? filters.categoryId : undefined;
  const signal = filters.signal && filters.signal !== 'all' ? filters.signal : undefined;

  return vendors.filter((vendor) => {
    const searchMatches =
      !query ||
      vendor.merchant.toLowerCase().includes(query) ||
      vendor.categoryName.toLowerCase().includes(query) ||
      vendor.savingsOpportunity.toLowerCase().includes(query);
    const categoryMatches = !categoryId || vendor.categoryId === categoryId;
    const signalMatches =
      !signal ||
      (signal === 'recurring' && vendor.recurring) ||
      (signal === 'review' && vendor.savingsOpportunity !== 'Monitor') ||
      (signal === 'monitor' && vendor.savingsOpportunity === 'Monitor');

    return searchMatches && categoryMatches && signalMatches;
  });
}

function filterEmployeeSummaries(
  employees: EmployeeSpendSummary[],
  filters: EmployeeSummaryFilters
) {
  const query = filters.search?.trim().toLowerCase();
  const department =
    filters.department && filters.department !== 'All' ? filters.department : undefined;

  return employees.filter((employee) => {
    const departmentMatches = !department || employee.department === department;
    const searchMatches =
      !query ||
      employee.name.toLowerCase().includes(query) ||
      employee.email.toLowerCase().includes(query) ||
      employee.position.toLowerCase().includes(query) ||
      employee.department.toLowerCase().includes(query);

    return departmentMatches && searchMatches;
  });
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function percentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}
