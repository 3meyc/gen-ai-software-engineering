import { randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PipelineEnvelope, RawTransaction } from "../types.js";

const SHARED_DIRS = ["input", "processing", "output", "results"] as const;

export type SharedDir = (typeof SHARED_DIRS)[number];

export function getProjectRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "..", "..");
}

export function getSharedRoot(sharedRoot?: string): string {
  return sharedRoot ?? path.join(getProjectRoot(), "shared");
}

export function getSamplePath(samplePath?: string): string {
  return samplePath ?? path.join(getProjectRoot(), "sample-transactions.json");
}

export function sharedDir(sharedRoot: string, dir: SharedDir): string {
  return path.join(sharedRoot, dir);
}

export async function ensureSharedDirs(sharedRoot?: string): Promise<string> {
  const root = getSharedRoot(sharedRoot);
  for (const dir of SHARED_DIRS) {
    await mkdir(sharedDir(root, dir), { recursive: true });
  }
  return root;
}

export async function clearDir(sharedRoot: string, dir: SharedDir): Promise<void> {
  const dirPath = sharedDir(sharedRoot, dir);
  await mkdir(dirPath, { recursive: true });
  const entries = await readdir(dirPath);
  await Promise.all(
    entries
      .filter((name) => name !== ".gitkeep")
      .map((name) => rm(path.join(dirPath, name), { force: true })),
  );
}

export async function readJsonFiles<T>(dirPath: string): Promise<T[]> {
  await mkdir(dirPath, { recursive: true });
  const entries = await readdir(dirPath);
  const jsonFiles = entries.filter((name) => name.endsWith(".json"));
  const results: T[] = [];
  for (const file of jsonFiles) {
    const content = await readFile(path.join(dirPath, file), "utf8");
    results.push(JSON.parse(content) as T);
  }
  return results;
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

export function createEnvelope(
  raw: RawTransaction,
  sourceStage: string,
  targetStage: string,
): PipelineEnvelope {
  return {
    message_id: randomUUID(),
    timestamp: new Date().toISOString(),
    source_stage: sourceStage,
    target_stage: targetStage,
    message_type: "transaction",
    data: { ...raw },
  };
}

export function transactionFileName(transactionId: string): string {
  return `${transactionId}.json`;
}
