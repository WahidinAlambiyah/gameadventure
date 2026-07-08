import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { getAdventureMapForChild } from "@/server/services/adventurePlay";

export async function GET(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);
    const { childId } = await context.params;
    const tracks = await getAdventureMapForChild(user.parentProfileId!, childId);

    return ok({ childId, tracks });
  } catch (error) {
    return fail(error);
  }
}
