export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "PARENT_GATE_REQUIRED"
  | "PARENT_GATE_INVALID"
  | "PARENT_GATE_LOCKED"
  | "PIN_ALREADY_CONFIGURED"
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
    super("VALIDATION_ERROR", message, 422);
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

export class ParentGateRequiredError extends AppError {
  constructor(message = "Parent gate verification is required.") {
    super("PARENT_GATE_REQUIRED", message, 403);
  }
}

export class ParentGateInvalidError extends AppError {
  constructor(message = "Parent gate verification failed.") {
    super("PARENT_GATE_INVALID", message, 403);
  }
}

export class ParentGateLockedError extends AppError {
  constructor(
    message = "Parent gate is temporarily locked.",
    public readonly retryAfterSeconds?: number
  ) {
    super("PARENT_GATE_LOCKED", message, 429);
  }
}

export class PinAlreadyConfiguredError extends AppError {
  constructor(message = "A parent PIN is already configured.") {
    super("PIN_ALREADY_CONFIGURED", message, 409);
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
