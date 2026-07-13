/**
 * Formats user reason as safe HTML for preview display.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatReasonAsHtml(reason: string): string {
  return `<p class="reason-preview">${escapeHtml(reason)}</p>`;
}
