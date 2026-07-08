import { fail, ok } from "@/server/errors/api";
import { requireParent } from "@/server/auth/session";
import { clearParentGateCookieOptions, parentGateCookieName } from "@/server/parent-gate/token";
import { writeSecurityEvent } from "@/server/audit/events";

export async function DELETE(request: Request) {
  try {
    const user = await requireParent(request.headers);
    if (process.env["APP_ENV"] !== "test") {
      await writeSecurityEvent({
        actorUserId: user.id,
        parentProfileId: user.parentProfileId,
        eventType: "PARENT_GATE_CLEARED",
        metadata: { category: "manual_lock" }
      });
    }
    const response = ok({ cleared: true });
    response.cookies.set(parentGateCookieName, "", clearParentGateCookieOptions());
    return response;
  } catch (error) {
    return fail(error);
  }
}
