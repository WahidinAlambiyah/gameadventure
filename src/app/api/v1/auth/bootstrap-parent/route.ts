import { parentBootstrapSchema } from "@/features/parent/validation";
import { requireAuthentication } from "@/server/auth/session";
import { ok, fail } from "@/server/errors/api";
import { AuthorizationError, ValidationError } from "@/server/errors/errors";
import { bootstrapParentForUser } from "@/server/parent/onboarding";

export async function POST(request: Request) {
  try {
    const user = await requireAuthentication(request.headers);
    if (user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN")) {
      throw new AuthorizationError("Privileged users cannot be bootstrapped as parents.");
    }

    if (!user.roles.includes("PARENT") && user.roles.length > 0) {
      throw new AuthorizationError("A parent account is required.");
    }

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
