import { describe, expect, it } from "vitest";
import { auth } from "@/server/auth/auth";

describe("Better Auth password policy", () => {
  it("rejects an 8-11 character password at the real auth handler", async () => {
    const response = await auth.handler(
      new Request("http://localhost:3000/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000"
        },
        body: JSON.stringify({
          name: "Short Password",
          email: `short-password-${Date.now()}@example.test`,
          password: "Abcdef12345"
        })
      })
    );

    expect(response.status).not.toBe(200);
    expect([400, 422]).toContain(response.status);
  });
});
