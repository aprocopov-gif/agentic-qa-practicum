import { expect, type Browser } from '@playwright/test';

import { DashboardPage } from '../pages/dashboard.page';
import { CoParentJoinPage } from '../pages/co-parent-join.page';
import { PlaydateCircleFamily } from '../test-data/playdates-propose.enums';
import { AUTH_FILE, ALT_AUTH_FILE } from './auth.constants';
import { getApiContext, disposeApiContexts } from './api-client';

function joinTokenFromInviteText(text: string | null): string | undefined {
  return text?.match(/\/join\/([^/?]+)/)?.[1];
}

/**
 * Links alt Bauchamps to main (The Gorfels) via dashboard circle invite so `/playdates` has a family combobox.
 * Idempotent when the connection already exists.
 */
export async function ensureAltCircleLinkedToMain(browser: Browser): Promise<void> {
  const api = await getApiContext('alt');
  try {
    const connections = await api.get('/api/v1/connections');
    if (connections.ok()) {
      const list = (await connections.json()) as Array<{ family?: { name: string } }>;
      if (list.some((row) => row.family?.name === PlaydateCircleFamily.Gorfels)) {
        return;
      }
    }
  } finally {
    await disposeApiContexts();
  }

  const mainContext = await browser.newContext({ storageState: AUTH_FILE });
  const mainPage = await mainContext.newPage();
  const dashboard = new DashboardPage(mainPage);
  await dashboard.goto();
  await dashboard.openCircleInvite();
  const token = joinTokenFromInviteText(await dashboard.circleInvitePanel.inviteLink.textContent());
  expect(token, 'Main circle invite link must include /join/{token}').toBeTruthy();
  await mainContext.close();

  const altContext = await browser.newContext({ storageState: ALT_AUTH_FILE });
  const altPage = await altContext.newPage();
  const join = new CoParentJoinPage(altPage);
  await join.goto(token!);
  await join.accept();
  await expect
    .poll(async () => {
      const altApi = await getApiContext('alt');
      const response = await altApi.get('/api/v1/connections');
      if (!response.ok()) {
        return 0;
      }
      const list = (await response.json()) as Array<{ family?: { name: string } }>;
      return list.filter((row) => row.family?.name === PlaydateCircleFamily.Gorfels).length;
    })
    .toBeGreaterThan(0);
  await disposeApiContexts();
  await altContext.close();
}
