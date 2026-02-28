import { z } from 'zod';

// ─── Serialized Value Types ─────────────────────────────────────────────────

export const SerializedElementSchema = z.object({
  type: z.literal('element'),
  tag: z.string().optional(),
  id: z.string().optional(),
  class: z.string().optional(),
  role: z.string().optional(),
  ariaLabel: z.string().optional(),
  text: z.string().optional(),
  selector: z.string().optional(),
});

export const SerializedFunctionSchema = z.object({
  type: z.literal('function'),
  name: z.string(),
  toString: z.string(),
});

export const SerializedErrorSchema = z.object({
  type: z.literal('error'),
  name: z.string(),
  message: z.string(),
  stack: z.string().optional(),
});

export const SerializedValueSchema: z.ZodType<
  | string
  | number
  | boolean
  | null
  | z.infer<typeof SerializedElementSchema>
  | z.infer<typeof SerializedFunctionSchema>
  | z.infer<typeof SerializedErrorSchema>
  | Record<string, unknown>
  | unknown[]
> = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  SerializedElementSchema,
  SerializedFunctionSchema,
  SerializedErrorSchema,
  z.record(z.unknown()),
  z.array(z.unknown()),
]);

// ─── Parsed Body ────────────────────────────────────────────────────────────

export const ParsedBodySchema = z.object({
  type: z.enum([
    'text',
    'json',
    'string',
    'FormData',
    'Blob',
    'ArrayBuffer',
    'URLSearchParams',
    'other',
    'unknown',
  ]),
  body: z.unknown(),
});

// ─── Console Log ────────────────────────────────────────────────────────────

export const RecordingConsoleLogSchema = z.object({
  id: z.string(),
  log_type: z.literal('console'),
  type: z.string(),
  args: z.array(SerializedValueSchema),
  trace: z.array(z.string()).optional(),
  timestamp: z.number(),
  url: z.string(),
  isInitialConsoleLog: z.boolean().optional(),
});

// ─── Network Log ────────────────────────────────────────────────────────────

export const RecordingNetworkLogSchema = z.object({
  id: z.string(),
  log_type: z.literal('network'),
  requestId: z.string(),
  startedDateTime: z.number(),
  timestamp: z.number(),
  url: z.string(),
  method: z.string(),
  requestHeaders: z.record(z.string()),
  requestBody: ParsedBodySchema.nullable(),
  status: z.number(),
  statusText: z.string(),
  responseHeaders: z.record(z.string()),
  mimeType: z.string(),
  responseBody: z.unknown(),
  isContentAllowed: z.boolean(),
  duration: z.union([z.number(), z.string()]),
  type: z.string(),
  protocol: z.string(),
  has_focus: z.boolean().optional(),
});

// ─── Action Log ─────────────────────────────────────────────────────────────

export const UserActionTypeSchema = z.enum([
  'click',
  'spa_route',
  'tab_activated',
  'tab_deactivated',
  'init_page',
  'page_unload',
  'recorder-pause',
  'recorder-resume',
  'tab_switch',
  'navigate',
]);

export const UserActionDataSchema = z
  .object({
    action: UserActionTypeSchema,
    url: z.string().optional(),
    title: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    triggeredBy: z.string().optional(),
    method: z.string().optional(),
    tabId: z.string().optional(),
    info: z
      .object({
        tagName: z.string(),
        id: z.string(),
        classList: z.array(z.string()),
      })
      .optional(),
  })
  .passthrough();

export const RecordingActionLogSchema = z.object({
  id: z.string(),
  log_type: z.literal('action'),
  type: z.literal('action'),
  timestamp: z.number(),
  data: UserActionDataSchema,
});

// ─── Backend Log ────────────────────────────────────────────────────────────

export const BackendLogLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);

export const RecordingBackendLogSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  level: BackendLogLevelSchema,
  message: z.string(),
  service: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  trace: z
    .object({
      traceId: z.string().optional(),
      spanId: z.string().optional(),
      parentSpanId: z.string().optional(),
    })
    .optional(),
  error: z
    .object({
      type: z.string().optional(),
      message: z.string().optional(),
      stack: z.string().optional(),
    })
    .optional(),
});

// ─── Discriminated Union ────────────────────────────────────────────────────

export const RecordingClientLogSchema = z.discriminatedUnion('log_type', [
  RecordingConsoleLogSchema,
  RecordingNetworkLogSchema,
  RecordingActionLogSchema,
]);

// ─── Type Exports ───────────────────────────────────────────────────────────

export type SerializedElement = z.infer<typeof SerializedElementSchema>;
export type SerializedFunction = z.infer<typeof SerializedFunctionSchema>;
export type SerializedError = z.infer<typeof SerializedErrorSchema>;
export type SerializedValue = z.infer<typeof SerializedValueSchema>;
export type ParsedBody = z.infer<typeof ParsedBodySchema>;
export type RecordingConsoleLog = z.infer<typeof RecordingConsoleLogSchema>;
export type RecordingNetworkLog = z.infer<typeof RecordingNetworkLogSchema>;
export type UserActionType = z.infer<typeof UserActionTypeSchema>;
export type UserActionData = z.infer<typeof UserActionDataSchema>;
export type RecordingActionLog = z.infer<typeof RecordingActionLogSchema>;
export type BackendLogLevel = z.infer<typeof BackendLogLevelSchema>;
export type RecordingBackendLog = z.infer<typeof RecordingBackendLogSchema>;
export type RecordingClientLog = z.infer<typeof RecordingClientLogSchema>;
