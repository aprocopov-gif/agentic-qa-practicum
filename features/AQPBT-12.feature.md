# [Anna] Playdates add to calendar — AQPBT-12

Feature: Playdates add to calendar — calendar export is not offered on empty or cancelled rows

  Jira: [AQPBT-12](https://legionqaschool.atlassian.net/browse/AQPBT-12)

  Feature map (BuddyTime P7): export controls on **Playdates add to calendar (Google / ICS)** at
  `/playdates` (Two families); same Past/Upcoming lists on **Find a playdate** at `/playdates/new`;
  **Dashboard: Upcoming playdates widget** at `/app`; **Family calendar** at `/calendar`;
  **Profile: Calendar Sync** at `/profile`.

  Signed-in Family A (Lev Test) with a set-up dashboard must not see Google or ICS on empty
  Upcoming or on cancelled Past rows. Profile Calendar Sync explains that calendar links ship with
  playdates. Family B without a set-up dashboard sees the playdate gate instead of lists (AC5).

  Provisioned Past rows use unique `AQPBT12-{runId}-primary|future park` location notes with circle
  family **The Nguyens** (see `support/playdates-calendar-provision.ts` and AQPBT-11 list pattern).

# Happy paths

  Scenario: Empty Upcoming on Playdates shows message without calendar export
    Given I am logged in as Family A with a completed dashboard
    When I open "/playdates" with Upcoming count 0
    Then I see "No upcoming playdates yet."
    And I do not see "Google" or "ICS"

  Scenario: Cancelled Past row on Playdates has no calendar or pending actions
    Given I am logged in as Family A with a completed dashboard
    And a cancelled Past playdate was provisioned for "The Nguyens" with a unique location note
    When I open "/playdates"
    Then I see that row with status "Cancelled"
    And I do not see "Google", "ICS", Accept, Decline, or cancel on that row

  Scenario: Find a playdate route shows the same empty Upcoming and cancelled Past lists
    Given I am logged in as Family A with a completed dashboard
    And a cancelled Past playdate was provisioned for "The Nguyens" with a unique location note
    When I open "/playdates/new"
    Then I see "No upcoming playdates yet."
    And I see the provisioned Cancelled Past row without "Google" or "ICS"

  Scenario: Profile Calendar Sync shows playdate calendar message on profile
    Given I am logged in as Family A with a completed dashboard
    And I am on "/profile"
    When I click "Calendar Sync" ("Add-to-calendar links soon")
    Then I stay on "/profile"
    And I see "Calendar links ship with playdates 🗓️"

# Negative

  Scenario: Family B gate on Playdates hides lists and calendar export
    Given I am logged in as Family B (Anna Procopov) without a set-up dashboard
    When I open "/playdates"
    Then I see "Set up your family on the Dashboard before planning playdates."
    And I do not see "Upcoming", "Past", "Google", or "ICS"

  Scenario: Family B gate on Find a playdate hides lists and calendar export
    Given I am logged in as Family B (Anna Procopov) without a set-up dashboard
    When I open "/playdates/new"
    Then I see "Set up your family on the Dashboard before planning playdates."
    And I do not see "Upcoming", "Past", "Google", or "ICS"

  Scenario: Clicking a Cancelled Past row does not reveal calendar export
    Given I am logged in as Family A with a completed dashboard
    And a cancelled Past playdate was provisioned for "The Nguyens" with a unique location note
    When I open "/playdates" and click that Cancelled Past row
    Then I stay on "/playdates"
    And no calendar-export controls appear

# Edge cases

  Scenario: Future-dated Cancelled Past row still has no calendar export
    Given I am logged in as Family A with a completed dashboard
    And a future-dated cancelled Past playdate was provisioned for "The Nguyens" with a unique location note
    When I open "/playdates"
    Then I see that row with status "Cancelled"
    And I do not see "Google" or "ICS" on that row

  Scenario: Past section lists provisioned cancelled rows without export actions
    Given I am logged in as Family A with a completed dashboard
    And primary and future-dated cancelled Past playdates were provisioned for "The Nguyens"
    When I open "/playdates"
    Then I see "Past" beside both provisioned Cancelled rows
    And I do not see "Google" or "ICS"

  Scenario: Dashboard Upcoming Playdates widget has no Google or ICS
    Given I am logged in as Family A with a completed dashboard
    When I open "/app"
    Then I see the Upcoming Playdates widget without "Google" or "ICS"

  Scenario: In-app Calendar page has no Google or ICS export controls
    Given I am logged in as Family A with a completed dashboard
    When I open "/calendar"
    Then I see "Your family calendar"
    And I do not see "Google" or "ICS"

  Scenario: Clicking Cancelled Past row on Find a playdate stays on route without export
    Given I am logged in as Family A with a completed dashboard
    And a cancelled Past playdate was provisioned for "The Nguyens" with a unique location note
    When I open "/playdates/new" and click that Cancelled Past row
    Then I stay on "/playdates/new"
    And I do not see "Google" or "ICS"

<!--
Ambiguities / gaps (Jira + feature map):
- Confirmed Upcoming row UI and exact Google / ICS labels, href, and ICS download behavior on non-cancelled rows (feature map: export on confirmed row — not automated here).
- Error copy when ICS download fails; API /api/v1/events/{id}/ics vs playdate list ICS.
- Export on completed (non-Cancelled) Past rows or on the dashboard Upcoming widget when non-empty.
- Two families viewing the same confirmed row at once.
- Birthday "Add to my calendar" is a separate feature map row (`/birthdays/{id}`).
- Family B Profile Calendar Sync toast vs playdate gate (Confluence: toast observed for both when reachable).
- Past UI caps visible rows at six (see AQPBT-11); automation uses start dates ~90 days ahead so provisioned tokens stay in that slice.
-->
