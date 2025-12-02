ALTER TABLE "workspaces" ALTER COLUMN "workspace_plan" SET DEFAULT 'starter_monthly';--> statement-breakpoint
ALTER TABLE "public"."workspaces" ALTER COLUMN "workspace_plan" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."workspace_plan";--> statement-breakpoint
CREATE TYPE "public"."workspace_plan" AS ENUM('starter_monthly', 'starter_annual', 'scale_up_monthly', 'scale_up_annual', 'enterprise_monthly', 'enterprise_annual');--> statement-breakpoint
ALTER TABLE "public"."workspaces" ALTER COLUMN "workspace_plan" SET DATA TYPE "public"."workspace_plan" USING "workspace_plan"::"public"."workspace_plan";