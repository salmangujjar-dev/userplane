import createRouter from '@/api/lib/create-router';
import * as handlers from '@/api/handlers/status.handlers';
import * as routes from './status.routes';

const router = createRouter()
  .openapi(routes.index, handlers.index)
  .openapi(routes.health, handlers.health);

export default router;
