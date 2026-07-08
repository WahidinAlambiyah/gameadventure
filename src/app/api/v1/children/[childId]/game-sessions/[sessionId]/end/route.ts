import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { endGameSession } from "@/server/services/adventurePlay";

export async function POST(
  request: Request,
  context: { params: Promise<{ childId: string; sessionId: string }> }
) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);
    const { childId, sessionId } = await context.params;
    const session = await endGameSession(user.parentProfileId!, childId, sessionId);

    return ok({ session });
  } catch (error) {
    return fail(error);
  }
}
