# Development Plans (HW3)

> Archived **Cursor agent execution plans** used while building this specification package. They are **not graded deliverables**; they document *how* the package was produced and what each iteration changed.

Live copies may also exist at the repository root under [`.cursor/plans/`](../../.cursor/plans/) (same content, Cursor-internal filenames).

---

## Plans (chronological)

| # | File | Summary | Outcome |
|---|------|---------|---------|
| 1 | [`01-initial-specification-package.md`](01-initial-specification-package.md) | End-to-end creation of the HW3 household budget spec: MO IDs, domain docs, seven service docs, `specification.md`, `agents.md`, mocks, README | Full graded package scaffold |
| 2 | [`02-spec-package-documentation-fixes.md`](02-spec-package-documentation-fixes.md) | Additive API/testing docs, traceability matrix, `docs/` reorg with redirect stubs, platform path clarity, Phase 2 split | Navigation and contract index without changing spec §1–§14 behavior |
| 3 | [`03-openapi-persistence-and-tooling.md`](03-openapi-persistence-and-tooling.md) | OpenAPI 3.1 YAML, per-service Mongo §9 schemas, npm + Vitest + supertest toolchain (no Hono) | [`docs/api/openapi/`](../docs/api/openapi/), [`docs/persistence/`](../docs/persistence/), [`docs/architecture/monorepo-and-tooling.md`](../docs/architecture/monorepo-and-tooling.md) |

---

## How to use these files

- **Graders / readers:** Start with [`../README.md`](../README.md) and [`../specification.md`](../specification.md); use plans only if you want the design narrative or iteration history.
- **Agents implementing `platform/`:** Prefer [`../agents.md`](../agents.md), [`../docs/README.md`](../docs/README.md), and OpenAPI/persistence docs over re-executing old plan todos.

Each plan file includes YAML frontmatter (overview, completed todos) from Cursor Plan mode; body sections list phases, file paths, and validation checklists.

---

## Related

- [`../TASKS.md`](../TASKS.md) — course assignment requirements
- [`../docs/README.md`](../docs/README.md) — documentation index after plan 2–3
