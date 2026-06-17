import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { nestCsvMetadata, parseCsv } from "../src/import/csv.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "fixtures");

describe("Task 3: CSV import parser", () => {
  it("parses valid CSV with header and data rows", () => {
    const csv = [
      "customer_id,customer_email,customer_name,subject,category,priority,status",
      "c1,user@example.com,Jane,Subject line,account_access,high,new",
    ].join("\n");

    const result = parseCsv(csv);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]?.customer_email).toBe("user@example.com");
    }
  });

  it("rejects empty CSV content", () => {
    const result = parseCsv("   \n  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/empty/i);
  });

  it("rejects CSV with header only and no data rows", () => {
    const result = parseCsv("customer_id,customer_email,customer_name,subject,category,priority,status");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/header row and at least one data row/i);
  });

  it("parses quoted scalar fields", () => {
    const csv = [
      "customer_id,subject",
      'c1,"Hello world"',
    ].join("\n");
    const result = parseCsv(csv);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]?.subject).toBe("Hello world");
  });

  it("splits tags using pipe or semicolon separators", () => {
    const csv = [
      "customer_id,tags",
      "c1,vip|billing;urgent",
    ].join("\n");
    const result = parseCsv(csv);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.rows[0]?.tags).toEqual(["vip", "billing", "urgent"]);
  });

  it("nests metadata.* columns into metadata object", () => {
    const csv = [
      "customer_id,metadata.source,metadata.device_type",
      "c1,web_form,desktop",
    ].join("\n");
    const parsed = parseCsv(csv);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const nested = nestCsvMetadata(parsed.rows);
    expect(nested[0]?.metadata).toEqual({ source: "web_form", device_type: "desktop" });
    expect(nested[0]?.customer_id).toBe("c1");
  });

  it("reads malformed fixture from disk as header-only failure", () => {
    const content = readFileSync(join(fixtures, "malformed.csv"), "utf8");
    const result = parseCsv(content);
    expect(result.ok).toBe(false);
  });
});
