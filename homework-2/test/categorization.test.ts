import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import {
  classifyTicket,
  computeConfidence,
  CATEGORY_KEYWORDS,
} from "../src/classify.js";
import { createStore } from "../src/store.js";

function ticketText(subject: string, description = "") {
  return { subject, description, tags: [] as string[] };
}

function validCreateBody(overrides: Record<string, unknown> = {}) {
  return {
    customer_id: "cust_1",
    customer_email: "user@example.com",
    customer_name: "Jane Doe",
    subject: "Placeholder",
    category: "other",
    priority: "medium",
    status: "new",
    ...overrides,
  };
}

describe("Task 2: classifyTicket", () => {
  it("classifies account_access from login keywords", () => {
    const result = classifyTicket(
      ticketText("Cannot login", "Password reset fails for my account credentials"),
    );
    expect(result.category).toBe("account_access");
    expect(result.keywords_found.some((k) => k.includes("login") || k.includes("password"))).toBe(
      true,
    );
  });

  it("classifies bug_report when process broke or stopped", () => {
    const result = classifyTicket(
      ticketText("App crash", "The checkout flow completely broke and stopped working"),
    );
    expect(result.category).toBe("bug_report");
    expect(result.keywords_found.some((k) => ["bug", "broke", "crash", "stopped"].includes(k))).toBe(
      true,
    );
  });

  it("classifies technical_issue for minor non-critical issues", () => {
    const result = classifyTicket(
      ticketText("Minor issue", "Page is slow and has an intermittent glitch"),
    );
    expect(result.category).toBe("technical_issue");
    expect(result.keywords_found).toContain("issue");
  });

  it("classifies billing_question from payment keywords", () => {
    const result = classifyTicket(ticketText("Refund request", "I need a refund on my last invoice"));
    expect(result.category).toBe("billing_question");
  });

  it("classifies feature_request from enhancement keywords", () => {
    const result = classifyTicket(
      ticketText("Feature idea", "Would like a dark mode enhancement suggestion"),
    );
    expect(result.category).toBe("feature_request");
  });

  it("falls back to other when no keywords match", () => {
    const result = classifyTicket(ticketText("Hello", "Just saying hi to the team"));
    expect(result.category).toBe("other");
    expect(result.confidence).toBe(0.3);
  });

  it("picks urgent when urgent and low phrases both match", () => {
    const result = classifyTicket(
      ticketText("Critical outage", "This is critical with a minor cosmetic side effect"),
    );
    expect(result.priority).toBe("urgent");
  });

  it("assigns high priority for blocking phrases", () => {
    const result = classifyTicket(ticketText("Blocked", "This is blocking my work asap"));
    expect(result.priority).toBe("high");
  });

  it("defaults priority to medium without phrase matches", () => {
    const result = classifyTicket(ticketText("Question", "What are your office hours?"));
    expect(result.priority).toBe("medium");
  });

  it("maps confidence to documented tiers", () => {
    expect(computeConfidence("other", 0, 0)).toBe(0.3);
    expect(computeConfidence("account_access", 1, 0)).toBe(0.6);
    expect(computeConfidence("account_access", 3, 0)).toBe(0.95);
    expect(CATEGORY_KEYWORDS.account_access.length).toBeGreaterThan(5);
  });
});

describe("Task 2: API integration", () => {
  it("POST /tickets/:id/auto-classify returns 200 with full updated ticket", async () => {
    const store = createStore();
    const app = createApp(store);

    const createRes = await app.request("http://localhost/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validCreateBody({
          subject: "Login failed",
          description: "Cannot login with my password after reset",
        }),
      ),
    });
    const created = (await createRes.json()) as Record<string, unknown>;

    const res = await app.request(`http://localhost/tickets/${created.id}/auto-classify`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.category).toBe("account_access");
    expect(body.classification_confidence).toBeGreaterThan(0);
    expect(body.classification_reasoning).toBeTruthy();
    expect(Array.isArray(body.classification_keywords)).toBe(true);
  });

  it("auto_classify on create overwrites category and priority", async () => {
    const store = createStore();
    const app = createApp(store);

    const res = await app.request("http://localhost/tickets?auto_classify=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validCreateBody({
          subject: "Payment issue",
          description: "Need refund on duplicate invoice charge",
          category: "other",
          priority: "low",
        }),
      ),
    });
    const body = await res.json();
    expect(body.category).toBe("billing_question");
    expect(body.classification_confidence).toBeTruthy();
    expect(store.getClassificationLog()).toHaveLength(1);
  });

  it("manual PUT category clears classification metadata", async () => {
    const app = createApp(createStore());
    const createRes = await app.request("http://localhost/tickets?auto_classify=true", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        validCreateBody({
          subject: "Login issue",
          description: "password reset broken",
        }),
      ),
    });
    const created = (await createRes.json()) as Record<string, unknown>;

    const putRes = await app.request(`http://localhost/tickets/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: "other" }),
    });
    const updated = await putRes.json();
    expect(updated.category).toBe("other");
    expect(updated.classification_confidence).toBeNull();
    expect(updated.classification_keywords).toEqual([]);
  });
});
