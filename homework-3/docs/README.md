# Homework 3 — Documentation Index

> Navigation and **source-of-truth** rules for the specification package. Graded product spec: [`specification.md`](../specification.md).

---

## Reading order

1. [`specification.md`](../specification.md) §1–§4 — north star, objectives, NFR/SLOs
2. [`registry/scope-and-traceability.md`](registry/scope-and-traceability.md) — frozen IDs (`MO-*`, `SVC-*`, `PH2-*`, `TASK-*`)
3. [`architecture/architecture-overview.md`](architecture/architecture-overview.md) — services, data ownership, request flow
4. **Domain** — canonical model, dedup, RBAC, bank port, ingestion (under [`domain/`](domain/))
5. [`api/`](api/) — public/internal routes, headers, HTTP errors, [**OpenAPI**](api/openapi/)
6. [`testing/`](testing/) — verification strategy and fixtures; [`architecture/monorepo-and-tooling.md`](architecture/monorepo-and-tooling.md) for npm/Vitest
7. [`services/`](services/) — per-service endpoints, **§9 persistence**, DoD hooks
8. [`persistence/`](persistence/) — MongoDB index across six databases
9. [`../mocks/`](../mocks/) — Mars Family and sample data

---

## Source of truth (when docs overlap)

| Topic | Canonical document | Summarized in |
|-------|-------------------|---------------|
| Product requirements & tasks | [`specification.md`](../specification.md) | README, scope doc |
| Field names, txn schema, amounts | [`domain/canonical-banking-transaction-model.md`](domain/canonical-banking-transaction-model.md) | spec §8 |
| Dedup / reconcile algorithms | [`domain/deduplication-reconciliation-specification.md`](domain/deduplication-reconciliation-specification.md) | spec §8 |
| Role permissions & visibility | [`domain/household-rbac.md`](domain/household-rbac.md) | spec §9 |
| Bank OAuth / `BankProvider` | [`domain/bank-provider-adapter.md`](domain/bank-provider-adapter.md) | spec §7 |
| Ingestion sources MVP vs PH2 | [`domain/ingestion-sources-matrix.md`](domain/ingestion-sources-matrix.md) | spec §6 |
| HTTP status codes & edge behavior | [`api/errors-and-status-codes.md`](api/errors-and-status-codes.md) | spec §10 |
| Public BFF routes | [`api/public-routes.md`](api/public-routes.md) | architecture-overview |
| Internal service routes | [`api/internal-routes.md`](api/internal-routes.md) | architecture-overview |
| **HTTP JSON schemas** | [`api/openapi/`](api/openapi/) | public-routes, internal-routes |
| Request headers | [`api/headers.md`](api/headers.md) | spec §5 |
| MongoDB collection fields | [`services/`](services/) §9, [`persistence/README.md`](persistence/README.md) | architecture-overview |
| Monorepo / test toolchain | [`architecture/monorepo-and-tooling.md`](architecture/monorepo-and-tooling.md) | agents.md §2, §8 |
| SLO / latency targets | [`specification.md` §4](../specification.md#4-non-functional-and-policy) | architecture-overview (link only) |
| UA privacy & erasure policy | [`compliance/compliance-ukraine.md`](compliance/compliance-ukraine.md) | spec §4 |
| Tokens, retention, erasure (MVP) | [`compliance/data-lifecycle-mvp.md`](compliance/data-lifecycle-mvp.md) | spec §4–5 |
| Task ↔ MO counts | [`registry/traceability-matrix.md`](registry/traceability-matrix.md) | spec Appendix A |
| Phase 2 only | [`phase2/roadmap.md`](phase2/roadmap.md), [`compliance/data-lifecycle-phase2.md`](compliance/data-lifecycle-phase2.md) | spec §14 |

On conflict, **`specification.md` + canonical domain doc** win. Update summaries, not duplicate tables, when changing requirements.

---

## Folder map

| Folder | Contents |
|--------|----------|
| [`registry/`](registry/) | IDs, scope boundary, traceability matrix |
| [`architecture/`](architecture/) | Overview, configuration, monorepo/Vitest |
| [`domain/`](domain/) | Canonical model, dedup, RBAC, bank adapter, ingestion |
| [`compliance/`](compliance/) | Ukraine compliance, data lifecycle (MVP + Phase 2) |
| [`api/`](api/) | HTTP routes + [`api/openapi/`](api/openapi/) |
| [`persistence/`](persistence/) | MongoDB database index |
| [`testing/`](testing/) | Test strategy and fixture guide |
| [`services/`](services/) | Per-`SVC-*` endpoints and §9 persistence |
| [`phase2/`](phase2/) | Deferred capabilities (`PH2-*`) |
| [`_archive/`](_archive/) | Non-deliverable templates |

---

## Related entry points

- [`../agents.md`](../agents.md) — agent workflow and stack
- [`../README.md`](../README.md) — submission rationale
- [`../TASKS.md`](../TASKS.md) — assignment brief
- [`../plans/README.md`](../plans/README.md) — archived Cursor development plans (optional)
