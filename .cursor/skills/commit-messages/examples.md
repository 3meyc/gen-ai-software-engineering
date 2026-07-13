# Commit message examples

Message **content** below. Agent wraps output per **Parameters** (default: recommended only).

## Default: `/commit-messages`

**Recommended**

```text
feat(homework-4): add research verifier agent and quality skill

- Define research-quality levels in skills/research-quality-measurement.md.
- Wire verifier agent to emit verified-research.md with pass/fail and discrepancy list.
- Document single-command pipeline run order in homework README.
```

## Homework task commit (single theme)

```text
feat(homework-4): implement bug fixer agent with fix-apply skill

Agent reads planner output, applies patches via editor tools, and records changes in fixes/applied-fixes.md.
```

## Docs-only

```text
docs(homework-4): clarify pipeline success criteria in TASKS.md

Require one-command execution, per-agent model selection, and screenshot deliverables.
```

## With `one-liner`

**One-liner**

```text
feat(homework-4): add security verifier agent and vulnerability report skill
```

## With `split-suggestion`

**Split suggestion**

Staged changes fit two focused commits:

1. Agent definitions

   ```text
   feat(homework-4): add bug research verifier and fixer agents

   Frontmatter documents model choice and skill dependencies per TASKS.md.
   ```

2. Cursor skills

   ```text
   chore(cursor): add commit-messages skill for course repo
   ```

## Shared backend (Hono)

```text
feat(api): add POST /users with zod validation

Validate email and name on create; return 400 with field errors per existing error helper.
```

## Bad — file-inventory bullets in body

```text
docs: enhance README

- README.md: added Documentation section
- homework-4/TASKS.md: updated overview
- homework-4/agents/research-verifier.agent.md: new file
```

**Why bad:** Bullets name files/changes, not themes; use outcome bullets or split commits.

## Bad — vague

```text
chore: update stuff
```

## Breaking change

```text
feat(api)!: remove legacy searchUsers export

BREAKING CHANGE: callers must use resolveUsersByLogins from the helper.
```
