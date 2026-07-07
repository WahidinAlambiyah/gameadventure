export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DOMAIN_ERROR"
  | "INFRASTRUCTURE_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 500
  ) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is invalid.") {
    super("VALIDATION_ERROR", message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = "Authentication is required.") {
    super("UNAUTHENTICATED", message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message = "You are not allowed to perform this action.") {
    super("FORBIDDEN", message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super("NOT_FOUND", message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = "The request conflicts with the current state.") {
    super("CONFLICT", message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many requests.") {
    super("RATE_LIMITED", message, 429);
  }
}

export class DomainError extends AppError {
  constructor(message = "The requested action is not allowed.") {
    super("DOMAIN_ERROR", message, 422);
  }
}

export class InfrastructureError extends AppError {
  constructor(message = "The service is temporarily unavailable.") {
    super("INFRASTRUCTURE_ERROR", message, 503);
  }
}
