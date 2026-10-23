import type { APIRequestContext } from '@playwright/test';

import { isAutomationPlaydateMarker } from './playdates-provision-cleanup';

interface PlaydateListItem {
  startsAt?: string;
  locationText: string | null;
  notes?: string | null;
}

function isAutomationRow(item: PlaydateListItem): boolean {
  const haystack = `${item.locationText ?? ''} ${item.notes ?? ''}`;
  return isAutomationPlaydateMarker(haystack);
}

/**
 * Picks start dates far enough ahead that new cancelled rows appear in the visible Past list
 * (newest-first), above stale automation playdates that cannot be deleted via API.
 */
export async function daysAheadBaseForVisiblePast(
  api: APIRequestContext,
  marginDays: number = 2,
  floorDays: number = 120,
): Promise<number> {
  const response = await api.get('/api/v1/playdates');
  if (!response.ok()) {
    return floorDays;
  }

  const list = (await response.json()) as PlaydateListItem[];
  let maxStartMs = Date.now();
  for (const item of list) {
    if (!isAutomationRow(item) || !item.startsAt) {
      continue;
    }
    maxStartMs = Math.max(maxStartMs, new Date(item.startsAt).getTime());
  }

  const daysUntilMax = Math.ceil((maxStartMs - Date.now()) / 86_400_000);
  return Math.max(floorDays, daysUntilMax + marginDays);
}
