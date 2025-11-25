CREATE TYPE "public"."workspace_plan" AS ENUM('trial', 'starter', 'scale_up', 'enterprise', 'reverse_trial');--> statement-breakpoint
CREATE TYPE "public"."store_provider" AS ENUM('r2', 's3');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('seat', 'link', 'recording', 'media', 'log');--> statement-breakpoint
CREATE TYPE "public"."workspace_role" AS ENUM('owner', 'admin', 'member');--> statement-breakpoint
CREATE TYPE "public"."domain_status" AS ENUM('pending', 'verified', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('zendesk', 'intercom', 'plain');--> statement-breakpoint
CREATE TYPE "public"."recording_status" AS ENUM('pending', 'failed', 'expired', 'completed');--> statement-breakpoint
CREATE TYPE "public"."stream_provider" AS ENUM('cloudflare', 'mux');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_slug" text NOT NULL,
	"workspace_name" text NOT NULL,
	"logo_url" text,
	"workspace_plan" "workspace_plan" DEFAULT 'trial' NOT NULL,
	"workspace_invite_token" text,
	"default_project_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" "store_provider" NOT NULL,
	"provider_url" text NOT NULL,
	"provider_access_id" text NOT NULL,
	"provider_access_key" text NOT NULL,
	"provider_meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"store_id" text NOT NULL,
	"project_title" text,
	"project_path" text NOT NULL,
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
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recording_links" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_by" text NOT NULL,
	"link_public_uri" text NOT NULL,
	"link_title" text,
	"link_reusable" boolean DEFAULT false NOT NULL,
	"provider_type" "provider_type",
	"provider_id" text,
	"provider_url" text,
	"provider_data" jsonb,
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
	"recording_media_path" text,
	"recording_logs_path" text,
	"recording_meta" jsonb,
	"recording_duration" integer,
	"recording_size" integer,
	"recording_log_size" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_workspace_slug_idx" ON "workspaces" USING btree ("workspace_slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "entitlements_workspace_resource_idx" ON "entitlements" USING btree ("workspace_id","resource_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_workspace_id_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_workspace_status_idx" ON "domains" USING btree ("workspace_id","domain_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "domains_domain_url_idx" ON "domains" USING btree ("domain_url");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recording_links_link_public_uri_idx" ON "recording_links" USING btree ("link_public_uri");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_id_idx" ON "recording_links" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_created_by_idx" ON "recording_links" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_workspace_created_at_idx" ON "recording_links" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recording_links_provider_idx" ON "recording_links" USING btree ("provider_type","provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_recording_link_id_idx" ON "recordings" USING btree ("recording_link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_recording_status_idx" ON "recordings" USING btree ("recording_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_id_idx" ON "recordings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_created_by_idx" ON "recordings" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_project_id_idx" ON "recordings" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_workspace_created_at_idx" ON "recordings" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_stream_id_idx" ON "recordings" USING btree ("stream_id");