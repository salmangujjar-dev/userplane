/**
 * Custom error classes for the application
 * Provides structured error handling with proper HTTP status codes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

export class GoneError extends AppError {
  constructor(message: string) {
    super(message, 410, 'GONE');
  }
}

export class ConfigurationError extends AppError {
  constructor(message: string) {
    super(message, 500, 'CONFIGURATION_ERROR');
  }
}

/**
 * Get HTTP status code from error
 * Returns specific status codes for known error types
 * Falls back to 500 for unknown errors
 */
export function getErrorStatusCode(error: unknown): 400 | 401 | 403 | 404 | 409 | 410 | 500 {
  if (error instanceof ValidationError) return 400;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ConflictError) return 409;
  if (error instanceof GoneError) return 410;
  if (error instanceof AppError) return 500;
  return 500;
}
