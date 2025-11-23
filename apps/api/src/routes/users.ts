import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const users = new Hono();

// Sample data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
];

// Schemas
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'user']),
});

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'user']).default('user'),
});

const UpdateUserSchema = CreateUserSchema.partial();

const IdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

// Get all users
users.get('/', (c) => {
  return c.json(
    {
      users: mockUsers,
      total: mockUsers.length,
    },
    200
  );
});

// Get user by ID
users.get('/:id', zValidator('param', IdParamSchema), (c) => {
  const { id: idStr } = c.req.valid('param');
  const id = parseInt(idStr);
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  return c.json({ user }, 200);
});

// Create user
users.post('/', zValidator('json', CreateUserSchema), (c) => {
  const body = c.req.valid('json');
  const newUser = {
    id: mockUsers.length + 1,
    ...body,
  };

  return c.json(
    {
      message: 'User created successfully',
      user: newUser,
    },
    201
  );
});

// Update user
users.put('/:id', zValidator('param', IdParamSchema), zValidator('json', UpdateUserSchema), (c) => {
  const { id: idStr } = c.req.valid('param');
  const id = parseInt(idStr);
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  const body = c.req.valid('json');
  const updatedUser = { ...user, ...body, id };

  return c.json(
    {
      message: 'User updated successfully',
      user: updatedUser,
    },
    200
  );
});

// Delete user
users.delete('/:id', zValidator('param', IdParamSchema), (c) => {
  const { id: idStr } = c.req.valid('param');
  const id = parseInt(idStr);
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  return c.json(
    {
      message: 'User deleted successfully',
    },
    200
  );
});

export default users;
