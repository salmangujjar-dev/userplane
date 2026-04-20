# Resend

Email delivery for transactional emails (sign-up confirmations, invitations, notifications).

## When you need this

Work involving email sending. Most development works without Resend -- emails are logged to the console by default.

## Setup

### Option A: Console logging (no setup)

Set the following in `apps/api/.env.development`:

```
EMAIL_PROVIDER=localhost
```

Emails are printed to the API server console instead of sent. This is the default and sufficient for most development work.

### Option B: Real email delivery

1. Sign up at [resend.com/signup](https://resend.com/signup).
2. Navigate to **API Keys**.
3. Click **Create API Key**. Copy the key immediately -- it is only shown once.

## Environment Variables

For real email delivery, set the following in `apps/api/.env.development`:

```
EMAIL_PROVIDER=resend
EMAIL_PROVIDER_API_KEY=re_xxxxx
```

## Verify

1. Trigger an email action (e.g., sign up for an account).
2. If using `localhost` provider, check the API server console output for the email content.
3. If using Resend, check the [Resend dashboard](https://resend.com/emails) for delivery status.

## Notes

- Free tier provides 100 emails per day and 3,000 per month with 1 custom domain.
- The `localhost` provider is the default. You only need Resend if you are testing actual email delivery or email templates in a real inbox.
