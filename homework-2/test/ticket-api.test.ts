import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, "fixtures");

function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

function validCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    customer_id: "cust_1",
    customer_email: "user@example.com",
    customer_name: "Jane Doe",
    subject: "Login issue",
    category: "account_access",
    priority: "high",
    status: "new",
    ...overrides,
  };
}

describe("Task 1: Ticket API", () => {
  it("POST /tickets creates ticket with server id and timestamps", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCreateBody({ id: "ignored" })),
    });

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.tags).toEqual([]);
    expect(body.description).toBe("");
  });

  it("POST /tickets rejects missing required fields", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer_id: "c1" }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe("Validation failed");
    expect(body.details).toBeDefined();
  });

  it("GET /tickets returns { tickets: [] }", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/tickets");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.tickets).toEqual([]);
  });

  it("GET /tickets filters with AND semantics", async () => {
    const store = createStore();
    const app = createApp(store);

    for (const [priority, category] of [
      ["high", "account_access"],
      ["low", "billing_question"],
      ["high", "billing_question"],
    ] as const) {
      await app.request("http://localhost/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validCreateBody({ priority, category })),
      });
    }

    const res = await app.request(
      "http://localhost/tickets?priority=high&category=account_access",
    );
    const body = await json(res);
    const tickets = body.tickets as Record<string, unknown>[];
    expect(tickets).toHaveLength(1);
    expect(tickets[0]?.priority).toBe("high");
    expect(tickets[0]?.category).toBe("account_access");
  });

  it("GET /tickets/:id returns 404 when missing", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/tickets/missing-id");
    expect(res.status).toBe(404);
    expect((await json(res)).error).toBe("Ticket not found");
  });

  it("PUT /tickets/:id applies partial update and bumps updated_at", async () => {
    const app = createApp(createStore());
    const createRes = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCreateBody()),
    });
    const created = await json(createRes);

    const res = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress", priority: "urgent" }),
    });
    expect(res.status).toBe(200);
    const updated = await json(res);
    expect(updated.status).toBe("in_progress");
    expect(updated.priority).toBe("urgent");
    expect(updated.customer_id).toBe(created.customer_id);
    expect(updated.updated_at).not.toBe(created.updated_at);
  });

  it("DELETE /tickets/:id returns 204", async () => {
    const app = createApp(createStore());
    const createRes = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validCreateBody()),
    });
    const created = await json(createRes);

    const delRes = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(204);
    expect(await delRes.text()).toBe("");

    const getRes = await app.request(`http://localhost/tickets/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it("POST /tickets/import JSON returns summary", async () => {
    const app = createApp(createStore());
    const payload = JSON.stringify([
      JSON.parse(readFileSync(join(fixtures, "valid-row.json"), "utf8")),
      { customer_id: "bad" },
    ]);

    const res = await app.request("http://localhost/tickets/import?format=json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.total).toBe(2);
    expect(body.successful).toBe(1);
    expect(body.failed).toBe(1);
    expect(body.errors).toHaveLength(1);
  });

  it("POST /tickets/import rejects malformed JSON with 400", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/tickets/import?format=json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    });
    expect(res.status).toBe(400);
    expect((await json(res)).error).toMatch(/JSON/i);
  });

  it("POST /tickets/import CSV", async () => {
    const app = createApp(createStore());
    const csv = [
      "customer_id,customer_email,customer_name,subject,category,priority,status",
      "c1,user@example.com,Jane,Subject line,account_access,high,new",
    ].join("\n");

    const res = await app.request("http://localhost/tickets/import?format=csv", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: csv,
    });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.successful).toBe(1);
  });

  it("POST /tickets/import XML", async () => {
    const app = createApp(createStore());
    const xml = `<?xml version="1.0"?>
<tickets>
  <ticket>
    <customer_id>c1</customer_id>
    <customer_email>user@example.com</customer_email>
    <customer_name>Jane</customer_name>
    <subject>Subject line</subject>
    <category>other</category>
    <priority>medium</priority>
    <status>new</status>
  </ticket>
</tickets>`;

    const res = await app.request("http://localhost/tickets/import?format=xml", {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: xml,
    });
    expect(res.status).toBe(201);
    expect((await json(res)).successful).toBe(1);
  });
});
