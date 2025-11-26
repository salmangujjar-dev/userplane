import type { User, CreateUserInput, UpdateUserInput } from '@/api/models/user';

/**
 * Repository layer for users
 * Handles data access operations for user entities
 * No business logic or authorization checks should be here
 */

// In-memory mock data
// In production, this would be replaced with actual database queries
const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
];

export class UserRepository {
  /**
   * Find all users
   */
  findAll(): User[] {
    return mockUsers;
  }

  /**
   * Find a single user by ID
   */
  findById(id: number): User | undefined {
    return mockUsers.find((u) => u.id === id);
  }

  /**
   * Create a new user
   */
  create(data: CreateUserInput): User {
    const newUser: User = {
      id: mockUsers.length + 1,
      ...data,
    };
    mockUsers.push(newUser);
    return newUser;
  }

  /**
   * Update an existing user
   */
  update(id: number, updates: UpdateUserInput): User | null {
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) return null;

    const existingUser = mockUsers[index];
    if (!existingUser) return null;

    mockUsers[index] = {
      ...existingUser,
      ...updates,
    };

    return mockUsers[index] || null;
  }

  /**
   * Delete a user
   */
  delete(id: number): boolean {
    const index = mockUsers.findIndex((u) => u.id === id);
    if (index === -1) return false;

    mockUsers.splice(index, 1);
    return true;
  }
}

export const userRepository = new UserRepository();
