import { test, expect } from '@playwright/test';

test('bug reproduction', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('alert')).toHaveText('Server unavailable');
});
