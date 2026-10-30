import { createApiContextForOwner, createChild, getMe } from '../../support/api-client';
import { buildChildCreatePayload } from '../../test-data/factories/child.factory';
import { DashboardPage } from '../../pages/dashboard.page';
import { expect, test, trackRecord } from '../../fixtures/cleanup.fixture';

test(
  'API-created child shows on dashboard; UI remove clears GET /me @destructive',
  { tag: '@destructive' },
  async ({ page }) => {
    const payload = buildChildCreatePayload();
    let childId = '';
    let kidsCountBefore = 0;

    await test.step('API: arrange', async () => {
      const mainApi = await createApiContextForOwner('main');
      const meBefore = await getMe(mainApi);
      kidsCountBefore = meBefore.family?.children?.length ?? 0;

      const created = await createChild(mainApi, payload);
      expect(created.ok, created.message).toBe(true);
      childId = created.id;
      trackRecord({ type: 'child', id: childId, owner: 'main' });
    });

    const dashboard = new DashboardPage(page);

    await test.step('UI: check', async () => {
      await dashboard.goto();
      await expect(
        dashboard.childSummaryLine(payload.firstName, payload.birthYear, payload.birthMonth),
      ).toBeVisible();
      await expect(dashboard.myKidsCount).toHaveText(String(kidsCountBefore + 1));
    });

    await test.step('UI: act', async () => {
      await dashboard.removeChild(payload.firstName);
    });

    await test.step('API: prove', async () => {
      const mainApi = await createApiContextForOwner('main');
      await expect
        .poll(async () => {
          const me = await getMe(mainApi);
          const children = me.family?.children ?? [];
          return children.some((child) => child.id === childId);
        })
        .toBe(false);
    });
  },
);
