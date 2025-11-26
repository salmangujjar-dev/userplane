-- Migration: Make workspace_invite_token and workspace_logo_url NOT NULL
-- This ensures every workspace always has a valid invite token and logo URL

-- Set a default UUID for any existing workspaces without an invite token
UPDATE workspaces 
SET workspace_invite_token = gen_random_uuid()::text
WHERE workspace_invite_token IS NULL;
--> statement-breakpoint

-- Set a default logo URL for any existing workspaces without a logo
UPDATE workspaces 
SET workspace_logo_url = '/favicon.svg'
WHERE workspace_logo_url IS NULL;
--> statement-breakpoint

-- Now make both columns NOT NULL
ALTER TABLE "workspaces" 
ALTER COLUMN "workspace_invite_token" SET NOT NULL;
--> statement-breakpoint

ALTER TABLE "workspaces" 
ALTER COLUMN "workspace_logo_url" SET NOT NULL;

