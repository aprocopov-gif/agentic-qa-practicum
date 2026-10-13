import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { CircleInvitePanelComponent } from './components/circle-invite-panel.component';
import { FriendManageComponent } from './components/friend-manage.component';
import { HeaderComponent } from './components/header.component';

export class FriendsPage {
  readonly header: HeaderComponent;
  readonly manage: FriendManageComponent;
  readonly circleInvitePanel: CircleInvitePanelComponent;
  readonly title: Locator;
  readonly inviteFamilyButton: Locator;
  readonly exploreCommunitiesLink: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.manage = new FriendManageComponent(page);
    this.circleInvitePanel = new CircleInvitePanelComponent(page);
    this.title = this.header.banner.getByText('Friends', { exact: true });
    this.inviteFamilyButton = page.getByRole('button', { name: '+ Invite a family', exact: true });
    this.exploreCommunitiesLink = page.getByRole('link', { name: 'Explore Communities', exact: true });
  }

  /** Opens the friends page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Friends);
  }

  /** Opens the circle invite panel. */
  async openCircleInvite(): Promise<void> {
    await this.inviteFamilyButton.click();
  }

  /** Card that shows this circle family name. */
  familyCard(familyName: string): Locator {
    return this.page.getByText(familyName, { exact: true }).locator('..');
  }

  /** Schedule Playdate on the family card that shows this name. */
  schedulePlaydateButton(familyName: string): Locator {
    return this.familyCard(familyName).getByRole('button', { name: 'Schedule Playdate', exact: true });
  }

  /** Manage on the family card that shows this name. */
  manageButton(familyName: string): Locator {
    return this.familyCard(familyName).getByRole('button', { name: 'manage', exact: true });
  }

  /** Opens scheduling for the family card that shows this name. */
  async openSchedulePlaydate(familyName: string): Promise<void> {
    await this.schedulePlaydateButton(familyName).click();
  }

  /** Opens manage actions for the family card that shows this name. */
  async openManage(familyName: string): Promise<void> {
    await this.manageButton(familyName).click();
  }

  /** Closes manage actions without changing the friendship. */
  async cancelManage(): Promise<void> {
    await this.manage.cancel();
  }
}
