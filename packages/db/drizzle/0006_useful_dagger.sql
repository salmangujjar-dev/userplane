ALTER TABLE "workspaces" RENAME COLUMN "logo_url" TO "workspace_logo_url";--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "workspace_invite_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "workspace_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "store_title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "provider_region" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "provider_bucket" text NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "store_is_managed" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stores" ADD CONSTRAINT "stores_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_user_workspace_idx" ON "workspace_members" USING btree ("user_id","workspace_id");--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "default_project_id";--> statement-breakpoint
ALTER TABLE "stores" DROP COLUMN IF EXISTS "provider_meta";