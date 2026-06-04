# PR message examples

## HW3 spec package PR

**Title**

```text
docs(homework-3): reorganize spec package and add api/testing docs
```

**Recommended**

```text
#### What changed
Adds docs navigation, HTTP contract layer, testing strategy, and traceability matrix. Splits MVP vs Phase 2 data lifecycle and clarifies implementation path under homework-3/platform/.

#### How to check
1. Open homework-3/docs/README.md and follow links to api/, testing/, and registry/.
2. Confirm specification.md Document map resolves (no broken docs/ paths).
3. Verify Appendix B locked decisions still stated in specification.md.

#### Linked issues
Closes #
```

## HW3 platform PR

**Title**

```text
feat(platform): scaffold BFF JWT guards and Mars Family seed
```

**Recommended**

```text
#### What changed
Implements TASK-BFF-001/002 and TASK-ID-003: JWT context, role guards, and Mars Family seed for RBAC integration tests.

#### How to check
1. Run npm test in homework-3/platform (Vitest).
2. Assert usr_mars_father can confirm import path; usr_mars_son receives 403 on confirm.

#### Linked issues
Closes #
```

## Bad — vague verification

```text
#### How to check
Make sure everything still works.
```
