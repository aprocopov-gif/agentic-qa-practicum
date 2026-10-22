# BuddyTime API catalog (live exploration)

Captured **2026-10-21** against `https://test.buddytime.ca` using **Playwright MCP** (`browser_run_code_unsafe`) with main-family **`playwright/.auth/user.json`** storage state (session already authenticated; no credentials logged). Pages visited read-only except **Dashboard**: one child created with a unique name and removed immediately.

Static assets, images, fonts, analytics, and Next.js data routes were excluded. All observed API calls sent **`Authorization: Bearer …`** (token sourced from `bt_token` in storage state/localStorage per `support/api-client.ts`).

| method | path (ids → `{id}`) | page that called it | how it's authenticated | status seen | status without token (2026-10-21) | request body fields (writes) | response top-level fields and types | safe for tests? | evidence |
|--------|----------------------|---------------------|-------------------------|-------------|--------------------------------|-------------------------------------|-----------------|----------|
| GET | `/api/v1/me` | Dashboard; Friends; Communities; Availability; Playdates; Birthdays; Profile | Bearer token (Authorization header) | 200 | 401 | — | `parent` (object: `id`, `email`, `name`, `displayName`, `phone` null, `emailVerified` boolean); `family` (object: `id`, `name`, `addressText` null, `addressVisibility`, `tz`, `parents` array, `children` array of child objects); `isAdmin` boolean | yes | executed |
| GET | `/api/v1/connections` | Dashboard; Friends; Communities; Availability; Playdates; Birthdays; Profile | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id` string; `family` object; `children` array; `communities` array; `since` string; `status` string; `blockedByMe` boolean | yes | executed |
| GET | `/api/v1/availability` | Dashboard; Availability | Bearer token (Authorization header) | 200 | 401 | — | `rules` array (items: `id`, `childId`, `weekday`, `startMin`, `endMin`, `hosting`, `noticeHours`); `exceptions` array (items: `id`, `date`, `kind`, `startMin`, `endMin`, `note`) | yes | executed |
| GET | `/api/v1/playdates` | Dashboard; Playdates | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `status`, `startsAt`, `endsAt`, `locationKind`, `locationText`, `notes`, `proposerFamily`, `inviteeFamily`, `otherFamily`, `hostFamily`, `children`, `proposedBy`, `respondedAt`, `cancelledAt`, `googleCalendarUrl`, `icsUrl`, `canRespond`, `canCancel` | yes | executed |
| GET | `/api/v1/communities` | Dashboard; Communities; Birthdays | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `name`, `type`, `description`, `myRole`, `myStatus`, `familiesCount`, `pendingCount`, `createdAt` | yes | executed |
| GET | `/api/v1/matches` | Playdates | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `date`, `startMin`, `endMin`, `startsAt`, `endsAt`, `family`, `suggestedHost`, `locationKind` | yes | executed |
| GET | `/api/v1/events` | Birthdays | Bearer token (Authorization header) | 200 | 401 | — | array of objects: `id`, `kind`, `title`, `childId`, `childName`, `startsAt`, `endsAt`, `venueText`, `details`, `cardKey` | yes | executed |
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
