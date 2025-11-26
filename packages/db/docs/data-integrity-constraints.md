# Data Integrity Constraints

## Overview

Database-level constraints enforce business rules and prevent invalid data at the lowest level. This document describes the critical integrity constraints implemented across our schema.

## Workspace Members Constraints

### Unique User per Workspace

**Problem**: Without a unique constraint, a user could be added to the same workspace multiple times, causing:

- Duplicate memberships in queries
- Incorrect seat counting for entitlements
- Potential duplicate owners/admins
- Data inconsistency issues

**Solution**: Unique index on (userId, workspaceId)

```typescript
// packages/db/src/schema/workspace-members.ts
(table) => [
  index('workspace_members_user_id_idx').on(table.userId),
  index('workspace_members_workspace_id_idx').on(table.workspaceId),
  uniqueIndex('workspace_members_user_workspace_idx').on(table.userId, table.workspaceId), // Prevents duplicates
];
```

```sql
-- Database constraint
CREATE UNIQUE INDEX workspace_members_user_workspace_idx
ON workspace_members(user_id, workspace_id);
```

**Effect**: Database will reject attempts to insert duplicate user-workspace combinations.

### Usage

```typescript
// This will work
await createWorkspaceMember({
  userId: 'user_123',
  workspaceId: 'workspace_456',
  workspaceRole: 'member',
});

// This will throw a unique constraint violation error
await createWorkspaceMember({
  userId: 'user_123',
  workspaceId: 'workspace_456', // Same combination
  workspaceRole: 'admin',
});
```

## Entitlements Constraints

### Resource Consumption Limits

**Problem**: Without constraints, application bugs could:

- Consume more resources than allocated
- Set negative resource values
- Create zero-capacity entitlements

**Solution**: CHECK constraints at database level

#### 1. Consumed Cannot Exceed Cap

```sql
ALTER TABLE entitlements
ADD CONSTRAINT entitlements_consumed_lte_cap
CHECK (resource_consumed <= resource_cap);
```

**Effect**: Prevents over-consumption at database level

```typescript
// This will work
await updateEntitlement({
  resourceConsumed: 8,
  resourceCap: 10, // 8 <= 10
});

// This will throw a check constraint violation
await updateEntitlement({
  resourceConsumed: 12,
  resourceCap: 10, // 12 > 10 - REJECTED
});
```

#### 2. Non-Negative Values

```sql
ALTER TABLE entitlements
ADD CONSTRAINT entitlements_non_negative
CHECK (
  resource_consumed >= 0
  AND resource_credited >= 0
  AND resource_cap >= 0
);
```

**Effect**: Prevents negative resource values

```typescript
// This will throw a check constraint violation
await updateEntitlement({
  resourceConsumed: -5, // Negative - REJECTED
  resourceCap: 10,
});
```

#### 3. Positive Capacity

```sql
ALTER TABLE entitlements
ADD CONSTRAINT entitlements_cap_positive
CHECK (resource_cap > 0);
```

**Effect**: Ensures every entitlement has a meaningful capacity

```typescript
// This will throw a check constraint violation
await createEntitlement({
  resourceType: 'seat',
  resourceCap: 0, // Zero capacity - REJECTED
});
```

## Query Optimizations

### Soft Delete Aware Indexes

For workspace members, we add partial indexes that exclude deleted records:

```sql
-- Faster queries that filter by is_deleted = false
CREATE INDEX workspace_members_workspace_active_idx
ON workspace_members(workspace_id)
WHERE is_deleted = false;

CREATE INDEX workspace_members_user_active_idx
ON workspace_members(user_id)
WHERE is_deleted = false;
```

**Effect**: Queries filtering active members use optimized indexes

```typescript
// This query will use the partial index
const activeMembers = await db.query.workspaceMembers.findMany({
  where: (members, { and, eq }) =>
    and(
      eq(members.workspaceId, workspaceId),
      eq(members.isDeleted, false) // Index optimization
    ),
});
```

## Migration Strategy

The migration (`0003_add_data_integrity_constraints.sql`) handles existing data:

1. **Removes duplicate memberships**: Keeps oldest record per user-workspace combination
2. **Adds unique constraint**: Prevents future duplicates
3. **Adds check constraints**: Validates resource values
4. **Creates optimized indexes**: Improves query performance

## Benefits

1. **Data Integrity**: Invalid states prevented at database level
2. **Application Safety**: Bugs cannot corrupt data
3. **Clear Error Messages**: Constraint violations provide immediate feedback
4. **Performance**: Unique indexes speed up duplicate checks
5. **Documentation**: Constraints serve as executable documentation of business rules

## Error Handling

When constraints are violated, handle them gracefully:

```typescript
try {
  await createWorkspaceMember({
    userId: 'user_123',
    workspaceId: 'workspace_456',
    workspaceRole: 'member',
  });
} catch (error) {
  if (error.code === '23505') {
    // PostgreSQL unique violation
    throw new Error('User is already a member of this workspace');
  }
  if (error.code === '23514') {
    // PostgreSQL check violation
    throw new Error('Resource limits exceeded or invalid values');
  }
  throw error;
}
```

## Testing Constraints

Verify constraints are working:

```sql
-- Test 1: Duplicate membership (should fail)
INSERT INTO workspace_members (id, user_id, workspace_id, workspace_role)
VALUES ('wm_1', 'user_123', 'ws_456', 'member');

INSERT INTO workspace_members (id, user_id, workspace_id, workspace_role)
VALUES ('wm_2', 'user_123', 'ws_456', 'admin'); -- FAILS

-- Test 2: Over-consumption (should fail)
INSERT INTO entitlements (id, workspace_id, resource_type, resource_cap, resource_consumed)
VALUES ('ent_1', 'ws_456', 'seat', 10, 12); -- FAILS

-- Test 3: Negative values (should fail)
INSERT INTO entitlements (id, workspace_id, resource_type, resource_cap, resource_consumed)
VALUES ('ent_2', 'ws_456', 'seat', 10, -5); -- FAILS
```
