---
title: 'Domain Recording Preferences'
excerpt: 'Control what data is captured per domain — console logs, network activity, client actions, and more'
order: 5
lastUpdated: 2026-02-07
---

Each verified domain in your workspace can have its own recording preferences. These settings control what data is captured alongside the video when a customer records on that domain.

## Available preferences

| Preference                 | Description                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hide sensitive fields**  | Automatically blur sensitive form fields and inputs during recording. See [Sensitive Data Redaction](/help/recording-links/sensitive-data-redaction). |
| **Capture console logs**   | Record browser console output (errors, warnings, messages).                                                                                           |
| **Capture client actions** | Record user interactions (clicks, inputs, navigation).                                                                                                |
| **Capture network logs**   | Record HTTP requests and responses (URLs, status codes, timing).                                                                                      |
| **Capture backend logs**   | Record server-side logs forwarded during the session.                                                                                                 |

## Configuring preferences

1. Go to **Workspace Settings > Domains**.
2. Select a **verified** domain.
3. Toggle the preferences you want to enable or disable.
4. Changes take effect immediately for new recordings.

## Requirements

Domain recording preferences are only available for **verified** domains. If a domain is in **pending** or **revoked** status, you must complete [domain verification](/help/workspace/domain-verification) first.

## Defaults

All capture preferences are enabled by default when a domain is first verified. You can disable any preference that does not apply to your use case.

## Related articles

- [Customizing Recording Links](/help/recording-links/link-customization-overview) — overview of branding and preferences.
- [Sensitive Data Redaction](/help/recording-links/sensitive-data-redaction) — how sensitive data is automatically hidden.
- [Domain Verification](/help/workspace/domain-verification) — verify your domain to unlock preferences.
