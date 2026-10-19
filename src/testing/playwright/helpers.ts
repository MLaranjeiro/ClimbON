import { expect, type Page } from '@playwright/test';

export const CLIMBER = {
  email: process.env.TEST_EMAIL!,
  password: process.env.TEST_PASSWORD!,
};

// Route setter tests need an account with a gym_memberships row (or a platform admin).
// Falls back to the main test account if no separate setter account is configured.
export const SETTER = {
  email: process.env.TEST_SETTER_EMAIL ?? process.env.TEST_EMAIL!,
  password: process.env.TEST_SETTER_PASSWORD ?? process.env.TEST_PASSWORD!,
};

export async function login(page: Page, account: { email: string; password: string } = CLIMBER) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill(account.email);
  await page.getByPlaceholder('Password').fill(account.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL('/');
}

// Opens the first gym card on the gym picker and returns its overview URL.
export async function openFirstGym(page: Page): Promise<string> {
  await page.goto('/gyms');
  const firstGym = page.getByRole('main').locator('a[href^="/gyms/"]').first();
  await expect(firstGym).toBeVisible();
  await firstGym.click();
  await expect(page.getByRole('searchbox', { name: 'Search climbs and walls' })).toBeVisible();
  return page.url();
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}
