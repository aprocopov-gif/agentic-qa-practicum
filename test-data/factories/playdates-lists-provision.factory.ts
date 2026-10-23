import { PlaydateCircleFamily, PlaydatePlaceOption } from '../playdates-propose.enums';
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

function buildCase(
  runId: string,
  roleSuffix: string,
  childName: string,
  daysAhead: number,
): PlaydatesListsProvisionCase {
  const locationToken = `${runId}-${roleSuffix}`;
  const locationNote = `${locationToken} park`;
  const manual = manualTimeDaysAhead(daysAhead);
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
      optionalNote: `Provision ${childName} for AQPBT-11`,
    },
  };
}

/** Unique cancelled Past rows for AQPBT-11 list tests. */
export function buildPlaydatesListsProvision(
  primaryChildName: string,
  secondaryChildName: string,
  runId: string = uniqueRunId(),
): PlaydatesListsProvisionBundle {
  return {
    runId,
    miaCase: buildCase(runId, 'primary', primaryChildName, 6),
    mariaCase: buildCase(runId, 'secondary', secondaryChildName, 5),
    playdateIds: [],
  };
}
