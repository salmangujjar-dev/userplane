import { and, asc, count, desc, eq, like, or, type SQL, sql } from 'drizzle-orm';

import type {
  Category,
  CorporateCardWithEmployee,
  DepartmentBudget,
  Employee,
  Expense,
  ExpenseWithRelations,
  VendorWithCategory,
} from '@/lib/data/types';

import { db } from './client';
import { cards, categories, departmentBudgets, employees, expenses, vendors } from './schema';

export type ExpenseFilters = {
  status?: string;
  categoryId?: string;
  employeeId?: string;
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
};

export type ApprovalRisk = 'low' | 'medium' | 'high';

export type ApprovalFilters = {
  search?: string;
  risk?: ApprovalRisk;
  department?: string;
  page?: number;
  pageSize?: number;
};

export type ExpenseRollup = {
  totalCount: number;
  approvedCount: number;
  pendingCount: number;
  receiptCount: number;
  approvedSpend: number;
  pendingSpend: number;
  periodApprovedSpend: number;
};

export type CardSpendAggregate = CorporateCardWithEmployee & {
  spentThisMonth: number;
  pendingAmount: number;
  lastActivityDate: string | null;
  lastMerchant: string | null;
};

export type VendorSpendAggregate = VendorWithCategory & {
  totalSpend: number;
  approvedSpend: number;
  pendingSpend: number;
  transactionCount: number;
  employeeCount: number;
  lastChargeDate: string | null;
};

export type DepartmentSpendAggregate = {
  department: string;
  employeeCount: number;
  approvedSpend: number;
  pendingSpend: number;
};

export type EmployeeSpendAggregate = Employee & {
  approvedSpend: number;
  pendingSpend: number;
  rejectedSpend: number;
  totalSpend: number;
  pendingCount: number;
  expenseCount: number;
  receiptCount: number;
  lastExpenseDate: string | null;
};

export type CategorySpendAggregate = {
  category: Category;
  spend: number;
  count: number;
};

export type SpendingTrendBucket = {
  bucket: string;
  total: number;
};

export type TopSpenderAggregate = {
  id: string;
  name: string;
  total: number;
};

export type ApprovalQueueRow = {
  expense: ExpenseWithRelations;
  submittedAgeDays: number;
  riskLevel: ApprovalRisk;
  policyNote: string;
};

function getExpenseWhere(filters?: ExpenseFilters) {
  const conditions: SQL[] = [];

  if (filters?.status) {
    conditions.push(eq(expenses.status, filters.status as 'pending' | 'approved' | 'rejected'));
  }
  if (filters?.categoryId) {
    conditions.push(eq(expenses.categoryId, filters.categoryId));
  }
  if (filters?.employeeId) {
    conditions.push(eq(expenses.employeeId, filters.employeeId));
  }
  if (filters?.search) {
    const pattern = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${expenses.description})`, pattern),
        like(sql`lower(${expenses.merchant})`, pattern),
        like(sql`lower(${employees.name})`, pattern),
        like(sql`lower(${categories.name})`, pattern)
      )!
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

function getExpenseOrder(filters?: ExpenseFilters) {
  const sortField = filters?.sortField ?? 'date';
  const sortDir = filters?.sortDir === 'asc' ? 'asc' : 'desc';
  const direction = sortDir === 'asc' ? asc : desc;

  switch (sortField) {
    case 'amount':
      return direction(expenses.amount);
    case 'employee':
      return direction(employees.name);
    case 'category':
      return direction(categories.name);
    case 'status':
      return direction(expenses.status);
    case 'date':
    default:
      return direction(expenses.date);
  }
}

function getApprovalRiskExpression() {
  return sql<ApprovalRisk>`
    case
      when ${expenses.amount} >= 2500
        or julianday('now') - julianday(${expenses.submittedAt}) >= 10
        or coalesce(${expenses.receiptUrl}, '') = ''
        then 'high'
      when ${expenses.amount} >= 750
        or julianday('now') - julianday(${expenses.submittedAt}) >= 5
        then 'medium'
      else 'low'
    end
  `;
}

function getApprovalRiskRankExpression() {
  return sql<number>`
    case
      when ${expenses.amount} >= 2500
        or julianday('now') - julianday(${expenses.submittedAt}) >= 10
        or coalesce(${expenses.receiptUrl}, '') = ''
        then 3
      when ${expenses.amount} >= 750
        or julianday('now') - julianday(${expenses.submittedAt}) >= 5
        then 2
      else 1
    end
  `;
}

function getApprovalAgeExpression() {
  return sql<number>`cast(max(0, floor(julianday('now') - julianday(${expenses.submittedAt}))) as integer)`;
}

function getApprovalPolicyExpression() {
  return sql<string>`
    case
      when coalesce(${expenses.receiptUrl}, '') = '' then 'Receipt missing'
      when ${expenses.amount} >= 2500 then 'High-value review'
      when julianday('now') - julianday(${expenses.submittedAt}) >= 10 then 'Aging approval'
      when ${expenses.amount} >= 750
        or julianday('now') - julianday(${expenses.submittedAt}) >= 5
        then 'Manager review'
      else 'Ready to approve'
    end
  `;
}

function getApprovalWhere(filters?: ApprovalFilters) {
  const conditions: SQL[] = [eq(expenses.status, 'pending')];

  if (filters?.search) {
    const pattern = `%${filters.search.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${expenses.description})`, pattern),
        like(sql`lower(${expenses.merchant})`, pattern),
        like(sql`lower(${employees.name})`, pattern),
        like(sql`lower(${categories.name})`, pattern)
      )!
    );
  }
  if (filters?.department && filters.department !== 'all') {
    conditions.push(eq(employees.department, filters.department));
  }
  if (filters?.risk) {
    conditions.push(sql`${getApprovalRiskExpression()} = ${filters.risk}`);
  }

  return and(...conditions);
}

function getIsoDateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function toNumber(value: unknown) {
  return Number(value ?? 0);
}

function mapEmployee(row: typeof employees.$inferSelect): Employee {
  return {
    ...row,
    avatarUrl: row.avatarUrl ?? undefined,
  };
}

function mapCategory(row: typeof categories.$inferSelect): Category {
  return row;
}

function mapExpense(row: typeof expenses.$inferSelect): Expense {
  return {
    ...row,
    notes: row.notes ?? undefined,
    receiptUrl: row.receiptUrl ?? undefined,
  };
}

function mapExpenseWithRelations(row: {
  expense: typeof expenses.$inferSelect;
  employee: typeof employees.$inferSelect;
  category: typeof categories.$inferSelect;
}): ExpenseWithRelations {
  return {
    ...mapExpense(row.expense),
    employee: mapEmployee(row.employee),
    category: mapCategory(row.category),
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const rows = await db.select().from(employees).all();
  return rows.map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee | null> {
  const row = await db.select().from(employees).where(eq(employees.id, id)).get();
  return row ? mapEmployee(row) : null;
}

export async function getCategories(): Promise<Category[]> {
  const rows = await db.select().from(categories).all();
  return rows.map(mapCategory);
}

export async function getCategory(id: string): Promise<Category | null> {
  const row = await db.select().from(categories).where(eq(categories.id, id)).get();
  return row ? mapCategory(row) : null;
}

export async function getCards() {
  return getCardsWithEmployees();
}

export async function getCardsWithEmployees(): Promise<CorporateCardWithEmployee[]> {
  const rows = await db
    .select({ card: cards, employee: employees })
    .from(cards)
    .innerJoin(employees, eq(cards.employeeId, employees.id))
    .all();

  return rows.map(({ card, employee }) => ({
    ...card,
    employee: mapEmployee(employee),
  }));
}

export async function getVendors() {
  return getVendorsWithCategories();
}

export async function getVendorsWithCategories(): Promise<VendorWithCategory[]> {
  const rows = await db
    .select({ vendor: vendors, category: categories })
    .from(vendors)
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .all();

  return rows.map(({ vendor, category }) => ({
    ...vendor,
    category: mapCategory(category),
  }));
}

export async function getDepartmentBudgets(): Promise<DepartmentBudget[]> {
  return db.select().from(departmentBudgets).all();
}

export async function getExpense(id: string): Promise<Expense | null> {
  const row = await db.select().from(expenses).where(eq(expenses.id, id)).get();
  return row ? mapExpense(row) : null;
}

export async function getExpenseWithRelations(id: string) {
  const row = await db
    .select({ expense: expenses, employee: employees, category: categories })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(eq(expenses.id, id))
    .get();

  return row ? mapExpenseWithRelations(row) : null;
}

export async function createExpense(data: {
  employeeId: string;
  categoryId: string;
  amount: number;
  description: string;
  merchant: string;
  date: string;
  notes?: string;
  receiptUrl?: string;
}) {
  const id = `exp_${Date.now().toString(16)}`;
  const submittedAt = new Date().toISOString();

  const [expense] = await db
    .insert(expenses)
    .values({
      id,
      employeeId: data.employeeId,
      categoryId: data.categoryId,
      amount: data.amount,
      description: data.description,
      merchant: data.merchant,
      date: data.date,
      submittedAt,
      status: 'pending',
      notes: data.notes ?? null,
      receiptUrl: data.receiptUrl ?? null,
    })
    .returning();

  return mapExpense(expense!);
}

export async function updateExpense(
  id: string,
  data: Partial<{
    employeeId: string;
    categoryId: string;
    amount: number;
    description: string;
    merchant: string;
    date: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
    notes: string | null;
    receiptUrl: string | null;
  }>
) {
  const [expense] = await db.update(expenses).set(data).where(eq(expenses.id, id)).returning();

  return expense ? mapExpense(expense) : null;
}

export async function getExpenses(filters?: ExpenseFilters) {
  return getExpensesWithRelations(filters);
}

export async function getExpensesWithRelations(filters?: ExpenseFilters) {
  const where = getExpenseWhere(filters);
  const orderExpr = getExpenseOrder(filters);

  const countResult = await db
    .select({ total: count() })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(where)
    .get();
  const total = countResult?.total ?? 0;

  let query = db
    .select({ expense: expenses, employee: employees, category: categories })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(where)
    .orderBy(orderExpr)
    .$dynamic();

  if (filters?.page != null) {
    const page = filters.page;
    const pageSize = filters.pageSize ?? 10;
    query = query.limit(pageSize).offset(page * pageSize);
  }

  const data = await query.all();

  return { data: data.map(mapExpenseWithRelations), total };
}

export async function getExpenseRollup(days = 30): Promise<ExpenseRollup> {
  const periodStart = getIsoDateDaysAgo(days);
  const row = await db
    .select({
      totalCount: sql<number>`count(${expenses.id})`,
      approvedCount: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then 1 else 0 end), 0)`,
      pendingCount: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then 1 else 0 end), 0)`,
      receiptCount: sql<number>`coalesce(sum(case when coalesce(${expenses.receiptUrl}, '') != '' then 1 else 0 end), 0)`,
      approvedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount} else 0 end), 0)`,
      pendingSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amount} else 0 end), 0)`,
      periodApprovedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' and ${expenses.date} >= ${periodStart} then ${expenses.amount} else 0 end), 0)`,
    })
    .from(expenses)
    .get();

  return {
    totalCount: toNumber(row?.totalCount),
    approvedCount: toNumber(row?.approvedCount),
    pendingCount: toNumber(row?.pendingCount),
    receiptCount: toNumber(row?.receiptCount),
    approvedSpend: toNumber(row?.approvedSpend),
    pendingSpend: toNumber(row?.pendingSpend),
    periodApprovedSpend: toNumber(row?.periodApprovedSpend),
  };
}

export async function getCardSpendAggregates(): Promise<CardSpendAggregate[]> {
  const periodStart = getIsoDateDaysAgo(30);
  const rows = await db
    .select({
      card: cards,
      employee: employees,
      spentThisMonth: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' and ${expenses.date} >= ${periodStart} then ${expenses.amount} else 0 end), 0)`,
      pendingAmount: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' and ${expenses.date} >= ${periodStart} then ${expenses.amount} else 0 end), 0)`,
      lastActivityDate: sql<string | null>`max(${expenses.date})`,
      lastMerchant: expenses.merchant,
    })
    .from(cards)
    .innerJoin(employees, eq(cards.employeeId, employees.id))
    .leftJoin(expenses, eq(expenses.employeeId, cards.employeeId))
    .groupBy(cards.id)
    .all();

  return rows.map(
    ({ card, employee, spentThisMonth, pendingAmount, lastActivityDate, lastMerchant }) => ({
      ...card,
      employee: mapEmployee(employee),
      spentThisMonth: toNumber(spentThisMonth),
      pendingAmount: toNumber(pendingAmount),
      lastActivityDate,
      lastMerchant: lastMerchant ?? null,
    })
  );
}

export async function getVendorSpendAggregates(): Promise<VendorSpendAggregate[]> {
  const rows = await db
    .select({
      vendor: vendors,
      category: categories,
      totalSpend: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      approvedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount} else 0 end), 0)`,
      pendingSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amount} else 0 end), 0)`,
      transactionCount: sql<number>`count(${expenses.id})`,
      employeeCount: sql<number>`count(distinct ${expenses.employeeId})`,
      lastChargeDate: sql<string | null>`max(${expenses.date})`,
    })
    .from(vendors)
    .innerJoin(categories, eq(vendors.categoryId, categories.id))
    .leftJoin(expenses, eq(expenses.merchant, vendors.merchant))
    .groupBy(vendors.id)
    .all();

  return rows.map(({ vendor, category, ...aggregate }) => ({
    ...vendor,
    category: mapCategory(category),
    totalSpend: toNumber(aggregate.totalSpend),
    approvedSpend: toNumber(aggregate.approvedSpend),
    pendingSpend: toNumber(aggregate.pendingSpend),
    transactionCount: toNumber(aggregate.transactionCount),
    employeeCount: toNumber(aggregate.employeeCount),
    lastChargeDate: aggregate.lastChargeDate,
  }));
}

export async function getDepartmentSpendAggregates(days = 30): Promise<DepartmentSpendAggregate[]> {
  const periodStart = getIsoDateDaysAgo(days);
  const rows = await db
    .select({
      department: employees.department,
      employeeCount: sql<number>`count(distinct ${employees.id})`,
      approvedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' and ${expenses.date} >= ${periodStart} then ${expenses.amount} else 0 end), 0)`,
      pendingSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' and ${expenses.date} >= ${periodStart} then ${expenses.amount} else 0 end), 0)`,
    })
    .from(employees)
    .leftJoin(expenses, eq(expenses.employeeId, employees.id))
    .groupBy(employees.department)
    .all();

  return rows.map((row) => ({
    department: row.department,
    employeeCount: toNumber(row.employeeCount),
    approvedSpend: toNumber(row.approvedSpend),
    pendingSpend: toNumber(row.pendingSpend),
  }));
}

export async function getEmployeeSpendAggregates(): Promise<EmployeeSpendAggregate[]> {
  const rows = await db
    .select({
      employee: employees,
      approvedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount} else 0 end), 0)`,
      pendingSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then ${expenses.amount} else 0 end), 0)`,
      rejectedSpend: sql<number>`coalesce(sum(case when ${expenses.status} = 'rejected' then ${expenses.amount} else 0 end), 0)`,
      totalSpend: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      pendingCount: sql<number>`coalesce(sum(case when ${expenses.status} = 'pending' then 1 else 0 end), 0)`,
      expenseCount: sql<number>`count(${expenses.id})`,
      receiptCount: sql<number>`coalesce(sum(case when coalesce(${expenses.receiptUrl}, '') != '' then 1 else 0 end), 0)`,
      lastExpenseDate: sql<string | null>`max(${expenses.date})`,
    })
    .from(employees)
    .leftJoin(expenses, eq(expenses.employeeId, employees.id))
    .groupBy(employees.id)
    .all();

  return rows.map(({ employee, ...aggregate }) => ({
    ...mapEmployee(employee),
    approvedSpend: toNumber(aggregate.approvedSpend),
    pendingSpend: toNumber(aggregate.pendingSpend),
    rejectedSpend: toNumber(aggregate.rejectedSpend),
    totalSpend: toNumber(aggregate.totalSpend),
    pendingCount: toNumber(aggregate.pendingCount),
    expenseCount: toNumber(aggregate.expenseCount),
    receiptCount: toNumber(aggregate.receiptCount),
    lastExpenseDate: aggregate.lastExpenseDate,
  }));
}

export async function getCategorySpendAggregates(): Promise<CategorySpendAggregate[]> {
  const rows = await db
    .select({
      category: categories,
      spend: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then ${expenses.amount} else 0 end), 0)`,
      count: sql<number>`coalesce(sum(case when ${expenses.status} = 'approved' then 1 else 0 end), 0)`,
    })
    .from(categories)
    .leftJoin(expenses, eq(expenses.categoryId, categories.id))
    .groupBy(categories.id)
    .all();

  return rows
    .map(({ category, spend, count }) => ({
      category: mapCategory(category),
      spend: toNumber(spend),
      count: toNumber(count),
    }))
    .sort((a, b) => b.spend - a.spend);
}

export async function getTopSpenderAggregates(): Promise<TopSpenderAggregate[]> {
  const rows = await db
    .select({
      id: employees.id,
      name: employees.name,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .where(eq(expenses.status, 'approved'))
    .groupBy(employees.id)
    .orderBy(desc(sql<number>`coalesce(sum(${expenses.amount}), 0)`))
    .all();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    total: toNumber(row.total),
  }));
}

export async function getSpendingTrendBuckets(days: number): Promise<SpendingTrendBucket[]> {
  const periodStart = getIsoDateDaysAgo(days);
  const bucket =
    days > 90
      ? sql<string>`strftime('%Y-%m', ${expenses.date})`
      : sql<string>`date(${expenses.date})`;
  const rows = await db
    .select({
      bucket,
      total: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(and(eq(expenses.status, 'approved'), sql`${expenses.date} >= ${periodStart}`))
    .groupBy(bucket)
    .orderBy(asc(bucket))
    .all();

  return rows.map((row) => ({ bucket: row.bucket, total: toNumber(row.total) }));
}

export async function getReceiptExceptions(limit: number): Promise<ExpenseWithRelations[]> {
  const rows = await db
    .select({ expense: expenses, employee: employees, category: categories })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(and(sql`coalesce(${expenses.receiptUrl}, '') = ''`, sql`${expenses.amount} >= 250`))
    .orderBy(desc(expenses.amount))
    .limit(limit)
    .all();

  return rows.map(mapExpenseWithRelations);
}

export async function getApprovalDepartments(): Promise<string[]> {
  const rows = await db
    .select({ department: employees.department })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .where(eq(expenses.status, 'pending'))
    .groupBy(employees.department)
    .orderBy(asc(employees.department))
    .all();

  return rows.map((row) => row.department);
}

export async function getApprovalQueue(filters: ApprovalFilters = {}) {
  const where = getApprovalWhere(filters);
  const totalResult = await db
    .select({ total: sql<number>`count(${expenses.id})` })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(where)
    .get();

  let query = db
    .select({
      expense: expenses,
      employee: employees,
      category: categories,
      submittedAgeDays: getApprovalAgeExpression(),
      riskLevel: getApprovalRiskExpression(),
      policyNote: getApprovalPolicyExpression(),
    })
    .from(expenses)
    .innerJoin(employees, eq(expenses.employeeId, employees.id))
    .innerJoin(categories, eq(expenses.categoryId, categories.id))
    .where(where)
    .orderBy(desc(getApprovalRiskRankExpression()), desc(getApprovalAgeExpression()))
    .$dynamic();

  if (filters.page != null) {
    const pageSize = filters.pageSize ?? 25;
    query = query.limit(pageSize).offset(filters.page * pageSize);
  }

  const rows = await query.all();

  return {
    data: rows.map(
      (row): ApprovalQueueRow => ({
        expense: mapExpenseWithRelations(row),
        submittedAgeDays: toNumber(row.submittedAgeDays),
        riskLevel: row.riskLevel,
        policyNote: row.policyNote,
      })
    ),
    total: toNumber(totalResult?.total),
  };
}

export async function getApprovalQueueTotals() {
  const row = await db
    .select({
      pendingAmount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      highRiskCount: sql<number>`coalesce(sum(case when ${getApprovalRiskExpression()} = 'high' then 1 else 0 end), 0)`,
      agingCount: sql<number>`coalesce(sum(case when ${getApprovalAgeExpression()} >= 7 then 1 else 0 end), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.status, 'pending'))
    .get();

  return {
    pendingAmount: toNumber(row?.pendingAmount),
    highRiskCount: toNumber(row?.highRiskCount),
    agingCount: toNumber(row?.agingCount),
  };
}
