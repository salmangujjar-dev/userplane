import type { AppRouteHandler } from '@/api/lib/types';
import { userService } from '@/api/services/users.service';
import type * as routes from '@/api/routes/users/users.routes';

/**
 * Handler layer for users
 * Focuses solely on HTTP concerns: extracting request data, calling services, and formatting responses
 */

export const list: AppRouteHandler<routes.ListRoute> = (c) => {
  const result = userService.listUsers();
  return c.json(result, 200);
};

export const create: AppRouteHandler<routes.CreateRoute> = async (c) => {
  const body = c.req.valid('json');
  const user = userService.createUser(body);

  return c.json(
    {
      message: 'User created successfully',
      user,
    },
    201
  );
};

export const getOne: AppRouteHandler<routes.GetOneRoute> = (c) => {
  const { id } = c.req.valid('param');
  const user = userService.getUser(Number(id));

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json({ user }, 200);
};

export const update: AppRouteHandler<routes.UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const updatedUser = userService.updateUser(Number(id), body);

  if (!updatedUser) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json(
    {
      message: 'User updated successfully',
      user: updatedUser,
    },
    200
  );
};

export const remove: AppRouteHandler<routes.RemoveRoute> = (c) => {
  const { id } = c.req.valid('param');
  const deleted = userService.deleteUser(Number(id));

  if (!deleted) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json(
    {
      message: 'User deleted successfully',
    },
    200
  );
};
