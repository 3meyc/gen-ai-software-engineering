# 🏦 Homework 1: Banking Transactions API

> **Student Name**: Maxim Ogorodnikov
> **Date Submitted**: 12.05.2026
> **AI Tools Used**: Cursor, ChatGPT

---

## 📋 Project Overview

This project is a REST API for banking transactions, designed to demonstrate AI-assisted development. It follows a clean, functional architecture using **TypeScript** and **Hono**.

### 🛠️ Technology Stack
- **Runtime**: Node.js
- **Framework**: [Hono](https://hono.dev/) (Lightweight, fast, and TypeScript-native)
- **Storage**: In-memory (Map/Array) — optimized for speed and disposable testing
- **Testing**: [Vitest](https://vitest.dev/)
- **Tooling**: `tsx` for execution and watch mode

### 🏗️ Architecture Decisions
- **Functional Approach**: Logic is separated into pure functions (e.g., `balance.ts`, `summary.ts`) for high testability.
- **In-Memory Store**: A simple singleton-like store holds transaction state, matching the "no database" requirement.
- **Hono Routes**: Organized by resource under `src/routes/` for clarity and scalability.
- **ISO 8601**: Strict adherence to ISO 8601 for all timestamps (server-generated).
- **Validation-First**: Requests are validated using custom logic and the `currency-codes` library to ensure data integrity before processing.

### 📂 Project Structure
```
homework-1/
├── src/
│   ├── routes/              # API Route definitions (accounts, transactions)
│   ├── app.ts               # App factory and middleware
│   ├── server.ts            # Entry point
│   ├── store.ts             # In-memory data storage
│   ├── transaction-logic.ts # Validation and filtering logic
│   └── (logic files)        # balance.ts, interest.ts, summary.ts, etc.
├── test/                    # Comprehensive Vitest suite
├── demo/                    # Sample requests and scripts
├── docs/screenshots/        # Evidence of AI interaction and API testing
└── README.md, HOWTORUN.md   # Project documentation
```

### ✅ Implemented Features

1. **Task 1: Core API**
   - `POST /transactions`: Creates rows with server-generated `id` and `timestamp`.
   - `GET /transactions`: Lists all transactions or specific `id`.
   - `GET /accounts/:accountId/balance`: Per-currency balance aggregation for **completed** transactions.

2. **Task 2: Validation**
   - Amount: Positive, max 2 decimal places.
   - Accounts: Must match `ACC-` + alphanumeric.
   - Currencies: Full ISO 4217 validation via library.
   - Error Handling: Returns 400 with structured details.

3. **Task 3: Transaction History**
   - Filtering: `accountId` (matches both legs), `type`, and `from`/`to` date ranges.
   - Dates: Inclusive UTC calendar days.
   - Logic: Multiple filters combine with **AND** semantics.

4. **Task 4: Advanced Features**
   - **Summary**: `GET /accounts/:accountId/summary` matrix of counts/amounts + most recent date.
   - **Interest**: `GET /accounts/:accountId/interest` calculation using annual formula.
   - **Export**: `GET /transactions/export?format=csv` for downloadable filtered history.
   - **Rate Limiting**: 100 req/60s sliding window with `Retry-After`.

---

## 🚀 How to Run

Please see [HOWTORUN.md](file:///c:/Users/Admin/DEV/gen-ai-software-engineering/homework-1/HOWTORUN.md) for detailed setup and execution instructions.

## 🧪 Testing

Run the test suite to verify all tasks:
```bash
npm test
```

---

<div align="center">

*This project was completed as part of the AI-Assisted Development course.*

</div>


