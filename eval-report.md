# Eval report

**Measured:** 2026-10-22  
**Window:** last 30 `playwright.yml` runs (30 available)  
**Sources:** `gh run list --workflow=playwright.yml --limit 30`, `gh pr list --state all --limit 40`, `gh pr view` / `gh pr checks` for heal and ticket-first PRs, `gh run view` on recent main failures. No Playwright report artifacts were downloaded this refresh.

## Summary

| | |
|--|--|
| Run outcomes (cancelled excluded from pass/fail) | 15 success · 12 failure · 3 cancelled |

| # | Metric | Result | Scored rate | How measured | Interpretation |
|---|--------|--------|-------------|--------------|----------------|
| 1 | Flake rate | insufficient data | — | Tests that passed only on retry ÷ tests in passing runs. Needs `playwright-report-*` (`retries: 2` in CI — not visible in job conclusions). Artifacts exist (e.g. `playwright-report-smoke` on [39720234450](https://github.com/aprocopov-gif/agentic-qa-practicum/actions/runs/39720234450)); none were opened this refresh. | Cannot judge retry-driven stability from conclusions alone. |
| 2 | Heal success rate | insufficient data | — | Heal PRs green on first CI with assertions unchanged ÷ all heal PRs; masked regressions (weakened `expect`) must be 0. Population: [#8](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/8) (PR smoke/sanity green; POM-only; body says assertions unchanged), [#9](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/9) (PR green; **changed** `tests/aqpbt-9-playdates-propose.spec.ts` expects), [#18](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/18) (PR smoke green; no `tests/` edits; merge-to-main sanity [39717635883](https://github.com/aprocopov-gif/agentic-qa-practicum/actions/runs/39717635883) failed). | Three heals is too small for a rate; #9 is not an assertions-unchanged heal; #18’s merge sanity failed. |
| 3 | Generation-gate pass rate | insufficient data | — | Ticket-first PRs that are CI green, conforming, and AC-mapped ÷ all ticket-first generation PRs. Population this window: [#11](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/11), [#15](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/15), [#16](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/16) (Jira + `features/*.feature.md`). Excludes foundation #1–#5, drift/demo #12–#14, scorer #17, heal #8/#9/#18, API practicum [#19](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/19). #15/#16 PR **smoke** passed; matching branch **sanity** failed. | Too few ticket-first PRs, and smoke vs sanity disagree — not enough to score a pass rate. |
| 4 | Ask vs guess | qualitative (small sample) | N/A | Review of ticket PR bodies and `features/AQPBT-8.feature.md`, `features/AQPBT-14.feature.md` (Jira/BTQA cited; gaps listed instead of invented Confluence copy). No transcript-wide audit. | Plans document missing AQPBT Confluence pages and Jira vs BTQA conflicts rather than inventing UI strings. Sample too small for a numeric ask/guess ratio. |

| | |
|--|--|
| **Top reliability risk** | `push` to `main` runs **sanity** and has failed on the last several merges ([#15](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/15), [#16](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/16), [#17](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/17), [#18](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/18), [#19](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/19)) while the matching PR **smoke** jobs were green. Latest red: [39720313937](https://github.com/aprocopov-gif/agentic-qa-practicum/actions/runs/39720313937). Shared BuddyTime tenant data (weekly availability mutation noted in AQPBT-8) remains a second risk; cleanup 404s are noise, not flakes. |
| **Next action** | Open the `playwright-report-sanity` artifact from [39720313937](https://github.com/aprocopov-gif/agentic-qa-practicum/actions/runs/39720313937) and name the failing tests; download one passing `playwright-report-*` and count pass-on-retry. Do not score flake, heal, or generation-gate until those counts exist. |
