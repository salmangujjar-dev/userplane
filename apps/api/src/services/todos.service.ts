import { todoRepository } from '@/api/repositories/todos.repository';
import type { Todo } from '@/api/models/todo';

/**
 * Service layer for todos
 * Contains business logic, authorization, and orchestration
 * Sits between handlers and repositories
 */

export interface TodoListResult {
  todos: Todo[];
  total: number;
}

export interface TodoCreateData {
  title: string;
  description?: string;
}

export interface TodoUpdateData {
  title?: string;
  description?: string;
  completed?: boolean;
}

export class TodoService {
  /**
   * Get all todos for a specific user
   */
  listUserTodos(userId: string): TodoListResult {
    const todos = todoRepository.findByUserId(userId);
    return {
      todos,
      total: todos.length,
    };
  }

  /**
   * Get a single todo by ID
   * Validates that the todo belongs to the specified user
   */
  getUserTodo(todoId: string, userId: string): Todo | null {
    const todo = todoRepository.findById(todoId);

    if (!todo) {
      return null;
    }

    // Authorization: Ensure todo belongs to the user
    if (todo.userId !== userId) {
      return null;
    }

    return todo;
  }

  /**
   * Create a new todo for a user
   */
  createTodo(data: TodoCreateData, userId: string): Todo {
    return todoRepository.create({
      title: data.title,
      description: data.description,
      userId,
    });
  }

  /**
   * Update a todo
   * Validates that the todo exists and belongs to the specified user
   */
  updateTodo(todoId: string, data: TodoUpdateData, userId: string): Todo | null {
    const existingTodo = todoRepository.findById(todoId);

    if (!existingTodo) {
      return null;
    }

    // Authorization: Ensure todo belongs to the user
    if (existingTodo.userId !== userId) {
      return null;
    }

    return todoRepository.update(todoId, data);
  }

  /**
   * Delete a todo
   * Validates that the todo exists and belongs to the specified user
   */
  deleteTodo(todoId: string, userId: string): boolean {
    const todo = todoRepository.findById(todoId);

    if (!todo) {
      return false;
    }

    // Authorization: Ensure todo belongs to the user
    if (todo.userId !== userId) {
      return false;
    }

    return todoRepository.delete(todoId);
  }
}

export const todoService = new TodoService();
