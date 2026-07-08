import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import type { CurrentUser } from "@/server/auth/session";
import { hashParentPin, verifySecret, assertFourDigitPin } from "@/server/security/password";
import {
  ParentGateInvalidError,
  ParentGateLockedError,
  PinAlreadyConfiguredError,
  ValidationError
} from "@/server/errors/errors";
import { createParentGateToken, parentPinFingerprint } from "@/server/parent-gate/token";
import { writeAuditEvent, writeSecurityEvent } from "@/server/audit/events";

const maxFailedPinAttempts = 5;
const lockoutSeconds = 15 * 60;
type PinVerifier = typeof verifySecret;
type ParentGateDbClient = Pick<typeof prisma, "$transaction" | "parentSecuritySetting">;
type PinServiceOptions = {
  db?: ParentGateDbClient;
  verifyPinHash?: PinVerifier;
};

type ParentSecurityStatus = {
  pinConfigured: boolean;
  failedPinAttempts?: number;
  locked: boolean;
  lockedUntil: Date | null;
  lastPinVerifiedAt: Date | null;
  pinFingerprint: string | null;
};

type TestParentPinSetting = {
  pinHash: string | null;
  failedPinAttempts: number;
  pinLockedUntil: Date | null;
  lastPinVerifiedAt: Date | null;
  updatedAt: Date;
};

const globalForParentPinTests = globalThis as unknown as {
  __bacangajiTestParentPins?: Map<string, TestParentPinSetting>;
};

const testPins =
  globalForParentPinTests.__bacangajiTestParentPins ?? new Map<string, TestParentPinSetting>();

globalForParentPinTests.__bacangajiTestParentPins = testPins;

function getTestSetting(parentProfileId: string) {
  if (!testPins.has(parentProfileId)) {
    testPins.set(parentProfileId, {
      pinHash: null,
      failedPinAttempts: 0,
      pinLockedUntil: null,
      lastPinVerifiedAt: null,
      updatedAt: new Date("2026-01-01T00:00:00.000Z")
    });
  }
  return testPins.get(parentProfileId)!;
}

export function resetTestParentPins() {
  testPins.clear();
}

export function assertPinPair(pin: string, confirmPin: string) {
  assertFourDigitPin(pin);
  assertFourDigitPin(confirmPin);
  if (pin !== confirmPin) throw new ValidationError("PIN confirmation does not match.");
}

function retryAfterSeconds(lockedUntil: Date, now = new Date()) {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000));
}

function isLocked(lockedUntil: Date | null, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}

function statusFromSetting(setting: {
  pinHash: string | null;
  failedPinAttempts: number;
  pinLockedUntil: Date | null;
  lastPinVerifiedAt: Date | null;
  updatedAt: Date;
}): ParentSecurityStatus {
  return {
    pinConfigured: Boolean(setting.pinHash),
    failedPinAttempts: setting.failedPinAttempts,
    locked: isLocked(setting.pinLockedUntil),
    lockedUntil: setting.pinLockedUntil,
    lastPinVerifiedAt: setting.lastPinVerifiedAt,
    pinFingerprint: setting.pinHash ? parentPinFingerprint(setting.pinHash) : null
  };
}

export async function getParentSecurityStatus(parentProfileId: string) {
  if (process.env["APP_ENV"] === "test") {
    return statusFromSetting(getTestSetting(parentProfileId));
  }

  const setting = await prisma.parentSecuritySetting.upsert({
    where: { parentProfileId },
    update: {},
    create: { parentProfileId },
    select: {
      pinHash: true,
      failedPinAttempts: true,
      pinLockedUntil: true,
      lastPinVerifiedAt: true,
      updatedAt: true
    }
  });

  return statusFromSetting(setting);
}

export async function setInitialParentPin(
  user: CurrentUser,
  pin: string,
  confirmPin: string,
  options: Pick<PinServiceOptions, "db"> = {}
) {
  if (!user.parentProfileId) throw new ValidationError("Parent profile is required.");
  assertPinPair(pin, confirmPin);
  const pinHash = await hashParentPin(pin);
  const db = options.db ?? prisma;

  if (process.env["APP_ENV"] === "test" && !options.db) {
    const setting = getTestSetting(user.parentProfileId);
    if (setting.pinHash) throw new PinAlreadyConfiguredError();
    setting.pinHash = pinHash;
    setting.failedPinAttempts = 0;
    setting.pinLockedUntil = null;
    setting.lastPinVerifiedAt = new Date();
    setting.updatedAt = new Date();
    return {
      token: createParentGateToken({
        userId: user.id,
        parentProfileId: user.parentProfileId,
        pinFingerprint: parentPinFingerprint(setting.pinHash)
      }),
      status: statusFromSetting(setting)
    };
  }

  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.parentProfileId}, 1))`;
    const existing = await tx.parentSecuritySetting.upsert({
      where: { parentProfileId: user.parentProfileId },
      update: {},
      create: { parentProfileId: user.parentProfileId! }
    });
    if (existing.pinHash) throw new PinAlreadyConfiguredError();

    const setting = await tx.parentSecuritySetting.update({
      where: { parentProfileId: user.parentProfileId },
      data: {
        pinHash,
        failedPinAttempts: 0,
        pinLockedUntil: null,
        lastPinVerifiedAt: new Date()
      }
    });

    await writeSecurityEvent(
      {
        actorUserId: user.id,
        parentProfileId: user.parentProfileId,
        eventType: "PARENT_PIN_SET",
        metadata: { category: "success" }
      },
      tx
    );
    await writeAuditEvent(
      {
        actorUserId: user.id,
        parentProfileId: user.parentProfileId,
        action: "PARENT_PIN_SET",
        metadata: { changed: ["pinConfigured"] }
      },
      tx
    );

    return {
      token: createParentGateToken({
        userId: user.id,
        parentProfileId: user.parentProfileId!,
        pinFingerprint: parentPinFingerprint(setting.pinHash!)
      }),
      status: statusFromSetting(setting)
    };
  });
}

export async function verifyParentPin(
  user: CurrentUser,
  pin: string,
  options: PinServiceOptions = {}
) {
  if (!user.parentProfileId) throw new ValidationError("Parent profile is required.");
  assertFourDigitPin(pin);
  const db = options.db ?? prisma;
  const verifyPinHash = options.verifyPinHash ?? verifySecret;

  if (process.env["APP_ENV"] === "test" && !options.db) {
    const setting = getTestSetting(user.parentProfileId);
    if (!setting.pinHash) throw new ParentGateInvalidError();
    if (isLocked(setting.pinLockedUntil)) {
      throw new ParentGateLockedError(
        "Parent gate is temporarily locked.",
        retryAfterSeconds(setting.pinLockedUntil!)
      );
    }
    if (!(await verifyPinHash(setting.pinHash, pin))) {
      setting.failedPinAttempts += 1;
      setting.updatedAt = new Date();
      if (setting.failedPinAttempts >= maxFailedPinAttempts) {
        setting.pinLockedUntil = new Date(Date.now() + lockoutSeconds * 1000);
        throw new ParentGateLockedError("Parent gate is temporarily locked.", lockoutSeconds);
      }
      throw new ParentGateInvalidError();
    }
    setting.failedPinAttempts = 0;
    setting.pinLockedUntil = null;
    setting.lastPinVerifiedAt = new Date();
    setting.updatedAt = new Date();
    return {
      token: createParentGateToken({
        userId: user.id,
        parentProfileId: user.parentProfileId,
        pinFingerprint: parentPinFingerprint(setting.pinHash)
      }),
      status: statusFromSetting(setting)
    };
  }

  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${user.parentProfileId}, 1))`;
      const setting = await tx.parentSecuritySetting.findUnique({
        where: { parentProfileId: user.parentProfileId! }
      });
      if (!setting?.pinHash) throw new ParentGateInvalidError();
      if (isLocked(setting.pinLockedUntil)) {
        throw new ParentGateLockedError(
          "Parent gate is temporarily locked.",
          retryAfterSeconds(setting.pinLockedUntil!)
        );
      }

      if (!(await verifyPinHash(setting.pinHash, pin))) {
        const failedPinAttempts = setting.failedPinAttempts + 1;
        const lockedUntil =
          failedPinAttempts >= maxFailedPinAttempts
            ? new Date(Date.now() + lockoutSeconds * 1000)
            : null;

        await tx.parentSecuritySetting.update({
          where: { parentProfileId: user.parentProfileId! },
          data: {
            failedPinAttempts,
            pinLockedUntil: lockedUntil
          }
        });
        await writeSecurityEvent(
          {
            actorUserId: user.id,
            parentProfileId: user.parentProfileId,
            eventType: lockedUntil ? "PARENT_GATE_LOCKED" : "PARENT_GATE_FAILED",
            metadata: {
              category: "invalid_pin",
              ...(lockedUntil ? { lockedUntil: lockedUntil.toISOString() } : {})
            }
          },
          tx
        );

        if (lockedUntil) {
          throw new ParentGateLockedError("Parent gate is temporarily locked.", lockoutSeconds);
        }
        throw new ParentGateInvalidError();
      }

      const updated = await tx.parentSecuritySetting.update({
        where: { parentProfileId: user.parentProfileId! },
        data: {
          failedPinAttempts: 0,
          pinLockedUntil: null,
          lastPinVerifiedAt: new Date()
        }
      });
      await writeSecurityEvent(
        {
          actorUserId: user.id,
          parentProfileId: user.parentProfileId,
          eventType: "PARENT_GATE_VERIFIED",
          metadata: { category: "success" }
        },
        tx
      );

      return {
        token: createParentGateToken({
          userId: user.id,
          parentProfileId: user.parentProfileId!,
          pinFingerprint: parentPinFingerprint(updated.pinHash!)
        }),
        status: statusFromSetting(updated)
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function changeParentPin(
  user: CurrentUser,
  currentPin: string,
  pin: string,
  confirmPin: string
) {
  if (currentPin === pin)
    throw new ValidationError("New PIN must be different from the current PIN.");
  await verifyParentPin(user, currentPin);
  assertPinPair(pin, confirmPin);
  const pinHash = await hashParentPin(pin);
  if (!user.parentProfileId) throw new ValidationError("Parent profile is required.");

  const setting =
    process.env["APP_ENV"] === "test"
      ? (() => {
          const testSetting = getTestSetting(user.parentProfileId!);
          testSetting.pinHash = pinHash;
          testSetting.failedPinAttempts = 0;
          testSetting.pinLockedUntil = null;
          testSetting.lastPinVerifiedAt = new Date();
          testSetting.updatedAt = new Date();
          return testSetting;
        })()
      : await prisma.parentSecuritySetting.update({
          where: { parentProfileId: user.parentProfileId },
          data: {
            pinHash,
            failedPinAttempts: 0,
            pinLockedUntil: null,
            lastPinVerifiedAt: new Date()
          }
        });

  if (process.env["APP_ENV"] !== "test") {
    await writeSecurityEvent({
      actorUserId: user.id,
      parentProfileId: user.parentProfileId,
      eventType: "PARENT_PIN_CHANGED",
      metadata: { category: "success" }
    });
    await writeAuditEvent({
      actorUserId: user.id,
      parentProfileId: user.parentProfileId,
      action: "PARENT_PIN_CHANGED",
      metadata: { changed: ["pinConfigured"] }
    });
  }

  return {
    token: createParentGateToken({
      userId: user.id,
      parentProfileId: user.parentProfileId,
      pinFingerprint: parentPinFingerprint(setting.pinHash!)
    }),
    status: statusFromSetting(setting)
  };
}
