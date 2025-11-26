import { z } from '@hono/zod-openapi';

export const BASE_PATH = '/api/v1' as const;

export const ZOD_ERROR_MESSAGES = {
  REQUIRED: 'Required',
  EXPECTED_NUMBER: 'Expected number, received nan',
  NO_UPDATES: 'No updates provided',
};

export const ZOD_ERROR_CODES = {
  INVALID_UPDATES: 'invalid_updates',
};

export const notFoundSchema = z.object({
  message: z.string(),
});

export const errorSchema = z.object({
  success: z.boolean(),
  error: z.object({
    issues: z.array(
      z.object({
        code: z.string(),
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string().optional(),
      })
    ),
    name: z.string(),
  }),
});
