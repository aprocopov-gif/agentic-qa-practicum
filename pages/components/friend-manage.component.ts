import { type Locator, type Page } from '@playwright/test';

export class FriendManageComponent {
  readonly root: Locator;
  readonly reportButton: Locator;
  readonly blockButton: Locator;
  readonly removeButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.cancelButton = page.getByRole('button', { name: 'cancel', exact: true });
    this.root = this.cancelButton.locator('..');
    this.reportButton = this.root.getByRole('button', { name: 'report', exact: true });
    this.blockButton = this.root.getByRole('button', { name: 'block', exact: true });
    this.removeButton = this.root.getByRole('button', { name: 'remove', exact: true });
  }

  /** Reports the friendship from the open manage actions. */
  async report(): Promise<void> {
    await this.reportButton.click();
  }

  /** Blocks the friendship from the open manage actions. */
  async block(): Promise<void> {
    await this.blockButton.click();
  }

  /** Removes the friendship from the open manage actions. */
  async remove(): Promise<void> {
    await this.removeButton.click();
  }

  /** Closes manage actions without changing the friendship. */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }
}
