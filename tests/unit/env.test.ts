import { describe, expect, it } from "vitest";
import { loadEnv } from "@/config/env";

describe("environment validation", () => {
  it("loads safe defaults for local tests", () => {
    const env = loadEnv({ APP_ENV: "test" } as unknown as NodeJS.ProcessEnv);

    expect(env.APP_ENV).toBe("test");
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("rejects insecure production placeholders", () => {
    expect(() =>
      loadEnv({
        APP_ENV: "production",
        DATABASE_URL: "postgresql://example",
        DIRECT_URL: "postgresql://example",
        BETTER_AUTH_SECRET: "replace-with-a-long-random-secret",
        BETTER_AUTH_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000"
      } as unknown as NodeJS.ProcessEnv)
    ).toThrow(/Production environment variable/);
  });
});
