---
name: commit-messages
description: >-
  Draft concise git commit messages following Conventional Commits v1.0.0 by
  analyzing staged or unstaged diffs and recent repo history. Use when the user
  asks for a commit message, reviews changes before commit, invokes
  /commit-messages, or wants help improving Cursor IDE sparkle-generated messages.
---

# Commit Messages

Spec: [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/)

Local copy for `homework-3/` (from global `~/.cursor/skills/commit-messages`).

## HW3 scope hints

| Change | Suggested scope |
|--------|-----------------|
| Spec package docs only | `docs(homework-3)` |
| `homework-3/platform/` code | `platform` or service name (`bff`, `ledger`, …) |
| Cursor rules/skills under HW3 | `docs(homework-3)` or `chore(homework-3)` |

## Parameters

Parse from `/commit-messages` args or the user message. **Default: recommended only.**

| Param | Default | Include when |
|-------|---------|--------------|
| `recommended` | **on** | Always (unless user asks only for another param). Full message in one copy-ready `text` fence. |
| `one-liner` | off | User passes `one-liner`, asks for a short subject, or sets `one-liner=true`. |
| `split-suggestion` | off | User passes `split`, `split-suggestion`, asks to split commits, or sets `split-suggestion=true`. |

Examples: `/commit-messages` → recommended only. `/commit-messages one-liner split` → all three.

Do not emit `one-liner` or `split-suggestion` unless requested.

## Workflow

1. Inspect changes: `git status`, `git diff --cached` (staged), and `git diff` if the user said uncommitted or nothing is staged.
2. Read recent subjects: `git log -10 --format="%s"` (and bodies if the repo uses multi-line commits).
3. Determine **one primary type** for the subject. If `split-suggestion` is on and changes clearly split into unrelated types (e.g. `feat` + `docs` only), propose separate commits per the spec FAQ; if the user keeps one commit, lead with the dominant type and mention the rest briefly in the body.
4. Output per **Parameters** (subject required; body and footers when useful).

Do not commit unless the user explicitly asks.

## Message structure

```
<type>[optional scope]: <description>

[optional body — short prose, or thematic bullets when multi-theme; not a file changelog]

[optional footer(s)]
```

- **Subject**: imperative mood, lowercase after the colon, no trailing period, ~72 characters max.
- **Body**: separated from subject by one blank line; explain *why* and non-obvious behavior, not a file list. For **multi-theme** commits (see below), use a `-` bullet list by default.
- **Footers**: git-trailer style (`Refs:`, `Reviewed-by:`, `BREAKING CHANGE:`). Match ticket/issue footers when present in `git log` (e.g. `ref: #ISSD-123`).

### Multi-theme body (default when applicable)

Use when one commit covers **2–4 distinct themes** (e.g. API behavior + UI wiring + docs). Format:

```
- First theme: outcome in one sentence.
- Second theme: outcome in one sentence.
```

Rules: thematic outcomes only (not paths); 2–4 bullets; each bullet one line when possible; blank line before footers. For a **single** theme, use one short prose paragraph or a single bullet — no forced list.

## Types (pick one for the subject)

| Type | Use when |
|------|----------|
| `feat` | New behavior or capability |
| `fix` | Bug fix |
| `docs` | Documentation only (no production logic change) |
| `refactor` | Behavior-preserving restructure |
| `perf` | Performance improvement |
| `test` | Tests only |
| `build` | Build system or dependencies |
| `ci` | CI configuration |
| `chore` | Maintenance that does not fit above |
| `revert` | Reverts a prior commit (include `Refs:` SHA when known) |

Other types from the spec are allowed if they fit. Use `feat!` or a `BREAKING CHANGE:` footer only for breaking API or behavior changes.

**Scope** (optional): noun in parentheses, e.g. `feat(users):`, `fix(api):`. Omit if unclear.

## Quality rules

1. **Analyze the full diff**, not only large markdown or README hunks. Code, API, and helpers outweigh doc-only narratives when both change.
2. **Be concise** — prefer one strong subject; avoid IDE-style bullet lists that restate every file.
3. **No file inventory** — do not list paths unless a path is the whole point of the change.
4. **Match repo tone** — mirror recent `git log` (prefix style, scope usage, ticket footers).
5. **Mixed commits** — subject reflects the main user-visible or behavioral change; body uses **thematic bullets** (one per theme: code, wiring, docs, etc.).
6. **Multi-theme default** — if the diff has multiple unrelated themes in one commit, prefer a bulleted body over a dense paragraph.

## Anti-patterns

| Avoid | Prefer |
|-------|--------|
| Bullets that list files or every hunk | 2–4 bullets by theme/outcome |
| Long bullet lists (5+ items) | Split commits (`split-suggestion`) or prose |
| `docs:` when `feat`/`fix` logic changed | `feat`/`fix` subject + brief docs note in body |
| Vague subjects (`update files`, `misc changes`) | Specific outcome (`batch by-logins above API limit`) |
| Repeating the subject in the body | Body adds context the subject cannot carry |

## Cursor IDE sparkle button

The Source Control sparkle runs `cursor.generateGitCommitMessage` on the staged diff only; it cannot be prompted. This skill produces richer messages for chat/agent use. For closer sparkle behavior, keep commits focused so the diff has a single theme.

## Output format

Emit only the sections enabled by **Parameters**.

### Single message (`recommended`, `one-liner`)

One fenced `text` block per section, with a short heading outside the fence:

**Recommended**

```text
feat(scope): short subject

- Core behavior change in one sentence.
- Secondary theme (e.g. docs or wiring) in one sentence.

ref: #TICKET-123
```

### Multiple messages (`split-suggestion`)

Use a **numbered list** (preferred). Each item: one-line label, then a nested fenced `text` block with only the commit message (no "Subject:" labels inside).

### Copy-ready block rules

- Use a plain `text` fence (not `git` or `bash`) so the message copies verbatim.
- Inside the fence: commit message only — no markdown headings or param names.
- Thematic `-` bullets are allowed **inside** the commit message body for multi-theme commits.

## Examples

See [examples.md](examples.md).
