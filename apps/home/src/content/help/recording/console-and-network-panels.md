---
title: 'Console & Network Panels'
excerpt: 'Inspect browser console logs and network requests captured during a recording'
order: 9
lastUpdated: 2026-02-07
---

The **Console** and **Network** tabs in the recording detail view give you insight into what was happening behind the scenes during a customer's session. These panels help you understand technical issues that might not be visible in the recording itself — like JavaScript errors breaking functionality or failed API calls causing unexpected behavior.

These tabs only appear when the corresponding data types are enabled in your [domain recording preferences](/help/recording-links/domain-recording-preferences).

## Console panel

When troubleshooting customer issues, the visual recording tells part of the story. The Console panel shows you the other part: what errors or warnings the browser was generating while the customer was experiencing the problem.

Browser console output captured during the recording is displayed here. Entries are color-coded by level:

- **Errors** — JavaScript errors and exceptions that broke functionality (red).
- **Warnings** — deprecation notices and potential issues that may cause problems (yellow).
- **Messages** — standard `console.log` output and informational messages.

This panel helps you quickly spot JavaScript errors that explain why something didn't work as expected for your customer.

## Network panel

Sometimes a customer reports that "nothing happened" when they clicked a button. The Network panel shows you whether the issue was a failed API call, a slow server response, or something else network-related.

HTTP requests made during the recording are listed here. For each request you can see:

- **URL** — the request endpoint.
- **Method** — GET, POST, PUT, DELETE, etc.
- **Status** — the HTTP response status code.
- **Timing** — how long the request took.

This panel helps you identify failed API calls, slow responses, or unexpected request patterns that might explain the customer's experience.

## Enabling capture

Console and network data capture is controlled per domain. Go to [Workspace Settings > Domains](https://dash.userplane.io/_/settings?tab=general), select a verified domain, and toggle the relevant preferences. See [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) for details.
