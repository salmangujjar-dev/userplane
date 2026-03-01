import { and, asc, count, desc, eq, like, or, sql } from 'drizzle-orm';

import { db } from './client';
import { categories, employees, expenses } from './schema';

export function getEmployees() {
  return db.select().from(employees).all();
}

export function getEmployee(id: string) {
  return db.select().from(employees).where(eq(employees.id, id)).get() ?? null;
}

export function getCategories() {
  return db.select().from(categories).all();
}

export function getCategory(id: string) {
  return db.select().from(categories).where(eq(categories.id, id)).get() ?? null;
}

export function getExpense(id: string) {
  return db.select().from(expenses).where(eq(expenses.id, id)).get() ?? null;
}

export function createExpense(data: {
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

  db.insert(expenses)
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
    .run();

  return getExpense(id)!;
}

export function updateExpense(
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
  const existing = getExpense(id);
  if (!existing) return null;

  db.update(expenses).set(data).where(eq(expenses.id, id)).run();

  return getExpense(id)!;
}

export function getExpenses(filters?: {
  status?: string;
  categoryId?: string;
  employeeId?: string;
  search?: string;
  sortField?: string;
  sortDir?: string;
  page?: number;
  pageSize?: number;
}) {
  // Build WHERE conditions
  const conditions = [];

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
        like(
          sql`lower((SELECT ${employees.name} FROM ${employees} WHERE ${employees.id} = ${expenses.employeeId}))`,
          pattern
        )
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Count query
  const countResult = db.select({ total: count() }).from(expenses).where(where).get();
  const total = countResult?.total ?? 0;

  // Sort
  const sortField = filters?.sortField ?? 'date';
  const sortDir = filters?.sortDir === 'asc' ? 'asc' : 'desc';
  const direction = sortDir === 'asc' ? asc : desc;

  let orderExpr;
  switch (sortField) {
    case 'amount':
      orderExpr = direction(expenses.amount);
      break;
    case 'employee':
      orderExpr = direction(
        sql`(SELECT ${employees.name} FROM ${employees} WHERE ${employees.id} = ${expenses.employeeId})`
      );
      break;
    case 'category':
      orderExpr = direction(
        sql`(SELECT ${categories.name} FROM ${categories} WHERE ${categories.id} = ${expenses.categoryId})`
      );
      break;
    case 'status':
      orderExpr = direction(expenses.status);
      break;
    case 'date':
    default:
      orderExpr = direction(expenses.date);
      break;
  }

  // Data query
  let query = db.select().from(expenses).where(where).orderBy(orderExpr).$dynamic();

  // Paginate only when page is explicitly provided
  if (filters?.page != null) {
    const page = filters.page;
    const pageSize = filters.pageSize ?? 10;
    query = query.limit(pageSize).offset(page * pageSize);
  }

  const data = query.all();

  return { data, total };
}
