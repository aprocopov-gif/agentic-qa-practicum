import {
  createApiContextForOwner,
  findPlaydateByLocationToken,
  getPlaydates,
} from '../../support/api-client';
import { createCancelledPastPlaydateViaApi } from '../../support/playdates-provision-api';
import { cancelOpenAutomationPlaydates } from '../../support/playdates-provision-cleanup';
import { daysAheadBaseForVisiblePast } from '../../support/playdates-provision-schedule';
import { FAMILY_A_PLAYDATES_PROVISION_LOCK } from '../../support/playdates-provision.constants';
import { installSpecFamilyProvisioning } from '../../support/spec-family-hooks';
import { getSpecChildByRole } from '../../support/spec-family-provision';
import { PlaydatesPage } from '../../pages/playdates.page';
import { buildPlaydatesListsProvision } from '../../test-data/factories/playdates-lists-provision.factory';
import { playdatesListsObserved } from '../../test-data/factories/playdates-lists.factory';
import { playdateCircleFamilyForSpec } from '../../test-data/playdates-spec-circle';
import { AppRoute } from '../../test-data/routes';
import { expect, test } from '../../fixtures/cleanup.fixture';
import { expectNoPendingActionsOnRow } from './layer-helpers';

const playdatesUrl = new RegExp(`${AppRoute.Playdates.replace('/', '\\/')}(\\/|\\?|$)`);

test.describe('AQPBT-11 both layers (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-11');

  test(
    'API-cancelled Past row lists family, child, and status on Playdates @destructive',
    { tag: '@destructive', lock: FAMILY_A_PLAYDATES_PROVISION_LOCK },
    async ({ page }) => {
      const primaryChild = getSpecChildByRole('aqpbt-11', 'girl10');
      const secondaryChild = getSpecChildByRole('aqpbt-11', 'girl7');
      const circleFamily = playdateCircleFamilyForSpec('aqpbt-11');
      let locationToken = '';
      let childName = '';

      await test.step('API: arrange', async () => {
        const mainApi = await createApiContextForOwner('main');
        await cancelOpenAutomationPlaydates(mainApi);
        const daysBase = await daysAheadBaseForVisiblePast(mainApi);
        const bundle = buildPlaydatesListsProvision(
          primaryChild.firstName,
          secondaryChild.firstName,
          circleFamily,
          daysBase,
          daysBase + 1,
        );
        const miaCase = bundle.miaCase;
        locationToken = miaCase.locationToken;
        childName = miaCase.childName;
        expect(miaCase.proposal.manual).toBeDefined();
        await createCancelledPastPlaydateViaApi(mainApi, 'main', {
          circleFamilyName: miaCase.proposal.circleFamilyName,
          manual: miaCase.proposal.manual!,
          locationText: miaCase.locationNote,
          notes: miaCase.proposal.optionalNote ?? '',
          childFirstName: miaCase.childName,
        });
      });

      const playdates = new PlaydatesPage(page);
      const row = playdates.cancelledPastRowByLocationToken(locationToken);

      await test.step('UI: check', async () => {
        await playdates.goto();
        await expect(row).toBeVisible();
        await expect(row).toContainText(playdatesListsObserved.familyNguyen);
        await expect(row).toContainText(childName);
        await expect(row).toContainText(playdatesListsObserved.cancelledStatus);
      });

      await test.step('UI: act', async () => {
        await playdates.viewCancelledPastRow(playdatesListsObserved.familyNguyen);
        await expect(page).toHaveURL(playdatesUrl);
        await expectNoPendingActionsOnRow(playdates, row);
      });

      await test.step('API: prove', async () => {
        const mainApi = await createApiContextForOwner('main');
        const list = await getPlaydates(mainApi);
        const rowApi = findPlaydateByLocationToken(list, locationToken);
        expect(rowApi?.status).toBe('cancelled');
        const childNames = (rowApi?.children ?? []).map((entry) => entry.firstName);
        expect(childNames).toContain(childName);
      });
    },
  );
});
