import type { CreateChildPayload } from '../../support/api-client';

/** Unique first name for a child row created in a test run. */
export function buildChildFirstName(suffix: string = String(Date.now())): string {
  return `Child-${suffix}`;
}

/** POST `/api/v1/children` body aligned with catalog **Write bodies observed**. */
export function buildChildCreatePayload(suffix: string = String(Date.now())): CreateChildPayload {
  return {
    firstName: buildChildFirstName(suffix),
    birthYear: 2018,
    birthMonth: 6,
    avatarKey: 'fox',
    interests: [],
  };
}

/** Display age for dashboard copy `{firstName}, {age} · …` (Toronto calendar). */
export function computeChildDisplayAge(
  birthYear: number,
  birthMonth: number,
  referenceDate: Date = new Date(),
): number {
  let age = referenceDate.getFullYear() - birthYear;
  if (referenceDate.getMonth() + 1 < birthMonth) {
    age -= 1;
  }
  return age;
}

/** Prefix of the dashboard child summary line (before gender); used with `DashboardPage.childSummaryLine`. */
export function buildChildDashboardRowText(
  firstName: string,
  birthYear: number,
  birthMonth: number,
  referenceDate: Date = new Date(),
): string {
  const age = computeChildDisplayAge(birthYear, birthMonth, referenceDate);
  return `${firstName}, ${age}`;
}
