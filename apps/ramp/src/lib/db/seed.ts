import path from 'node:path';

import nextEnv from '@next/env';

import {
  cards as seedCards,
  categories as seedCategories,
  departmentBudgets as seedDepartmentBudgets,
  employees as seedEmployees,
  expenses as seedExpenses,
  vendors as seedVendors,
} from '../data/seed';

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd(), true);

const [{ migrate }, { getDatabaseUrl, isRemoteDatabaseUrl }, { db }, schema] = await Promise.all([
  import('drizzle-orm/libsql/migrator'),
  import('./config'),
  import('./client'),
  import('./schema'),
]);

if (isRemoteDatabaseUrl(getDatabaseUrl()) && process.env.TURSO_ALLOW_SEED_RESET !== '1') {
  throw new Error('Refusing to reset a remote Turso database without TURSO_ALLOW_SEED_RESET=1.');
}

// Run migrations first (idempotent)
await migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
console.log('Migrations applied.');

// Clear tables in FK-safe order
await db.delete(schema.expenses).run();
await db.delete(schema.cards).run();
await db.delete(schema.vendors).run();
await db.delete(schema.departmentBudgets).run();
await db.delete(schema.employees).run();
await db.delete(schema.categories).run();
console.log('Tables cleared.');

// Insert categories
await db.insert(schema.categories).values(seedCategories).run();
console.log(`Inserted ${seedCategories.length} categories.`);

// Insert employees
await db
  .insert(schema.employees)
  .values(
    seedEmployees.map((e) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      position: e.position,
      department: e.department,
      avatarUrl: e.avatarUrl ?? null,
    }))
  )
  .run();
console.log(`Inserted ${seedEmployees.length} employees.`);

await db.insert(schema.departmentBudgets).values(seedDepartmentBudgets).run();
console.log(`Inserted ${seedDepartmentBudgets.length} department budgets.`);

await db.insert(schema.vendors).values(seedVendors).run();
console.log(`Inserted ${seedVendors.length} vendors.`);

await db.insert(schema.cards).values(seedCards).run();
console.log(`Inserted ${seedCards.length} cards.`);

// Insert expenses in batches (SQLite has a variable limit)
const BATCH_SIZE = 50;
for (let i = 0; i < seedExpenses.length; i += BATCH_SIZE) {
  const batch = seedExpenses.slice(i, i + BATCH_SIZE);
  await db
    .insert(schema.expenses)
    .values(
      batch.map((e) => ({
        id: e.id,
        employeeId: e.employeeId,
        categoryId: e.categoryId,
        amount: e.amount,
        description: e.description,
        merchant: e.merchant,
        date: e.date,
        submittedAt: e.submittedAt,
        status: e.status as 'pending' | 'approved' | 'rejected',
        notes: e.notes ?? null,
        receiptUrl: e.receiptUrl ?? null,
      }))
    )
    .run();
}
console.log(`Inserted ${seedExpenses.length} expenses.`);

console.log('Seed complete.');
