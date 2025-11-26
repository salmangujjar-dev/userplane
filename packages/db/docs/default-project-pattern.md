# Default Project Pattern

## Overview

The default project for a workspace is managed using an `isDefault` flag on the `projects` table, rather than a `defaultProjectId` foreign key on the `workspaces` table. This approach avoids circular dependency issues and simplifies database operations.

## Schema Design

### Projects Table

```typescript
{
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  // ... other fields
}
```

### Database Constraints

A unique partial index ensures only one default project per workspace:

```sql
CREATE UNIQUE INDEX projects_workspace_default_idx
ON projects(workspace_id)
WHERE is_default = true AND is_deleted = false;
```

This constraint:

- Allows only ONE default project per workspace
- Excludes deleted projects
- Permits zero defaults during setup or migrations
- Enforces integrity at the database level

## Usage Patterns

### Creating a Workspace with Default Project

```typescript
// Create workspace
const workspace = await createWorkspace({
  workspaceName: 'My Workspace',
  workspaceSlug: 'my-workspace',
});

// Create default project in single operation
const project = await createProject({
  workspaceId: workspace.id,
  projectPath: '/default',
  isDefault: true, // Atomically set as default
});
```

### Querying Default Project

```typescript
// Simple query without JOINs
const defaultProject = await db.query.projects.findFirst({
  where: (projects, { and, eq }) =>
    and(
      eq(projects.workspaceId, workspaceId),
      eq(projects.isDefault, true),
      eq(projects.isDeleted, false)
    ),
});
```

### Changing Default Project

```typescript
// Set new default (database constraint ensures only one)
await db.transaction(async (tx) => {
  // Clear existing default
  await tx
    .update(projects)
    .set({ isDefault: false })
    .where(and(eq(projects.workspaceId, workspaceId), eq(projects.isDefault, true)));

  // Set new default
  await tx.update(projects).set({ isDefault: true }).where(eq(projects.id, newProjectId));
});
```

### Deleting Default Project

```typescript
// No special handling needed for cascade deletes
await db
  .update(projects)
  .set({
    isDeleted: true,
    deletedAt: new Date(),
    isDefault: false, // Clear flag when soft deleting
  })
  .where(eq(projects.id, projectId));
```

## Benefits

1. **No Circular Dependencies**: Workspace and project can be created independently
2. **Atomic Operations**: Default project set in single database round-trip
3. **Simpler Queries**: No JOIN required to find default project
4. **Easier Deletes**: No foreign key constraints to manage
5. **Database-Enforced Integrity**: Unique partial index prevents inconsistent state
6. **Flexible Setup**: Can have zero defaults during migrations

## Migration

The migration from `workspaces.default_project_id` to `projects.is_default` is handled in migration `0002_refactor_workspace_default_project.sql`:

1. Adds `is_default` column to projects
2. Migrates existing default project references
3. Drops `default_project_id` from workspaces
4. Creates unique partial index
5. Renames `logo_url` to `workspace_logo_url` for naming consistency
