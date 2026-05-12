# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Maxim Ogorodnikov
> **Date Submitted**: 12.05.2026
> **AI Tools Used**: Cursor, ChatGPT

---

## 📋 Project Overview

This folder contains a small **REST API** for banking-style **transactions**, implemented in **TypeScript** with **Hono**, **in-memory** storage, and **Vitest** for tests.

**Implemented behavior**

1. **Transactions** — `POST /transactions` creates a row (server assigns `id` and ISO `timestamp`; client sends `status`). `GET /transactions` lists all rows; `GET /transactions/:id` returns one or **404**.
2. **Balances** — `GET /accounts/:accountId/balance` returns **per-currency** balances from **completed** transactions only, using deposit / withdrawal / transfer rules described in `AI_CONTEXT.md`.
3. **Validation (Task 2)** — Invalid create bodies return **400** with `{ "error": "Validation failed", "details": [...] }`: positive **amount** with at most **two** decimal places; **`fromAccount` and `toAccount`** both required and matching **`ACC-` + alphanumeric**; **currency** normalized to uppercase and checked against **ISO 4217** (via the `currency-codes` dataset).

## How to run

1. Install [Node.js](https://nodejs.org/) (LTS recommended).
2. From the repository root, go into this project: `cd homework-1`.
3. Install dependencies: `npm install`.
4. Start the API:
   - **Development** (reload on file changes): `npm run dev`.
   - **One-off run**: `npm start`.
5. The server listens on port **3000** by default. Override with `PORT` (examples: Unix `PORT=4000 npm start`; PowerShell `$env:PORT=4000; npm start`; Command Prompt `set PORT=4000&& npm start`).
6. Run the test suite once: `npm test`. Run tests in watch mode: `npm run test:watch`.

## Happy flow (user actions)

Assume the API is running at `http://localhost:3000` and you use a client such as [curl](https://curl.se/) or an HTTP file in your editor.

1. **Fund an account** — Create a completed deposit so balances can reflect it later: `POST /transactions` with `type: "deposit"`, valid **`fromAccount` and `toAccount`** (both `ACC-…`), positive `amount`, a real **ISO 4217** `currency`, and `status: "completed"`. Only `toAccount` affects the deposit balance; expect **201** with server-generated `id` and `timestamp`.
2. **Check the balance** — `GET /accounts/{accountId}/balance` for the same account id you credited. Expect **200** and a JSON object with `accountId` and `balances` (per-currency numbers; only **completed** transactions count).
3. **Move money between accounts** — `POST /transactions` with `type: "transfer"`, valid `ACC-…` accounts for `fromAccount` and `toAccount`, `amount`, ISO `currency`, and `status: "completed"`. Expect **201**.
4. **Re-check balances** — Call `GET /accounts/.../balance` for the sender and receiver; amounts should match your deposits and transfers.
5. **Review history** — `GET /transactions` returns **200** with an array of all stored transactions (newest appended after older ones in the current implementation).
6. **Inspect one transaction** — Copy an `id` from the list or from a create response, then `GET /transactions/{id}`. Expect **200** and the full transaction object, or **404** if the id is wrong.


<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>


