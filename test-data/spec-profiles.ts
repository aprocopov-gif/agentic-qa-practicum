import type { SpecFamilyProfile } from './factories/spec-family.factory';

/**
 * Per-spec autonomous family shapes (on shared login accounts).
 * Family X: one boy ~10y. Family Z: two girls ~10y and ~7y.
 */
export const SPEC_FAMILY_PROFILES: Record<string, SpecFamilyProfile> = {
  'aqpbt-8': {
    specKey: 'aqpbt-8',
    label: 'Family X (availability)',
    owner: 'main',
    children: [{ role: 'boy10', gender: 'boy', ageYears: 10 }],
  },
  'aqpbt-9': {
    specKey: 'aqpbt-9',
    label: 'Family Z (propose form)',
    owner: 'main',
    children: [
      { role: 'girl10', gender: 'girl', ageYears: 10 },
      { role: 'girl7', gender: 'girl', ageYears: 7 },
    ],
  },
  'aqpbt-10': {
    specKey: 'aqpbt-10',
    label: 'Family X (pending lists)',
    owner: 'main',
    children: [{ role: 'boy10', gender: 'boy', ageYears: 10 }],
  },
  'aqpbt-11': {
    specKey: 'aqpbt-11',
    label: 'Family Z (playdates lists)',
    owner: 'main',
    children: [
      { role: 'girl10', gender: 'girl', ageYears: 10 },
      { role: 'girl7', gender: 'girl', ageYears: 7 },
    ],
  },
  'aqpbt-12': {
    specKey: 'aqpbt-12',
    label: 'Family X (calendar export)',
    owner: 'main',
    children: [
      { role: 'boy10', gender: 'boy', ageYears: 10 },
      { role: 'girl7', gender: 'girl', ageYears: 7 },
    ],
  },
  'aqpbt-14': {
    specKey: 'aqpbt-14',
    label: 'Family X (friends)',
    owner: 'main',
    children: [{ role: 'boy10', gender: 'boy', ageYears: 10 }],
  },
};

export type SpecProfileKey = keyof typeof SPEC_FAMILY_PROFILES;

export function getSpecFamilyProfile(specKey: SpecProfileKey): SpecFamilyProfile {
  const profile = SPEC_FAMILY_PROFILES[specKey];
  if (!profile) {
    throw new Error(`No spec family profile registered for ${specKey}`);
  }
  return profile;
}
