# Supabase

Managed PostgreSQL database for the Userplane API. Alternative to Neon.

## When you need this

Any work involving the API server (`apps/api`), database schema changes, or migrations. Use this if you prefer Supabase over Neon.

## Setup

1. Sign up at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New Project**.
3. Set a database password. Copy it immediately -- it is only shown at creation time.
4. Wait for the project to finish provisioning.
5. Go to **Settings > Database** and copy the **Direct** Postgres connection string (not the Supabase client URL).

The connection string follows this format:

```
postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

Replace `[PASSWORD]` with the password you set in step 3.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

## Verify

Run the following from the repository root:

```sh
make db:push
```

A successful push confirms the connection is working and the schema is applied.

## Notes

- Free tier provides 500 MB storage and 2 active projects.
- Free projects pause after 1 week of inactivity. You must manually unpause them from the dashboard.
- The database password is only displayed at project creation. If lost, reset it under **Settings > Database**.
