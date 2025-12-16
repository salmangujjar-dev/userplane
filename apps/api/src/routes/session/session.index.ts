import createRouter from '@/api/lib/create-router';
import { sessionService } from '@/api/services';
import { createSessionRoutes } from './session.routes';
import { createSessionProcedures } from './session.impl';

const app = createRouter();
const sessionRoutes = createSessionRoutes(sessionService);
app.route('/session', sessionRoutes);

// Export oRPC implementation for contract-first API
export const sessionProcedures = createSessionProcedures(sessionService);

export default app;
