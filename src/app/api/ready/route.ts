import { prisma } from "@/server/database/prisma";
import { fail, ok } from "@/server/errors/api";
import { InfrastructureError } from "@/server/errors/errors";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return ok({
      status: "ready"
    });
  } catch {
    return fail(new InfrastructureError("Database readiness check failed."));
  }
}
