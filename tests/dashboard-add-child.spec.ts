import { DashboardPage } from '../pages/dashboard.page';
import { buildChildFirstName } from '../test-data/factories/child.factory';
import { expect, test } from '../fixtures/cleanup.fixture';

test('adds a child on the dashboard then removes them @smoke', async ({ page }) => {
  const firstName = buildChildFirstName();
  const dashboard = new DashboardPage(page);

  await dashboard.goto();
  await expect(dashboard.title).toBeVisible();

  const form = dashboard.addChildForm;
  await form.fill(firstName, '2018', '6', '');
  await form.selectAvatar('Fox');
  await form.submit();

  await expect(page.getByText(firstName, { exact: false })).toBeVisible();

  await dashboard.removeChild(firstName);

  await expect(page.getByText(firstName, { exact: false })).toHaveCount(0);
});
