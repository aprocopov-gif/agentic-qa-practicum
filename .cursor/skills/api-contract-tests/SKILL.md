---
name: api-contract-tests
description: Writes Playwright API tests in api/ from a documented specification (OpenAPI or approved docs) or, when there is none, from observed rows in api/CATALOG.md. Use when the user asks for API tests, contract tests, endpoint tests, or to cover an endpoint, a request, or a response — even if they don't say "contract". Do NOT use to discover endpoints — that is api-discovery.
paths: "api/**"
---

# API contract tests

1. Find the source: a spec file or URL the user names (documented), otherwise rows in
   api/CATALOG.md (observed). Say which one you're using, and never mix them silently.
2. List the documented facts and the assumptions separately. Ask before asserting any
   assumption.
3. For each endpoint, follow the api-conventions rule: a success test and an
   intentional error test. Contract tests also check required fields and their types
   against the spec.
4. Reuse api/fixtures.ts. Writes only with a documented or observed undo, tracked with
   trackRecord.
5. Run npx playwright test --project=api, then write one evidence note per endpoint:
   basis (executed / inspected only / not yet tested), request, expected, actual, what
   it proves, what it doesn't prove.
