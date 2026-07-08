import { z } from "zod";
import { fail, ok } from "@/server/errors/api";
import { requireParent } from "@/server/auth/session";
import { changeParentPin, setInitialParentPin } from "@/server/parent-gate/pinService";
import { parentGateCookieName, parentGateCookieOptions } from "@/server/parent-gate/token";
import { ValidationError } from "@/server/errors/errors";

const setPinSchema = z
  .object({
    pin: z.string().regex(/^\d{4}$/),
    confirmPin: z.string().regex(/^\d{4}$/)
  })
  .strict();

const changePinSchema = z
  .object({
    currentPin: z.string().regex(/^\d{4}$/),
    pin: z.string().regex(/^\d{4}$/),
    confirmPin: z.string().regex(/^\d{4}$/)
  })
  .strict();

export async function PUT(request: Request) {
  try {
    const user = await requireParent(request.headers);
    const body = await request.json().catch(() => null);
    const isChange = body && typeof body === "object" && "currentPin" in body;
    const result = await (isChange
      ? (() => {
          const parsed = changePinSchema.safeParse(body);
          if (!parsed.success) throw new ValidationError("PIN payload is invalid.");
          return changeParentPin(
            user,
            parsed.data.currentPin,
            parsed.data.pin,
            parsed.data.confirmPin
          );
        })()
      : (() => {
          const parsed = setPinSchema.safeParse(body);
          if (!parsed.success) throw new ValidationError("PIN payload is invalid.");
          return setInitialParentPin(user, parsed.data.pin, parsed.data.confirmPin);
        })());

    const response = ok({
      pinConfigured: result.status.pinConfigured,
      locked: result.status.locked,
      lastPinVerifiedAt: result.status.lastPinVerifiedAt
    });
    response.cookies.set(parentGateCookieName, result.token, parentGateCookieOptions());
    return response;
  } catch (error) {
    return fail(error);
  }
}
