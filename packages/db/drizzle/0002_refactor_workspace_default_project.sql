-- Remove circular dependency by moving default project logic to projects table

-- Step 1: Add is_default column to projects table
ALTER TABLE "projects" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;

-- Step 2: Migrate existing default project data (if any)
-- Set is_default=true for projects that were marked as default in workspaces
UPDATE "projects" p
SET "is_default" = true
FROM "workspaces" w
WHERE p."id" = w."default_project_id" 
  AND w."default_project_id" IS NOT NULL
  AND p."is_deleted" = false;

-- Step 3: Drop default_project_id from workspaces table
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "default_project_id";

-- Step 4: Rename logo_url to workspace_logo_url for consistency
ALTER TABLE "workspaces" RENAME COLUMN "logo_url" TO "workspace_logo_url";

-- Step 5: Create unique partial index to ensure only one default project per workspace
-- This enforces the constraint at the database level
CREATE UNIQUE INDEX IF NOT EXISTS "projects_workspace_default_idx" 
ON "projects"("workspace_id") 
WHERE "is_default" = true AND "is_deleted" = false;

-- Step 6: Add index on workspace_id for better query performance
CREATE INDEX IF NOT EXISTS "projects_workspace_id_is_default_idx" 
ON "projects"("workspace_id", "is_default") 
WHERE "is_deleted" = false;














