import { PlaydateCircleFamily, PlaydatePlaceOption } from '../playdates-propose.enums';
import type { PlaydateProposalPayload } from './propose-playdate.factory';

export interface PlaydatesCalendarProvisionCase {
  childName: string;
  locationToken: string;
  locationNote: string;
  proposal: PlaydateProposalPayload;
}

export interface PlaydatesCalendarProvisionBundle {
  runId: string;
  /** Recent cancelled Past row for calendar-action assertions. */
  primaryCase: PlaydatesCalendarProvisionCase;
  /** Cancelled row with a future start date (still listed under Past). */
  futureCancelledCase: PlaydatesCalendarProvisionCase;
  playdateIds: string[];
}

function uniqueRunId(): string {
  return `AQPBT12-${Date.now()}`;
}

function manualTimeDaysAhead(daysAhead: number): { date: string; startTime: string; endTime: string } {
  const start = new Date();
  start.setDate(start.getDate() + daysAhead);
  start.setHours(15, 0, 0, 0);
  const end = new Date(start);
  end.setHours(18, 0, 0, 0);
  const date = start.toISOString().slice(0, 10);
  return { date, startTime: '15:00', endTime: '18:00' };
}

function buildCase(
  runId: string,
  suffix: string,
  childName: string,
  manual: { date: string; startTime: string; endTime: string },
  optionalNote: string,
): PlaydatesCalendarProvisionCase {
  const locationToken = `${runId}-${suffix}`;
  const locationNote = `${locationToken} park`;
  return {
    childName,
    locationToken,
    locationNote,
    proposal: {
      circleFamilyName: PlaydateCircleFamily.Nguyens,
      mode: 'manual',
      manual,
      place: PlaydatePlaceOption.OutNeutral,
      children: [childName],
      locationNote,
      optionalNote,
    },
  };
}

/** Unique cancelled Past rows for AQPBT-12 calendar export tests. */
export function buildPlaydatesCalendarProvision(
  primaryChildName: string,
  futureChildName: string,
  runId: string = uniqueRunId(),
): PlaydatesCalendarProvisionBundle {
  return {
    runId,
    primaryCase: buildCase(
      runId,
      'primary',
      primaryChildName,
      manualTimeDaysAhead(90),
      'Provision primary row for AQPBT-12',
    ),
    futureCancelledCase: buildCase(
      runId,
      'future',
      futureChildName,
      manualTimeDaysAhead(91),
      'Provision future-dated cancelled row for AQPBT-12',
    ),
    playdateIds: [],
  };
}
