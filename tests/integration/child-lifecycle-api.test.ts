import { beforeEach, describe, expect, it } from "vitest";
import {
  DELETE as deleteChild,
  GET as getChild,
  PATCH as updateChild
} from "@/app/api/v1/children/[childId]/route";
import { GET as listChildren, POST as createChild } from "@/app/api/v1/children/route";
import { PUT as writePin } from "@/app/api/v1/parent/security/pin/route";
import { resetTestParentPins } from "@/server/parent-gate/pinService";
import {
  getTestChildAuditEvents,
  resetTestChildren,
  seedTestChild
} from "@/server/repositories/childRepository";

const baseHeaders = {
  "x-test-user-id": "user-1",
  "x-test-user-email": "parent@example.test",
  "x-test-roles": "PARENT",
  "x-test-permissions": "child:create,child:read-own,child:update-own,child:delete-own",
  "x-test-parent-profile-id": "parent-1"
};

function context(childId = "child-1") {
  return { params: Promise.resolve({ childId }) };
}

function request(method: string, body?: unknown, headers: Record<string, string> = baseHeaders) {
  return new Request("http://localhost/api/v1/children/child-1", {
    method,
    headers: { ...headers, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
}

async function gatedHeaders(headers: Record<string, string> = baseHeaders) {
  const response = await writePin(request("PUT", { pin: "1234", confirmPin: "1234" }, headers));
  const cookie = response.headers.get("set-cookie")?.match(/bacangaji_parent_gate=([^;]+)/)?.[1];
  expect(cookie).toEqual(expect.any(String));
  return { ...headers, cookie: `bacangaji_parent_gate=${cookie}` };
}

function seedActiveChild(overrides: Partial<Parameters<typeof seedTestChild>[0]> = {}) {
  seedTestChild({
    id: "child-1",
    parentProfileId: "parent-1",
    nickname: "Alya",
    birthYear: null,
    ageRange: "6-8",
    avatarKey: "starter-star",
    learningPreferences: { focus: "both" },
    ...overrides
  });
}

describe("child profile lifecycle API", () => {
  beforeEach(() => {
    resetTestChildren();
    resetTestParentPins();
    seedActiveChild();
  });

  it("partially updates each allowed field and records field names only", async () => {
    const headers = await gatedHeaders();
    const response = await updateChild(
      request(
        "PATCH",
        {
          nickname: "Alya Baru",
          avatarKey: "moon-scout",
          learningPreferences: { focus: "hijaiyah" }
        },
        headers
      ),
      context()
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.child).toMatchObject({
      nickname: "Alya Baru",
      ageRange: "6-8",
      avatarKey: "moon-scout",
      learningPreferences: { focus: "hijaiyah" }
    });
    expect(getTestChildAuditEvents()).toEqual([
      expect.objectContaining({
        action: "CHILD_PROFILE_UPDATED",
        changed: ["nickname", "avatarKey", "learningPreferences"]
      })
    ]);
    expect(JSON.stringify(getTestChildAuditEvents())).not.toContain("Alya Baru");
    expect(JSON.stringify(getTestChildAuditEvents())).not.toContain("moon-scout");
  });

  it("switches age representation only with an explicit null alternative", async () => {
    const headers = await gatedHeaders();
    const toBirthYear = await updateChild(
      request("PATCH", { birthYear: 2020, ageRange: null }, headers),
      context()
    );
    expect((await toBirthYear.json()).data.child).toMatchObject({
      birthYear: 2020,
      ageRange: null
    });

    const toAgeRange = await updateChild(
      request("PATCH", { birthYear: null, ageRange: "9-12" }, headers),
      context()
    );
    expect((await toAgeRange.json()).data.child).toMatchObject({
      birthYear: null,
      ageRange: "9-12"
    });
  });

  it.each([
    [{ birthYear: 2020, ageRange: "6-8" }],
    [{ birthYear: 2020 }],
    [{ birthYear: null, ageRange: null }],
    [{ nickname: "A" }],
    [{ avatarKey: "unknown" }],
    [{ learningPreferences: { focus: "unknown" } }],
    [{ parentProfileId: "parent-2" }],
    [{ deletedAt: new Date().toISOString() }],
    [{ progress: [] }],
    [{}]
  ])("rejects invalid or protected update payload %#", async (payload) => {
    const response = await updateChild(request("PATCH", payload, await gatedHeaders()), context());
    expect(response.status).toBe(422);
  });

  it("requires authentication, update permission, and parent gate", async () => {
    const unauthenticated = await updateChild(request("PATCH", { nickname: "New" }, {}), context());
    expect(unauthenticated.status).toBe(401);

    const noPermission = await updateChild(
      request(
        "PATCH",
        { nickname: "New" },
        { ...baseHeaders, "x-test-permissions": "child:read-own" }
      ),
      context()
    );
    expect(noPermission.status).toBe(403);

    const noGate = await updateChild(request("PATCH", { nickname: "New" }), context());
    expect(noGate.status).toBe(403);
    expect((await noGate.json()).error.code).toBe("PARENT_GATE_REQUIRED");
  });

  it("returns the same generic not found for foreign, missing, and deleted children", async () => {
    const headers = await gatedHeaders();
    const foreignHeaders = await gatedHeaders({
      ...baseHeaders,
      "x-test-user-id": "user-2",
      "x-test-parent-profile-id": "parent-2"
    });
    const foreign = await updateChild(
      request("PATCH", { nickname: "New" }, foreignHeaders),
      context()
    );
    const missing = await updateChild(
      request("PATCH", { nickname: "New" }, headers),
      context("missing")
    );
    seedActiveChild({ id: "deleted", deletedAt: new Date() });
    const deleted = await updateChild(
      request("PATCH", { nickname: "New" }, headers),
      context("deleted")
    );

    for (const response of [foreign, missing, deleted]) {
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({
        success: false,
        error: { code: "NOT_FOUND", message: "The requested resource was not found." }
      });
    }
  });

  it("soft-deletes once, excludes the child, preserves a sanitized audit, and allows replacement", async () => {
    const headers = await gatedHeaders();
    const response = await deleteChild(request("DELETE", undefined, headers), context());
    expect(response.status).toBe(200);

    const detail = await getChild(request("GET", undefined, headers), context());
    expect(detail.status).toBe(404);
    const listed = await listChildren(request("GET", undefined, headers));
    expect((await listed.json()).data.children).toEqual([]);

    const duplicate = await deleteChild(request("DELETE", undefined, headers), context());
    expect(duplicate.status).toBe(404);
    expect(getTestChildAuditEvents()).toEqual([
      {
        action: "CHILD_PROFILE_DELETED",
        actorUserId: "user-1",
        parentProfileId: "parent-1",
        childId: "child-1"
      }
    ]);

    const replacement = await createChild(
      request("POST", { nickname: "Bima", ageRange: "6-8" }, headers)
    );
    expect(replacement.status).toBe(201);
  });

  it("requires delete permission and parent gate", async () => {
    const unauthenticated = await deleteChild(request("DELETE", undefined, {}), context());
    expect(unauthenticated.status).toBe(401);
    const noPermission = await deleteChild(
      request("DELETE", undefined, { ...baseHeaders, "x-test-permissions": "child:read-own" }),
      context()
    );
    expect(noPermission.status).toBe(403);
    const noGate = await deleteChild(request("DELETE"), context());
    expect(noGate.status).toBe(403);
  });

  it("makes foreign, missing, and deleted delete targets indistinguishable", async () => {
    const headers = await gatedHeaders();
    const foreignHeaders = await gatedHeaders({
      ...baseHeaders,
      "x-test-user-id": "user-2",
      "x-test-parent-profile-id": "parent-2"
    });
    seedActiveChild({ id: "deleted", deletedAt: new Date() });
    const responses = await Promise.all([
      deleteChild(request("DELETE", undefined, foreignHeaders), context()),
      deleteChild(request("DELETE", undefined, headers), context("missing")),
      deleteChild(request("DELETE", undefined, headers), context("deleted"))
    ]);
    for (const response of responses) {
      expect(response.status).toBe(404);
      expect((await response.json()).error).toEqual({
        code: "NOT_FOUND",
        message: "The requested resource was not found."
      });
    }
  });

  it("serializes concurrent update and delete so only one operation succeeds", async () => {
    const headers = await gatedHeaders();
    const [updated, deleted] = await Promise.all([
      updateChild(request("PATCH", { nickname: "Concurrent" }, headers), context()),
      deleteChild(request("DELETE", undefined, headers), context())
    ]);
    expect([updated.status, deleted.status].sort()).toEqual([200, 404]);
  });
});
