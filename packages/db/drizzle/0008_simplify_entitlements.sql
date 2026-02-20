-- Step 1: Drop soft_limit column from entitlements
ALTER TABLE "entitlements" DROP COLUMN "soft_limit";

-- Step 2: Rename hard_limit → actual_limit
ALTER TABLE "entitlements" RENAME COLUMN "hard_limit" TO "actual_limit";

-- Step 3: Migrate feature_gates JSONB keys on subscriptions
-- Map old 23-gate keys → new 12-gate keys
UPDATE "subscriptions"
SET "feature_gates" = jsonb_build_object(
  'requestRecordings', COALESCE(("feature_gates"->>'replayRecordings')::boolean, true),
  'requestSessions', COALESCE(("feature_gates"->>'requestSessions')::boolean, false),
  'requestScreenshots', COALESCE(("feature_gates"->>'requestScreenshots')::boolean, false),
  'requestFiles', COALESCE(("feature_gates"->>'requestFileUploads')::boolean, false),
  'redactSensitiveData', COALESCE(("feature_gates"->>'autoBlurSensitiveData')::boolean, false),
  'captureConsoleLog', COALESCE(("feature_gates"->>'requestConsoleLogs')::boolean, false),
  'captureNetworkActivity', COALESCE(("feature_gates"->>'requestNetworkActivity')::boolean, false),
  'captureUserActions', COALESCE(("feature_gates"->>'requestActionReplay')::boolean, false),
  'captureServerLogs', COALESCE(("feature_gates"->>'requestServerLogs')::boolean, false),
  'customizeRecordingLink', COALESCE(("feature_gates"->>'customizeWorkspace')::boolean, false),
  'customizeRetentionPolicy', COALESCE(("feature_gates"->>'customizeDataRetention')::boolean, false),
  'sendOutboundEmails', true
)
WHERE "feature_gates" IS NOT NULL;
