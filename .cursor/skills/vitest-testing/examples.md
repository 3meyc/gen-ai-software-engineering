# Vitest Examples

## Validation error body

```typescript
it("rejects non-positive amount", async () => {
  const app = createApp(createStore());
  const res = await app.request("http://localhost/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount: 0, /* ... */ }),
  });
  expect(res.status).toBe(400);
  const body = await json(res);
  expect(body.error).toBe("Validation failed");
  expect(Array.isArray(body.details)).toBe(true);
});
```

## GET with query filters

```typescript
it("filters by accountId and date range", async () => {
  const store = createStore();
  store.add({ id: "a", timestamp: "2024-06-01T00:00:00.000Z", /* ... */ });
  store.add({ id: "b", timestamp: "2024-07-01T00:00:00.000Z", /* ... */ });

  const app = createApp(store);
  const res = await app.request(
    "http://localhost/transactions?accountId=ACC-P&from=2024-01-01&to=2024-12-31",
  );
  expect(res.status).toBe(200);
  const list = (await json(res)) as { id: string }[];
  expect(list.map((t) => t.id)).toContain("a");
  expect(list.map((t) => t.id)).not.toContain("b");
});
```

## CSV export

```typescript
it("returns CSV with Content-Disposition", async () => {
  const store = createStore();
  store.add({ id: "e1", amount: 10.5, /* ... */ });
  const app = createApp(store);

  const res = await app.request("http://localhost/transactions/export?format=csv");
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toMatch(/text\/csv/i);
  expect(res.headers.get("Content-Disposition")).toContain("transactions.csv");

  const lines = (await res.text()).split("\n");
  expect(lines[0]).toBe("id,fromAccount,toAccount,amount,currency,type,timestamp,status");
  expect(lines[1]).toContain("e1");
});
```

## Rate limit

```typescript
it("returns 429 with Retry-After after limit", async () => {
  const app = createApp(createStore());
  for (let i = 0; i < 100; i++) {
    expect((await app.request("http://localhost/accounts/ACC-X/balance")).status).toBe(200);
  }
  const blocked = await app.request("http://localhost/accounts/ACC-X/balance");
  expect(blocked.status).toBe(429);
  expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThanOrEqual(1);
});
```

## Pure function with typed fixture

```typescript
import type { Transaction } from "../src/types.js";

const base: Transaction = {
  id: "1",
  fromAccount: "A",
  toAccount: "B",
  amount: 10,
  currency: "USD",
  type: "transfer",
  timestamp: "2026-01-01T00:00:00.000Z",
  status: "completed",
};

it("ignores pending for balance", () => {
  const txs = [base, { ...base, id: "2", status: "pending" }];
  expect(balancesForAccount("B", txs)).toEqual({ USD: 10 });
});
```

## Task-aligned describe blocks

Mirror assignment tasks in describe names for traceability:

```typescript
describe("Task 1 API", () => { /* CRUD */ });
describe("Task 2 validation", () => { /* enum/field rules */ });
describe("Task 3 GET /tickets filters", () => { /* query params */ });
```

## Checklist for new endpoint

```
- [ ] 2xx happy path + response shape
- [ ] 400 invalid/missing body or query
- [ ] 404 unknown resource
- [ ] Auth/rate-limit if applicable
- [ ] Consistency with related endpoints (e.g. export uses same filters as list)
```
