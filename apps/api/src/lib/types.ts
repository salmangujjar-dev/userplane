import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { BASE_PATH } from './constants';

export type AppEnv = {
  Bindings: Record<string, never>;
  Variables: {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
    } | null;
    session: {
      id: string;
      userId: string;
      expiresAt: Date;
    } | null;
  };
};

export type AppOpenAPI = OpenAPIHono<AppEnv, {}, typeof BASE_PATH>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppEnv>;
