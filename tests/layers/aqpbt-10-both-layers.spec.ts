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
import { playdatesPendingObserved } from '../../test-data/factories/playdates-pending.factory';
import { PlaydateCircleFamily } from '../../test-data/playdates-propose.enums';
import { AppRoute } from '../../test-data/routes';
import { expect, test } from '../../fixtures/cleanup.fixture';
import { expectNoPendingActionsOnRow } from './layer-helpers';

const playdatesUrl = new RegExp(`${AppRoute.Playdates.replace('/', '\\/')}(\\/|\\?|$)`);

test.describe('AQPBT-10 both layers (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-10');

  test(
    'API-cancelled Past row shows on Playdates without pending actions @destructive',
    { tag: '@destructive', lock: FAMILY_A_PLAYDATES_PROVISION_LOCK },
    async ({ page }) => {
      const child = getSpecChildByRole('aqpbt-10', 'boy10');
      let locationToken = '';

      await test.step('API: arrange', async () => {
        const mainApi = await createApiContextForOwner('main');
        await cancelOpenAutomationPlaydates(mainApi);
        const daysBase = await daysAheadBaseForVisiblePast(mainApi);
        const bundle = buildPlaydatesListsProvision(
          child.firstName,
          child.firstName,
          PlaydateCircleFamily.Nguyens,
          daysBase,
          daysBase + 1,
        );
        const provisionCase = bundle.miaCase;
        locationToken = provisionCase.locationToken;
        expect(provisionCase.proposal.manual).toBeDefined();
        await createCancelledPastPlaydateViaApi(mainApi, 'main', {
          circleFamilyName: provisionCase.proposal.circleFamilyName,
          manual: provisionCase.proposal.manual!,
          locationText: provisionCase.locationNote,
          notes: provisionCase.proposal.optionalNote ?? '',
          childFirstName: provisionCase.childName,
        });
      });

      const playdates = new PlaydatesPage(page);
      const row = playdates.cancelledPastRowByLocationToken(locationToken);

      await test.step('UI: check', async () => {
        await expect(async () => {
          await playdates.goto();
          await expect(row).toBeVisible();
        }).toPass({ timeout: 15_000 });
        await expect(row).toContainText(playdatesPendingObserved.cancelledStatus);
        await expectNoPendingActionsOnRow(playdates, row);
      });

      await test.step('UI: act', async () => {
        await playdates.viewCancelledPastRow(PlaydateCircleFamily.Nguyens);
        await expect(page).toHaveURL(playdatesUrl);
        await expectNoPendingActionsOnRow(playdates, row);
      });

      await test.step('API: prove', async () => {
        const mainApi = await createApiContextForOwner('main');
        await expect
          .poll(async () => {
            const list = await getPlaydates(mainApi);
            return findPlaydateByLocationToken(list, locationToken)?.status;
          })
          .toBe('cancelled');
      });
    },
  );
});
