import { type Locator } from '@playwright/test';

import { test, expect } from '../fixtures/cleanup.fixture';
import { PlaydatesPage } from '../pages/playdates.page';
import { ALT_AUTH_FILE, AUTH_FILE } from '../support/auth.constants';
import { getApiContext } from '../support/api-client';
import {
  getPlaydatesPendingProvision,
  getPlaydatesPendingProvisionReadiness,
  provisionPlaydatesPendingData,
  teardownPlaydatesPendingProvision,
  waitForPlaydatesPendingProvisionReadiness,
} from '../support/playdates-pending-provision';
import { installSpecFamilyProvisioning } from '../support/spec-family-hooks';
import { playdatesPendingObserved } from '../test-data/factories/playdates-pending.factory';
import { invalidPlaydatesPending } from '../test-data/invalid-playdates-pending';
import { FAMILY_A_PLAYDATES_PROVISION_LOCK } from '../support/playdates-provision.constants';
import { AppRoute } from '../test-data/routes';

const newPlaydateUrl = new RegExp(`${AppRoute.NewPlaydate.replace('/', '\\/')}(\\/|\\?|$)`);

async function expectNoPendingActionsOnRow(playdates: PlaydatesPage, row: Locator): Promise<void> {
  await expect(playdates.acceptButtonIn(row)).toHaveCount(0);
  await expect(playdates.declineButtonIn(row)).toHaveCount(0);
  await expect(playdates.cancelButtonIn(row)).toHaveCount(0);
}

test.describe('AQPBT-10 playdates pending requests (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-10');

  test('Playdates shows Find a playdate intro and Pending requests @smoke', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.heading).toHaveText(playdatesPendingObserved.heading);
    await expect(playdates.intro).toHaveText(playdatesPendingObserved.intro);
    await expect(playdates.pendingRequestsLabel).toHaveText(playdatesPendingObserved.pendingLabel);
  });

  test('empty Pending requests shows count 0 and empty copy @sanity', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(
      playdates.listCountBeside(playdates.pendingRequestsLabel, playdatesPendingObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noPendingRequests).toHaveText(playdatesPendingObserved.pendingEmptyCopy);
  });

  test('Find a playdate route shows the same empty Pending requests @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.gotoNew();

    await expect(page).toHaveURL(newPlaydateUrl);
    await expect(playdates.pendingRequestsLabel).toHaveText(playdatesPendingObserved.pendingLabel);
    await expect(
      playdates.listCountBeside(playdates.pendingRequestsLabel, playdatesPendingObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noPendingRequests).toHaveText(playdatesPendingObserved.pendingEmptyCopy);
  });

  test.describe('provisioned cancelled Past row', () => {
    test.describe.configure({ mode: 'serial', lock: FAMILY_A_PLAYDATES_PROVISION_LOCK });

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext({ storageState: AUTH_FILE });
      const page = await context.newPage();
      try {
        await provisionPlaydatesPendingData(page, 'aqpbt-10');
      } catch (error) {
        console.warn('AQPBT-10 playdate provision failed; dependent tests will be skipped:', error);
      } finally {
        await page.close();
        await context.close();
      }
    });

    test.beforeEach(async ({}, testInfo) => {
      const api = await getApiContext('main');
      const readiness = await waitForPlaydatesPendingProvisionReadiness(api);
      if (!readiness.ready) {
        testInfo.annotations.push({ type: 'note', description: readiness.reportComment });
        test.skip(true, readiness.reportComment);
      }
    });

    test.afterAll(async () => {
      try {
        const readiness = await getPlaydatesPendingProvisionReadiness(await getApiContext('main'));
        if (readiness.ready) {
          await teardownPlaydatesPendingProvision(readiness.state);
        }
      } catch {
        // provision never completed
      }
    });

    test('Cancelled Past rows have no Accept, Decline, or cancel @regression', async ({ page }) => {
      const playdates = new PlaydatesPage(page);
      const provision = getPlaydatesPendingProvision();
      const row = playdates.cancelledPastRowByLocationToken(provision.cancelledCase.locationToken);

      await playdates.goto();

      await expect(row).toBeVisible();
      await expect(row).toContainText(playdatesPendingObserved.cancelledStatus);
      await expectNoPendingActionsOnRow(playdates, row);
    });
  });

  test('empty Upcoming is still shown next to empty Pending requests @api', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.pendingRequestsLabel).toHaveText(playdatesPendingObserved.pendingLabel);
    await expect(playdates.noPendingRequests).toHaveText(playdatesPendingObserved.pendingEmptyCopy);
    await expect(playdates.upcomingLabel.first()).toHaveText(playdatesPendingObserved.upcomingLabel);
    await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesPendingObserved.upcomingEmptyCopy);
  });

  test('banner Notifications shows no pending inbox @e2e', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();
    await playdates.header.openNotifications();

    await expect(playdates.header.noNewNotifications).toHaveText(
      playdatesPendingObserved.noNewNotifications,
    );
  });
});

test('Family B gate hides Pending requests @regression', async ({ browser }) => {
  const context = await browser.newContext({ storageState: ALT_AUTH_FILE });
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesPending.dashboardNotSetUpMessage,
    );
    await expect(playdates.pendingRequestsLabel).toHaveCount(0);
    await expect(playdates.noPendingRequests).toHaveCount(0);
  } finally {
    await context.close();
  }
});
