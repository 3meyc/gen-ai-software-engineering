import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { ensureSharedDirs } from "../../src/pipeline/fs-utils.js";

export type TmpShared = {
  sharedRoot: string;
  cleanup: () => Promise<void>;
};

export async function createTmpShared(): Promise<TmpShared> {
  const sharedRoot = await mkdtemp(path.join(os.tmpdir(), "hw6-pipeline-"));
  await ensureSharedDirs(sharedRoot);
  return {
    sharedRoot,
    cleanup: () => rm(sharedRoot, { recursive: true, force: true }),
  };
}
