import { PlaydatePlaceOption } from '../playdates-propose.enums';
import type { PlaydateProposalPayload } from './propose-playdate.factory';

export interface PlaydatesListsProvisionCase {
  childName: string;
  locationToken: string;
  locationNote: string;
  proposal: PlaydateProposalPayload;
}

export interface PlaydatesListsProvisionBundle {
  runId: string;
  miaCase: PlaydatesListsProvisionCase;
  mariaCase: PlaydatesListsProvisionCase;
  playdateIds: string[];
}

function uniqueRunId(): string {
  return `AQPBT11-${Date.now()}`;
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

/** Unique cancelled Past rows for AQPBT-11 list tests. */
export function buildPlaydatesListsProvision(
  primaryChildName: string,
  secondaryChildName: string,
  circleFamilyName: string,
  primaryDaysAhead: number,
  secondaryDaysAhead: number,
  runId: string = uniqueRunId(),
): PlaydatesListsProvisionBundle {
  return {
    runId,
    miaCase: buildCase(runId, 'primary', primaryChildName, primaryDaysAhead, circleFamilyName),
    mariaCase: buildCase(runId, 'secondary', secondaryChildName, secondaryDaysAhead, circleFamilyName),
    playdateIds: [],
  };
}

function buildCase(
  runId: string,
  roleSuffix: string,
  childName: string,
  daysAhead: number,
  circleFamilyName: string,
): PlaydatesListsProvisionCase {
  const locationToken = `${runId}-${roleSuffix}`;
  const locationNote = `${locationToken} park`;
  const manual = manualTimeDaysAhead(daysAhead);
  return {
    childName,
    locationToken,
    locationNote,
    proposal: {
      circleFamilyName,
      mode: 'manual',
      manual,
      place: PlaydatePlaceOption.OutNeutral,
      children: [childName],
      locationNote,
      optionalNote: `Provision ${childName} for AQPBT-11`,
    },
  };
}
