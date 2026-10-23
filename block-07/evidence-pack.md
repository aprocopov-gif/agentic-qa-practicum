# Block 7 — API evidence pack

Short proof for Block 7 (P37–P42 API test kit). No secrets. Status codes and bodies below are copied only from commands run while writing this file (**2026-10-23**, local). Hostname taken from `APP_URL` (BuddyTime test site); no credentials or Bearer tokens logged.

## Links

| Artifact | Location |
|----------|----------|
| API catalog | [`api/CATALOG.md`](../api/CATALOG.md) |
| Contract spec (success + unauth) | [`api/me.api.spec.ts`](../api/me.api.spec.ts) |
| CI `api` job | [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) (`playwright-report-api`) |
| Kit PR | [PR #23](https://github.com/aprocopov-gif/agentic-qa-practicum/pull/23) |

---

## 1. Successful GET (catalog)

**Evidence item:** `GET /api/v1/me` — authenticated main family

**Basis:** executed

**Test performed:** Playwright API request via `createApiContextForOwner('main')` after `auth.setup` storage state; same route exercised in `api/me.api.spec.ts`.

**Command or request:**

```bash
npx playwright test api/me.api.spec.ts --project=api --reporter=line
```

```http
GET /api/v1/me HTTP/1.1
Host: <APP_URL host>
Authorization: Bearer <token from playwright/.auth/user.json — not logged>
```

**Expected status:** `200`

**Actual status:** `200` (spec run: **6 passed**, 3.0s, 2026-10-23; direct request same day)

**Expected body:** JSON object with top-level `parent` (object), `family` (object), `isAdmin` (boolean) per [`api/CATALOG.md`](../api/CATALOG.md).

**Actual body:** (PII redacted in this pack; shapes from live run)

```json
{
  "parent": {
    "id": "<redacted>",
    "email": "<redacted>",
    "name": "<redacted>",
    "displayName": "<redacted>",
    "phone": null,
    "emailVerified": true
  },
  "family": {
    "id": "<redacted>",
    "name": "<redacted>",
    "addressText": null,
    "addressVisibility": "circle",
    "tz": "America/Toronto",
    "parents": "array(len=1)",
    "children": "array(len=0)"
  },
  "isAdmin": true
}
```

**Content-Type:** `application/json; charset=utf-8`

**What this proves:** Main-family Bearer auth returns **200** and the catalog’s top-level `/api/v1/me` shape; the `@api` spec passes with those assertions plus unauthenticated coverage in the same test.

**What this does not prove:** Nested `parent` / `family` / `children` field completeness, other families’ payloads, or that every page-triggered caller returns identical JSON.

**Open question:** None for this endpoint at top-level contract scope.

---

## 2. Intentional error (no token)

**Evidence item:** `GET /api/v1/me` — unauthenticated

**Basis:** executed

**Test performed:** `request.newContext({ baseURL: APP_URL })` with no `Authorization` header; asserted in `api/me.api.spec.ts` via `expectUnauthenticatedCatalogGet` and repeated in a direct request the same day.

**Command or request:**

```http
GET /api/v1/me HTTP/1.1
Host: <APP_URL host>
(no Authorization header)
```

**Expected status:** `401` (`CATALOG_UNAUTHENTICATED_STATUS` in [`api/catalog-contract.ts`](../api/catalog-contract.ts); catalog column “status without token”)

**Actual status:** `401`

**Expected body:** JSON error (catalog notes `message` + `statusCode` on this route only; other list GETs not verified for body shape)

**Actual body:**

```json
{"message":"Unauthorized","statusCode":401}
```

**Content-Type:** `application/json; charset=utf-8`

**What this proves:** Omitting the Bearer token yields **401** with a small JSON body on `/api/v1/me`; the intentional error path in the contract test is grounded in a live call.

**What this does not prove:** 401 vs 403 for expired/invalid tokens, or that every other `/api/v1/*` GET returns the same error JSON (catalog lists that gap under **Not yet tested**).

**Open question:** Do list endpoints return the same `{ message, statusCode }` shape on 401?

---

## 3. Not yet tested

**Evidence item:** `GET /api/v1/events/{id}/ics` — auth requirement

**Basis:** not yet tested

**Test performed:** None in this pack. Row exists in [`api/CATALOG.md`](../api/CATALOG.md) as **inspected only** (feature notes / catalog placeholder; no live call in exploration or API specs).

**Command or request:** (not run)

```http
GET /api/v1/events/{event-id}/ics HTTP/1.1
Host: <APP_URL host>
Authorization: Bearer <unknown — not tested>
```

**Expected status:** unknown

**Actual status:** (not run)

**Expected body:** unknown (calendar export bytes or redirect)

**Actual body:** (not run)

**What this proves:** Nothing about runtime behavior — only that the route is tracked and explicitly out of scope until someone executes a call and updates the catalog.

**What this does not prove:** Whether the `.ics` URL works anonymously, requires the owning family’s token, or accepts an RSVP token; any of those would require a dedicated run and catalog update.

**Open question:** Can Family A fetch Family B’s event `.ics` with only `{id}` guessing, or is auth bound to the session / token on the event row?

*(Related catalog gap not run here: cross-family read authorization for arbitrary `{id}` on other resources — same **not yet tested** basis.)*

---

## Readiness checklist (API tests)

**Security:** Checked that this pack redacts ids/emails/names; [`api/CATALOG.md`](../api/CATALOG.md) uses `{id}` placeholders and no tokens; specs use [`api/fixtures.ts`](../api/fixtures.ts) / storage state rather than literal Bearer strings; CI secrets are GitHub `APP_*` env vars only; Playwright HTML report and shell output were not pasted with raw `bt_token` or `.env` values.

**Operations:** Local run: `npx playwright test --project=api` (setup project runs browser auth first). CI: [`.github/workflows/playwright.yml`](../.github/workflows/playwright.yml) job **`api`** on push, pull_request, and `workflow_dispatch`; artifact **`playwright-report-api`** (30 days) from `playwright-report/`.

**Documentation:** Per-endpoint method, path, auth, status, request/response top-level fields, and **evidence** column live in [`api/CATALOG.md`](../api/CATALOG.md); **Not yet tested** holds pagination, invalid-token behavior, `.ics` auth, cross-family access, and most write flows. Contract tests in `api/*.api.spec.ts` encode executed GET behavior; gaps stay in the catalog list until runs close them.

---

## What this pack does not prove

It does not show that the full `--project=api` suite is green in CI on every branch, or that every catalog **executed** row has a matching spec and paired error test. It also does not establish authorization between families, write-path undo, or any route still listed under **Not yet tested** — including anonymous vs authenticated access to event `.ics` exports.
