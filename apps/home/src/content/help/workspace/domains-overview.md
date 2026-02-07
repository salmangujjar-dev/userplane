---
title: 'Domains'
excerpt: 'Add and verify domains for first-party branded recording links'
order: 3
lastUpdated: 2026-02-07
---

Domains in Userplane represent the websites where your customers will use recording links. Adding and verifying a domain enables first-party branded links and unlocks per-domain recording preferences.

## Why add a domain

- **First-party branding** — recording links appear to come from your own domain rather than a generic Userplane URL.
- **Per-domain preferences** — configure what data is captured (console logs, network activity, client actions) for each domain.
- **Trust** — customers are more likely to engage with a recording link that matches your brand.

## Domain statuses

| Status       | Meaning                                                                                                                                           |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pending**  | The domain has been added but verification is not complete. You cannot create branded links or configure preferences until verification succeeds. |
| **Verified** | Domain ownership is confirmed. Branded links and per-domain recording preferences are active.                                                     |
| **Revoked**  | Verification was revoked. The domain must be re-verified to use it.                                                                               |

## Adding a domain

1. Go to [Workspace Settings > Domains](https://dash.userplane.io/_/settings?tab=general).
2. Click **Add Domain**.
3. Enter your domain (e.g. `app.example.com`).
4. Follow the [domain verification](/help/workspace/domain-verification) process to confirm ownership.

## Related articles

- [Domain Verification](/help/workspace/domain-verification) — verify your domain with a token-based flow.
- [Managing Domains](/help/workspace/domain-management) — sort, edit, and delete domains.
- [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) — configure capture settings per domain.
