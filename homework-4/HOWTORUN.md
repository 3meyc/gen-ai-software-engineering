# How to Run — Homework 4

Step-by-step guide to run the 4-agent pipeline and tests.

---

## 1. Prerequisites

- **Node.js** 18+ (20+ recommended)
- **Cursor CLI** (`agent` command)
- **Cursor account** with API access (`agent login` or `CURSOR_API_KEY`)

---

## 2. Install Cursor CLI

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

## 3. Authenticate

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

## 4. Install homework dependencies

```bash
cd homework-4
npm install
```

---

## 5. Verify stub inputs exist

Before running the pipeline, confirm:

| File | Status |
|------|--------|
| `context/bugs/BUG-001/research/codebase-research.md` | Seeded stub (Task 5 replaces) |
| `context/bugs/BUG-001/implementation-plan.md` | Seeded stub (Task 5 replaces) |

Override bug folder:

```bash
# bash
BUG_ID=BUG-001 npm run pipeline

# PowerShell
$env:BUG_ID = "BUG-001"; npm run pipeline
```

---

## 6. Run the pipeline

### Dry run (no agent calls — validates config)

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

## 7. Run tests

```bash
npm test
```

Until Task 5 adds the mini-app, only a placeholder test runs.

---

## 8. Troubleshooting

| Issue | Fix |
|-------|-----|
| `agent: command not found` | Install Cursor CLI (step 2); restart terminal |
| Auth errors | Run `agent login` or set `CURSOR_API_KEY` |
| Preflight missing input | Ensure `codebase-research.md` and `implementation-plan.md` exist |
| TBD warning | Expected before Task 5; replace stubs with real research |
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
