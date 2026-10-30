# Authz probe plan (BuddyTime API)

Written **before any request** in this run. Sources: `api/CATALOG.md` (captured 2026-10-21; authorization notes 2026-10-29), `api/authorization.api.spec.ts`, `api/fixtures.ts`.

Clients (fixtures, not tokens): Family A = `mainApi`, Family B = `altApi`, no token = `unauthenticatedApi`.

## Safety

- Only the two saved test families (`playwright/.auth/user.json` / `alt-user.json` via fixtures).
- Writes: `POST /api/v1/children` as Family A only, immediately `trackRecord`; `DELETE /api/v1/children/{id}` attempts only on that created child.
- Every other attempt is `GET`.
- Hard cap **20** HTTP requests. Stop on any **5xx**.
- No Bearer tokens in files, logs, or chat.

## In-scope catalog rows

Rows that **take an id** or **return one family’s data**. Write routes other than the allowed child create/delete are listed as skipped.

| # | method | path | why in scope | attempts | catalog expectation |
|---|--------|------|--------------|----------|---------------------|
| 1 | GET | `/api/v1/me` | returns `family` (id, parents, children) | B + anonymous | 200 with token; 401 without |
| 2 | GET | `/api/v1/connections` | returns this family’s connections (`family`, `children`) | B; anonymous if budget | 200 / 401 |
| 3 | GET | `/api/v1/availability` | returns this family’s rules (`childId`) and exceptions | B; anonymous if budget | 200 / 401 |
| 4 | GET | `/api/v1/playdates` | returns this family’s playdates | B; anonymous if budget | 200 / 401 |
| 5 | GET | `/api/v1/communities` | returns this family’s memberships (`myRole`, `myStatus`) | B; anonymous if budget | 200 / 401 |
| 6 | GET | `/api/v1/matches` | returns this family’s match suggestions | B; anonymous if budget | 200 / 401 |
| 7 | GET | `/api/v1/events` | returns this family’s event list (`childId`, `rsvpToken`) | B; anonymous if budget | 200 / 401 |
| 8 | GET | `/api/v1/communities/{id}` | takes a community id | B + anonymous on **A’s** id | 200 owner; 401 no token; **cross-family not documented** |
| 9 | DELETE | `/api/v1/children/{id}` | takes a child id | B + anonymous on **A’s created** id | B → 404 (executed 2026-10-29); no token → 401; owner `GET /me` still has `{id}` |
| 10 | GET | `/api/v1/events/{id}/ics` | takes an event id | B + anonymous on **A’s** id | **auth unknown** (inspected only) |

## Skipped (safety — not GET / not allowed writes)

| method | path | reason |
|--------|------|--------|
| POST | `/api/v1/availability/exceptions` | write; not the allowed child create |
| DELETE | `/api/v1/availability/exceptions/{id}` | write; not a created-child DELETE |
| POST | `/api/v1/playdates` | write |
| POST | `/api/v1/playdates/{id}/cancel` | write |
| POST | `/api/v1/children` | setup only (Family A), not a cross-family probe |

## Request budget (≤ 20)

Owner setup (collect Family A ids; not classified as probes):

| # | who | call |
|---|-----|------|
| 1 | A (`mainApi`) | `POST /api/v1/children` — unique body from `buildChildCreatePayload`; `trackRecord` |
| 2 | A | `GET /api/v1/me` — family id + child ids (baseline) |
| 3 | A | `GET /api/v1/communities` — first `id` if the list is non-empty |
| 4 | A | `GET /api/v1/events` — first `id` if the list is non-empty |

Always-on probes + owner follow-up (11):

| # | who | call | HELD signal (needs owner follow-up, not status alone) |
|---|-----|------|------------------------------------------------------|
| 5 | B | `GET /api/v1/me` | 200 and B `family.id` ≠ A `family.id` and created child id **absent** from B `family.children` |
| 6 | anonymous | `GET /api/v1/me` | 401 (catalog); owner follow-up still has created child |
| 7 | B | `GET /api/v1/connections` | created child id **absent**, or present only as possible Friends sharing → `undocumented` |
| 8 | B | `GET /api/v1/availability` | created child id **absent** from `rules[].childId` |
| 9 | B | `GET /api/v1/playdates` | created child id **absent** from playdate `children` |
| 10 | B | `GET /api/v1/communities` | 200 with B’s own list (no claim A’s memberships are secret beyond `myRole`) |
| 11 | B | `GET /api/v1/matches` | created child id **absent** |
| 12 | B | `GET /api/v1/events` | created child id **absent** from `childId` |
| 13 | B | `DELETE /api/v1/children/{id}` | not 2xx; catalog 404 |
| 14 | anonymous | `DELETE /api/v1/children/{id}` | 401 |
| 15 | A | `GET /api/v1/me` | created child id **still present** (owner follow-up for every HELD) |

Remaining slots (≤ 5), in this order, skip if the id was never collected or the cap is reached:

| priority | who | call | if missing id |
|----------|-----|------|----------------|
| 16 | B | `GET /api/v1/communities/{id}` (A’s id) | skip |
| 17 | anonymous | `GET /api/v1/communities/{id}` | skip |
| 18 | B | `GET /api/v1/events/{id}/ics` (A’s id) | skip |
| 19 | anonymous | `GET /api/v1/events/{id}/ics` | skip |
| 20 | anonymous | first unused list GET among `/connections`, `/availability`, `/playdates`, `/communities`, `/matches`, `/events` | n/a |

If community or event ids are missing, those slots go to anonymous list GETs (catalog already recorded 401; this run re-checks only if budget remains).

## Outcome rules (applied after the run)

- **HELD** — B or anonymous did not receive or change Family A’s private row, **and** owner `GET /api/v1/me` still lists the created child. Status alone is not enough.
- **BREACHED** — Family B or anonymous received the created child on an owner-scoped resource (`/me` children, `/availability` rules, `/playdates` children, `/matches`, `/events` `childId`) or a `DELETE` removed it (owner follow-up missing the id).
- **undocumented** — catalog does not say what should happen. Includes: `GET /api/v1/events/{id}/ics` (auth unknown); cross-family `GET /api/v1/communities/{id}`; created child appearing on `GET /api/v1/connections` (Friends may list a connected family’s children).

## Spec

All attempts live in `api/authz-probe.api.spec.ts` (one `test()` so parallel workers cannot exceed 20 requests). Tag: `{ tag: '@api' }` on the test only. Run: `npx playwright test api/authz-probe.api.spec.ts --project=api`.
