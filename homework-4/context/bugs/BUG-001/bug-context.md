# BUG-001 — Leave request app (seeded defects)

> **Application:** Svelte 5 single-page UI for day off / vacation / sick leave submission  
> **Status:** Bugs intentionally present — fix via `npm run pipeline` (separate step)

## Summary

Employees submit leave requests with manager token approval. The UI shows calculated days and a reason preview after submission.

## Seeded bugs (functional)

### BUG-001a — Inclusive leave day count (off by one)

| Field | Value |
|-------|-------|
| **File** | `src/lib/leave-days.ts` |
| **Function** | `calculateLeaveDays` |
| **Symptom** | Multi-day ranges under-count by one (e.g. Jul 1–3 shows 2 days instead of 3) |
| **Cause** | Uses `Math.floor(diff / MS_PER_DAY)` without `+ 1` for inclusive end date |
| **Impact** | Wrong leave balance displayed on confirmation screen |

### BUG-001b — Missing date range validation

| Field | Value |
|-------|-------|
| **File** | `src/lib/validators.ts` |
| **Function** | `validateLeaveRequest` |
| **Symptom** | Form accepts `endDate` before `startDate` |
| **Cause** | No comparison between start and end dates |
| **Impact** | Invalid requests reach submission logic |

## Seeded security issues

### BUG-001c — Insecure token comparison

| Field | Value |
|-------|-------|
| **File** | `src/lib/auth.ts` |
| **Function** | `isManagerTokenValid` |
| **Issue** | Uses loose equality (`==`) instead of strict / timing-safe compare |
| **Impact** | Weak manager approval gate; security review should flag |

### BUG-001d — XSS via unsanitized reason HTML

| Field | Value |
|-------|-------|
| **Files** | `src/lib/reason-html.ts`, `src/App.svelte` |
| **Functions / markup** | `formatReasonAsHtml`, `{@html submission.reasonHtml}` |
| **Issue** | User reason embedded in HTML without escaping; rendered with `{@html}` |
| **Impact** | Script injection in reason field can execute in browser |

## Demo credentials

| Field | Value |
|-------|-------|
| Manager token | `mgr-approve-2026` |

## Reproduction

1. `npm run dev` → open http://localhost:5173
2. **BUG-001a:** Submit Jul 1–Jul 3 → confirmation shows **2** days (should be 3)
3. **BUG-001b:** Set end date before start date → form still submits
4. **BUG-001d:** Reason `<img src=x onerror="alert('xss')">` → executes in preview (demo only)

## Pipeline artifacts

| Artifact | Path |
|----------|------|
| Research (upstream) | `research/codebase-research.md` |
| Verified research | `research/verified-research.md` |
| Implementation plan | `implementation-plan.md` |
| Fix summary | `fix-summary.md` |
| Security report | `security-report.md` |
| Test report | `test-report.md` |
