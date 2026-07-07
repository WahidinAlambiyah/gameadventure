import { fail, ok } from "@/server/errors/api";
import { requirePermission } from "@/server/auth/session";
import { initialRoles } from "@/server/authorization/permissions";

export async function GET(request: Request) {
  try {
    await requirePermission("role:read", request.headers);

    return ok({
      roles: initialRoles
    });
  } catch (error) {
    return fail(error);
  }
}
