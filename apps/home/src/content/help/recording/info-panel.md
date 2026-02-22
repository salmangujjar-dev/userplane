---
title: 'Info Panel'
excerpt: 'View link details, system metadata, and custom metadata for a recording'
order: 8
lastUpdated: 2026-02-22
---

The **Info** tab in the recording detail view shows contextual information about the recording and the environment it was captured in.

## Link and project info

At the top of the Info panel you will see:

- **Link** — the recording link that was used, including its reference if one was set.
- **Project** — the project the recording belongs to.
- **Domain** — the domain associated with the link, if any.
- **Requested by** — the workspace member who created the link.

## Customer notes

Customers can add a free-text note when they submit a recording. Notes appear between the link info and system metadata sections in the Info panel.

Customer notes are useful for understanding what the customer was doing, what they expected to happen, or any other context they want to share. This saves your support team from having to ask follow-up questions.

## System metadata

System metadata is collected automatically from the customer's browser at recording time:

- **Browser** — the browser name and version (e.g. Chrome 120, Firefox 121).
- **Operating system** — the customer's OS (e.g. macOS 14, Windows 11).
- **Page URL** — the URL the customer was on when they started recording.

## Custom metadata

Custom metadata lets you attach contextual data from your application to a recording. If your site uses the [Metadata SDK](/help/developer-docs/metadata-sdk), any key-value pairs set via `metadata()` or `set()` before or during the recording will appear here. You can also pass metadata via the `userplane-meta` URL parameter on recording links — see [Metadata SDK](/help/developer-docs/metadata-sdk) for details.

### Common use cases

Custom metadata is particularly useful for capturing:

- **User identifiers** — user IDs, email addresses, or account names to connect a recording to a specific customer.
- **Session context** — subscription tier, user role, or authentication state.
- **Feature flags** — which experiments or features were active during the session.
- **Application state** — current page context, active workflow, or error conditions.

### How it appears

Custom metadata appears as a list of key-value pairs below the system metadata section. Values are displayed as strings, even if they were set as numbers or booleans in your code.
