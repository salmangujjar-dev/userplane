import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { BASE_PATH } from '../constants/api';

export type AppEnv = {
  Bindings: Record<string, never>;
  Variables: Record<string, never>;
};

export type AppOpenAPI = OpenAPIHono<AppEnv, {}, typeof BASE_PATH>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
