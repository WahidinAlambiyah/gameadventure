import { fail, ok } from "@/server/errors/api";
import { requireAuthentication } from "@/server/auth/session";
import { listChildrenByParentId } from "@/server/repositories/childRepository";

export async function GET(request: Request) {
  try {
    const user = await requireAuthentication(request.headers);
    const children = user.parentProfileId ? await listChildrenByParentId(user.parentProfileId) : [];

    return ok({
      id: user.id,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
      parentProfileId: user.parentProfileId,
      onboardingComplete: user.roles.includes("PARENT") && Boolean(user.parentProfileId),
      activeChildCount: children.length
    });
  } catch (error) {
    return fail(error);
  }
}
