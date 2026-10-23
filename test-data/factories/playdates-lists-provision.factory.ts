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

function manualTimeHoursAgo(hoursAgo: number): { date: string; startTime: string; endTime: string } {
  const start = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const date = start.toISOString().slice(0, 10);
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  return { date, startTime, endTime };
}

function buildCase(
  runId: string,
  roleSuffix: string,
  childName: string,
  hoursAgo: number,
): PlaydatesListsProvisionCase {
  const locationToken = `${runId}-${roleSuffix}`;
  const locationNote = `${locationToken} park`;
  const manual = manualTimeHoursAgo(hoursAgo);
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
    miaCase: buildCase(runId, 'primary', primaryChildName, 2),
    mariaCase: buildCase(runId, 'secondary', secondaryChildName, 4),
    playdateIds: [],
  };
}
