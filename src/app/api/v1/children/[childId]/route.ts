import { fail, ok, placeholder } from "@/server/errors/api";
import { requirePermission } from "@/server/auth/session";
import { NotFoundError } from "@/server/errors/errors";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";

export async function GET(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requirePermission("child:read-own", request.headers);
    const { childId } = await context.params;

    if (!user.parentProfileId) throw new NotFoundError();

    const child = await findChildByIdAndParentId(childId, user.parentProfileId);
    if (!child) throw new NotFoundError();

    return ok({ child });
  } catch (error) {
    return fail(error);
  }
}

export function PATCH() {
  return placeholder(
    "Update an ownership-scoped child profile with child-data minimization rules."
  );
}

export function DELETE() {
  return placeholder("Soft-delete an ownership-scoped child profile and preserve audit history.");
}
