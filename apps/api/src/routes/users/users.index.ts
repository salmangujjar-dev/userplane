import createRouter from '@/api/lib/create-router';
import * as handlers from '@/api/handlers/users.handlers';
import * as routes from './users.routes';

const router = createRouter()
  .openapi(routes.list, handlers.list)
  .openapi(routes.create, handlers.create)
  .openapi(routes.getOne, handlers.getOne)
  .openapi(routes.update, handlers.update)
  .openapi(routes.remove, handlers.remove);

export default router;
