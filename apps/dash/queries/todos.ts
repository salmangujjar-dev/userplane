/**
 * Todo queries and mutations
 * Handles all todo-related API interactions with React Query
 */

import { queryOptions } from '@tanstack/react-query';
import { api } from '@/lib/client/api';
import { logger } from '@/lib/logger';

// Type definitions (matches API schemas)
export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

// Query keys for cache management
export const queryKeys = {
  LIST_TODOS: { queryKey: ['list-todos'] },
  GET_TODO: (id: string) => ({ queryKey: [`get-todo-${id}`] }),
};

/**
 * Query options for listing all todos
 */
export const todosQueryOptions = queryOptions({
  ...queryKeys.LIST_TODOS,
  queryFn: async () => {
    logger.debug('Fetching todos list');
    const response = await api['api']['v1'].todos.$get();
    const data = await response.json();
    logger.info({ count: 'todos' in data ? data.todos.length : 0 }, 'Todos fetched successfully');
    return data;
  },
});

/**
 * Query options for a single todo
 */
export const createTodoQueryOptions = (id: string) =>
  queryOptions({
    ...queryKeys.GET_TODO(id),
    queryFn: async () => {
      const response = await api['api']['v1'].todos[':id'].$get({
        param: { id },
      });
      const json = await response.json();

      if ('message' in json && response.status >= 400) {
        throw new Error(json.message);
      }

      return json;
    },
  });

/**
 * Mutation function for creating a todo
 */
export const createTodo = async (data: CreateTodoInput) => {
  logger.info({ title: data.title }, 'Creating new todo');
  const response = await api['api']['v1'].todos.$post({
    json: data,
  });
  const json = await response.json();

  if ('message' in json && response.status >= 400) {
    logger.error({ error: json.message }, 'Failed to create todo');
    throw new Error(json.message);
  }

  logger.info({ todoId: 'todo' in json ? json.todo.id : 'unknown' }, 'Todo created successfully');
  return json;
};

/**
 * Mutation function for updating a todo
 */
export const updateTodo = async ({ id, data }: { id: string; data: UpdateTodoInput }) => {
  const response = await api['api']['v1'].todos[':id'].$patch({
    param: { id },
    json: data,
  });
  const json = await response.json();

  if (response.status !== 200) {
    const message = 'message' in json ? json.message : 'Failed to update todo';
    throw new Error(message);
  }

  return json;
};

/**
 * Mutation function for deleting a todo
 */
export const deleteTodo = async (id: string) => {
  logger.info({ todoId: id }, 'Deleting todo');
  const response = await api['api']['v1'].todos[':id'].$delete({
    param: { id },
  });

  if (response.status !== 200) {
    const json = await response.json();
    const message = 'message' in json ? json.message : 'Failed to delete todo';
    logger.error({ todoId: id, error: message }, 'Failed to delete todo');
    throw new Error(message);
  }

  logger.info({ todoId: id }, 'Todo deleted successfully');
};

/**
 * Mutation function for toggling todo completion
 */
export const toggleTodo = async (todo: Todo) => {
  return updateTodo({
    id: todo.id,
    data: {
      completed: !todo.completed,
    },
  });
};
