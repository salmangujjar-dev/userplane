/**
 * Todo domain model
 * Core entity representing a todo item
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

/**
 * Input type for creating a new todo
 */
export interface CreateTodoInput {
  title: string;
  description?: string;
  userId: string;
}

/**
 * Input type for updating an existing todo
 */
export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
}
