import spawn from "cross-spawn";
import type { AgentDefinition } from "./parse-agent.js";
import { loadSkills } from "./load-skill.js";

export interface RunAgentStepOptions {
  workspaceRoot: string;
  bugId: string;
  agent: AgentDefinition;
  dryRun?: boolean;
}

export interface RunAgentStepResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function buildPrompt(
  workspaceRoot: string,
  bugId: string,
  agent: AgentDefinition,
): string {
  const skillsMarkdown = loadSkills(workspaceRoot, agent.skills);
  const bugContext = `context/bugs/${bugId}/`;

  return [
    `You are executing the "${agent.name}" agent for homework-4 bug ${bugId}.`,
    "",
    "## Agent instructions",
    agent.body.replace(/\{BUG_ID\}/g, bugId),
    "",
    "## Skills (mandatory)",
    "Apply the following skill content verbatim when executing this step:",
    "",
    skillsMarkdown,
    "",
    "## Paths",
    `Workspace root: ${workspaceRoot}`,
    `Bug context: ${bugContext}`,
    `BUG_ID: ${bugId}`,
  ].join("\n");
}

export function runAgentStep(
  options: RunAgentStepOptions,
): Promise<RunAgentStepResult> {
  const { workspaceRoot, bugId, agent, dryRun = false } = options;
  const prompt = buildPrompt(workspaceRoot, bugId, agent);

  if (dryRun) {
    console.log(`\n--- DRY RUN: ${agent.name} ---`);
    console.log(`Model: ${agent.model}`);
    console.log(`Prompt length: ${prompt.length} chars`);
    return Promise.resolve({ exitCode: 0, stdout: "", stderr: "" });
  }

  const args = [
    "-p",
    "--force",
    "--model",
    agent.model,
    "--workspace",
    workspaceRoot,
    prompt,
  ];

  if (agent.readOnly) {
    args.splice(1, 0, "--mode=ask");
  }

  return new Promise((resolvePromise) => {
    const child = spawn("agent", args, {
      cwd: workspaceRoot,
      stdio: ["ignore", "pipe", "pipe"],
      shell: process.platform === "win32",
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on("close", (code) => {
      resolvePromise({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on("error", (err) => {
      resolvePromise({
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${err.message}`,
      });
    });
  });
}
