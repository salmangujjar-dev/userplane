import createRouter from '@/share/lib/create-router';
import * as handlers from '@/share/handlers/status.handlers';
import * as routes from './status.routes';

const router = createRouter().openapi(routes.health, handlers.health);

export default router;
