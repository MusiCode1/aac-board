import { expect, test } from '@playwright/test';
import { enterEditMode, gotoApp } from './helpers';

test.describe('Routing', () => {
	test('/ redirects to /s/[setId]/b/[boardId]', async ({ page }) => {
		const { setId, boardId } = await gotoApp(page);

		expect(setId).toBeTruthy();
		expect(boardId).toBe('home');
		await expect(page.locator('.board-title')).toHaveText('בית');
	});

	test('folder tile click updates URL', async ({ page }) => {
		const { setId, boardId } = await gotoApp(page);

		await page.locator('.tile.folder').first().click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));

		const match = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/);
		expect(match?.[1]).toBe(setId);
		expect(match?.[2]).not.toBe(boardId);
	});

	test('back button returns to previous board URL', async ({ page }) => {
		const { setId, boardId } = await gotoApp(page);

		await page.locator('.tile.folder').first().click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));

		await page.locator('.nav-btn[aria-label="חזור"]').click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/${boardId}$`));

		await expect(page.locator('.board-title')).toHaveText('בית');
	});

	test('edit toggle navigates to /edit URL', async ({ page }) => {
		const { setId, boardId } = await gotoApp(page);

		await enterEditMode(page);
		await page.waitForURL(new RegExp(`/s/${setId}/b/${boardId}/edit$`));
		await expect(page.locator('.nav-bar')).toHaveClass(/editing/);

		await page.locator('.edit-btn').click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/${boardId}$`));
	});

	test('direct URL access to board works', async ({ page }) => {
		const { setId } = await gotoApp(page);

		await page.goto(`/s/${setId}/b/food`);
		await page.waitForSelector('.tile');

		await expect(page.locator('.board-title')).toHaveText('אוכל');
		await expect(page).toHaveURL(new RegExp(`/s/${setId}/b/food$`));
	});
});
