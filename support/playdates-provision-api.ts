import { expect, type APIRequestContext } from '@playwright/test';

import type { ManualPlaydateTime } from '../test-data/factories/propose-playdate.factory';
import { cancelPlaydate, createPlaydate, getMe } from './api-client';
import type { RecordOwner } from './record-tracker';
import { trackRecord } from './record-tracker';

interface ConnectionRow {
  family?: { id: string; name: string };
}

export function manualTimeToIsoRange(manual: ManualPlaydateTime): { startsAt: string; endsAt: string } {
  const [year, month, day] = manual.date.split('-').map(Number);
  const [startHour, startMinute] = manual.startTime.split(':').map(Number);
  const [endHour, endMinute] = manual.endTime.split(':').map(Number);
  const start = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
  const end = new Date(year, month - 1, day, endHour, endMinute, 0, 0);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}

export async function resolveInviteeFamilyId(
  api: APIRequestContext,
  circleFamilyName: string,
): Promise<string | undefined> {
  const response = await api.get('/api/v1/connections');
  if (!response.ok()) {
    return undefined;
  }
  const list = (await response.json()) as ConnectionRow[];
  return list.find((row) => row.family?.name === circleFamilyName)?.family?.id;
}

export async function createCancelledPastPlaydateViaApi(
  api: APIRequestContext,
  owner: RecordOwner,
  input: {
    circleFamilyName: string;
    manual: ManualPlaydateTime;
    locationText: string;
    notes: string;
    childFirstName: string;
  },
): Promise<string> {
  const inviteeFamilyId = await resolveInviteeFamilyId(api, input.circleFamilyName);
  expect(
    inviteeFamilyId,
    `No connection to ${input.circleFamilyName}; run auth setup circle link for alt or use main family.`,
  ).toBeTruthy();

  const me = await getMe(api);
  const child = me.family?.children?.find((row) => row.firstName === input.childFirstName);
  expect(child, `Child ${input.childFirstName} missing on /api/v1/me`).toBeTruthy();
  expect(child!.id, `Child ${input.childFirstName} missing id on /api/v1/me`).toBeTruthy();

  const { startsAt, endsAt } = manualTimeToIsoRange(input.manual);
  const created = await createPlaydate(api, {
    inviteeFamilyId: inviteeFamilyId!,
    startsAt,
    endsAt,
    locationKind: 'out',
    hostFamilyId: null,
    locationText: input.locationText,
    childIds: [child!.id!],
    notes: input.notes,
  });
  expect(created.ok, created.message).toBe(true);

  const cancelResult = await cancelPlaydate(api, created.id);
  expect(cancelResult.ok, cancelResult.message).toBe(true);

  trackRecord({ type: 'playdate', id: created.id, owner });
  return created.id;
}
