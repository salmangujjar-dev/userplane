DO $$ BEGIN
  ALTER TABLE "domains" ADD CONSTRAINT "domains_workspace_url_unique" UNIQUE("workspace_id","domain_url","is_deleted");
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN IF EXISTS "workspace_billing_email";