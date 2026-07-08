import { fail, ok } from "@/server/errors/api";
import { requireParent } from "@/server/auth/session";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";
import { NotFoundError } from "@/server/errors/errors";
import { getParentSettingsSummary } from "@/server/parent/settings";

export async function GET(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requireParent(request.headers);
    const { childId } = await context.params;
    const child = await findChildByIdAndParentId(childId, user.parentProfileId!);
    if (!child) throw new NotFoundError();
    const settings = await getParentSettingsSummary(user.parentProfileId!);
    return ok({
      childId,
      playStatus: settings.usage
    });
  } catch (error) {
    return fail(error);
  }
}
