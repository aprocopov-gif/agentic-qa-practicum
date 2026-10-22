# Block 6 evidence

Short proof for Block 6 (P29, P33, P35, P36). No secrets. Status codes, scorer JSON, and gate text below are copied only from commands run while writing this file (2026-10-22, local).

## Links

| Artifact | Location |
|----------|----------|
| P36 / gates PR | [PR #17 — Evidence scorer, Cursor gates, CI/triage docs](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/17) · commit [`6ba63c2`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/6ba63c2f4a7c8c52539f820a4c52980e8730ed0a) |
| P36 heal proof | [PR #18 — heal: restore login and Save availability copy](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/18) · commit [`a570c03`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/a570c03f11bce25ecc4f421bd704fbf8fdd5bf69) |
| P35 PR | [PR #19 — P35: API catalog and first API tests](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/19) · commit [`d9d7496`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/d9d74961630de7d701f0d481cb8992d126e15c64) |
| P29 eval baseline | [`14718a0`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/14718a0) — `P29: README and eval baseline` (local `main`, not pushed) |
| P33 harness | [`1e6acbb`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/1e6acbb) — `P33: scoring harness` (local `main`, not pushed) |
| API catalog | [`api/CATALOG.md`](../api/CATALOG.md) |
| API fixtures | [`api/fixtures.ts`](../api/fixtures.ts) |
| Contract helpers | [`api/catalog-contract.ts`](../api/catalog-contract.ts) |
| Playwright `api` project | [`playwright.config.ts`](../playwright.config.ts) (`testDir: './api'`, `testMatch: '**/*.api.spec.ts'`, `dependencies: ['setup']`) |
| Request context helper | [`support/api-client.ts`](../support/api-client.ts) (`createApiContextForOwner`) |
| Evidence scorer | [`scripts/score-evidence.ts`](../scripts/score-evidence.ts), [`config/evidence-rubric.json`](../config/evidence-rubric.json) |
| Agent scorer | [`evals/score.ts`](../evals/score.ts), [`evals/triage/answer-key.json`](../evals/triage/answer-key.json) |

## P29 — README and eval baseline

| Item | Label | Proof |
|------|-------|-------|
| [`README.md`](../README.md) | **inspected only** | Already on `main` before this session: BuddyTime one-liner; Jira AQPBT / Confluence AQPBT; Node 20+; `npm ci` + `npx playwright install --with-deps chromium`; `.env` sections + two-family note; run table; CI table (`push` → sanity, `pull_request` → smoke, `workflow_dispatch` → full suite); agent-parts table; MCP in Cursor settings; three-sentence flow |
| [`eval-report.md`](../eval-report.md) refresh | **executed** | Commit `14718a0`. Window: last 30 `playwright.yml` runs — **15 success · 12 failure · 3 cancelled**. Flake / heal / generation-gate marked **insufficient data** (no estimates). |

## P33 — Agent scoring harness

| Item | Label | Proof |
|------|-------|-------|
| [`evals/README.md`](../evals/README.md) | **inspected only** | Five-line how-it-works |
| [`evals/triage/answer-key.json`](../evals/triage/answer-key.json) | **inspected only** | Still `[]` — agent does not edit this file |
| [`evals/score.ts`](../evals/score.ts) | **executed** | `npx tsx evals/score.ts triage` (2026-10-22): `cases 0`, `runs 0`, per-class precision/recall `n/a`, `accuracy n/a`, `agreement n/a`, exit 0 |
| [`.cursor/skills/score-agent/SKILL.md`](.cursor/skills/score-agent/SKILL.md) | **inspected only** | Run agent N times (default 3) without showing the key; write run files; score; append Agent accuracy |
| Run files `evals/<agent>/runs/<date>-<n>.json` | **not yet tested** | No cases in the key, so no scoring pass written |

## P36 — Evidence scorer hand check + heal gate

**Label:** **executed** — `npm run test:evidence` **8/8 pass** (2026-10-22). Two fixture cases scored with `scoreEvidence(..., { verifyOnly: true, rootDir: scripts/evidence-fixtures/<case> })`. Rubric arithmetic from [`config/evidence-rubric.json`](../config/evidence-rubric.json) (`act` ≥ 60 + oracle on side → rule 6; `escalate` ≥ 35 → rule 7).

### Case A — `min-act-drift`

| | |
|--|--|
| **Hand calculation** | Required **R1–R4** (R3 because drift weighted items present). Drift weights: **D1** 40 (oracle) + **D2** 20 = **60**. Oracle on drift → **act · drift · rule 6**. |
| **Scorer output** | `{"decisionId":"6f299f01b0b5","decision":"act","side":"drift","score":60,"oracle":true,"verified":["R1","R2","R3","D1","D2","R4"],"missing":[],"contradictions":[],"rule":"rule:6","allowedActions":["self-heal","open-repair-pr"]}` |

### Case B — `min-escalate`

| | |
|--|--|
| **Hand calculation** | Required **R1–R4**. Drift weights: **D1** 40 only. 40 ≥ 35 and &lt; 60 → **escalate · drift · rule 7**. |
| **Scorer output** | `{"decisionId":"b576eaa77818","decision":"escalate","side":"drift","score":40,"oracle":true,"verified":["R1","R2","R3","D1","R4"],"missing":[],"contradictions":[],"rule":"rule:7","allowedActions":["escalate-human","gather-evidence"]}` |

### Heal gate denial

**Label:** **executed** — `EVIDENCE_GATE_FORCE_BRANCH=heal/block-06-probe`, stdin `{"tool_name":"Write","tool_input":{"path":"pages/login.page.ts"}}` into [`.cursor/hooks/guard-heal-gate.py`](../.cursor/hooks/guard-heal-gate.py). Hook **exit 2**, `permission: deny`. (`.test-artifacts/evidence/current.json` was a fixture copy whose relative paths do not resolve from repo root, so live scorer returned **inconclusive / rule 2** — still a deny.)

```
Evidence gate blocked Write to pages/login.page.ts on branch heal/block-06-probe. decisionId=b576eaa77818 decision=inconclusive side=none score=0 rule=rule:2. Missing: R1, R2, R3. Contradictions: none. Run: npx tsx scripts/score-evidence.ts --verify-only .test-artifacts/evidence/current.json (do not trust saved decision files or chat labels).
```

`heal_gate_allows` is also false for Case B (`escalate` without `.test-artifacts/approvals/b576eaa77818.json`).

## Proofs

| # | Link | Label | Notes |
|---|------|-------|-------|
| 1 | [PR #17](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/17) | **executed** | Merged. Scorer + fail-closed hooks. PR body: `npm run test:evidence`. |
| 2 | [PR #18](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/18) | **executed** | Repair PR. Body cites **`decisionId: 149540a71389`**, `act` · `drift`. Files: `pages/login.page.ts`, `test-data/availability.enums.ts` only. |
| 3 | [PR #19](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/19) | **executed** | P35 API catalog + `--project=api`. |

**Repair PR line (Proof 2)** — PR #18 body, **executed**:

```
assertions unchanged
```

**Decision files (Proofs 2 and 3)** — **not yet tested** / not in git (`.test-artifacts/` is gitignored and empty of committed copies). Proof 2 `decisionId` is known only from the PR #18 body. No `.test-artifacts/decisions/149540a71389.json` or rerun file is in the repo.

## Agent accuracy

**Label:** **not yet tested**. [`eval-report.md`](../eval-report.md) has no **Agent accuracy** section. [`evals/triage/answer-key.json`](../evals/triage/answer-key.json) is `[]`, so `npx tsx evals/score.ts triage` cannot produce precision/recall/accuracy (all `n/a`). Paste the section here after cases are filled and scored.

## playwright-bdd

**Label:** **not yet tested**. No `playwright-bdd` dependency, no `.feature` step-def package in this repo. Hand-written scenario and the one step the agent added are **not in the repo** — paste them here.

## Module 1 — first kit change

**Label:** **not yet tested**. One paragraph from Anna on what to change in the kit first, now that the kit is built — **not written yet**. Do not invent this text.

## API recap (P35, for Block 6 closeout)

| Item | Label | Proof |
|------|-------|-------|
| Catalog table rows | **executed** | **15** rows in [`api/CATALOG.md`](../api/CATALOG.md) (10 executed + 5 inspected only) |
| “Not yet tested” (two items) | **not yet tested** | Pagination / cursors on list GETs; expired or invalid Bearer token (401 vs 403) |
| `npx playwright test --project=api` | **executed** | **11 passed (3.2s)** — 2026-10-22, local |

## P35 — Live exploration catalog

| Item | Label | Proof |
|------|-------|-------|
| [`api/CATALOG.md`](../api/CATALOG.md) table (10 executed routes, auth Bearer, page mapping) | **executed** | Authored after Playwright MCP pass on app routes (`AppRoute` dashboard → profile) plus one dashboard child add/remove; see catalog header and `evidence` column |
| Catalog rows: `POST/DELETE /api/v1/availability/exceptions`, `POST /api/v1/playdates`, `POST …/cancel`, `GET /api/v1/events/{id}/ics` | **inspected only** | Listed from [`support/api-client.ts`](../support/api-client.ts), [api-cleanup skill](../.cursor/skills/api-cleanup/SKILL.md), or feature notes — not called in exploration or API specs |
| Catalog “Not yet tested” bullets (pagination, expired token, availability saves, etc.) | **not yet tested** | No run in catalog session, API specs, or commands below |

## P35 — First API tests (`--project=api`)

| Item | Label | Proof |
|------|-------|-------|
| `npx playwright test --project=api` | **executed** | **11 passed (3.2s)** — 2× `auth.setup.ts` + 9× `api/*.api.spec.ts` |
| `api/me.api.spec.ts` — GET `/api/v1/me` contract + unauthenticated call | **executed** | Green in run above |
| `api/connections.api.spec.ts` — GET `/api/v1/connections` | **executed** | Green in run above |
| `api/availability.api.spec.ts` — GET `/api/v1/availability` | **executed** | Green in run above |
| `api/playdates.api.spec.ts` — GET `/api/v1/playdates` | **executed** | Green in run above |
| `api/matches.api.spec.ts` — GET `/api/v1/matches` | **executed** | Green in run above |
| `api/events.api.spec.ts` — GET `/api/v1/events` | **executed** | Green in run above |
| `api/communities.api.spec.ts` — GET `/api/v1/communities` and `…/{id}` | **executed** | Green in run above (2 tests) |
| `api/children.api.spec.ts` — POST → GET `/api/v1/me` → DELETE via `deleteChild` + `trackRecord` | **executed** | Green in run above |
| Global teardown cleanup after successful in-spec delete | **executed** | Log line from same run: `Failed to delete child …: HTTP 404 — {"message":"Child not found","error":"Not Found","statusCode":404}` (child already removed in spec) |
| `api/fixtures.ts` — `mainApi`, `altApi`, `unauthenticatedApi` | **inspected only** | Read in repo; **`altApi` not referenced by any `*.api.spec.ts` yet** |
| `npm run test:api` (`--grep '@api'`) vs `--project=api` | **not yet tested** | Only `--project=api` was run for this evidence |

## Status codes and bodies (runs for this file)

**Unauthenticated** — `request.newContext({ baseURL: APP_URL })`, `GET /api/v1/me`:

```
status: 401
body: {"message":"Unauthorized","statusCode":401}
```

**Authenticated main family** — `createApiContextForOwner('main')` via `npx tsx`:

```
GET /api/v1/me     → 200, content-type: application/json; charset=utf-8
POST /api/v1/children → 201, body keys: id, firstName, birthYear, birthMonth, age, gender, interests, avatarKey
DELETE /api/v1/children/{id} → 204, body: (empty)
```

**Catalog-safe GETs (authenticated 200 + JSON, unauthenticated 401)** — asserted in **`npx playwright test --project=api`** (same run as above); individual response bodies for list endpoints were not copied here (specs check status, `content-type`, and top-level field types only).

## P35 — `createApiContextForOwner`

| Item | Label | Proof |
|------|-------|-------|
| Export wraps existing `getApiContext` (no duplicate token logic) | **inspected only** | [`support/api-client.ts`](../support/api-client.ts) diff in `d9d7496` |
| Used by API specs through `api/fixtures.ts` | **executed** | Green `--project=api` run |

## Inspected only (repo; no live call in P35 scope)

| Endpoint / behavior | Source |
|---------------------|--------|
| `POST /api/v1/availability/exceptions` | [`fixtures/cleanup.fixture.ts`](../fixtures/cleanup.fixture.ts), api-cleanup skill |
| `DELETE /api/v1/availability/exceptions/{id}` | [`support/api-client.ts`](../support/api-client.ts) |
| `POST /api/v1/playdates` | cleanup fixture / skill |
| `POST /api/v1/playdates/{id}/cancel` | [`support/api-client.ts`](../support/api-client.ts) |
| `GET /api/v1/events/{id}/ics` | [`features/AQPBT-12.feature.md`](../features/AQPBT-12.feature.md) (not in catalog execution) |

## Not yet tested (unchanged from catalog)

From [`api/CATALOG.md`](../api/CATALOG.md) § Not yet tested: pagination; generic 4xx/5xx error shapes; rate limits; expired/invalid token (401 vs 403); unauthenticated error body on routes other than `/api/v1/me`; availability writes; playdate/community/friend/profile/birthday writes; nested object schemas beyond catalog top-level keys.
