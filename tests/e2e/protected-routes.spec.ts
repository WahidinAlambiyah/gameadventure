import { expect, test } from "@playwright/test";

test("unauthenticated parent route redirects to login", async () => {
  const response = await fetch("http://localhost:3000/parent", {
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });

  expect([307, 308]).toContain(response.status);
  expect(response.headers.get("location")).toContain("/login");
});

function gateCookie(response: Response) {
  return response.headers.get("set-cookie")?.match(/bacangaji_parent_gate=([^;]+)/)?.[1];
}

test("parent gate lifecycle protects parent routes with server-side checks", async () => {
  const authHeaders = {
    "x-test-user-id": "e2e-parent-user",
    "x-test-user-email": "e2e-parent@example.test",
    "x-test-roles": "PARENT",
    "x-test-permissions": "parent-setting:read-own,parent-setting:update-own,child:read-own",
    "x-test-parent-profile-id": "e2e-parent-profile"
  };

  const beforePin = await fetch("http://localhost:3000/parent", {
    headers: authHeaders,
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });
  expect([307, 308]).toContain(beforePin.status);
  expect(beforePin.headers.get("location")).toContain("/parent/security/set-parent-pin");

  const setPinPage = await fetch("http://localhost:3000/parent/security/set-parent-pin", {
    headers: authHeaders,
    signal: AbortSignal.timeout(15000)
  });
  expect(setPinPage.status).toBe(200);
  await expect(setPinPage.text()).resolves.toContain("Set PIN");

  const setPin = await fetch("http://localhost:3000/api/v1/parent/security/pin", {
    method: "PUT",
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pin: "1234",
      confirmPin: "1234"
    }),
    signal: AbortSignal.timeout(15000)
  });
  expect(setPin.ok).toBe(true);
  let cookie = gateCookie(setPin);
  expect(cookie).toEqual(expect.any(String));

  const unlockedParent = await fetch("http://localhost:3000/parent", {
    headers: {
      ...authHeaders,
      cookie: `bacangaji_parent_gate=${cookie}`
    },
    signal: AbortSignal.timeout(15000)
  });
  expect(unlockedParent.status).toBe(200);
  await expect(unlockedParent.text()).resolves.toContain("Parent home");

  const lock = await fetch("http://localhost:3000/api/v1/auth/parent-gate", {
    method: "DELETE",
    headers: {
      ...authHeaders,
      cookie: `bacangaji_parent_gate=${cookie}`
    },
    signal: AbortSignal.timeout(15000)
  });
  expect(lock.ok).toBe(true);
  expect(lock.headers.get("set-cookie")).toContain("Max-Age=0");

  const lockedParent = await fetch("http://localhost:3000/parent", {
    headers: authHeaders,
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });
  expect([307, 308]).toContain(lockedParent.status);
  expect(lockedParent.headers.get("location")).toContain("/parent/security/verify-parent-pin");

  const incorrectPin = await fetch("http://localhost:3000/api/v1/auth/parent-gate/verify", {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pin: "0000",
      returnTo: "/parent"
    }),
    signal: AbortSignal.timeout(15000)
  });
  expect(incorrectPin.status).toBe(403);

  const correctPin = await fetch("http://localhost:3000/api/v1/auth/parent-gate/verify", {
    method: "POST",
    headers: {
      ...authHeaders,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      pin: "1234",
      returnTo: "/parent"
    }),
    signal: AbortSignal.timeout(15000)
  });
  expect(correctPin.ok).toBe(true);
  cookie = gateCookie(correctPin);
  expect(cookie).toEqual(expect.any(String));

  const returnedParent = await fetch("http://localhost:3000/parent", {
    headers: {
      ...authHeaders,
      cookie: `bacangaji_parent_gate=${cookie}`
    },
    signal: AbortSignal.timeout(15000)
  });
  expect(returnedParent.status).toBe(200);
  await expect(returnedParent.text()).resolves.toContain("Parent home");

  await fetch("http://localhost:3000/api/v1/auth/parent-gate", {
    method: "DELETE",
    headers: authHeaders,
    signal: AbortSignal.timeout(15000)
  });
  const childMode = await fetch("http://localhost:3000/child/select-profile", {
    headers: authHeaders,
    signal: AbortSignal.timeout(15000)
  });
  expect(childMode.status).toBe(200);
  await expect(childMode.text()).resolves.toContain("Who is playing?");
});
