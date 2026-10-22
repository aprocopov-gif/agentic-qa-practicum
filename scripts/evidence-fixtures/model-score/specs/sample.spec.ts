import { test, expect } from '@playwright/test';

test('model score sample', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Missing' })).toBeVisible();
});
