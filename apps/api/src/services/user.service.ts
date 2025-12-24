/**
 * UserService - Domain service for user operations
 * Contains business logic for user account management
 */

import { ORPCError } from '@orpc/server';
import { UserRepository } from '@/api/repositories/users.repository';

export interface UserServiceDeps {
  userRepo: UserRepository;
}

export class UserService {
  constructor(private deps: UserServiceDeps) {}

  /**
   * Get user by ID
   * Throws ORPCError with USER_NOT_FOUND if user doesn't exist
   */
  async getById(userId: string) {
    const user = await this.deps.userRepo.findById(userId);
    if (!user) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }
    return user;
  }

  /**
   * Update user name
   * Throws ORPCError with USER_NAME_REQUIRED if name is invalid
   * Throws ORPCError with USER_NOT_FOUND if user doesn't exist
   */
  async updateName(userId: string, name: string) {
    if (!name || name.trim().length === 0) {
      throw new ORPCError('USER_NAME_REQUIRED', {
        status: 400,
        message: 'Name cannot be empty',
      });
    }

    const user = await this.deps.userRepo.updateName(userId, name.trim());
    if (!user) {
      throw new ORPCError('USER_NOT_FOUND', {
        status: 404,
        message: 'User not found',
      });
    }

    return user;
  }
}
