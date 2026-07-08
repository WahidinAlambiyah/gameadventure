import { describe, expect, it, vi } from "vitest";
import { ParentGateInvalidError, ParentGateLockedError } from "@/server/errors/errors";
import { changeParentPin, verifyParentPin } from "@/server/parent-gate/pinService";

type FakeSetting = {
  pinHash: string | null;
  failedPinAttempts: number;
  pinLockedUntil: Date | null;
  lastPinVerifiedAt: Date | null;
  updatedAt: Date;
};

const user = {
  id: "user-1",
  email: "parent@example.test",
  roles: ["PARENT" as const],
  permissions: [],
  parentProfileId: "parent-1"
};

function cloneSetting(setting: FakeSetting): FakeSetting {
  return {
    ...setting,
    pinLockedUntil: setting.pinLockedUntil ? new Date(setting.pinLockedUntil) : null,
    lastPinVerifiedAt: setting.lastPinVerifiedAt ? new Date(setting.lastPinVerifiedAt) : null,
    updatedAt: new Date(setting.updatedAt)
  };
}

function createFakeDb(initial: FakeSetting, options: { failAuditCreate?: boolean } = {}) {
  let setting = cloneSetting(initial);
  let lock = Promise.resolve();
  let committedTransactions = 0;
  const securityEvents: Array<{ eventType: string; metadata?: unknown }> = [];
  const auditEvents: Array<{ action: string; metadata?: unknown }> = [];

  const db = {
    get setting() {
      return setting;
    },
    get committedTransactions() {
      return committedTransactions;
    },
    parentSecuritySetting: {} as never,
    securityEvents,
    auditEvents,
    async $transaction<T>(callback: (tx: unknown) => Promise<T>) {
      const previous = lock;
      let release!: () => void;
      lock = new Promise<void>((resolve) => {
        release = resolve;
      });
      await previous;

      const settingSnapshot = cloneSetting(setting);
      const securitySnapshot = [...securityEvents];
      const auditSnapshot = [...auditEvents];
      const tx = {
        $queryRaw: vi.fn(async () => [{ lock_acquired: "" }]),
        parentSecuritySetting: {
          findUnique: vi.fn(async () => cloneSetting(setting)),
          update: vi.fn(async ({ data }: { data: Partial<FakeSetting> }) => {
            setting = {
              ...setting,
              ...data,
              updatedAt: new Date()
            };
            return cloneSetting(setting);
          })
        },
        securityEvent: {
          create: vi.fn(async ({ data }: { data: { eventType: string; metadata?: unknown } }) => {
            securityEvents.push(data);
          })
        },
        auditLog: {
          create: vi.fn(async ({ data }: { data: { action: string; metadata?: unknown } }) => {
            if (options.failAuditCreate) throw new Error("audit create failed");
            auditEvents.push(data);
          })
        }
      };

      try {
        const result = await callback(tx);
        committedTransactions += 1;
        return result;
      } catch (error) {
        setting = settingSnapshot;
        securityEvents.splice(0, securityEvents.length, ...securitySnapshot);
        auditEvents.splice(0, auditEvents.length, ...auditSnapshot);
        throw error;
      } finally {
        release();
      }
    }
  };

  return db;
}

const baseSetting: FakeSetting = {
  pinHash: "old-hash",
  failedPinAttempts: 0,
  pinLockedUntil: null,
  lastPinVerifiedAt: null,
  updatedAt: new Date("2026-07-08T00:00:00.000Z")
};

describe("parent PIN service transaction outcomes", () => {
  it("commits failed-attempt mutation and security event before returning invalid outcome", async () => {
    const db = createFakeDb(baseSetting);

    await expect(
      verifyParentPin(user, "0000", {
        db: db as never,
        verifyPinHash: vi.fn(async () => false)
      })
    ).rejects.toBeInstanceOf(ParentGateInvalidError);

    expect(db.committedTransactions).toBe(1);
    expect(db.setting.failedPinAttempts).toBe(1);
    expect(db.setting.pinLockedUntil).toBeNull();
    expect(db.securityEvents).toHaveLength(1);
    expect(db.securityEvents[0].eventType).toBe("PARENT_GATE_FAILED");
  });

  it("commits fifth failure state and lock security event before returning locked outcome", async () => {
    const db = createFakeDb({
      ...baseSetting,
      failedPinAttempts: 4
    });

    await expect(
      verifyParentPin(user, "0000", {
        db: db as never,
        verifyPinHash: vi.fn(async () => false)
      })
    ).rejects.toBeInstanceOf(ParentGateLockedError);

    expect(db.committedTransactions).toBe(1);
    expect(db.setting.failedPinAttempts).toBe(5);
    expect(db.setting.pinLockedUntil).toBeInstanceOf(Date);
    expect(db.securityEvents).toHaveLength(1);
    expect(db.securityEvents[0].eventType).toBe("PARENT_GATE_LOCKED");
  });

  it("skips Argon2 verification while actively locked", async () => {
    const verifier = vi.fn(async () => true);
    const db = createFakeDb({
      ...baseSetting,
      failedPinAttempts: 5,
      pinLockedUntil: new Date(Date.now() + 60_000)
    });

    await expect(
      verifyParentPin(user, "1234", {
        db: db as never,
        verifyPinHash: verifier
      })
    ).rejects.toBeInstanceOf(ParentGateLockedError);

    expect(verifier).not.toHaveBeenCalled();
    expect(db.committedTransactions).toBe(1);
  });

  it("starts a fresh failure cycle after lockout expiry", async () => {
    const db = createFakeDb({
      ...baseSetting,
      failedPinAttempts: 5,
      pinLockedUntil: new Date(Date.now() - 60_000)
    });

    await expect(
      verifyParentPin(user, "0000", {
        db: db as never,
        verifyPinHash: vi.fn(async () => false)
      })
    ).rejects.toBeInstanceOf(ParentGateInvalidError);

    expect(db.setting.failedPinAttempts).toBe(1);
    expect(db.setting.pinLockedUntil).toBeNull();
    expect(db.securityEvents[0].eventType).toBe("PARENT_GATE_FAILED");
  });

  it("successful verification resets failed state and writes a verification event", async () => {
    const db = createFakeDb({
      ...baseSetting,
      failedPinAttempts: 3,
      pinLockedUntil: null
    });

    const result = await verifyParentPin(user, "1234", {
      db: db as never,
      verifyPinHash: vi.fn(async () => true)
    });

    expect(result.status.failedPinAttempts).toBe(0);
    expect(result.status.locked).toBe(false);
    expect(db.setting.lastPinVerifiedAt).toBeInstanceOf(Date);
    expect(db.securityEvents[0].eventType).toBe("PARENT_GATE_VERIFIED");
  });

  it("serializes concurrent PIN changes so the same old PIN cannot overwrite twice", async () => {
    const db = createFakeDb(baseSetting);
    const verifier = vi.fn(
      async (pinHash: string, pin: string) => pinHash === "old-hash" && pin === "1234"
    );

    const results = await Promise.allSettled([
      changeParentPin(user, "1234", "5678", "5678", {
        db: db as never,
        verifyPinHash: verifier
      }),
      changeParentPin(user, "1234", "9012", "9012", {
        db: db as never,
        verifyPinHash: verifier
      })
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(db.auditEvents).toHaveLength(1);
    expect(
      db.securityEvents.filter((event) => event.eventType === "PARENT_PIN_CHANGED")
    ).toHaveLength(1);
    expect(
      db.securityEvents.filter((event) => event.eventType === "PARENT_GATE_FAILED")
    ).toHaveLength(1);
  });

  it("rolls back PIN update and events when audit write fails inside change transaction", async () => {
    const db = createFakeDb(baseSetting, { failAuditCreate: true });

    await expect(
      changeParentPin(user, "1234", "5678", "5678", {
        db: db as never,
        verifyPinHash: vi.fn(async () => true)
      })
    ).rejects.toThrow("audit create failed");

    expect(db.setting.pinHash).toBe("old-hash");
    expect(db.securityEvents).toHaveLength(0);
    expect(db.auditEvents).toHaveLength(0);
  });
});
