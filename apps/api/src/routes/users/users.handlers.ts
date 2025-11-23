import type { AppRouteHandler } from '../../lib/types';
import type * as routes from './users.routes';

// Sample data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' as const },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' as const },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' as const },
];

export const list: AppRouteHandler<routes.ListRoute> = (c) => {
  return c.json(
    {
      users: mockUsers,
      total: mockUsers.length,
    },
    200
  );
};

export const create: AppRouteHandler<routes.CreateRoute> = async (c) => {
  const body = c.req.valid('json');
  const newUser = {
    id: mockUsers.length + 1,
    ...body,
  };

  return c.json(
    {
      message: 'User created successfully',
      user: newUser,
    },
    201
  );
};

export const getOne: AppRouteHandler<routes.GetOneRoute> = (c) => {
  const { id } = c.req.valid('param');
  const user = mockUsers.find((u) => u.id === Number(id));

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json({ user }, 200);
};

export const update: AppRouteHandler<routes.UpdateRoute> = async (c) => {
  const { id } = c.req.valid('param');
  const user = mockUsers.find((u) => u.id === Number(id));

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  const body = c.req.valid('json');
  const updatedUser = { ...user, ...body, id: Number(id) };

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
  const user = mockUsers.find((u) => u.id === Number(id));

  if (!user) {
    return c.json({ message: 'User not found' }, 404);
  }

  return c.json(
    {
      message: 'User deleted successfully',
    },
    200
  );
};
