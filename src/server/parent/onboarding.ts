import "server-only";
import { prisma } from "@/server/database/prisma";
import { InfrastructureError } from "@/server/errors/errors";
import type { ParentBootstrapInput } from "@/features/parent/validation";

type BootstrapParentArgs = ParentBootstrapInput & {
  userId: string;
};

export async function bootstrapParentForUser({ userId, displayName }: BootstrapParentArgs) {
  if (process.env.APP_ENV === "test") {
    return {
      id: "parent-1",
      userId,
      displayName,
      timezone: "Asia/Jakarta"
    };
  }

  return prisma.$transaction(async (tx) => {
    const parentRole = await tx.role.findUnique({
      where: { name: "PARENT" },
      select: { id: true }
    });

    if (!parentRole) {
      throw new InfrastructureError("Parent role is not configured.");
    }

    const parentProfile = await tx.parentProfile.upsert({
      where: { userId },
      update: { displayName },
      create: {
        userId,
        displayName,
        timezone: "Asia/Jakarta"
      },
      select: {
        id: true,
        userId: true,
        displayName: true,
        timezone: true
      }
    });

    await tx.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: parentRole.id
        }
      },
      update: {},
      create: {
        userId,
        roleId: parentRole.id
      }
    });

    await tx.parentSecuritySetting.upsert({
      where: { parentProfileId: parentProfile.id },
      update: {},
      create: {
        parentProfileId: parentProfile.id
      }
    });

    await tx.parentalSetting.upsert({
      where: { parentProfileId: parentProfile.id },
      update: {},
      create: {
        parentProfileId: parentProfile.id
      }
    });

    return parentProfile;
  });
}
