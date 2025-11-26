/**
 * User domain model
 * Core entity representing a user
 */
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Input type for creating a new user
 */
export interface CreateUserInput {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Input type for updating an existing user
 */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}
