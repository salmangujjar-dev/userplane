/**
 * Password utilities
 * Provides password generation functionality for admin operations
 */

import { randomInt } from 'crypto';

/**
 * Generate a cryptographically secure random password
 * Used for admin-created accounts where users can reset via magic link
 *
 * @param length - Length of the password (default: 32)
 * @returns A random alphanumeric password
 */
export function generateRandomPassword(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomInt(0, charset.length)];
  }

  return password;
}
