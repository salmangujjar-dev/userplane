-- Step 1: Add temporary JSONB column for the migrated data
ALTER TABLE "workspace_members" ADD COLUMN "notify_incoming_events_new" jsonb;

-- Step 2: Migrate data from boolean + notify_channels into new JSONB column
-- The email key comes from the old boolean; non-email keys come from notify_channels
UPDATE "workspace_members"
SET "notify_incoming_events_new" =
  jsonb_build_object('email', "notify_incoming_events") ||
  COALESCE(
    (SELECT jsonb_object_agg(key, value)
     FROM jsonb_each("notify_channels")
     WHERE key != 'email'),
    '{}'::jsonb
  );

-- Step 3: Drop old columns
ALTER TABLE "workspace_members" DROP COLUMN "notify_incoming_events";
ALTER TABLE "workspace_members" DROP COLUMN "notify_channels";

-- Step 4: Rename new column and set constraints
ALTER TABLE "workspace_members" RENAME COLUMN "notify_incoming_events_new" TO "notify_incoming_events";
ALTER TABLE "workspace_members" ALTER COLUMN "notify_incoming_events" SET NOT NULL;
ALTER TABLE "workspace_members" ALTER COLUMN "notify_incoming_events" SET DEFAULT '{"email": false}'::jsonb;
