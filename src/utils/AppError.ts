export class AppError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class ConflictError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} already exists`, 409);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = `You don't have permission to access this resource.`) {
    super(message, 403);
  }
}

export class GoneError extends AppError {
  constructor(resource = "Resource") {
    super(`This ${resource} no longer exists`, 410);
  }
}
