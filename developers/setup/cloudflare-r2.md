# Cloudflare R2

S3-compatible object storage for recordings and assets.

## When you need this

Any work involving file uploads, recording storage, asset management, or report generation in the API server (`apps/api`).

## Setup

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Navigate to **Storage & Databases** > **R2** > **Overview**.
3. Create three buckets — Userplane uses one each for CDN, Assets, and Reports.
4. Generate S3-compatible API tokens:
   - On the R2 Overview page, click **Manage API Tokens**.
   - Create a new token with **Object Read & Write** permission.
   - Optionally scope the token to specific buckets.
   - Copy the **Access Key ID** and **Secret Access Key**. The secret is shown only once.
5. Note your **Account ID** from the Cloudflare dashboard sidebar. The S3 endpoint follows this format:
   ```
   https://{ACCOUNT_ID}.r2.cloudflarestorage.com
   ```

## Environment Variables

Set the following in `apps/api/.env.development`:

**CDN bucket:**

```
R2_CDN_ACCOUNT_ID=xxxx
R2_CDN_ACCESS_KEY_ID=xxxx
R2_CDN_SECRET_ACCESS_KEY=xxxx
R2_CDN_BUCKET_NAME=xxxx
CDN_DOMAIN=https://cdn.example.com
```

**Assets bucket:**

```
R2_ASSETS_ACCOUNT_ID=xxxx
R2_ASSETS_ACCESS_KEY_ID=xxxx
R2_ASSETS_SECRET_ACCESS_KEY=xxxx
R2_ASSETS_BUCKET_NAME=xxxx
ASSETS_DOMAIN=https://assets.example.com
```

**Reports bucket:**

```
R2_REPORTS_ACCOUNT_ID=xxxx
R2_REPORTS_ACCESS_KEY_ID=xxxx
R2_REPORTS_SECRET_ACCESS_KEY=xxxx
R2_REPORTS_BUCKET_NAME=xxxx
```

Replace all placeholder values with your actual credentials and bucket names. `CDN_DOMAIN` and `ASSETS_DOMAIN` are the public URLs configured for serving content from those buckets.

## Verify

Start the API server and confirm that upload and download operations work through the API endpoints that interact with R2.

## Notes

- Free tier provides 10 GB storage, 1M writes/month, 10M reads/month, and free egress.
- The Secret Access Key is displayed only once during token creation. Store it immediately.
- If buckets are accessed from browsers, configure CORS rules per-bucket in the R2 dashboard. Check bucket CORS configuration first when debugging CORS errors.
