# agentic-qa-practicum

**BuddyTime** is a family scheduling and playdate app; this repo holds Playwright automation against the shared BuddyTime test site (`APP_URL`, typically the practicum host under `test.buddytime.ca`).

Stories live in **Jira project AQPBT**; feature pages and notes live in **Confluence space AQPBT** (site URL in `ATLASSIAN_BASE_URL` when using CI/backlog automation) and in-repo under `features/`. Gherkin-style plans are named `features/<ticket-key>.feature.md` (for example `features/AQPBT-14.feature.md`).

## Prerequisites

- **Node.js 20+** (matches CI)

## Install

```bash
npm ci
npx playwright install --with-deps chromium
```

## Environment

Copy the template and fill in values for the flows you run:

```bash
cp .env.example .env
```

| Section in `.env.example` | Variables | Needed for |
|---------------------------|-----------|------------|
| **Run tests** | `APP_URL`, `APP_USER_EMAIL`, `APP_USER_PASSWORD` | Every `npx playwright test` run; `APP_URL` is Playwright `baseURL`. |
| **Run tests (two-family flows)** | `APP_ALT_USER_EMAIL`, `APP_ALT_USER_PASSWORD` | Specs that log in as a second parent (propose/accept playdates, cross-family UI). Tests that need the alt family **skip** when these are unset. |
| **Agent / CI setup** | `CURSOR_API_KEY`, `ATLASSIAN_*`, `JIRA_PROJECT_KEY`, `CONFLUENCE_SPACE_KEY` | Scheduled test-generation workflow and headless backlog runs—not required for local `playwright test` alone. |

**Why two family accounts:** BuddyTime models separate households. One storage state is built for the main family in the `setup` project; playdate and friends flows often need a second signed-in parent in another browser context. Using two dedicated test accounts avoids colliding with real users and matches how parents interact in the product.

Do not put **Cursor MCP** credentials in `.env` for day-to-day IDE use—configure Atlassian and GitHub MCP in **Cursor Settings → MCP** instead (see below).

## Run tests

| Goal | Command |
|------|---------|
| Full suite (local) | `npm test` or `npx playwright test` |
| App specs only (after auth setup) | `npx playwright test --project=app` |
| Smoke slice | `npm run test:smoke` |
| Sanity slice | `npm run test:sanity` |
| Regression slice | `npm run test:regression` |
| API-tagged tests | `npm run test:api` |
| E2E-tagged tests | `npm run test:e2e` |
| Destructive tests (serial) | `npm run test:destructive` |
| Single file | `npx playwright test tests/aqpbt-1-login.spec.ts` |
| Open last HTML report | `npx playwright show-report` |

Auth runs once in the `setup` project (`auth.setup.ts`); the `app` project depends on it and reuses `storageState`.

## CI triggers

Workflow: [`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)

| GitHub event | Job name | Command | Report artifact |
|--------------|----------|---------|-----------------|
| `push` (`main` only) | sanity | `npm run test:sanity` | `playwright-report-sanity` |
| `pull_request` | smoke | `npm run test:smoke` | `playwright-report-smoke` |
| `workflow_dispatch` | regression | `npx playwright test` | `playwright-report-regression` |

`push` is limited to **`main`** so PR branch updates run **smoke** only (no duplicate sanity + smoke on the same commit).

Secrets `APP_URL` and both families’ credentials are configured in the repository; they mirror the **Run tests** section of `.env.example`.

## Agent parts (Cursor)

| Path | Role |
|------|------|
| [`.cursor/rules/`](.cursor/rules/) | Always-on constitution, Playwright conventions, QA orchestrator routing, and `[Anna]` attribution for Atlassian writes. |
| [`.cursor/skills/`](.cursor/skills/) | Step-by-step playbooks (ticket → Gherkin, generation, triage, self-heal, eval report, cleanup, CLI exploration). |
| [`.cursor/agents/`](.cursor/agents/) | Delegates: **test-writer**, **triage**, **bug-reporter**—orchestrator invokes these instead of editing tests directly. |
| [`.cursor/hooks/`](.cursor/hooks/) | Post-edit guards that block weakened `expect()` calls and constitution violations on test/POM writes. |

## MCP setup (Cursor IDE)

1. Open **Cursor Settings → MCP** and enable **Atlassian** and **GitHub** with your account OAuth or tokens as each server documents.
2. Use MCP for Jira/Confluence reads and writes and for PR/check inspection during triage and generation.
3. Keep **Atlassian API tokens out of `.env`** for normal IDE sessions; `.env` Atlassian vars exist for CI and the test-generation workflow, not for replacing MCP in the editor.

## Typical flow

Read the Jira story (and linked Confluence page when present), produce or refresh Gherkin in `features/<key>.feature.md`, and delegate implementation to **test-writer** so specs and page objects follow the constitution. Run locally or on a PR; if CI fails, **triage** classifies drift vs product bug—drift goes to **self-heal** (POM-only), confirmed defects go to **bug-reporter**—then refresh **eval-report** when a heal or generation cycle completes.
