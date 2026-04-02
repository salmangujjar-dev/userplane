CREATE TABLE "workspace_member_identities" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_member_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_meta" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "workspace_members" ADD COLUMN "notify_channels" jsonb DEFAULT '{"email": true}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "workspace_member_identities" ADD CONSTRAINT "workspace_member_identities_workspace_member_id_workspace_members_workspace_member_id_fk" FOREIGN KEY ("workspace_member_id") REFERENCES "public"."workspace_members"("workspace_member_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_member_identities" ADD CONSTRAINT "workspace_member_identities_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_member_identities_active_member_provider_idx" ON "workspace_member_identities" USING btree ("workspace_member_id","provider") WHERE "workspace_member_identities"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "workspace_member_identities_workspace_id_idx" ON "workspace_member_identities" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_identities_workspace_provider_idx" ON "workspace_member_identities" USING btree ("workspace_id","provider") WHERE "workspace_member_identities"."is_deleted" = false;