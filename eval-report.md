# Eval report

Window: last 17 `playwright.yml` runs (all that exist; N default 30). Measured 2026-10-12 from `gh run list --workflow=playwright.yml --limit 30` and `gh pr list --state all`.

## Metrics

### 1. Flake rate

**insufficient data** — GitHub job conclusions do not expose Playwright retry counts (`retries: 2` in CI) without downloading each `playwright-report` artifact. Passing jobs show a single successful “Run Playwright” step. Four red PR runs on `agents-set-up` (38334346811, 38334538741, 38334654256, 38333983042) stayed failed; they were locator/setup defects later fixed by commits, not recovered retries.

### 2. Heal success rate

**0 / 0** — no PRs on `heal/*`. Assertion-weakening count in heal PRs: not applicable. Dashboard child-row locator fixes shipped as commits on `agents-set-up` inside [PR #5](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/5), not as dedicated heal PRs.

### 3. Generation-gate pass rate

**0 / 0 prior; first ticket PR in flight** — PRs #1–#5 are foundation, skills, and agent/CI setup, not ticket-first generation. AQPBT-14 (`tests/aqpbt-14-friends-manage`) is the first mapped generation: Gherkin in `features/AQPBT-14.feature.md`, local `npx playwright test tests/aqpbt-14-friends-manage.spec.ts --workers=1` → 8/8 spec + 2 setup passed. CI on that PR is not in this window yet.

### 4. Ask vs guess

This AQPBT-14 session used only ticket, explore crawl, and existing POM strings (`Friends`, `manage`, `report`, `block`, `remove`, `cancel`, `Schedule Playdate`, `The Nguyens`, `The Petrovs`). No Confluence feature page exists in space AQPBT; that gap is listed in the Gherkin comment block instead of filled in. Report/block/remove were not clicked.

## Top reliability risk

Generation-gate and flake rate have no historical sample. Circle families on `/friends` are shared tenant data, not created per test — a missing card would fail the whole AQPBT-14 spec.

## Next action

After AQPBT-14 CI completes, recount generation-gate (1/1 or 0/1) and download one passing report to measure retries for flake rate.
