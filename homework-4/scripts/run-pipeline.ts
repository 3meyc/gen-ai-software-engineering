import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseAgentFile } from "./lib/parse-agent.js";
import { runAgentStep } from "./lib/run-agent-step.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, "..");

const bugId = process.env.BUG_ID ?? "BUG-001";
const dryRun = process.argv.includes("--dry-run");

interface PipelineStep {
  id: string;
  agentFile: string;
  expectedOutputs: string[];
  parallelGroup?: string;
}

const steps: PipelineStep[] = [
  {
    id: "research-verifier",
    agentFile: "agents/research-verifier.agent.md",
    expectedOutputs: [
      `context/bugs/${bugId}/research/verified-research.md`,
    ],
  },
  {
    id: "bug-fixer",
    agentFile: "agents/bug-fixer.agent.md",
    expectedOutputs: [`context/bugs/${bugId}/fix-summary.md`],
  },
  {
    id: "security-verifier",
    agentFile: "agents/security-verifier.agent.md",
    expectedOutputs: [`context/bugs/${bugId}/security-report.md`],
    parallelGroup: "post-fix",
  },
  {
    id: "unit-test-generator",
    agentFile: "agents/unit-test-generator.agent.md",
    expectedOutputs: [`context/bugs/${bugId}/test-report.md`],
    parallelGroup: "post-fix",
  },
];

function preflight(): void {
  const requiredInputs = [
    `context/bugs/${bugId}/research/codebase-research.md`,
    `context/bugs/${bugId}/implementation-plan.md`,
  ];

  for (const rel of requiredInputs) {
    const abs = resolve(workspaceRoot, rel);
    if (!existsSync(abs)) {
      console.error(`Preflight failed: missing required input ${rel}`);
      process.exit(1);
    }
  }

  const researchPath = resolve(
    workspaceRoot,
    `context/bugs/${bugId}/research/codebase-research.md`,
  );
  const research = readFileSync(researchPath, "utf8");
  if (research.includes("TBD")) {
    console.warn(
      "Warning: codebase-research.md still contains TBD markers (Task 5 stub).",
    );
  }
}

function verifyOutputs(step: PipelineStep): boolean {
  let ok = true;
  for (const rel of step.expectedOutputs) {
    const abs = resolve(workspaceRoot, rel);
    if (!existsSync(abs)) {
      console.error(`  Missing expected output: ${rel}`);
      ok = false;
    }
  }
  return ok;
}

async function runStep(step: PipelineStep): Promise<number> {
  const agentPath = resolve(workspaceRoot, step.agentFile);
  if (!existsSync(agentPath)) {
    console.error(`Agent file not found: ${step.agentFile}`);
    return 1;
  }

  const agent = parseAgentFile(agentPath);
  console.log(`\n=== Step: ${step.id} (model: ${agent.model}) ===\n`);

  const result = await runAgentStep({
    workspaceRoot,
    bugId,
    agent,
    dryRun,
  });

  if (result.exitCode !== 0) {
    console.error(`\nStep ${step.id} failed with exit code ${result.exitCode}`);
    if (result.stderr.includes("ENOENT") || result.stderr.includes("not found")) {
      console.error(
        "Hint: Install Cursor CLI — see homework-4/HOWTORUN.md",
      );
    }
    return result.exitCode;
  }

  if (!dryRun && !verifyOutputs(step)) {
    console.error(`\nStep ${step.id} completed but expected outputs are missing.`);
    return 1;
  }

  console.log(`\nStep ${step.id} completed.`);
  return 0;
}

async function main(): Promise<void> {
  console.log(`Homework-4 pipeline — BUG_ID=${bugId}`);
  console.log(`Workspace: ${workspaceRoot}`);
  if (dryRun) console.log("Mode: DRY RUN (no agent invocations)\n");

  preflight();

  const sequential = steps.filter((s) => !s.parallelGroup);
  const parallel = steps.filter((s) => s.parallelGroup === "post-fix");

  for (const step of sequential) {
    const code = await runStep(step);
    if (code !== 0) process.exit(code);
  }

  if (parallel.length > 0) {
    console.log("\n=== Parallel group: post-fix ===\n");
    const results = await Promise.all(parallel.map((step) => runStep(step)));
    const failed = results.find((code) => code !== 0);
    if (failed !== undefined && failed !== 0) {
      process.exit(failed);
    }
  }

  console.log("\nPipeline finished successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
