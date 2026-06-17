import { describe, expect, it } from "vitest";
import { finalizeTicket, filterTickets } from "../src/ticket-logic.js";
import type { Ticket } from "../src/types.js";
import { parseTicketRecord } from "../src/validation.js";

function validRecord(overrides: Record<string, unknown> = {}) {
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

function baseTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    customer_id: "cust_1",
    customer_email: "user@example.com",
    customer_name: "Jane Doe",
    subject: "Login issue",
    description: "",
    category: "account_access",
    priority: "high",
    status: "new",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    resolved_at: null,
    assigned_to: null,
    tags: [],
    metadata: {},
    classification_confidence: null,
    classification_reasoning: null,
    classification_keywords: [],
    ...overrides,
  };
}

describe("Task 3: Ticket model validation", () => {
  it("accepts a valid full create record", () => {
    const result = parseTicketRecord(validRecord({ description: "Cannot log in after reset." }), {
      partial: false,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fields.customer_email).toBe("user@example.com");
      expect(result.fields.description).toBe("Cannot log in after reset.");
    }
  });

  it("rejects missing required fields on create", () => {
    const result = parseTicketRecord({ customer_id: "c1" }, { partial: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("Validation failed");
      expect(result.details.some((d) => d.field === "customer_email")).toBe(true);
      expect(result.details.some((d) => d.field === "category")).toBe(true);
    }
  });

  it("rejects invalid email format", () => {
    const result = parseTicketRecord(validRecord({ customer_email: "not-an-email" }), {
      partial: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.details).toContainEqual({
        field: "customer_email",
        message: "Invalid email format",
      });
    }
  });

  it("rejects subject length violations", () => {
    const empty = parseTicketRecord(validRecord({ subject: "" }), { partial: false });
    expect(empty.ok).toBe(false);

    const tooLong = parseTicketRecord(validRecord({ subject: "x".repeat(201) }), {
      partial: false,
    });
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) {
      expect(tooLong.details.some((d) => d.field === "subject")).toBe(true);
    }
  });

  it("rejects description shorter than 10 characters when provided", () => {
    const result = parseTicketRecord(validRecord({ description: "short" }), { partial: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.details).toContainEqual({
        field: "description",
        message: "Must be 10-2000 characters when provided",
      });
    }
  });

  it("rejects invalid enum values for category, priority, and status", () => {
    const result = parseTicketRecord(
      validRecord({ category: "invalid_cat", priority: "super", status: "open" }),
      { partial: false },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.details.map((d) => d.field)).toEqual(
        expect.arrayContaining(["category", "priority", "status"]),
      );
    }
  });

  it("partial update validates only fields present in body", () => {
    const existing = baseTicket();
    const result = parseTicketRecord({ status: "in_progress" }, { partial: true, existing });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fields.status).toBe("in_progress");
      expect(result.fields.customer_id).toBe(existing.customer_id);
    }
  });

  it("parses tags from array or comma-separated string", () => {
    const fromArray = parseTicketRecord(validRecord({ tags: ["a", "b"] }), { partial: false });
    expect(fromArray.ok).toBe(true);
    if (fromArray.ok) expect(fromArray.fields.tags).toEqual(["a", "b"]);

    const fromString = parseTicketRecord(validRecord({ tags: "x, y; z" }), { partial: false });
    expect(fromString.ok).toBe(true);
    if (fromString.ok) expect(fromString.fields.tags).toEqual(["x", "y", "z"]);
  });

  it("validates metadata and merges on partial update", () => {
    const create = parseTicketRecord(
      validRecord({
        metadata: { source: "web_form", browser: "Chrome", device_type: "desktop" },
      }),
      { partial: false },
    );
    expect(create.ok).toBe(true);

    const existing = baseTicket({ metadata: { source: "api", browser: "Safari" } });
    const merged = parseTicketRecord(
      { metadata: { device_type: "mobile" } },
      { partial: true, existing },
    );
    expect(merged.ok).toBe(true);
    if (merged.ok) {
      expect(merged.fields.metadata).toEqual({
        source: "api",
        browser: "Safari",
        device_type: "mobile",
      });
    }

    const badMeta = parseTicketRecord(validRecord({ metadata: { source: "invalid" } }), {
      partial: false,
    });
    expect(badMeta.ok).toBe(false);
  });
});

describe("Task 3: ticket-logic helpers", () => {
  it("finalizeTicket assigns id, timestamps, and default classification fields", () => {
    const fields = parseTicketRecord(validRecord(), { partial: false });
    expect(fields.ok).toBe(true);
    if (!fields.ok) return;

    const ticket = finalizeTicket(fields.fields);
    expect(ticket.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(ticket.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(ticket.classification_confidence).toBeNull();
    expect(ticket.classification_keywords).toEqual([]);
  });

  it("filterTickets applies AND semantics including tags", () => {
    const tickets = [
      baseTicket({ id: "a", tags: ["vip", "billing"], category: "billing_question" }),
      baseTicket({ id: "b", tags: ["vip"], category: "billing_question" }),
    ];
    const params = new URLSearchParams("tags=vip,billing&category=billing_question");
    const result = filterTickets(tickets, params);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.tickets).toHaveLength(1);
      expect(result.tickets[0]?.id).toBe("a");
    }
  });
});
