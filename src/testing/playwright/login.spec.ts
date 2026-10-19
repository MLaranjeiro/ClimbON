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

  test('empty submit shows an on-page error instead of a browser popup', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toHaveText('Email and password are required.');
  });

  test('missing password names only the password field', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill(TEST_EMAIL);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toHaveText('Password is required.');
  });

  test('malformed email shows an on-page error', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('Email').fill('not-an-email');
    await page.getByPlaceholder('Password').fill('Password123!');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toHaveText('Enter a valid email address.');
  });

  test('Forgot Password link navigates to the reset flow', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Forgot Password?' }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});
