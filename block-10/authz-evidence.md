# Block 10 — Authorization adversary evidence

Derived from [`qa-run/authz-report.json`](../qa-run/authz-report.json) (P60 ticket probes, **2026-10-30**). No secrets; Bearer values are placeholders only.

| Artifact | Location |
|----------|----------|
| Merged probe report | [`qa-run/authz-report.json`](../qa-run/authz-report.json) |
| Probe plan | [`qa-run/authz-plan.md`](../qa-run/authz-plan.md) |
| Permanent HELD tests | [`api/authorization.api.spec.ts`](../api/authorization.api.spec.ts) |

---

## 1. HELD — cross-family read isolation (availability)

**Evidence item:** `GET /api/v1/availability` — Family B after Family A creates a child (AQPBT-8 probe)

**Basis:** executed

**Test performed:** P60 serial authz probe for AQPBT-8: Family A (`main`) created a tracked child via `POST /api/v1/children`, then Family B (`alt`) called `GET /api/v1/availability`; probe then verified Family A still sees that child on `GET /api/v1/me`. Same assertions are now in `api/authorization.api.spec.ts`.

**Command or request:**

```bash
npx playwright test api/authz-probe.api.spec.ts --project=api --grep "AQPBT-8"
```

*(Probe spec removed after promotion; equivalent run:* `npx playwright test api/authorization.api.spec.ts --project=api --grep "availability"`*.)*

```http
POST /api/v1/children HTTP/1.1
Host: <APP_URL host>
Authorization: Bearer <main-family token — placeholder>
Content-Type: application/json

{ "firstName": "<unique>", "birthYear": <year>, ... }
```

```http
GET /api/v1/availability HTTP/1.1
Host: <APP_URL host>
Authorization: Bearer <alt-family token — placeholder>
```

```http
GET /api/v1/me HTTP/1.1
Host: <APP_URL host>
Authorization: Bearer <main-family token — placeholder>
```

**Expected status:** `200` on Family B `GET /api/v1/availability`; `200` on Family A `GET /api/v1/me` after the cross-family read.

**Actual status:** `200` (Family B availability); `200` (Family A `/me` owner check) — per report attempt and probe harness (`ownerChildStillPresent: true`).

**Expected body:** Family B availability JSON must **not** contain the created child’s id as an exact string anywhere in the response. Family A `/me` must still list that child under `family.children`.

**Actual body:** Report evidence: *“Family B GET /api/v1/availability status 200; child id absent when 200”* — outcome **HELD**. Owner check: created child id still present on Family A `/me` (probe did not complete if this failed).

**What this proves:** With two authenticated families, Family B can call the availability list endpoint successfully without receiving Family A’s newly created child id in the response body, and Family A’s data was not removed or hidden from the owner by that read.

**What this does not prove:** Isolation on other verbs (POST/PATCH/DELETE), on availability rows keyed by invite or playdate id, on every pagination window, or that Family B cannot infer the child through indirect fields (names, hashes, or correlated timestamps).

**Open question:** None for this specific HELD row at list-scope; catalog already expects authenticated list GETs and separate delete authz is covered elsewhere.

---
