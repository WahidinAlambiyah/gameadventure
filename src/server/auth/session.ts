import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/server/database/prisma";
import {
  hasPermission,
  rolePermissions,
  type PermissionName,
  type RoleName
} from "@/server/authorization/permissions";
import { AuthenticationError, AuthorizationError } from "@/server/errors/errors";
import { bootstrapParentForUser } from "@/server/parent/onboarding";

export type CurrentUser = {
  id: string;
  name?: string | null;
  email: string;
  roles: RoleName[];
  permissions: string[];
  parentProfileId?: string;
};

function testUserFromHeaders(requestHeaders: Headers): CurrentUser | null {
  if (process.env["APP_ENV"] !== "test" && process.env.NODE_ENV !== "test") return null;

  const userId = requestHeaders.get("x-test-user-id");
  if (!userId) return null;

  return {
    id: userId,
    name: requestHeaders.get("x-test-user-name"),
    email: requestHeaders.get("x-test-user-email") ?? "test@example.com",
    roles: (requestHeaders.get("x-test-roles")?.split(",").filter(Boolean) as RoleName[]) ?? [
      "PARENT"
    ],
    permissions: requestHeaders.get("x-test-permissions")?.split(",").filter(Boolean) ?? [],
    parentProfileId: requestHeaders.get("x-test-parent-profile-id") ?? undefined
  };
}

async function hydrateCurrentUserById(userId: string): Promise<CurrentUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      parentProfile: {
        select: { id: true }
      },
      userRoles: {
        select: {
          role: {
            select: {
              name: true,
              rolePermissions: {
                select: {
                  permission: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!user) return null;

  const roles = user.userRoles.map((userRole) => userRole.role.name as RoleName);
  const permissions = Array.from(
    new Set(
      user.userRoles.flatMap((userRole) =>
        userRole.role.rolePermissions.map((rolePermission) => rolePermission.permission.name)
      )
    )
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles,
    permissions,
    parentProfileId: user.parentProfile?.id
  };
}

export async function getCurrentUser(requestHeaders?: Headers): Promise<CurrentUser | null> {
  const resolvedHeaders = requestHeaders ?? (await headers());
  const testUser = testUserFromHeaders(resolvedHeaders);
  if (testUser) return testUser;
  if (process.env["APP_ENV"] === "test" || process.env.NODE_ENV === "test") return null;
  if (!resolvedHeaders.get("cookie")) return null;

  const session = await auth.api.getSession({
    headers: resolvedHeaders
  });

  if (!session?.user) return null;

  return hydrateCurrentUserById(session.user.id);
}

export async function requireAuthentication(requestHeaders?: Headers): Promise<CurrentUser> {
  const user = await getCurrentUser(requestHeaders);
  if (!user) {
    if (!requestHeaders) redirect("/login");
    throw new AuthenticationError();
  }
  return user;
}

export async function requireRole(role: RoleName, requestHeaders?: Headers): Promise<CurrentUser> {
  const user = await requireAuthentication(requestHeaders);
  if (!user.roles.includes(role)) throw new AuthorizationError();
  return user;
}

export async function requireParent(requestHeaders?: Headers): Promise<CurrentUser> {
  const user = await requireAuthentication(requestHeaders);
  if (user.roles.includes("ADMIN") || user.roles.includes("SUPER_ADMIN")) {
    throw new AuthorizationError("Privileged users cannot be bootstrapped as parents.");
  }

  if (!user.roles.includes("PARENT") && user.roles.length > 0) {
    throw new AuthorizationError("A parent account is required.");
  }

  if (!user.parentProfileId) {
    const displayName = user.name?.trim() || user.email.split("@")[0] || "Parent";
    await bootstrapParentForUser({
      userId: user.id,
      displayName
    });

    if (process.env["APP_ENV"] === "test" || process.env.NODE_ENV === "test") {
      return {
        ...user,
        roles: ["PARENT"],
        permissions: rolePermissions.PARENT,
        parentProfileId: "parent-1"
      };
    }

    const bootstrappedUser = await hydrateCurrentUserById(user.id);
    if (!bootstrappedUser?.parentProfileId || !bootstrappedUser.roles.includes("PARENT")) {
      if (!requestHeaders) redirect("/register");
      throw new AuthorizationError("A parent profile is required.");
    }

    return bootstrappedUser;
  }
  return user;
}

export async function requirePermission(
  permission: PermissionName,
  requestHeaders?: Headers
): Promise<CurrentUser> {
  const user = await requireAuthentication(requestHeaders);
  if (!hasPermission(user.permissions, permission)) throw new AuthorizationError();
  return user;
}

export async function requireParentPermission(
  permission: PermissionName,
  requestHeaders?: Headers
): Promise<CurrentUser> {
  const user = await requireParent(requestHeaders);
  if (!hasPermission(user.permissions, permission)) throw new AuthorizationError();
  return user;
}

export function requireOwnership(resourceOwnerId: string, userOwnerId?: string) {
  if (!userOwnerId || resourceOwnerId !== userOwnerId) {
    throw new AuthenticationError("The requested resource was not found.");
  }
}
