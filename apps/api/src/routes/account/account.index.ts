/**
 * Account routes index
 * Exports configured account routes
 */

import { db } from '@/api/clients/db';
import { UserRepository } from '@/api/repositories/users.repository';
import { UserService } from '@/api/services/user.service';
import { createAccountRoutes } from './account.routes';

// Initialize dependencies
const userRepo = new UserRepository(db);
const userService = new UserService({ userRepo });

// Create and export routes
const accountRoutes = createAccountRoutes(userService);

export default accountRoutes;
