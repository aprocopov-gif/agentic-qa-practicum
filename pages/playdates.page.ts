import { type Locator, type Page } from '@playwright/test';
import { AppRoute } from '../test-data/routes';
import { HeaderComponent } from './components/header.component';
import { ProposePlaydateFormComponent } from './components/propose-playdate-form.component';

export class PlaydatesPage {
  readonly header: HeaderComponent;
  readonly proposePlaydateForm: ProposePlaydateFormComponent;
  readonly title: Locator;
  readonly heading: Locator;
  readonly intro: Locator;
  readonly proposePanelTitle: Locator;
  readonly pendingRequestsLabel: Locator;
  readonly noPendingRequests: Locator;
  readonly noUpcomingPlaydates: Locator;
  readonly googleLink: Locator;
  readonly icsButton: Locator;
  readonly cancelButton: Locator;
  readonly acceptButton: Locator;
  readonly declineButton: Locator;
  readonly dashboardGateMessage: Locator;
  readonly upcomingLabel: Locator;
  readonly pastLabel: Locator;

  constructor(private readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.proposePlaydateForm = new ProposePlaydateFormComponent(page);
    this.title = this.header.banner.getByText('Playdates', { exact: true });
    this.heading = page.getByRole('heading', { name: 'Find a playdate', exact: true });
    this.intro = page.getByText(
      'Pick a family, choose a matched slot or propose a manual time, then wait for the other parent to approve.',
      { exact: true },
    );
    this.proposePanelTitle = page.getByText('Propose', { exact: true });
    this.pendingRequestsLabel = page.getByText('Pending requests', { exact: true });
    this.noPendingRequests = page.getByText('No pending requests.', { exact: true });
    this.noUpcomingPlaydates = page.getByText('No upcoming playdates yet.', { exact: true });
    this.googleLink = page.getByRole('link', { name: 'Google', exact: true });
    this.icsButton = page.getByRole('button', { name: 'ICS', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'cancel', exact: true });
    this.acceptButton = page.getByRole('button', { name: 'Accept', exact: true });
    this.declineButton = page.getByRole('button', { name: 'Decline', exact: true });
    this.dashboardGateMessage = page.locator('.empty-state').filter({
      hasText: 'Set up your family on the Dashboard before planning playdates.',
    });
    this.upcomingLabel = page.getByText('Upcoming', { exact: true });
    this.pastLabel = page.getByText('Past', { exact: true });
  }

  /** Matches-count badge on the Propose panel (e.g. "6 matches"). */
  matchesBadge(label: string): Locator {
    return this.page.getByText(label, { exact: true });
  }

  /** Numeric count shown beside a list heading. */
  listCountBeside(label: Locator, count: string): Locator {
    return label.locator('..').getByText(count, { exact: true });
  }

  /** Locator for a Past row that includes the family name and Cancelled status. */
  cancelledPastRow(familyName: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: familyName })
      .filter({ hasText: 'Cancelled' })
      .last();
  }

  /** Locator for a Past row that includes the given date-time fragment. */
  cancelledPastRowByDate(dateTimeFragment: string): Locator {
    return this.page.getByText(dateTimeFragment).locator('..').locator('..');
  }

  /** Locator for a cancelled Past row that includes a unique location token from provisioned data. */
  cancelledPastRowByLocationToken(locationToken: string): Locator {
    return this.cancelledPastRowByLocationNote(`${locationToken} park`);
  }

  /** Locator for a cancelled Past row matched by the provisioned location note. */
  cancelledPastRowByLocationNote(locationNote: string): Locator {
    return this.page
      .locator('div')
      .filter({ hasText: locationNote })
      .filter({ hasText: 'Cancelled' })
      .first();
  }

  /** Opens a cancelled Past row by family name. */
  async viewCancelledPastRow(familyName: string): Promise<void> {
    await this.cancelledPastRow(familyName).click();
  }

  /** Opens a cancelled Past row that includes the provision location token. */
  async viewCancelledPastRowByLocationToken(locationToken: string): Promise<void> {
    await this.cancelledPastRowByLocationToken(locationToken).click();
  }

  /** Google calendar link scoped to a playdate row. */
  googleLinkIn(row: Locator): Locator {
    return row.getByRole('link', { name: 'Google', exact: true });
  }

  /** ICS control scoped to a playdate row. */
  icsButtonIn(row: Locator): Locator {
    return row.getByRole('button', { name: 'ICS', exact: true });
  }

  /** Accept control scoped to a playdate row. */
  acceptButtonIn(row: Locator): Locator {
    return row.getByRole('button', { name: 'Accept', exact: true });
  }

  /** Decline control scoped to a playdate row. */
  declineButtonIn(row: Locator): Locator {
    return row.getByRole('button', { name: 'Decline', exact: true });
  }

  /** Cancel control scoped to a playdate row. */
  cancelButtonIn(row: Locator): Locator {
    return row.getByRole('button', { name: 'cancel', exact: true });
  }

  /** Opens the playdates page. */
  async goto(): Promise<void> {
    await this.page.goto(AppRoute.Playdates);
  }

  /** Opens the same playdate form at /playdates/new. */
  async gotoNew(): Promise<void> {
    await this.page.goto(AppRoute.NewPlaydate);
  }
}
