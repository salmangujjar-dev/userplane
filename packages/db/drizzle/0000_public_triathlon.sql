DO $$ BEGIN
  CREATE TYPE "public"."domain_status" AS ENUM('pending', 'verified', 'revoked');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."resource_type" AS ENUM('seats', 'links', 'recordings', 'screenshots', 'files');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."link_provider_type" AS ENUM('intercom', 'zendesk', 'hubspot', 'freshdesk', 'freshchat', 'jira_service_management', 'helpscout', 'happyfox', 'ada', 'forethought', 'servicenow', 'front', 'zoho_desk', 'crisp', 'pylon', 'plain', 'asana', 'azure_devops', 'clickup', 'github', 'gitlab', 'jira', 'linear', 'notion', 'sentry', 'slack', 'web', 'others');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."link_type" AS ENUM('file', 'recording', 'session', 'screenshot');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."stream_provider" AS ENUM('cloudflare', 'mux');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."streaming_status" AS ENUM('pending', 'available', 'failed', 'expired', 'purged');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."upload_status" AS ENUM('pending', 'available', 'expired', 'purged');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."subscription_status" AS ENUM('pending', 'active', 'on_hold', 'cancelled', 'failed', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."workspace_invite_policy" AS ENUM('private', 'whitelisted', 'protected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" text PRIMARY KEY NOT NULL,
	"dispute_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"subscription_id" text,
	"workspace_id" text,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"stage" text,
	"remarks" text,
	"is_open" boolean DEFAULT true NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "domains" (
	"domain_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"domain_url" text NOT NULL,
	"domain_status" "domain_status" DEFAULT 'pending' NOT NULL,
	"recording_hide_sensitive" boolean DEFAULT false NOT NULL,
	"recording_capture_client_log" boolean DEFAULT false NOT NULL,
	"recording_capture_client_action" boolean DEFAULT false NOT NULL,
	"recording_capture_server_log" boolean DEFAULT false NOT NULL,
	"recording_capture_network_log" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "domains_workspace_url_unique" UNIQUE("workspace_id","domain_url","is_deleted")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"credit_limit" integer NOT NULL,
	"soft_limit" integer NOT NULL,
	"hard_limit" integer NOT NULL,
	"resource_credited" integer DEFAULT 0 NOT NULL,
	"resource_consumed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "integrations" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"provider" text NOT NULL,
	"provider_workspace_id" text NOT NULL,
	"provider_token" jsonb NOT NULL,
	"provider_meta" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recording_links" (
	"link_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"created_by" text NOT NULL,
	"link_title" text,
	"link_reusable" boolean DEFAULT false NOT NULL,
	"link_type" "link_type" DEFAULT 'recording' NOT NULL,
	"link_provider_type" "link_provider_type" DEFAULT 'web' NOT NULL,
	"link_provider_id" text,
	"link_provider_ref" text,
	"link_provider_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"project_id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_title" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recordings" (
	"recording_id" text PRIMARY KEY NOT NULL,
	"recording_link_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by" text NOT NULL,
	"upload_status" "upload_status" DEFAULT 'pending' NOT NULL,
	"stream_provider" "stream_provider",
	"stream_id" text,
	"streaming_status" "streaming_status",
	"recording_video_ref" text,
	"recording_thumbnail_ref" text,
	"recording_console_log_ref" text,
	"recording_network_logs_ref" text,
	"recording_action_ref" text,
	"system_meta" jsonb,
	"custom_meta" jsonb,
	"recording_duration" integer DEFAULT 180000 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"refund_id" text NOT NULL,
	"payment_id" text NOT NULL,
	"subscription_id" text,
	"workspace_id" text,
	"amount" integer NOT NULL,
	"status" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"impersonated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"product_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"cancelled_at" timestamp,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"last_webhook_id" text,
	"last_webhook_timestamp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"business_id" text NOT NULL,
	"event_timestamp" timestamp NOT NULL,
	"received_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp,
	"processed" boolean DEFAULT false NOT NULL,
	"processing_error" text,
	"subscription_id" text,
	"customer_id" text,
	"payload" jsonb NOT NULL,
	"previous_status" text,
	"new_status" text,
	"transition_skipped" boolean DEFAULT false NOT NULL,
	"skip_reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_members" (
	"workspace_member_id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_role" "workspace_role" DEFAULT 'member' NOT NULL,
	"notify_feature_highlights" boolean DEFAULT true NOT NULL,
	"notify_billing_events" boolean DEFAULT false NOT NULL,
	"notify_usage_events" boolean DEFAULT true NOT NULL,
	"notify_incoming_events" boolean DEFAULT true NOT NULL,
	"notify_admin_events" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"workspace_name" text NOT NULL,
	"workspace_invite_token" text NOT NULL,
	"workspace_invite_policy" "workspace_invite_policy" DEFAULT 'private' NOT NULL,
	"workspace_invite_domains" text,
	"workspace_billing_email" text NOT NULL,
	"dodo_customer_id" text,
	"recording_slug" text NOT NULL,
	"recording_customize_link" boolean DEFAULT false NOT NULL,
	"recording_company_name" text,
	"recording_company_logo_path" text,
	"recording_header" text,
	"recording_footnote" text,
	"recording_primary_color" text,
	"recording_max_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refunds" ADD CONSTRAINT "refunds_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_workspaces_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("workspace_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "disputes_dispute_id_idx" ON "disputes" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_subscription_id_idx" ON "disputes" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_workspace_id_idx" ON "disputes" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_is_open_idx" ON "disputes" USING btree ("is_open");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_workspace_status_idx" ON "domains" USING btree ("workspace_id","domain_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_domain_url_idx" ON "domains" USING btree ("domain_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_workspace_resource_idx" ON "entitlements" USING btree ("workspace_id","resource_type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_active_provider_workspace_idx" ON "integrations" USING btree ("provider","provider_workspace_id") WHERE "integrations"."is_deleted" = false;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "integrations_active_workspace_provider_idx" ON "integrations" USING btree ("workspace_id","provider") WHERE "integrations"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "integrations_workspace_id_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_id_idx" ON "recording_links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_domain_id_idx" ON "recording_links" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_created_by_idx" ON "recording_links" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_created_at_idx" ON "recording_links" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_provider_idx" ON "recording_links" USING btree ("link_provider_type","link_provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_link_type_idx" ON "recording_links" USING btree ("link_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_recording_link_id_idx" ON "recordings" USING btree ("recording_link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_upload_status_idx" ON "recordings" USING btree ("upload_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_id_idx" ON "recordings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_created_by_idx" ON "recordings" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_project_id_idx" ON "recordings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_created_at_idx" ON "recordings" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_stream_id_idx" ON "recordings" USING btree ("stream_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "refunds_refund_id_idx" ON "refunds" USING btree ("refund_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_payment_id_idx" ON "refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_subscription_id_idx" ON "refunds" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_workspace_id_idx" ON "refunds" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refunds_status_idx" ON "refunds" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_workspace_id_idx" ON "subscriptions" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_subscription_id_idx" ON "subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx" ON "subscriptions" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_subscription_id_idx" ON "webhook_events" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_processed_idx" ON "webhook_events" USING btree ("processed");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_received_at_idx" ON "webhook_events" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_events_customer_id_idx" ON "webhook_events" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_user_workspace_idx" ON "workspace_members" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_recording_slug_idx" ON "workspaces" USING btree ("recording_slug");