import { PlaydateCircleFamily, PlaydatePlaceOption } from '../playdates-propose.enums';
import type { PlaydateProposalPayload } from './propose-playdate.factory';

export interface PlaydatesPendingProvisionCase {
  childName: string;
  locationToken: string;
  locationNote: string;
  proposal: PlaydateProposalPayload;
}

export interface PlaydatesPendingProvisionBundle {
  runId: string;
  cancelledCase: PlaydatesPendingProvisionCase;
  playdateIds: string[];
}

function uniqueRunId(): string {
  return `AQPBT10-${Date.now()}`;
}

function manualTimeHoursAgo(hoursAgo: number): { date: string; startTime: string; endTime: string } {
  const start = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const date = start.toISOString().slice(0, 10);
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  return { date, startTime, endTime };
}

/** One cancelled Past row for AQPBT-10 pending-list tests. */
export function buildPlaydatesPendingProvision(
  childName: string,
  runId: string = uniqueRunId(),
): PlaydatesPendingProvisionBundle {
  const locationToken = `${runId}-cancelled`;
  const locationNote = `${locationToken} park`;
  const manual = manualTimeHoursAgo(2);
  return {
    runId,
    cancelledCase: {
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
        optionalNote: 'Provision cancelled Past row for AQPBT-10',
      },
    },
    playdateIds: [],
  };
}
