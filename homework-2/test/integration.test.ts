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
    customer_id: "cust_int",
    customer_email: "integration@example.com",
    customer_name: "Integration User",
    subject: "Placeholder subject",
    category: "other",
    priority: "medium",
    status: "new",
    ...overrides,
  };
}

describe("Task 5: Integration workflows", () => {
  it("complete ticket lifecycle: create → classify → update → resolve → delete", async () => {
    const store = createStore();
    const app = createApp(store);

    const createRes = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validCreateBody({
          subject: "Cannot login",
          description: "Password reset fails for my account credentials",
        }),
      ),
    });
    expect(createRes.status).toBe(201);
    const created = (await json(createRes)) as Ticket;
    expect(created.category).toBe("other");
    expect(created.classification_confidence).toBeNull();

    const classifyRes = await app.request(
      `http://localhost/tickets/${created.id}/auto-classify`,
      { method: "POST" },
    );
    expect(classifyRes.status).toBe(200);
    const classified = (await json(classifyRes)) as Ticket;
    expect(classified.category).toBe("account_access");
    expect(classified.classification_confidence).toBeGreaterThan(0);
    expect(classified.classification_keywords.length).toBeGreaterThan(0);

    const updateRes = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_to: "agent-42", status: "in_progress" }),
    });
    expect(updateRes.status).toBe(200);
    const updated = (await json(updateRes)) as Ticket;
    expect(updated.assigned_to).toBe("agent-42");
    expect(updated.status).toBe("in_progress");
    expect(updated.updated_at).not.toBe(created.updated_at);

    const resolveRes = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved", resolved_at: "2026-06-18T12:00:00.000Z" }),
    });
    expect(resolveRes.status).toBe(200);
    const resolved = (await json(resolveRes)) as Ticket;
    expect(resolved.status).toBe("resolved");
    expect(resolved.resolved_at).toBe("2026-06-18T12:00:00.000Z");

    const deleteRes = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "DELETE",
    });
    expect(deleteRes.status).toBe(204);

    const getRes = await app.request(`http://localhost/tickets/${created.id}`);
    expect(getRes.status).toBe(404);
    expect((await json(getRes)).error).toBe("Ticket not found");
  });

  it("bulk import with auto-classification verification", async () => {
    const store = createStore();
    const app = createApp(store);
    const payload = readFileSync(join(projectRoot, "sample_tickets.json"), "utf8");

    const res = await app.request(
      "http://localhost/tickets/import?format=json&auto_classify=true",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      },
    );
    expect(res.status).toBe(201);
    const summary = await json(res);
    expect(summary.total).toBe(20);
    expect(summary.successful).toBe(20);
    expect(summary.failed).toBe(0);

    const listRes = await app.request("http://localhost/tickets");
    const { tickets } = (await json(listRes)) as { tickets: Ticket[] };
    expect(tickets).toHaveLength(20);
    for (const ticket of tickets) {
      expect(typeof ticket.classification_confidence).toBe("number");
      expect(ticket.classification_reasoning).toBeTruthy();
    }
    expect(tickets.some((t) => t.classification_keywords.length > 0)).toBe(true);
    expect(store.getClassificationLog()).toHaveLength(20);
  });

  it("20+ concurrent app.request() operations without data corruption", async () => {
    const store = createStore();
    const app = createApp(store);
    const count = 25;

    const results = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        app.request("http://localhost/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validCreateBody({ customer_id: `conc_${i}` })),
        }),
      ),
    );

    for (const res of results) {
      expect(res.status).toBe(201);
    }

    const listRes = await app.request("http://localhost/tickets");
    const { tickets } = (await json(listRes)) as { tickets: Ticket[] };
    expect(tickets).toHaveLength(count);
    const ids = new Set(tickets.map((t) => t.id));
    expect(ids.size).toBe(count);
    expect(store.list()).toHaveLength(count);
  });

  it("combined GET /tickets filtering by category and priority", async () => {
    const app = createApp(createStore());

    const seeds = [
      { category: "bug_report", priority: "urgent" },
      { category: "bug_report", priority: "medium" },
      { category: "billing_question", priority: "urgent" },
      { category: "billing_question", priority: "low" },
    ] as const;

    for (const [i, seed] of seeds.entries()) {
      await app.request("http://localhost/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          validCreateBody({
            customer_id: `filter_${i}`,
            ...seed,
          }),
        ),
      });
    }

    const res = await app.request(
      "http://localhost/tickets?category=bug_report&priority=urgent",
    );
    expect(res.status).toBe(200);
    const { tickets } = (await json(res)) as { tickets: Ticket[] };
    expect(tickets).toHaveLength(1);
    expect(tickets[0].category).toBe("bug_report");
    expect(tickets[0].priority).toBe("urgent");
  });

  it("multipart import upload with file field and auto_classify flag", async () => {
    const store = createStore();
    const app = createApp(store);
    const csv = readFileSync(join(projectRoot, "sample_tickets.csv"), "utf8");

    const form = new FormData();
    form.append("file", new File([csv], "sample_tickets.csv", { type: "text/csv" }));
    form.append("auto_classify", "true");

    const res = await app.request("http://localhost/tickets/import", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(201);
    const summary = await json(res);
    expect(summary.total).toBe(50);
    expect(summary.successful).toBe(50);
    expect(summary.failed).toBe(0);

    const listRes = await app.request("http://localhost/tickets");
    const { tickets } = (await json(listRes)) as { tickets: Ticket[] };
    expect(tickets).toHaveLength(50);
    expect(tickets.every((t) => typeof t.classification_confidence === "number")).toBe(true);
    expect(store.getClassificationLog()).toHaveLength(50);
  });
});
