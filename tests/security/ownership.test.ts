import { describe, expect, it } from "vitest";
import { GET as getChild } from "@/app/api/v1/children/[childId]/route";

function requestFor(parentProfileId: string) {
  return new Request("http://localhost/api/v1/children/owned-child", {
    headers: {
      "x-test-user-id": "user-1",
      "x-test-parent-profile-id": parentProfileId,
      "x-test-permissions": "child:read-own"
    }
  });
}

describe("ownership authorization", () => {
  it("allows a parent to access an owned child", async () => {
    const response = await getChild(requestFor("parent-1"), {
      params: Promise.resolve({ childId: "owned-child" })
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.child.id).toBe("owned-child");
  });

  it("returns generic not found for another parent's child", async () => {
    const response = await getChild(requestFor("parent-2"), {
      params: Promise.resolve({ childId: "owned-child" })
    });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
