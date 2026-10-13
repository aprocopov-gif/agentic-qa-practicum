# Block 4 evidence

Short proof from the repo after P14–P22. No secrets.

## Part 0 — Tidy up

Moved in `a7ee35d` (`P14: jira-bug-reporter`):

- `.agents/skills/jira-ticket-analyzer/` → `.cursor/skills/jira-ticket-analyzer/`
- `.agents/skills/playwright-cli/` → `.cursor/skills/playwright-cli/`

Nothing else to remove: no `probe-dashboard.png` (or other agent screenshot) was committed.

**One-worker note:** does not apply here. Anna’s specs (AQPBT-9–12, login, dashboard) do not need `--workers=1` to go green. `playwright.config.ts` stays `fullyParallel: true` with no global `workers: 1`. Only `npm run test:destructive` uses `--workers=1`.

Constitution Index after P22 (`bef2b49`):

```
**Skills** (`.cursor/skills/`):

| Skill | Role |
| `api-cleanup` | Teardown test data |
| `ci-failure-triage` | Classify CI failures |
| `eval-report` | Refresh reliability metrics |
| `explore-and-generate` | Ticket-less flow discovery |
| `exploratory-charter` | Session charter format |
| `jira-bug-reporter` | Draft Jira bugs |
| `jira-ticket-analyzer` | Ticket to Gherkin |
| `playwright-cli` | Browser automation CLI |
| `pom-conventions` | POM structure rules |
| `self-heal` | Repair locator drift |
| `test-data-reset` | Delete leftover records |
```

## P15 — Tracked record types

From `.cursor/skills/api-cleanup/SKILL.md`, matching `support/record-tracker.ts` (`availability_exception` | `child` | `playdate`) and the delete/cancel calls in `support/api-client.ts`:

| type | create request | delete request | owner |
|------|----------------|----------------|-------|
| `availability_exception` | `POST /api/v1/availability/exceptions` | `DELETE /api/v1/availability/exceptions/{id}` | `main` or `alt` |
| `child` | `POST /api/v1/children` | `DELETE /api/v1/children/{id}` | `main` or `alt` |
| `playdate` | `POST /api/v1/playdates` | `POST /api/v1/playdates/{id}/cancel` | `main` or `alt` |

## P16 — Probe spec uses the page object

Probe spec deleted after verify (P16 instruction). Surviving spec that imports the page object without an inline locator:

`tests/aqpbt-1-login.spec.ts`

```typescript
import { test, expect } from '../fixtures/cleanup.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { ForgotPasswordPage } from '../pages/forgot-password.page';
import { FriendsPage } from '../pages/friends.page';
import { LandingPage } from '../pages/landing.page';
import { LoginPage } from '../pages/login.page';
```

`LoginPage.heading` is `getByRole('heading', { name: 'Welcome back', exact: true })`.

## P18 — Explore plan

**Path:** `features/explore-friends-manage-connection.feature.md`

**Selected gap:**

> **Manage connection on a trusted circle family** — the POM already models report, block, remove, and cancel, but nothing asserts the panel opens or closes safely; this is high-risk UX with zero automated checks.

No spec was added by that run. No app data was changed.

## P20 — Charter

No `charters/` file was kept after the P20 chats.

Skill rule (`.cursor/skills/exploratory-charter/SKILL.md`): required inputs are feature **and** risk — **ask if missing**. Asking without a risk must ask for the risk, not invent one.

## P22 — Reset must not auto-fire

Skill frontmatter (`.cursor/skills/test-data-reset/SKILL.md`):

```
name: test-data-reset
description: Deletes records that Playwright tests created… Use only when the user explicitly asks to reset test data…
disable-model-invocation: true
```

Plain “Clean up the test data.” does not invoke this skill (`disable-model-invocation: true`). The script is not run.

**Dry-run** (`npx tsx .cursor/skills/test-data-reset/scripts/reset-test-data.ts --dry-run`):

```
Scope · Found · Deleted · Failed
all tracked, dry-run · 0 · 0 · 0
```

Lists nothing, deletes nothing. “Found 0” after a green run is correct.
