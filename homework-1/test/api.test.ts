import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { balancesForAccount } from "../src/balance.js";
import { createStore } from "../src/store.js";
import type { Transaction } from "../src/types.js";

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
        fromAccount: "A",
        toAccount: "B",
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
        toAccount: "ACC-X",
        amount: 0,
        currency: "USD",
        type: "deposit",
        status: "pending",
      }),
    });
    expect(res.status).toBe(400);
    const body = await json(res);
    expect(body.error).toBeDefined();
  });

  it("deposit requires toAccount", async () => {
    const app = createApp(createStore());
    const res = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
  });

  it("GET /transactions/:id returns a single row", async () => {
    const store = createStore();
    const app = createApp(store);

    const post = await app.request("http://localhost/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        fromAccount: "A",
        toAccount: "B",
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
