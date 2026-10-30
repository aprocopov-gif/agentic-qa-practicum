import {
  connectionFamilyNames,
  createApiContextForOwner,
  getConnections,
  getMatches,
} from '../../support/api-client';
import { installSpecFamilyProvisioning } from '../../support/spec-family-hooks';
import { PlaydatesPage } from '../../pages/playdates.page';
import { playdatesProposeObserved } from '../../test-data/factories/propose-playdate.factory';
import { PlaydateCircleFamily } from '../../test-data/playdates-propose.enums';
import { expect, test } from '../../fixtures/cleanup.fixture';

test.describe('AQPBT-9 both layers (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-9');

  test(
    'UI family switch aligns with GET /api/v1/matches and connections @e2e',
    { tag: '@e2e' },
    async ({ page }) => {
      await test.step('API: baseline', async () => {
        const mainApi = await createApiContextForOwner('main');
        const matches = await getMatches(mainApi);
        const connections = await getConnections(mainApi);
        expect(matches.length).toBeGreaterThan(0);
        expect(connectionFamilyNames(connections)).toEqual(
          expect.arrayContaining([PlaydateCircleFamily.Nguyens, PlaydateCircleFamily.Petrovs]),
        );
      });

      const playdates = new PlaydatesPage(page);
      const form = playdates.proposePlaydateForm;

      await test.step('UI: act', async () => {
        await playdates.goto();
        await form.selectFamily(PlaydateCircleFamily.Petrovs);
      });

      await test.step('UI: check', async () => {
        await expect(playdates.matchesBadge(playdatesProposeObserved.matchesBadge)).toBeVisible();
        await expect(form.matchedSlotContaining(PlaydateCircleFamily.Petrovs).first()).toBeVisible();
      });

      await test.step('API: prove', async () => {
        const mainApi = await createApiContextForOwner('main');
        const matches = await getMatches(mainApi);
        expect(matches.length).toBeGreaterThan(0);
        const connections = await getConnections(mainApi);
        expect(connectionFamilyNames(connections)).toContain(PlaydateCircleFamily.Petrovs);
      });
    },
  );
});
