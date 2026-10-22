# [Anna] Availability: save weekly free time (Weekend afternoons preset) — AQPBT-8

Feature: Availability: apply Weekend afternoons preset and persist weekly slots

  Signed-in Family A (Lev Test / The Gorfels) opens `/availability` to set recurring free time
  with the Weekend afternoons preset and to validate one-off exception form guardrails. Confluence
  BTQA 3.5 defines preset rows as Saturday and Sunday 13:00–17:00 and that Save replaces the
  whole weekly schedule.

# Happy paths

  Scenario: Weekend afternoons preset saves Saturday and Sunday afternoon slots
    Given I am signed in as Family A and on "/availability"
    And I see banner "Availability" and heading "Set your weekly free time"
    When I click "Weekend afternoons"
    And I click "Save availability"
    Then I remain on "/availability"
    And I see a weekly row for Saturday with start time "13:00" and end time "17:00"
    And I see a weekly row for Sunday with start time "13:00" and end time "17:00"
    When I reload the page
    Then I still see Saturday and Sunday afternoon windows "13:00" to "17:00" in the weekly section

  Scenario: Availability page shows weekly preset and save controls
    Given I am signed in as Family A and on "/availability"
    Then I see button "Weekend afternoons"
    And I see button "Save availability"
    And I see heading "Set your weekly free time"

# Negative

  Scenario: Add exception with empty date does not create a row
    Given I am signed in as Family A and on "/availability"
    And I am in the "One-off changes" section
    And the exception date field is empty
    And "Away / closed" is selected for the exception type
    When I click "Add exception"
    Then no new exception row appears in the list below the form

  Scenario: Invalid weekly times are not silently saved
    Given I am signed in as Family A and on "/availability"
    When I set start time after end time on a weekly row and click "Save availability"
    Then I see validation "Start time must be before end time"
    And I remain on "/availability"

# Edge cases

  Scenario: Weekend afternoons replaces unsaved custom rows in the editor
    Given I am signed in as Family A and on "/availability"
    And I have added a custom weekly row for Monday without saving
    When I click "Weekend afternoons"
    Then I do not see Monday in the weekly editor
    And I see Saturday and Sunday rows with afternoon times before saving

<!--
Ambiguities / gaps:
- Jira AC1 expects staying on `/availability` after Save; BTQA 3.5 says Save shows a success
  message and returns to the dashboard — automation follows Jira AC1; flag if live app matches BTQA.
- AC1 says "Saturday and/or Sunday" after reload; BTQA preset always sets both — assert both when preset used.
- No API delete for weekly availability in repo cleanup skill; saving mutates Family A shared weekly
  state until API tracking exists (per ticket out of scope).
- Dedicated AQPBT-space Confluence feature page is empty in feature map; business rules from BTQA 3.5.
-->
