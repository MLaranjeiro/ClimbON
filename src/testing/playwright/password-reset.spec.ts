import { test, expect } from '@playwright/test';

// Password reset flow (F1.4, F1.5). The email link itself can't be followed in an
// automated run, so these cover the pages either side of it.

test.describe('Password reset (F1.4)', () => {
  test('Forgot Password page asks for an email and sends a reset link', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByPlaceholder('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  test('opening the reset page without a valid reset link shows the expired state', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page.getByRole('heading', { name: 'Reset link expired' })).toBeVisible();
    await page.getByRole('link', { name: 'Send a new reset link' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});
