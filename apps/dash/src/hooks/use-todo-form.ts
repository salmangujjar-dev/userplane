import { useState } from 'react';
import type { Todo } from '@/queries/todos';

/**
 * Custom hook for managing todo form state
 * Handles both create and edit forms
 */
export function useTodoForm() {
  // Create form state
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');

  // Edit form state
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const resetCreateForm = () => {
    setNewTodoTitle('');
    setNewTodoDescription('');
  };

  const resetEditForm = () => {
    setEditingTodo(null);
    setEditTitle('');
    setEditDescription('');
  };

  const startEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  return {
    // Create form
    newTodoTitle,
    setNewTodoTitle,
    newTodoDescription,
    setNewTodoDescription,
    resetCreateForm,

    // Edit form
    editingTodo,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    startEdit,
    cancelEdit: resetEditForm,
  };
}
