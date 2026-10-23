import { expect } from '@playwright/test';

import { altBaselineFamily } from '../test-data/baseline-alt-family';
import { birthYearForAge } from '../test-data/factories/spec-family.factory';
import { createChild, createFamily, getMe, getApiContext, updateFamily } from './api-client';
import type { RecordOwner } from './record-tracker';

type BaselineFamilyConfig = typeof altBaselineFamily;

function familyNeedsUpdate(
  family: NonNullable<Awaited<ReturnType<typeof getMe>>['family']>,
  config: BaselineFamilyConfig,
): boolean {
  return (
    family.name !== config.name ||
    (family.addressText ?? '') !== config.addressText ||
    family.addressVisibility !== config.addressVisibility
  );
}

/**
 * Ensures the alt login has family Bauchamps and the two baseline children (boy 5, girl 8).
 * Safe to run on every auth setup; skips create when data already matches.
 */
export async function ensureBaselineFamily(
  owner: RecordOwner,
  config: BaselineFamilyConfig = altBaselineFamily,
): Promise<void> {
  const api = await getApiContext(owner);
  let me = await getMe(api);

  if (!me.family) {
    const created = await createFamily(api, {
      name: config.name,
      addressText: config.addressText,
      addressVisibility: config.addressVisibility,
    });
    expect(created.ok, created.message).toBe(true);
    me = await getMe(api);
  } else if (familyNeedsUpdate(me.family, config)) {
    const updated = await updateFamily(api, {
      name: config.name,
      addressText: config.addressText,
      addressVisibility: config.addressVisibility,
    });
    expect(updated.ok, updated.message).toBe(true);
    me = await getMe(api);
  }

  expect(me.family, 'Family must exist after baseline setup').not.toBeNull();
  const existingChildren = me.family!.children ?? [];

  for (const blueprint of config.children) {
    const alreadyPresent = existingChildren.some((child) => child.firstName === blueprint.firstName);
    if (alreadyPresent) {
      continue;
    }

    const result = await createChild(api, {
      firstName: blueprint.firstName,
      birthYear: birthYearForAge(blueprint.ageYears),
      birthMonth: blueprint.birthMonth,
      avatarKey: blueprint.avatarKey,
      interests: [],
      gender: blueprint.gender,
    });
    expect(result.ok, result.message).toBe(true);
  }
}
