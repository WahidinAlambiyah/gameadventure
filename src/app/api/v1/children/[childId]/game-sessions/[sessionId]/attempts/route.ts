import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { requireParentPermission } from "@/server/auth/session";
import { ValidationError } from "@/server/errors/errors";
import { recordQuestionAttempt } from "@/server/services/adventurePlay";

const recordQuestionAttemptSchema = z
  .object({
    questionId: z.string().min(1),
    selectedOptionId: z.string().min(1),
    clientSequence: z.number().int().positive()
  })
  .strict();

export async function POST(
  request: Request,
  context: { params: Promise<{ childId: string; sessionId: string }> }
) {
  try {
    const user = await requireParentPermission("child:read-own", request.headers);
    const { childId, sessionId } = await context.params;
    const body = await request.json().catch(() => null);
    const parsed = recordQuestionAttemptSchema.safeParse(body);

    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0]?.message);
    }

    const attempt = await recordQuestionAttempt(
      user.parentProfileId!,
      childId,
      sessionId,
      parsed.data
    );
    return ok({ attempt });
  } catch (error) {
    return fail(error);
  }
}
