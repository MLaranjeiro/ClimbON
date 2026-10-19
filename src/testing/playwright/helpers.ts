import { expect, test, type Page } from '@playwright/test';

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

let gymWithRoutesPath: string | null = null;

// Opens the overview of the first gym that has at least one active route, so browsing
// tests exercise real data instead of an empty gym. Skips the test if no gym has routes.
// The result is cached per worker, since walking the gym list is slow.
export async function openFirstGym(page: Page): Promise<string> {
  if (!gymWithRoutesPath) {
    await page.goto('/gyms');
    const cards = page.getByRole('main').locator('a[href^="/gyms/"]');
    await expect(cards.first()).toBeVisible();
    const paths = await cards.evaluateAll((links) => links.map((a) => a.getAttribute('href')!));

    for (const path of paths) {
      await page.goto(path);
      await page.getByRole('button', { name: 'List', exact: true }).click();
      await expect(page.getByText('Loading…')).toHaveCount(0);
      if ((await page.getByRole('list', { name: 'Climbs' }).getByRole('button').count()) > 0) {
        gymWithRoutesPath = path;
        break;
      }
    }
    test.skip(!gymWithRoutesPath, 'No gym has any active routes — add a route to run this test');
  }

  await page.goto(gymWithRoutesPath!);
  await expect(page.getByRole('searchbox', { name: 'Search climbs and walls' })).toBeVisible();
  return page.url();
}

// Logs in as the setter account and opens the admin dashboard, failing with a clear
// message (rather than a bare locator timeout) if that account has no gym role.
export async function openAdmin(page: Page) {
  await login(page, SETTER);
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Route Setter admin' }),
    `${SETTER.email} has no route_setter or gym_admin role, so /admin redirected away. Give it a role in ` +
      'Admin → Team, or set TEST_SETTER_EMAIL / TEST_SETTER_PASSWORD in .env.test.local.',
  ).toBeVisible();
}

export function uniqueName(prefix: string) {
  return `${prefix} ${Date.now().toString(36)}`;
}
