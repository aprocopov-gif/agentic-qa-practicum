---
name: api-test-design
description: Designs API test cases as a table a human approves, from api/CATALOG.md only (no OpenAPI or external spec), before any test code exists. Use when the user asks what to test for an endpoint or an area of the API, asks for test cases, test ideas, a test plan, or coverage. Writes api/test-design/<area>.md and stops for approval. Do NOT use to write test code — that is api-contract-tests.
paths: "api/**"
---

# API test design

BuddyTime has no published API specification. The catalog is the only input.

## Steps

1. Read the endpoints for the area in **api/CATALOG.md** (table rows plus **Not yet tested** bullets that apply).
2. Write **api/test-design/<area>.md**, one table per endpoint:

   ID | type (positive / negative / error / characterization) | what we send | expected status |
   expected body (rule, key values) | source (CATALOG row or Not yet tested bullet) | technique

3. **Executed rows** (`evidence` = `executed`): these are **characterization** tests. Fill expected status and body from what the catalog recorded (status seen, response fields, write bodies in **Write bodies observed**). Positive rows mirror the observed success path; add unauthenticated rows when the catalog lists **status without token**.
4. **Not executed** (`evidence` = `inspected only`, or gaps listed under **Not yet tested**): add a row marked **assumed — ask** or **not yet tested** with the question to resolve; leave expected status and expected body empty.
5. Negative rows, with the technique named in its column:
   - **boundary values**: 0, the smallest valid value, exactly at a limit, one over it;
   - **equivalence classes**: one row per kind of bad input (missing field, empty string, wrong type, negative number);
   - **state**: the step done in the wrong order or done twice.
   Only assert expected status/body on negative rows when the catalog or an **executed** run supports it; otherwise mark **assumed — ask** with no expected result.
6. **Families** (technique column `families`), when the endpoint uses auth or owns resources:
   - **apiAnonymous**: the same request with no Bearer token (maps to `unauthenticatedApi` in tests). Expected status from the catalog **status without token** column when **executed**; otherwise **not yet tested**.
   - **apiAlt on apiMain data**: the same request as the main family, but using **apiAlt** against an id **apiMain** created (maps to `altApi` / `mainApi`). Expected result only if catalog evidence is **executed** or the human has approved an assumption; otherwise **assumed — ask**.
7. Do not invent status codes, error JSON shapes, or fields not in **executed** catalog rows. Do not read OpenAPI, Confluence, or chat as source.
8. Stop. Show the table and wait for the human to answer "approved" or ask for changes. Write no test code.
