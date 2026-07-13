#!/usr/bin/env node
/**
 * Coverage gate hook — blocks git push when homework-6 test coverage is below 80%.
 * Cursor beforeShellExecution hook (reads JSON from stdin).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUSH_RE = /git\s+push\b/i;

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => resolve(data));
  });
}

function resolveHomework6Root() {
  const hookDir = path.dirname(fileURLToPath(import.meta.url));
  const fromHook = path.resolve(hookDir, "..", "..");
  if (existsSync(path.join(fromHook, "package.json"))) {
    return fromHook;
  }
  const cwd = process.cwd();
  if (existsSync(path.join(cwd, "homework-6", "package.json"))) {
    return path.join(cwd, "homework-6");
  }
  if (existsSync(path.join(cwd, "package.json"))) {
    return cwd;
  }
  return fromHook;
}

function output(obj) {
  process.stdout.write(`${JSON.stringify(obj)}\n`);
}

async function main() {
  const raw = await readStdin();
  let command = "";
  try {
    const input = JSON.parse(raw || "{}");
    command = input.command ?? "";
  } catch {
    output({ permission: "allow" });
    process.exit(0);
  }

  if (!PUSH_RE.test(command)) {
    output({ permission: "allow" });
    process.exit(0);
  }

  const hw6Root = resolveHomework6Root();
  const result = spawnSync("npm", ["run", "test:coverage"], {
    cwd: hw6Root,
    shell: true,
    encoding: "utf8",
  });

  if (result.status === 0) {
    output({
      permission: "allow",
      agent_message: "Coverage gate passed (>= 80%).",
    });
    process.exit(0);
  }

  output({
    permission: "deny",
    user_message:
      "Push blocked: test coverage is below 80%. Run `npm run test:coverage` in homework-6 and add tests until the gate passes.",
    agent_message: `Coverage gate failed in ${hw6Root}. Exit code: ${result.status ?? "unknown"}.`,
  });
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  output({
    permission: "deny",
    user_message: "Push blocked: coverage gate hook failed to run.",
  });
  process.exit(2);
});
