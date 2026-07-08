import { fail, ok } from "@/server/errors/api";
import { requireParent } from "@/server/auth/session";
import { getParentSecurityStatus } from "@/server/parent-gate/pinService";
import { getParentGateState, parentGateTokenFromHeaders } from "@/server/parent-gate/guard";

export async function GET(request: Request) {
  try {
    const user = await requireParent(request.headers);
    const status = await getParentSecurityStatus(user.parentProfileId!);
    const gate = await getParentGateState(user, parentGateTokenFromHeaders(request.headers));

    return ok({
      pinConfigured: status.pinConfigured,
      failedPinAttempts: status.pinConfigured ? status.failedPinAttempts : undefined,
      locked: status.locked,
      lockedUntil: status.lockedUntil,
      lastPinVerifiedAt: status.lastPinVerifiedAt,
      gateVerified: gate.verified,
      gateExpiresAt: gate.gateExpiresAt
    });
  } catch (error) {
    return fail(error);
  }
}
