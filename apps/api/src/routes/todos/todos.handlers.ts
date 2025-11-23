import type { AppRouteHandler } from '../../lib/types';
import { todoStorage } from '../../lib/storage';
import type * as routes from './todos.routes';

export const list: AppRouteHandler<routes.ListRoute> = (c) => {
  // User is guaranteed to exist because of requireAuth middleware
  const user = c.get('user')!;
  const todos = todoStorage.getByUserId(user.id);

  return c.json(
    {
      todos,
      total: todos.length,
    },
    200
  );
};

export const create: AppRouteHandler<routes.CreateRoute> = async (c) => {
  // User is guaranteed to exist because of requireAuth middleware
  const user = c.get('user')!;
  const body = c.req.valid('json');

  const todo = todoStorage.create({
    title: body.title,
    description: body.description,
    userId: user.id,
  });

  return c.json(
    {
      message: 'Todo created successfully',
      todo,
    },
    201
  );
};

export const getOne: AppRouteHandler<routes.GetOneRoute> = (c) => {
  // User is guaranteed to exist because of requireAuth middleware
  const user = c.get('user')!;
  const { id } = c.req.valid('param');
  const todo = todoStorage.getById(id);

  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  // Ensure todo belongs to the authenticated user
  if (todo.userId !== user.id) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  return c.json({ todo }, 200);
};

export const update: AppRouteHandler<routes.UpdateRoute> = async (c) => {
  // User is guaranteed to exist because of requireAuth middleware
  const user = c.get('user')!;
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const existingTodo = todoStorage.getById(id);

  if (!existingTodo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  // Ensure todo belongs to the authenticated user
  if (existingTodo.userId !== user.id) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  const updatedTodo = todoStorage.update(id, body);

  if (!updatedTodo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  return c.json(
    {
      message: 'Todo updated successfully',
      todo: updatedTodo,
    },
    200
  );
};

export const remove: AppRouteHandler<routes.RemoveRoute> = (c) => {
  // User is guaranteed to exist because of requireAuth middleware
  const user = c.get('user')!;
  const { id } = c.req.valid('param');
  const todo = todoStorage.getById(id);

  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  // Ensure todo belongs to the authenticated user
  if (todo.userId !== user.id) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  todoStorage.delete(id);

  return c.json(
    {
      message: 'Todo deleted successfully',
    },
    200
  );
};
