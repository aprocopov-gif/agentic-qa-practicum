import { type Locator } from '@playwright/test';

import { test, expect } from '../fixtures/cleanup.fixture';
import { DashboardPage } from '../pages/dashboard.page';
import { PlaydatesPage } from '../pages/playdates.page';
import { storageStatePathForOwner } from '../support/auth.constants';
import {
  GATE_FAMILY_SKIP_REASON,
  isGateFamilyAuthConfigured,
  newGateFamilyContext,
} from '../support/gate-family.context';
import { getApiContext } from '../support/api-client';
import { getSpecFamilyProfile } from '../test-data/spec-profiles';
import { installSpecFamilyProvisioning } from '../support/spec-family-hooks';
import {
  expectProvisionedPastNewestFirst,
  getPlaydatesListsProvision,
  getProvisionedPlaydatesReadiness,
  waitForProvisionedPlaydatesReadiness,
  provisionPlaydatesListsData,
  teardownProvisionedPlaydates,
  validateProvisionedPlaydates,
} from '../support/playdates-lists-provision';
import { playdatesListsObserved } from '../test-data/factories/playdates-lists.factory';
import { invalidPlaydatesLists } from '../test-data/invalid-playdates-lists';
import { FAMILY_A_PLAYDATES_PROVISION_LOCK } from '../support/playdates-provision.constants';
import { AppRoute } from '../test-data/routes';

const playdatesUrl = new RegExp(`${AppRoute.Playdates.replace('/', '\\/')}(\\/|\\?|$)`);
const newPlaydateUrl = new RegExp(`${AppRoute.NewPlaydate.replace('/', '\\/')}(\\/|\\?|$)`);

async function expectNoRowActions(playdates: PlaydatesPage, row: Locator): Promise<void> {
  await expect(playdates.googleLinkIn(row)).toHaveCount(0);
  await expect(playdates.icsButtonIn(row)).toHaveCount(0);
  await expect(playdates.acceptButtonIn(row)).toHaveCount(0);
  await expect(playdates.declineButtonIn(row)).toHaveCount(0);
  await expect(playdates.cancelButtonIn(row)).toHaveCount(0);
}

const aqpbt11Owner = getSpecFamilyProfile('aqpbt-11').owner;

test.describe('AQPBT-11 playdates upcoming and past lists (Family A)', () => {
  test.use({ storageState: storageStatePathForOwner(aqpbt11Owner) });

  installSpecFamilyProvisioning('aqpbt-11');
  test.describe.configure({ timeout: 120_000, lock: FAMILY_A_PLAYDATES_PROVISION_LOCK });

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: storageStatePathForOwner(aqpbt11Owner) });
    const page = await context.newPage();
    try {
      await provisionPlaydatesListsData(page, 'aqpbt-11');
    } catch (error) {
      console.warn('AQPBT-11 provision failed; dependent tests will be skipped:', error);
    } finally {
      await page.close();
      await context.close();
    }
  });

  test.beforeEach(async ({}, testInfo) => {
    const api = await getApiContext(aqpbt11Owner);
    const readiness = await waitForProvisionedPlaydatesReadiness(api);
    if (!readiness.ready) {
      testInfo.annotations.push({ type: 'note', description: readiness.reportComment });
      test.skip(true, readiness.reportComment);
    }
  });

  test.afterAll(async () => {
    try {
      const readiness = await getProvisionedPlaydatesReadiness(await getApiContext(aqpbt11Owner));
      if (readiness.ready) {
        await teardownProvisionedPlaydates(readiness.state);
      }
    } catch {
      // provision never completed
    }
  });

  test('Playdates shows Find a playdate, Upcoming, and Past @smoke', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.heading).toHaveText(playdatesListsObserved.heading);
    await expect(playdates.upcomingLabel.first()).toHaveText(playdatesListsObserved.upcomingLabel);
    await expect(playdates.pastLabel.first()).toHaveText(playdatesListsObserved.pastLabel);
  });

  test('empty Upcoming shows count 0 and empty copy @sanity', async ({ page }) => {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(
      playdates.listCountBeside(playdates.upcomingLabel, playdatesListsObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesListsObserved.upcomingEmptyCopy);
  });

  test('Past lists cancelled rows with family, date, child, and status @sanity', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const provision = getPlaydatesListsProvision();
    const row = playdates.cancelledPastRowByLocationToken(provision.miaCase.locationToken);

    await playdates.goto();

    await expect(playdates.pastLabel.first()).toBeVisible();
    await expect(row).toBeVisible();
    await expect(row).toContainText(playdatesListsObserved.familyNguyen);
    await expect(row).toContainText(provision.miaCase.childName);
    await expect(row).toContainText(playdatesListsObserved.cancelledStatus);
  });

  test('Find a playdate route shows the same Upcoming and Past @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const provision = getPlaydatesListsProvision();

    await playdates.gotoNew();

    await expect(page).toHaveURL(newPlaydateUrl);
    await expect(
      playdates.listCountBeside(playdates.upcomingLabel, playdatesListsObserved.emptyCount),
    ).toBeVisible();
    await expect(playdates.noUpcomingPlaydates).toHaveText(playdatesListsObserved.upcomingEmptyCopy);
    await expect(
      playdates.cancelledPastRowByLocationToken(provision.miaCase.locationToken),
    ).toBeVisible();
    await expect(playdates.pastLabel.first()).toBeVisible();
  });

  test('clicking a Cancelled Past row stays on Playdates without actions @regression', async ({
    page,
  }) => {
    const playdates = new PlaydatesPage(page);
    const row = playdates.cancelledPastRow(playdatesListsObserved.familyNguyen);

    await playdates.goto();
    await playdates.viewCancelledPastRow(playdatesListsObserved.familyNguyen);

    await expect(page).toHaveURL(playdatesUrl);
    await expectNoRowActions(playdates, row);
  });

  test('Past row can include a place after a middle dot @regression', async ({ page }) => {
    const playdates = new PlaydatesPage(page);
    const provision = getPlaydatesListsProvision();
    const row = playdates.cancelledPastRowByLocationToken(provision.miaCase.locationToken);

    await playdates.goto();

    await expect(row).toBeVisible();
    await expect(row).toContainText(provision.miaCase.locationNote);
    await expect(row).toContainText(provision.miaCase.childName);
    await expect(row).toContainText(playdatesListsObserved.cancelledStatus);
  });

  test('Past includes both provisioned cancelled rows @regression', async () => {
    const api = await getApiContext(aqpbt11Owner);
    await validateProvisionedPlaydates(api, getPlaydatesListsProvision());
  });

  test('Dashboard View all opens Playdates lists @e2e', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const playdates = new PlaydatesPage(page);

    await dashboard.goto();
    await dashboard.openAllPlaydates();

    await expect(page).toHaveURL(playdatesUrl);
    await expect(playdates.upcomingLabel.first()).toHaveText(playdatesListsObserved.upcomingLabel);
    await expect(playdates.pastLabel.first()).toHaveText(playdatesListsObserved.pastLabel);
  });

  test('Past rows appear newest-first @api', async () => {
    const api = await getApiContext(aqpbt11Owner);
    await expectProvisionedPastNewestFirst(api, getPlaydatesListsProvision());
  });
});

test('Family B gate on Playdates hides Upcoming and Past @regression', async ({ browser }) => {
  test.skip(!isGateFamilyAuthConfigured(), GATE_FAMILY_SKIP_REASON);
  const context = await newGateFamilyContext(browser);
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.goto();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesLists.dashboardNotSetUpMessage,
    );
    await expect(playdates.upcomingLabel).toHaveCount(0);
    await expect(playdates.noUpcomingPlaydates).toHaveCount(0);
    await expect(playdates.pastLabel).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test('Family B gate on Find a playdate hides Upcoming and Past @regression', async ({ browser }) => {
  test.skip(!isGateFamilyAuthConfigured(), GATE_FAMILY_SKIP_REASON);
  const context = await newGateFamilyContext(browser);
  const page = await context.newPage();
  try {
    const playdates = new PlaydatesPage(page);

    await playdates.gotoNew();

    await expect(playdates.dashboardGateMessage).toContainText(
      invalidPlaydatesLists.dashboardNotSetUpMessage,
    );
    await expect(playdates.upcomingLabel).toHaveCount(0);
    await expect(playdates.pastLabel).toHaveCount(0);
  } finally {
    await context.close();
  }
});
