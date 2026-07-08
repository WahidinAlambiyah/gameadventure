import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { heartbeatGameSession } from "@/server/services/adventurePlay";

export async function POST(
  request: Request,
  context: { params: Promise<{ childId: string; sessionId: string }> }
) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);
    const { childId, sessionId } = await context.params;
    const heartbeat = await heartbeatGameSession(user.parentProfileId!, childId, sessionId);

    return ok({ heartbeat });
  } catch (error) {
    return fail(error);
  }
}
