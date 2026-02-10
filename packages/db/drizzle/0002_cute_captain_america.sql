ALTER TABLE "projects" ADD COLUMN "recording_retention_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "recordings" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recordings_expires_at_idx" ON "recordings" USING btree ("expires_at");