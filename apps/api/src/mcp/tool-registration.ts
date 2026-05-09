import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

type ContractRawShape = Readonly<Record<string, z.ZodTypeAny>>;
type ContractToolResult = CallToolResult | Promise<CallToolResult>;

type ContractShapeOutput<TShape extends ContractRawShape> = {
  [Key in keyof TShape]: z.output<TShape[Key]>;
};

type ContractToolCallback<TInput extends ContractRawShape> = (
  args: ContractShapeOutput<TInput>
) => ContractToolResult;

type ContractToolConfig<TInput extends ContractRawShape> = {
  title?: string;
  description?: string;
  inputSchema: TInput;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
};

type SdkToolConfig = Parameters<McpServer['registerTool']>[1];
type SdkToolCallback = Parameters<McpServer['registerTool']>[2];
type AppToolConfig = Parameters<typeof registerAppTool>[2];
type AppToolCallback = Parameters<typeof registerAppTool>[3];

/**
 * The contract package owns tool schemas with the workspace Zod version,
 * while the MCP SDK resolves its own compatible Zod types. Runtime validation
 * supports both; this adapter keeps that version split contained.
 */
export function registerContractTool<TInput extends ContractRawShape>(
  server: McpServer,
  name: string,
  config: ContractToolConfig<TInput>,
  callback: ContractToolCallback<TInput>
) {
  return server.registerTool(
    name,
    config as unknown as SdkToolConfig,
    callback as unknown as SdkToolCallback
  );
}

export function registerContractAppTool<TInput extends ContractRawShape>(
  server: Pick<McpServer, 'registerTool'>,
  name: string,
  config: ContractToolConfig<TInput>,
  callback: ContractToolCallback<TInput>
) {
  return registerAppTool(
    server,
    name,
    config as unknown as AppToolConfig,
    callback as unknown as AppToolCallback
  );
}
