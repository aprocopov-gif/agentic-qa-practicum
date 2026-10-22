---
name: ci-failure-triage
description: When a CI run is red, pull the run's logs and the Playwright report artifact (`playwright-report-sanity`, `-smoke`, or `-regression`) via GitHub MCP or GH CLI, read the Playwright error and trace, cross-reference the spec, POM, and app source in the repo, classify real app bug vs test issue, and post a structured diagnosis to the PR. Use whenever a build fails — even if triage isn't asked for.
---

# CI failure triage

## Playwright CI (source of truth)

From `.github/workflows/playwright.yml`; tags from `.cursor/rules/playwright-conventions.mdc` § Tags.

| GitHub event | Job name | Command | Artifact |
|--------------|----------|---------|----------|
| `push` (`main` only) | sanity | `npm run test:sanity` | `playwright-report-sanity` |
| `pull_request` | smoke | `npm run test:smoke` | `playwright-report-smoke` |
| `workflow_dispatch` | regression | `npx playwright test` | `playwright-report-regression` |

PR failures are almost always **smoke**; **`main`** pushes are **sanity**. Branch pushes do not run this workflow (only `main`).

## Steps

1. Pull the failed run's logs and the report artifact from the table above (GitHub MCP, or `gh run view <id> --log` and `gh run download <id>` — artifact name `playwright-report-${{ steps.slice.outputs.artifact }}`). For a local red run, use the local report and `test-results/`.
2. Read the error: failing test, expected vs received, trace path. Inspect the trace from the command line with `npx playwright trace`. Quote the aria snapshot from the error context when Playwright includes one.
3. Cross-reference the spec, the page object, the story's acceptance criteria, and the Confluence page. BuddyTime's source isn't in this repo; compare against the documented behavior instead.
4. Classify exactly one: test issue (drift) | real app bug | ambiguous.
5. Report: root cause, affected file and line, expected/actual, suggested fix, and evidence (trace or screenshot path, run id) — as a PR comment when a PR exists, otherwise to the parent agent.

## Rules

- Never merge or apply a fix yourself; a real defect goes to jira-bug-reporter; the diagnosis names the location and the cause, not just the symptom.

## Report template

```markdown
## CI failure triage

**Classification:** test issue (drift) | real app bug | ambiguous

**Failing test:** `path/to.spec.ts` — "test title"

**Root cause:** …

**Location:** `file.ts:line` — …

**Expected:** …

**Actual:** …

**Suggested fix:** …

**Evidence:** run `<id>`; trace `…`; screenshot `…`

**Aria snapshot (if present):**
…
```
