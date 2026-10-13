import { faker } from '@faker-js/faker';

import { PlaydateCircleFamily, PlaydatePlaceOption } from '../playdates-propose.enums';

/** Observed copy and slot labels from AQPBT-9 / Confluence live exploration. */
export const playdatesProposeObserved = {
  heading: 'Find a playdate',
  intro:
    'Pick a family, choose a matched slot or propose a manual time, then wait for the other parent to approve.',
  proposePanelTitle: 'Propose',
  sendRequest: 'Send request',
  matchesBadge: '6 matches',
  childMia: 'Mia',
  childMaria: 'Maria',
  pendingEmptyCopy: 'No pending requests.',
  upcomingEmptyCopy: 'No upcoming playdates yet.',
  emptyCount: '0',
} as const;

/** How the proposer chooses date and time on `/playdates`. */
export type PlaydateProposalMode = 'matched' | 'manual';

/** Manual date/time fields (HTML `date` / `time` inputs on the propose form). */
export interface ManualPlaydateTime {
  /** `YYYY-MM-DD` (confirmed on live form). */
  date: string;
  /** 24-hour `HH:MM` (confirmed on live form). */
  startTime: string;
  /** 24-hour `HH:MM` (confirmed on live form). */
  endTime: string;
}

/** Payload for filling the propose playdate form before **Send request**. */
export interface PlaydateProposalPayload {
  circleFamilyName: PlaydateCircleFamily | string;
  mode: PlaydateProposalMode;
  /** Full accessible name of a matched slot button (required when `mode` is `matched`). */
  matchedSlotAccessibleName?: string;
  manual?: ManualPlaydateTime;
  place: PlaydatePlaceOption;
  /** Child checkbox labels (observed for Family A: Mia, Maria). */
  children: readonly string[];
  locationNote: string;
  optionalNote: string;
}

export type PlaydateProposalOverrides = Partial<PlaydateProposalPayload>;

const defaultChildren = ['Mia', 'Maria'] as const;

function uniqueSuffix(): string {
  return `${Date.now()}-${faker.string.alphanumeric(6)}`;
}

function buildUniqueManualTime(): ManualPlaydateTime {
  const dayOffset = (Number(Date.now()) % 28) + 1;
  const date = faker.date.soon({ days: dayOffset });
  const startHour = faker.number.int({ min: 9, max: 15 });
  const endHour = startHour + faker.number.int({ min: 1, max: 3 });
  return {
    date: date.toISOString().slice(0, 10),
    startTime: `${String(startHour).padStart(2, '0')}:00`,
    endTime: `${String(Math.min(endHour, 18)).padStart(2, '0')}:00`,
  };
}

/** Builds a unique manual playdate proposal with optional field overrides. */
export function buildManualPlaydateProposal(
  overrides: PlaydateProposalOverrides = {},
): PlaydateProposalPayload {
  const suffix = uniqueSuffix();
  return {
    circleFamilyName: PlaydateCircleFamily.Nguyens,
    mode: 'manual',
    manual: buildUniqueManualTime(),
    place: PlaydatePlaceOption.OutNeutral,
    children: [...defaultChildren],
    locationNote: `Park ${suffix}`,
    optionalNote: faker.lorem.sentence({ min: 3, max: 8 }),
    ...overrides,
  };
}

/** Builds a matched-slot playdate proposal; caller must supply a live slot accessible name. */
export function buildMatchedPlaydateProposal(
  matchedSlotAccessibleName: string,
  overrides: PlaydateProposalOverrides = {},
): PlaydateProposalPayload {
  const suffix = uniqueSuffix();
  return {
    circleFamilyName: PlaydateCircleFamily.Nguyens,
    mode: 'matched',
    matchedSlotAccessibleName,
    place: PlaydatePlaceOption.OutNeutral,
    children: [...defaultChildren],
    locationNote: `Matched slot note ${suffix}`,
    optionalNote: faker.lorem.sentence({ min: 3, max: 8 }),
    ...overrides,
  };
}

/** Builds either a manual or matched proposal based on `overrides.mode` (defaults to manual). */
export function buildPlaydateProposal(overrides: PlaydateProposalOverrides = {}): PlaydateProposalPayload {
  if (overrides.mode === 'matched') {
    if (!overrides.matchedSlotAccessibleName) {
      throw new Error('matchedSlotAccessibleName is required when mode is matched');
    }
    return buildMatchedPlaydateProposal(overrides.matchedSlotAccessibleName, overrides);
  }
  return buildManualPlaydateProposal(overrides);
}
