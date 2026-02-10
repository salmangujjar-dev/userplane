---
title: 'Project Lifecycle'
excerpt: 'Delete and restore projects, and understand what happens to associated data'
order: 2
lastUpdated: 2026-02-07
---

Projects can be deleted when they are no longer needed. Userplane uses a soft-delete system with a restoration window so you can recover from accidental deletions.

## Deleting a project

1. Go to [Workspace Settings > Projects](https://dash.userplane.io/_/settings?tab=general).
2. Select the project you want to delete.
3. Click **Delete**.

When a project is deleted:

- The project and all associated **recordings** and **links** are soft-deleted.
- Deleted data is not visible in the workspace but is retained temporarily for restoration.

**Note:** The **default project** cannot be deleted.

## Restoration windows

After deleting a project, you have a limited time to restore it:

| Time since deletion | Restoration type                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **0–3 days**        | **Full restoration** — the project, all recordings, and all links are fully restored.                    |
| **3–30 days**       | **Partial restoration** — the project is restored but some associated data may no longer be recoverable. |
| **30+ days**        | **No restoration** — the project and its data are permanently removed.                                   |

## Restoring a project

If a project was recently deleted and is within the restoration window:

1. Go to [Workspace Settings > Projects](https://dash.userplane.io/_/settings?tab=general).
2. Look for the deleted project in the deleted items section.
3. Click **Restore**.

## Related articles

- [Projects Overview](/help/workspace/projects-overview) — creating and using projects.
- [Project Retention](/help/workspace/project-retention) — configure automatic retention policies for recordings.
- [Workspace Lifecycle](/help/workspace/workspace-lifecycle) — deletion and restoration for the workspace itself.
