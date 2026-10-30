import { type Locator, expect } from '@playwright/test';

import { PlaydatesPage } from '../../pages/playdates.page';

/** Asserts Accept / Decline / cancel are absent on a Past or Pending row. */
export async function expectNoPendingActionsOnRow(
  playdates: PlaydatesPage,
  row: Locator,
): Promise<void> {
  await expect(playdates.acceptButtonIn(row)).toHaveCount(0);
  await expect(playdates.declineButtonIn(row)).toHaveCount(0);
  await expect(playdates.cancelButtonIn(row)).toHaveCount(0);
}

export async function expectNoCalendarExportOnRow(
  playdates: PlaydatesPage,
  row: Locator,
): Promise<void> {
  await expect(playdates.googleLinkIn(row)).toHaveCount(0);
  await expect(playdates.icsButtonIn(row)).toHaveCount(0);
}
