import { test, expect } from '@playwright/test';

test('flaky sample', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Missing' })).toBeVisible();
});
