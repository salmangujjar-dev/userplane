# DodoPayments

Payment processing for Userplane billing and subscriptions.

## When you need this

Work involving billing, subscription management, or payment-related API routes.

## Setup

1. Sign up at [app.dodopayments.com](https://app.dodopayments.com).
2. Navigate to **Developer > API Keys**.
3. Click **Add API Key**. Copy the key immediately -- it is only shown once.
4. Navigate to **Developer > Webhooks**.
5. Click **Add Webhook**. Enter your API's webhook endpoint URL and select the events to subscribe to.
6. Copy the **Secret Key** for the webhook.

## Environment Variables

Set the following in `apps/api/.env.development`:

```
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_WEBHOOK_SECRET=your_webhook_secret_here
DODO_PAYMENTS_ENVIRONMENT=test_mode
```

Setting `DODO_PAYMENTS_ENVIRONMENT=test_mode` enables test mode. There is no separate test API key -- the environment variable controls the mode.

## Verify

Start the API server. Billing-related API routes should respond without errors.

## Notes

- Test mode is controlled by the `DODO_PAYMENTS_ENVIRONMENT` variable, not by a separate key.
- The API key is displayed only once at creation. If lost, generate a new one.
