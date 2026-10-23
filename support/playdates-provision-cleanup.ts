import type { APIRequestContext } from '@playwright/test';

import { cancelPlaydate } from './api-client';

const AUTOMATION_PLAYDATE_MARKERS = ['AQPBT10-', 'AQPBT11-', 'AQPBT12-'] as const;

interface PlaydateListItem {
  id: string;
  status: string;
  locationText: string | null;
  notes?: string | null;
}

function isAutomationPlaydate(item: PlaydateListItem): boolean {
  const haystack = `${item.locationText ?? ''} ${item.notes ?? ''}`;
  return AUTOMATION_PLAYDATE_MARKERS.some((marker) => haystack.includes(marker));
}

/** Cancels non-cancelled automation playdates so provisioning is not blocked by stale Pending rows. */
export async function cancelOpenAutomationPlaydates(api: APIRequestContext): Promise<void> {
  const response = await api.get('/api/v1/playdates');
  if (!response.ok()) {
    return;
  }

  const list = (await response.json()) as PlaydateListItem[];
  for (const item of list) {
    if (!isAutomationPlaydate(item) || item.status === 'cancelled') {
      continue;
    }
    await cancelPlaydate(api, item.id);
  }
}
