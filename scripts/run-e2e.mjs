import { spawn } from "node:child_process";
import process from "node:process";

const isWindows = process.platform === "win32";
const env = {
  ...process.env,
  APP_ENV: "test",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  BETTER_AUTH_URL: "http://localhost:3000",
  BETTER_AUTH_SECRET: "test-secret-that-is-long-enough-for-local-e2e"
};

function spawnCommand(command, args, options = {}) {
  return spawn(command, args, {
    stdio: options.stdio ?? "inherit",
    shell: false,
    env: options.env ?? env
  });
}

async function waitForServer(url, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok || response.status < 500) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopServer(child) {
  if (child.exitCode !== null) return;

  if (isWindows) {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" });
    await new Promise((resolve) => killer.on("exit", resolve));
    return;
  }

  child.kill("SIGTERM");
  await new Promise((resolve) => child.on("exit", resolve));
}

async function main() {
  const server = spawnCommand("node", ["node_modules/next/dist/bin/next", "start"], {
    stdio: "ignore"
  });
  let exitCode = 1;

  try {
    await waitForServer("http://localhost:3000", 120000);

    const result = spawnCommand("node", ["node_modules/playwright/cli.js", "test"], {
      env: {
        ...env,
        PLAYWRIGHT_SKIP_WEBSERVER: "1"
      }
    });

    exitCode = await new Promise((resolve) => {
      result.on("exit", (code) => resolve(code ?? 1));
    });
  } finally {
    await stopServer(server);
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
