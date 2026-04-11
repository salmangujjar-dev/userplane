-- Convert oauth_consent.scopes from text (PG array literal) to jsonb.
-- Missed in 0015_bitter_brood which converted all other OAuth array columns.
ALTER TABLE "oauth_consent" ALTER COLUMN "scopes" SET DATA TYPE jsonb USING to_jsonb(scopes::text[]);