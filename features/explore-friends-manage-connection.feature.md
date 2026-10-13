# Explore: Friends — manage connection (ticket-less)

Live crawl: `https://test.buddytime.ca/friends` (Family A, signed-in). Read-only except opening **manage** and **cancel** (no report/block/remove/invite).

## Coverage snapshot

- **Login / routing (Partial):** `tests/aqpbt-1-login.spec.ts` — log-in with `next=/friends` lands on Friends and shows banner **Friends**.
- **Dashboard (Partial):** `tests/dashboard-add-child.spec.ts` — add/remove child only; **See all →** on dashboard is not asserted on Friends.
- **Playdates (Partial):** AQPBT-9/10/11/12 cover `/playdates` and `/playdates/new`, not entry from a Friends card **Schedule Playdate**.
- **Friends page flows (Gap):** No spec uses `FriendsPage` or `FriendManageComponent` — no coverage for **+ Invite a family**, **Explore Communities**, per-card **Schedule Playdate**, or **manage** (report / block / remove / cancel).

## Selected gap

**Manage connection on a trusted circle family** — the POM already models report, block, remove, and cancel, but nothing asserts the panel opens or closes safely; this is high-risk UX with zero automated checks.

## Gherkin test plan

```gherkin
Feature: Friends — manage connection on a circle family

  Scenario: Opening manage shows connection actions and cancel closes the panel (positive)
    Given I am signed in as Family A on "/friends"
    And I see the banner "Friends"
    When I click "manage" on the family card "The Nguyens"
    Then I see the button "report"
    And I see the button "block"
    And I see the button "remove"
    And I see the button "cancel"
    When I click "cancel"
    Then I do not see the button "report"
    And I see the button "manage" on the family card "The Nguyens"
    And I see the button "Schedule Playdate" on the family card "The Nguyens"

  Scenario: Manage panel is scoped to the card that was opened (edge case)
    Given I am signed in as Family A on "/friends"
    When I click "manage" on the family card "The Nguyens"
    Then I see the button "report"
    When I click "cancel"
    And I click "manage" on the family card "The Petrovs"
    Then I see the button "report"
    And I see the button "block"
    And I see the button "remove"
    And I see the button "cancel"
```

## Locator hints

From live snapshot on `/friends` (accessibility tree):

| Control | Role / name |
| --- | --- |
| Page title | banner text **Friends** (via `HeaderComponent` / `FriendsPage.title`) |
| Invite | button **+ Invite a family** |
| Per-card schedule | button **Schedule Playdate** (one per card) |
| Open manage | button **manage** (exact, lowercase) |
| Manage actions | button **report**, **block**, **remove**, **cancel** (exact, lowercase) |
| Discover link | link **Explore Communities** |

Family scoping: `page.getByText('The Nguyens', { exact: true }).locator('..')` then `getByRole('button', { name: 'manage', exact: true })` — matches `FriendsPage` today.

## For test-writer

- Suggested file: `tests/friends-manage-connection.spec.ts`
- POM updates needed: None required; use `FriendsPage.openManage('The Nguyens')`, `friends.manage.cancel()`, and existing `FriendManageComponent` locators. Optionally add a readable helper on `FriendsPage` for asserting manage actions visible/hidden.

## Suggested Jira story

**Title:** Friends: manage connection panel (report / block / remove / cancel)

**Story:** As Family A, I want to open manage on a trusted circle family so I can review connection actions without accidentally changing the friendship when I cancel.

**Acceptance criteria:**

- On `/friends`, each circle family card shows **Schedule Playdate** and **manage**.
- Clicking **manage** reveals **report**, **block**, **remove**, and **cancel** for that card only.
- Clicking **cancel** closes the panel and leaves **manage** and **Schedule Playdate** visible on the same card.
- Opening **manage** on a second family shows actions for that family after canceling the first.
