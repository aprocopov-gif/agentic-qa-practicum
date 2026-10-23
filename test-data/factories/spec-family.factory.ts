/** Blueprint for one child created via POST /api/v1/children. */
export interface SpecChildBlueprint {
  /** Stable key within the spec profile (e.g. boy10, girl7). */
  role: string;
  gender: 'boy' | 'girl';
  ageYears: number;
  birthMonth?: number;
  avatarKey?: string;
}

/** Autonomous family data for one spec file (logical Family X / Family Z on the main or alt account). */
export type SpecFamilyOwner = 'main' | 'alt';

export interface SpecFamilyProfile {
  specKey: string;
  label: string;
  owner: SpecFamilyOwner;
  children: readonly SpecChildBlueprint[];
}

export interface SpecChildRecord {
  role: string;
  id: string;
  firstName: string;
  gender: 'boy' | 'girl';
  ageYears: number;
}

export interface SpecFamilyState {
  specKey: string;
  runId: string;
  label: string;
  owner: SpecFamilyOwner;
  children: SpecChildRecord[];
}

export function birthYearForAge(ageYears: number, referenceDate: Date = new Date()): number {
  return referenceDate.getFullYear() - ageYears;
}

/** Unique first name for a provisioned child in this spec run. */
export function buildSpecChildFirstName(specKey: string, role: string, runId: string): string {
  const token = specKey.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const runSuffix = runId.split('-').pop() ?? runId;
  return `${token}-${role}-${runSuffix}`;
}

export function buildSpecFamilyRunId(specKey: string): string {
  return `${specKey}-${Date.now()}`;
}
