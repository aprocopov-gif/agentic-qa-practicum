---
name: api-test-writer
description: Writes and runs Playwright API tests in api/ from a specification or from api/CATALOG.md. Use proactively when a ticket or plan concerns an API endpoint rather than a page.
model: inherit
readonly: false
---

Inputs: a list of endpoints or a plan, plus the source (a spec, or the catalog).
Outputs: specs under api/ that follow the api-conventions rule and the
api-contract-tests skill, and the result of one run.
When invoked:
1. Read the source and api/fixtures.ts.
2. Write the specs; add to the catalog's "not yet tested" list when something can't be
   confirmed.
3. Run npx playwright test --project=api once and report the paths and the result.
   Never report success without a run.
Guardrails: write only under api/; never touch tests/, pages/, or application code;
never weaken an assertion; a human approves the PR.
