import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
import type { Ticket } from "../src/types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

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

describe("Task 5: Performance benchmarks", () => {
  it("creates 25 tickets sequentially without errors", async () => {
    const app = createApp(createStore());
    const start = performance.now();

    for (let i = 0; i < 25; i++) {
      const res = await app.request("http://localhost/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCreateBody({ customer_id: `cust_${i}` })),
      });
      expect(res.status).toBe(201);
    }

    const elapsed = performance.now() - start;
    console.log(`[perf] 25 sequential creates: ${elapsed.toFixed(1)}ms`);
  });

  it("imports sample_tickets.csv (50 rows) within acceptable time", async () => {
    const app = createApp(createStore());
    const csv = readFileSync(join(projectRoot, "sample_tickets.csv"), "utf8");
    const start = performance.now();

    const res = await app.request("http://localhost/tickets/import?format=csv", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csv,
    });

    const elapsed = performance.now() - start;
    console.log(`[perf] CSV import (50 rows): ${elapsed.toFixed(1)}ms`);

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.successful).toBe(50);
    expect(body.failed).toBe(0);
  });

  it("GET /tickets filter on large in-memory dataset", async () => {
    const app = createApp(createStore());

    for (let i = 0; i < 100; i++) {
      await app.request("http://localhost/tickets", {
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

    const start = performance.now();
    const res = await app.request(
      "http://localhost/tickets?category=bug_report&priority=urgent",
    );
    const elapsed = performance.now() - start;
    console.log(`[perf] filter query (100 tickets): ${elapsed.toFixed(1)}ms`);

    expect(res.status).toBe(200);
    const { tickets } = (await json(res)) as { tickets: Ticket[] };
    expect(tickets.length).toBeGreaterThan(0);
    for (const ticket of tickets) {
      expect(ticket.category).toBe("bug_report");
      expect(ticket.priority).toBe("urgent");
    }
  });

  it("concurrent auto-classify on multiple tickets", async () => {
    const app = createApp(createStore());
    const ids: string[] = [];

    for (let i = 0; i < 20; i++) {
      const res = await app.request("http://localhost/tickets", {
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
      const ticket = (await json(res)) as Ticket;
      ids.push(ticket.id);
    }

    const start = performance.now();
    const results = await Promise.all(
      ids.map((id) =>
        app.request(`http://localhost/tickets/${id}/auto-classify`, { method: "POST" }),
      ),
    );
    const elapsed = performance.now() - start;
    console.log(`[perf] 20 concurrent auto-classify: ${elapsed.toFixed(1)}ms`);

    for (const res of results) {
      expect(res.status).toBe(200);
      const body = (await json(res)) as Ticket;
      expect(body.classification_confidence).not.toBeNull();
    }
  });

  it("bulk JSON import performance baseline with sample_tickets.json", async () => {
    const app = createApp(createStore());
    const payload = readFileSync(join(projectRoot, "sample_tickets.json"), "utf8");
    const start = performance.now();

    const res = await app.request("http://localhost/tickets/import?format=json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const elapsed = performance.now() - start;
    console.log(`[perf] JSON import (20 rows): ${elapsed.toFixed(1)}ms`);

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.successful).toBe(20);
    expect(body.failed).toBe(0);
  });
});
