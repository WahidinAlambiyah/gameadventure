import { updateChildProfileSchema } from "@/features/parent/validation";
import { fail, ok } from "@/server/errors/api";
import { requirePermission } from "@/server/auth/session";
import { NotFoundError, ValidationError } from "@/server/errors/errors";
import {
  findChildByIdAndParentId,
  softDeleteChildForParent,
  updateChildForParent
} from "@/server/repositories/childRepository";
import { requireParentGate } from "@/server/parent-gate/guard";

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

export async function PATCH(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requirePermission("child:update-own", request.headers);
    await requireParentGate(request.headers);
    if (!user.parentProfileId) throw new NotFoundError();
    const body = await request.json().catch(() => null);
    const parsed = updateChildProfileSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.issues[0]?.message);
    const { childId } = await context.params;
    const child = await updateChildForParent(user.id, user.parentProfileId, childId, parsed.data);
    return ok({ child });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requirePermission("child:delete-own", request.headers);
    await requireParentGate(request.headers);
    if (!user.parentProfileId) throw new NotFoundError();
    const { childId } = await context.params;
    await softDeleteChildForParent(user.id, user.parentProfileId, childId);
    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
