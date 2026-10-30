import { createApiContextForOwner, getAvailability } from '../../support/api-client';
import { installSpecFamilyProvisioning } from '../../support/spec-family-hooks';
import { AvailabilityPage } from '../../pages/availability.page';
import {
  WeekendAfternoonWindow,
  WeekendAfternoonWindowMin,
  WeeklyDayAbbrev,
} from '../../test-data/availability.enums';
import { AppRoute } from '../../test-data/routes';
import { expect, test } from '../../fixtures/cleanup.fixture';

const availabilityUrl = new RegExp(`${AppRoute.Availability.replace('/', '\\/')}(\\/|\\?|$)`);

function weekendAfternoonRules(rules: Array<{ weekday: number; startMin: number; endMin: number }>) {
  return rules.filter(
    (rule) =>
      rule.startMin === WeekendAfternoonWindowMin.start && rule.endMin === WeekendAfternoonWindowMin.end,
  );
}

test.describe('AQPBT-8 both layers (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-8');

  test(
    'UI weekend preset persists in GET /api/v1/availability @destructive',
    { tag: '@destructive', lock: 'family-a-weekly-availability' },
    async ({ page }) => {
      await test.step('API: baseline', async () => {
        const mainApi = await createApiContextForOwner('main');
        const before = await getAvailability(mainApi);
        expect(Array.isArray(before.rules)).toBe(true);
        expect(Array.isArray(before.exceptions)).toBe(true);
      });

      const availability = new AvailabilityPage(page);
      const weekly = availability.weeklyForm;

      await test.step('UI: act', async () => {
        await availability.goto();
        await weekly.applyWeekendAfternoons();
        await weekly.submit();
        await expect(page).toHaveURL(availabilityUrl);
      });

      await test.step('UI: check', async () => {
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
      });

      await test.step('API: prove', async () => {
        const mainApi = await createApiContextForOwner('main');
        await expect
          .poll(async () => {
            const body = await getAvailability(mainApi);
            return weekendAfternoonRules(body.rules).length;
          })
          .toBeGreaterThanOrEqual(2);

        const after = await getAvailability(mainApi);
        const weekendRules = weekendAfternoonRules(after.rules);
        expect(weekendRules.length).toBeGreaterThanOrEqual(2);
      });
    },
  );
});
