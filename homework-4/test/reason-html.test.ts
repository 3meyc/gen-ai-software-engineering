import { describe, expect, it } from "vitest";
import { formatReasonAsHtml } from "../src/lib/reason-html.js";

describe("formatReasonAsHtml", () => {
  it("BUG-001d: embeds raw user text in HTML without escaping", () => {
    const html = formatReasonAsHtml('<img src=x onerror="alert(1)">');
    expect(html).toContain('<img src=x onerror="alert(1)">');
  });
});
