# How to Run — Homework 4

Step-by-step guide to run the **leave request UI**, tests, and the 4-agent pipeline.

---

## 1. Prerequisites

- **Node.js** 18+ (20+ recommended)
- **Cursor CLI** (`agent` command) — only for `npm run pipeline`
- **Cursor account** with API access — only for pipeline

---

## 2. Install dependencies

```bash
cd homework-4
npm install
```

---

## 3. Run the leave request app (Svelte)

```bash
npm run dev
```

Open **http://localhost:5173**

### Try the form

| Field | Example |
|-------|---------|
| Employee name | Your name |
| Leave type | Vacation |
| Start / end date | 2026-07-01 → 2026-07-03 |
| Reason | Family trip |
| Manager token | `mgr-approve-2026` |

### Known bugs (before pipeline)

- **Days count:** Jul 1–3 shows **2** days (should be 3)
- **Invalid range:** End before start still submits
- **XSS demo:** Reason with HTML/script renders unsanitized in preview

See [`context/bugs/BUG-001/bug-context.md`](context/bugs/BUG-001/bug-context.md).

### Production build (optional)

```bash
npm run build
npm run preview
```

---

## 4. Run tests

```bash
npm test
```

Tests assert **current buggy behavior** so they pass before the pipeline fix step.

---

## 5. Install Cursor CLI (pipeline only)

### Windows (PowerShell)

```powershell
irm 'https://cursor.com/install?win32=true' | iex
```

### macOS / Linux / WSL

```bash
curl https://cursor.com/install -fsS | bash
```

Verify:

```bash
agent --version
agent status
```

---

## 6. Authenticate (pipeline only)

**Option A — interactive login**

```bash
agent login
```

**Option B — API key (CI / headless)**

```powershell
# PowerShell
$env:CURSOR_API_KEY = "your_key_here"
```

```bash
# bash
export CURSOR_API_KEY="your_key_here"
```

Keys: [Cursor Dashboard → Integrations](https://cursor.com/dashboard/integrations)

---

## 7. Run the pipeline (fix bugs — separate step)

Inputs are ready at `context/bugs/BUG-001/research/codebase-research.md` and `implementation-plan.md`.

Override bug folder:

```bash
# bash
BUG_ID=BUG-001 npm run pipeline

# PowerShell
$env:BUG_ID = "BUG-001"; npm run pipeline
```

### Dry run

```bash
npm run pipeline -- --dry-run
```

### Full pipeline

```bash
npm run pipeline
```

**Execution order:**

1. Research Verifier → `research/verified-research.md`
2. Bug Fixer → `fix-summary.md` + source edits
3. Security Verifier + Unit Test Generator *(parallel)* → `security-report.md`, `test-report.md`, `test/`

Expected outputs: see [docs/agents/README.md](docs/agents/README.md) I/O matrix.

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `agent: command not found` | Install Cursor CLI (step 2); restart terminal |
| Auth errors | Run `agent login` or set `CURSOR_API_KEY` |
| Preflight missing input | Ensure `codebase-research.md` and `implementation-plan.md` exist |
| TBD warning | Removed — research/plan reference real `src/` files |
| Step failed, output missing | Re-run step; check agent had write access (`--force`) |

---

## 9. Manual single-agent run (optional)

```bash
cd homework-4
agent -p --force --model "claude-sonnet-5-thinking-high" --workspace . "Execute research-verifier per agents/research-verifier.agent.md for BUG-001"
```

Prefer `npm run pipeline` for correct order and skill loading.

---

## 10. Related docs

- [README.md](README.md) — overview
- [agents.md](agents.md) — agent catalog and workflow
- [TASKS.md](TASKS.md) — assignment requirements
