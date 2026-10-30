import { storageStatePathForOwner } from '../../support/auth.constants';
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
import { PlaydatesPage } from '../../pages/playdates.page';
import { altBaselineFamily } from '../../test-data/baseline-alt-family';
import { buildPlaydatesCalendarProvision } from '../../test-data/factories/playdates-calendar-provision.factory';
import { playdatesCalendarObserved } from '../../test-data/factories/playdates-calendar.factory';
import { PlaydateCircleFamily } from '../../test-data/playdates-propose.enums';
import { playdateCircleFamilyForSpec } from '../../test-data/playdates-spec-circle';
import { getSpecFamilyProfile } from '../../test-data/spec-profiles';
import { expect, test } from '../../fixtures/cleanup.fixture';
import { expectNoCalendarExportOnRow, expectNoPendingActionsOnRow } from './layer-helpers';

const aqpbt12Owner = getSpecFamilyProfile('aqpbt-12').owner;

test.describe('AQPBT-12 both layers (Family B alt)', () => {
  test.use({ storageState: storageStatePathForOwner(aqpbt12Owner) });
  installSpecFamilyProvisioning('aqpbt-12');

  test(
    'API-cancelled Past row has no calendar export on Playdates @destructive',
    { tag: '@destructive', lock: FAMILY_A_PLAYDATES_PROVISION_LOCK },
    async ({ page }) => {
      const boy5 = altBaselineFamily.children.find((child) => child.role === 'boy5')!;
      const girl8 = altBaselineFamily.children.find((child) => child.role === 'girl8')!;
      const circleFamily = playdateCircleFamilyForSpec('aqpbt-12');
      let locationToken = '';
      let locationNote = '';
      let childName = '';

      await test.step('API: arrange', async () => {
        const api = await createApiContextForOwner(aqpbt12Owner);
        await cancelOpenAutomationPlaydates(api);
        const daysBase = await daysAheadBaseForVisiblePast(api);
        const bundle = buildPlaydatesCalendarProvision(
          boy5.firstName,
          girl8.firstName,
          circleFamily,
          daysBase,
          daysBase + 1,
        );
        const primaryCase = bundle.primaryCase;
        locationToken = primaryCase.locationToken;
        locationNote = primaryCase.locationNote;
        childName = primaryCase.childName;
        expect(primaryCase.proposal.manual).toBeDefined();
        await createCancelledPastPlaydateViaApi(api, aqpbt12Owner, {
          circleFamilyName: primaryCase.proposal.circleFamilyName,
          manual: primaryCase.proposal.manual!,
          locationText: primaryCase.locationNote,
          notes: primaryCase.proposal.optionalNote ?? '',
          childFirstName: primaryCase.childName,
        });
      });

      const playdates = new PlaydatesPage(page);
      const row = playdates.cancelledPastRowByLocationToken(locationToken);

      await test.step('UI: check', async () => {
        await playdates.goto();
        await expect(row).toBeVisible();
        await expect(row).toContainText(PlaydateCircleFamily.Gorfels);
        await expect(row).toContainText(locationNote);
        await expect(row).toContainText(childName);
        await expect(row).toContainText(playdatesCalendarObserved.cancelledStatus);
        await expectNoCalendarExportOnRow(playdates, row);
        await expectNoPendingActionsOnRow(playdates, row);
      });

      await test.step('UI: act', async () => {
        await row.click();
        await expect(playdates.noUpcomingPlaydates).toHaveText(
          playdatesCalendarObserved.upcomingEmptyCopy,
        );
        await expectNoCalendarExportOnRow(playdates, row);
      });

      await test.step('API: prove', async () => {
        const api = await createApiContextForOwner(aqpbt12Owner);
        const list = await getPlaydates(api);
        const rowApi = findPlaydateByLocationToken(list, locationToken);
        expect(rowApi?.status).toBe('cancelled');
      });
    },
  );
});
