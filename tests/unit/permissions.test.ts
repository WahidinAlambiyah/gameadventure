import { describe, expect, it } from "vitest";
import { hasPermission, rolePermissions } from "@/server/authorization/permissions";

describe("permission checking", () => {
  it("checks exact permission names", () => {
    expect(hasPermission(["child:read-own"], "child:read-own")).toBe(true);
    expect(hasPermission(["child:read-own"], "child:delete-own")).toBe(false);
  });

  it("keeps parent permissions scoped to own child resources", () => {
    expect(rolePermissions.PARENT).toContain("child:read-own");
    expect(rolePermissions.PARENT).not.toContain("admin:access");
  });
});
