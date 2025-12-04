/**
 * UserService - Domain service for user operations
 * Contains business logic for user account management
 */

import { UserRepository } from '@/api/repositories/users.repository';
import { ValidationError, NotFoundError } from '@/api/lib/errors';

export interface UserServiceDeps {
  userRepo: UserRepository;
}

export class UserService {
  constructor(private deps: UserServiceDeps) {}

  /**
   * Get user by ID
   */
  async getById(userId: string) {
    const user = await this.deps.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Update user name
   */
  async updateName(userId: string, name: string) {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Name cannot be empty');
    }

    const user = await this.deps.userRepo.updateName(userId, name.trim());
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
