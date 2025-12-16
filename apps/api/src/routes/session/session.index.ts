import createRouter from '@/api/lib/create-router';
import { sessionService } from '@/api/services';
import { createSessionRoutes } from './session.routes';

const app = createRouter();
const sessionRoutes = createSessionRoutes(sessionService);
app.route('/session', sessionRoutes);

export default app;
