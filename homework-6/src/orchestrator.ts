import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { PipelineSummary, RawTransaction } from "./types.js";
import { runCompliance } from "./pipeline/compliance.js";
import { runFraudDetector } from "./pipeline/fraud-detector.js";
import {
  clearDir,
  createEnvelope,
  ensureSharedDirs,
  getSamplePath,
  getSharedRoot,
  sharedDir,
  transactionFileName,
  writeJson,
} from "./pipeline/fs-utils.js";
import { runValidator } from "./pipeline/validator.js";

export type RunPipelineOptions = {
  samplePath?: string;
  sharedRoot?: string;
};

export async function runPipeline(
  options?: RunPipelineOptions,
): Promise<PipelineSummary> {
  const sharedRoot = await ensureSharedDirs(options?.sharedRoot);

  await clearDir(sharedRoot, "input");
  await clearDir(sharedRoot, "processing");
  await clearDir(sharedRoot, "output");
  await clearDir(sharedRoot, "results");

  const samplePath = getSamplePath(options?.samplePath);
  const content = await readFile(samplePath, "utf8");
  const records = JSON.parse(content) as RawTransaction[];

  const inputDir = sharedDir(sharedRoot, "input");
  for (const record of records) {
    const envelope = createEnvelope(record, "orchestrator", "validator");
    await writeJson(
      path.join(inputDir, transactionFileName(record.transaction_id)),
      envelope,
    );
  }

  await runValidator(sharedRoot);
  await runFraudDetector(sharedRoot);
  const { summary } = await runCompliance(sharedRoot);

  const resultsDir = sharedDir(sharedRoot, "results");
  const files = await readdir(resultsDir);
  const txnFiles = files.filter(
    (f) => f.endsWith(".json") && f !== "pipeline-summary.json",
  );

  if (txnFiles.length !== records.length) {
    throw new Error(
      `Expected ${records.length} result files, found ${txnFiles.length}`,
    );
  }

  console.log("\nPipeline complete:");
  console.log(JSON.stringify(summary, null, 2));

  return summary;
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  runPipeline().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
