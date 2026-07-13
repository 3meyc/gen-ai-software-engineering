# PR message examples

Message **content** below. Agent wraps output per **Parameters** (default: title + recommended body).

## Default: `/pr-messages` (homework-4 pipeline)

**Title**

```text
homework-4: 4-agent bug pipeline with security review and unit tests
```

**Recommended**

```text
#### Summary
Implements the required four-agent pipeline (research verifier, bug fixer, security verifier, unit test generator) runnable via a single `npm run pipeline` command. Adds research-quality measurement skill, agent definitions with per-agent model selection, applied fixes from verifier output, and Vitest coverage for changed modules.

#### How to verify
1. Clone the fork and checkout `homework-4-submission`.
2. Follow `homework-4/HOWTORUN.md`: install dependencies, set any env vars listed there.
3. Run `npm run pipeline` from `homework-4/` and confirm agents execute in order without manual steps between them.
4. Run `npm test` and confirm all generated/updated tests pass.
5. Open `homework-4/research/verified-research.md` and confirm verification summary matches the research-quality skill levels.

#### AI tools used
Used Cursor Agent with project skills (`commit-messages`, `vitest-testing`, custom research-quality skill). Workflow: TASKS.md → agent `.agent.md` files → iterative prompt refinement per agent role. Manually verified every file:line claim in verified research against source and re-ran the full pipeline after fixer changes.

#### Challenges
Initial verifier flagged stale line references after fixer edits; resolved by re-running research verifier after fixes and tightening the skill to require snippet equality checks. Security agent over-flagged devDependencies — constrained prompts to production code paths only.

#### Screenshots
- **Pipeline run** — terminal showing single-command agent sequence (`homework-4/docs/screenshots/pipeline-run.png`)
- **Research verifier output** — verified-research.md quality assessment (`homework-4/docs/screenshots/verified-research.png`)
- **Fixer diff** — applied fixes in editor/agent trace (`homework-4/docs/screenshots/fixer-applied.png`)
- **Security report** — vulnerabilities verifier summary (`homework-4/docs/screenshots/security-report.png`)
- **Test results** — Vitest pass output after test generator (`homework-4/docs/screenshots/test-results.png`)

Embed these images in the PR body before requesting review.

#### Documentation
- [README.md](homework-4/README.md) — approach, agent models, and AI usage narrative
- [HOWTORUN.md](homework-4/HOWTORUN.md) — environment setup and pipeline commands
```

## Homework spec/docs only (homework-3 style)

**Title**

```text
homework-3: FinTech import platform specification package
```

**Recommended**

```text
#### Summary
Delivers the homework-3 specification package: consolidated API contracts, testing strategy, Mars Family RBAC fixtures, and traceability from TASKS.md to docs. No platform implementation in this branch — documentation and agents.md only.

#### How to verify
1. Open `homework-3/docs/README.md` and follow links to `api/`, `testing/`, and `registry/` — no broken paths.
2. Confirm `specification.md` document map matches files on disk.
3. Cross-check Appendix B locked decisions against `TASKS.md` success criteria.

#### AI tools used
Cursor for drafting spec sections from TASKS.md constraints; Claude for reviewing API error matrix completeness. Manually verified all HTTP status codes against `docs/api/errors-and-status-codes.md` scenarios.

#### Challenges
Balancing MVP vs Phase 2 scope without scope creep — split lifecycle docs and marked PH2 items explicitly optional in specification.md.

#### Screenshots
- **Document map** — specification navigation (`homework-3/docs/screenshots/document-map.png`)
- **API errors matrix** — status code coverage (`homework-3/docs/screenshots/api-errors.png`)
- **Agent context** — Cursor rules/skills layout (`homework-3/docs/screenshots/cursor-setup.png`)

#### Documentation
- [README.md](homework-3/README.md)
- [HOWTORUN.md](homework-3/HOWTORUN.md) — N/A for spec-only; see README for review workflow
```

## With `no-title`

`/pr-messages no-title` — body only when the GitHub title field is already filled.

## Bad — bare submission (rejected per README)

```text
Homework 4 done. See README.
```

**Why bad:** No verify steps, AI usage, challenges, or screenshots; fails course PR quality bar.

## Bad — file inventory summary

```text
#### Summary
- Added agents/research-verifier.agent.md
- Added skills/research-quality-measurement.md
- Updated package.json
```

**Why bad:** Lists files instead of outcomes; describe the pipeline and what it achieves.

## Bad — vague verification

```text
#### How to verify
Run the app and check that everything works.
```

**Why bad:** Not actionable; provide commands, paths, and expected results.
