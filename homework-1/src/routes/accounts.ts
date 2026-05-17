import { Hono } from "hono";
import { balancesForAccount } from "../balance.js";
import { simpleInterestByCurrency } from "../interest.js";
import { summaryMatrixForAccount } from "../summary.js";
import type { TransactionStore } from "../store.js";

function parseInterestQuery(searchParams: URLSearchParams): { ok: true; rate: number; days: number } | { ok: false } {
  const rateRaw = searchParams.get("rate");
  const daysRaw = searchParams.get("days");
  if (rateRaw === null || rateRaw.trim() === "" || daysRaw === null || daysRaw.trim() === "") {
    return { ok: false };
  }
  const rate = Number(rateRaw);
  const days = Number(daysRaw);
  if (!Number.isFinite(rate) || !Number.isFinite(days)) return { ok: false };
  if (rate < 0) return { ok: false };
  if (days <= 0) return { ok: false };
  return { ok: true, rate, days };
}

export function createAccountRoutes(store: TransactionStore) {
  const r = new Hono();

  r.get("/:accountId/balance", (c) => {
    const accountId = c.req.param("accountId");
    const balances = balancesForAccount(accountId, store.list());
    return c.json({ accountId, balances }, 200);
  });

  r.get("/:accountId/summary", (c) => {
    const accountId = c.req.param("accountId");
    const accountSummary = summaryMatrixForAccount(accountId, store.list());
    return c.json(accountSummary, 200);
  });

  r.get("/:accountId/interest", (c) => {
    const accountId = c.req.param("accountId");
    const parsed = parseInterestQuery(new URL(c.req.url).searchParams);
    if (!parsed.ok) {
      return c.json(
        {
          error: "Validation failed",
          details: [
            {
              field: "query",
              message: "rate and days are required; rate must be a non-negative finite number, days a positive finite number",
            },
          ],
        },
        400,
      );
    }
    const interest = simpleInterestByCurrency(accountId, store.list(), parsed.rate, parsed.days);
    return c.json(
      { accountId, rate: parsed.rate, days: parsed.days, interest },
      200,
    );
  });

  return r;
}
