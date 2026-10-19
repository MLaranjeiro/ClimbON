import { test, expect, type Page } from '@playwright/test';
import { login, SETTER, uniqueName } from './helpers';

// Front-end functional tests for the Route Setter admin dashboard (F3).
// Runs against the real Supabase project, so every route a test creates is deleted
// again before the test ends. Requires TEST_SETTER_EMAIL / TEST_SETTER_PASSWORD
// (or TEST_EMAIL) to belong to an account with a gym role.

test.describe.configure({ mode: 'serial' });

function routeRow(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name });
}

async function createRoute(page: Page, name: string, grade = 'V4') {
  await page.getByRole('button', { name: 'Add route' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add New Route' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Route Name').fill(name);
  await dialog.getByLabel('Grade', { exact: true }).selectOption(grade);
  await dialog.getByRole('button', { name: 'Save Route' }).click();
  await expect(dialog).toBeHidden();
  await expect(routeRow(page, name)).toBeVisible();
}

async function deleteRoute(page: Page, name: string) {
  const row = routeRow(page, name);
  if ((await row.count()) === 0) return;
  page.once('dialog', (d) => d.accept());
  await row.getByRole('button', { name: 'Delete route' }).click();
  await expect(row).toHaveCount(0);
}

async function gymNameFor(page: Page, routeName: string) {
  return (await routeRow(page, routeName).getByRole('cell').nth(1).innerText()).trim();
}

async function searchClimberList(page: Page, gymName: string, routeName: string) {
  await page.goto('/gyms');
  await page.getByRole('main').getByRole('link', { name: gymName }).first().click();
  await page.getByRole('button', { name: 'List', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search climbs and walls' }).fill(routeName);
}

test.describe('Route Setter admin dashboard (F3)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, SETTER);
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Route Setter admin' })).toBeVisible();
  });

  test('TC-03: setter creates a route and it appears in the climber active list', async ({ page }) => {
    const name = uniqueName('PW Green Crimps');
    await createRoute(page, name, 'V4');

    const row = routeRow(page, name);
    await expect(row.getByText('V4')).toBeVisible();
    await expect(row.getByText('Active', { exact: true })).toBeVisible();
    const gymName = await gymNameFor(page, name);

    await searchClimberList(page, gymName, name);
    await expect(page.getByRole('button', { name: new RegExp(name) })).toBeVisible();

    await page.goto('/admin');
    await deleteRoute(page, name);
  });

  test('blank route name is blocked by the required field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add route' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add New Route' });
    await dialog.getByRole('button', { name: 'Save Route' }).click();

    await expect(dialog).toBeVisible();
    const message = await dialog.getByLabel('Route Name').evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(message.length).toBeGreaterThan(0);
  });

  test('whitespace-only route name shows a validation error', async ({ page }) => {
    await page.getByRole('button', { name: 'Add route' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add New Route' });
    await dialog.getByLabel('Route Name').fill('    ');
    await dialog.getByRole('button', { name: 'Save Route' }).click();

    await expect(dialog.getByText('Enter a route name.')).toBeVisible();
    await expect(dialog).toBeVisible();
  });

  test('Cancel closes the form without saving', async ({ page }) => {
    const name = uniqueName('PW Cancelled');
    await page.getByRole('button', { name: 'Add route' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add New Route' });
    await dialog.getByLabel('Route Name').fill(name);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(routeRow(page, name)).toHaveCount(0);
  });

  test('setter edits an existing route name and grade (F3.3)', async ({ page }) => {
    const name = uniqueName('PW Edit Me');
    const edited = `${name} edited`;
    await createRoute(page, name, 'V2');

    await routeRow(page, name).getByRole('button', { name: 'Edit route' }).click();
    const dialog = page.getByRole('dialog', { name: 'Edit Route' });
    await expect(dialog.getByLabel('Route Name')).toHaveValue(name);
    await dialog.getByLabel('Route Name').fill(edited);
    await dialog.getByLabel('Grade', { exact: true }).selectOption('V5');
    await dialog.getByRole('button', { name: 'Save Changes' }).click();

    await expect(dialog).toBeHidden();
    await expect(routeRow(page, edited).getByText('V5')).toBeVisible();

    await deleteRoute(page, edited);
  });

  test('deactivated route is removed from the climber list (F3.4)', async ({ page }) => {
    const name = uniqueName('PW Retire Me');
    await createRoute(page, name);
    const gymName = await gymNameFor(page, name);

    await routeRow(page, name).getByRole('button', { name: 'Deactivate route' }).click();
    await expect(routeRow(page, name).getByText('Inactive')).toBeVisible();

    await searchClimberList(page, gymName, name);
    await expect(page.getByText(`No climbs match "${name}".`)).toBeVisible();

    await page.goto('/admin');
    await routeRow(page, name).getByRole('button', { name: 'Activate route' }).click();
    await expect(routeRow(page, name).getByText('Active', { exact: true })).toBeVisible();
    await deleteRoute(page, name);
  });

  test('setter deletes a route with no sends', async ({ page }) => {
    const name = uniqueName('PW Delete Me');
    await createRoute(page, name);
    await deleteRoute(page, name);
    await page.reload();
    await expect(routeRow(page, name)).toHaveCount(0);
  });
});
