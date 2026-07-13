import { describe, expect, it } from "vitest";
import { formatReasonAsHtml } from "../src/lib/reason-html.js";

describe("formatReasonAsHtml", () => {
  it("escapes HTML in user reason text", () => {
    const html = formatReasonAsHtml('<img src=x onerror="alert(1)">');
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).not.toContain('<img src=x onerror="alert(1)">');
  });

  it("escapes script tags in reason preview", () => {
    const html = formatReasonAsHtml("<script>alert('xss')</script>");
    expect(html).toBe(
      '<p class="reason-preview">&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;</p>',
    );
  });

  it("preserves plain text without markup", () => {
    const html = formatReasonAsHtml("Family trip");
    expect(html).toBe('<p class="reason-preview">Family trip</p>');
  });
});
