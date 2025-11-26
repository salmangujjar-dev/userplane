import type { AppRouteHandler } from '@/api/lib/types';
import { todoService } from '@/api/services/todos.service';
import type * as routes from '@/api/routes/todos/todos.routes';

/**
 * Handler layer for todos
 * Focuses solely on HTTP concerns: extracting request data, calling services, and formatting responses
 */

export const list: AppRouteHandler<routes.ListRoute> = (c) => {
  const user = c.get('user')!;
  const result = todoService.listUserTodos(user.id);

  return c.json(result, 200);
};

export const create: AppRouteHandler<routes.CreateRoute> = async (c) => {
  const user = c.get('user')!;
  const body = c.req.valid('json');

  const todo = todoService.createTodo(body, user.id);

  return c.json(
    {
      message: 'Todo created successfully',
      todo,
    },
    201
  );
};

export const getOne: AppRouteHandler<routes.GetOneRoute> = (c) => {
  const user = c.get('user')!;
  const { id } = c.req.valid('param');

  const todo = todoService.getUserTodo(id, user.id);

  if (!todo) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  return c.json({ todo }, 200);
};

export const update: AppRouteHandler<routes.UpdateRoute> = async (c) => {
  const user = c.get('user')!;
  const { id } = c.req.valid('param');
  const body = c.req.valid('json');

  const updatedTodo = todoService.updateTodo(id, body, user.id);

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
  const user = c.get('user')!;
  const { id } = c.req.valid('param');

  const deleted = todoService.deleteTodo(id, user.id);

  if (!deleted) {
    return c.json({ message: 'Todo not found' }, 404);
  }

  return c.json(
    {
      message: 'Todo deleted successfully',
    },
    200
  );
};
