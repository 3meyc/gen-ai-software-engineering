import { readFileSync } from "node:fs";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

function validCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    customer_id: "cust_perf",
    customer_email: "perf@example.com",
    customer_name: "Perf User",
    subject: "Performance smoke subject",
    category: "other",
    priority: "medium",
    status: "new",
    ...overrides,
  };
}

async function bench(name: string, fn: () => Promise<void>) {
  const start = performance.now();
  await fn();
  const ms = performance.now() - start;
  console.log(`${name}: ${ms.toFixed(1)}ms`);
  return ms;
}

const app = createApp(createStore());

await bench("25 sequential POST /tickets", async () => {
  for (let i = 0; i < 25; i++) {
    const res = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCreateBody({ customer_id: `cust_${i}` })),
    });
    if (res.status !== 201) throw new Error(`create ${i} failed: ${res.status}`);
  }
});

const csvApp = createApp(createStore());
const csv = readFileSync("sample_tickets.csv", "utf8");
await bench("Import sample_tickets.csv (50 rows)", async () => {
  const res = await csvApp.request("http://localhost/tickets/import?format=csv", {
    method: "POST",
    headers: { "Content-Type": "text/csv" },
    body: csv,
  });
  const body = await res.json();
  if (res.status !== 201 || body.successful !== 50) throw new Error(JSON.stringify(body));
});

const jsonApp = createApp(createStore());
const json = readFileSync("sample_tickets.json", "utf8");
await bench("Import sample_tickets.json (20 rows)", async () => {
  const res = await jsonApp.request("http://localhost/tickets/import?format=json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: json,
  });
  const body = await res.json();
  if (res.status !== 201 || body.successful !== 20) throw new Error(JSON.stringify(body));
});

const xmlApp = createApp(createStore());
const xml = readFileSync("sample_tickets.xml", "utf8");
await bench("Import sample_tickets.xml (30 rows)", async () => {
  const res = await xmlApp.request("http://localhost/tickets/import?format=xml", {
    method: "POST",
    headers: { "Content-Type": "application/xml" },
    body: xml,
  });
  const body = await res.json();
  if (res.status !== 201 || body.successful !== 30) throw new Error(JSON.stringify(body));
});

const filterApp = createApp(createStore());
for (let i = 0; i < 100; i++) {
  await filterApp.request("http://localhost/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      validCreateBody({
        customer_id: `cust_${i}`,
        category: i % 2 === 0 ? "bug_report" : "billing_question",
        priority: i % 3 === 0 ? "urgent" : "medium",
      }),
    ),
  });
}
await bench("GET /tickets?category=bug_report&priority=urgent (100 tickets)", async () => {
  const res = await filterApp.request(
    "http://localhost/tickets?category=bug_report&priority=urgent",
  );
  if (res.status !== 200) throw new Error(`filter failed: ${res.status}`);
});

const classifyApp = createApp(createStore());
const ids: string[] = [];
for (let i = 0; i < 20; i++) {
  const res = await classifyApp.request("http://localhost/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      validCreateBody({
        customer_id: `cls_${i}`,
        subject: "Login password locked out",
        description: "Cannot access account critical issue",
      }),
    ),
  });
  const t = await res.json();
  ids.push(t.id);
}
await bench("20 concurrent POST /tickets/:id/auto-classify", async () => {
  await Promise.all(
    ids.map((id) =>
      classifyApp.request(`http://localhost/tickets/${id}/auto-classify`, { method: "POST" }),
    ),
  );
});

const concurrentApp = createApp(createStore());
await bench("25 concurrent POST /tickets", async () => {
  await Promise.all(
    Array.from({ length: 25 }, (_, i) =>
      concurrentApp.request("http://localhost/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCreateBody({ customer_id: `conc_${i}` })),
      }),
    ),
  );
});
