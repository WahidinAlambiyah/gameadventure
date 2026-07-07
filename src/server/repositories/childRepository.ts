import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/database/prisma";
import type { CreateChildProfileInput } from "@/features/parent/validation";
import { ConflictError } from "@/server/errors/errors";

export type ChildSummary = {
  id: string;
  parentProfileId: string;
  nickname: string;
  birthYear: number | null;
  ageRange?: string | null;
  avatarKey: string | null;
  learningPreferences?: unknown;
};

const testChildren = new Map<string, ChildSummary[]>();

function getTestChildren(parentProfileId: string) {
  if (!testChildren.has(parentProfileId)) testChildren.set(parentProfileId, []);
  return testChildren.get(parentProfileId)!;
}

export function resetTestChildren() {
  testChildren.clear();
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
    ageRange: child.ageRange,
    avatarKey: child.avatarKey,
    learningPreferences: child.learningPreferences ?? {}
  };
}

export async function findChildByIdAndParentId(childId: string, parentProfileId: string) {
  if (process.env.APP_ENV === "test") {
    if (childId === "owned-child" && parentProfileId === "parent-1") {
      return sanitizeChild({
        id: childId,
        parentProfileId,
        nickname: "Demo Child",
        birthYear: 2020,
        avatarKey: "starter-star"
      });
    }

    const child = getTestChildren(parentProfileId).find((item) => item.id === childId);
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
      avatarKey: true,
      learningPreferences: true
    }
  });
}

export async function listChildrenByParentId(parentProfileId: string) {
  if (process.env.APP_ENV === "test") {
    return getTestChildren(parentProfileId).map(sanitizeChild);
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
  input: CreateChildProfileInput
) {
  if (process.env.APP_ENV === "test") {
    const children = getTestChildren(parentProfileId);
    if (children.length > 0) throw new ConflictError("MVP supports one active child profile.");
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
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
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
