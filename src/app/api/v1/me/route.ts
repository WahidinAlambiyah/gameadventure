import { fail, ok } from "@/server/errors/api";
import { requireAuthentication } from "@/server/auth/session";

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication(request.headers);

    return ok({
      id: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      parentProfileId: user.parentProfileId
    });
  } catch (error) {
    return fail(error);
  }
}
