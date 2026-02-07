---
title: 'Quick Start Guide'
excerpt: 'Get up and running with Userplane — create a recording link, send it to a customer, and see exactly what went wrong.'
order: 1
lastUpdated: 2026-02-07
---

Userplane helps your support team request screen recordings from customers in just a few seconds. Instead of asking customers to describe what went wrong, you can send them a simple link and get a full video of the issue, complete with console logs, network activity, and more.

## How it works

1. **Create a recording link** — pick a project, domain, and optional reference, then share the link with your customer.
2. **Customer records** — your customer opens the link in their browser and records their screen. No installs or extensions needed.
3. **Review the recording** — watch the video and inspect console errors, network requests, client actions, and any custom metadata.

## Create your first recording link

1. Click **Create Link** in the top right of the navbar.
2. Choose a **project** to organize the recording under.
3. Select a **domain** if you'd like the link branded to your site.
4. Add an optional **reference** (like a Jira ticket number or GitHub issue URL) to help you find the recording later.
5. Choose whether the link is **one-time** or **reusable**.
6. Copy the link and share it with your customer through chat, email, or an Intercom macro.

## Review a recording

1. Open the **Recordings** page from the sidebar.
2. Browse recordings in the grid view, or filter by project, member, or link to find what you need.
3. Click a recording to open the detail view with resizable panels.
4. Use the right-hand tabs to dig into the details:
   - **Info** — link details, system metadata (browser, OS, URL), and custom metadata.
   - **Console** — browser console logs including errors, warnings, and messages.
   - **Network** — HTTP requests with timing and status codes.
   - **Actions** — clicks, inputs, and page navigations.
   - **Backend** — server-side logs if you've configured them.

## What gets captured

Every recording includes a video of your customer's screen. Depending on your [domain recording preferences](/support/recording-links/domain-recording-preferences), you can also capture:

- Browser console logs
- Network request and response data
- Client-side actions (clicks, inputs, navigation)
- Server-side and backend logs
- System metadata (browser, OS, page URL)

Sensitive data can be automatically redacted to keep things secure. See [Sensitive Data Redaction](/support/recording-links/sensitive-data-redaction) for more details.

## Next steps

- [Set up your workspace](/support/getting-started/workspace-setup) — invite your teammates and configure settings.
- [Connect Intercom](/support/getting-started/intercom-setup) — request recordings directly from Intercom conversations.
- [Customize your recording links](/support/recording-links/link-customization-overview) — add your branding and configure what gets captured.
