import { expect, type APIRequestContext } from '@playwright/test';

import {
  birthYearForAge,
  buildSpecChildFirstName,
  buildSpecFamilyRunId,
  type SpecChildRecord,
  type SpecFamilyState,
} from '../test-data/factories/spec-family.factory';
import { getSpecFamilyProfile, type SpecProfileKey } from '../test-data/spec-profiles';
import { createChild, deleteChild, getApiContext } from './api-client';
import { trackRecord, untrackRecord } from './record-tracker';

export const SPEC_TEST_DATA_NOT_READY = 'Test data is not ready';
export const SPEC_FAMILY_READINESS_TIMEOUT_MS = 15_000;

const activeBySpec = new Map<string, SpecFamilyState>();

export function getSpecFamilyState(specKey: SpecProfileKey): SpecFamilyState {
  const state = activeBySpec.get(specKey);
  if (!state) {
    throw new Error(`Spec family ${specKey} has not been provisioned yet`);
  }
  return state;
}

export function getSpecChildByRole(specKey: SpecProfileKey, role: string): SpecChildRecord {
  const state = getSpecFamilyState(specKey);
  const child = state.children.find((entry) => entry.role === role);
  if (!child) {
    throw new Error(`Spec ${specKey} has no child role ${role}`);
  }
  return child;
}

async function fetchMeChildren(api: APIRequestContext): Promise<Array<{ id: string; firstName: string }>> {
  const response = await api.get('/api/v1/me');
  if (!response.ok()) {
    return [];
  }
  const body = (await response.json()) as { family?: { children?: Array<{ id: string; firstName: string }> } };
  return body.family?.children ?? [];
}

function collectChildIssues(
  meChildren: Array<{ id: string; firstName: string }>,
  state: SpecFamilyState,
): string[] {
  const issues: string[] = [];
  for (const expected of state.children) {
    const row = meChildren.find((child) => child.id === expected.id || child.firstName === expected.firstName);
    if (!row) {
      issues.push(`Missing child ${expected.firstName} (${expected.role}).`);
    }
  }
  return issues;
}

export type SpecFamilyReadiness =
  | { ready: true; state: SpecFamilyState }
  | { ready: false; reportComment: string };

export async function getSpecFamilyReadiness(specKey: SpecProfileKey): Promise<SpecFamilyReadiness> {
  const state = activeBySpec.get(specKey);
  if (!state) {
    return {
      ready: false,
      reportComment: `${SPEC_TEST_DATA_NOT_READY}: ${specKey} family children were not provisioned.`,
    };
  }

  const api = await getApiContext(state.owner);
  const meChildren = await fetchMeChildren(api);
  const issues = collectChildIssues(meChildren, state);
  if (issues.length > 0) {
    return {
      ready: false,
      reportComment: `${SPEC_TEST_DATA_NOT_READY}: ${issues.join(' ')}`,
    };
  }

  return { ready: true, state };
}

export async function waitForSpecFamilyReadiness(
  specKey: SpecProfileKey,
  timeoutMs: number = SPEC_FAMILY_READINESS_TIMEOUT_MS,
): Promise<SpecFamilyReadiness> {
  const profile = getSpecFamilyProfile(specKey);
  if (profile.children.length === 0) {
    return { ready: true, state: { specKey, runId: 'none', label: profile.label, owner: profile.owner, children: [] } };
  }

  if (!activeBySpec.get(specKey)) {
    return {
      ready: false,
      reportComment: `${SPEC_TEST_DATA_NOT_READY}: ${specKey} family children were not provisioned.`,
    };
  }

  let lastReadiness: SpecFamilyReadiness = {
    ready: false,
    reportComment: `${SPEC_TEST_DATA_NOT_READY}: ${specKey} children not yet visible in the application.`,
  };

  try {
    await expect(async () => {
      lastReadiness = await getSpecFamilyReadiness(specKey);
      expect(lastReadiness.ready, lastReadiness.reportComment).toBe(true);
    }).toPass({ timeout: timeoutMs });
  } catch {
    if (lastReadiness.ready) {
      return lastReadiness;
    }
    const waitedSeconds = Math.round(timeoutMs / 1000);
    return {
      ready: false,
      reportComment: `${lastReadiness.reportComment} Waited ${waitedSeconds}s for application test data; skipping test.`,
    };
  }

  return lastReadiness;
}

/** Creates profile children for one spec via API and stores state for tests. */
export async function provisionSpecFamily(specKey: SpecProfileKey): Promise<SpecFamilyState> {
  const profile = getSpecFamilyProfile(specKey);
  const runId = buildSpecFamilyRunId(specKey);
  const api = await getApiContext(profile.owner);
  const created: SpecChildRecord[] = [];

  for (const blueprint of profile.children) {
    const firstName = buildSpecChildFirstName(specKey, blueprint.role, runId);
    const result = await createChild(api, {
      firstName,
      birthYear: birthYearForAge(blueprint.ageYears),
      birthMonth: blueprint.birthMonth ?? 6,
      avatarKey: blueprint.avatarKey ?? 'fox',
      interests: [],
      gender: blueprint.gender,
    });
    expect(result.ok, result.message).toBe(true);
    trackRecord({ type: 'child', id: result.id, owner: profile.owner });
    created.push({
      role: blueprint.role,
      id: result.id,
      firstName: result.firstName,
      gender: blueprint.gender,
      ageYears: blueprint.ageYears,
    });
  }

  const state: SpecFamilyState = {
    specKey,
    runId,
    label: profile.label,
    owner: profile.owner,
    children: created,
  };
  activeBySpec.set(specKey, state);

  const readiness = await getSpecFamilyReadiness(specKey);
  expect(readiness.ready, readiness.ready ? '' : readiness.reportComment).toBe(true);
  return state;
}

export async function teardownSpecFamily(specKey: SpecProfileKey): Promise<void> {
  const state = activeBySpec.get(specKey);
  if (!state) {
    return;
  }
  const api = await getApiContext(state.owner);
  for (const child of state.children) {
    const result = await deleteChild(api, child.id);
    if (result.ok) {
      untrackRecord({ type: 'child', id: child.id });
    }
  }
  activeBySpec.delete(specKey);
}
