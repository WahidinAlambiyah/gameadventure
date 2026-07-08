import { describe, expect, it } from "vitest";
import {
  canChildPlayNow,
  evaluateScreenTimePolicy,
  nextResetAt,
  usageDateForTimezone
} from "@/server/screen-time/policy";

describe("screen-time policy", () => {
  it("allows zero usage with the full daily limit remaining", () => {
    const policy = evaluateScreenTimePolicy({
      dailyLimitSeconds: 1800,
      activePlaySeconds: 0,
      timezone: "Asia/Jakarta",
      now: new Date("2026-07-08T04:00:00.000Z")
    });

    expect(policy.allowed).toBe(true);
    expect(policy.usedSeconds).toBe(0);
    expect(policy.remainingSeconds).toBe(1800);
  });

  it("allows play before the daily limit and reports remaining seconds", () => {
    const policy = evaluateScreenTimePolicy({
      dailyLimitSeconds: 1800,
      activePlaySeconds: 600,
      timezone: "Asia/Jakarta",
      now: new Date("2026-07-08T04:00:00.000Z")
    });

    expect(policy.allowed).toBe(true);
    expect(canChildPlayNow(policy)).toBe(true);
    expect(policy.remainingSeconds).toBe(1200);
    expect(policy.reason).toBe("AVAILABLE");
  });

  it("blocks exactly at and over the daily limit unless a parent override is active", () => {
    const atLimit = evaluateScreenTimePolicy({
      dailyLimitSeconds: 1800,
      activePlaySeconds: 1800,
      timezone: "Asia/Jakarta",
      now: new Date("2026-07-08T04:00:00.000Z")
    });
    const override = evaluateScreenTimePolicy({
      dailyLimitSeconds: 1800,
      activePlaySeconds: 3600,
      timezone: "Asia/Jakarta",
      now: new Date("2026-07-08T04:00:00.000Z"),
      parentOverrideUntil: new Date("2026-07-08T04:10:00.000Z")
    });

    expect(atLimit.allowed).toBe(false);
    expect(atLimit.remainingSeconds).toBe(0);
    expect(atLimit.reason).toBe("DAILY_LIMIT_REACHED");
    expect(
      evaluateScreenTimePolicy({
        dailyLimitSeconds: 1800,
        activePlaySeconds: 3600,
        timezone: "Asia/Jakarta",
        now: new Date("2026-07-08T04:00:00.000Z")
      }).remainingSeconds
    ).toBe(0);
    expect(override.allowed).toBe(true);
    expect(override.reason).toBe("PARENT_OVERRIDE");
  });

  it("uses the child's configured timezone for usage date and next reset", () => {
    const instant = new Date("2026-07-08T16:30:00.000Z");

    expect(usageDateForTimezone(instant, "Asia/Jakarta")).toBe("2026-07-08");
    expect(usageDateForTimezone(instant, "Asia/Jayapura")).toBe("2026-07-09");
    expect(nextResetAt(instant, "Asia/Jakarta").toISOString()).toBe("2026-07-08T17:00:00.000Z");
    expect(nextResetAt(instant, "Asia/Jayapura").toISOString()).toBe("2026-07-09T15:00:00.000Z");
  });
});
