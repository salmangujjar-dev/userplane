/**
 * API key types - pinned to contract schemas
 * Re-exports from @userplane/contract for type consistency
 */

import type { ApiKeyCreateDataSchema, ApiKeyDataSchema } from '@userplane/contract';
import type { z } from 'zod';

/** API key info (masked) — pinned to contract schema */
export type ApiKeyData = z.infer<typeof ApiKeyDataSchema>;

/** API key creation response (full key shown once) — pinned to contract schema */
export type ApiKeyCreateData = z.infer<typeof ApiKeyCreateDataSchema>;
