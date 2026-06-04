# Homework 3 — Cursor local config

Project-local rules and skills for agents working in `homework-3/`.

## Rules (`.cursor/rules/`)

| File | Purpose |
|------|---------|
| `Agent-Output-Rules.mdc` | Chat format, scope (`homework-3/` only) |
| `Stack-Domain-Rules.mdc` | NestJS/Angular/Mongo/FinTech |
| `Agent-Context-Startup-Rules.mdc` | Read `agents.md` + `docs/README.md` first |
| `Vitest-Testing-Rules.mdc` | Vitest only under `platform/` |
| `commit-messages.mdc` | Conventional Commits — local skill |
| `pr-messages.mdc` | PR titles/bodies — local skill |

## Skills (`.cursor/skills/`)

| Skill | Purpose |
|-------|---------|
| `commit-messages/` | Draft git commit messages (HW3-scoped examples) |
| `pr-messages/` | Draft pull request descriptions |
| `vitest-testing/` | Tests per [`docs/testing/testing-strategy.md`](../docs/testing/testing-strategy.md) |

## Repo root

When the workspace is the full course repository, [`.cursor/rules/homework-3-stack.mdc`](../../.cursor/rules/homework-3-stack.mdc) also applies (`globs: homework-3/**`).

## Opening this folder in Cursor

Open `homework-3/` as the workspace root for full local rule discovery, or use `homework-3-stack.mdc` at the repo root.
