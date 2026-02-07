---
title: 'Workspace Lifecycle'
excerpt: 'Join, leave, delete, and restore workspaces'
order: 10
lastUpdated: 2026-02-07
---

This article covers the major lifecycle events for a workspace — joining, leaving, deleting, and restoring.

## Joining a workspace

How you join a workspace depends on the workspace's [invite policy](/help/workspace/invite-policies):

- **Private** — you need a direct invitation from an owner or admin.
- **Whitelisted** — if your email domain is whitelisted, you can join directly.
- **Protected** — if your email domain matches, you can request access. An owner must approve your request within **7 days**.

## Leaving a workspace

Any member can leave a workspace from their account settings. See [Leaving a Workspace](/help/account/leaving-a-workspace) for details.

**Note:** If you are the workspace owner, you must transfer ownership before leaving.

## Deleting a workspace

Only the workspace **owner** can delete a workspace.

1. Go to [Workspace Settings > General](https://dash.userplane.io/_/settings?tab=workspace).
2. Scroll to the danger zone.
3. Click **Delete Workspace** and confirm.

Deleting a workspace is a **soft delete**. All workspace data (projects, recordings, links, domains, members) is marked as deleted but retained temporarily.

## Restoration windows

| Time since deletion | Restoration type                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **0–3 days**        | **Full restoration** — the workspace and all data are fully restored.                                               |
| **3–30 days**       | **Partial restoration** — the workspace is restored but some data (recordings, files) may no longer be recoverable. |
| **30+ days**        | **No restoration** — the workspace and all data are permanently removed.                                            |

## Restoring a workspace

If the workspace was deleted within the restoration window, contact the workspace owner to initiate restoration from their account.

## Updating workspace details

Owners can update the following workspace details from [Workspace Settings > General](https://dash.userplane.io/_/settings?tab=workspace):

- **Workspace name** — visible to members and in invitations.
- **Billing email** — where subscription receipts and billing notifications are sent.

## Workspace creation limits

Each user can create up to **3 workspaces per year** (rolling 365-day window).
