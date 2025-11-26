import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  todosQueryOptions,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodo,
  queryKeys,
  type Todo,
} from '@/queries/todos';

/**
 * Custom hook for managing todos
 * Provides query and mutation hooks for all todo operations
 */
export function useTodos() {
  const queryClient = useQueryClient();

  // Fetch todos
  const todosQuery = useQuery(todosQueryOptions);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
    },
  });

  return {
    // Query data
    todos: todosQuery.data?.todos || [],
    isLoading: todosQuery.isLoading,
    error: todosQuery.error,

    // Mutations
    createTodo: createMutation,
    updateTodo: updateMutation,
    deleteTodo: deleteMutation,
    toggleTodo: toggleMutation,
  };
}

export type { Todo };
