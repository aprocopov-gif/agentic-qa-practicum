# Eval report

**Measured:** 2026-10-16  
**Window:** last 30 `playwright.yml` runs (30 available)  
**Sources:** `gh run list --workflow=playwright.yml --limit 30`, `gh pr list --state all --limit 30`, PR/check inspection for heal and generation PRs.

## Summary

| | |
|--|--|
| Run outcomes (cancelled excluded from pass/fail) | 21 success · 6 failure · 3 cancelled |

| # | Metric | Result | Scored rate | How measured | Interpretation |
|---|--------|--------|-------------|--------------|----------------|
| 1 | Flake rate | insufficient data | — | Tests that passed only on retry ÷ tests in passing runs; needs `playwright-report-*` artifacts (`retries: 2` in CI—not visible in job conclusions alone). No artifacts downloaded this refresh. | Flake rate unknown; cannot judge retry-driven stability yet. |
| 2 | Heal success rate | insufficient data | — | Heal PRs green on first CI with assertions unchanged ÷ all heal PRs; masked regressions (weakened `expect`) must be 0. Population: merged [#8](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/8), [#9](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/9); final PR **smoke** checks green; hooks saw **0** assertion weakening (full diffs not scanned). | Sample too small for a rate; heals look healthy on final CI but #9 was not POM-only. |
| 3 | Generation-gate pass rate | insufficient data | — | Ticket-first PRs that are CI green, conforming, and AC-mapped ÷ all ticket-first generation PRs. Population: **1** merged ([#11](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/11)); excludes foundation #1–#5 and drift demos #12–#13. | One merged ticket PR after earlier reds on the same branch—not enough to score pass rate. |
| 4 | Ask vs guess | qualitative (small sample) | N/A | Review of generation/heal PR text and `features/*.feature.md` (missing Confluence noted in Gherkin; crawl URLs and POM copy cited). No transcript-wide audit. | Plans tend to ask or document gaps rather than invent UI; confidence limited by small sample. |

| | |
|--|--|
| **Top reliability risk** | Shared BuddyTime tenant data (fixed circle families, calendar slots)—list and playdate specs can fail from environment drift or missing cards, not only locators. |
| **Next action** | Download a recent passing `playwright-report-smoke`, `playwright-report-sanity`, or `playwright-report-regression` artifact and count pass-on-retry tests; after the next ticket-first PR, score generation-gate as 1/1 or 0/1 with explicit AC mapping. |
