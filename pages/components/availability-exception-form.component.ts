import { type Locator, type Page } from '@playwright/test';

import { AvailabilityCopy } from '../../test-data/availability.enums';

/** Matches saved exception summary lines (e.g. `2026-09-29 13:00-17:00 open - note`). */
const EXCEPTION_LIST_ENTRY = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}-\d{2}:\d{2}/;

export class AvailabilityExceptionFormComponent {
  readonly root: Locator;
  readonly oneOffChangesHeading: Locator;
  readonly date: Locator;
  readonly type: Locator;
  readonly note: Locator;
  readonly submitButton: Locator;
  readonly listEntries: Locator;

  constructor(page: Page) {
    this.submitButton = page.getByRole('button', { name: AvailabilityCopy.addException, exact: true });
    this.root = this.submitButton.locator('..');
    this.oneOffChangesHeading = page.getByText(AvailabilityCopy.oneOffChanges, { exact: true });
    this.date = this.root.getByRole('textbox').first();
    this.type = this.root.getByRole('combobox');
    this.note = this.root.getByRole('textbox', { name: 'Optional note', exact: true });
    this.listEntries = page.getByText(EXCEPTION_LIST_ENTRY);
  }

  /** Fills the optional exception note. */
  async fillNote(note: string): Promise<void> {
    await this.note.fill(note);
  }

  /** Submits a one-off availability change. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
