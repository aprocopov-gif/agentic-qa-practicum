import { type Browser, type BrowserContext } from '@playwright/test';

import { GATE_AUTH_FILE, isGateFamilyAuthConfigured } from './auth.constants';

export { isGateFamilyAuthConfigured };

export const GATE_FAMILY_SKIP_REASON =
  'APP_GATE_USER_EMAIL and APP_GATE_USER_PASSWORD must be set for Family B gate tests';

/** Browser context for Family B (playdate gate, no set-up dashboard). */
export async function newGateFamilyContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({ storageState: GATE_AUTH_FILE });
}
