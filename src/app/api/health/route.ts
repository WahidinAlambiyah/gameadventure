import { ok } from "@/server/errors/api";

export function GET() {
  return ok({
    status: "ok",
    service: "bacangaji-adventure",
    timestamp: new Date().toISOString()
  });
}
