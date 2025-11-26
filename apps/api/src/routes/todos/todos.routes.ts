import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';
import { notFoundSchema, errorSchema } from '../../constants/api';

// Custom ID params schema for string IDs
const IdParamsSchema = z.object({
  id: z.string().min(1),
});

const tags = ['Todos'];

// Schemas
const TodoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  completed: z.boolean(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

const UpdateTodoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
});

export const list = createRoute({
  path: '/todos',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        todos: z.array(TodoSchema),
        total: z.number(),
      }),
      'The list of todos for the authenticated user'
    ),
  },
});

export const create = createRoute({
  path: '/todos',
  method: 'post',
  request: {
    body: jsonContentRequired(CreateTodoSchema, 'The todo to create'),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(
      z.object({
        message: z.string(),
        todo: TodoSchema,
      }),
      'The created todo'
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'The validation error(s)'),
  },
});

export const getOne = createRoute({
  path: '/todos/{id}',
  method: 'get',
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ todo: TodoSchema }), 'The requested todo'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Todo not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'Invalid id error'),
  },
});

export const update = createRoute({
  path: '/todos/{id}',
  method: 'patch',
  request: {
    params: IdParamsSchema,
    body: jsonContentRequired(UpdateTodoSchema, 'The todo updates'),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        message: z.string(),
        todo: TodoSchema,
      }),
      'The updated todo'
    ),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Todo not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'The validation error(s)'),
  },
});

export const remove = createRoute({
  path: '/todos/{id}',
  method: 'delete',
  request: {
    params: IdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(z.object({ message: z.string() }), 'Todo deleted'),
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Todo not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(errorSchema, 'Invalid id error'),
  },
});

export type ListRoute = typeof list;
export type CreateRoute = typeof create;
export type GetOneRoute = typeof getOne;
export type UpdateRoute = typeof update;
export type RemoveRoute = typeof remove;
