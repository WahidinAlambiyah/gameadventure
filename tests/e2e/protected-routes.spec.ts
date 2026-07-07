import { expect, test } from "@playwright/test";

test("unauthenticated parent route redirects to login", async () => {
  const response = await fetch("http://localhost:3000/parent", {
    redirect: "manual",
    signal: AbortSignal.timeout(15000)
  });

  expect([307, 308]).toContain(response.status);
  expect(response.headers.get("location")).toContain("/login");
});
