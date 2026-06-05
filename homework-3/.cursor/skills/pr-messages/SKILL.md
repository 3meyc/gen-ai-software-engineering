---
name: pr-messages
description: >-
  Draft pull request titles and descriptions by analyzing branch diffs, commit
  history, and repo conventions. Use when the user asks for a PR message or
  description, reviews changes before opening a pull request, invokes
  /pr-messages, or wants help improving a PR body before submission.
---

# PR Messages

Local copy for course repo / `homework-3/` (from global `~/.cursor/skills/pr-messages`).

## HW3 verification hints

For **spec-only** PRs (no `platform/` code):

- **How to check**: confirm Document map links, Mars Family fixture consistency, Appendix B checklist, `docs/api/errors-and-status-codes.md` covers §10 scenarios.
- Avoid generic `npm test` unless tests exist in the branch.

For **implementation** PRs under `homework-3/platform/`:

- Reference [`docs/testing/testing-strategy.md`](../../docs/testing/testing-strategy.md) and Mars Family scenarios in **How to check**.

## Parameters

Parse from `/pr-messages` args or the user message. **Default: title + recommended body.**

| Param | Default | Include when |
|-------|---------|--------------|
| `recommended` | **on** | Always (unless user asks only for another param). Full PR body in one copy-ready `text` fence. |
| `title` | **on** | Always. Omit only when user passes `no-title`, `no-title=true`, or asks for body only. |
| `branch` | auto | Branch to compare against (PR base). User passes `branch=<name>`, `branch <name>`, or phrases like "compare with develop". Aliases: `base`, `compare`, `compare-with`. |

Examples: `/pr-messages` → title + recommended body. `/pr-messages no-title` → recommended body only. `/pr-messages branch=develop` → title + body, diff against `develop`.

Do not emit `title` when `no-title` is set.

### Resolve `branch`

1. Use explicit `branch` (or alias) from args or user message.
2. Else use upstream tracking branch of the current branch if set.
3. Else pick `main` or `master` — whichever exists locally or on `origin`.
4. If ambiguous or missing, ask once; do not guess across multiple remotes.

Use the resolved branch as `<branch>` in all git commands below.

## Workflow

1. Resolve **branch** (see above), then inspect state: `git status`, upstream tracking, and commits since base (`git log <branch>...HEAD --oneline`).
2. Read the full diff: `git diff <branch>...HEAD` (and `--stat` first if the diff is large).
3. Skim recent merged PR titles/bodies if the repo exposes them (`gh pr list --state merged --limit 5` when `gh` is available).
4. Draft a **title** (unless `no-title`): concise, outcome-focused, ~72 characters when possible; mirror repo PR title style.
5. Draft the **body** using the template below; fill every required section from the diff — do not leave placeholder prose.
6. Do not open the PR unless the user explicitly asks.

## Body template

Use these headings **verbatim** in the PR body:

```markdown
#### What changed
A short paragraph: what has changed and why.

#### How to check
Steps or commands that a reviewer can follow to verify changes.

#### Linked issues
Closes #

#### Context (optional)
Links, screenshots, logs, dependencies or constraints; if necessary, add notes about the output to the product or other important things for the review.
```

### Section rules

- **What changed**: One short paragraph (or 2–4 outcome-focused bullets when the PR spans distinct themes). Explain *why*, not a file inventory.
- **How to check**: Numbered steps or concrete commands a reviewer can run. Include manual UI checks when behavior is visual. Omit speculative steps the diff does not support.
- **Linked issues**: `Closes #123` when an issue number is known from branch name, commits, or user input; otherwise `Closes #` on its own line for the author to fill.
- **Context (optional)**: Include only when the diff or user notes add non-obvious constraints (breaking changes, feature flags, follow-ups, screenshots). Omit the entire section when nothing meaningful applies — do not leave an empty optional block.

## Quality rules

1. **Analyze the full diff**, not only large markdown or README hunks. Code, API, and behavior outweigh doc-only narratives when both change.
2. **Be concise** — reviewers scan quickly; prefer clear outcomes over exhaustive changelogs.
3. **No file inventory** — do not list paths unless a path is the whole point of the change.
4. **Match repo tone** — mirror recent PR titles and bodies when visible.
5. **Test steps must be verifiable** — tie each check to something introduced or fixed in this branch.
6. **Multi-theme PRs** — when the branch covers unrelated themes, use short bullets under **What changed** (one line per theme).

## Output format

Emit **title** first (unless `no-title`), then **recommended** body.

### PR title (default)

**Title**

```text
feat(users): short outcome-focused title
```

### PR body (`recommended`)

**Recommended**

```text
#### What changed
...

#### How to check
1. ...

#### Linked issues
Closes #

```

### Copy-ready block rules

- Use a plain `text` fence (not `markdown` or `bash`) so the body copies verbatim.
- Inside the fence: PR content only — no param names or chat headings like "Recommended".
- Keep `####` headings exactly as in the template.

## Examples

See [examples.md](examples.md).
