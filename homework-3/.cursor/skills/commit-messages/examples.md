# Commit message examples

Message **content** below. Agent wraps output per **Parameters** (default: recommended only).

## HW3 spec package

**Recommended**

```text
docs(homework-3): add api contract and testing strategy docs

- Consolidate HTTP errors, routes, and MO verification in docs/api and docs/testing.
- Reorganize reference docs under registry, domain, compliance, and architecture.
```

## HW3 platform implementation

**Recommended**

```text
feat(platform/bff): add JWT and role guards for import confirm

- Enforce admin/superadmin on confirm per MO-2; forward actor headers downstream.
- Integration test: Mars father confirms, son receives 403.
```

## Single-theme (prose body)

```text
fix(platform/ledger): idempotent apply on duplicate previewId

Second confirm returns same reconciliation summary without extra inserts.
```

## With `split-suggestion`

**Split suggestion**

1. Spec docs

   ```text
   docs(homework-3): split data lifecycle into mvp and phase2
   ```

2. Cursor local config

   ```text
   chore(homework-3): add vitest and commit-message cursor skills
   ```

## Bad — file-inventory bullets

```text
docs: enhance README

- README.md: added Documentation section
- docs/api/public-routes.md: new file
```

**Why bad:** Bullets name files, not outcomes.
