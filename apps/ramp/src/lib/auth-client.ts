import { createAuthClient } from 'better-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2742: better-auth internal types not portable
export const authClient: any = createAuthClient();
