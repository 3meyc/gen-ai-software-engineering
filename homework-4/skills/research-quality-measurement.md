# Research Quality Measurement

Skill for the **Bug Research Verifier** agent. Use this skill when writing `verified-research.md` to assign a research quality level and document verification results.

## Purpose

Measure how reliable Bug Researcher output is before the Bug Planner acts on it. Quality is based on verifiable evidence (file:line references and snippet fidelity), not on writing style.

## Quality levels

| Level | Label | When to assign |
|-------|-------|----------------|
| **L1** | Unusable | More than half of claims have broken references or mismatched snippets; root cause is speculative; Bug Planner cannot safely proceed |
| **L2** | Weak | Some claims verified, but multiple broken refs or missing coverage of affected modules; planner needs additional research |
| **L3** | Adequate | Majority of claims verified with matching snippets; minor gaps documented; planner can draft a fix plan with noted caveats |
| **L4** | Strong | All cited file:line references exist; every checked snippet matches source exactly; clear repro steps and fix hints; no blocking discrepancies |

## Scoring checklist

Score each dimension **Pass** or **Fail**, then map to a level using the table above.

| Dimension | Pass criteria |
|-----------|---------------|
| **Reference accuracy** | Every `file:line` cited resolves to an existing file; line number is within file bounds |
| **Snippet fidelity** | Quoted code matches source at that location (ignoring whitespace-only differences) |
| **Coverage** | Research covers all modules/files implicated by the bug hypothesis |
| **Actionability** | A planner can derive concrete file edits and a test command without guessing |

### Level mapping rules

1. Any **Fail** on reference accuracy for more than 50% of claims → **L1**
2. Reference accuracy mostly pass but snippet fidelity fails on multiple claims → **L2**
3. All dimensions pass with minor documented gaps → **L3**
4. All dimensions pass with zero blocking discrepancies → **L4**

## Verification pass/fail (overall)

- **Pass:** Quality level is **L3** or **L4** AND no claim marked as blocking discrepancy
- **Fail:** Quality level is **L1** or **L2** OR any blocking discrepancy remains unresolved

## Required output template

Write `context/bugs/{BUG_ID}/research/verified-research.md` using this structure exactly:

```markdown
# Verified Research — {BUG_ID}

## Verification Summary

| Field | Value |
|-------|-------|
| Overall | PASS or FAIL |
| Research Quality | L1 Unusable / L2 Weak / L3 Adequate / L4 Strong |
| Claims checked | {N} |
| Claims verified | {N} |
| Discrepancies | {N} |

## Verified Claims

| # | Location | Snippet match | Status | Notes |
|---|----------|---------------|--------|-------|
| 1 | `file:line` | Yes/No | VERIFIED / REJECTED | Brief note |

## Discrepancies Found

| # | Location | Issue | Severity | Suggested correction |
|---|----------|-------|----------|---------------------|
| 1 | `file:line` | Description | blocking / minor | What research should say instead |

If none: `No discrepancies found.`

## Research Quality Assessment

**Level:** L{n} {Label}

**Reasoning:**
- Reference accuracy: {Pass/Fail} — {one sentence}
- Snippet fidelity: {Pass/Fail} — {one sentence}
- Coverage: {Pass/Fail} — {one sentence}
- Actionability: {Pass/Fail} — {one sentence}

## References

- Input: `context/bugs/{BUG_ID}/research/codebase-research.md`
- Source files reviewed: {list paths}
```

## Discrepancy severity

| Severity | Definition |
|----------|------------|
| **blocking** | Wrong file, wrong line, or snippet does not match; planner must not rely on this claim |
| **minor** | Imprecise line number (±few lines), paraphrased snippet with same semantics, or missing non-critical context |

## Verifier workflow

1. Read `codebase-research.md` and extract every `file:line` claim and snippet.
2. Open each source file; confirm existence and snippet equality.
3. Record each claim in **Verified Claims** table.
4. Document mismatches in **Discrepancies Found**.
5. Apply checklist; assign level and overall pass/fail.
6. Write output file only — do not modify application source.
