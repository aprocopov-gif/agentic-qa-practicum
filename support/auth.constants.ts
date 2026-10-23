import path from 'node:path';

import type { RecordOwner } from './record-tracker';

export const AUTH_FILE = path.join('playwright', '.auth', 'user.json');
export const ALT_AUTH_FILE = path.join('playwright', '.auth', 'alt-user.json');
/** Family B gate — logged in, dashboard/playdates not set up (`APP_GATE_USER_*`). */
export const GATE_AUTH_FILE = path.join('playwright', '.auth', 'gate-user.json');

/** Playwright storage state path for main (`APP_USER_*`) or alt (`APP_ALT_*`) family. */
export function storageStatePathForOwner(owner: RecordOwner): string {
  return owner === 'main' ? AUTH_FILE : ALT_AUTH_FILE;
}

/** True when auth.setup can persist {@link GATE_AUTH_FILE} for Family B gate specs. */
export function isGateFamilyAuthConfigured(): boolean {
  return Boolean(process.env.APP_GATE_USER_EMAIL && process.env.APP_GATE_USER_PASSWORD);
}
