/**
 * BUG-001d (security): Renders user reason as HTML without sanitization.
 * Used with {@html} in the UI — XSS risk if reason contains script tags.
 */
export function formatReasonAsHtml(reason: string): string {
  return `<p class="reason-preview">${reason}</p>`;
}
