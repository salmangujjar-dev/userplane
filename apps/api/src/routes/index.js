/**
 * Routes index - exports typed router for RPC client
 */
import { Hono } from 'hono';
import users from './users';
import authTest from './auth-test';
/**
 * Standalone router for RPC client type inference
 * This is separate from the main app to provide clean types
 */
export const router = new Hono().route('/users', users).route('/auth-test', authTest);
