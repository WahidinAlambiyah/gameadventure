import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { requireParent } from "@/server/auth/session";
import { ValidationError } from "@/server/errors/errors";
import { findChildByIdAndParentId } from "@/server/repositories/childRepository";
import { verifyParentPin } from "@/server/parent-gate/pinService";
import { parentGateCookieName, parentGateCookieOptions } from "@/server/parent-gate/token";
import { safeReturnTo } from "@/server/utils/returnTo";

const verifyParentGateSchema = z
  .object({
    pin: z.string().regex(/^\d{4}$/),
    returnTo: z.string().optional(),
    childId: z.string().uuid().optional()
  })
  .strict();

export async function POST(request: Request) {
  try {
    const user = await requireParent(request.headers);
    const body = verifyParentGateSchema.safeParse(await request.json());
    if (!body.success) throw new ValidationError("Parent gate verification payload is invalid.");

    if (body.data.childId) {
      const child = await findChildByIdAndParentId(body.data.childId, user.parentProfileId!);
      if (!child) throw new ValidationError("Parent gate verification payload is invalid.");
    }

    const result = await verifyParentPin(user, body.data.pin);
    const response = ok({
      verified: true,
      returnTo: safeReturnTo(body.data.returnTo),
      gateExpiresInSeconds: 15 * 60
    });
    response.cookies.set(parentGateCookieName, result.token, parentGateCookieOptions());
    return response;
  } catch (error) {
    return fail(error);
  }
}
