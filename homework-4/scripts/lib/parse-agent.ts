import { readFileSync } from "node:fs";
import { basename } from "node:path";

export interface AgentDefinition {
  name: string;
  description: string;
  model: string;
  skills: string[];
  readOnly: boolean;
  body: string;
  filePath: string;
}

function parseFrontmatter(raw: string): {
  meta: Record<string, unknown>;
  body: string;
} {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Agent file missing YAML frontmatter");
  }

  const [, yamlBlock, body] = match;
  const meta: Record<string, unknown> = {};

  let currentKey: string | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (currentKey) {
      meta[currentKey] = listItems;
      listItems = [];
      currentKey = null;
    }
  };

  for (const line of yamlBlock.split(/\r?\n/)) {
    const trimmed = line.trimEnd();
    const listMatch = trimmed.match(/^\s+-\s+(.+)$/);
    if (listMatch && currentKey) {
      listItems.push(listMatch[1].trim());
      continue;
    }

    const kvMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
    if (!kvMatch) continue;

    flushList();
    const [, key, value] = kvMatch;

    if (value === "" || value === "[]") {
      currentKey = key;
      listItems = [];
      if (value === "[]") {
        meta[key] = [];
        currentKey = null;
      }
      continue;
    }

    meta[key] = value.replace(/^["']|["']$/g, "");
  }

  flushList();
  return { meta, body: body.trim() };
}

export function parseAgentFile(filePath: string): AgentDefinition {
  const raw = readFileSync(filePath, "utf8");
  const { meta, body } = parseFrontmatter(raw);

  const name = String(meta.name ?? basename(filePath, ".agent.md"));
  const description = String(meta.description ?? "");
  const model = String(meta.model ?? "composer-2.5-fast");
  const skills = Array.isArray(meta.skills)
    ? (meta.skills as string[])
    : [];
  const readOnly =
    meta.readOnly === true || meta.readOnly === "true";

  if (!model) {
    throw new Error(`Agent ${name} missing model in frontmatter`);
  }

  return {
    name,
    description,
    model,
    skills,
    readOnly,
    body,
    filePath,
  };
}
