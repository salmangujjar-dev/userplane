CREATE TYPE "public"."billing_cadence" AS ENUM('monthly', 'annual');--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "billing_cadence" SET DATA TYPE "public"."billing_cadence" USING "billing_cadence"::"public"."billing_cadence";--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_cadence" "billing_cadence";