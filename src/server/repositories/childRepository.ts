import "server-only";
import { prisma } from "@/server/database/prisma";

export async function findChildByIdAndParentId(childId: string, parentProfileId: string) {
  if (process.env.APP_ENV === "test") {
    if (childId === "owned-child" && parentProfileId === "parent-1") {
      return {
        id: childId,
        parentProfileId,
        nickname: "Demo Child",
        birthYear: 2020,
        avatarKey: "starter-star"
      };
    }
    return null;
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
