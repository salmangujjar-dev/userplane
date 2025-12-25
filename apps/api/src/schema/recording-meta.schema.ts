/**
 * Recording metadata schemas
 * Zod schemas for validating and transforming recording metadata
 */

import { z } from 'zod';

/**
 * System metadata - arbitrary key-value pairs
 */
export const systemMetaSchema = z.record(z.unknown());

/**
 * Custom metadata - arbitrary key-value pairs
 */
export const customMetaSchema = z.record(z.unknown());

/**
 * System metadata type
 */
export type SystemMeta = z.infer<typeof systemMetaSchema>;

/**
 * Custom metadata type
 */
export type CustomMeta = z.infer<typeof customMetaSchema>;
