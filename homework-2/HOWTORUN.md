# ▶️ How to Run the Application

Follow these steps to set up and run the Customer Support Ticket API.

## 📋 Prerequisites

- **Node.js**: Version 18 or higher (LTS recommended)
- **npm**: Bundled with Node.js

## 🛠️ Installation

1. Navigate to the project directory:

   ```bash
   cd homework-2
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## 🚀 Running the API

### Development Mode

Runs the server with `tsx watch`, restarting on file changes:

```bash
npm run dev
```

The server listens at **http://localhost:3000** by default.

### Production Mode

Runs the server once (no file watching):

```bash
npm start
```

### Override Port

The port is read from `process.env.PORT` (see `src/server.ts`). Default is **3000**.

| Platform | Command |
|----------|---------|
| Unix / macOS | `PORT=4000 npm start` |
| Windows PowerShell | `$env:PORT=4000; npm start` |
| Windows CMD | `set PORT=4000&& npm start` |

## 🧪 Running Tests

| Command | Purpose |
|---------|---------|
| `npm test` | Run all Vitest suites once |
| `npm run test:watch` | Re-run on file changes |
| `npm run test:coverage` | Coverage report (v8) |

Tests use Hono `app.request()` against an in-memory store — **no server needs to be running**.

## 📡 Smoke Test (manual)

With the server running:

```bash
curl -s http://localhost:3000/tickets
```

Expected: `{"tickets":[]}`

Create a ticket:

```bash
curl -s -X POST http://localhost:3000/tickets \
  -H "Content-Type: application/json" \
  -d "{\"customer_id\":\"demo\",\"customer_email\":\"demo@example.com\",\"customer_name\":\"Demo User\",\"subject\":\"Hello\",\"category\":\"other\",\"priority\":\"medium\",\"status\":\"new\"}"
```

## 📂 Sample Import Files

Use the files at the project root for bulk import demos:

| File | Rows |
|------|------|
| `sample_tickets.csv` | 50 |
| `sample_tickets.json` | 20 |
| `sample_tickets.xml` | 30 |

Example JSON import:

```bash
curl -s -X POST "http://localhost:3000/tickets/import?format=json" \
  -H "Content-Type: application/json" \
  --data-binary @sample_tickets.json
```

## 📊 Local Benchmarks (optional)

To reproduce performance numbers documented in [TESTING_GUIDE.md](TESTING_GUIDE.md):

```bash
npx tsx scripts/bench-task4.ts
```

---

*Documentation generated with: **ChatGPT***
