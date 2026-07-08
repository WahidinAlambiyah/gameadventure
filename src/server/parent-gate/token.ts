import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

export const parentGateCookieName = "bacangaji_parent_gate";
export const parentGateMaxAgeSeconds = 15 * 60;

type ParentGatePayload = {
  version: 1;
  userId: string;
  parentProfileId: string;
  issuedAt: number;
  expiresAt: number;
  pinFingerprint: string;
};

type VerifyParentGateArgs = {
  token?: string;
  userId: string;
  parentProfileId: string;
  pinFingerprint: string;
  now?: Date;
};

const gateTokenSignatureDomain = "parent-gate:v1";
const pinFingerprintDomain = "parent-pin-fingerprint:v1";

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${gateTokenSignatureDomain}.${encodedPayload}`)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function parentPinFingerprint(pinHash: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(`${pinFingerprintDomain}.${pinHash}`)
    .digest("base64url");
}

export function createParentGateToken({
  userId,
  parentProfileId,
  pinFingerprint,
  now = new Date()
}: Omit<VerifyParentGateArgs, "token">) {
  const issuedAt = Math.floor(now.getTime() / 1000);
  const payload: ParentGatePayload = {
    version: 1,
    userId,
    parentProfileId,
    issuedAt,
    expiresAt: issuedAt + parentGateMaxAgeSeconds,
    pinFingerprint
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyParentGateToken({
  token,
  userId,
  parentProfileId,
  pinFingerprint,
  now = new Date()
}: VerifyParentGateArgs) {
  if (!token) return { valid: false as const };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false as const };

  const [encodedPayload, signature] = parts;
  if (!safeEqual(sign(encodedPayload), signature)) return { valid: false as const };

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ParentGatePayload;
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (payload.version !== 1) return { valid: false as const };
    if (payload.userId !== userId) return { valid: false as const };
    if (payload.parentProfileId !== parentProfileId) return { valid: false as const };
    if (payload.pinFingerprint !== pinFingerprint) return { valid: false as const };
    if (payload.expiresAt <= nowSeconds) return { valid: false as const };
    return { valid: true as const, expiresAt: new Date(payload.expiresAt * 1000) };
  } catch {
    return { valid: false as const };
  }
}

export function parentGateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: env.APP_ENV === "production",
    path: "/",
    maxAge: parentGateMaxAgeSeconds
  };
}

export function clearParentGateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: env.APP_ENV === "production",
    path: "/",
    maxAge: 0
  };
}
