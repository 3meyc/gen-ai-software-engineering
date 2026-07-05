import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseXmlImport } from "../src/import/xml.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "fixtures");

describe("Task 3: XML import parser", () => {
  it("parses multiple ticket elements under tickets root", () => {
    const xml = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>c1</customer_id>
    <subject>First</subject>
  </ticket>
  <ticket>
    <customer_id>c2</customer_id>
    <subject>Second</subject>
  </ticket>
</tickets>`;
    const result = parseXmlImport(xml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0]?.customer_id).toBe("c1");
    }
  });

  it("rejects empty XML content", () => {
    const result = parseXmlImport("  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/empty/i);
  });

  it("rejects XML without a tickets root element", () => {
    const result = parseXmlImport(readFileSync(join(fixtures, "malformed.xml"), "utf8"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/tickets/i);
  });

  it("parses tags and metadata child elements", () => {
    const xml = `<tickets>
  <ticket>
    <customer_id>c1</customer_id>
    <tags>
      <tag>vip</tag>
      <tag>billing</tag>
    </tags>
    <metadata>
      <source>email</source>
      <browser>Firefox</browser>
      <device_type>mobile</device_type>
    </metadata>
  </ticket>
</tickets>`;
    const result = parseXmlImport(xml);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]?.tags).toEqual(["vip", "billing"]);
      expect(result.rows[0]?.metadata).toEqual({
        source: "email",
        browser: "Firefox",
        device_type: "mobile",
      });
    }
  });

  it("rejects tickets root with no ticket elements", () => {
    const result = parseXmlImport(`<tickets>\n  <!-- empty -->\n</tickets>`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/no <ticket>/i);
  });
});
