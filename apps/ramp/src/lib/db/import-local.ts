import fs from 'node:fs';
import path from 'node:path';

import { type Client, createClient, type InValue } from '@libsql/client';
import { loadEnvConfig } from '@next/env';

type TableCopy = {
  name: string;
  columns: string[];
};

const tables: TableCopy[] = [
  {
    name: 'categories',
    columns: ['id', 'name', 'icon'],
  },
  {
    name: 'employees',
    columns: ['id', 'name', 'email', 'position', 'department', 'avatar_url'],
  },
  {
    name: 'user',
    columns: ['id', 'name', 'email', 'email_verified', 'image', 'created_at', 'updated_at'],
  },
  {
    name: 'account',
    columns: [
      'id',
      'account_id',
      'provider_id',
      'user_id',
      'access_token',
      'refresh_token',
      'id_token',
      'access_token_expires_at',
      'refresh_token_expires_at',
      'scope',
      'password',
      'created_at',
      'updated_at',
    ],
  },
  {
    name: 'session',
    columns: [
      'id',
      'expires_at',
      'token',
      'created_at',
      'updated_at',
      'ip_address',
      'user_agent',
      'user_id',
    ],
  },
  {
    name: 'verification',
    columns: ['id', 'identifier', 'value', 'expires_at', 'created_at', 'updated_at'],
  },
  {
    name: 'feature_flag_overrides',
    columns: ['flag', 'value', 'updated_at'],
  },
  {
    name: 'variant_flag_overrides',
    columns: ['flag', 'value', 'updated_at'],
  },
  {
    name: 'department_budgets',
    columns: ['id', 'department', 'monthly_budget', 'owner_email', 'reset_cadence'],
  },
  {
    name: 'vendors',
    columns: [
      'id',
      'merchant',
      'category_id',
      'recurring',
      'savings_opportunity',
      'owner_department',
      'status',
    ],
  },
  {
    name: 'cards',
    columns: [
      'id',
      'employee_id',
      'type',
      'status',
      'monthly_limit',
      'controls_label',
      'issued_at',
      'last_four',
    ],
  },
  {
    name: 'expenses',
    columns: [
      'id',
      'employee_id',
      'category_id',
      'amount',
      'description',
      'merchant',
      'date',
      'submitted_at',
      'status',
      'notes',
      'receipt_url',
    ],
  },
];

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function copyTable(source: Client, target: Client, table: TableCopy) {
  const tableName = quoteIdentifier(table.name);
  const columns = table.columns.map(quoteIdentifier).join(', ');
  const placeholders = table.columns.map(() => '?').join(', ');
  const insertSql = `INSERT OR IGNORE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
  const sourceRows = await source.execute(`SELECT ${columns} FROM ${tableName}`);
  let inserted = 0;

  for (const row of sourceRows.rows) {
    const args = table.columns.map((column) => row[column] as InValue);
    const result = await target.execute({ sql: insertSql, args });
    inserted += result.rowsAffected;
  }

  return { read: sourceRows.rows.length, inserted };
}

loadEnvConfig(process.cwd(), true);

const [{ getDatabaseConfig, getLocalDatabasePath, isRemoteDatabaseUrl }] = await Promise.all([
  import('./config'),
]);

const sourcePath = path.resolve(process.cwd(), process.argv[2] ?? getLocalDatabasePath());

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Local SQLite database not found at ${sourcePath}`);
}

const targetConfig = getDatabaseConfig();

if (!isRemoteDatabaseUrl(targetConfig.url)) {
  throw new Error('TURSO_DATABASE_URL must point to Turso before importing local data.');
}

const source = createClient({ url: `file:${sourcePath}` });
const target = createClient(targetConfig);

try {
  await source.execute('PRAGMA wal_checkpoint(FULL)');

  for (const table of tables) {
    const { read, inserted } = await copyTable(source, target, table);
    console.log(`${table.name}: read ${read}, inserted ${inserted}`);
  }

  console.log('Local SQLite data import complete.');
} finally {
  source.close();
  target.close();
}
