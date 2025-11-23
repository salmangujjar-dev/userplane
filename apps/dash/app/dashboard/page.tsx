'use client';

import { useState } from 'react';
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
import { Button } from '@workspace/ui/components/button';
import { authClient } from '@/lib/client/auth';

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Fetch todos
  const { data, isLoading, error } = useQuery(todosQueryOptions);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
      setNewTodoTitle('');
      setNewTodoDescription('');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateTodo,
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.LIST_TODOS);
      setEditingTodo(null);
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

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    createMutation.mutate({
      title: newTodoTitle,
      description: newTodoDescription || undefined,
    });
  };

  const handleUpdateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editTitle.trim()) return;

    updateMutation.mutate({
      id: editingTodo.id,
      data: {
        title: editTitle,
        description: editDescription || undefined,
      },
    });
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  const cancelEdit = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading todos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">Error loading todos</p>
          <p className="text-sm text-gray-600">{error.message}</p>
          <Button onClick={handleSignOut} variant="outline" className="mt-4">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const todos = data?.todos || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your todos</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        {/* Create Todo Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Create New Todo
          </h2>
          <form onSubmit={handleCreateTodo} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={newTodoTitle}
                onChange={(e) => setNewTodoTitle(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={createMutation.isPending}
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={newTodoDescription}
                onChange={(e) => setNewTodoDescription(e.target.value)}
                placeholder="Add more details (optional)"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                disabled={createMutation.isPending}
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Todo'}
            </Button>
          </form>
        </div>

        {/* Todos List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Todos ({todos.length})
            </h2>
          </div>

          {todos.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                No todos yet. Create your first one above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {todos.map((todo) => (
                <div key={todo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
                  {editingTodo?.id === todo.id ? (
                    // Edit mode
                    <form onSubmit={handleUpdateTodo} className="space-y-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={updateMutation.isPending}>
                          Save
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // View mode
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleMutation.mutate(todo)}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={toggleMutation.isPending}
                      />
                      <div className="flex-1">
                        <h3
                          className={`font-medium ${
                            todo.completed
                              ? 'line-through text-gray-500'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p
                            className={`text-sm mt-1 ${
                              todo.completed
                                ? 'line-through text-gray-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          Created {new Date(todo.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEdit(todo)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteMutation.mutate(todo.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
