-- Convert text columns storing PG array literals to jsonb arrays.
-- Data was written in PG array format (e.g. {"a","b"}) by Better Auth's
-- Drizzle adapter (supportsArrays: true). Cast text → text[] → jsonb.
ALTER TABLE "oauth_access_token" ALTER COLUMN "scopes" SET DATA TYPE jsonb USING to_jsonb(scopes::text[]);--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "contacts" SET DATA TYPE jsonb USING CASE WHEN contacts IS NULL THEN NULL ELSE to_jsonb(contacts::text[]) END;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "redirect_uris" SET DATA TYPE jsonb USING to_jsonb(redirect_uris::text[]);--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "post_logout_redirect_uris" SET DATA TYPE jsonb USING CASE WHEN post_logout_redirect_uris IS NULL THEN NULL ELSE to_jsonb(post_logout_redirect_uris::text[]) END;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "scopes" SET DATA TYPE jsonb USING CASE WHEN scopes IS NULL THEN NULL ELSE to_jsonb(scopes::text[]) END;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "grant_types" SET DATA TYPE jsonb USING CASE WHEN grant_types IS NULL THEN NULL ELSE to_jsonb(grant_types::text[]) END;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "response_types" SET DATA TYPE jsonb USING CASE WHEN response_types IS NULL THEN NULL ELSE to_jsonb(response_types::text[]) END;--> statement-breakpoint
ALTER TABLE "oauth_client" ALTER COLUMN "metadata" SET DATA TYPE jsonb USING CASE WHEN metadata IS NULL THEN NULL ELSE metadata::jsonb END;--> statement-breakpoint
ALTER TABLE "oauth_refresh_token" ALTER COLUMN "scopes" SET DATA TYPE jsonb USING to_jsonb(scopes::text[]);
