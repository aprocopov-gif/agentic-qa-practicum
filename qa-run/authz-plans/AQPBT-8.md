# AQPBT-8 authz probe plan

Ticket: weekly availability (`GET /api/v1/availability`). Family A = `mainApi`, Family B = `altApi`, anonymous = `unauthenticatedApi`.

Setup: `POST /api/v1/children` as Family A, `trackRecord`.

| attempt | who | call |
|---------|-----|------|
| 1 | familyB | `GET /api/v1/availability` — HELD if 200 and body omits created child id |
| 2 | anonymous | `GET /api/v1/availability` — HELD if 401 |

Owner follow-up: `GET /api/v1/me` as Family A still lists the child.
