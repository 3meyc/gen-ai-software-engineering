import { describe, expect, it } from "vitest";
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

/**
 * Performance benchmarks are expanded in Task 5.
 * Task 3 stubs assert correctness under light load; timings are logged only.
 */
describe("Task 3/5: Performance benchmarks (stubbed until Task 5)", () => {
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

  it.todo("import sample_tickets.csv (50 rows) within acceptable time");
  it.todo("GET /tickets filter on large in-memory dataset");
  it.todo("concurrent auto-classify on multiple tickets");
  it.todo("bulk JSON import performance baseline with sample_tickets.json");
});
