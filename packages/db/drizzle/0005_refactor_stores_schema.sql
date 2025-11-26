-- Migration: Refactor stores schema
-- Add workspaceId, storeTitle, providerRegion, providerBucket, storeIsManaged
-- Remove providerMeta

-- Add workspace relationship
ALTER TABLE "stores" 
ADD COLUMN "workspace_id" text NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE DEFAULT '';
--> statement-breakpoint

-- Add new columns
ALTER TABLE "stores" 
ADD COLUMN "store_title" text NOT NULL DEFAULT 'Workspace Storage';
--> statement-breakpoint

ALTER TABLE "stores" 
ADD COLUMN "provider_region" text NOT NULL DEFAULT 'auto';
--> statement-breakpoint

ALTER TABLE "stores" 
ADD COLUMN "provider_bucket" text NOT NULL DEFAULT '';
--> statement-breakpoint

ALTER TABLE "stores" 
ADD COLUMN "store_is_managed" boolean NOT NULL DEFAULT true;
--> statement-breakpoint

-- Remove providerMeta column
ALTER TABLE "stores" 
DROP COLUMN "provider_meta";
--> statement-breakpoint

-- Remove defaults after initial migration
ALTER TABLE "stores" 
ALTER COLUMN "workspace_id" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "stores" 
ALTER COLUMN "store_title" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "stores" 
ALTER COLUMN "provider_region" DROP DEFAULT;
--> statement-breakpoint

ALTER TABLE "stores" 
ALTER COLUMN "provider_bucket" DROP DEFAULT;

