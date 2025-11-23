/**
 * Routes index - exports typed router for RPC client
 */
/**
 * Standalone router for RPC client type inference
 * This is separate from the main app to provide clean types
 */
export declare const router: import('hono/hono-base').HonoBase<
  import('hono/types').BlankEnv,
  | import('hono/types').BlankSchema
  | import('hono/types').MergeSchemaPath<import('hono/types').BlankSchema, '/users'>
  | import('hono/types').MergeSchemaPath<import('hono/types').BlankSchema, '/auth-test'>,
  '/'
>;
export type Router = typeof router;
//# sourceMappingURL=index.d.ts.map
