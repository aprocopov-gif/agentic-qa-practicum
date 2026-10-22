# Block 6 evidence

Short proof for **P35 — API catalog and first API tests**. No secrets. Status codes and response bodies below are copied only from commands run while writing this file (2026-10-22, local, `APP_URL` from `.env`).

## Links

| Artifact | Location |
|----------|----------|
| Pull request | [PR #19 — P35: API catalog and first API tests](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/19) |
| Commit | [`d9d7496`](https://github.com/aprocopov-gif/agentic-qa-practicum/commit/d9d74961630de7d701f0d481cb8992d126e15c64) on `feat/api-setup` |
| API catalog | [`api/CATALOG.md`](../api/CATALOG.md) |
| API fixtures | [`api/fixtures.ts`](../api/fixtures.ts) |
| Contract helpers | [`api/catalog-contract.ts`](../api/catalog-contract.ts) |
| Playwright `api` project | [`playwright.config.ts`](../playwright.config.ts) (`testDir: './api'`, `testMatch: '**/*.api.spec.ts'`, `dependencies: ['setup']`) |
| Request context helper | [`support/api-client.ts`](../support/api-client.ts) (`createApiContextForOwner`) |

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
