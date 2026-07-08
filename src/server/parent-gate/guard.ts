import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireParent, type CurrentUser } from "@/server/auth/session";
import { getParentSecurityStatus } from "@/server/parent-gate/pinService";
import { parentGateCookieName, verifyParentGateToken } from "@/server/parent-gate/token";
import { ParentGateRequiredError } from "@/server/errors/errors";

export function parentGateTokenFromHeaders(requestHeaders?: Headers) {
  return requestHeaders
    ?.get("cookie")
    ?.match(new RegExp(`(?:^|;\\s*)${parentGateCookieName}=([^;]+)`))?.[1];
}

export async function getParentGateState(user: CurrentUser, token?: string) {
  if (!user.parentProfileId) return { configured: false, verified: false as const };
  const status = await getParentSecurityStatus(user.parentProfileId);
  if (!status.pinConfigured) {
    return { configured: false, verified: false as const, status };
  }
  const result = verifyParentGateToken({
    token,
    userId: user.id,
    parentProfileId: user.parentProfileId,
    pinUpdatedAt: status.pinUpdatedAt
  });
  return {
    configured: true,
    verified: result.valid,
    gateExpiresAt: result.valid ? result.expiresAt : null,
    status
  };
}

export async function requireParentGate(requestHeaders?: Headers) {
  const user = await requireParent(requestHeaders);
  const token = parentGateTokenFromHeaders(requestHeaders);
  const state = await getParentGateState(user, token);
  if (!state.configured || !state.verified) throw new ParentGateRequiredError();
  return { user, state };
}

export async function requireParentGatePage(returnTo?: string) {
  const user = await requireParent();
  const cookieStore = await cookies();
  const state = await getParentGateState(user, cookieStore.get(parentGateCookieName)?.value);
  const target = encodeURIComponent(returnTo ?? "/parent");
  if (!state.configured) redirect("/parent/security/set-parent-pin");
  if (!state.verified) redirect(`/parent/security/verify-parent-pin?returnTo=${target}`);
  return { user, state };
}
