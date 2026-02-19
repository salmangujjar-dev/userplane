/**
 * UserService - Domain service for user operations
 * Contains business logic for user account management
 */

import { accountError } from '@workspace/contract';
import { randomBytes } from 'crypto';

import { auth } from '@/api/clients/auth';
import { UserRepository } from '@/api/repositories/users.repository';

export interface UserServiceDeps {
  userRepo: UserRepository;
}

export class UserService {
  constructor(private deps: UserServiceDeps) {}

  /**
   * Resolve an existing user by email, or create one if missing.
   */
  async getOrCreateUser(params: {
    email: string;
    name: string;
    headers: Headers;
  }): Promise<{ user: { id: string; name: string; email: string }; isNewUser: boolean }> {
    const existingUser = await this.findByEmail(params.email);
    if (existingUser) {
      return {
        user: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
        },
        isNewUser: false,
      };
    }

    const password = randomBytes(32).toString('hex');
    const createdUser = await this.createUser(
      { email: params.email, name: params.name, password, role: 'user' },
      params.headers
    );
    const userPayload = createdUser.user;

    return {
      user: {
        id: userPayload.id,
        name: userPayload.name,
        email: userPayload.email,
      },
      isNewUser: true,
    };
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    return this.deps.userRepo.findByEmail(email);
  }

  /**
   * Create user through auth admin API
   */
  async createUser(
    params: { email: string; name: string; password: string; role: 'user' | 'admin' },
    headers: Headers
  ) {
    return auth.api.createUser({
      body: params,
      headers,
    });
  }

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
