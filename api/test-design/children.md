# Children API — test design

Source: `api/CATALOG.md` only (captured 2026-10-21). No OpenAPI or other spec.

Catalog endpoints in this area:

- `POST /api/v1/children` — evidence **executed**; status seen **201**; status without token **not recorded**
- `DELETE /api/v1/children/{id}` — evidence **executed**; status seen **204**; empty body; status without token **not recorded**

There is no `GET` / `PUT` / `PATCH` `/api/v1/children` row. Listing is only observed as `family.children` on `GET /api/v1/me`.

Already in `api/children.api.spec.ts`: CH-POST-01 and CH-DEL-01 in a single combined test (no paired error case; no `trackRecord`).

Ask before asserting any row marked **assumed — ask** or **not yet tested**.

---

## POST `/api/v1/children`

Observed write body (catalog **Write bodies observed**): `firstName` unique string, `birthYear` 2018, `birthMonth` 6, `avatarKey` `"fox"`, `interests` `[]`. Catalog notes optional `gender` was **not** sent by the default UI flow.

| ID | type | what we send | expected status | expected body (rule, key values) | source | technique |
|----|------|----------------|-----------------|----------------------------------|--------|-----------|
| CH-POST-01 | characterization | Bearer (main) + observed body above | 201 | JSON object with keys `id`, `firstName`, `birthYear`, `birthMonth`, `age`, `gender`, `interests`, `avatarKey` | CATALOG POST row (executed) + Write bodies observed | positive (observed success) |
| CH-POST-02 | characterization | After CH-POST-01, Bearer (main) `GET /api/v1/me` | 200 | `family.children` is an array (catalog). That the new `id` / `firstName` appear in that array is **assumed — ask** (not recorded as a POST side effect) | CATALOG GET `/api/v1/me` (executed, `family.children` array); POST Dashboard add/remove | positive (list via `/me`) |
| CH-POST-03 | error | Same body as CH-POST-01, no Bearer | | | CATALOG POST **status without token** is empty; Not yet tested: unauthenticated error body beyond GET `/me` | families: apiAnonymous |
| CH-POST-04 | error | Same body, expired or invalid Bearer | | | Not yet tested: expired or invalid Bearer (401 vs 403) | families: invalid token |
| CH-POST-05 | negative | Observed body with `firstName` omitted | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: missing field |
| CH-POST-06 | negative | Observed body with `firstName` `""` | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: empty string |
| CH-POST-07 | negative | Observed body with `birthYear` as a string | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: wrong type |
| CH-POST-08 | negative | Observed body with `birthYear` negative | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: negative number |
| CH-POST-09 | negative | Observed body with `birthYear` `0` | | | Not yet tested: error JSON shape and 4xx/5xx codes | boundary values: 0 |
| CH-POST-10 | negative | Observed body with `birthMonth` `0` | | | Not yet tested: error JSON shape and 4xx/5xx codes | boundary values: 0 |
| CH-POST-11 | negative | Observed body with `birthMonth` `13` | | | Not yet tested: error JSON shape and 4xx/5xx codes. Catalog only recorded `6` — treating 13 as over a calendar limit is **assumed — ask** | boundary values: one over (assumed limit) |
| CH-POST-12 | negative | Empty JSON object `{}` | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: missing field |
| CH-POST-13 | characterization | Observed body plus `gender` | | | CATALOG: optional `gender` not sent by default UI flow | not yet tested |
| CH-POST-14 | characterization | Observed body with non-empty `interests` | | | Catalog observed `interests: []` only | not yet tested |
| CH-POST-15 | negative | POST the same unique `firstName` twice | | | Not yet tested | state: done twice |
| CH-POST-16 | error | Rate-limit / throttling on repeated POST | | | Not yet tested: rate limits or throttling headers | not yet tested |

`apiAlt on apiMain data` does not apply to create (no resource id). Alt creating its own child is a second copy of CH-POST-01, not a new case.

---

## DELETE `/api/v1/children/{id}`

Undo documented in catalog: no request body; **204** with empty response. Safe as teardown for a child this run created.

| ID | type | what we send | expected status | expected body (rule, key values) | source | technique |
|----|------|----------------|-----------------|----------------------------------|--------|-----------|
| CH-DEL-01 | characterization | Bearer (main) DELETE `{id}` of a child this run created via POST | 204 | empty body | CATALOG DELETE row (executed) + Write bodies observed | positive (observed undo) |
| CH-DEL-02 | error | Same `{id}` as a created child, no Bearer | | | CATALOG DELETE **status without token** is empty; Not yet tested: unauthenticated error body beyond GET `/me` | families: apiAnonymous |
| CH-DEL-03 | error | Bearer (alt) DELETE `{id}` created by main | | | Not in catalog (no cross-family delete executed) | families: apiAlt on apiMain data |
| CH-DEL-04 | negative | Bearer (main) DELETE the same `{id}` a second time | | | Not yet tested | state: done twice |
| CH-DEL-05 | negative | Bearer (main) DELETE a well-formed `{id}` this family never created | | | Not yet tested: error JSON shape and 4xx/5xx codes | equivalence classes: unknown resource |
| CH-DEL-06 | error | Expired or invalid Bearer, otherwise same as CH-DEL-01 | | | Not yet tested: expired or invalid Bearer (401 vs 403) | families: invalid token |

Whether GET `/api/v1/me` `family.children` no longer contains the deleted id is **not yet tested** (catalog DELETE row only records 204 empty body).

---

## Questions to resolve before those rows become tests

1. Unauthenticated POST and DELETE: status and body? (catalog has no **status without token** for either)
2. Invalid/expired token: 401 or 403, and what JSON?
3. Missing / empty / wrong-type / out-of-range fields: which status and which error keys?
4. Duplicate `firstName` on POST: allowed or rejected?
5. Sending `gender` and non-empty `interests`: still 201 with the same keys?
6. Alt family deleting main’s child: status?
7. Second DELETE of the same id, and DELETE of an unknown id: status?
8. After DELETE, must the child disappear from GET `/me` `family.children`?
9. After POST, must the new child appear on GET `/me` `family.children`? (current spec asserts this; catalog does not record it)
