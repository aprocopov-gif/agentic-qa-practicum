import { type Locator, type Page } from '@playwright/test';

import {
  AvailabilityCopy,
  WEEKLY_DAY_SECTION_ORDER,
  type WeeklyDayAbbrev,
} from '../../test-data/availability.enums';

export class AvailabilityWeeklyFormComponent {
  readonly heading: Locator;
  readonly weekendAfternoonsButton: Locator;
  readonly addSlotButton: Locator;
  readonly day: Locator;
  readonly startTime: Locator;
  readonly endTime: Locator;
  readonly kid: Locator;
  readonly hosting: Locator;
  readonly notice: Locator;
  readonly removeButton: Locator;
  readonly submitButton: Locator;
  readonly validationMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: AvailabilityCopy.weeklyHeading, exact: true });
    this.weekendAfternoonsButton = page.getByRole('button', {
      name: AvailabilityCopy.weekendAfternoons,
      exact: true,
    });
    this.addSlotButton = page.getByRole('button', { name: '+ Add slot', exact: true });
    this.day = page.getByRole('combobox', { name: 'Day', exact: true });
    this.startTime = page.getByRole('textbox', { name: 'Start time', exact: true });
    this.endTime = page.getByRole('textbox', { name: 'End time', exact: true });
    this.kid = page.getByRole('combobox', { name: 'Kid', exact: true });
    this.hosting = page.getByRole('combobox', { name: 'Hosting', exact: true });
    this.notice = page.getByRole('combobox', { name: 'Notice', exact: true });
    this.removeButton = page.getByRole('button', { name: 'remove', exact: true });
    this.submitButton = page.getByRole('button', { name: AvailabilityCopy.saveAvailability, exact: true });
    this.validationMessage = page.getByText(AvailabilityCopy.invalidWeeklyTimes, { exact: true });
  }

  /** One day block in the weekly editor (Sun → Sat). */
  daySection(day: WeeklyDayAbbrev): Locator {
    const index = WEEKLY_DAY_SECTION_ORDER.indexOf(day);
    return this.page.locator('section').nth(index);
  }

  /** Start time field for the first slot on the given day. */
  startTimeForDay(day: WeeklyDayAbbrev): Locator {
    return this.daySection(day).getByRole('textbox', { name: 'Start time', exact: true }).first();
  }

  /** End time field for the first slot on the given day. */
  endTimeForDay(day: WeeklyDayAbbrev): Locator {
    return this.daySection(day).getByRole('textbox', { name: 'End time', exact: true }).first();
  }

  /** Applies the weekend-afternoons preset. */
  async applyWeekendAfternoons(): Promise<void> {
    await this.weekendAfternoonsButton.click();
  }

  /** Adds a weekly slot from the section header. */
  async addSlot(): Promise<void> {
    await this.addSlotButton.click();
  }

  /** Adds a slot within a specific day section. */
  async addSlotInDay(day: WeeklyDayAbbrev): Promise<void> {
    await this.daySection(day).getByRole('button', { name: 'add', exact: true }).click();
  }

  /** Sets start/end on the first slot row for a day. */
  async setDayWindow(day: WeeklyDayAbbrev, start: string, end: string): Promise<void> {
    await this.startTimeForDay(day).fill(start);
    await this.endTimeForDay(day).fill(end);
  }

  /** Saves weekly availability. */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
