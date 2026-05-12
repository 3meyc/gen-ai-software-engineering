import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { balancesForAccount } from "../src/balance.js";
import { createStore } from "../src/store.js";
import type { Transaction, TransactionStatus } from "../src/types.js";

function json(res: Response) {
  return res.json() as Promise<Record<string, unknown>>;
}

describe("Task 1 API", () => {
  it("POST /transactions uses client status and server-generated id and timestamp", async () => {
    const store = createStore();
    const app = createApp(store);

    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-A",
        toAccount: "ACC-B",
        amount: 10,
        currency: "USD",
        type: "transfer",
        id: "ignored",
        timestamp: "2020-01-01T00:00:00Z",
        status: "completed",
      }),
    });

    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.id).toMatch(/^txn_[a-f0-9]+$/);
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(body.status).toBe("completed");
    expect(body.fromAccount).toBe("ACC-A");
    expect(body.toAccount).toBe("ACC-B");
    expect(body.amount).toBe(10);
    expect(body.currency).toBe("USD");
    expect(body.type).toBe("transfer");
  });

  it("rejects invalid status", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-1",
        toAccount: "ACC-2",
        amount: 1,
        currency: "USD",
        type: "transfer",
        status: "unknown",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects missing status", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-SRC",
        toAccount: "ACC-X",
        amount: 1,
        currency: "USD",
        type: "deposit",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects non-positive amount", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-SRC",
        toAccount: "ACC-X",
        amount: 0,
        currency: "USD",
        type: "deposit",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe("Validation failed");
    expect(Array.isArray(body.details)).toBe(true);
  });

  it("deposit requires toAccount", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-SRC",
        amount: 5,
        currency: "EUR",
        type: "deposit",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
  });

  it("withdrawal requires fromAccount", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toAccount: "ACC-X",
        amount: 5,
        currency: "USD",
        type: "withdrawal",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect((body.details as { field: string }[]).some((d) => d.field === "fromAccount")).toBe(true);
  });

  it("GET /transactions/:id returns a single row", async () => {
    const store = createStore();
    const app = createApp(store);

    const post = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-ORIGIN",
        toAccount: "ACC-Z",
        amount: 7.5,
        currency: "JPY",
        type: "deposit",
        status: "pending",
      }),
    });
    const created = (await post.json()) as { id: string };

    const get = await app.request(`http://localhost/transactions/${created.id}`);
    expect(get.status).toBe(200);
    const row = (await get.json()) as { id: string; type: string };
    expect(row.id).toBe(created.id);
    expect(row.type).toBe("deposit");
  });

  it("GET /transactions lists created rows", async () => {
    const store = createStore();
    const app = createApp(store);

    await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-A",
        toAccount: "ACC-B",
        amount: 1,
        currency: "USD",
        type: "transfer",
        status: "pending",
      }),
    });

    const list = await app.request("http://localhost/transactions");
    expect(list.status).toBe(200);
    const body = (await list.json()) as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(1);
  });

  it("GET /transactions/:id returns 404 for unknown id", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions/txn_missing");
    expect(res.status).toBe(404);
  });

  it("GET /accounts/:accountId/balance aggregates completed transactions per currency", async () => {
    const store = createStore();
    const app = createApp(store);

    const base: Omit<Transaction, "id" | "timestamp" | "status"> = {
      fromAccount: "",
      toAccount: "ACC-1",
      amount: 100,
      currency: "USD",
      type: "deposit",
    };

    store.add({
      ...base,
      id: "t1",
      timestamp: "2026-01-01T00:00:00.000Z",
      status: "completed",
    });

    store.add({
      ...base,
      id: "t2",
      toAccount: "ACC-1",
      amount: 50,
      currency: "EUR",
      timestamp: "2026-01-02T00:00:00.000Z",
      status: "completed",
    });

    store.add({
      ...base,
      id: "t3",
      toAccount: "ACC-1",
      amount: 999,
      currency: "USD",
      timestamp: "2026-01-03T00:00:00.000Z",
      status: "pending",
    });

    const res = await app.request("http://localhost/accounts/ACC-1/balance");
    expect(res.status).toBe(200);
    const body = await json(res);
    expect(body.accountId).toBe("ACC-1");
    expect(body.balances).toEqual({ USD: 100, EUR: 50 });
  });

  it("POST-created pending transfer does not change balance until completed", async () => {
    const store = createStore();
    const app = createApp(store);

    await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-X",
        toAccount: "ACC-Y",
        amount: 25,
        currency: "GBP",
        type: "transfer",
        status: "pending",
      }),
    });

    const res = await app.request("http://localhost/accounts/ACC-X/balance");
    const body = await json(res);
    expect(body.balances).toEqual({});
  });
});

describe("Task 2 validation", () => {
  it("rejects invalid account format with details", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "WRONG-1",
        toAccount: "ACC-2",
        amount: 1,
        currency: "USD",
        type: "transfer",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe("Validation failed");
    const details = body.details as { field: string; message: string }[];
    expect(details.some((d) => d.field === "fromAccount")).toBe(true);
  });

  it("rejects amount with more than two decimal places", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-1",
        toAccount: "ACC-2",
        amount: 1.001,
        currency: "USD",
        type: "transfer",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    const details = body.details as { field: string }[];
    expect(details.some((d) => d.field === "amount")).toBe(true);
  });

  it("rejects invalid ISO 4217 currency code", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-1",
        toAccount: "ACC-2",
        amount: 10,
        currency: "QQQ",
        type: "transfer",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    const details = body.details as { field: string; message: string }[];
    expect(details.find((d) => d.field === "currency")?.message).toContain("Invalid");
  });

  it("accepts a less common valid ISO 4217 code", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "ACC-1",
        toAccount: "ACC-2",
        amount: 1,
        currency: "chf",
        type: "transfer",
        status: "pending",
      }),
    });
    expect(res.status).toBe(201);
    const body = await json(res);
    expect(body.currency).toBe("CHF");
  });

  it("returns multiple validation details when several fields are invalid", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fromAccount: "bad",
        toAccount: "",
        amount: -1,
        currency: "NOT",
        type: "wire",
        status: "maybe",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe("Validation failed");
    const fields = new Set((body.details as { field: string }[]).map((d) => d.field));
    expect(fields.has("type")).toBe(true);
    expect(fields.has("status")).toBe(true);
    expect(fields.has("amount")).toBe(true);
    expect(fields.has("currency")).toBe(true);
    expect(fields.has("fromAccount")).toBe(true);
    expect(fields.has("toAccount")).toBe(true);
  });
});

describe("Task 3 GET /transactions filters", () => {
  function seedTask3Store() {
    const store = createStore();
    const base = {
      amount: 1,
      currency: "USD",
      status: "completed" as const,
    };
    store.add({
      ...base,
      id: "t-from",
      fromAccount: "ACC-ALICE",
      toAccount: "ACC-BOB",
      type: "transfer",
      timestamp: "2024-01-01T12:00:00.000Z",
    });
    store.add({
      ...base,
      id: "t-to",
      fromAccount: "ACC-CAROL",
      toAccount: "ACC-ALICE",
      type: "deposit",
      timestamp: "2024-01-31T23:59:59.999Z",
    });
    store.add({
      ...base,
      id: "t-outside",
      fromAccount: "ACC-X",
      toAccount: "ACC-Y",
      type: "withdrawal",
      timestamp: "2024-02-01T00:00:00.000Z",
    });
    store.add({
      ...base,
      id: "t-edge-start",
      fromAccount: "ACC-EDGE",
      toAccount: "ACC-Z",
      type: "transfer",
      timestamp: "2024-01-01T00:00:00.000Z",
    });
    store.add({
      ...base,
      id: "t-edge-end",
      fromAccount: "ACC-EDGE",
      toAccount: "ACC-Z",
      type: "transfer",
      timestamp: "2024-01-31T23:59:59.999Z",
    });
    return store;
  }

  it("returns full list when no query params", async () => {
    const store = seedTask3Store();
    const app = createApp(store);
    const res = await app.request("http://localhost/transactions");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string }[];
    expect(body.map((x) => x.id).sort()).toEqual(
      ["t-edge-end", "t-edge-start", "t-from", "t-outside", "t-to"].sort(),
    );
  });

  it("filters by accountId against both fromAccount and toAccount", async () => {
    const store = seedTask3Store();
    const app = createApp(store);
    const res = await app.request("http://localhost/transactions?accountId=ACC-ALICE");
    expect(res.status).toBe(200);
    const ids = ((await res.json()) as { id: string }[]).map((x) => x.id).sort();
    expect(ids).toEqual(["t-from", "t-to"].sort());
  });

  it("filters by type", async () => {
    const store = seedTask3Store();
    const app = createApp(store);
    const res = await app.request("http://localhost/transactions?type=transfer");
    expect(res.status).toBe(200);
    const ids = ((await res.json()) as { id: string }[]).map((x) => x.id).sort();
    expect(ids).toEqual(["t-edge-end", "t-edge-start", "t-from"].sort());
  });

  it("filters by inclusive UTC calendar day range on timestamp", async () => {
    const store = seedTask3Store();
    const app = createApp(store);
    const res = await app.request(
      "http://localhost/transactions?from=2024-01-01&to=2024-01-31",
    );
    expect(res.status).toBe(200);
    const ids = ((await res.json()) as { id: string }[]).map((x) => x.id).sort();
    expect(ids).not.toContain("t-outside");
    expect(ids).toEqual(["t-edge-end", "t-edge-start", "t-from", "t-to"].sort());
  });

  it("combines filters with AND semantics", async () => {
    const store = seedTask3Store();
    const app = createApp(store);
    const res = await app.request(
      "http://localhost/transactions?accountId=ACC-ALICE&type=deposit&from=2024-01-01&to=2024-01-31",
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string }[];
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("t-to");
  });

  it("returns 400 for invalid type query", async () => {
    const app = createApp(seedTask3Store());
    const res = await app.request("http://localhost/transactions?type=wire");
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBe("Validation failed");
  });

  it("returns 400 for invalid from date", async () => {
    const app = createApp(seedTask3Store());
    const res = await app.request("http://localhost/transactions?from=2024-02-30");
    expect(res.status).toBe(400);
    const body = await json(res);
    const details = body.details as { field: string }[];
    expect(details.some((d) => d.field === "from")).toBe(true);
  });
});

describe("balancesForAccount", () => {
  it("applies withdrawal to fromAccount", () => {
    const txs: Transaction[] = [
      {
        id: "w1",
        fromAccount: "ACC-W",
        toAccount: "",
        amount: 30,
        currency: "USD",
        type: "withdrawal",
        timestamp: "2026-01-01T00:00:00.000Z",
        status: "completed",
      },
    ];
    expect(balancesForAccount("ACC-W", txs)).toEqual({ USD: -30 });
  });

  it("applies transfer to both legs", () => {
    const txs: Transaction[] = [
      {
        id: "x1",
        fromAccount: "A",
        toAccount: "B",
        amount: 40,
        currency: "USD",
        type: "transfer",
        timestamp: "2026-01-01T00:00:00.000Z",
        status: "completed",
      },
    ];
    expect(balancesForAccount("A", txs)).toEqual({ USD: -40 });
    expect(balancesForAccount("B", txs)).toEqual({ USD: 40 });
  });
});

describe("Task 4", () => {
  it("GET /accounts/:accountId/summary returns type × status counts for from/to scope", async () => {
    const store = createStore();
    store.add({
      id: "s1",
      fromAccount: "ACC-HUB",
      toAccount: "ACC-A",
      amount: 1,
      currency: "USD",
      type: "deposit",
      timestamp: "2026-01-01T00:00:00.000Z",
      status: "completed",
    });
    store.add({
      id: "s2",
      fromAccount: "ACC-B",
      toAccount: "ACC-HUB",
      amount: 2,
      currency: "USD",
      type: "transfer",
      timestamp: "2026-01-02T00:00:00.000Z",
      status: "pending",
    });
    store.add({
      id: "s3",
      fromAccount: "ACC-X",
      toAccount: "ACC-Y",
      amount: 3,
      currency: "EUR",
      type: "withdrawal",
      timestamp: "2026-01-03T00:00:00.000Z",
      status: "failed",
    });

    const app = createApp(store);
    const res = await app.request("http://localhost/accounts/ACC-HUB/summary");
    expect(res.status).toBe(200);
    const body = (await json(res)) as {
      summary: Record<string, Record<string, { count: number; amount: number }>>;
      mostRecentTransactionDate: string | null;
    };
    expect(body.summary.deposit.completed).toEqual({ count: 1, amount: 1 });
    expect(body.summary.deposit.pending).toEqual({ count: 0, amount: 0 });
    expect(body.summary.transfer.pending).toEqual({ count: 1, amount: 2 });
    expect(body.summary.withdrawal.pending).toEqual({ count: 0, amount: 0 });
    expect(body.mostRecentTransactionDate).toBe("2026-01-02T00:00:00.000Z");
  });

  it("GET /accounts/:accountId/interest uses annual formula on /balance balances", async () => {
    const store = createStore();
    store.add({
      id: "i1",
      fromAccount: "ACC-OUT",
      toAccount: "ACC-Z",
      amount: 100,
      currency: "USD",
      type: "deposit",
      timestamp: "2026-01-01T00:00:00.000Z",
      status: "completed",
    });
    const app = createApp(store);
    const res = await app.request(
      "http://localhost/accounts/ACC-Z/interest?rate=0.05&days=365",
    );
    expect(res.status).toBe(200);
    const body = (await json(res)) as { interest: Record<string, number> };
    expect(body.interest.USD).toBeCloseTo(5, 5);
  });

  it("GET /accounts/:accountId/interest returns 400 when query is invalid", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/accounts/ACC-Z/interest");
    expect(res.status).toBe(400);
  });

  it("GET /transactions/export?format=csv returns UTF-8 CSV with headers and Content-Disposition", async () => {
    const store = createStore();
    store.add({
      id: "e1",
      fromAccount: "ACC-1",
      toAccount: "ACC-2",
      amount: 10.5,
      currency: "USD",
      type: "transfer",
      timestamp: "2026-05-12T14:35:22.000Z",
      status: "pending",
    });
    const app = createApp(store);
    const res = await app.request("http://localhost/transactions/export?format=csv");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toMatch(/text\/csv/i);
    expect(res.headers.get("Content-Type")).toMatch(/charset=utf-8/i);
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    expect(res.headers.get("Content-Disposition")).toContain("transactions.csv");
    const text = await res.text();
    const lines = text.split("\n");
    expect(lines[0]).toBe("id,fromAccount,toAccount,amount,currency,type,timestamp,status");
    expect(lines[1]).toContain("e1");
    expect(lines[1]).toContain("ACC-1");
    expect(lines[1]).toContain("10.5");
  });

  it("GET /transactions/export applies the same filters as GET /transactions", async () => {
    const store = createStore();
    store.add({
      id: "f1",
      fromAccount: "ACC-P",
      toAccount: "ACC-Q",
      amount: 1,
      currency: "USD",
      type: "deposit",
      timestamp: "2024-06-01T00:00:00.000Z",
      status: "completed",
    });
    store.add({
      id: "f2",
      fromAccount: "ACC-R",
      toAccount: "ACC-S",
      amount: 2,
      currency: "USD",
      type: "deposit",
      timestamp: "2024-07-01T00:00:00.000Z",
      status: "completed",
    });
    const app = createApp(store);
    const res = await app.request(
      "http://localhost/transactions/export?format=csv&accountId=ACC-P&type=deposit&from=2024-01-01&to=2024-12-31",
    );
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("f1");
    expect(text).not.toContain("f2");
  });

  it("GET /transactions/export returns 400 when format is not csv", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions/export?format=json");
    expect(res.status).toBe(400);
  });

  it("returns 429 with Retry-After after 100 API requests in a sliding window", async () => {
    const app = createApp(createStore());
    for (let i = 0; i < 100; i++) {
      const r = await app.request("http://localhost/accounts/ACC-X/balance");
      expect(r.status).toBe(200);
    }
    const blocked = await app.request("http://localhost/accounts/ACC-X/balance");
    expect(blocked.status).toBe(429);
    const ra = blocked.headers.get("Retry-After");
    expect(ra).toBeTruthy();
    expect(Number(ra)).toBeGreaterThanOrEqual(1);
  });

  it("does not count OPTIONS toward the rate limit", async () => {
    const app = createApp(createStore());
    for (let i = 0; i < 99; i++) {
      await app.request("http://localhost/transactions");
    }
    const opt = await app.request("http://localhost/transactions", { method: "OPTIONS" });
    expect([404, 204]).toContain(opt.status);
    const ok100 = await app.request("http://localhost/transactions");
    expect(ok100.status).toBe(200);
    const blocked = await app.request("http://localhost/transactions");
    expect(blocked.status).toBe(429);
  });
});
