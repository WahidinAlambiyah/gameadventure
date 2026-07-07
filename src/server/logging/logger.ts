import { env } from "@/config/env";

const sensitiveKeys = ["password", "pin", "token", "cookie", "authorization", "secret", "key"];

type LogLevel = "debug" | "info" | "warn" | "error";

function redact(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        return [key, "[REDACTED]"];
      }
      return [key, typeof entry === "object" ? redact(entry) : entry];
    })
  );
}

function shouldLog(level: LogLevel) {
  const order: Record<typeof env.LOG_LEVEL, number> = {
    silent: 99,
    debug: 10,
    info: 20,
    warn: 30,
    error: 40
  };

  return order[level] >= order[env.LOG_LEVEL];
}

function logContext(context?: Record<string, unknown>) {
  return (redact(context ?? {}) ?? {}) as Record<string, unknown>;
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    if (shouldLog("debug"))
      console.debug(JSON.stringify({ level: "debug", message, ...logContext(context) }));
  },
  info(message: string, context?: Record<string, unknown>) {
    if (shouldLog("info"))
      console.info(JSON.stringify({ level: "info", message, ...logContext(context) }));
  },
  warn(message: string, context?: Record<string, unknown>) {
    if (shouldLog("warn"))
      console.warn(JSON.stringify({ level: "warn", message, ...logContext(context) }));
  },
  error(message: string, context?: Record<string, unknown>) {
    if (shouldLog("error"))
      console.error(JSON.stringify({ level: "error", message, ...logContext(context) }));
  }
};
