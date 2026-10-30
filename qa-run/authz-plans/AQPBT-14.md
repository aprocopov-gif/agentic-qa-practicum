# AQPBT-14 authz probe plan

Ticket: friends circle (`GET /api/v1/connections`).

Probes: Family B and anonymous `GET /api/v1/connections` after Family A creates a child. If Family B body includes the child id, classify **undocumented** (circle may share connected family children; not a automatic BREACHED).
