import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ContentStatus, type RoleName } from "@prisma/client";
import { hashSecret } from "../src/server/security/password";
import {
  initialRoles,
  permissions,
  rolePermissions
} from "../src/server/authorization/permissions";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be configured before running the seed.");
}

const adapter = new PrismaPg({
  connectionString
});

const prisma = new PrismaClient({
  adapter
});

async function main() {
  if (process.env.APP_ENV === "production") {
    throw new Error("Development seed must not run in production.");
  }

  for (const roleName of initialRoles) {
    await prisma.role.upsert({
      where: { name: roleName as RoleName },
      update: {},
      create: {
        name: roleName as RoleName,
        description: `${roleName} role`
      }
    });
  }

  for (const permissionName of permissions) {
    await prisma.permission.upsert({
      where: { name: permissionName },
      update: {},
      create: {
        name: permissionName,
        description: `${permissionName} permission`
      }
    });
  }

  for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: roleName as RoleName } });
    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { name: permissionName }
      });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin.dev@example.test" },
    update: {},
    create: {
      email: "admin.dev@example.test",
      name: "Development Admin",
      emailVerified: true,
      accounts: {
        create: {
          providerId: "credential",
          accountId: "admin.dev@example.test",
          password: await hashSecret("ChangeMeAdmin123!")
        }
      }
    }
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent.dev@example.test" },
    update: {},
    create: {
      email: "parent.dev@example.test",
      name: "Development Parent",
      emailVerified: true,
      accounts: {
        create: {
          providerId: "credential",
          accountId: "parent.dev@example.test",
          password: await hashSecret("ChangeMeParent123!")
        }
      }
    }
  });

  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: "SUPER_ADMIN" } });
  const parentRole = await prisma.role.findUniqueOrThrow({ where: { name: "PARENT" } });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdminRole.id }
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: parent.id, roleId: parentRole.id } },
    update: {},
    create: { userId: parent.id, roleId: parentRole.id }
  });

  const parentProfile = await prisma.parentProfile.upsert({
    where: { userId: parent.id },
    update: {},
    create: {
      userId: parent.id,
      displayName: "Development Parent"
    }
  });

  await prisma.parentSecuritySetting.upsert({
    where: { parentProfileId: parentProfile.id },
    update: {},
    create: {
      parentProfileId: parentProfile.id,
      pinHash: await hashSecret("1234")
    }
  });

  await prisma.parentalSetting.upsert({
    where: { parentProfileId: parentProfile.id },
    update: {},
    create: {
      parentProfileId: parentProfile.id
    }
  });

  await prisma.childProfile.upsert({
    where: {
      id: "00000000-0000-0000-0000-000000000101"
    },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000101",
      parentProfileId: parentProfile.id,
      nickname: "Demo Child",
      ageRange: "4-8",
      avatarKey: "starter-star"
    }
  });

  for (const track of [
    { slug: "sastra-nusantara", title: "SastraNusantara", zone: "Syllable Beach" },
    { slug: "hijaiyah-island", title: "HijaiyahIsland", zone: "Harakat Harbor" }
  ]) {
    const createdTrack = await prisma.learningTrack.upsert({
      where: { slug: track.slug },
      update: {
        status: "PUBLISHED" as ContentStatus
      },
      create: {
        slug: track.slug,
        title: track.title,
        description: "Placeholder learning track",
        status: "PUBLISHED" as ContentStatus
      }
    });

    const zone = await prisma.learningZone.upsert({
      where: { trackId_slug: { trackId: createdTrack.id, slug: "starter-zone" } },
      update: {
        status: "PUBLISHED" as ContentStatus
      },
      create: {
        trackId: createdTrack.id,
        slug: "starter-zone",
        title: track.zone,
        status: "PUBLISHED" as ContentStatus
      }
    });

    const starterLevel = await prisma.learningLevel.upsert({
      where: { trackId_slug: { trackId: createdTrack.id, slug: "starter-level" } },
      update: {
        status: "PUBLISHED" as ContentStatus
      },
      create: {
        trackId: createdTrack.id,
        zoneId: zone.id,
        slug: "starter-level",
        title: "Starter Level",
        status: "PUBLISHED" as ContentStatus
      }
    });

    await prisma.learningLevel.upsert({
      where: { trackId_slug: { trackId: createdTrack.id, slug: "next-level" } },
      update: {
        status: "PUBLISHED" as ContentStatus
      },
      create: {
        trackId: createdTrack.id,
        zoneId: zone.id,
        slug: "next-level",
        title: "Next Level",
        sortOrder: 2,
        status: "PUBLISHED" as ContentStatus
      }
    });

    const lesson = await prisma.learningLesson.upsert({
      where: { levelId_slug: { levelId: starterLevel.id, slug: "starter-lesson" } },
      update: {},
      create: {
        levelId: starterLevel.id,
        slug: "starter-lesson",
        title: "Starter Lesson",
        sortOrder: 1
      }
    });

    const question = await prisma.learningQuestion.upsert({
      where: {
        id:
          track.slug === "sastra-nusantara"
            ? "00000000-0000-4000-8000-000000000201"
            : "00000000-0000-4000-8000-000000000202"
      },
      update: {
        lessonId: lesson.id,
        prompt: "Which option says ba?",
        answerRule: { type: "option_value", correctValue: "ba" },
        sortOrder: 1
      },
      create: {
        id:
          track.slug === "sastra-nusantara"
            ? "00000000-0000-4000-8000-000000000201"
            : "00000000-0000-4000-8000-000000000202",
        lessonId: lesson.id,
        prompt: "Which option says ba?",
        answerRule: { type: "option_value", correctValue: "ba" },
        sortOrder: 1
      }
    });

    for (const option of [
      { label: "ba", value: "ba", sortOrder: 1 },
      { label: "ma", value: "ma", sortOrder: 2 }
    ]) {
      await prisma.questionOption.upsert({
        where: {
          id:
            `${track.slug}:${option.value}` === "sastra-nusantara:ba"
              ? "00000000-0000-4000-8000-000000000301"
              : `${track.slug}:${option.value}` === "sastra-nusantara:ma"
                ? "00000000-0000-4000-8000-000000000302"
                : `${track.slug}:${option.value}` === "hijaiyah-island:ba"
                  ? "00000000-0000-4000-8000-000000000303"
                  : "00000000-0000-4000-8000-000000000304"
        },
        update: {
          questionId: question.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder
        },
        create: {
          id:
            `${track.slug}:${option.value}` === "sastra-nusantara:ba"
              ? "00000000-0000-4000-8000-000000000301"
              : `${track.slug}:${option.value}` === "sastra-nusantara:ma"
                ? "00000000-0000-4000-8000-000000000302"
                : `${track.slug}:${option.value}` === "hijaiyah-island:ba"
                  ? "00000000-0000-4000-8000-000000000303"
                  : "00000000-0000-4000-8000-000000000304",
          questionId: question.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder
        }
      });
    }

    const secondQuestion = await prisma.learningQuestion.upsert({
      where: {
        id:
          track.slug === "sastra-nusantara"
            ? "00000000-0000-4000-8000-000000000211"
            : "00000000-0000-4000-8000-000000000212"
      },
      update: {
        lessonId: lesson.id,
        prompt: "Which option says sa?",
        answerRule: { type: "option_value", correctValue: "sa" },
        sortOrder: 2
      },
      create: {
        id:
          track.slug === "sastra-nusantara"
            ? "00000000-0000-4000-8000-000000000211"
            : "00000000-0000-4000-8000-000000000212",
        lessonId: lesson.id,
        prompt: "Which option says sa?",
        answerRule: { type: "option_value", correctValue: "sa" },
        sortOrder: 2
      }
    });

    for (const option of [
      { label: "sa", value: "sa", sortOrder: 1 },
      { label: "na", value: "na", sortOrder: 2 }
    ]) {
      const optionKey = `${track.slug}:${option.value}`;
      const optionId =
        optionKey === "sastra-nusantara:sa"
          ? "00000000-0000-4000-8000-000000000311"
          : optionKey === "sastra-nusantara:na"
            ? "00000000-0000-4000-8000-000000000312"
            : optionKey === "hijaiyah-island:sa"
              ? "00000000-0000-4000-8000-000000000313"
              : "00000000-0000-4000-8000-000000000314";

      await prisma.questionOption.upsert({
        where: { id: optionId },
        update: {
          questionId: secondQuestion.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder
        },
        create: {
          id: optionId,
          questionId: secondQuestion.id,
          label: option.label,
          value: option.value,
          sortOrder: option.sortOrder
        }
      });
    }
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
