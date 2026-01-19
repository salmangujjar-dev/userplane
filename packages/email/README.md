# @workspace/email

Unified email package with clients and React Email templates.

## Features

- Multiple email providers (localhost for development, Resend for production)
- React Email templates with server-safe rendering
- Idempotency keys for safe retries
- Email scheduling capabilities
- Batch sending for multiple recipients (up to 100 emails at once)
- Type-safe API
- Consistent response format (always returns array of IDs)

## Usage

### Email Client

```typescript
import { createEmailClient } from '@workspace/email';

const client = createEmailClient({
  provider: 'resend',
  apiKey: process.env.RESEND_API_KEY,
});

// Send single email
const response = await client.send({
  from: 'noreply@example.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Hello world</p>',
});
console.log(response.ids); // ['email-id-123']

// Send to multiple recipients using batch mode
const response = await client.send({
  from: 'noreply@example.com',
  to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
  subject: 'Welcome!',
  html: '<p>Hello world</p>',
  batch: true, // Triggers efficient batch sending
});
console.log(response.ids); // ['email-id-1', 'email-id-2', 'email-id-3']

// With idempotency key
await client.send(
  {
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject: 'Welcome!',
    html: '<p>Hello world</p>',
  },
  {
    idempotencyKey: 'unique-key-123',
  }
);

// Schedule email (not supported in batch mode)
await client.send(
  {
    from: 'noreply@example.com',
    to: 'user@example.com',
    subject: 'Scheduled',
    html: '<p>Future email</p>',
  },
  {
    scheduledAt: '2026-02-01T10:00:00Z',
  }
);
```

### Batch Sending

Batch sending is more efficient than sending individual emails when you need to send the same content to multiple recipients:

```typescript
// Instead of this (slow, multiple API calls)
for (const email of emails) {
  await client.send({
    from: 'noreply@example.com',
    to: email,
    subject: 'Update',
    html: '<p>News</p>',
  });
}

// Do this (fast, single API call)
const response = await client.send({
  from: 'noreply@example.com',
  to: emails, // Array of email addresses
  batch: true, // Enable batch mode
  subject: 'Update',
  html: '<p>News</p>',
});
console.log(`Sent ${response.ids.length} emails`);
```

**Batch Limitations:**

- Maximum 100 recipients per batch
- `scheduledAt` is not supported in batch mode
- Each recipient gets a separate email with individual tracking

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
