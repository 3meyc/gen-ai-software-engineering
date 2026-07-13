# Security Verifier

**Executable:** [`agents/security-verifier.agent.md`](../../agents/security-verifier.agent.md)  
**Model:** `claude-opus-4-8-thinking-high`

## Role

Security review of code modified by the Bug Fixer. **Report only** — no code edits.

## Inputs / outputs

| Direction | Path |
|-----------|------|
| Input | `context/bugs/{BUG_ID}/fix-summary.md` |
| Input | Changed source files from summary |
| Output | `context/bugs/{BUG_ID}/security-report.md` |

## Vulnerability classes

- Injection (SQL, command, path, template)
- Hardcoded secrets
- Insecure comparisons (e.g. loose token equality)
- Missing validation / sanitization
- Unsafe dependencies
- XSS / CSRF / auth bypass (when relevant)

## Severity scale

CRITICAL → HIGH → MEDIUM → LOW → INFO

## Do / don't

| Do | Don't |
|----|-------|
| Include `file:line` and remediation per finding | Edit any source file |
| Scope to runtime / production paths | Flag devDependency noise |
| Separate pre-existing vs new issues when possible | Skip `fix-summary.md` |

## Success criteria (from TASKS.md)

- Fix-summary and changed files read
- Injection, secrets, validation considered
- Each finding has severity, file:line, remediation
- Report only

## Finding template

| Severity | Location | Finding | Remediation |
|----------|----------|---------|-------------|
| HIGH | `src/auth.ts:24` | Loose token comparison | Use strict equality or timing-safe compare |

Pipeline runs this agent in **ask/read-only mode** (`--mode=ask`).
