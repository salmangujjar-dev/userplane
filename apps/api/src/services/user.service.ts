/**
 * UserService - Domain service for user operations
 * Contains business logic for user management
 */

import { UserRepository } from '@/api/repositories/users.repository';
import { NotFoundError } from '@/api/lib/errors';

export interface UserServiceDeps {
  userRepo: UserRepository;
}

export class UserService {
  constructor(private deps: UserServiceDeps) {}

  /**
   * Get user by ID
   */
  async getById(id: string) {
    const user = await this.deps.userRepo.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string) {
    return this.deps.userRepo.findByEmail(email);
  }
}
