# 🏦 Homework 1: Build a Simple Banking Transactions API Using AI Assistance

## 📋 Overview

In this homework, you will create a minimal REST API for banking transactions using AI coding tools. This assignment focuses on getting hands-on experience with AI-assisted development and documenting how AI tools contributed to your work.

---

## 🎯 Learning Objectives

By completing this homework, you will:
- ✅ Gain practical experience using AI coding assistants
- ✅ Compare different AI tools' approaches to the same problem
- ✅ Learn to effectively prompt AI for code generation
- ✅ Practice documenting AI-assisted development workflows

---

### Technology Stack (Choose One)
- **Node.js** 
- **Python** 
- Other technolgies which you will comfortable with

---

## 📝 Tasks

### Task 1: Core API Implementation *(Required)* ⭐

Create a REST API with the following endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/transactions` | Create a new transaction |
| `GET` | `/transactions` | List all transactions |
| `GET` | `/transactions/:id` | Get a specific transaction by ID |
| `GET` | `/accounts/:accountId/balance` | Get account balance |

**Transaction Model:**
```json
{
  "id": "string (auto-generated)",
  "fromAccount": "string",
  "toAccount": "string",
  "amount": "number",
  "currency": "string (ISO 4217: USD, EUR, GBP, etc.)",
  "type": "string (deposit | withdrawal | transfer)",
  "timestamp": "ISO 8601 datetime",
  "status": "string (pending | completed | failed)"
}
```

**Requirements:**
- Use in-memory storage (array or object) — no database required
- Validate that amounts are positive numbers
- Return appropriate HTTP status codes (200, 201, 400, 404)
- Include basic error handling

---

### Task 2: Transaction Validation *(Required)* ✅

Add validation logic for transactions:

- **Amount validation**: Must be positive, maximum 2 decimal places
- **Account validation**: `ACC-` followed by one or more alphanumeric characters (suffix may be longer than five characters). Validate **both** `fromAccount` and `toAccount` on every create (not only the account used for a given `type`).
- **Currency validation**: Accept **any** valid ISO 4217 currency code (use a real code list or library; do not hard-code only a few examples).
- **HTTP**: Return **400** for validation failures, with meaningful error messages for invalid requests

**Example validation error response:**
```json
{
  "error": "Validation failed",
  "details": [
    {"field": "amount", "message": "Amount must be a positive number"},
    {"field": "currency", "message": "Invalid currency code"}
  ]
}
```

---

### Task 3: Basic Transaction History *(Required)* 📜

Implement transaction filtering on the `GET /transactions` endpoint:

- Filter by account: `?accountId=ACC-12345` — compare the ID to **both** `fromAccount` and `toAccount`; include the transaction if it equals either field
- Filter by type: `?type=transfer`
- Filter by date range: `?from=2024-01-01&to=2024-01-31` — match on each transaction’s `timestamp`; `from` and `to` are **whole calendar days in UTC**, bounds **inclusive** (e.g. `from=2024-01-01` includes all times on that UTC day through the end of `to`)
- Combine multiple filters — when several are present, apply them together with **AND** semantics

---

### Task 4: Additional Features 🌟

#### Step A: Transaction Summary Endpoint 📈
```
GET /accounts/:accountId/summary
```

Returns an aggregated **matrix**: for each transaction `type` (`deposit`, `withdrawal`, `transfer`), count how many rows exist for each `status` (`pending`, `completed`, `failed`). Cell values are **counts** (non-negative integers).

**Scope:** Include a transaction when `:accountId` equals **either** `fromAccount` **or** `toAccount` (same “match any of two” rule as Task 3’s `accountId` filter).

**Response shape (example):**
```json
{
  "summary": {
    "deposit": {
      "pending": 10,
      "completed": 120,
      "failed": 2
    },
    "withdrawal": {
      "pending": 5,
      "completed": 80,
      "failed": 1
    },
    "transfer": {
      "pending": 3,
      "completed": 200,
      "failed": 4
    }
  }
}
```

If the response includes any datetime, use the **same ISO 8601 form** as the transaction `timestamp` field (e.g. `2026-05-12T14:35:22Z`).

#### Step B: Simple Interest Calculation 💰
```
GET /accounts/:accountId/interest?rate=0.05&days=30
```

- **Formula:** `interest = balance * rate * (days / 365)` where `rate` is an **annual** rate (e.g. `0.05` means 5% per year).
- **Balance:** Use the **same balance definition** as `GET /accounts/:accountId/balance`.

#### Step C: Transaction Export 📤
```
GET /transactions/export?format=csv
```

- **Filters:** The same query parameters as `GET /transactions` (e.g. `accountId`, `type`, `from`, `to`) **can** be applied to the export; when present, the CSV contains **only** the rows that `GET /transactions` would return with those filters (**AND** semantics, same as Task 3).
- **HTTP:** Respond with CSV as **UTF-8** (`Content-Type` appropriate for CSV with UTF-8) and set a download **filename** via `Content-Disposition` (e.g. `attachment; filename="transactions.csv"`).
- **Columns:** CSV column headers are the transaction **JSON field names**; each row is one transaction object. Example (one row’s fields become columns):
```json
{
  "id": "txn_9f3c2b7a1d",
  "fromAccount": "ACC-1029384756",
  "toAccount": "ACC-5647382910",
  "amount": 250.75,
  "currency": "USD",
  "type": "transfer",
  "timestamp": "2026-05-12T14:35:22Z",
  "status": "pending"
}
```

#### Step D: Rate Limiting 🚦

- **Limit:** Maximum **100** requests per **client IP** in a **sliding 60-second** window.
- **Scope:** Count only **API routes** (your banking/transaction endpoints). Do **not** count `OPTIONS` requests toward the limit.
- **When exceeded:** Return **`429 Too Many Requests`**. The response **must** include appropriate headers for rate limiting — at minimum **`Retry-After`** (value in **seconds** until the client may retry).

---

## 📦 Deliverables

Your submission must include:

### 1️⃣ Source Code
- Complete working API implementation
- Organized folder structure
- `.gitignore` file excluding `node_modules/`, `.env`, etc.

### 2️⃣ Documentation

| File | Content |
|------|---------|
| `README.md` | Project overview, features implemented, architecture decisions |
| `HOWTORUN.md` | Step-by-step instructions to run the application |


### 3️⃣ Screenshots *(in `docs/screenshots/`)*
- 📸 Screenshots of AI tool interactions showing prompts and generated code
- 📸 Screenshot of your API running successfully
- 📸 Screenshot of sample API requests/responses (using Postman, curl, or similar)

### 4️⃣ Demo Files *(in `demo/`)*
- `run.sh` or `run.bat` — Script to start your application
- `sample-requests.http` or `sample-requests.sh` — Sample API calls for testing
- `sample-data.json` — Sample transaction data (if applicable)

---

## 🧪 Sample API Requests for Testing

```bash
# Create a transaction
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccount": "ACC-12345",
    "toAccount": "ACC-67890",
    "amount": 100.50,
    "currency": "USD",
    "type": "transfer"
  }'

# Get all transactions
curl http://localhost:3000/transactions

# Get transactions for specific account
curl "http://localhost:3000/transactions?accountId=ACC-12345"

# Get account balance
curl http://localhost:3000/accounts/ACC-12345/balance
```

---

---

## 💡 Tips for Success

| Tip | Description |
|-----|-------------|
| 🎯 **Start Simple** | Get the basic endpoints working first, then add features |
| 🔄 **Iterate with AI** | Don't expect perfect code on first prompt — refine your requests |
| 📝 **Save Your Prompts** | Keep a log of what prompts worked well for future reference |
| 🧪 **Test Thoroughly** | Use curl, Postman, or VS Code REST Client to test your API |
| 🔍 **Read AI Output** | Don't just copy-paste — understand what the AI generated |

---

## 📁 Example Project Structure

```
homework-1/
├── 📄 README.md
├── 📄 HOWTORUN.md
├── 📄 package.json (or requirements.txt / pom.xml)
├── 📄 .gitignore
├── 📂 src/
│   ├── index.js (or app.py / Application.java)
│   ├── 📂 routes/
│   │   └── transactions.js
│   ├── 📂 models/
│   │   └── transaction.js
│   ├── 📂 validators/
│   │   └── transactionValidator.js
│   └── 📂 utils/
│       └── helpers.js
├── 📂 docs/
│   └── 📂 screenshots/
│       ├── ai-prompt-1.png
│       ├── ai-prompt-2.png
│       └── api-running.png
└── 📂 demo/
    ├── run.sh
    ├── sample-requests.http
    └── sample-data.json
```

> **🌟 Tip:** Once your feature is ready, make sure to create a well-documented Pull Request (PR) summarizing your changes and linking to relevant issues. This ensures smooth code reviews and easy collaboration! 🚀


---

<div align="center">

### 🚀 Good luck and enjoy exploring AI-assisted development!

</div>
