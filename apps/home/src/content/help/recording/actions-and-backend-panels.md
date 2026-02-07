---
title: 'Actions & Backend Panels'
excerpt: 'Review client-side interactions and server-side logs from a recording'
order: 10
lastUpdated: 2026-02-07
---

The **Actions** and **Backend** tabs in the recording detail view provide additional context that helps you understand the full story of what happened during a customer's session — both what they did and what your servers were doing at the same time.

These tabs only appear when the corresponding data types are enabled in your [domain recording preferences](/help/recording-links/domain-recording-preferences).

## Actions panel

When a customer sends you a screenshot of an error, you see what went wrong but not how they got there. Did they click a button twice? Fill out a form in an unexpected order? Skip a step? Screenshots are static snapshots that make issues hard to reproduce because you're missing the steps that led to that moment.

The Actions panel solves this by showing you exactly what the customer did during the recording. Client-side interactions captured include:

- **Clicks** — elements the customer clicked on.
- **Inputs** — form fields the customer typed into (content may be redacted if [sensitive data redaction](/help/recording-links/sensitive-data-redaction) is enabled).
- **Navigation** — page transitions and URL changes.

This panel helps you understand the exact sequence of steps the customer took leading up to the issue, making it much easier to reproduce and fix the problem.

## Backend panel

Sometimes the issue isn't on the customer's screen — it's happening on your servers. The Backend panel brings server-side context into your recording view by connecting with your error monitoring tools.

This panel doesn't capture backend logs directly. Instead, it associates the recording with server-side logs from your error monitoring tooling of choice, like Sentry or similar services. This integration helps you correlate what the customer saw on their screen with what happened on your servers at that exact moment — API errors, database timeouts, or business logic failures.

## Enabling capture

Client actions and backend log associations are controlled per domain. Go to **Workspace Settings > Domains**, select a verified domain, and toggle the relevant preferences. See [Domain Recording Preferences](/help/recording-links/domain-recording-preferences) for details.
