import { test, expect } from '../fixtures/cleanup.fixture';
import { FriendsPage } from '../pages/friends.page';
import { PlaydateCircleFamily } from '../test-data/playdates-propose.enums';
import { AppRoute } from '../test-data/routes';

const friendsUrl = new RegExp(`${AppRoute.Friends.replace('/', '\\/')}(\\/|\\?|$)`);

async function expectCardShowsScheduleAndManage(
  friends: FriendsPage,
  familyName: string,
): Promise<void> {
  await expect(friends.schedulePlaydateButton(familyName)).toBeVisible();
  await expect(friends.manageButton(familyName)).toBeVisible();
}

async function expectManageActionsVisible(friends: FriendsPage): Promise<void> {
  await expect(friends.manage.reportButton).toBeVisible();
  await expect(friends.manage.blockButton).toBeVisible();
  await expect(friends.manage.removeButton).toBeVisible();
  await expect(friends.manage.cancelButton).toBeVisible();
}

test.describe('AQPBT-14 friends manage connection (Family A)', () => {
  test('Friends lists circle cards with Schedule Playdate and manage @smoke', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();

    await expect(friends.title).toBeVisible();
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Nguyens);
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Petrovs);

    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await expectManageActionsVisible(friends);
  });

  test('Manage on The Nguyens shows report, block, remove, and cancel @sanity', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);

    await expectManageActionsVisible(friends);
  });

  test('Cancel on The Nguyens closes manage and leaves the card intact @sanity', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await friends.cancelManage();

    await expect(friends.manage.reportButton).not.toBeVisible();
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Nguyens);
  });

  test('After cancel, manage on The Petrovs shows the same actions @e2e', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await friends.cancelManage();
    await friends.openManage(PlaydateCircleFamily.Petrovs);

    await expectManageActionsVisible(friends);
  });

  test('Opening manage stays on Friends and does not hide the other card @regression', async ({
    page,
  }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);

    await expect(page).toHaveURL(friendsUrl);
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Petrovs);
    await expectManageActionsVisible(friends);
  });

  test('Cancel does not remove the friendship or hide The Nguyens @regression', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await friends.cancelManage();

    await expect(friends.familyCard(PlaydateCircleFamily.Nguyens)).toBeVisible();
    await expect(friends.manage.reportButton).not.toBeVisible();
    await expect(friends.manage.blockButton).not.toBeVisible();
    await expect(friends.manage.removeButton).not.toBeVisible();
    await expect(page).toHaveURL(friendsUrl);
  });

  test('After opening Petrovs, The Nguyens card still shows manage @regression', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await friends.cancelManage();
    await friends.openManage(PlaydateCircleFamily.Petrovs);

    await expect(friends.manage.cancelButton).toBeVisible();
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Nguyens);
  });

  test('Reloading Friends after cancel still lists both circle families @e2e', async ({ page }) => {
    const friends = new FriendsPage(page);

    await friends.goto();
    await friends.openManage(PlaydateCircleFamily.Nguyens);
    await friends.cancelManage();
    await friends.goto();

    await expect(friends.title).toBeVisible();
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Nguyens);
    await expectCardShowsScheduleAndManage(friends, PlaydateCircleFamily.Petrovs);
  });
});
