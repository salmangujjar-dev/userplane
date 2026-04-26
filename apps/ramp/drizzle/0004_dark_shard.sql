CREATE TABLE `cards` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`monthly_limit` real NOT NULL,
	`controls_label` text NOT NULL,
	`issued_at` text NOT NULL,
	`last_four` text NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `department_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`department` text NOT NULL,
	`monthly_budget` real NOT NULL,
	`owner_email` text NOT NULL,
	`reset_cadence` text DEFAULT 'monthly' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `department_budgets_department_unique` ON `department_budgets` (`department`);--> statement-breakpoint
CREATE TABLE `vendors` (
	`id` text PRIMARY KEY NOT NULL,
	`merchant` text NOT NULL,
	`category_id` text NOT NULL,
	`recurring` integer DEFAULT false NOT NULL,
	`savings_opportunity` text NOT NULL,
	`owner_department` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vendors_merchant_unique` ON `vendors` (`merchant`);