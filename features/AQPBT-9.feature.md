# [Anna] Playdates: matched slots and manual propose form — AQPBT-9

Feature: Playdates: matched slots and manual propose form: propose a playdate to a circle family

  Signed-in parents with a set-up family (Lev Test / The Gorfels) open Playdates to pick a
  circle family and either a matched availability slot or a manual time and place. The other
  parent must approve before the playdate is confirmed. Send request is not submitted here.

# Happy paths

  Scenario: Playdates shows Find a playdate, Propose, and Send request
    Given I am logged in as Family A with a completed dashboard and at least one circle family
    When I open "/playdates"
    Then I see heading "Find a playdate"
    And I see "Pick a family, choose a matched slot or propose a manual time, then wait for the other parent to approve."
    And I see "Propose"
    And I see "Send request"

  Scenario: Family combobox lists only circle families
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates"
    When I open the family combobox
    Then I see "The Nguyens" and "The Petrovs"

  Scenario: Selected circle family shows matches badge and a dated slot
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates" with "The Nguyens" selected
    When matched availability loads
    Then I see "6 matches"
    And I see a dated matched-slot button

  Scenario: Selecting a matched slot disables the place combobox
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates"
    When I select the first live matched-slot button
    Then the place combobox is disabled

  Scenario: Place combobox lists Out / neutral place and My place when no slot is selected
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates" with no matched slot selected
    When I open the place combobox
    Then I see "Out / neutral place" and "My place"

  Scenario: Child checkboxes use my children's names and can be changed
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates"
    When I view child options
    Then I see checkboxes "Mia" and "Maria"
    And I can uncheck "Mia" without leaving "/playdates"

  Scenario: Empty Pending requests shows count 0 and empty copy
    Given I am logged in as Family A with a completed dashboard
    And there are no pending playdates
    When I view "Pending requests" on "/playdates"
    Then I see count "0"
    And I see "No pending requests."

# Negative

  Scenario: Family B gate hides Propose and Send request
    Given I am logged in as Family B (Anna Procopov) without a set-up dashboard
    When I open "/playdates"
    Then I see "Set up your family on the Dashboard before planning playdates."
    And I do not see "Propose"
    And I do not see "Send request"

  Scenario: Empty Upcoming shows count 0 and empty copy
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates" with no upcoming playdates
    When I view "Upcoming"
    Then I see count "0"
    And I see "No upcoming playdates yet."

# Edge cases

  Scenario: Changing family refreshes matched slots
    Given I am logged in as Family A with a completed dashboard
    And I am on "/playdates"
    When I choose "The Petrovs"
    Then I see a matched-slot button whose name includes "The Petrovs"

  Scenario: Find a playdate route shows the same propose UI
    Given I am logged in as Family A with a completed dashboard
    When I open "/playdates/new"
    Then I see heading "Find a playdate"
    And I see "Propose"
    And I see "Send request"

  Scenario: Optional location and note fields are visible on the propose form
    Given I am logged in as Family A with a completed dashboard
    When I open "/playdates"
    Then I see "Location note, park name, or address"
    And I see "Optional note"

  Scenario: Child checkboxes start checked
    Given I am logged in as Family A with a completed dashboard
    When I open "/playdates"
    Then the "Mia" and "Maria" checkboxes are checked

<!--
Ambiguities / gaps (Jira out of scope + Confluence open questions):
- What the three unlabeled manual textboxes represent (date / start / end) and whether they sync when a matched slot is selected.
- Badge "6 matches" vs three visible slot buttons — scroll or show more.
- Whether a matched slot can be deselected without reloading.
- Validation and error copy when Send request is pressed with invalid or incomplete input.
- Success feedback after Send request (out of scope for this story).
- Recipient Accept / Decline / cancel when Pending requests count is greater than zero (AQPBT-10).
- Whether Location note is required for either place option.
- Exact dashboard setup required before Playdates unlocks.
-->
