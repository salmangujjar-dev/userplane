export const RETENTION_DAYS_VALUES = [1, 3, 7, 14, 30, 45, 90, 180, 365] as const;
export type RetentionDays = (typeof RETENTION_DAYS_VALUES)[number];
export const DEFAULT_RETENTION_DAYS: RetentionDays = 30;
