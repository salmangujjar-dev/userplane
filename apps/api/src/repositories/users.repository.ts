/**
 * UserRepository - Data access layer for users
 * Handles all database operations for user entities
 */

import { eq } from '@workspace/db';
import type { DbClient } from '@workspace/db';
import { user } from '@workspace/db';

export class UserRepository {
  constructor(private db: DbClient) {}

  /**
   * Find user by ID
   */
  async findById(id: string) {
    const [foundUser] = await this.db.select().from(user).where(eq(user.id, id)).limit(1);

    return foundUser || null;
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string) {
    const [foundUser] = await this.db.select().from(user).where(eq(user.email, email)).limit(1);

    return foundUser || null;
  }

  /**
   * Update user name
   */
  async updateName(userId: string, name: string) {
    const [updated] = await this.db
      .update(user)
      .set({ name })
      .where(eq(user.id, userId))
      .returning();

    return updated || null;
  }
}
