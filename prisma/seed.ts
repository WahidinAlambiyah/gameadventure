import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type RoleName } from "@prisma/client";
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
      update: {},
      create: {
        slug: track.slug,
        title: track.title,
        description: "Placeholder learning track"
      }
    });

    const zone = await prisma.learningZone.upsert({
      where: { trackId_slug: { trackId: createdTrack.id, slug: "starter-zone" } },
      update: {},
      create: {
        trackId: createdTrack.id,
        slug: "starter-zone",
        title: track.zone
      }
    });

    await prisma.learningLevel.upsert({
      where: { trackId_slug: { trackId: createdTrack.id, slug: "starter-level" } },
      update: {},
      create: {
        trackId: createdTrack.id,
        zoneId: zone.id,
        slug: "starter-level",
        title: "Starter Level"
      }
    });
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
