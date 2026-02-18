-- Step 1: Add featureGates JSONB column to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN "feature_gates" jsonb;

-- Step 2: Add quotedLimit column to entitlements
ALTER TABLE "entitlements" ADD COLUMN "quoted_limit" integer DEFAULT 0 NOT NULL;

-- Step 3: Backfill quotedLimit from existing hardcoded config
-- Essential plans (monthly + annual): seats=5, recordings=25, links=-1, screenshots=0, files=0
-- Starter plans: seats=10, recordings=-1, links=-1, screenshots=0, files=0
-- Scale Up plans: seats=15, recordings=-1, links=-1, screenshots=0, files=0
-- Enterprise plans: seats=30, recordings=-1, links=-1, screenshots=-1, files=-1
-- Free: seats=3, recordings=3, links=3, screenshots=0, files=0

UPDATE "entitlements" e
SET "quoted_limit" = CASE
  -- Free plan
  WHEN s."plan_id" = 'free' AND e."resource_type" = 'seats' THEN 3
  WHEN s."plan_id" = 'free' AND e."resource_type" = 'recordings' THEN 3
  WHEN s."plan_id" = 'free' AND e."resource_type" = 'links' THEN 3
  -- Essential
  WHEN s."plan_id" IN ('essential_monthly', 'essential_annual') AND e."resource_type" = 'seats' THEN 5
  WHEN s."plan_id" IN ('essential_monthly', 'essential_annual') AND e."resource_type" = 'recordings' THEN 25
  WHEN s."plan_id" IN ('essential_monthly', 'essential_annual') AND e."resource_type" = 'links' THEN -1
  -- Starter
  WHEN s."plan_id" IN ('starter_monthly', 'starter_annual') AND e."resource_type" = 'seats' THEN 10
  WHEN s."plan_id" IN ('starter_monthly', 'starter_annual') AND e."resource_type" = 'recordings' THEN -1
  WHEN s."plan_id" IN ('starter_monthly', 'starter_annual') AND e."resource_type" = 'links' THEN -1
  -- Scale Up
  WHEN s."plan_id" IN ('scale_up_monthly', 'scale_up_annual') AND e."resource_type" = 'seats' THEN 15
  WHEN s."plan_id" IN ('scale_up_monthly', 'scale_up_annual') AND e."resource_type" = 'recordings' THEN -1
  WHEN s."plan_id" IN ('scale_up_monthly', 'scale_up_annual') AND e."resource_type" = 'links' THEN -1
  -- Enterprise
  WHEN s."plan_id" IN ('enterprise_monthly', 'enterprise_annual') AND e."resource_type" = 'seats' THEN 30
  WHEN s."plan_id" IN ('enterprise_monthly', 'enterprise_annual') AND e."resource_type" IN ('recordings', 'links', 'screenshots', 'files') THEN -1
  ELSE 0
END
FROM "subscriptions" s
WHERE s."workspace_id" = e."workspace_id";

-- Step 4: Backfill featureGates on existing subscriptions
-- Free plan subscriptions don't exist in the subscriptions table, so no backfill needed for free

-- Essential plans
UPDATE "subscriptions"
SET "feature_gates" = '{"replayRecordings":true,"autoBlurSensitiveData":true,"requestScreenshots":false,"annotateScreenshots":false,"requestFileUploads":false,"requestConsoleLogs":false,"requestNetworkActivity":false,"requestServerLogs":false,"requestActionReplay":false,"customizeWorkspace":false,"requestAdditionalSeats":true,"bringYourOwnStorageRecordings":false,"bringYourOwnStorageScreenshots":false,"bringYourOwnStorageFiles":false,"customizeDataRetention":false,"enableEnterpriseCompliance":true,"customizeDataResidency":false,"integrateHelpDesks":true,"integrateCRMs":false,"integrateIssueTrackers":false,"integrateAutomation":false,"accessUserplaneAPI":false}'::jsonb
WHERE "plan_id" IN ('essential_monthly', 'essential_annual');

-- Starter plans
UPDATE "subscriptions"
SET "feature_gates" = '{"replayRecordings":true,"autoBlurSensitiveData":true,"requestScreenshots":false,"annotateScreenshots":false,"requestFileUploads":false,"requestConsoleLogs":false,"requestNetworkActivity":false,"requestServerLogs":false,"requestActionReplay":false,"customizeWorkspace":true,"requestAdditionalSeats":true,"bringYourOwnStorageRecordings":false,"bringYourOwnStorageScreenshots":false,"bringYourOwnStorageFiles":false,"customizeDataRetention":true,"enableEnterpriseCompliance":true,"customizeDataResidency":false,"integrateHelpDesks":true,"integrateCRMs":false,"integrateIssueTrackers":false,"integrateAutomation":false,"accessUserplaneAPI":false}'::jsonb
WHERE "plan_id" IN ('starter_monthly', 'starter_annual');

-- Scale Up plans
UPDATE "subscriptions"
SET "feature_gates" = '{"replayRecordings":true,"autoBlurSensitiveData":true,"requestScreenshots":false,"annotateScreenshots":false,"requestFileUploads":false,"requestConsoleLogs":false,"requestNetworkActivity":false,"requestServerLogs":false,"requestActionReplay":false,"customizeWorkspace":true,"requestAdditionalSeats":true,"bringYourOwnStorageRecordings":false,"bringYourOwnStorageScreenshots":false,"bringYourOwnStorageFiles":false,"customizeDataRetention":true,"enableEnterpriseCompliance":true,"customizeDataResidency":false,"integrateHelpDesks":true,"integrateCRMs":true,"integrateIssueTrackers":true,"integrateAutomation":true,"accessUserplaneAPI":false}'::jsonb
WHERE "plan_id" IN ('scale_up_monthly', 'scale_up_annual');

-- Enterprise plans
UPDATE "subscriptions"
SET "feature_gates" = '{"replayRecordings":true,"autoBlurSensitiveData":true,"requestScreenshots":true,"annotateScreenshots":true,"requestFileUploads":true,"requestConsoleLogs":true,"requestNetworkActivity":true,"requestServerLogs":true,"requestActionReplay":true,"customizeWorkspace":true,"requestAdditionalSeats":true,"bringYourOwnStorageRecordings":true,"bringYourOwnStorageScreenshots":true,"bringYourOwnStorageFiles":true,"customizeDataRetention":true,"enableEnterpriseCompliance":true,"customizeDataResidency":true,"integrateHelpDesks":true,"integrateCRMs":true,"integrateIssueTrackers":true,"integrateAutomation":true,"accessUserplaneAPI":true}'::jsonb
WHERE "plan_id" IN ('enterprise_monthly', 'enterprise_annual');

-- Step 5: Drop creditLimit and resourceCredited columns from entitlements
ALTER TABLE "entitlements" DROP COLUMN "credit_limit";
ALTER TABLE "entitlements" DROP COLUMN "resource_credited";
