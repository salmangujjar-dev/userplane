import fs from 'node:fs';
import path from 'node:path';

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

import {
  cards as seedCards,
  categories as seedCategories,
  departmentBudgets as seedDepartmentBudgets,
  employees as seedEmployees,
  expenses as seedExpenses,
  vendors as seedVendors,
} from '../data/seed';
import * as schema from './schema';

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });

const sqlite = new Database(path.join(dataDir, 'ramp.db'));
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

const db = drizzle(sqlite, { schema });

// Run migrations first (idempotent)
migrate(db, { migrationsFolder: path.join(process.cwd(), 'drizzle') });
console.log('Migrations applied.');

// Clear tables in FK-safe order
db.delete(schema.expenses).run();
db.delete(schema.cards).run();
db.delete(schema.vendors).run();
db.delete(schema.departmentBudgets).run();
db.delete(schema.employees).run();
db.delete(schema.categories).run();
console.log('Tables cleared.');

// Insert categories
db.insert(schema.categories).values(seedCategories).run();
console.log(`Inserted ${seedCategories.length} categories.`);

// Insert employees
db.insert(schema.employees)
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

db.insert(schema.departmentBudgets).values(seedDepartmentBudgets).run();
console.log(`Inserted ${seedDepartmentBudgets.length} department budgets.`);

db.insert(schema.vendors).values(seedVendors).run();
console.log(`Inserted ${seedVendors.length} vendors.`);

db.insert(schema.cards).values(seedCards).run();
console.log(`Inserted ${seedCards.length} cards.`);

// Insert expenses in batches (SQLite has a variable limit)
const BATCH_SIZE = 50;
for (let i = 0; i < seedExpenses.length; i += BATCH_SIZE) {
  const batch = seedExpenses.slice(i, i + BATCH_SIZE);
  db.insert(schema.expenses)
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

sqlite.close();
console.log('Seed complete.');
