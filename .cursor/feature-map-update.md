BuddyTime test site (`APP_URL`). Routes match `AppRoute` in the practicum repo (`test-data/routes.ts`) and the P7 route → page object map.

**Families involved:** *One* = a single logged-in family can use alone; *Two* = designed for interaction between two or more families.

## User-facing features (observed in live app)

| Feature | Where (route) | Families involved | Claimed by | Story | Feature page |
| --- | --- | --- | --- | --- | --- |
| Marketing landing (hero, Get started, Log in) | `/` | One |  |  |  |
| Log in | `/login` | One | Vitaly | [AQPBT-1](https://legionqaschool.atlassian.net/browse/AQPBT-1) | [\[Vitaly\] Log in](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/305856514/Vitaly+Log+in) |
| Sign up | `/signup` | One | Rena | [AQPBT-4](https://legionqaschool.atlassian.net/browse/AQPBT-4) | [\[Rena\] Sign up](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/308543489/Rena+Sign+up) |
| Forgot password (request reset link) | `/forgot-password` | One | Julia | [AQPBT-7](https://legionqaschool.atlassian.net/browse/AQPBT-7) | [\[Julia\] Forgot password (request reset link)](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/314736662/Julia+Forgot+password+request+reset+link) |
| App shell: sidebar navigation | All signed-in routes (e.g. `/app`, `/calendar`, `/friends`) | One |  |  |  |
| App shell: banner title, Notifications, Log out | All signed-in routes | One |  |  |  |
| Notifications: banner control shows status-only feedback (no inbox UI observed) | All signed-in routes (banner Notifications) | One |  |  |  |
| App shell: Menu button toggles the sidebar | Signed-in routes, narrow viewport | One |  |  |  |
| Dashboard greeting and summary stats | `/app` | One | Yaroslav | [AQPBT-2](https://legionqaschool.atlassian.net/browse/AQPBT-2) | [\[Yaroslav\] Dashboard greeting and summary stats](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/307003393/Yaroslav+Dashboard+greeting+and+summary+stats) |
| Dashboard: manage kids (Change avatar, remove, add-child form) | `/app` | One | Irina | [AQPBT-5](https://legionqaschool.atlassian.net/browse/AQPBT-5) | [\[Irina\] Dashboard: manage kids (Change avatar, remove, add-child form)](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/309166081/Irina+Dashboard+manage+kids+Change+avatar+remove+add-child+form) |
| Dashboard: Upcoming playdates widget | `/app` | One | Anna | [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) | [features/AQPBT-12.feature.md](../features/AQPBT-12.feature.md) |
| Dashboard: Find a Playdate CTA | `/app` → `/playdates/new` | Two |  |  |  |
| Dashboard: Grow your circle — invite family (share link) | `/app` | Two |  |  |  |
| Dashboard: Invite co-parent (share link) | `/app` | Two |  |  |  |
| Dashboard: Availability setup prompt | `/app` → `/availability` | One |  |  |  |
| Dashboard: Your circle preview | `/app` → `/friends` | Two |  |  |  |
| Dashboard: Playdate push reminders / Install app prompts | `/app` | One |  |  |  |
| Family calendar (month grid) | `/calendar` | One | Anna | [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) | [features/AQPBT-12.feature.md](../features/AQPBT-12.feature.md) |
| Calendar: This week summary | `/calendar` | One |  |  |  |
| Calendar: Birthdays this month sidebar | `/calendar` | One |  |  |  |
| Friends: trusted circle family cards | `/friends` | Two |  |  |  |
| Friends: Invite a family | `/friends` | Two |  |  |  |
| Friends: Schedule Playdate (per family) | `/friends` | Two |  |  |  |
| Friends: Manage connection (report, block, remove, cancel) | `/friends` | Two | Anna | [AQPBT-14](https://legionqaschool.atlassian.net/browse/AQPBT-14) |  |
| Friends: Discover families → Explore Communities | `/friends` → `/communities` | One |  |  |  |
| Communities: list your groups | `/communities` | One |  |  |  |
| Communities: create group | `/communities/new` | One | Elena Kombarov | [AQPBT-3](https://legionqaschool.atlassian.net/browse/AQPBT-3) | [\[Elena Kombarov\] Communities: create group](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/307593217/Elena+Kombarov+Communities+create+group) |
| Community hub: Members tab and family list | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | One |  |  |  |
| Community hub: Copy invite link | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | Two |  |  |  |
| Community hub: Invite families copies the group invite link | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | Two |  |  |  |
| Community hub: Connect with a member family | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | Two |  |  |  |
| Community hub: Events tab — create group event | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | One |  |  |  |
| Community hub: Announcements tab — post and list | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | One |  |  |  |
| Community hub: delete an announcement | `/communities/15f52f3a-ba2f-46b7-b859-047ed8f6b50f` | One |  |  |  |
| Weekly availability (slots, presets, Save) | `/availability` | One | Vitaly | [AQPBT-8](https://legionqaschool.atlassian.net/browse/AQPBT-8) |  |
| One-off availability exceptions | `/availability` | One | Vitaly | [AQPBT-8](https://legionqaschool.atlassian.net/browse/AQPBT-8) |  |
| Playdates: matched slots and manual propose form | `/playdates` | Two |  | [AQPBT-9](https://legionqaschool.atlassian.net/browse/AQPBT-9) |  |
| Playdates: pending requests (Accept / Decline / cancel) | `/playdates` | Two |  | [AQPBT-10](https://legionqaschool.atlassian.net/browse/AQPBT-10) |  |
| Playdates: upcoming and past lists | `/playdates` | Two |  | [AQPBT-11](https://legionqaschool.atlassian.net/browse/AQPBT-11) |  |
| Playdates: add to calendar (Google / ICS) on confirmed row | `/playdates` | Two | Anna | [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) | [features/AQPBT-12.feature.md](../features/AQPBT-12.feature.md) |
| Find a playdate gate (empty state when circle incomplete) | `/playdates/new` | Two | Anna | [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) | [features/AQPBT-12.feature.md](../features/AQPBT-12.feature.md) |
| Birthdays: create party (invite children, card theme) | `/birthdays` | Two | Taya | [AQPBT-6](https://legionqaschool.atlassian.net/browse/AQPBT-6) | [\[Taya\] Birthdays: create party (invite children, card theme)](https://legionqaschool.atlassian.net/wiki/spaces/AQPBT/pages/311656450/Taya+Birthdays+create+party+invite+children+card+theme) |
| Profile: your details (display name, phone) | `/profile` | One |  |  |  |
| Profile: family details (name, host note, address visibility) | `/profile` | One |  |  |  |
| Profile: kids list and Change avatar | `/profile` | One |  |  |  |
| Profile: settings shortcuts (My Availability, Privacy & Safety, Notifications, Calendar Sync) | `/profile` | One | Anna | [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12) | [features/AQPBT-12.feature.md](../features/AQPBT-12.feature.md) |
| Profile: delete account (password confirmation) | `/profile` | One |  |  |  |
| Profile: Log out (in-page) | `/profile` | One |  |  |  |
| Sidebar: Go Premium upsell | Signed-in routes (sidebar) | One |  |  |  |
| Sidebar: Discover | Signed-in routes (sidebar) | One |  |  |  |
| Admin: platform metrics and latest sign-ups table | `/admin` | One |  |  |  |
| Privacy Policy (legal page, ← Back to BuddyTime) | `/privacy` | One |  |  |  |
| Terms of Service (legal page, contact link) | `/terms` | One |  |  |  |
| Birthday party host detail (guest link, invite by email, Add to my calendar, RSVPs) | `/birthdays/{id}` | Two |  |  |  |
| Public guest RSVP page (party details; cancelled state observed) | `/e/{token}` | One |  |  |  |
| Invite acceptance (co-parent / circle join — Accept invite) | `/join/{token}` | Two |  |  |  |
| Admin: New parents per week chart “Show as table” | `/admin` | One |  |  |  |

## To confirm

Not opened end-to-end, or only referenced in copy/UI. Confirm before promoting to the main table.

| Item | Why it is uncertain |
| --- | --- |
| Go Premium purchase or benefits screen | Click showed “Premium — coming soon!” toast only. |
| Discover families directory | Discover showed “Community discovery — coming soon!” toast only. |
| Enable push reminders / notification prefs body | Buttons seen; enable flow and Profile → Notifications content not fully opened. |
| PWA “Install app” | Button on dashboard; install flow not exercised. |
| Calendar Sync settings | Profile button seen; dedicated screen not opened. |
| SMS playdate reminders | Profile copy says text reminders “not switched on yet”; no enable UI seen. |
| Submit flows (Accept/Decline/Send request/Save/Create party/event/post) | Forms and actions seen; create/destructive paths not submitted during exploration. |
| Sign-up / log-in with `?next=` query | Only base `/signup` and `/login` recorded in `AppRoute`. |
| Co-parent / second-family (`APP_ALT_USER_*`) flows | Second family account not used in this exploration. |
