import { NextResponse } from "next/server";
import { AppError, ParentGateLockedError } from "./errors";

type SuccessEnvelope<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

type ErrorEnvelope = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export function ok<T>(data: T, meta?: Record<string, unknown>, init?: ResponseInit) {
  const body: SuccessEnvelope<T> = { success: true, data, ...(meta ? { meta } : {}) };
  return NextResponse.json(body, init);
}

export function fail(error: unknown) {
  if (error instanceof AppError) {
    const response = NextResponse.json<ErrorEnvelope>(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message
        }
      },
      { status: error.status }
    );
    if (error instanceof ParentGateLockedError && error.retryAfterSeconds) {
      response.headers.set("Retry-After", String(error.retryAfterSeconds));
    }
    return response;
  }

  return NextResponse.json<ErrorEnvelope>(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred."
      }
    },
    { status: 500 }
  );
}

export function placeholder(message: string) {
  return ok(
    {
      status: "TODO",
      message
    },
    { implemented: false },
    { status: 501 }
  );
}
