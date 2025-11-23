import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import { notFoundSchema, errorSchema } from '../../lib/constants';

// Custom ID params schema for string IDs
const IdParamsSchema = z.object({
  id: z.string().min(1),
});

const tags = ['Users'];

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

export const list = createRoute({
  path: '/users',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        users: z.array(UserSchema),
        total: z.number(),
      }),
      'The list of users'
    ),
  },
});

export const create = createRoute({
  path: '/users',
  method: 'post',
  request: {
    body: jsonContentRequired(CreateUserSchema, 'The user to create'),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        user: UserSchema,
      }),
      'The created user'
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'The validation error(s)'),
  },
});

export const getOne = createRoute({
  path: '/users/{id}',
  method: 'get',
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ user: UserSchema }), 'The requested user'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'Invalid id error'),
  },
});

export const update = createRoute({
  path: '/users/{id}',
  method: 'put',
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(UpdateUserSchema, 'The user updates'),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        user: UserSchema,
      }),
      'The updated user'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'The validation error(s)'),
  },
});

export const remove = createRoute({
  path: '/users/{id}',
  method: 'delete',
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ message: z.string() }), 'User deleted'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'User not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'Invalid id error'),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
