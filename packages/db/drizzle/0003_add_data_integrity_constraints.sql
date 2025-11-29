-- Add critical data integrity constraints

-- Step 1: Remove any duplicate workspace memberships before adding unique constraint
-- Keep the oldest membership record for each user-workspace combination
DELETE FROM "workspace_members" w1
WHERE w1."id" NOT IN (
  SELECT MIN(w2."id")
  FROM "workspace_members" w2
  WHERE w2."user_id" = w1."user_id" 
    AND w2."workspace_id" = w1."workspace_id"
  GROUP BY w2."user_id", w2."workspace_id"
);

-- Step 2: Add unique constraint to prevent duplicate workspace memberships
-- This ensures a user can only be added once per workspace
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_user_workspace_idx" 
ON "workspace_members"("user_id", "workspace_id");

-- Step 3: Add validation constraints for entitlements
-- Ensure consumed resources never exceed capacity
ALTER TABLE "entitlements" 
ADD CONSTRAINT "entitlements_consumed_lte_cap" 
CHECK ("resource_consumed" <= "resource_cap");

-- Step 4: Ensure all resource values are non-negative
ALTER TABLE "entitlements" 
ADD CONSTRAINT "entitlements_non_negative" 
CHECK (
  "resource_consumed" >= 0 
  AND "resource_credited" >= 0 
  AND "resource_cap" >= 0
);

-- Step 5: Ensure resource_cap is always positive (cannot have zero-capacity entitlement)
ALTER TABLE "entitlements" 
ADD CONSTRAINT "entitlements_cap_positive" 
CHECK ("resource_cap" > 0);

-- Step 6: Add index on workspace_members for better query performance with soft deletes
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_active_idx" 
ON "workspace_members"("workspace_id") 
WHERE "is_deleted" = false;

CREATE INDEX IF NOT EXISTS "workspace_members_user_active_idx" 
ON "workspace_members"("user_id") 
WHERE "is_deleted" = false;









