import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { ValidationError } from "@/server/errors/errors";
import { startGameSession } from "@/server/services/adventurePlay";

const startGameSessionSchema = z
  .object({
    levelId: z.uuid()
  })
  .strict();

export async function POST(request: Request, context: { params: Promise<{ childId: string }> }) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);
    const { childId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = startGameSessionSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message);
    }

    const session = await startGameSession(user.parentProfileId!, childId, parsed.data.levelId);
    return ok({ session }, undefined, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
