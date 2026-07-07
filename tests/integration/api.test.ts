import { beforeEach, describe, expect, it } from "vitest";
import { GET as health } from "@/app/api/health/route";
import { GET as me } from "@/app/api/v1/me/route";
import { GET as adminRoles } from "@/app/api/v1/admin/roles/route";
import { GET as listChildren, POST as createChild } from "@/app/api/v1/children/route";
import { POST as bootstrapParent } from "@/app/api/v1/auth/bootstrap-parent/route";
import { resetTestChildren, seedTestChild } from "@/server/repositories/childRepository";

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
    expect(body.data).not.toHaveProperty("session");
    expect(body.data).not.toHaveProperty("tokenHash");
    expect(body.data).not.toHaveProperty("valueHash");
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

  it("rejects parent bootstrap for privileged users", async () => {
    const response = await bootstrapParent(
      new Request("http://localhost/api/v1/auth/bootstrap-parent", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-test-user-id": "admin-1",
          "x-test-user-email": "admin@example.test",
          "x-test-roles": "ADMIN"
        },
        body: JSON.stringify({ displayName: "Admin User" })
      })
    );

    expect(response.status).toBe(403);
  });

  it("retries parent bootstrap from protected parent entry after interrupted registration", async () => {
    const response = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-test-user-id": "new-user-1",
          "x-test-user-email": "new-parent@example.test"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8"
        })
      })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.data.child.parentProfileId).toBe("parent-1");
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

  it("allows exactly one active child under simultaneous create requests", async () => {
    const payload = {
      nickname: "Alya",
      ageRange: "6-8",
      avatarKey: "starter-star"
    };

    const requests = await Promise.all([
      createChild(
        new Request("http://localhost/api/v1/children", {
          method: "POST",
          headers: {
            ...parentHeaders,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        })
      ),
      createChild(
        new Request("http://localhost/api/v1/children", {
          method: "POST",
          headers: {
            ...parentHeaders,
            "content-type": "application/json"
          },
          body: JSON.stringify({ ...payload, nickname: "Bima" })
        })
      )
    ]);

    const statuses = requests.map((response) => response.status).sort();
    expect(statuses).toEqual([201, 409]);

    const listed = await listChildren(
      new Request("http://localhost/api/v1/children", {
        headers: parentHeaders
      })
    );
    const body = await listed.json();

    expect(body.data.children).toHaveLength(1);
  });

  it("does not show or count soft-deleted children as active MVP children", async () => {
    seedTestChild({
      id: "deleted-child",
      parentProfileId: "parent-1",
      nickname: "Deleted",
      birthYear: null,
      avatarKey: "starter-star",
      deletedAt: new Date()
    });

    const listedBefore = await listChildren(
      new Request("http://localhost/api/v1/children", {
        headers: parentHeaders
      })
    );
    const listedBeforeBody = await listedBefore.json();
    expect(listedBeforeBody.data.children).toHaveLength(0);

    const created = await createChild(
      new Request("http://localhost/api/v1/children", {
        method: "POST",
        headers: {
          ...parentHeaders,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          nickname: "Alya",
          ageRange: "6-8"
        })
      })
    );

    expect(created.status).toBe(201);

    const listedAfter = await listChildren(
      new Request("http://localhost/api/v1/children", {
        headers: parentHeaders
      })
    );
    const listedAfterBody = await listedAfter.json();
    expect(listedAfterBody.data.children).toHaveLength(1);
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
