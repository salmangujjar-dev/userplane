import type { z } from 'zod';

/**
 * MCP tool annotations — structurally compatible with the MCP SDK's
 * ToolAnnotations type so the contract package stays SDK-agnostic.
 */
export interface McpToolAnnotations {
  title?: string;
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/**
 * A complete MCP tool definition excluding the handler.
 * Used as the single source of truth for tool metadata.
 */
export interface McpToolDefinition<
  TInput extends Record<string, z.ZodTypeAny> = Record<string, z.ZodTypeAny>,
> {
  name: string;
  title: string;
  description: string;
  inputSchema: TInput;
  annotations: McpToolAnnotations;
  /** Optional MCP Apps metadata — used by hosts that support interactive UIs. */
  _meta?: {
    ui?: {
      resourceUri?: string;
      /** Control which surfaces can see/call this tool ('model' | 'app'). */
      visibility?: Array<'model' | 'app'>;
    };
    /** One-line human description rendered under the widget in ChatGPT. */
    'openai/widgetDescription'?: string;
    /** Status text shown while the tool is running. */
    'openai/toolInvocation/invoking'?: string;
    /** Status text shown after the tool completes. */
    'openai/toolInvocation/invoked'?: string;
  };
}

export const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const satisfies McpToolAnnotations;

export const MUTATING_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: false,
  openWorldHint: false,
} as const satisfies McpToolAnnotations;

export const IDEMPOTENT_MUTATING_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const satisfies McpToolAnnotations;

export const DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
} as const satisfies McpToolAnnotations;
