# Neon

Managed PostgreSQL database for the Userplane API.

## When you need this

Any work involving the API server (`apps/api`), database schema changes, or migrations.

## Setup

1. Sign up at [console.neon.tech/signup](https://console.neon.tech/signup) using GitHub, Google, or email.
2. Click **New Project**.
3. Choose a project name and region closest to you.
4. Once created, copy the connection string from the **Connection Details** panel.

The connection string follows this format:

```
postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

## Environment Variables

Set the following in `apps/api/.env.development`:

```
DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/[dbname]?sslmode=require
```

## Verify

Run the following from the repository root:

```sh
make db:push
```

A successful push confirms the connection is working and the schema is applied.

## Notes

- Free tier provides 0.5 GB storage and 100 compute-hours per month.
- The connection string must include `?sslmode=require`. Connections without it will fail.
- Neon scales to zero after inactivity. The first query after idle will have cold start latency (typically 1-3 seconds).
