import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type {
  PipelineEnvelope,
  RawTransaction,
  RejectionResult,
  ValidationResult,
} from "../types.js";
import { logAudit } from "./audit-log.js";
import { REQUIRED_FIELDS } from "./constants.js";
import {
  createEnvelope,
  getSamplePath,
  getSharedRoot,
  readJsonFiles,
  sharedDir,
  transactionFileName,
  writeJson,
} from "./fs-utils.js";
import { isValidCurrency, parseAmount } from "./money.js";

function isIso8601Timestamp(value: string): boolean {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function processTransaction(
  record: RawTransaction,
  options?: { dryRun?: boolean },
): ValidationResult {
  for (const field of REQUIRED_FIELDS) {
    const value = record[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      const rejection: RejectionResult = {
        transaction_id: record.transaction_id ?? "unknown",
        status: "rejected",
        final_status: "rejected",
        reason: `Missing required field: ${field}`,
        stage: "validator",
      };
      if (!options?.dryRun) {
        logAudit("validator", rejection.transaction_id, rejection.reason);
      }
      return { ok: false, rejection };
    }
  }

  const amount = parseAmount(record.amount);
  if (!amount || !amount.gt(0)) {
    const rejection: RejectionResult = {
      transaction_id: record.transaction_id,
      status: "rejected",
      final_status: "rejected",
      reason: "Invalid amount",
      stage: "validator",
    };
    if (!options?.dryRun) {
      logAudit("validator", rejection.transaction_id, rejection.reason);
    }
    return { ok: false, rejection };
  }

  if (!isValidCurrency(record.currency)) {
    const rejection: RejectionResult = {
      transaction_id: record.transaction_id,
      status: "rejected",
      final_status: "rejected",
      reason: "Invalid currency code",
      stage: "validator",
    };
    if (!options?.dryRun) {
      logAudit("validator", rejection.transaction_id, rejection.reason);
    }
    return { ok: false, rejection };
  }

  if (!isIso8601Timestamp(record.timestamp)) {
    const rejection: RejectionResult = {
      transaction_id: record.transaction_id,
      status: "rejected",
      final_status: "rejected",
      reason: "Invalid timestamp format",
      stage: "validator",
    };
    if (!options?.dryRun) {
      logAudit("validator", rejection.transaction_id, rejection.reason);
    }
    return { ok: false, rejection };
  }

  const envelope = createEnvelope(record, "validator", "fraud_detector");
  envelope.data.status = "validated";

  if (!options?.dryRun) {
    logAudit("validator", record.transaction_id, "validated");
  }

  return { ok: true, envelope };
}

export async function runValidator(sharedRoot?: string): Promise<{
  valid: PipelineEnvelope[];
  rejected: RejectionResult[];
}> {
  const root = getSharedRoot(sharedRoot);
  const inputDir = sharedDir(root, "input");
  const outputDir = sharedDir(root, "output");
  const resultsDir = sharedDir(root, "results");
  const processingDir = sharedDir(root, "processing");

  const envelopes = await readJsonFiles<PipelineEnvelope>(inputDir);
  const valid: PipelineEnvelope[] = [];
  const rejected: RejectionResult[] = [];

  for (const envelope of envelopes) {
    const processingPath = path.join(
      processingDir,
      transactionFileName(envelope.data.transaction_id),
    );
    await writeJson(processingPath, envelope);

    const result = processTransaction(envelope.data);
    if (result.ok) {
      valid.push(result.envelope);
      await writeJson(
        path.join(outputDir, transactionFileName(envelope.data.transaction_id)),
        result.envelope,
      );
    } else {
      rejected.push(result.rejection);
      await writeJson(
        path.join(resultsDir, transactionFileName(result.rejection.transaction_id)),
        result.rejection,
      );
    }
  }

  return { valid, rejected };
}

async function runDryRun(): Promise<void> {
  const samplePath = getSamplePath();
  const content = await readFile(samplePath, "utf8");
  const records = JSON.parse(content) as RawTransaction[];

  console.log("\nValidation dry-run results:\n");
  console.log(
    "| transaction_id | valid | reason |",
  );
  console.log("|----------------|-------|--------|");

  let validCount = 0;
  let invalidCount = 0;

  for (const record of records) {
    const result = processTransaction(record, { dryRun: true });
    if (result.ok) {
      validCount += 1;
      console.log(`| ${record.transaction_id} | yes | — |`);
    } else {
      invalidCount += 1;
      console.log(`| ${record.transaction_id} | no | ${result.rejection.reason} |`);
    }
  }

  console.log(`\nTotal: ${records.length}, valid: ${validCount}, invalid: ${invalidCount}\n`);
}

const isMain =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  if (process.argv.includes("--dry-run")) {
    runDryRun().catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    runValidator()
      .then(({ valid, rejected }) => {
        console.log(`Validator complete: ${valid.length} valid, ${rejected.length} rejected`);
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}
