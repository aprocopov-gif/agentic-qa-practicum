import {
  connectionFamilyNames,
  createApiContextForOwner,
  getConnections,
} from '../../support/api-client';
import { installSpecFamilyProvisioning } from '../../support/spec-family-hooks';
import { FriendsPage } from '../../pages/friends.page';
import { PlaydateCircleFamily } from '../../test-data/playdates-propose.enums';
import { AppRoute } from '../../test-data/routes';
import { expect, test } from '../../fixtures/cleanup.fixture';

const friendsUrl = new RegExp(`${AppRoute.Friends.replace('/', '\\/')}(\\/|\\?|$)`);

test.describe('AQPBT-14 both layers (Family A)', () => {
  installSpecFamilyProvisioning('aqpbt-14');

  test(
    'UI manage cancel leaves GET /api/v1/connections unchanged @sanity',
    { tag: '@sanity' },
    async ({ page }) => {
      let namesBefore: string[] = [];

      await test.step('API: baseline', async () => {
        const mainApi = await createApiContextForOwner('main');
        const connections = await getConnections(mainApi);
        namesBefore = connectionFamilyNames(connections);
        expect(namesBefore).toEqual(
          expect.arrayContaining([PlaydateCircleFamily.Nguyens, PlaydateCircleFamily.Petrovs]),
        );
      });

      const friends = new FriendsPage(page);

      await test.step('UI: act', async () => {
        await friends.goto();
        await friends.openManage(PlaydateCircleFamily.Nguyens);
        await friends.cancelManage();
      });

      await test.step('UI: check', async () => {
        await expect(friends.manage.reportButton).not.toBeVisible();
        await expect(friends.schedulePlaydateButton(PlaydateCircleFamily.Nguyens)).toBeVisible();
        await expect(friends.manageButton(PlaydateCircleFamily.Nguyens)).toBeVisible();
        await expect(page).toHaveURL(friendsUrl);
      });

      await test.step('API: prove', async () => {
        const mainApi = await createApiContextForOwner('main');
        const namesAfter = connectionFamilyNames(await getConnections(mainApi));
        expect(namesAfter).toEqual(
          expect.arrayContaining([PlaydateCircleFamily.Nguyens, PlaydateCircleFamily.Petrovs]),
        );
        expect(namesAfter.length).toBeGreaterThanOrEqual(namesBefore.length);
      });
    },
  );
});
