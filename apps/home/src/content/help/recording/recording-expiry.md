---
title: 'Recording Expiry'
excerpt: 'Automatically revoke access to recordings to stay compliant'
order: 5
lastUpdated: 2026-02-10
---

Recording expiry automatically revokes access to customer-provided recordings the moment they expire—so sensitive data doesn’t linger longer than it should. This helps you meet SOC 2, GDPR, and internal data retention requirements without relying on manual cleanup.

Use expiry when reviewing sensitive account details, troubleshooting short-lived issues, or handling recordings that contain personal data. Set it once, and access is removed exactly when your policies require.

By default, recordings automatically inherit your project-level retention policies, so expiry rules are applied consistently without extra configuration.

## Setting an expiry date

Control how long a customer recording remains accessible:

1. Open the [recording](https://dash.userplane.io/_/recordings) you want to manage.
2. Click **Settings** (gear icon) or the **Share** menu.
3. Find **Expires at** or **Expiration**.
4. Select a date and time.

Once the expiration time is reached, access is revoked immediately.

> **Note:** Recordings inherit project-level retention policies by default. You can override the expiration for individual recordings if needed. See [Project Retention](/help/workspace/project-retention) for details on configuring automatic retention policies.

## What happens when a recording expires?

As soon as a recording expires:

- The link stops working immediately.
- The recording is no longer accessible to anyone.
- Playback and downloads are disabled.

This enforces your retention policies and reduces the risk of unauthorized access to customer data.

## Removing or extending expiry

If your policy allows continued access, you can update the expiration date (up to one year at a time). This is useful for handoffs or longer investigations.

To remove expiry entirely, open the recording’s settings and select **No expiration**. Access is restored immediately.

## Related articles

- [Project Retention](/help/workspace/project-retention) — configure automatic retention policies for all recordings in a project.
- [Recording Projects](/help/recording/recording-projects) — organize recordings by project.
- [Reviewing Recordings](/help/recording/reviewing-recordings) — how to access and analyze customer recordings.
