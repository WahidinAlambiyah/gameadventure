import { describe, expect, it } from "vitest";
import {
  createParentGateToken,
  parentGateCookieOptions,
  parentGateMaxAgeSeconds,
  verifyParentGateToken
} from "@/server/parent-gate/token";

const issuedAt = new Date("2026-07-08T00:00:00.000Z");
const pinUpdatedAt = new Date("2026-07-07T12:00:00.000Z");

describe("parent gate token", () => {
  it("validates a signed token for the same user, parent, and PIN version", () => {
    const token = createParentGateToken({
      userId: "user-1",
      parentProfileId: "parent-1",
      pinUpdatedAt,
      now: issuedAt
    });

    const result = verifyParentGateToken({
      token,
      userId: "user-1",
      parentProfileId: "parent-1",
      pinUpdatedAt,
      now: new Date("2026-07-08T00:10:00.000Z")
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expiresAt.toISOString()).toBe("2026-07-08T00:15:00.000Z");
    }
  });

  it("rejects tampered, expired, cross-user, cross-parent, and stale-PIN tokens", () => {
    const token = createParentGateToken({
      userId: "user-1",
      parentProfileId: "parent-1",
      pinUpdatedAt,
      now: issuedAt
    });
    const [payload, signature] = token.split(".");

    const baseArgs = {
      token,
      userId: "user-1",
      parentProfileId: "parent-1",
      pinUpdatedAt
    };

    expect(verifyParentGateToken({ ...baseArgs, token: `${payload}.${signature}a` }).valid).toBe(
      false
    );
    expect(
      verifyParentGateToken({
        ...baseArgs,
        now: new Date("2026-07-08T00:15:01.000Z")
      }).valid
    ).toBe(false);
    expect(verifyParentGateToken({ ...baseArgs, userId: "user-2" }).valid).toBe(false);
    expect(verifyParentGateToken({ ...baseArgs, parentProfileId: "parent-2" }).valid).toBe(false);
    expect(
      verifyParentGateToken({
        ...baseArgs,
        pinUpdatedAt: new Date("2026-07-08T00:00:00.000Z")
      }).valid
    ).toBe(false);
  });

  it("uses httpOnly strict cookies with a fifteen-minute max age", () => {
    expect(parentGateCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: parentGateMaxAgeSeconds
    });
  });
});
