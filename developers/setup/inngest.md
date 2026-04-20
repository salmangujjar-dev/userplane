# Inngest

Background job processing for the Userplane API. Handles async tasks like webhook delivery and scheduled operations.

## When you need this

Work involving background jobs, event-driven workflows, or any async processing in the API.

## Setup

No signup is needed for local development. Inngest provides a local dev server.

1. Start the Inngest dev server:

   ```sh
   npx inngest-cli@latest dev
   ```

   The dev UI is available at [localhost:8288](http://localhost:8288).

2. Start the API server in a separate terminal. The API serves Inngest functions at `/api/inngest`.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
INNGEST_DEV=1
```

This tells the API to connect to the local Inngest dev server instead of the hosted service.

`INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` are optional in development and can be omitted.

## Verify

1. Start the Inngest dev server and the API server.
2. Open [localhost:8288/functions](http://localhost:8288/functions).
3. Registered functions from the API should appear in the list.
4. Select a function and click **Invoke** to trigger a test run.

## Notes

- The Inngest dev server must run alongside the API. They are separate processes.
- The dev server auto-discovers functions when the API registers them on startup.
