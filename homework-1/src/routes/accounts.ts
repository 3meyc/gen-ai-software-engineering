import { Hono } from "hono";
import { balancesForAccount } from "../balance.js";
import type { TransactionStore } from "../store.js";

export function createAccountRoutes(store: TransactionStore) {
  const r = new Hono();

  r.get("/:accountId/balance", (c) => {
    const accountId = c.req.param("accountId");
    const balances = balancesForAccount(accountId, store.list());
    return c.json({ accountId, balances }, 200);
  });

  return r;
}
