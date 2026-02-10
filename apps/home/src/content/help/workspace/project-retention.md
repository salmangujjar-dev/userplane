---
title: 'Project Retention'
excerpt: 'Automatically enforce retention policies for customer recordings'
order: 3
lastUpdated: 2026-02-10
---

Project retention policies automatically control how long customer recordings are kept before they’re permanently deleted. This helps you stay compliant with GDPR, HIPAA, SOC 2, and internal data retention policies—without relying on manual cleanup.

Set it once, and your project enforces it in the background. Old recordings are removed on schedule, keeping sensitive data from lingering and keeping storage predictable.

## How it works

Retention policies apply consistent rules across every recording in a project:

- **Scope:** The policy applies to all recordings in the project. New recordings automatically inherit the project’s retention policy by default.
- **Action:** Recordings are permanently deleted once they exceed the retention period.
- **Timing:** Expiration is enforced automatically, so cleanup happens without disrupting support workflows.

This prevents recordings from accumulating indefinitely and keeps your team aligned with data governance requirements.

## Available retention periods

Choose a retention period that matches your compliance needs and support workflows:

- 1 day
- 3 days
- 7 days
- 14 days
- 30 days (**Default**)
- 45 days
- 90 days
- 180 days
- 365 days

Shorter periods reduce risk and exposure. Longer periods provide flexibility for complex investigations, handoffs, or training needs.

## Setting a retention policy

Configure automatic deletion for your project:

1. Go to [Workspace Settings > Projects](https://dash.userplane.io/_/settings?tab=general).
2. Create a new project or open an existing one.
3. Find **Recording retention** in the project settings.
4. Select a retention period from the dropdown.
5. Save your changes.

**Important:** Changes apply to existing recordings. If you shorten the retention period, any recordings older than the new limit will be deleted automatically to comply with the updated policy.

## Related articles

- [Recording Expiry](/help/recording/recording-expiry) — manually set expiration dates for individual recordings.
- [Projects Overview](/help/workspace/projects-overview) — creating and using projects.
- [Recording Projects](/help/recording/recording-projects) — how projects work with recordings.
- [Project Lifecycle](/help/workspace/project-lifecycle) — deleting and restoring projects.
