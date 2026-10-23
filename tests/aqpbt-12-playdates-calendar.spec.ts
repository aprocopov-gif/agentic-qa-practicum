import { type Locator } from '@playwright/test';

import { test, expect } from '../fixtures/cleanup.fixture';
import { CalendarPage } from '../pages/calendar.page';
import { DashboardPage } from '../pages/dashboard.page';
import { PlaydatesPage } from '../pages/playdates.page';
import { ProfilePage } from '../pages/profile.page';
import { ALT_AUTH_FILE, AUTH_FILE } from '../support/auth.constants';
import { getApiContext } from '../support/api-client';
import { installSpecFamilyProvisioning } from '../support/spec-family-hooks';
import {
  getPlaydatesCalendarProvision,
  getPlaydatesCalendarProvisionReadiness,
  provisionPlaydatesCalendarData,
  teardownPlaydatesCalendarProvision,
  waitForPlaydatesCalendarProvisionReadiness,
} from '../support/playdates-calendar-provision';
import { playdatesCalendarObserved } from '../test-data/factories/playdates-calendar.factory';
import { invalidPlaydatesCalendar } from '../test-data/invalid-playdates-calendar';
import { FAMILY_A_PLAYDATES_PROVISION_LOCK } from '../support/playdates-provision.constants';
import { AppRoute } from '../test-data/routes';

/**
 * Traceability: features/AQPBT-12.feature.md ↔ Jira AQPBT-12 ↔ `.cursor/feature-map-update.md`
 * (playdates calendar export, `/playdates/new` gate, `/app` widget, `/calendar`, `/profile` Calendar Sync).
 */

const playdatesUrl = new RegExp(`${AppRoute.Playdates.replace('/', '\\/')}(\\/|\\?|$)`);
const newPlaydateUrl = new RegExp(`${AppRoute.NewPlaydate.replace('/', '\\/')}(\\/|\\?|$)`);
const profileUrl = new RegExp(`${AppRoute.Profile.replace('/', '\\/')}(\\/|\\?|$)`);

/** Maps to features/AQPBT-12.feature.md and P7 feature map (AQPBT-12). */
async function expectProvisionedCancelledPastRow(
  row: Locator,
  locationNote: string,
  childName: string,
): Promise<void> {
  await expect(row).toBeVisible();
  await expect(row).toContainText(playdatesCalendarObserved.cancelledPastFamilyNguyen);
  await expect(row).toContainText(locationNote);
  await expect(row).toContainText(childName);
  await expect(row).toContainText(playdatesCalendarObserved.cancelledStatus);
}

async function expectNoCalendarExportOnPage(playdates: PlaydatesPage): Promise<void> {
  await expect(playdates.googleLink).toHaveCount(0);
  await expect(playdates.icsButton).toHaveCount(0);
}

async function expectNoRowActions(playdates: PlaydatesPage, row: Locator): Promise<void> {
  await expect(playdates.googleLinkIn(row)).toHaveCount(0);
  await expect(playdates.icsButtonIn(row)).toHaveCount(0);
  await expect(playdates.acceptButtonIn(row)).toHaveCount(0);
  await expect(playdates.declineButtonIn(row)).toHaveCount(0);
  await expect(playdates.cancelButtonIn(row)).toHaveCount(0);
}

test.describe('AQPBT-12 playdates calendar export (Family A)', () => {
  test('empty Upcoming on Playdates shows message without calendar export @smoke', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.title).toBeVisible();
    await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesCalendarObserved.upcomingEmptyCopy);
    await expectNoCalendarExportOnPage(playdates);
  });

  test('Profile Calendar Sync shows playdate calendar message on profile @e2e', async ({ page }) => {
    const profile = new ProfilePage(page);

    await profile.goto();
    await profile.openCalendarSync();

    await expect(page).toHaveURL(profileUrl);
    await expect(profile.calendarSyncToast).toHaveText(playdatesCalendarObserved.calendarSyncToast);
  });

  test('Dashboard Upcoming Playdates widget has no Google or ICS @regression', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const playdates = new PlaydatesPage(page);

    await dashboard.goto();

    await expect(dashboard.upcomingPlaydatesWidgetTitle).toBeVisible();
    await expect(dashboard.upcomingPlaydatesEmptyCopy).toBeVisible();
    await expect(playdates.googleLink).toHaveCount(0);
    await expect(playdates.icsButton).toHaveCount(0);
  });

  test('in-app Calendar page has no Google or ICS export controls @regression', async ({ page }) => {
    const calendar = new CalendarPage(page);
    const playdates = new PlaydatesPage(page);

    await calendar.goto();

    await expect(calendar.familyCalendar).toBeVisible();
    await expect(playdates.googleLink).toHaveCount(0);
    await expect(playdates.icsButton).toHaveCount(0);
  });

  test.describe('cancelled Past rows (provisioned)', () => {
    installSpecFamilyProvisioning('aqpbt-12');
    test.describe.configure({ mode: 'serial', lock: FAMILY_A_PLAYDATES_PROVISION_LOCK });

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_FILE });
      const page = await context.newPage();
      try {
        await provisionPlaydatesCalendarData(page, 'aqpbt-12');
      } catch (error) {
        console.warn('AQPBT-12 provision failed; dependent tests will be skipped:', error);
      } finally {
        await page.close();
        await context.close();
      }
    });

    test.beforeEach(async ({}, testInfo) => {
      const api = await getApiContext('main');
      const readiness = await waitForPlaydatesCalendarProvisionReadiness(api);
      if (!readiness.ready) {
        testInfo.annotations.push({ type: 'note', description: readiness.reportComment });
        test.skip(true, readiness.reportComment);
      }
    });

    test.afterAll(async () => {
      try {
        const readiness = await getPlaydatesCalendarProvisionReadiness(await getApiContext('main'));
        if (readiness.ready) {
          await teardownPlaydatesCalendarProvision(readiness.state);
        }
      } catch {
        // provision never completed
      }
    });

    test('Cancelled Past row on Playdates has no calendar or pending actions @sanity', async ({ page }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();
      const row = playdates.cancelledPastRowByLocationToken(provision.primaryCase.locationToken);

      await playdates.goto();

      await expect(playdates.pastLabel.first()).toBeVisible();
      await expectProvisionedCancelledPastRow(
        row,
        provision.primaryCase.locationNote,
        provision.primaryCase.childName,
      );
      await expectNoRowActions(playdates, row);
    });

    test('Find a playdate route shows empty Upcoming and cancelled Past without export @sanity', async ({
      page,
    }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();

      await playdates.gotoNew();

      await expect(page).toHaveURL(newPlaydateUrl);
      await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesCalendarObserved.upcomingEmptyCopy);
      const row = playdates.cancelledPastRowByLocationToken(provision.primaryCase.locationToken);
      await expectProvisionedCancelledPastRow(
        row,
        provision.primaryCase.locationNote,
        provision.primaryCase.childName,
      );
      await expectNoCalendarExportOnPage(playdates);
    });

    test('clicking Cancelled Past row on Playdates does not reveal calendar export @regression', async ({
      page,
    }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();

      await playdates.goto();
      await playdates.viewCancelledPastRowByLocationToken(provision.primaryCase.locationToken);

      await expect(page).toHaveURL(playdatesUrl);
      await expectNoCalendarExportOnPage(playdates);
    });

    test('future-dated Cancelled Past row has no calendar export @regression', async ({ page }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();
      const row = playdates.cancelledPastRowByLocationToken(provision.futureCancelledCase.locationToken);

      await playdates.goto();

      await expectProvisionedCancelledPastRow(
        row,
        provision.futureCancelledCase.locationNote,
        provision.futureCancelledCase.childName,
      );
      await expectNoRowActions(playdates, row);
    });

    test('Past section lists provisioned cancelled rows without export actions @regression', async ({
      page,
    }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();

      await playdates.goto();

      await expect(playdates.pastLabel.first()).toBeVisible();
      await expectProvisionedCancelledPastRow(
        playdates.cancelledPastRowByLocationToken(provision.primaryCase.locationToken),
        provision.primaryCase.locationNote,
        provision.primaryCase.childName,
      );
      await expectProvisionedCancelledPastRow(
        playdates.cancelledPastRowByLocationToken(provision.futureCancelledCase.locationToken),
        provision.futureCancelledCase.locationNote,
        provision.futureCancelledCase.childName,
      );
      await expectNoCalendarExportOnPage(playdates);
    });

    test('clicking Cancelled Past row on Find a playdate stays on route without export @api', async ({
      page,
    }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesCalendarProvision();

      await playdates.gotoNew();
      await playdates.viewCancelledPastRowByLocationToken(provision.primaryCase.locationToken);

      await expect(page).toHaveURL(newPlaydateUrl);
      await expectNoCalendarExportOnPage(playdates);
    });
  });
});

test('Family B gate on Playdates hides lists and calendar export @regression', async ({ browser }) => {
  const context = await browser.newContext({ storageState: ALT_AUTH_FILE });
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesCalendar.dashboardNotSetUpMessage,
    );
    await expect(playdates.upcomingLabel).toHaveCount(0);
    await expect(playdates.pastLabel).toHaveCount(0);
    await expect(playdates.googleLink).toHaveCount(0);
    await expect(playdates.icsButton).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('Family B gate on Find a playdate hides lists and calendar export @regression', async ({
  browser,
}) => {
  const context = await browser.newContext({ storageState: ALT_AUTH_FILE });
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.gotoNew();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesCalendar.dashboardNotSetUpMessage,
    );
    await expect(playdates.upcomingLabel).toHaveCount(0);
    await expect(playdates.pastLabel).toHaveCount(0);
    await expect(playdates.googleLink).toHaveCount(0);
    await expect(playdates.icsButton).toHaveCount(0);
  } finally {
    await context.close();
  }
});
