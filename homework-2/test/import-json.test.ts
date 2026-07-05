import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { detectFormat, parseImportFile } from "../src/import/index.js";
import { parseJsonImport } from "../src/import/json.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "fixtures");

describe("Task 3: JSON import parser", () => {
  it("parses a top-level array of ticket objects", () => {
    const payload = JSON.stringify([
      { customer_id: "c1", subject: "A" },
      { customer_id: "c2", subject: "B" },
    ]);
    const result = parseJsonImport(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(2);
  });

  it("parses { tickets: [...] } wrapper object", () => {
    const payload = JSON.stringify({
      tickets: [{ customer_id: "c1" }, { customer_id: "c2" }],
    });
    const result = parseJsonImport(payload);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows).toHaveLength(2);
  });

  it("rejects malformed JSON", () => {
    const result = parseJsonImport(readFileSync(join(fixtures, "malformed.json"), "utf8"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/invalid json/i);
  });

  it("rejects arrays that contain non-objects", () => {
    const result = parseJsonImport(JSON.stringify([{ customer_id: "c1" }, "bad"]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/only objects/i);
  });

  it("parses a single ticket object as one row", () => {
    const result = parseJsonImport(JSON.stringify({ customer_id: "solo" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.customer_id).toBe("solo");
    }
  });
});

describe("Task 3: import format detection", () => {
  it("detectFormat resolves from query hint, content-type, and extension", () => {
    expect(detectFormat("json", undefined, undefined)).toBe("json");
    expect(detectFormat(undefined, "text/csv", undefined)).toBe("csv");
    expect(detectFormat(undefined, undefined, "export.xml")).toBe("xml");
    expect(detectFormat(undefined, undefined, undefined)).toBeUndefined();
  });

  it("parseImportFile routes csv through metadata nesting", () => {
    const csv = "customer_id,metadata.source\nc1,api\n";
    const result = parseImportFile("csv", csv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.metadata).toEqual({ source: "api" });
    }
  });
});
