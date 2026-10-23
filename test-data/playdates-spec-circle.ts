import { PlaydateCircleFamily } from './playdates-propose.enums';
import type { SpecProfileKey } from './spec-profiles';

/** Circle family on the propose form for each spec (from live `/playdates` connections). */
export const playdateCircleFamilyBySpec: Partial<Record<SpecProfileKey, PlaydateCircleFamily | string>> = {
  'aqpbt-11': PlaydateCircleFamily.Nguyens,
  /** Alt Bauchamps links to main (The Gorfels) in auth setup — not demo Nguyens. */
  'aqpbt-12': PlaydateCircleFamily.Gorfels,
};

export function playdateCircleFamilyForSpec(specKey: SpecProfileKey): string {
  return playdateCircleFamilyBySpec[specKey] ?? PlaydateCircleFamily.Nguyens;
}
