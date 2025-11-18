import { Hono } from 'hono';

const users = new Hono();

// Sample data
const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' },
];

// Get all users
users.get('/', (c) => {
  return c.json({
    users: mockUsers,
    total: mockUsers.length,
  });
});

// Get user by ID
users.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  return c.json({ user });
});

// Create user
users.post('/', async (c) => {
  try {
    const body = await c.req.json();
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
  } catch (error) {
    return c.json(
      {
        error: 'Invalid request body',
      },
      400
    );
  }
});

// Update user
users.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  try {
    const body = await c.req.json();
    const updatedUser = { ...user, ...body, id };

    return c.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    return c.json(
      {
        error: 'Invalid request body',
      },
      400
    );
  }
});

// Delete user
users.delete('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const user = mockUsers.find((u) => u.id === id);

  if (!user) {
    return c.json(
      {
        error: 'User not found',
      },
      404
    );
  }

  return c.json({
    message: 'User deleted successfully',
  });
});

export default users;
