import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { requireParentGate } from "@/server/parent-gate/guard";
import { getChildProgressSummary } from "@/server/services/parentProgress";

export async function GET(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requireParentPermission("progress:read-own", request.headers);
    await requireParentGate(request.headers);
    const { childId } = await context.params;
    const progress = await getChildProgressSummary(user.parentProfileId!, childId);

    return ok({ childId, progress });
  } catch (error) {
    return fail(error);
  }
}
