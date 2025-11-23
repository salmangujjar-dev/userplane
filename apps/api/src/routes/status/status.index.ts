import createRouter from '../../lib/create-router';
import * as handlers from './status.handlers';
import * as routes from './status.routes';

const router = createRouter()
  .openapi(routes.index, handlers.index)
  .openapi(routes.health, handlers.health);

export default router;
