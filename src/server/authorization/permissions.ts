export const initialRoles = [
  "PARENT",
  "CONTENT_EDITOR",
  "CONTENT_REVIEWER",
  "PUBLISHER",
  "SUPPORT",
  "AUDITOR",
  "ADMIN",
  "SUPER_ADMIN"
] as const;

export const mvpRoles = ["PARENT", "CONTENT_EDITOR", "ADMIN", "SUPER_ADMIN"] as const;

export const permissions = [
  "admin:access",
  "child:create",
  "child:read-own",
  "child:update-own",
  "child:delete-own",
  "progress:read-own",
  "parent-setting:read-own",
  "parent-setting:update-own",
  "content:create",
  "content:read",
  "content:update-draft",
  "content:review",
  "content:publish",
  "content:archive",
  "user:read",
  "user:suspend",
  "role:read",
  "role:assign",
  "audit:read",
  "security-event:read"
] as const;

export type RoleName = (typeof initialRoles)[number];
export type PermissionName = (typeof permissions)[number];

export const rolePermissions: Record<RoleName, PermissionName[]> = {
  PARENT: [
    "child:create",
    "child:read-own",
    "child:update-own",
    "child:delete-own",
    "progress:read-own",
    "parent-setting:read-own",
    "parent-setting:update-own"
  ],
  CONTENT_EDITOR: ["content:create", "content:read", "content:update-draft"],
  CONTENT_REVIEWER: ["content:read", "content:review"],
  PUBLISHER: ["content:read", "content:publish", "content:archive"],
  SUPPORT: ["user:read", "progress:read-own"],
  AUDITOR: ["audit:read", "security-event:read"],
  ADMIN: ["admin:access", "user:read", "role:read", "content:read", "audit:read"],
  SUPER_ADMIN: [...permissions]
};

export function hasPermission(userPermissions: readonly string[], permission: string) {
  return userPermissions.includes(permission);
}
