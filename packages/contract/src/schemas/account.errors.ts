/**
 * Account errors
 * From UserService
 */
export const AccountErrors = {
  USER_NOT_FOUND: {
    message: 'User not found',
  },
  USER_NAME_REQUIRED: {
    message: 'Name cannot be empty',
  },
} as const;
