import { test, expect, type Page } from '@playwright/test';
import { GRADE_ORDER } from '../../lib/grades';
import { login, openFirstGym } from './helpers';

// Functional tests for route browsing, search, filtering and sorting (F4, F7).
// Assertions are written against whatever routes the first gym currently has, so they
// check the filter/sort invariant rather than specific seed data.

function climbRows(page: Page) {
  return page.getByRole('list', { name: 'Climbs' }).getByRole('button');
}

async function rowGrades(page: Page) {
  return climbRows(page).evaluateAll((rows) => rows.map((r) => r.querySelector('.badge')?.textContent?.trim() ?? ''));
}

const gradeIndex = (g: string) => GRADE_ORDER.indexOf(g as (typeof GRADE_ORDER)[number]);

test.describe('Route browsing, search and filters (F4, F7)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('F7.3: climbers can search gyms by name or location', async ({ page }) => {
    await page.goto('/gyms');
    const cards = page.getByRole('main').locator('a[href^="/gyms/"]');
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();
    const firstName = (await cards.first().getByRole('heading').innerText()).trim();

    const search = page.getByRole('searchbox', { name: 'Search gyms by name or location' });
    await search.fill(firstName.slice(0, 4));
    await expect(page.getByRole('main').getByRole('link', { name: firstName })).toBeVisible();
    expect(await cards.count()).toBeLessThanOrEqual(total);

    await search.fill('zzzz-no-such-gym');
    await expect(page.getByText('No gyms match "zzzz-no-such-gym".')).toBeVisible();
  });

  test('F4.1: list view shows active routes and opens the route detail', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    test.skip((await climbRows(page).count()) === 0, 'Gym has no active routes');

    await climbRows(page).first().click();
    await expect(page.getByRole('dialog', { name: 'Route details' })).toBeVisible();
  });

  test('TC-04 / F7.1.1: grade filter only shows routes of the selected grade', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    const grades = await rowGrades(page);
    test.skip(grades.length === 0, 'Gym has no active routes');
    const target = grades[0];

    await page.getByRole('button', { name: 'Filters' }).click();
    await page.getByRole('region', { name: 'Route filters' }).getByRole('button', { name: target, exact: true }).click();

    const filtered = await rowGrades(page);
    expect(filtered.length).toBeGreaterThan(0);
    expect(new Set(filtered)).toEqual(new Set([target]));
  });

  test('TC-04 / F7.1.3: wall filter only shows routes on the selected wall', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('button', { name: 'Filters' }).click();

    const panel = page.getByRole('region', { name: 'Route filters' });
    const firstWall = panel.getByRole('button', { name: /climbs?$/ }).first();
    test.skip((await firstWall.count()) === 0, 'Gym has no walls');
    const wallName = (await firstWall.locator('span').first().innerText()).trim();
    await firstWall.click();

    const rows = climbRows(page);
    const count = await rows.count();
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText(wallName);
    }
  });

  test('F7.2.1: routes sort by grade in both directions', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    const asc = (await rowGrades(page)).map(gradeIndex);
    test.skip(asc.length < 2, 'Need at least two routes to check ordering');
    expect(asc).toEqual([...asc].sort((a, b) => a - b));

    await page.getByRole('button', { name: /Sort direction/ }).click();
    const desc = (await rowGrades(page)).map(gradeIndex);
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  test('F7.2.3: routes sort by number of logged sends', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    test.skip((await climbRows(page).count()) < 2, 'Need at least two routes to check ordering');

    await page.getByLabel('Sort by').selectOption('sends');
    await page.getByRole('button', { name: /Sort direction/ }).click();
    await expect(page.getByText('Loading stats…')).toBeHidden();

    const sends = await climbRows(page).evaluateAll((rows) =>
      rows.map((r) => Number(/(\d+) sends?/.exec(r.textContent ?? '')?.[1] ?? 0)),
    );
    expect(sends).toEqual([...sends].sort((a, b) => b - a));
  });

  test('search with no matches shows an empty state', async ({ page }) => {
    await openFirstGym(page);
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search climbs and walls' }).fill('zzzz-no-such-route');
    await expect(page.getByText('No climbs match "zzzz-no-such-route".')).toBeVisible();
  });
});
