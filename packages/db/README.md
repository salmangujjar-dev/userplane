# @workspace/db

Database schema, migrations, and client for the application. Built on Drizzle ORM with PostgreSQL.

## Structure

```
src/
  schema/       Table definitions (source of truth for DB structure)
  client.ts     Drizzle client factory
  migrate.ts    Migration runner
drizzle/
  *.sql         Generated migration files (committed to repo)
  meta/         Drizzle snapshots and journal
drizzle.config.ts
```

## Workflow

### 1. Edit schema and iterate locally

Modify or create files in `src/schema/`. Use `push` to apply changes directly to your local database. Repeat until the schema is right.

```bash
make db:push
```

Use Drizzle Studio to inspect data:

```bash
make db:studio
```

### 2. Generate migration

Once the schema is stable, generate a migration file from the diff:

```bash
make db:generate
```

This creates a new SQL file in `drizzle/` and updates the snapshot in `drizzle/meta/`.

### 3. Review the generated SQL

Open the new `drizzle/XXXX_*.sql` file and read it. Check for:

- Unintended column drops or type changes
- Missing `IF NOT EXISTS` / `IF EXISTS` guards on risky operations
- Constraint changes that could fail against existing data

### 4. Test migration locally

```bash
make db:migrate
```

This runs the migration against your local database the same way production does. Confirms the SQL actually works.

### 5. Commit and merge

Commit the schema changes, the generated SQL file, and the updated snapshot together in the same PR.

### 6. Apply to production

```bash
make db:migrate:production
```

Never use `push` against production. Migrations are tracked in a `__drizzle_migrations` table. Each runs exactly once, identified by a content hash.

## Rules

- **One migration per logical change.** Don't batch unrelated schema changes.
- **Never modify a migration after it has been applied** to any persistent environment. The content hash changes and drizzle cannot reconcile it.
- **Never skip `db:generate`.** Hand-written migration SQL is not tracked by drizzle snapshots and will cause drift.
- **Commit migration files with the schema change.** A PR that changes schema should include the generated SQL.
- **Review generated SQL before merging.** `drizzle-kit generate` is a code generator -- verify its output.
