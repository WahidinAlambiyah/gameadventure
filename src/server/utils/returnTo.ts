export function safeReturnTo(value: unknown, fallback = "/parent") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    decoded.includes("://") ||
    decoded.toLowerCase().startsWith("/javascript:") ||
    decoded.toLowerCase().startsWith("/data:")
  ) {
    return fallback;
  }
  return value;
}
