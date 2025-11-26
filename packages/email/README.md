# @workspace/email

Unified email package with clients and React Email templates.

## Features

- Multiple email providers (localhost for development, Resend for production)
- React Email templates with server-safe rendering
- Idempotency keys for safe retries
- Email scheduling capabilities
- Type-safe API

## Usage

### Email Client

```typescript
import { createEmailClient } from '@workspace/email';

const client = createEmailClient({
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY,
});

// Send email
await client.send({
  from: 'noreply@example.com',
  to: ['user@example.com'],
  subject: 'Welcome!',
  html: '<p>Hello world</p>',
});

// With idempotency key
await client.send(
  {
    from: 'noreply@example.com',
    to: ['user@example.com'],
    subject: 'Welcome!',
    html: '<p>Hello world</p>',
  },
  {
    idempotencyKey: 'unique-key-123',
  }
);

// Schedule email
await client.send(
  {
    from: 'noreply@example.com',
    to: ['user@example.com'],
    subject: 'Scheduled',
    html: '<p>Future email</p>',
  },
  {
    scheduledAt: new Date(Date.now() + 3600000), // 1 hour from now
  }
);
```

### Email Templates

```typescript
import { renderWorkspaceInvite } from '@workspace/email';

// Render template to HTML
const html = await renderWorkspaceInvite({
  workspaceName: 'My Workspace',
  inviterName: 'John Doe',
  inviteUrl: 'https://example.com/invite/token',
});

// Send with client
await client.send({
  from: 'noreply@example.com',
  to: ['user@example.com'],
  subject: 'Workspace Invitation',
  html,
});
```

## Development

```bash
# Start React Email dev server to preview templates
bun run dev

# Type check
bun run typecheck
```

## Providers

### localhost (Development)

Writes emails to files in the workspace for local testing. No external API calls.

```typescript
createEmailClient({
  provider: 'localhost',
  workingDirectory: process.cwd(),
});
```

### resend (Production)

Production email sending via [Resend API](https://resend.com/).

```typescript
createEmailClient({
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY,
});
```

## Adding New Templates

1. Create a new template in `src/templates/` directory (e.g., `src/templates/password-reset.tsx`)
2. Add rendering functions in `src/templates.tsx`
3. Export from `src/index.ts`
4. Add types for template props

## API Reference

See [Resend Documentation](https://resend.com/docs/api-reference/emails/send-email) for the full API specification that this package follows.
