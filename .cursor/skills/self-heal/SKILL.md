---
name: self-heal
description: Repairs drifted Playwright locators after a UI change — patch the POM, re-run unchanged assertions, open a PR. Use when the build is red because a locator broke, fix the drifted selector, the test broke after a UI change, or heal the suite. Use ONLY after triage classifies the red run as a test issue (drift/locator drift); NEVER for a real app bug — route those to bug-reporter instead.
---

# Self-heal

## Prerequisite

Live scorer output from `npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json` shows **`decision: act`** with **`side: drift`**, or **`decision: escalate`** with a human approval file at `.test-artifacts/approvals/<decisionId>.json`. Any other outcome → stop (do not patch POM).

## Steps

1. From the error and trace, find the failing test, the assertion line (read-only), the POM property that supplied the locator, and the old locator exactly as written.
2. Re-discover the element with `browser_navigate` + `browser_snapshot` against `APP_URL`: same role, current accessible name. Never guess from screenshots.
3. Patch only that locator in the POM (minimal diff; keep role-based; never CSS or XPath; never broaden it to make it pass). One locator per run.
4. Re-run the failing spec and prove it green with zero changes under `tests/`.
5. Open a PR on branch `heal/<short-description>` with the run id, the triage classification, the old → new locator diff, the re-run result, and the line "assertions unchanged". Do not merge.

## Stop and escalate

Stop and escalate if green needs an assertion change, if the same locator error persists after re-discovery, or if a new failure looks like a product regression.

## Report template

Use in the heal PR body (and as a handoff when stopping):

```markdown
## Self-heal

**Evidence scorer:** act · drift (or escalate + approval file)

**CI run:** `<run id>`

**Failing test:** `tests/….spec.ts` — "…"

**Assertion (unchanged):** `tests/….spec.ts:<line>`

**POM patch:** `pages/….ts` — property `…`

**Locator diff:**
- Old: …
- New: …

**Re-run:** `npx playwright test …` — passed

**assertions unchanged**
```

## Do / Don't

| Do | Don't |
| --- | --- |
| Patch one role-based locator in `pages/` per heal run | Change assertions, expectations, or spec logic under `tests/` |
| Re-discover names from `browser_snapshot` on `APP_URL` | Use CSS, XPath, or screenshot guessing |
| Require triage **test issue (drift)** before healing | Heal when classification is real app bug or ambiguous |
| Re-run only the failing spec; cite run id in the PR | Merge the heal PR yourself |
| Escalate to bug-reporter on product regression signals | Broaden locators (drop `exact`, wildcards) to force green |
| Keep the PR diff minimal | Fix multiple unrelated locators in one run |
