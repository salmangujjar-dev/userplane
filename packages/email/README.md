# @userplane/email

## Purpose

`@userplane/email` centralizes Userplane email delivery and React Email rendering. It provides provider clients for local development and Resend, a common send interface, batch sending support, typed template render helpers, and shared email types.

## Import Surface

- `@userplane/email`: `createEmailClient`, `LocalhostEmailClient`, `ResendEmailClient`, email client/send types, render result types, email template prop types, and render helpers such as `renderMagicLink`, `renderWorkspaceInvite`, and recording/workspace/project/offboarding render functions.

## Consumers

No sibling package currently depends on `@userplane/email` at package level. It is intended for app/server mail workflows, including auth and product lifecycle emails.

## Quick Start

```ts
import { createEmailClient, renderWorkspaceInvite } from '@userplane/email';

const client = createEmailClient({
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY!,
});

const rendered = await renderWorkspaceInvite({
  workspaceName: 'Acme',
  inviterName: 'Sam',
  inviteUrl: 'https://dash.userplane.io/invite/token',
});

await client.send(
  {
    from: 'Userplane <support@userplane.io>',
    to: 'teammate@example.com',
    subject: 'Join Acme on Userplane',
    html: rendered.html,
    text: rendered.text,
  },
  {
    idempotencyKey: 'workspace-invite/invite_123',
  }
);
```

Local development:

```ts
const client = createEmailClient({
  provider: 'localhost',
  workingDirectory: process.cwd(),
});
```

## Architecture

- `src/factory.ts` chooses the provider client from `EmailClientConfig`.
- `src/clients/localhost.client.ts` implements local file-based delivery for development.
- `src/clients/resend.client.ts` implements Resend delivery.
- `src/types.ts` defines the common client, send params, send options, and response shapes.
- Template components live in `src/emails/`.
- Copy modules live in `src/copy/`.
- Typed render helpers are collected in `src/emails.ts` and exported by `src/index.ts`.
- Shared layout/components live under `src/shared/`.

## Scripts

- `bun run build`: compile with `tsc`.
- `bun run dev`: run React Email preview on port `3003` with `--dir src/emails`.
- `bun run lint`: run ESLint with zero warnings.
- `bun run lint:fix`: apply ESLint fixes.
- `bun run typecheck`: run TypeScript without emitting output.

## Tests/Storybook

There is no package-local test or Storybook script. Use the React Email preview server for visual checks and `typecheck`/`lint` for code verification.

## Env/Secrets

The package does not load secrets directly. Callers pass:

- `apiKey` for the `resend` provider, usually from `RESEND_API_KEY`.
- `workingDirectory` for the `localhost` provider when local output should be rooted somewhere specific.

Batch sends support multiple recipients, but scheduled sends are not supported in batch mode.

## Change Checklist

- Add or update the template component under `src/emails/`.
- Add or update copy under `src/copy/` when copy is separated from presentation.
- Add or update the render helper in `src/emails.ts`.
- Export new render helpers and prop types from `src/index.ts`.
- Preview template changes with `bun run --filter @userplane/email dev`.
- Run `bun run --filter @userplane/email typecheck` and `lint`.

## Troubleshooting

- If a template preview is missing, confirm it lives under `src/emails/` and has a render helper in `src/emails.ts`.
- If a render helper is not importable, check `src/emails.ts` and `src/index.ts`.
- If Resend sends fail, verify the API key and whether `batch`, `scheduledAt`, or recipient count is supported for that call.
- If localhost output is hard to find, check the configured `workingDirectory`.
