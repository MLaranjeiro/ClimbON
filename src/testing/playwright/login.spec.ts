import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_EMAIL!;
const TEST_PASSWORD = process.env.TEST_PASSWORD!;

test.describe('Login (F1.2)', () => {
  test('valid credentials redirect to the dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/');
  });

  test('wrong password shows an error and stays on the login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByPlaceholder('Password').fill('DefinitelyWrongPassword1!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });

  test('empty submit is blocked by required fields', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Login' }).click();

    // Native HTML5 "required" validation blocks the request entirely —
    // still on the login page, no network call ever made.
    await expect(page).toHaveURL('/login');
    const emailValidationMessage = await page.getByPlaceholder('Email').evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(emailValidationMessage.length).toBeGreaterThan(0);
  });

  test('Forgot Password link navigates to the reset flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot Password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});
