CREATE TYPE "public"."workspace_plan" AS ENUM('starter_monthly', 'starter_annual', 'scale_up_monthly', 'scale_up_annual', 'enterprise_monthly', 'enterprise_annual', 'early_bird_monthly', 'tiny_bird_monthly');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('seats', 'links', 'recordings', 'recording_links', 'logs', 'screenshots');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('pending', 'verified', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."link_provider_type" AS ENUM('intercom', 'zendesk', 'hubspot', 'freshdesk', 'freshchat', 'jira_service_management', 'helpscout', 'happyfox', 'ada', 'forethought', 'servicenow', 'front', 'zoho_desk', 'crisp', 'pylon', 'plain', 'asana', 'azure_devops', 'clickup', 'github', 'gitlab', 'jira', 'linear', 'notion', 'sentry', 'slack', 'web', 'others');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('pending', 'failed', 'expired', 'completed');--> statement-breakpoint
CREATE TYPE "public"."stream_provider" AS ENUM('cloudflare', 'mux');--> statement-breakpoint
CREATE TYPE "public"."streaming_status" AS ENUM('pending', 'ready', 'failed', 'completed', 'expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_name" text NOT NULL,
	"workspace_plan" "workspace_plan" DEFAULT 'early_bird_monthly' NOT NULL,
	"workspace_invite_token" text NOT NULL,
	"recording_slug" text NOT NULL,
	"recording_customize_link" boolean DEFAULT false NOT NULL,
	"recording_hide_sensitive" boolean DEFAULT false NOT NULL,
	"recording_capture_client_log" boolean DEFAULT true NOT NULL,
	"recording_capture_server_log" boolean DEFAULT true NOT NULL,
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
CREATE TABLE IF NOT EXISTS "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_title" text,
	"project_path" text NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "entitlements" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"resource_type" "resource_type" NOT NULL,
	"resource_cap" integer NOT NULL,
	"resource_credited" integer DEFAULT 0 NOT NULL,
	"resource_consumed" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspace_members" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"workspace_role" "workspace_role" DEFAULT 'member' NOT NULL,
	"notify_on_link_usage" boolean DEFAULT true NOT NULL,
	"notify_on_quota_reset" boolean DEFAULT false NOT NULL,
	"notify_on_quota_limit" boolean DEFAULT false NOT NULL,
	"notify_on_invite_accepted" boolean DEFAULT true NOT NULL,
	"notify_on_member_join" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "domains" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"domain_url" text NOT NULL,
	"domain_status" "domain_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "domains_workspace_url_unique" UNIQUE("workspace_id","domain_url","is_deleted")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recording_links" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"domain_id" text NOT NULL,
	"created_by" text NOT NULL,
	"link_guid" text NOT NULL,
	"link_title" text,
	"link_reusable" boolean DEFAULT false NOT NULL,
	"link_provider_type" "link_provider_type",
	"link_provider_id" text,
	"link_provider_ref" text,
	"link_provider_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recordings" (
	"id" text PRIMARY KEY NOT NULL,
	"recording_link_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by" text NOT NULL,
	"recording_status" "recording_status" DEFAULT 'pending' NOT NULL,
	"stream_provider" "stream_provider",
	"stream_id" text,
	"streaming_status" "streaming_status",
	"recording_media_ref" text,
	"recording_logs_ref" text,
	"recording_network_logs_ref" text,
	"recording_thumbnail_ref" text,
	"recording_meta" jsonb,
	"recording_duration" integer,
	"recording_size" integer,
	"recording_console_log_size" integer,
	"recording_network_log_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_recording_slug_idx" ON "workspaces" USING btree ("recording_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_workspace_resource_idx" ON "entitlements" USING btree ("workspace_id","resource_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_user_workspace_idx" ON "workspace_members" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_workspace_status_idx" ON "domains" USING btree ("workspace_id","domain_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_domain_url_idx" ON "domains" USING btree ("domain_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recording_links_link_guid_idx" ON "recording_links" USING btree ("link_guid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_id_idx" ON "recording_links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_domain_id_idx" ON "recording_links" USING btree ("domain_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_created_by_idx" ON "recording_links" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_created_at_idx" ON "recording_links" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_provider_idx" ON "recording_links" USING btree ("link_provider_type","link_provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_recording_link_id_idx" ON "recordings" USING btree ("recording_link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_recording_status_idx" ON "recordings" USING btree ("recording_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_id_idx" ON "recordings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_created_by_idx" ON "recordings" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_project_id_idx" ON "recordings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_created_at_idx" ON "recordings" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_stream_id_idx" ON "recordings" USING btree ("stream_id");