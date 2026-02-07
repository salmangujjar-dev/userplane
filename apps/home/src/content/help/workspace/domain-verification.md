---
title: 'Domain Verification'
excerpt: 'Verify domain ownership using a token-based flow with CORS validation'
order: 4
lastUpdated: 2026-02-07
---

Domain verification confirms that you own or control a domain before Userplane enables branded recording links and per-domain preferences for it.

## How verification works

Userplane uses a **token-based verification** process:

1. Userplane generates a unique verification token (JWT) for your domain.
2. You add a script tag with the token to your website.
3. Userplane makes a CORS-validated request to your domain to check for the token.
4. If the token is found and valid, the domain status changes to **verified**.

## Verification steps

1. Go to [Workspace Settings > Domains](https://dash.userplane.io/_/settings?tab=general) and select the domain you want to verify.
2. Click **Verify**.
3. Copy the verification instructions. You can also send these instructions to a developer via email using the **Send to Developer** button.
4. Add the provided script tag to your website's HTML.
5. Click **Verify** in Userplane to trigger the check.

## Time limit

The verification token expires after **5 minutes**. If the token expires before verification completes, generate a new one and try again.

## CORS requirements

Your domain must allow CORS requests from Userplane during the verification process. The verification request will fail if CORS is blocked. See the [Domain Verification Guide](/help/developer-docs/domain-verification-guide) for technical details and troubleshooting.

## After verification

Once verified:

- The domain status changes to **Verified**.
- You can create branded recording links using this domain.
- [Domain recording preferences](/help/recording-links/domain-recording-preferences) become active.
- You can remove the verification script tag from your website.

## Related articles

- [Domains Overview](/help/workspace/domains-overview) — why domains matter.
- [Domain Verification Guide](/help/developer-docs/domain-verification-guide) — detailed technical guide for developers.
