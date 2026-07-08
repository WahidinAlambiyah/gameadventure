import "server-only";
import { prisma } from "@/server/database/prisma";
import { evaluateScreenTimePolicy, usageDateForTimezone } from "@/server/screen-time/policy";
import { writeAuditEvent } from "@/server/audit/events";

export const allowedTimezones = ["Asia/Jakarta", "Asia/Makassar", "Asia/Jayapura"] as const;

const testSettings = new Map<
  string,
  {
    dailyLimitMinutes: number;
    timezone: (typeof allowedTimezones)[number];
    energyEnabled: boolean;
  }
>();

function getTestSetting(parentProfileId: string) {
  if (!testSettings.has(parentProfileId)) {
    testSettings.set(parentProfileId, {
      dailyLimitMinutes: 30,
      timezone: "Asia/Jakarta",
      energyEnabled: true
    });
  }
  return testSettings.get(parentProfileId)!;
}

export function resetTestParentSettings() {
  testSettings.clear();
}

export async function getParentSettingsSummary(parentProfileId: string) {
  if (process.env["APP_ENV"] === "test") {
    const setting = getTestSetting(parentProfileId);
    const policy = evaluateScreenTimePolicy({
      dailyLimitSeconds: setting.dailyLimitMinutes * 60,
      activePlaySeconds: 0,
      timezone: setting.timezone,
      now: new Date(),
      parentOverrideUntil: null
    });
    return {
      dailyLimitMinutes: setting.dailyLimitMinutes,
      timezone: setting.timezone,
      energyEnabled: setting.energyEnabled,
      parentOverrideActive: false,
      parentOverrideUntil: null,
      usage: policy
    };
  }

  const setting = await prisma.parentalSetting.upsert({
    where: { parentProfileId },
    update: {},
    create: { parentProfileId },
    select: {
      dailyLimitSeconds: true,
      timezone: true,
      energyEnabled: true,
      parentOverrideUntil: true
    }
  });

  const child = await prisma.childProfile.findFirst({
    where: { parentProfileId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  const now = new Date();
  const usageDate = usageDateForTimezone(now, setting.timezone);
  const usage = child
    ? await prisma.dailyPlayUsage.findUnique({
        where: {
          childProfileId_usageDate: {
            childProfileId: child.id,
            usageDate: new Date(`${usageDate}T00:00:00.000Z`)
          }
        },
        select: { activePlaySeconds: true }
      })
    : null;

  const policy = evaluateScreenTimePolicy({
    dailyLimitSeconds: setting.dailyLimitSeconds,
    activePlaySeconds: usage?.activePlaySeconds ?? 0,
    timezone: setting.timezone,
    now,
    parentOverrideUntil: setting.parentOverrideUntil
  });

  return {
    dailyLimitMinutes: Math.floor(setting.dailyLimitSeconds / 60),
    timezone: setting.timezone,
    energyEnabled: setting.energyEnabled,
    parentOverrideActive: policy.overrideActive,
    parentOverrideUntil: setting.parentOverrideUntil,
    usage: policy
  };
}

export async function updateParentSettings(
  actorUserId: string,
  parentProfileId: string,
  input: {
    dailyLimitMinutes: number;
    timezone: (typeof allowedTimezones)[number];
    energyEnabled: boolean;
  }
) {
  const changed = ["dailyLimitMinutes", "timezone", "energyEnabled"];
  if (process.env["APP_ENV"] === "test") {
    const setting = getTestSetting(parentProfileId);
    setting.dailyLimitMinutes = input.dailyLimitMinutes;
    setting.timezone = input.timezone;
    setting.energyEnabled = input.energyEnabled;
    return setting;
  }

  const setting = await prisma.$transaction(async (tx) => {
    const updated = await tx.parentalSetting.upsert({
      where: { parentProfileId },
      update: {
        dailyLimitSeconds: input.dailyLimitMinutes * 60,
        timezone: input.timezone,
        energyEnabled: input.energyEnabled
      },
      create: {
        parentProfileId,
        dailyLimitSeconds: input.dailyLimitMinutes * 60,
        timezone: input.timezone,
        energyEnabled: input.energyEnabled
      }
    });
    await writeAuditEvent(
      {
        actorUserId,
        parentProfileId,
        action: "PARENT_SETTINGS_UPDATED",
        metadata: { changed }
      },
      tx
    );
    return updated;
  });
  return setting;
}
