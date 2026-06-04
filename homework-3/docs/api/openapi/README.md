# OpenAPI Contracts (HW3)

> **Canonical HTTP JSON shapes** for the Household Budget Platform MVP. Product behavior remains in [`specification.md`](../../../specification.md); route index in [`../public-routes.md`](../public-routes.md) and [`../internal-routes.md`](../internal-routes.md).

---

## Files

| File | Scope |
|------|--------|
| [`components/schemas.yaml`](components/schemas.yaml) | Shared `$ref` components (money, enums, DTOs, errors) |
| [`public-bff.openapi.yaml`](public-bff.openapi.yaml) | BFF `/api/v1` — all public routes |
| [`internal.openapi.yaml`](internal.openapi.yaml) | Service-to-service `/internal/v1` |

**OpenAPI version:** 3.1.0  
**Stack:** NestJS services; documentation-only (no codegen in homework package).

---

## How to view

1. **Swagger Editor:** https://editor.swagger.io — paste or import `public-bff.openapi.yaml` or `internal.openapi.yaml`.
2. **VS Code:** OpenAPI extension preview on the YAML files.
3. **Redocly CLI (optional):** `npx @redocly/cli preview-docs public-bff.openapi.yaml` from this directory.

---

## Authority

| Topic | Canonical |
|-------|-----------|
| Request/response JSON field types | **This folder** (`components/schemas.yaml`) |
| HTTP status per edge case | [`../errors-and-status-codes.md`](../errors-and-status-codes.md) |
| Route list and RBAC | [`../public-routes.md`](../public-routes.md), [`../internal-routes.md`](../internal-routes.md) |
| MongoDB collection fields | [`../../services/`](../../services/) §9, [`../../persistence/README.md`](../../persistence/README.md) |
| Business rules | [`specification.md`](../../../specification.md) + [`../../domain/`](../../domain/) |

On conflict: **behavior** = specification + domain docs; **API JSON shape** = OpenAPI here.

---

## Money and decimals

API bodies use **`amount` as string** (decimal pattern), not JSON `number`. Fixtures in [`../../../mocks/`](../../../mocks/) may use numbers for readability — see [`../../../mocks/README.md`](../../../mocks/README.md).

---

## Related

- [`../headers.md`](../headers.md)
- [`../../testing/testing-strategy.md`](../../testing/testing-strategy.md)
- [`../../architecture/monorepo-and-tooling.md`](../../architecture/monorepo-and-tooling.md)
