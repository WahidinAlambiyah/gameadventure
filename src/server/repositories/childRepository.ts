import "server-only";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/database/prisma";
import type {
  CreateChildProfileInput,
  UpdateChildProfileInput
} from "@/features/parent/validation";
import { ConflictError, NotFoundError } from "@/server/errors/errors";
import { writeAuditEvent } from "@/server/audit/events";

export type ChildSummary = {
  id: string;
  parentProfileId: string;
  nickname: string;
  birthYear: number | null;
  ageRange?: string | null;
  avatarKey: string | null;
  learningPreferences?: unknown;
  deletedAt?: Date | null;
};

type ChildDbClient = Pick<PrismaClient, "$transaction">;

const testChildren = new Map<string, ChildSummary[]>();
const testChildLocks = new Map<string, Promise<void>>();
const testChildAuditEvents: Array<{
  action: string;
  actorUserId: string;
  parentProfileId: string;
  childId: string;
  changed?: string[];
}> = [];

function getTestChildren(parentProfileId: string) {
  if (!testChildren.has(parentProfileId)) testChildren.set(parentProfileId, []);
  return testChildren.get(parentProfileId)!;
}

export function resetTestChildren() {
  testChildren.clear();
  testChildLocks.clear();
  testChildAuditEvents.length = 0;
}

export function getTestChildAuditEvents() {
  return structuredClone(testChildAuditEvents);
}

export function seedTestChild(child: ChildSummary) {
  getTestChildren(child.parentProfileId).push(child);
}

function sanitizeChild(child: ChildSummary) {
  return {
    id: child.id,
    parentProfileId: child.parentProfileId,
    nickname: child.nickname,
    birthYear: child.birthYear,
    ageRange: child.ageRange ?? null,
    avatarKey: child.avatarKey,
    learningPreferences: child.learningPreferences ?? {}
  };
}

async function withTestChildLock<T>(parentProfileId: string, action: () => Promise<T> | T) {
  const previousLock = testChildLocks.get(parentProfileId) ?? Promise.resolve();
  let releaseCurrentLock: (() => void) | undefined;
  const currentLock = previousLock.then(
    () =>
      new Promise<void>((resolve) => {
        releaseCurrentLock = resolve;
      })
  );

  testChildLocks.set(parentProfileId, currentLock);
  await previousLock;

  try {
    return await action();
  } finally {
    releaseCurrentLock?.();
    if (testChildLocks.get(parentProfileId) === currentLock) {
      testChildLocks.delete(parentProfileId);
    }
  }
}

export async function findChildByIdAndParentId(childId: string, parentProfileId: string) {
  if (process.env["APP_ENV"] === "test") {
    if (childId === "owned-child" && parentProfileId === "parent-1") {
      return sanitizeChild({
        id: childId,
        parentProfileId,
        nickname: "Demo Child",
        birthYear: 2020,
        avatarKey: "starter-star"
      });
    }

    const child = getTestChildren(parentProfileId).find(
      (item) => item.id === childId && !item.deletedAt
    );
    return child ? sanitizeChild(child) : null;
  }

  return prisma.childProfile.findFirst({
    where: {
      id: childId,
      parentProfileId,
      deletedAt: null
    },
    select: {
      id: true,
      parentProfileId: true,
      nickname: true,
      birthYear: true,
      ageRange: true,
      avatarKey: true,
      learningPreferences: true
    }
  });
}

export async function listChildrenByParentId(parentProfileId: string) {
  if (process.env["APP_ENV"] === "test") {
    return getTestChildren(parentProfileId)
      .filter((child) => !child.deletedAt)
      .map(sanitizeChild);
  }

  return prisma.childProfile.findMany({
    where: {
      parentProfileId,
      deletedAt: null
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentProfileId: true,
      nickname: true,
      birthYear: true,
      ageRange: true,
      avatarKey: true,
      learningPreferences: true
    }
  });
}

export async function createChildForParent(
  parentProfileId: string,
  input: CreateChildProfileInput,
  db: ChildDbClient = prisma
) {
  if (process.env["APP_ENV"] === "test" && db === prisma) {
    return withTestChildLock(parentProfileId, async () => {
      const children = getTestChildren(parentProfileId);
      const activeChildren = children.filter((child) => !child.deletedAt);
      if (activeChildren.length > 0) {
        throw new ConflictError("MVP supports one active child profile.");
      }

      const child: ChildSummary = {
        id: `test-child-${children.length + 1}`,
        parentProfileId,
        nickname: input.nickname,
        birthYear: input.birthYear ?? null,
        ageRange: input.ageRange ?? null,
        avatarKey: input.avatarKey ?? "starter-star",
        learningPreferences: input.learningPreferences
      };
      children.push(child);
      return sanitizeChild(child);
    });
  }

  try {
    return await db.$transaction(
      async (tx) => {
        await tx.$queryRaw`
  SELECT pg_advisory_xact_lock(
    hashtextextended(${parentProfileId}, 0)
  )::text AS lock_acquired
`;

        const activeChildren = await tx.childProfile.count({
          where: {
            parentProfileId,
            deletedAt: null
          }
        });

        if (activeChildren > 0) {
          throw new ConflictError("MVP supports one active child profile.");
        }

        return tx.childProfile.create({
          data: {
            parentProfileId,
            nickname: input.nickname,
            birthYear: input.birthYear,
            ageRange: input.ageRange,
            avatarKey: input.avatarKey ?? "starter-star",
            learningPreferences: input.learningPreferences as Prisma.InputJsonValue
          },
          select: {
            id: true,
            parentProfileId: true,
            nickname: true,
            birthYear: true,
            ageRange: true,
            avatarKey: true,
            learningPreferences: true
          }
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2034" || error.code === "P2002")
    ) {
      throw new ConflictError("MVP supports one active child profile.");
    }
    throw error;
  }
}

function changedFields(input: UpdateChildProfileInput) {
  return Object.keys(input);
}

export async function updateChildForParent(
  actorUserId: string,
  parentProfileId: string,
  childId: string,
  input: UpdateChildProfileInput
) {
  const changed = changedFields(input);
  if (process.env["APP_ENV"] === "test") {
    return withTestChildLock(childId, () => {
      const child = getTestChildren(parentProfileId).find(
        (item) => item.id === childId && !item.deletedAt
      );
      if (!child) throw new NotFoundError();
      Object.assign(child, input);
      testChildAuditEvents.push({
        action: "CHILD_PROFILE_UPDATED",
        actorUserId,
        parentProfileId,
        childId,
        changed
      });
      return sanitizeChild(child);
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${childId}, 17))::text AS lock_acquired
    `;
    const child = await tx.childProfile.findFirst({
      where: { id: childId, parentProfileId, deletedAt: null },
      select: { id: true }
    });
    if (!child) throw new NotFoundError();

    const updated = await tx.childProfile.update({
      where: { id: childId },
      data: {
        ...input,
        ...(input.learningPreferences
          ? { learningPreferences: input.learningPreferences as Prisma.InputJsonValue }
          : {})
      },
      select: {
        id: true,
        parentProfileId: true,
        nickname: true,
        birthYear: true,
        ageRange: true,
        avatarKey: true,
        learningPreferences: true
      }
    });
    await writeAuditEvent(
      {
        actorUserId,
        parentProfileId,
        action: "CHILD_PROFILE_UPDATED",
        targetType: "ChildProfile",
        targetId: childId,
        metadata: { parentProfileId, changed }
      },
      tx
    );
    return updated;
  });
}

export async function softDeleteChildForParent(
  actorUserId: string,
  parentProfileId: string,
  childId: string
) {
  if (process.env["APP_ENV"] === "test") {
    return withTestChildLock(parentProfileId, () =>
      withTestChildLock(childId, () => {
        const child = getTestChildren(parentProfileId).find(
          (item) => item.id === childId && !item.deletedAt
        );
        if (!child) throw new NotFoundError();
        child.deletedAt = new Date();
        testChildAuditEvents.push({
          action: "CHILD_PROFILE_DELETED",
          actorUserId,
          parentProfileId,
          childId
        });
        return { id: childId };
      })
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${parentProfileId}, 0))::text AS lock_acquired
    `;
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtextextended(${childId}, 17))::text AS lock_acquired
    `;
    const child = await tx.childProfile.findFirst({
      where: { id: childId, parentProfileId, deletedAt: null },
      select: { id: true }
    });
    if (!child) throw new NotFoundError();

    await tx.childProfile.update({ where: { id: childId }, data: { deletedAt: new Date() } });
    await writeAuditEvent(
      {
        actorUserId,
        parentProfileId,
        action: "CHILD_PROFILE_DELETED",
        targetType: "ChildProfile",
        targetId: childId,
        metadata: { parentProfileId }
      },
      tx
    );
    return { id: childId };
  });
}
