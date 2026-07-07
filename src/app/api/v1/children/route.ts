import { createChildProfileSchema } from "@/features/parent/validation";
import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import {
  createChildForParent,
  listChildrenByParentId
} from "@/server/repositories/childRepository";
import { ValidationError } from "@/server/errors/errors";

export async function GET(request: Request) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);

    const children = await listChildrenByParentId(user.parentProfileId!);
    return ok({ children });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireParentPermission("child:create", request.headers);
    const body = await request.json().catch(() => null);
    const parsed = createChildProfileSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message);
    }

    const child = await createChildForParent(user.parentProfileId!, parsed.data);
    return ok({ child }, undefined, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
