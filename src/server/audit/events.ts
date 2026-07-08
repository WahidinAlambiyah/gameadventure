import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";

type EventDatabase = Pick<typeof prisma, "auditLog" | "securityEvent">;

type EventArgs = {
  actorUserId?: string;
  parentProfileId?: string;
  action?: string;
  eventType?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const redactedKeys = new Set(["pin", "pinHash", "password", "token", "cookie", "session"]);

function safeMetadata(metadata: Record<string, unknown> = {}) {
  for (const key of Object.keys(metadata)) {
    if (redactedKeys.has(key)) {
      throw new Error(`Sensitive metadata key is not allowed: ${key}`);
    }
  }
  return metadata as Prisma.InputJsonValue;
}

export async function writeAuditEvent(args: EventArgs, db: EventDatabase = prisma) {
  if (!args.action) return;
  await db.auditLog.create({
    data: {
      actorUserId: args.actorUserId,
      action: args.action,
      targetType: args.targetType ?? "ParentProfile",
      targetId: args.targetId ?? args.parentProfileId,
      metadata: safeMetadata(args.metadata)
    }
  });
}

export async function writeSecurityEvent(args: EventArgs, db: EventDatabase = prisma) {
  if (!args.eventType) return;
  await db.securityEvent.create({
    data: {
      actorUserId: args.actorUserId,
      eventType: args.eventType,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      metadata: safeMetadata({
        parentProfileId: args.parentProfileId,
        ...args.metadata
      })
    }
  });
}
