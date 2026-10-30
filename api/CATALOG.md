# BuddyTime API catalog (live exploration)

Captured **2026-10-21** against `https://test.buddytime.ca` using **Playwright MCP** (`browser_run_code_unsafe`) with main-family **`playwright/.auth/user.json`** storage state (session already authenticated; no credentials logged). Pages visited read-only except **Dashboard**: one child created with a unique name and removed immediately. **Calendar** (`/calendar`) callers merged **2026-10-23** from a signed-in page load with the same storage state (read-only; no month or date clicks).

Static assets, images, fonts, analytics, and Next.js data routes were excluded. All observed API calls sent **`Authorization: Bearer …`** (token sourced from `bt_token` in storage state/localStorage per `support/api-client.ts`).

| method | path (ids → `{id}`) | page that called it | how it's authenticated | status seen | status without token (2026-10-21) | request body fields (writes) | response top-level fields and types | safe for tests? | evidence |
|--------|----------------------|---------------------|-------------------------|-------------|--------------------------------|-------------------------------------|-----------------|----------|
| GET | `/api/v1/me` | Dashboard; Calendar; Friends; Communities; Availability; Playdates; Birthdays; Profile | Bearer token (Authorization header) | 200 | 401 | — | `parent` (object: `id`, `email`, `name`, `displayName`, `phone` null, `emailVerified` boolean); `family` (object: `id`, `name`, `addressText` null, `addressVisibility`, `tz`, `parents` array, `children` array of child objects); `isAdmin` boolean | yes | executed |
| GET | `/api/v1/connections` | Dashboard; Calendar; Friends; Communities; Availability; Playdates; Birthdays; Profile | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id` string; `family` object; `children` array; `communities` array; `since` string; `status` string; `blockedByMe` boolean | yes | executed |
| GET | `/api/v1/availability` | Dashboard; Availability | Bearer token (Authorization header) | 200 | 401 | — | `rules` array (items: `id`, `childId`, `weekday`, `startMin`, `endMin`, `hosting`, `noticeHours`); `exceptions` array (items: `id`, `date`, `kind`, `startMin`, `endMin`, `note`) | yes | executed |
| GET | `/api/v1/playdates` | Dashboard; Calendar; Playdates | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `status`, `startsAt`, `endsAt`, `locationKind`, `locationText`, `notes`, `proposerFamily`, `inviteeFamily`, `otherFamily`, `hostFamily`, `children`, `proposedBy`, `respondedAt`, `cancelledAt`, `googleCalendarUrl`, `icsUrl`, `canRespond`, `canCancel` | yes | executed |
| GET | `/api/v1/communities` | Dashboard; Communities; Birthdays | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `name`, `type`, `description`, `myRole`, `myStatus`, `familiesCount`, `pendingCount`, `createdAt` | yes | executed |
| GET | `/api/v1/matches` | Playdates | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `date`, `startMin`, `endMin`, `startsAt`, `endsAt`, `family`, `suggestedHost`, `locationKind` | yes | executed |
| GET | `/api/v1/events` | Calendar; Birthdays | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `kind`, `title`, `childId` (string or null), `childName` (string or null), `startsAt`, `endsAt` (string or null), `venueText` (string or null), `details` (string or null), `cardKey`, `status`, `communityId` (string or null), `communityName` (string or null), `rsvpToken`, `counts` (object: `yes`, `no`, `maybe`, `guestsComing` numbers), `createdAt`, `canManage` (boolean) | yes | executed |
| GET | `/api/v1/communities/{id}` | Birthdays (detail for a listed community) | Bearer token (Authorization header) | 200 | 401 | — | object: same list fields as `/api/v1/communities` items plus `members` array | yes | executed |
| POST | `/api/v1/children` | Dashboard (add/remove child) | Bearer token (Authorization header) | 201 | — | `firstName`, `birthYear`, `birthMonth`, `avatarKey`, `interests` (optional `gender` not sent by default UI flow) | object: `id`, `firstName`, `birthYear`, `birthMonth`, `age`, `gender`, `interests`, `avatarKey` | yes (undo via DELETE below) | executed |
| DELETE | `/api/v1/children/{id}` | Dashboard (add/remove child) | Bearer token (Authorization header) | 204 | — | — | empty body | yes (teardown for created children) | executed |
| POST | `/api/v1/availability/exceptions` | — | Bearer token (expected; same as other `/api/v1` calls in repo) | — | — | `date`, `kind`, `startMin`, `endMin`, `note` (inferred from cleanup skill / fixture path only) | — | no (create seen only in repo docs; delete not executed this session) | inspected only |
| DELETE | `/api/v1/availability/exceptions/{id}` | — | Bearer token (expected) | — | — | — | — | no (not executed this session) | inspected only |
| POST | `/api/v1/playdates` | — | Bearer token (expected) | — | — | — | — | no (not executed this session) | inspected only |
| POST | `/api/v1/playdates/{id}/cancel` | — | Bearer token (expected) | — | — | — | — | no (not executed this session) | inspected only |
| GET | `/api/v1/events/{id}/ics` | — | unknown | — | — | — | — | no (referenced in feature notes only; not called this session) | inspected only |

## Write bodies observed (Dashboard child)

**POST `/api/v1/children`** (201):

```json
{
  "firstName": "<unique>",
  "birthYear": 2018,
  "birthMonth": 6,
  "avatarKey": "fox",
  "interests": []
}
```

**DELETE `/api/v1/children/{id}`** — no request body; **204** with empty response.

## Authorization (two families)

Executed **2026-10-29** via `api/authorization.api.spec.ts` (main family = Family A / `playwright/.auth/user.json`; alt = Family B / `playwright/.auth/alt-user.json`):

| call | status seen | evidence |
|------|-------------|----------|
| `DELETE /api/v1/children/{id}` where `{id}` belongs to Family A, Bearer token for Family B | **404** | executed |
| Same `DELETE`, no Bearer token | **401** | executed |
| After failed cross-family or unauthenticated `DELETE`, `GET /api/v1/me` as Family A | **200**; `family.children` still includes that `{id}` | executed |
| After Family A creates a child, `GET /api/v1/me` as Family B | **200**; `family.children` does not include Family A’s `{id}` | executed |
| After Family A creates a child, `GET /api/v1/availability` as Family B | **200**; body omits Family A’s `{id}` | executed (AQPBT-8) |
| After Family A creates a child, `GET /api/v1/matches` as Family B | **200**; body omits Family A’s `{id}` | executed (AQPBT-9) |
| After Family A creates a child, `GET /api/v1/playdates` as Family B | **200**; body omits Family A’s `{id}` | executed (AQPBT-10/11/12) |
| `POST /api/v1/playdates/{id}/cancel` where `{id}` belongs to Family A, Bearer token for Family B | **4xx**; Family A row not `cancelled` | executed (AQPBT-10) |
| `GET /api/v1/connections` as Family A after creating a child | **200**; circle names present; body omits new `{id}` | executed (AQPBT-14) |
| `GET /api/v1/connections` as Family B (alt) | **200**; includes connected main family name; `/me` omits Family A child `{id}` | executed (AQPBT-14) |

**Not yet tested** (authorization):

- Error JSON shape for cross-family or unauthenticated `DELETE /api/v1/children/{id}` (only status codes recorded).
- `DELETE` with expired or invalid Bearer (401 vs 403).
- Cross-family or anonymous `DELETE` on other write routes (playdates, availability exceptions, communities, etc.).
- Whether Family B receives **403** instead of **404** for another family’s child id on a future API version.

## Not yet tested

- Pagination, cursors, or max list sizes for `GET /api/v1/connections`, `/playdates`, `/matches`, `/events`, or `/communities`.
- Error response JSON shape (4xx/5xx) and which status codes each endpoint returns.
- Rate limits or throttling headers.
- Behavior with an expired or invalid Bearer token (401 vs 403).
- Unauthenticated error body beyond `401` + JSON (`message`, `statusCode` on `GET /api/v1/me` only; other routes not verified).
- `PUT`/`PATCH` availability weekly rules (only `GET /api/v1/availability` was triggered; no save flow opened).
- Playdate propose/accept/decline writes (`POST /api/v1/playdates`, respond/cancel variants).
- Community join/create/approve flows and friend invite/accept APIs (no writes on Friends/Communities pages).
- Birthday party create/update/delete and guest RSVP APIs.
- Profile update endpoints (Profile page only triggered `me` + `connections`).
- Whether `GET /api/v1/events/{id}/ics` requires auth or works anonymously.
- Full nested schemas for `family`, `proposerFamily`, and `members` objects (only top-level keys sampled).
- Non-null shapes for `childId` / party-hosted events (main-family list was all `kind` birthday with null `childId` when API tests were written).
- Calendar month change or date-cell clicks (no prev/next controls used; page load only).
