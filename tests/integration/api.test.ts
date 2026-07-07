import { describe, expect, it } from "vitest";
import { GET as health } from "@/app/api/health/route";
import { GET as me } from "@/app/api/v1/me/route";
import { GET as adminRoles } from "@/app/api/v1/admin/roles/route";

describe("implemented API endpoints", () => {
  it("returns health status", async () => {
    const response = health();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
  });

  it("returns authenticated profile from server-side auth context", async () => {
    const response = await me(
      new Request("http://localhost/api/v1/me", {
        headers: {
          "x-test-user-id": "user-1",
          "x-test-user-email": "parent@example.test",
          "x-test-roles": "PARENT",
          "x-test-permissions": "child:read-own"
        }
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.email).toBe("parent@example.test");
  });

  it("rejects unauthenticated profile access", async () => {
    const response = await me(new Request("http://localhost/api/v1/me"));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("requires role read permission for admin role endpoint", async () => {
    const denied = await adminRoles(
      new Request("http://localhost/api/v1/admin/roles", {
        headers: {
          "x-test-user-id": "user-1",
          "x-test-permissions": "child:read-own"
        }
      })
    );

    expect(denied.status).toBe(403);

    const allowed = await adminRoles(
      new Request("http://localhost/api/v1/admin/roles", {
        headers: {
          "x-test-user-id": "admin-1",
          "x-test-roles": "ADMIN",
          "x-test-permissions": "role:read,admin:access"
        }
      })
    );
    const body = await allowed.json();

    expect(allowed.status).toBe(200);
    expect(body.data.roles).toContain("SUPER_ADMIN");
  });
});
