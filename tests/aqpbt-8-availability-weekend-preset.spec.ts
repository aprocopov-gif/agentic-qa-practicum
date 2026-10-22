import { test, expect } from '../fixtures/cleanup.fixture';
import { AvailabilityPage } from '../pages/availability.page';
import {
  AvailabilityCopy,
  WeekendAfternoonWindow,
  WeeklyDayAbbrev,
} from '../test-data/availability.enums';
import { AppRoute } from '../test-data/routes';

const availabilityUrl = new RegExp(`${AppRoute.Availability.replace('/', '\\/')}(\\/|\\?|$)`);

test.describe('AQPBT-8 availability weekend preset (Family A)', () => {
  test('Availability page shows weekly preset and save controls @smoke', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const weekly = availability.weeklyForm;

    await availability.goto();

    await expect(availability.title).toHaveText(AvailabilityCopy.banner);
    await expect(weekly.heading).toHaveText(AvailabilityCopy.weeklyHeading);
    await expect(weekly.weekendAfternoonsButton).toHaveText(AvailabilityCopy.weekendAfternoons);
    await expect(weekly.submitButton).toHaveText(AvailabilityCopy.saveAvailability);
    await expect(availability.exceptionForm.oneOffChangesHeading).toHaveText(
      AvailabilityCopy.oneOffChanges,
    );
  });

  test(
    'Weekend afternoons preset saves Saturday and Sunday afternoon slots @destructive',
    { lock: 'family-a-weekly-availability' },
    async ({ page }) => {
      const availability = new AvailabilityPage(page);
      const weekly = availability.weeklyForm;

      await availability.goto();

      await weekly.applyWeekendAfternoons();
      await weekly.submit();

      await expect(page).toHaveURL(availabilityUrl);
      await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
        WeekendAfternoonWindow.start,
      );
      await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
        WeekendAfternoonWindow.end,
      );
      await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(
        WeekendAfternoonWindow.start,
      );
      await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(WeekendAfternoonWindow.end);

      await page.reload();
      await expect(weekly.heading).toBeVisible();
      await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
        WeekendAfternoonWindow.start,
      );
      await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
        WeekendAfternoonWindow.end,
      );
      await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(
        WeekendAfternoonWindow.start,
      );
      await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(WeekendAfternoonWindow.end);
    },
  );

  test('Add exception with empty date does not create a row @sanity', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const exceptions = availability.exceptionForm;

    await availability.goto();

    await expect(exceptions.oneOffChangesHeading).toBeVisible();
    await expect(exceptions.date).toHaveValue('');
    await expect(exceptions.type.locator('option:checked')).toHaveText('Away / closed');

    const beforeCount = await exceptions.listEntries.count();
    await exceptions.submit();

    await expect(exceptions.listEntries).toHaveCount(beforeCount);
  });

  test('Invalid weekly times show validation and stay on availability @regression', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const weekly = availability.weeklyForm;

    await availability.goto();

    await weekly.setDayWindow(WeeklyDayAbbrev.Sunday, '18:00', '09:00');
    await weekly.submit();

    await expect(weekly.validationMessage).toBeVisible();
    await expect(page).toHaveURL(availabilityUrl);
  });

  test('Weekend afternoons replaces unsaved custom Monday row @regression', async ({ page }) => {
    const availability = new AvailabilityPage(page);
    const weekly = availability.weeklyForm;

    await availability.goto();

    await weekly.addSlotInDay(WeeklyDayAbbrev.Monday);
    await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Monday)).toBeVisible();

    await weekly.applyWeekendAfternoons();

    await expect(weekly.daySection(WeeklyDayAbbrev.Monday).getByText(AvailabilityCopy.noSlots)).toBeVisible();
    await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
      WeekendAfternoonWindow.start,
    );
    await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Saturday)).toHaveValue(
      WeekendAfternoonWindow.end,
    );
    await expect(weekly.startTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(
      WeekendAfternoonWindow.start,
    );
    await expect(weekly.endTimeForDay(WeeklyDayAbbrev.Sunday)).toHaveValue(WeekendAfternoonWindow.end);
  });
});
