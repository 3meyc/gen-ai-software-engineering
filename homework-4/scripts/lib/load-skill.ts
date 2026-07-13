import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadSkills(
  workspaceRoot: string,
  skillPaths: string[],
): string {
  if (skillPaths.length === 0) {
    return "_No skills attached to this agent._";
  }

  const sections: string[] = [];

  for (const relPath of skillPaths) {
    const absPath = resolve(workspaceRoot, relPath);
    if (!existsSync(absPath)) {
      throw new Error(`Skill not found: ${relPath} (resolved: ${absPath})`);
    }
    const content = readFileSync(absPath, "utf8").trim();
    sections.push(`### ${relPath}\n\n${content}`);
  }

  return sections.join("\n\n---\n\n");
}
