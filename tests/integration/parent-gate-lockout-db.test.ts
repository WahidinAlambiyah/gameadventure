import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ParentGateInvalidError, ParentGateLockedError } from "@/server/errors/errors";
import {
  changeParentPin,
  setInitialParentPin,
  verifyParentPin
} from "@/server/parent-gate/pinService";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  describe("database-backed parent PIN lockout", () => {
    it("skips because TEST_DATABASE_URL is not configured", () => {
      console.warn(
        "Skipping database-backed parent PIN lockout test: TEST_DATABASE_URL is not configured."
      );
      expect(testDatabaseUrl).toBeUndefined();
    });
  });
} else if (testDatabaseUrl === process.env.DATABASE_URL) {
  describe("database-backed parent PIN lockout", () => {
    it("refuses to run against DATABASE_URL", () => {
      throw new Error("TEST_DATABASE_URL must not point at DATABASE_URL.");
    });
  });
} else {
  describe("database-backed parent PIN lockout", () => {
    it("serializes simultaneous incorrect attempts and locks once consistently", async () => {
      const db = new PrismaClient({
        adapter: new PrismaPg({ connectionString: testDatabaseUrl })
      });
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const email = `pin-lockout-${suffix}@example.test`;
      let userId: string | undefined;
      let parentProfileId: string | undefined;

      try {
        const user = await db.user.create({
          data: {
            email,
            name: "PIN Lockout Parent",
            emailVerified: true
          },
          select: { id: true, email: true }
        });
        userId = user.id;

        const parentProfile = await db.parentProfile.create({
          data: {
            userId,
            displayName: "PIN Lockout Parent"
          },
          select: { id: true }
        });
        parentProfileId = parentProfile.id;

        const currentUser = {
          id: userId,
          email: user.email,
          roles: ["PARENT" as const],
          permissions: [],
          parentProfileId
        };

        await setInitialParentPin(currentUser, "1234", "1234", { db });

        const results = await Promise.all(
          Array.from({ length: 5 }, async () => {
            try {
              await verifyParentPin(currentUser, "0000", { db });
              return "unexpected-success";
            } catch (error) {
              if (error instanceof ParentGateInvalidError) return "invalid";
              if (error instanceof ParentGateLockedError) return "locked";
              throw error;
            }
          })
        );

        expect(results).not.toContain("unexpected-success");
        expect(results.filter((result) => result === "locked")).toHaveLength(1);

        const setting = await db.parentSecuritySetting.findUniqueOrThrow({
          where: { parentProfileId },
          select: {
            failedPinAttempts: true,
            pinLockedUntil: true
          }
        });

        expect(setting.failedPinAttempts).toBeGreaterThanOrEqual(5);
        expect(setting.pinLockedUntil).toBeInstanceOf(Date);

        const failedEvents = await db.securityEvent.count({
          where: {
            actorUserId: userId,
            eventType: "PARENT_GATE_FAILED"
          }
        });
        const lockedEvents = await db.securityEvent.count({
          where: {
            actorUserId: userId,
            eventType: "PARENT_GATE_LOCKED"
          }
        });

        expect(failedEvents).toBe(4);
        expect(lockedEvents).toBe(1);

        const verifier = vi.fn(async () => true);

        await expect(
          verifyParentPin(currentUser, "1234", {
            db,
            verifyPinHash: verifier
          })
        ).rejects.toMatchObject({
          code: "PARENT_GATE_LOCKED",
          retryAfterSeconds: expect.any(Number)
        });
        expect(verifier).not.toHaveBeenCalled();

        try {
          await verifyParentPin(currentUser, "1234", { db });
        } catch (error) {
          expect(error).toBeInstanceOf(ParentGateLockedError);
          if (error instanceof ParentGateLockedError) {
            expect(Number.isInteger(error.retryAfterSeconds)).toBe(true);
            expect(error.retryAfterSeconds).toBeGreaterThan(0);
          }
        }
      } finally {
        if (userId) {
          await db.securityEvent.deleteMany({ where: { actorUserId: userId } });
          await db.auditLog.deleteMany({ where: { actorUserId: userId } });
        }
        if (parentProfileId) {
          await db.parentSecuritySetting.deleteMany({ where: { parentProfileId } });
          await db.parentProfile.deleteMany({ where: { id: parentProfileId } });
        }
        if (userId) {
          await db.user.deleteMany({ where: { id: userId, email } });
        }
        await db.$disconnect();
      }
    }, 30000);

    it("does not let concurrent PIN changes both overwrite with the same old PIN", async () => {
      const db = new PrismaClient({
        adapter: new PrismaPg({ connectionString: testDatabaseUrl })
      });
      const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const email = `pin-change-${suffix}@example.test`;
      let userId: string | undefined;
      let parentProfileId: string | undefined;

      try {
        const user = await db.user.create({
          data: {
            email,
            name: "PIN Change Parent",
            emailVerified: true
          },
          select: { id: true, email: true }
        });
        userId = user.id;

        const parentProfile = await db.parentProfile.create({
          data: {
            userId,
            displayName: "PIN Change Parent"
          },
          select: { id: true }
        });
        parentProfileId = parentProfile.id;

        const currentUser = {
          id: userId,
          email: user.email,
          roles: ["PARENT" as const],
          permissions: [],
          parentProfileId
        };

        await setInitialParentPin(currentUser, "1234", "1234", { db });

        const results = await Promise.allSettled([
          changeParentPin(currentUser, "1234", "5678", "5678", { db }),
          changeParentPin(currentUser, "1234", "9012", "9012", { db })
        ]);

        expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
        expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

        const setting = await db.parentSecuritySetting.findUniqueOrThrow({
          where: { parentProfileId },
          select: {
            failedPinAttempts: true,
            pinLockedUntil: true
          }
        });

        expect(setting.failedPinAttempts).toBe(1);
        expect(setting.pinLockedUntil).toBeNull();

        await expect(
          changeParentPin(currentUser, "1234", "3456", "3456", { db })
        ).rejects.toBeInstanceOf(ParentGateInvalidError);

        const changedEvents = await db.securityEvent.count({
          where: {
            actorUserId: userId,
            eventType: "PARENT_PIN_CHANGED"
          }
        });
        const changedAudit = await db.auditLog.count({
          where: {
            actorUserId: userId,
            action: "PARENT_PIN_CHANGED"
          }
        });

        expect(changedEvents).toBe(1);
        expect(changedAudit).toBe(1);
      } finally {
        if (userId) {
          await db.securityEvent.deleteMany({ where: { actorUserId: userId } });
          await db.auditLog.deleteMany({ where: { actorUserId: userId } });
        }
        if (parentProfileId) {
          await db.parentSecuritySetting.deleteMany({ where: { parentProfileId } });
          await db.parentProfile.deleteMany({ where: { id: parentProfileId } });
        }
        if (userId) {
          await db.user.deleteMany({ where: { id: userId, email } });
        }
        await db.$disconnect();
      }
    }, 30000);
  });
}
