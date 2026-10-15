# [Anna] Friends manage connection — AQPBT-14

Feature: Friends manage connection — report / block / remove stay unclicked; cancel closes the panel

  Signed-in Family A (Lev Test) opens `/friends` and reviews connection actions on trusted
  circle cards **The Nguyens** and **The Petrovs**. Tests open **manage** and click **cancel**
  only. They must not click **report**, **block**, or **remove**.

# Happy paths

  Scenario: Friends lists circle cards with Schedule Playdate and manage
    Given I am logged in as Family A with a completed dashboard
    When I open "/friends"
    Then I see the banner "Friends"
    And the family card "The Nguyens" shows "Schedule Playdate" and "manage"
    And the family card "The Petrovs" shows "Schedule Playdate" and "manage"

  Scenario: Manage on The Nguyens shows report, block, remove, and cancel
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    When I click "manage" on the family card "The Nguyens"
    Then I see the buttons "report", "block", "remove", and "cancel"

  Scenario: Cancel on The Nguyens closes manage and leaves the card intact
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    And the manage panel is open for "The Nguyens"
    When I click "cancel"
    Then I do not see the button "report"
    And the family card "The Nguyens" still shows "manage" and "Schedule Playdate"

  Scenario: After cancel, manage on The Petrovs shows the same actions
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    And I canceled manage on "The Nguyens"
    When I click "manage" on the family card "The Petrovs"
    Then I see the buttons "report", "block", "remove", and "cancel"

# Negative

  Scenario: Opening manage stays on Friends and does not hide the other card
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    When I click "manage" on the family card "The Nguyens"
    Then I stay on "/friends"
    And the family card "The Petrovs" still shows "manage" and "Schedule Playdate"
    And I have not clicked "report", "block", or "remove"

  Scenario: Cancel does not remove the friendship or hide The Nguyens
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    And the manage panel is open for "The Nguyens"
    When I click "cancel"
    Then I still see the family card "The Nguyens"
    And I do not see the buttons "report", "block", or "remove"
    And I stay on "/friends"

# Edge cases

  Scenario: After opening Petrovs, The Nguyens card still shows manage
    Given I am logged in as Family A with a completed dashboard
    And I am on "/friends"
    And I canceled manage on "The Nguyens"
    When I click "manage" on the family card "The Petrovs"
    Then I see the button "cancel"
    And the family card "The Nguyens" still shows "manage" and "Schedule Playdate"

  Scenario: Reloading Friends after cancel still lists both circle families
    Given I am logged in as Family A with a completed dashboard
    And I canceled manage on "The Nguyens"
    When I open "/friends" again
    Then I see the banner "Friends"
    And the family card "The Nguyens" shows "Schedule Playdate" and "manage"
    And the family card "The Petrovs" shows "Schedule Playdate" and "manage"

<!--
Ambiguities / gaps (Jira + no Confluence feature page):
- No AQPBT-14 page in space AQPBT; labels come from the ticket and
  features/explore-friends-manage-connection.feature.md live crawl.
- Whether "Schedule Playdate" stays visible on the same card while manage is open.
- Dialog copy, confirmations, and outcomes of report / block / remove (out of scope; do not click).
- Empty circle, a family with one card only, and Family B / second-family view.
- + Invite a family, Explore Communities, and Schedule Playdate navigation (ticket out of scope).
-->
