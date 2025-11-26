/**
 * Legacy users service - kept for backward compatibility
 * Will be replaced by new user.service.ts for workspace provisioning
 */

import type { User } from '@/api/models/user';

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

const mockUsers: User[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
];

export class UserService {
  listUsers(): UserListResult {
    return {
      users: mockUsers,
      total: mockUsers.length,
    };
  }

  getUser(userId: number): User | null {
    return mockUsers.find((u) => u.id === userId) || null;
  }

  createUser(data: UserCreateData): User {
    const newUser: User = {
      id: mockUsers.length + 1,
      ...data,
    };
    mockUsers.push(newUser);
    return newUser;
  }

  updateUser(userId: number, data: UserUpdateData): User | null {
    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index === -1) return null;

    mockUsers[index] = {
      ...mockUsers[index],
      ...data,
    } as User;

    return mockUsers[index] || null;
  }

  deleteUser(userId: number): boolean {
    const index = mockUsers.findIndex((u) => u.id === userId);
    if (index === -1) return false;

    mockUsers.splice(index, 1);
    return true;
  }
}

export const userService = new UserService();
