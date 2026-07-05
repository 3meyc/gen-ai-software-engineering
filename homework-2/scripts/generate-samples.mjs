import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const categories = [
  "account_access",
  "technical_issue",
  "billing_question",
  "feature_request",
  "bug_report",
  "other",
];
const priorities = ["urgent", "high", "medium", "low"];
const statuses = ["new", "in_progress", "waiting_customer", "resolved", "closed"];
const sources = ["web_form", "email", "api", "chat", "phone"];
const devices = ["desktop", "mobile", "tablet"];

function ticket(i) {
  const cat = categories[i % categories.length];
  const pri = priorities[i % priorities.length];
  const stat = statuses[i % statuses.length];
  return {
    customer_id: `cust_${String(i + 1).padStart(3, "0")}`,
    customer_email: `user${i + 1}@example.com`,
    customer_name: `Customer ${i + 1}`,
    subject: `Support request #${i + 1} regarding ${cat.replace("_", " ")}`,
    description: `Detailed description for ticket ${i + 1} with enough characters for validation.`,
    category: cat,
    priority: pri,
    status: stat,
    tags: [`tag${(i % 3) + 1}`, `batch-${Math.floor(i / 10) + 1}`],
    metadata: {
      source: sources[i % sources.length],
      browser: i % 2 === 0 ? "Chrome" : "Firefox",
      device_type: devices[i % devices.length],
    },
  };
}

function escapeCsv(value) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(count) {
  const headers = [
    "customer_id",
    "customer_email",
    "customer_name",
    "subject",
    "description",
    "category",
    "priority",
    "status",
    "tags",
    "metadata.source",
    "metadata.browser",
    "metadata.device_type",
  ];
  const rows = [headers.join(",")];
  for (let i = 0; i < count; i++) {
    const t = ticket(i);
    rows.push(
      [
        t.customer_id,
        t.customer_email,
        t.customer_name,
        t.subject,
        t.description,
        t.category,
        t.priority,
        t.status,
        t.tags.join("|"),
        t.metadata.source,
        t.metadata.browser,
        t.metadata.device_type,
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  writeFileSync(join(root, "sample_tickets.csv"), rows.join("\n"), "utf8");
}

function writeJson(count) {
  const data = Array.from({ length: count }, (_, i) => ticket(i));
  writeFileSync(join(root, "sample_tickets.json"), JSON.stringify(data, null, 2), "utf8");
}

function writeXml(count) {
  const tickets = Array.from({ length: count }, (_, i) => {
    const t = ticket(i);
    return `  <ticket>
    <customer_id>${t.customer_id}</customer_id>
    <customer_email>${t.customer_email}</customer_email>
    <customer_name>${t.customer_name}</customer_name>
    <subject>${t.subject}</subject>
    <description>${t.description}</description>
    <category>${t.category}</category>
    <priority>${t.priority}</priority>
    <status>${t.status}</status>
    <tags>
      ${t.tags.map((tag) => `<tag>${tag}</tag>`).join("\n      ")}
    </tags>
    <metadata>
      <source>${t.metadata.source}</source>
      <browser>${t.metadata.browser}</browser>
      <device_type>${t.metadata.device_type}</device_type>
    </metadata>
  </ticket>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n${tickets.join("\n")}\n</tickets>\n`;
  writeFileSync(join(root, "sample_tickets.xml"), xml, "utf8");
}

writeCsv(50);
writeJson(20);
writeXml(30);
console.log("Generated sample_tickets.csv (50), sample_tickets.json (20), sample_tickets.xml (30)");
