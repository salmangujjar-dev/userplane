ALTER TABLE "entitlements" ADD COLUMN "quoted_limit" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "entitlements" ADD COLUMN "billing_cadence" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "feature_gates" jsonb;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "addons" jsonb;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_end" timestamp;--> statement-breakpoint
ALTER TABLE "entitlements" DROP COLUMN "credit_limit";--> statement-breakpoint
ALTER TABLE "entitlements" DROP COLUMN "soft_limit";--> statement-breakpoint
ALTER TABLE "entitlements" RENAME COLUMN "hard_limit" TO "actual_limit";--> statement-breakpoint
ALTER TABLE "entitlements" DROP COLUMN "resource_credited";--> statement-breakpoint

-- Data migration: Backfill quoted_limit from plan config
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
WHERE s."workspace_id" = e."workspace_id";--> statement-breakpoint

-- Data migration: Seed feature_gates on existing subscriptions (new 12-gate key format)

-- Essential plans
UPDATE "subscriptions"
SET "feature_gates" = '{"requestRecordings":true,"requestSessions":false,"requestScreenshots":false,"requestFiles":false,"redactSensitiveData":true,"captureConsoleLog":false,"captureNetworkActivity":false,"captureUserActions":false,"captureServerLogs":false,"customizeRecordingLink":false,"customizeRetentionPolicy":false,"sendOutboundEmails":true}'::jsonb
WHERE "plan_id" IN ('essential_monthly', 'essential_annual');--> statement-breakpoint

-- Starter plans
UPDATE "subscriptions"
SET "feature_gates" = '{"requestRecordings":true,"requestSessions":false,"requestScreenshots":false,"requestFiles":false,"redactSensitiveData":true,"captureConsoleLog":false,"captureNetworkActivity":false,"captureUserActions":false,"captureServerLogs":false,"customizeRecordingLink":true,"customizeRetentionPolicy":true,"sendOutboundEmails":true}'::jsonb
WHERE "plan_id" IN ('starter_monthly', 'starter_annual');--> statement-breakpoint

-- Scale Up plans
UPDATE "subscriptions"
SET "feature_gates" = '{"requestRecordings":true,"requestSessions":false,"requestScreenshots":false,"requestFiles":false,"redactSensitiveData":true,"captureConsoleLog":false,"captureNetworkActivity":false,"captureUserActions":false,"captureServerLogs":false,"customizeRecordingLink":true,"customizeRetentionPolicy":true,"sendOutboundEmails":true}'::jsonb
WHERE "plan_id" IN ('scale_up_monthly', 'scale_up_annual');--> statement-breakpoint

-- Enterprise plans
UPDATE "subscriptions"
SET "feature_gates" = '{"requestRecordings":true,"requestSessions":true,"requestScreenshots":true,"requestFiles":true,"redactSensitiveData":true,"captureConsoleLog":true,"captureNetworkActivity":true,"captureUserActions":true,"captureServerLogs":true,"customizeRecordingLink":true,"customizeRetentionPolicy":true,"sendOutboundEmails":true}'::jsonb
WHERE "plan_id" IN ('enterprise_monthly', 'enterprise_annual');
