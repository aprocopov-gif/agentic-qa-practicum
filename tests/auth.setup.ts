import fs from 'node:fs';
import path from 'node:path';

import { test as setup, expect, type Page, type TestInfo } from '@playwright/test';

import { LoginPage } from '../pages';
import { AUTH_FILE, ALT_AUTH_FILE, GATE_AUTH_FILE, isGateFamilyAuthConfigured } from '../support/auth.constants';
import { ensureBaselineFamily } from '../support/baseline-family-setup';
import { disposeApiContexts } from '../support/api-client';
import { ensureAltCircleLinkedToMain } from '../support/alt-circle-link-setup';
import { AppRoute } from '../test-data/routes';

const postLoginUrl = new RegExp(`${AppRoute.Dashboard.replace('/', '\\/')}(\\/|\\?|$)`);
const loginUrl = new RegExp(`${AppRoute.Login.replace('/', '\\/')}(\\/|\\?|$)`);

async function loginAndSaveStorageState(
  page: Page,
  email: string,
  password: string,
  authFile: string,
): Promise<void> {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.fillEmail(email);
  await loginPage.fillPassword(password);
  await loginPage.submit();

  await expect(page).toHaveURL(postLoginUrl);
  await expect(page).not.toHaveURL(loginUrl);

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
}

setup('authenticate main family', async ({ page }) => {
  const email = process.env.APP_USER_EMAIL;
  const password = process.env.APP_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('APP_USER_EMAIL and APP_USER_PASSWORD must be set for main-family auth');
  }

  await loginAndSaveStorageState(page, email, password, AUTH_FILE);
});

setup('authenticate second family', async ({ page }, testInfo) => {
  const email = process.env.APP_ALT_USER_EMAIL;
  const password = process.env.APP_ALT_USER_PASSWORD;
  if (!email || !password) {
    testInfo.skip(true, 'APP_ALT_USER_EMAIL and APP_ALT_USER_PASSWORD must be set for second-family auth');
    return;
  }

  await loginAndSaveStorageState(page, email, password, ALT_AUTH_FILE);
});

setup('authenticate Family B gate user', async ({ page }, testInfo) => {
  if (!isGateFamilyAuthConfigured()) {
    testInfo.skip(true, 'APP_GATE_USER_EMAIL and APP_GATE_USER_PASSWORD must be set');
    return;
  }

  const gateEmail = process.env.APP_GATE_USER_EMAIL;
  const gatePassword = process.env.APP_GATE_USER_PASSWORD;
  if (!gateEmail || !gatePassword) {
    testInfo.skip(true, 'APP_GATE_USER_EMAIL and APP_GATE_USER_PASSWORD must be set');
    return;
  }

  if (gateEmail === process.env.APP_ALT_USER_EMAIL || gateEmail === process.env.APP_USER_EMAIL) {
    testInfo.skip(true, 'APP_GATE_USER_EMAIL must be a third login (not APP_USER_EMAIL or APP_ALT_USER_EMAIL)');
    return;
  }

  await loginAndSaveStorageState(page, gateEmail, gatePassword, GATE_AUTH_FILE);
});

setup('ensure alt baseline family Bauchamps', async ({}, testInfo) => {
  if (!process.env.APP_ALT_USER_EMAIL || !process.env.APP_ALT_USER_PASSWORD) {
    testInfo.skip(true, 'APP_ALT_USER_EMAIL and APP_ALT_USER_PASSWORD must be set for alt baseline family setup');
    return;
  }

  try {
    await ensureBaselineFamily('alt');
  } finally {
    await disposeApiContexts();
  }
});

setup('link alt circle to main (The Gorfels)', async ({ browser }, testInfo) => {
  if (!process.env.APP_ALT_USER_EMAIL || !process.env.APP_ALT_USER_PASSWORD) {
    testInfo.skip(true, 'APP_ALT_USER_EMAIL and APP_ALT_USER_PASSWORD must be set for alt circle link');
    return;
  }

  await ensureAltCircleLinkedToMain(browser);
});
