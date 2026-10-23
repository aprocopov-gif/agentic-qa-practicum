import { type Locator, type Page } from '@playwright/test';

export class ProposePlaydateFormComponent {
  readonly root: Locator;
  readonly family: Locator;
  readonly place: Locator;
  readonly manualDate: Locator;
  readonly manualStartTime: Locator;
  readonly manualEndTime: Locator;
  readonly locationNote: Locator;
  readonly optionalNote: Locator;
  readonly submitButton: Locator;
  readonly matchedSlots: Locator;

  constructor(page: Page) {
    this.submitButton = page.getByRole('button', { name: 'Send request', exact: true });
    this.root = this.submitButton.locator('..');
    this.matchedSlots = this.root.getByRole('button').filter({ hasNotText: 'Send request' });
    this.place = this.root.getByRole('combobox').filter({
      has: page.getByRole('option', { name: 'Out / neutral place', exact: true }),
    });
    this.family = this.root.getByRole('combobox').filter({
      hasNot: page.getByRole('option', { name: 'My place', exact: true }),
    });
    this.manualDate = this.root.getByRole('textbox').nth(0);
    this.manualStartTime = this.root.getByRole('textbox').nth(1);
    this.manualEndTime = this.root.getByRole('textbox').nth(2);
    this.locationNote = this.root.getByRole('textbox', {
      name: 'Location note, park name, or address',
      exact: true,
    });
    this.optionalNote = this.root.getByRole('textbox', { name: 'Optional note', exact: true });
  }

  /** Chooses the family to invite. */
  async selectFamily(name: string): Promise<void> {
    await this.family.selectOption({ label: name });
  }

  /** Chooses where the playdate happens. */
  async selectPlace(name: string): Promise<void> {
    await this.place.selectOption({ label: name });
  }

  /** Fills manual date and time fields. */
  async fillManualTime(date: string, startTime: string, endTime: string): Promise<void> {
    await this.manualDate.fill(date);
    await this.manualStartTime.fill(startTime);
    await this.manualEndTime.fill(endTime);
  }

  /** Fills the location and optional notes. */
  async fillNotes(location: string, note: string): Promise<void> {
    await this.locationNote.fill(location);
    await this.optionalNote.fill(note);
  }

  /** Family combobox option with this visible name. */
  familyOption(name: string): Locator {
    return this.family.getByRole('option', { name, exact: true });
  }

  /** Place combobox option with this visible name. */
  placeOption(name: string): Locator {
    return this.place.getByRole('option', { name, exact: true });
  }

  /** Child checkbox in the propose form. */
  childCheckbox(name: string): Locator {
    return this.root.getByRole('checkbox', { name, exact: true });
  }

  /** Matched-slot button whose accessible name is this label. */
  matchedSlot(name: string): Locator {
    return this.root.getByRole('button', { name, exact: true });
  }

  /** Matched-slot buttons whose accessible name includes this text. */
  matchedSlotContaining(text: string): Locator {
    return this.root.getByRole('button', { name: text });
  }

  /** Chooses the first live matched slot (accessible names change as dates roll). */
  async selectFirstMatchedSlot(): Promise<void> {
    await this.matchedSlots.first().click();
  }

  /** Selects a child checkbox in the propose form. */
  async selectChild(name: string): Promise<void> {
    await this.childCheckbox(name).check();
  }

  /** Clears all child checkboxes, then checks only the given names. */
  async selectOnlyChildren(names: readonly string[]): Promise<void> {
    const boxes = this.root.getByRole('checkbox');
    const count = await boxes.count();
    for (let index = 0; index < count; index += 1) {
      await boxes.nth(index).uncheck();
    }
    for (const name of names) {
      await this.selectChild(name);
    }
  }

  /** Clears a child checkbox in the propose form. */
  async unselectChild(name: string): Promise<void> {
    await this.childCheckbox(name).uncheck();
  }

  /** Chooses a matched slot by its accessible name. */
  async selectMatchedSlot(name: string): Promise<void> {
    await this.matchedSlot(name).click();
  }

  /** Submits the playdate request. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
