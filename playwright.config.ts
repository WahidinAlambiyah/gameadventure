import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    trace: "on-first-retry"
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: "node node_modules/next/dist/bin/next start",
        url: "http://localhost:3000",
        env: {
          ...process.env,
          APP_ENV: "test",
          NEXT_PUBLIC_APP_URL: "http://localhost:3000",
          BETTER_AUTH_URL: "http://localhost:3000",
          BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-local-e2e"
        },
        reuseExistingServer: !process.env.CI,
        timeout: 120000
      }
});
