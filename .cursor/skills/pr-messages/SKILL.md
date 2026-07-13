---
name: pr-messages
description: >-
  Draft pull request titles and descriptions for course homework submissions by
  analyzing branch diffs, commit history, and README submission requirements.
  Use when the user asks for a PR message, PR title, or PR body, reviews changes
  before opening a pull request, invokes /pr-messages or /pr-message, or wants
  copy-ready homework submission PR text with screenshots and verification steps.
---

# PR Messages

Course submission standard: [README.md — Create a Pull Request](../../README.md) (detailed body, verification steps, 3–5 screenshots; PR must stand on its own).

**Target PR flow:** fork → base `main` ← compare `homework-X-submission`. Do not open PRs into the upstream course repo unless the user explicitly requests it.

## Repo scope hints

| Signal | Use in title/body |
|--------|-------------------|
| Branch `homework-N-submission` | Homework number `N`; scope title as `homework-N: …` |
| `homework-N/README.md`, `HOWTORUN.md` | Link in **Documentation**; mirror run steps in **How to verify** |
| `homework-N/docs/screenshots/` | List 3–5 images in **Screenshots** with paths and what each shows |
| `homework-N/TASKS.md` | Tie **Summary** to required tasks and success criteria |

Infer homework folder from branch name, changed paths, or user message. If unclear, ask once.

## Parameters

Parse from `/pr-messages`, `/pr-message`, args, or the user message. **Default: title + recommended body.**

| Param | Default | Include when |
|-------|---------|--------------|
| `recommended` | **on** | Always (unless user asks only for another param). Full PR body in one copy-ready `text` fence. |
| `title` | **on** | Always. Omit only when user passes `no-title`, `no-title=true`, or asks for body only. |
| `branch` | auto | PR base branch. User passes `branch=<name>`, `branch <name>`, or phrases like "compare with develop". Aliases: `base`, `compare`, `compare-with`. |

Examples: `/pr-messages` → title + recommended body. `/pr-message no-title` → body only. `/pr-messages branch=main` → diff against `main`.

Do not emit `title` when `no-title` is set.

### Resolve `branch`

1. Use explicit `branch` (or alias) from args or user message.
2. Else use upstream tracking branch of the current branch if set.
3. Else pick `main` or `master` — whichever exists locally or on `origin`.
4. If ambiguous or missing, ask once; do not guess across multiple remotes.

Use the resolved branch as `<branch>` in all git commands below.

## Workflow

1. Resolve **branch**, then inspect: `git status`, upstream tracking, `git log <branch>...HEAD --oneline`.
2. Read the full diff: `git diff <branch>...HEAD` (use `--stat` first if large; path-scope if needed).
3. Skim `homework-N/TASKS.md` and `homework-N/README.md` when present on the branch.
4. Note screenshot files under `homework-N/docs/screenshots/` (or `screenshots/` if the homework uses that layout).
5. Skim recent merged PRs when `gh` is available: `gh pr list --state merged --limit 5`.
6. Draft **title** (unless `no-title`): outcome-focused, include homework number when applicable, ~72 characters when possible.
7. Draft **body** from the template below — fill every required section from the diff and repo docs; no placeholder lorem.
8. Do not open the PR unless the user explicitly asks.

## Body template

Use these headings **verbatim** in the PR body (course README alignment):

```markdown
#### Summary
What you implemented — enough detail for a reviewer unfamiliar with your branch. Outcomes and scope, not a file list.

#### How to verify
Numbered steps or commands a reviewer can run to confirm the solution. Pull from HOWTORUN.md when it exists; keep steps concrete and tied to this branch.

#### AI tools used
Which tools (e.g. Cursor, Claude, Copilot), how you used them (workflow, prompts, agents/skills), and what you verified manually.

#### Challenges
Problems you hit and how you addressed them. Omit only if the branch truly had none — then one sentence stating that.

#### Screenshots
3–5 items when the homework expects visual evidence (default for course submissions). For each: short label, what it demonstrates, and repo path under docs/screenshots/ (or homework screenshots folder). Remind the author to embed images in the PR body, not only link paths.

#### Documentation
Pointers to homework README.md and HOWTORUN.md in the repo. The PR must still be self-contained; these are supplements.
```

### Section rules

- **Summary**: One short paragraph or 2–5 outcome bullets when the PR spans distinct themes (agents, fixes, tests, docs). Explain *what* and *why*, not paths.
- **How to verify**: Numbered list. Include env setup, install, run command, and expected result. Add test commands when tests exist. Never use vague lines like "make sure it works."
- **AI tools used**: Name tools, describe prompt/workflow patterns, list agents or skills if relevant (e.g. homework-4 pipeline). State what you double-checked without AI.
- **Challenges**: Honest blockers (API limits, wrong assumptions, test flakiness) and resolution. Skip fabricating drama; skip section only when genuinely N/A.
- **Screenshots**: Minimum **3**, target **3–5** per README. If screenshot files are not in the diff yet, list planned captures with descriptive filenames. Format each as `- **Label** — what it shows (`homework-N/docs/screenshots/file.png`)`.
- **Documentation**: Markdown links to `homework-N/README.md` and `homework-N/HOWTORUN.md` when those files exist; adjust path if homework uses a different layout.

## Quality rules

1. **Analyze the full branch diff**, not only README or TASKS markdown. Code, agents, tests, and scripts matter when present.
2. **Submission-grade narrative** — this body is the primary grading artifact; bare one-liners will be rejected per course policy.
3. **No file inventory** under **Summary** — describe capabilities and outcomes.
4. **Verifiable checks only** — every **How to verify** step must be runnable from the diff/docs.
5. **Screenshots are required by default** for homework PRs unless the user says the homework has no visual deliverable.
6. **Match repo tone** — mirror recent PR titles when visible; homework titles often start with `homework-N:`.

## Anti-patterns

| Avoid | Prefer |
|-------|--------|
| One-line PR body | All six sections filled with substance |
| File-by-file changelog | Outcome-focused summary |
| "See README" with no verify steps | Self-contained verify steps + doc links |
| Skipping AI usage | Concrete tools, workflow, manual verification |
| Zero screenshots for homework | 3–5 labeled screenshot entries with paths |
| Vague verification | Commands, URLs, expected outputs |

## Output format

Emit **title** first (unless `no-title`), then **recommended** body.

### PR title (default)

**Title**

```text
homework-4: 4-agent pipeline with verified fixes and generated tests
```

### PR body (`recommended`)

**Recommended**

```text
#### Summary
...

#### How to verify
1. ...

#### AI tools used
...

#### Challenges
...

#### Screenshots
- **...** — ... (`homework-N/docs/screenshots/....png`)

#### Documentation
- [README.md](homework-N/README.md)
- [HOWTORUN.md](homework-N/HOWTORUN.md)
```

### Copy-ready block rules

- Use a plain `text` fence (not `markdown` or `bash`) so the body copies verbatim into GitHub.
- Inside the fence: PR content only — no param names or chat headings like "Recommended".
- Keep `####` headings exactly as in the template.
- Title and body are **separate** fenced blocks.

## Examples

See [examples.md](examples.md).
