import { userService } from '@/api/services';
import { createAccountRoutes } from './account.routes';

const accountRoutes = createAccountRoutes(userService);

export default accountRoutes;
