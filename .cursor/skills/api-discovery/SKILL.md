---
name: api-discovery
description: Maps an undocumented API by watching the app's network traffic and updates api/CATALOG.md. Use when the user asks which endpoints a page calls, wants to discover or document an API that has no specification, asks to update the API catalog, or a page or feature needs API coverage. Read-only, except for one create-and-undo pair the user approves. Do NOT use to write tests — that is api-contract-tests.
paths: "api/**"
---

# API discovery

1. Sign in with the saved session (playwright/.auth/user.json), or with the .env
   credentials — never echo them.
2. Open only the pages the user names, with browser_network_requests watching. Skip
   static assets, images, fonts, analytics, and Next.js page data.
3. One catalog row per request: method | path (ids as {id}) | page | how it's
   authenticated | status seen | request body fields | response top-level fields and
   types | safe for tests? | evidence (executed / inspected only). Merge with existing
   rows; never duplicate one.
4. Writes: only a create-and-undo pair the user approved, only on data this run
   created, and record both requests.
5. Unauthenticated statuses: record only calls you actually made without a token.
6. List everything you could not tell under "not yet tested".
7. Never write a token, a real id, or personal data into the catalog. Stop after
   updating it.
