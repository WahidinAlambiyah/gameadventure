import { describe, expect, it, vi } from "vitest";
import {
  clearParentGateCookieOptions,
  createParentGateToken,
  parentGateCookieOptions,
  parentGateMaxAgeSeconds,
  parentPinFingerprint,
  verifyParentGateToken
} from "@/server/parent-gate/token";

const issuedAt = new Date("2026-07-08T00:00:00.000Z");
const pinFingerprint = parentPinFingerprint("$argon2id$v=19$m=1,t=1,p=1$abc$hash");

describe("parent gate token", () => {
  it("validates a signed token for the same user, parent, and PIN version", () => {
    const token = createParentGateToken({
      userId: "user-1",
      parentProfileId: "parent-1",
      pinFingerprint,
      now: issuedAt
    });

    const result = verifyParentGateToken({
      token,
      userId: "user-1",
      parentProfileId: "parent-1",
      pinFingerprint,
      now: new Date("2026-07-08T00:10:00.000Z")
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.expiresAt.toISOString()).toBe("2026-07-08T00:15:00.000Z");
    }
  });

  it("rejects malformed tokens without throwing", () => {
    const baseArgs = {
      userId: "user-1",
      parentProfileId: "parent-1",
      pinFingerprint
    };

    expect(verifyParentGateToken({ ...baseArgs, token: "not-a-token" }).valid).toBe(false);
    expect(verifyParentGateToken({ ...baseArgs, token: "!!!!.short" }).valid).toBe(false);
    expect(verifyParentGateToken({ ...baseArgs, token: "payload." }).valid).toBe(false);
    expect(verifyParentGateToken({ ...baseArgs, token: "payload.signature.extra" }).valid).toBe(
      false
    );
    expect(
      verifyParentGateToken({
        ...baseArgs,
        token: `payload.${"a".repeat(200)}`
      }).valid
    ).toBe(false);
  });

  it("rejects tampered, expired, cross-user, cross-parent, and stale-PIN tokens", () => {
    const token = createParentGateToken({
      userId: "user-1",
      parentProfileId: "parent-1",
      pinFingerprint,
      now: issuedAt
    });
    const [payload, signature] = token.split(".");

    const baseArgs = {
      token,
      userId: "user-1",
      parentProfileId: "parent-1",
      pinFingerprint
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
        pinFingerprint: parentPinFingerprint("$argon2id$v=19$m=1,t=1,p=1$abc$different")
      }).valid
    ).toBe(false);
  });

  it("derives a fixed-length PIN fingerprint without exposing raw pinHash", () => {
    const pinHash = "$argon2id$v=19$m=1,t=1,p=1$salt$sensitive-pin-hash";
    const fingerprint = parentPinFingerprint(pinHash);

    expect(fingerprint).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(fingerprint).not.toContain(pinHash);
    expect(parentPinFingerprint(pinHash)).toBe(fingerprint);
    expect(parentPinFingerprint(`${pinHash}-changed`)).not.toBe(fingerprint);
  });

  it("uses httpOnly strict cookies with a fifteen-minute max age", () => {
    expect(parentGateCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: parentGateMaxAgeSeconds
    });
  });

  it("uses matching clear-cookie options", () => {
    expect(clearParentGateCookieOptions()).toMatchObject({
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0
    });
  });

  it("sets secure cookies in production", async () => {
    vi.resetModules();
    vi.stubEnv("APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.example.test");
    vi.stubEnv("BETTER_AUTH_URL", "https://app.example.test");
    vi.stubEnv("BETTER_AUTH_SECRET", "production-secret-that-is-long-enough");
    vi.stubEnv("DATABASE_URL", "postgresql://user:pass@db.example.test:5432/app");
    vi.stubEnv("DIRECT_URL", "postgresql://user:pass@db.example.test:5432/app");

    const tokenModule = await import("@/server/parent-gate/token");

    expect(tokenModule.parentGateCookieOptions().secure).toBe(true);
    expect(tokenModule.clearParentGateCookieOptions().secure).toBe(true);
    vi.unstubAllEnvs();
  });
});
