import { test, expect } from '@playwright/test';
import { CLIMBER, login, openAdmin, openFirstGym, uniqueName } from './helpers';

// Security testing for the deployed front end (N1). Covers XSS (N1.2), SQL injection
// through the search UI (N1.1), access control on protected routes, and session
// handling on logout (N1.4). The database-side checks (RLS, PostgREST injection,
// tampered tokens) live in the Postman collection.

const XSS_PAYLOAD = '<img src=x onerror="window.__xss=1">';
const SQLI_PAYLOAD = "' OR 1=1 --";

test.describe('Deployment hardening', () => {
  test('deployed site sends security headers and serves deep links', async ({ request }) => {
    test.skip(!process.env.BASE_URL, 'Headers come from vercel.json — run with BASE_URL set to the deployment');

    const res = await request.get('/gyms/some-deep-link');
    expect(res.status()).toBe(200);
    const headers = res.headers();
    expect(headers['content-security-policy']).toContain("script-src 'self'");
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
});

test.describe('Access control', () => {
  for (const path of ['/', '/admin', '/account', '/gyms', '/platform/gyms']) {
    test(`unauthenticated visit to ${path} redirects to login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL('/login');
    });
  }

  test('a climber without a gym role cannot open the admin dashboard', async ({ page }) => {
    test.skip(
      !process.env.TEST_SETTER_EMAIL,
      'Set TEST_SETTER_EMAIL so TEST_EMAIL can be used as a plain climber account',
    );
    await login(page, CLIMBER);
    await page.goto('/admin');
    await expect(page).not.toHaveURL('/admin');
    await expect(page.getByRole('heading', { name: 'Route Setter admin' })).toHaveCount(0);
  });
});

test.describe('Session management (N1.4)', () => {
  test('logging out clears the stored session and blocks protected pages', async ({ page }) => {
    await login(page);
    const tokenKey = await page.evaluate(() => Object.keys(localStorage).find((k) => k.includes('auth-token')));
    expect(tokenKey).toBeTruthy();

    await page.locator('header button[aria-haspopup="menu"]').click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL('/login');

    expect(await page.evaluate((k) => localStorage.getItem(k!), tokenKey)).toBeNull();
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('session token is not exposed in the URL or cookies', async ({ page, context }) => {
    await login(page);
    expect(page.url()).not.toMatch(/access_token|refresh_token/);
    const cookies = await context.cookies();
    expect(cookies.some((c) => /access_token|sb-.*-auth-token/.test(c.name))).toBe(false);
  });
});

test.describe('Injection through search inputs (N1.1, N1.2)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('SQL injection payload in gym search is treated as plain text', async ({ page }) => {
    await page.goto('/gyms');
    await page.getByRole('searchbox', { name: 'Search gyms by name or location' }).fill(SQLI_PAYLOAD);
    await expect(page.getByText(`No gyms match "${SQLI_PAYLOAD}".`)).toBeVisible();
  });

  test('SQL injection payload in route search returns no routes', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('searchbox', { name: 'Search climbs and walls' }).fill(SQLI_PAYLOAD);
    await expect(page.getByText(`No climbs or walls match "${SQLI_PAYLOAD}".`)).toBeVisible();
  });

  test('XSS payload in search is rendered as text, not executed', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('searchbox', { name: 'Search climbs and walls' }).fill(XSS_PAYLOAD);
    await expect(page.getByText(XSS_PAYLOAD, { exact: false })).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
    await expect(page.locator('main img[src="x"]')).toHaveCount(0);
  });
});

test.describe('Stored XSS through the route form (N1.2)', () => {
  test('a script payload saved as a route name is escaped everywhere it is shown', async ({ page }) => {
    const name = `${uniqueName('PW XSS')} ${XSS_PAYLOAD}`;
    let dialogFired = false;

    await openAdmin(page);
    await page.getByRole('button', { name: 'Add route' }).click();
    const form = page.getByRole('dialog', { name: 'Add New Route' });
    await form.getByLabel('Route Name').fill(name);
    await form.getByRole('button', { name: 'Save Route' }).click();
    await expect(form).toBeHidden();

    // Only the confirm() from deleting the route should ever open a dialog.
    page.on('dialog', (d) => {
      if (d.type() !== 'confirm') dialogFired = true;
      d.accept();
    });

    const row = page.getByRole('row').filter({ hasText: name });
    await expect(row).toBeVisible();
    await expect(page.locator('main img[src="x"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();

    await row.getByRole('button', { name: 'Delete route' }).click();
    await expect(row).toHaveCount(0);
    expect(dialogFired).toBe(false);
  });
});
