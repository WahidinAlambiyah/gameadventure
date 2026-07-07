import { parentBootstrapSchema } from "@/features/parent/validation";
import { requireAuthentication } from "@/server/auth/session";
import { ok, fail } from "@/server/errors/api";
import { ValidationError } from "@/server/errors/errors";
import { bootstrapParentForUser } from "@/server/parent/onboarding";

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication(request.headers);
    const body = await request.json().catch(() => null);
    const parsed = parentBootstrapSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message);
    }

    const parentProfile = await bootstrapParentForUser({
      userId: user.id,
      displayName: parsed.data.displayName
    });

    return ok({
      parentProfile,
      rolesAssigned: ["PARENT"]
    });
  } catch (error) {
    return fail(error);
  }
}
