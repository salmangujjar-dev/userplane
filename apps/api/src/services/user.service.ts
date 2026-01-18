/**
 * UserService - Domain service for user operations
 * Contains business logic for user account management
 */

import { accountError } from '@workspace/contract';

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
      throw accountError.USER_NOT_FOUND();
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
      throw accountError.USER_NAME_REQUIRED();
    }

    const user = await this.deps.userRepo.updateName(userId, name.trim());
    if (!user) {
      throw accountError.USER_NOT_FOUND();
    }

    return user;
  }
}
