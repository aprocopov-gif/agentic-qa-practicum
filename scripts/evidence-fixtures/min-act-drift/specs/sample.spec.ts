import { test, expect } from '@playwright/test';

test('sample test', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Missing' })).toBeVisible();
});
