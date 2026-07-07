import { beforeEach, describe, expect, it } from "vitest";
import { GET as health } from "@/app/api/health/route";
import { GET as me } from "@/app/api/v1/me/route";
import { GET as adminRoles } from "@/app/api/v1/admin/roles/route";
import { GET as listChildren, POST as createChild } from "@/app/api/v1/children/route";
import { POST as bootstrapParent } from "@/app/api/v1/auth/bootstrap-parent/route";
import { resetTestChildren } from "@/server/repositories/childRepository";

const parentHeaders = {
  "x-test-user-id": "user-1",
  "x-test-user-email": "parent@example.test",
  "x-test-roles": "PARENT",
  "x-test-permissions": "child:create,child:read-own",
  "x-test-parent-profile-id": "parent-1"
};

describe("implemented API endpoints", () => {
  beforeEach(() => {
    resetTestChildren();
  });

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

  it("bootstraps only the parent role for an authenticated user", async () => {
    const response = await bootstrapParent(
      new Request("http://localhost/api/v1/auth/bootstrap-parent", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-test-user-id": "user-1",
          "x-test-user-email": "parent@example.test"
        },
        body: JSON.stringify({ displayName: "Parent User" })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.rolesAssigned).toEqual(["PARENT"]);
    expect(body.data.rolesAssigned).not.toContain("ADMIN");
  });

  it("creates and lists a parent-owned child profile", async () => {
    const created = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          ...parentHeaders,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8",
          avatarKey: "starter-star",
          learningPreferences: { starterTrack: "sastra-nusantara" }
        })
      })
    );
    const createdBody = await created.json();

    expect(created.status).toBe(201);
    expect(createdBody.data.child.nickname).toBe("Alya");
    expect(createdBody.data.child.parentProfileId).toBe("parent-1");

    const listed = await listChildren(
      new Request("http://localhost/api/v1/children", {
        headers: parentHeaders
      })
    );
    const listedBody = await listed.json();

    expect(listed.status).toBe(200);
    expect(listedBody.data.children).toHaveLength(1);
    expect(listedBody.data.children[0].nickname).toBe("Alya");
  });

  it("rejects client-supplied parent ownership fields", async () => {
    const response = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          ...parentHeaders,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8",
          parentProfileId: "parent-2"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("enforces one active MVP child per parent", async () => {
    const payload = {
      nickname: "Alya",
      ageRange: "6-8",
      avatarKey: "starter-star"
    };

    await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          ...parentHeaders,
          "content-type": "application/json"
        },
        body: JSON.stringify(payload)
      })
    );

    const second = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          ...parentHeaders,
          "content-type": "application/json"
        },
        body: JSON.stringify({ ...payload, nickname: "Bima" })
      })
    );
    const body = await second.json();

    expect(second.status).toBe(409);
    expect(body.error.code).toBe("CONFLICT");
  });

  it("does not let admin-only users create parent children", async () => {
    const response = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-test-user-id": "admin-1",
          "x-test-roles": "ADMIN",
          "x-test-permissions": "admin:access,child:create"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8"
        })
      })
    );

    expect(response.status).toBe(403);
  });

  it("requires child create permission for parent child creation", async () => {
    const response = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-test-user-id": "user-1",
          "x-test-roles": "PARENT",
          "x-test-permissions": "child:read-own",
          "x-test-parent-profile-id": "parent-1"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8"
        })
      })
    );

    expect(response.status).toBe(403);
  });
});
