CREATE TABLE `feature_flag_overrides` (
	`flag` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL,
	`updated_at` text NOT NULL
);
