CREATE INDEX `expenses_date_idx` ON `expenses` (`date`);--> statement-breakpoint
CREATE INDEX `expenses_status_date_idx` ON `expenses` (`status`,`date`);--> statement-breakpoint
CREATE INDEX `expenses_employee_date_idx` ON `expenses` (`employee_id`,`date`);--> statement-breakpoint
CREATE INDEX `expenses_category_date_idx` ON `expenses` (`category_id`,`date`);