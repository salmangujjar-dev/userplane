import { Hono } from 'hono';
import { type AuthContext } from '../middleware/auth';
declare const authTest: Hono<AuthContext, import('hono/types').BlankSchema, '/'>;
export default authTest;
//# sourceMappingURL=auth-test.d.ts.map
