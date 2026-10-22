import { test, expect } from '@playwright/test';

test('missing rerun', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Missing' })).toBeVisible();
});
