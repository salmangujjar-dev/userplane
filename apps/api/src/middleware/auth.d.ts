import type { Context, Next } from 'hono';
export type AuthContext = {
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
export declare function authMiddleware(c: Context<AuthContext>, next: Next): Promise<void>;
export declare function requireAuth(
  c: Context<AuthContext>,
  next: Next
): Promise<
  | (Response &
      import('hono').TypedResponse<
        {
          error: string;
          message: string;
        },
        401,
        'json'
      >)
  | undefined
>;
//# sourceMappingURL=auth.d.ts.map
