import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as clearGate } from "@/app/api/v1/auth/parent-gate/route";
import { POST as verifyGate } from "@/app/api/v1/auth/parent-gate/verify/route";
import { GET as playStatus } from "@/app/api/v1/children/[childId]/play-status/route";
import { GET as securityStatus } from "@/app/api/v1/parent/security/route";
import { PUT as writePin } from "@/app/api/v1/parent/security/pin/route";
import { GET as readSettings, PATCH as writeSettings } from "@/app/api/v1/parent/settings/route";
import { resetTestParentPins, verifyParentPin } from "@/server/parent-gate/pinService";
import { resetTestParentSettings } from "@/server/parent/settings";
import { resetTestChildren, seedTestChild } from "@/server/repositories/childRepository";
import { ParentGateLockedError } from "@/server/errors/errors";

const parentHeaders = {
  "x-test-user-id": "user-1",
  "x-test-user-email": "parent@example.test",
  "x-test-roles": "PARENT",
  "x-test-permissions": "parent-setting:read-own,parent-setting:update-own,child:read-own",
  "x-test-parent-profile-id": "parent-1"
};

function jsonRequest(url: string, body: unknown, headers = parentHeaders) {
  return new Request(url, {
    method: "POST",
    headers: {
      ...headers,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function cookieValue(response: Response) {
  return response.headers.get("set-cookie")?.match(/bacangaji_parent_gate=([^;]+)/)?.[1];
}

async function setPinAndCookie() {
  const response = await writePin(
    jsonRequest(
      "http://localhost/api/v1/parent/security/pin",
      {
        pin: "1234",
        confirmPin: "1234"
      },
      parentHeaders
    )
  );
  const cookie = cookieValue(response);
  expect(cookie).toEqual(expect.any(String));
  return cookie!;
}

describe("parent gate API", () => {
  beforeEach(() => {
    resetTestParentPins();
    resetTestParentSettings();
    resetTestChildren();
  });

  it("sets a parent PIN without returning PIN material and rejects duplicate initial setup", async () => {
    const response = await writePin(
      jsonRequest("http://localhost/api/v1/parent/security/pin", {
        pin: "1234",
        confirmPin: "1234"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.pinConfigured).toBe(true);
    expect(JSON.stringify(body)).not.toContain("pinHash");
    expect(JSON.stringify(body)).not.toContain("1234");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");

    const duplicate = await writePin(
      jsonRequest("http://localhost/api/v1/parent/security/pin", {
        pin: "5678",
        confirmPin: "5678"
      })
    );
    const duplicateBody = await duplicate.json();

    expect(duplicate.status).toBe(409);
    expect(duplicateBody.error.code).toBe("PIN_ALREADY_CONFIGURED");
  });

  it("requires the current PIN for changes and invalidates the previous gate token", async () => {
    const oldCookie = await setPinAndCookie();

    const missingCurrent = await writePin(
      jsonRequest("http://localhost/api/v1/parent/security/pin", {
        pin: "5678",
        confirmPin: "5678"
      })
    );
    expect(missingCurrent.status).toBe(409);

    const changed = await writePin(
      jsonRequest("http://localhost/api/v1/parent/security/pin", {
        currentPin: "1234",
        pin: "5678",
        confirmPin: "5678"
      })
    );
    expect(changed.status).toBe(200);

    const staleGate = await readSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${oldCookie}`
        }
      })
    );
    expect(staleGate.status).toBe(403);
  });

  it("keeps a valid gate token valid after failed attempts and successful verification", async () => {
    const originalCookie = await setPinAndCookie();

    const initiallyAllowed = await readSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${originalCookie}`
        }
      })
    );
    expect(initiallyAllowed.status).toBe(200);

    const failedAttempt = await verifyGate(
      jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
        pin: "0000"
      })
    );
    expect(failedAttempt.status).toBe(403);

    const afterFailedAttempt = await readSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${originalCookie}`
        }
      })
    );
    expect(afterFailedAttempt.status).toBe(200);

    const successfulVerification = await verifyGate(
      jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
        pin: "1234"
      })
    );
    expect(successfulVerification.status).toBe(200);

    const afterSuccessfulVerification = await readSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${originalCookie}`
        }
      })
    );
    expect(afterSuccessfulVerification.status).toBe(200);
  });

  it("locks verification after five invalid attempts and emits Retry-After", async () => {
    await setPinAndCookie();

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const response = await verifyGate(
        jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
          pin: "0000"
        })
      );
      expect(response.status).toBe(403);
    }

    const locked = await verifyGate(
      jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
        pin: "0000"
      })
    );
    const lockedBody = await locked.json();

    expect(locked.status).toBe(429);
    expect(locked.headers.get("Retry-After")).toBe("900");
    expect(lockedBody.error.code).toBe("PARENT_GATE_LOCKED");

    const stillLocked = await verifyGate(
      jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
        pin: "1234"
      })
    );
    expect(stillLocked.status).toBe(429);
  });

  it("does not verify PIN hashes while the gate is locked", async () => {
    await setPinAndCookie();

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      await verifyGate(
        jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
          pin: "0000"
        })
      );
    }

    const verifier = vi.fn(async () => {
      throw new Error("PIN hash verification should be skipped while locked.");
    });

    await expect(
      verifyParentPin({ ...parentHeadersAsUser(), id: "user-1" }, "1234", {
        verifyPinHash: verifier
      })
    ).rejects.toBeInstanceOf(ParentGateLockedError);
    expect(verifier).not.toHaveBeenCalled();
  });

  it("verifies the gate, sanitizes returnTo, and reports safe status only", async () => {
    await setPinAndCookie();
    const verified = await verifyGate(
      jsonRequest("http://localhost/api/v1/auth/parent-gate/verify", {
        pin: "1234",
        returnTo: "https://evil.example/parent"
      })
    );
    const verifiedBody = await verified.json();
    const cookie = cookieValue(verified);

    expect(verified.status).toBe(200);
    expect(verifiedBody.data.returnTo).toBe("/parent");
    expect(cookie).toEqual(expect.any(String));

    const status = await securityStatus(
      new Request("http://localhost/api/v1/parent/security", {
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${cookie}`
        }
      })
    );
    const statusBody = await status.json();

    expect(status.status).toBe(200);
    expect(statusBody.data.gateVerified).toBe(true);
    expect(JSON.stringify(statusBody)).not.toContain("pinHash");
  });

  it("rejects parent gate and PIN APIs for non-parent roles", async () => {
    const headers = {
      ...parentHeaders,
      "x-test-roles": "CONTENT_EDITOR",
      "x-test-permissions": "content:create"
    };

    const setResponse = await writePin(
      jsonRequest(
        "http://localhost/api/v1/parent/security/pin",
        {
          pin: "1234",
          confirmPin: "1234"
        },
        headers
      )
    );
    const verifyResponse = await verifyGate(
      jsonRequest(
        "http://localhost/api/v1/auth/parent-gate/verify",
        {
          pin: "1234"
        },
        headers
      )
    );

    expect(setResponse.status).toBe(403);
    expect(verifyResponse.status).toBe(403);
  });

  it("requires a valid gate cookie for parental settings and validates settings payloads", async () => {
    const cookie = await setPinAndCookie();

    const denied = await readSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        headers: parentHeaders
      })
    );
    expect(denied.status).toBe(403);

    const invalid = await writeSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        method: "PATCH",
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${cookie}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          dailyLimitMinutes: 7,
          timezone: "Asia/Jakarta",
          energyEnabled: true
        })
      })
    );
    expect(invalid.status).toBe(422);

    const updated = await writeSettings(
      new Request("http://localhost/api/v1/parent/settings", {
        method: "PATCH",
        headers: {
          ...parentHeaders,
          cookie: `bacangaji_parent_gate=${cookie}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          dailyLimitMinutes: 45,
          timezone: "Asia/Makassar",
          energyEnabled: false
        })
      })
    );
    const updatedBody = await updated.json();

    expect(updated.status).toBe(200);
    expect(updatedBody.data.dailyLimitMinutes).toBe(45);
    expect(updatedBody.data.timezone).toBe("Asia/Makassar");
    expect(updatedBody.data.energyEnabled).toBe(false);
  });

  it("returns play status only for a server-owned child", async () => {
    seedTestChild({
      id: "child-1",
      parentProfileId: "parent-1",
      nickname: "Alya",
      birthYear: 2020,
      avatarKey: "starter-star"
    });

    const owned = await playStatus(
      new Request("http://localhost/api/v1/children/child-1/play-status?activePlaySeconds=9999", {
        headers: parentHeaders
      }),
      { params: Promise.resolve({ childId: "child-1" }) }
    );
    const ownedBody = await owned.json();

    expect(owned.status).toBe(200);
    expect(ownedBody.data.playStatus.allowed).toBe(true);
    expect(ownedBody.data.playStatus.usedSeconds).toBe(0);
    expect(ownedBody.data.playStatus).not.toHaveProperty("pinHash");

    const otherParent = await playStatus(
      new Request("http://localhost/api/v1/children/child-1/play-status", {
        headers: {
          ...parentHeaders,
          "x-test-parent-profile-id": "parent-2"
        }
      }),
      { params: Promise.resolve({ childId: "child-1" }) }
    );

    expect(otherParent.status).toBe(404);
  });

  it("clears only the parent gate cookie", async () => {
    const response = await clearGate(
      new Request("http://localhost/api/v1/auth/parent-gate", {
        method: "DELETE",
        headers: parentHeaders
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("bacangaji_parent_gate=");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(response.headers.get("set-cookie")).toContain("Path=/");
  });
});

function parentHeadersAsUser() {
  return {
    email: parentHeaders["x-test-user-email"],
    roles: ["PARENT" as const],
    permissions: parentHeaders["x-test-permissions"].split(","),
    parentProfileId: parentHeaders["x-test-parent-profile-id"]
  };
}
