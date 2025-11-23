/**
 * In-memory storage for todos
 * This is a simple implementation for demonstration purposes
 * In production, this would be replaced with a database
 */

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory store
const todosStore = new Map<string, Todo>();

export const todoStorage = {
  /**
   * Get all todos for a specific user
   */
  getByUserId: (userId: string): Todo[] => {
    const todos: Todo[] = [];
    for (const todo of todosStore.values()) {
      if (todo.userId === userId) {
        todos.push(todo);
      }
    }
    // Sort by creation date, newest first
    return todos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Get a specific todo by ID
   */
  getById: (id: string): Todo | undefined => {
    return todosStore.get(id);
  },

  /**
   * Create a new todo
   */
  create: (data: { title: string; description?: string; userId: string }): Todo => {
    const id = `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const todo: Todo = {
      id,
      title: data.title,
      description: data.description,
      completed: false,
      userId: data.userId,
      createdAt: now,
      updatedAt: now,
    };

    todosStore.set(id, todo);
    return todo;
  },

  /**
   * Update an existing todo
   */
  update: (
    id: string,
    updates: {
      title?: string;
      description?: string;
      completed?: boolean;
    }
  ): Todo | null => {
    const todo = todosStore.get(id);
    if (!todo) return null;

    const updatedTodo: Todo = {
      ...todo,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    todosStore.set(id, updatedTodo);
    return updatedTodo;
  },

  /**
   * Delete a todo
   */
  delete: (id: string): boolean => {
    return todosStore.delete(id);
  },

  /**
   * Check if a todo belongs to a user
   */
  belongsToUser: (id: string, userId: string): boolean => {
    const todo = todosStore.get(id);
    return todo?.userId === userId;
  },
};
