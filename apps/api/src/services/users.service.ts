import { userRepository } from '@/api/repositories/users.repository';
import type { User } from '@/api/models/user';

/**
 * Service layer for users
 * Contains business logic, validation, and orchestration
 * Sits between handlers and repositories
 */

export interface UserListResult {
  users: User[];
  total: number;
}

export interface UserCreateData {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface UserUpdateData {
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export class UserService {
  /**
   * Get all users
   */
  listUsers(): UserListResult {
    const users = userRepository.findAll();
    return {
      users,
      total: users.length,
    };
  }

  /**
   * Get a single user by ID
   */
  getUser(userId: number): User | null {
    const user = userRepository.findById(userId);
    return user || null;
  }

  /**
   * Create a new user
   */
  createUser(data: UserCreateData): User {
    return userRepository.create(data);
  }

  /**
   * Update a user
   */
  updateUser(userId: number, data: UserUpdateData): User | null {
    return userRepository.update(userId, data);
  }

  /**
   * Delete a user
   */
  deleteUser(userId: number): boolean {
    return userRepository.delete(userId);
  }
}

export const userService = new UserService();
