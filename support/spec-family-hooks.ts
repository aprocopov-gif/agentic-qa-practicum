import { test } from '../fixtures/cleanup.fixture';
import type { SpecProfileKey } from '../test-data/spec-profiles';
import {
  getSpecFamilyReadiness,
  provisionSpecFamily,
  teardownSpecFamily,
  waitForSpecFamilyReadiness,
} from './spec-family-provision';

/**
 * Registers beforeAll / beforeEach / afterAll for autonomous spec-family children.
 * beforeEach skips with a report note when data is missing after the readiness timeout.
 */
export function installSpecFamilyProvisioning(specKey: SpecProfileKey): void {
  test.beforeAll(async () => {
    try {
      await provisionSpecFamily(specKey);
    } catch (error) {
      console.warn(`${specKey} spec-family provision failed; dependent tests will be skipped:`, error);
    }
  });

  test.beforeEach(async ({}, testInfo) => {
    const readiness = await waitForSpecFamilyReadiness(specKey);
    if (!readiness.ready) {
      testInfo.annotations.push({ type: 'note', description: readiness.reportComment });
      test.skip(true, readiness.reportComment);
    }
  });

  test.afterAll(async () => {
    try {
      const readiness = await getSpecFamilyReadiness(specKey);
      if (readiness.ready) {
        await teardownSpecFamily(specKey);
      }
    } catch {
      await teardownSpecFamily(specKey);
    }
  });
}
