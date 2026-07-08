export function safeReturnTo(value: unknown, fallback = "/parent") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (value.includes("\\") || value.includes("://")) return fallback;
  return value;
}
