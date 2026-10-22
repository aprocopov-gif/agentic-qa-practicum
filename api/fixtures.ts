import { type APIRequestContext, request } from '@playwright/test';

import { test as cleanupTest } from '../fixtures/cleanup.fixture';
import { createApiContextForOwner } from '../support/api-client';

type ApiFixtures = {
  mainApi: APIRequestContext;
  altApi: APIRequestContext;
  unauthenticatedApi: APIRequestContext;
};

function requireAppUrl(): string {
  const baseURL = process.env.APP_URL;
  if (!baseURL) {
    throw new Error('APP_URL must be set for API tests');
  }
  return baseURL;
}

export const test = cleanupTest.extend<ApiFixtures>({
  mainApi: async ({}, use) => {
    const apiContext = await createApiContextForOwner('main');
    await use(apiContext);
  },

  altApi: async ({}, use) => {
    const apiContext = await createApiContextForOwner('alt');
    await use(apiContext);
  },

  unauthenticatedApi: async ({}, use) => {
    const apiContext = await request.newContext({ baseURL: requireAppUrl() });
    await use(apiContext);
    await apiContext.dispose();
  },
});

export { expect, trackRecord } from '../fixtures/cleanup.fixture';
