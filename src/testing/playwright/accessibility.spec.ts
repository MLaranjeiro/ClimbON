import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { login, openAdmin, openFirstGym } from './helpers';

// Accessibility testing for search UI and navigation (N3). Each scan runs axe-core's
// WCAG 2.1 A + AA rule set, which includes 1.4.3 Contrast (Minimum) and the name/role/
// value rules that make state available without relying on colour (1.4.1).

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const summary = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(' ')),
  }));
  expect(summary).toEqual([]);
}

test.describe('Accessibility — public pages', () => {
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    test(`${path} has no WCAG 2.1 AA violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('link').first()).toBeVisible();
      await expectNoViolations(page);
    });
  }
});

test.describe('Accessibility — search UI (F7) and navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('dashboard and main navigation', async ({ page }) => {
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Gyms', exact: true })).toBeVisible();
    await expectNoViolations(page);
  });

  test('gym picker search, including the no-results state', async ({ page }) => {
    await page.goto('/gyms');
    const search = page.getByRole('searchbox', { name: 'Search gyms by name or location' });
    await expect(search).toBeVisible();
    await expectNoViolations(page);

    await search.fill('zzzz-no-such-gym');
    await expect(page.getByText(/No gyms match/)).toBeVisible();
    await expectNoViolations(page);
  });

  test('gym overview wall directory', async ({ page }) => {
    await openFirstGym(page);
    await expectNoViolations(page);
  });

  test('filters panel open with an active grade filter', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'Filters' }).click();
    const panel = page.getByRole('region', { name: 'Route filters' });
    await expect(panel).toBeVisible();
    await panel.getByRole('button', { name: 'V3', exact: true }).click();
    await expectNoViolations(page);
  });

  test('route list view with sort controls', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await expect(page.getByLabel('Sort by')).toBeVisible();
    await expectNoViolations(page);
  });

  test('route detail modal opened from the list', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    const firstRoute = page.getByRole('list', { name: 'Climbs' }).getByRole('button').first();
    test.skip((await firstRoute.count()) === 0, 'Gym has no active routes to open');
    await firstRoute.click();
    await expect(page.getByRole('dialog', { name: 'Route details' })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe('Accessibility — keyboard and non-colour state (N3.2)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('main navigation is reachable with the keyboard', async ({ page }) => {
    const dashboardLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard' });
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      if (await dashboardLink.evaluate((el) => el === document.activeElement)) break;
    }
    await expect(dashboardLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Gyms', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/gyms');
  });

  test('filters can be opened and toggled from the keyboard, with state exposed via aria-pressed', async ({
    page,
  }) => {
    await openFirstGym(page);
    const filtersButton = page.getByRole('button', { name: 'Filters' });

    await page.getByRole('searchbox', { name: 'Search climbs and walls' }).focus();
    await page.keyboard.press('Tab');
    await expect(filtersButton).toBeFocused();
    await expect(filtersButton).toHaveAttribute('aria-expanded', 'false');

    await page.keyboard.press('Enter');
    await expect(filtersButton).toHaveAttribute('aria-expanded', 'true');

    const v0 = page.getByRole('region', { name: 'Route filters' }).getByRole('button', { name: 'V0', exact: true });
    await expect(v0).toHaveAttribute('aria-pressed', 'false');
    await page.keyboard.press('Tab');
    await expect(v0).toBeFocused();
    await page.keyboard.press('Space');
    await expect(v0).toHaveAttribute('aria-pressed', 'true');
    // The active filter count is announced as text, not only as a coloured dot.
    await expect(filtersButton).toContainText('1 active');
  });

  test('layout toggle exposes the selected view without relying on colour', async ({ page }) => {
    await openFirstGym(page);
    const walls = page.getByRole('button', { name: 'Walls', exact: true });
    const list = page.getByRole('button', { name: 'List', exact: true });
    await expect(walls).toHaveAttribute('aria-pressed', 'true');
    await list.click();
    await expect(list).toHaveAttribute('aria-pressed', 'true');
    await expect(walls).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('heading', { name: 'All climbs' })).toBeVisible();
  });
});

test.describe('Accessibility — route setter admin', () => {
  test('admin dashboard and add-route form', async ({ page }) => {
    await openAdmin(page);
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Add route' }).click();
    await expect(page.getByRole('dialog', { name: 'Add New Route' })).toBeVisible();
    await expectNoViolations(page);
  });
});
