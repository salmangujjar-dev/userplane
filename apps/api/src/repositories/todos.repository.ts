import { todoStorage } from '@/api/lib/storage';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@/api/models/todo';

/**
 * Repository layer for todos
 * Handles data access operations and interacts with the storage layer
 * No business logic or authorization checks should be here
 */
export class TodoRepository {
  /**
   * Find all todos for a specific user
   */
  findByUserId(userId: string): Todo[] {
    return todoStorage.getByUserId(userId);
  }

  /**
   * Find a single todo by ID
   */
  findById(id: string): Todo | undefined {
    return todoStorage.getById(id);
  }

  /**
   * Create a new todo
   */
  create(data: CreateTodoInput): Todo {
    return todoStorage.create(data);
  }

  /**
   * Update an existing todo
   */
  update(id: string, updates: UpdateTodoInput): Todo | null {
    return todoStorage.update(id, updates);
  }

  /**
   * Delete a todo
   */
  delete(id: string): boolean {
    return todoStorage.delete(id);
  }

  /**
   * Check if a todo belongs to a specific user
   */
  belongsToUser(id: string, userId: string): boolean {
    return todoStorage.belongsToUser(id, userId);
  }
}

export const todoRepository = new TodoRepository();
