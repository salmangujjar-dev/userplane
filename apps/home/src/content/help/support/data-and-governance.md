---
title: 'Data & Governance'
excerpt: 'How Userplane handles your data — plain-English overview of privacy, security, and governance'
order: 2
lastUpdated: 2026-02-07
---

Your data is yours. We built Userplane with that as a starting point, not an afterthought. This page is a human-friendly overview of how we collect, store, protect, and delete your data. No legalese, just the stuff that actually matters.

## What we collect and why

When someone records a session through Userplane, we capture what's needed to replay it — screen content, console logs, network activity, and browser metadata. We don't collect anything beyond what's required to deliver the product. No ad tracking, no selling data to third parties, no surprises.

## Where your data lives

Recordings, thumbnails, logs, and metadata are stored in secure cloud infrastructure. Everything is scoped to your workspace and only accessible to its members. Outside your team, nobody can see it.

## Encryption

All data is encrypted in transit (TLS) and at rest using industry-standard encryption. Whether it's moving between the browser and our servers or sitting in storage, it's protected.

## Data retention

- **Active workspaces** — your data stays as long as your workspace is active and your subscription is current.
- **Deleted recordings** — follow the same soft-delete policy as other workspace resources: full restoration within 3 days, partial within 30 days, permanent deletion after 30 days.
- **Deleted workspaces** — workspace data follows the [workspace lifecycle](/help/workspace/workspace-lifecycle) restoration windows. After 30 days, everything is permanently removed.

## Deleting your data

You're always in control. Delete individual recordings, links, projects, or domains anytime from within Userplane. Workspace owners can delete the entire workspace.

Once deleted, here's the restoration timeline:

- **0-3 days** — full restoration is possible.
- **3-30 days** — partial restoration (some data may not be recoverable).
- **30+ days** — permanently and irreversibly gone.

## Keeping sensitive data out of recordings

Userplane gives you tools to make sure sensitive information never gets captured in the first place:

- **Automatic redaction** — flip on [Hide sensitive fields](/help/recording-links/domain-recording-preferences) per domain and we'll handle the rest.
- **Manual redaction** — tag elements with `data-userplane-redact` or `data-userplane-ignore` in your HTML. Details in [Sensitive Data Redaction](/help/recording-links/sensitive-data-redaction).

## Sub-processors and third parties

We use a small number of trusted sub-processors to run our infrastructure (cloud hosting, email delivery, payment processing). We vet each one and only share what's strictly necessary. If this list ever changes, we update our policies accordingly.

## Compliance requests

Need a DPA, security questionnaire, or anything related to compliance and data governance? [Submit a compliance request](https://tally.so/r/J9zNqX) and our team will follow up.

You can also reach us at **support@userplane.io** — we're happy to walk through any of this with you.

## Full legal policies

For the complete legal details, see our [Privacy Policy](/privacy) and [Terms of Service](/terms).
