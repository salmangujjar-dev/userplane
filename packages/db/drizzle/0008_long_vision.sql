ALTER TABLE "account" ALTER COLUMN "access_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "refresh_token_expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "account" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "resolved_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disputes" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "domain_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "domain_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "domains" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "resource_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "billing_cadence" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "entitlements" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "integrations" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "integrations" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "integrations" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "integrations" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "integrations" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "link_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "link_type" SET DEFAULT 'recording';--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "link_provider_type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "link_provider_type" SET DEFAULT 'web';--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recording_links" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "upload_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "upload_status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "stream_provider" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "streaming_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "recordings" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refunds" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "current_period_start" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "current_period_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "cancelled_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "trial_end" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "billing_cadence" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "last_webhook_timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "ban_expires" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "expires_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "verification" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "event_timestamp" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "received_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "received_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "webhook_events" ALTER COLUMN "processed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "workspace_role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "workspace_role" SET DEFAULT 'member';--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workspace_members" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "workspace_invite_policy" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "workspace_invite_policy" SET DEFAULT 'private';--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "workspaces" ALTER COLUMN "deleted_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_project_id_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_domain_id_domains_domain_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("domain_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_created_by_workspace_members_workspace_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."workspace_members"("workspace_member_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_recording_link_id_recording_links_link_id_fk" FOREIGN KEY ("recording_link_id") REFERENCES "public"."recording_links"("link_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_project_id_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("project_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_created_by_workspace_members_workspace_member_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."workspace_members"("workspace_member_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "domains_active_workspace_created_idx" ON "domains" USING btree ("workspace_id","created_at") WHERE "domains"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "recording_links_active_workspace_created_idx" ON "recording_links" USING btree ("workspace_id","created_at") WHERE "recording_links"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "recording_links_project_deleted_idx" ON "recording_links" USING btree ("project_id","is_deleted");--> statement-breakpoint
CREATE INDEX "recording_links_domain_deleted_idx" ON "recording_links" USING btree ("domain_id","is_deleted");--> statement-breakpoint
CREATE INDEX "projects_active_workspace_created_idx" ON "projects" USING btree ("workspace_id","created_at") WHERE "projects"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "recordings_active_workspace_created_idx" ON "recordings" USING btree ("workspace_id","created_at") WHERE "recordings"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "recordings_active_expires_idx" ON "recordings" USING btree ("expires_at") WHERE "recordings"."is_deleted" = false AND "recordings"."upload_status" = 'available';--> statement-breakpoint
CREATE INDEX "recordings_workspace_status_created_idx" ON "recordings" USING btree ("workspace_id","upload_status","created_at");--> statement-breakpoint
CREATE INDEX "recordings_project_deleted_idx" ON "recordings" USING btree ("project_id","is_deleted");--> statement-breakpoint
CREATE INDEX "session_user_expires_idx" ON "session" USING btree ("user_id","expires_at");--> statement-breakpoint
CREATE INDEX "workspace_members_active_workspace_role_idx" ON "workspace_members" USING btree ("workspace_id","workspace_role") WHERE "workspace_members"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "workspace_members_active_user_idx" ON "workspace_members" USING btree ("user_id") WHERE "workspace_members"."is_deleted" = false;--> statement-breakpoint
ALTER TABLE "domains" ADD CONSTRAINT "domains_status_check" CHECK ("domains"."domain_status" IN ('pending', 'verified', 'revoked'));--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_resource_type_check" CHECK ("entitlements"."resource_type" IN ('seats', 'links', 'recordings', 'screenshots', 'files'));--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_billing_cadence_check" CHECK ("entitlements"."billing_cadence" IS NULL OR "entitlements"."billing_cadence" IN ('monthly', 'annual'));--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_link_type_check" CHECK ("recording_links"."link_type" IN ('file', 'recording', 'session', 'screenshot'));--> statement-breakpoint
ALTER TABLE "recording_links" ADD CONSTRAINT "recording_links_link_provider_type_check" CHECK ("recording_links"."link_provider_type" IN ('intercom', 'zendesk', 'hubspot', 'freshdesk', 'freshchat', 'jira_service_management', 'helpscout', 'happyfox', 'ada', 'forethought', 'servicenow', 'front', 'zoho_desk', 'crisp', 'pylon', 'plain', 'asana', 'azure_devops', 'clickup', 'github', 'gitlab', 'jira', 'linear', 'notion', 'sentry', 'slack', 'web', 'others'));--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_upload_status_check" CHECK ("recordings"."upload_status" IN ('pending', 'available', 'expired', 'purged'));--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_stream_provider_check" CHECK ("recordings"."stream_provider" IS NULL OR "recordings"."stream_provider" IN ('cloudflare', 'mux'));--> statement-breakpoint
ALTER TABLE "recordings" ADD CONSTRAINT "recordings_streaming_status_check" CHECK ("recordings"."streaming_status" IS NULL OR "recordings"."streaming_status" IN ('pending', 'available', 'failed', 'expired', 'purged'));--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_status_check" CHECK ("subscriptions"."status" IN ('pending', 'active', 'on_hold', 'cancelled', 'failed', 'expired'));--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_billing_cadence_check" CHECK ("subscriptions"."billing_cadence" IS NULL OR "subscriptions"."billing_cadence" IN ('monthly', 'annual'));--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_role_check" CHECK ("workspace_members"."workspace_role" IN ('owner', 'admin', 'member'));--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_invite_policy_check" CHECK ("workspaces"."workspace_invite_policy" IN ('private', 'whitelisted', 'protected'));--> statement-breakpoint
DROP TYPE "public"."domain_status";--> statement-breakpoint
DROP TYPE "public"."billing_cadence";--> statement-breakpoint
DROP TYPE "public"."resource_type";--> statement-breakpoint
DROP TYPE "public"."link_provider_type";--> statement-breakpoint
DROP TYPE "public"."link_type";--> statement-breakpoint
DROP TYPE "public"."stream_provider";--> statement-breakpoint
DROP TYPE "public"."streaming_status";--> statement-breakpoint
DROP TYPE "public"."upload_status";--> statement-breakpoint
DROP TYPE "public"."subscription_status";--> statement-breakpoint
DROP TYPE "public"."workspace_role";--> statement-breakpoint
DROP TYPE "public"."workspace_invite_policy";