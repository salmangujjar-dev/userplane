/**
 * Environment parsing utilities
 * Helper functions for parsing environment variable strings into typed values
 *
 * Note: process.env values are always string | undefined, so all schemas
 * start with z.string().optional() or z.string() for required values.
 */
import { z } from 'zod';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse comma-separated string into array
 */
export function parseCommaSeparated(value: string | undefined, defaultValue: string[]): string[] {
  if (!value) return defaultValue;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

// =============================================================================
// Basic String Schemas
// =============================================================================

/**
 * Required string with custom error message
 */
export const requiredString = (envVar: string) =>
  z.string({ required_error: `${envVar} is required` }).min(1, `${envVar} cannot be empty`);

/**
 * String with default value
 */
export const stringWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue);

/**
 * Comma-separated string to array with default
 */
export const commaSeparatedArray = (defaultValue: string[]) =>
  z
    .string()
    .optional()
    .transform((val): string[] => parseCommaSeparated(val, defaultValue));

// =============================================================================
// URL Schemas
// =============================================================================

/**
 * Required URL with validation
 */
export const requiredUrl = (envVar: string) =>
  z
    .string({ required_error: `${envVar} is required` })
    .min(1, `${envVar} cannot be empty`)
    .url(`${envVar} must be a valid URL`);

/**
 * URL with default value (validates the default and any provided value)
 */
export const urlWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue)
    .pipe(z.string().url());

/**
 * Comma-separated URLs with default
 */
export const commaSeparatedUrls = (defaultValue: string[]) =>
  z
    .string()
    .optional()
    .transform((val): string[] => parseCommaSeparated(val, defaultValue))
    .pipe(z.array(z.string().url()));

// =============================================================================
// Email Schemas
// =============================================================================

/**
 * Required email with validation
 */
export const requiredEmail = (envVar: string) =>
  z
    .string({ required_error: `${envVar} is required` })
    .min(1, `${envVar} cannot be empty`)
    .email(`${envVar} must be a valid email address`);

/**
 * Email with default value (validates the default and any provided value)
 */
export const emailWithDefault = (defaultValue: string) =>
  z
    .string()
    .optional()
    .transform((val): string => val || defaultValue)
    .pipe(z.string().email());

// =============================================================================
// Number Schemas
// =============================================================================

/**
 * Integer with default value
 */
export const integerWithDefault = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((val): number => {
      if (!val) return defaultValue;
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    });

/**
 * Required integer with validation
 */
export const requiredInteger = (envVar: string) =>
  z
    .string({ required_error: `${envVar} is required` })
    .min(1, `${envVar} cannot be empty`)
    .transform((val): number => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed)) throw new Error(`${envVar} must be a valid integer`);
      return parsed;
    });

/**
 * Float with default value
 */
export const floatWithDefault = (defaultValue: number) =>
  z
    .string()
    .optional()
    .transform((val): number => {
      if (!val) return defaultValue;
      const parsed = Number.parseFloat(val);
      return isNaN(parsed) ? defaultValue : parsed;
    });

// =============================================================================
// Boolean Schemas
// =============================================================================

/**
 * Boolean with default value
 */
export const booleanWithDefault = (defaultValue: boolean) =>
  z
    .string()
    .optional()
    .transform((val): boolean => {
      if (!val) return defaultValue;
      return val.toLowerCase() === 'true';
    });

// =============================================================================
// Enum Schemas
// =============================================================================

/**
 * Enum with default value
 */
export const enumWithDefault = <T extends string>(values: readonly [T, ...T[]], defaultValue: T) =>
  z
    .enum(values)
    .optional()
    .transform((val): T => val ?? defaultValue);
