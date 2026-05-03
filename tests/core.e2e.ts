import { test, expect } from '@playwright/test';
import { enterEditMode, gotoApp } from './helpers';

/**
 * Core smoke tests — safety net for core functionality.
 * These tests guard against regressions in tile interaction, navigation, and persistence.
 */
test.describe('Core Functionality', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
	});

	test('tile click adds to output bar', async ({ page }) => {
		const firstButtonTile = page.locator('.tile:not(.folder)').first();
		const tileLabel = await firstButtonTile.locator('.tile-label').textContent();
		expect(tileLabel).toBeTruthy();

		await firstButtonTile.click();

		// Output bar should contain the tile label
		const outputItems = page.locator('.output-item');
		await expect(outputItems).toHaveCount(1);
		await expect(outputItems.first()).toContainText(tileLabel!);
	});

	test('folder tile click navigates to sub-board', async ({ page }) => {
		const startUrl = page.url();
		const homeTitle = await page.locator('.board-title').textContent();

		// Find a folder tile
		const folderTile = page.locator('.tile.folder').first();
		await expect(folderTile).toBeVisible();

		const folderLabel = await folderTile.locator('.tile-label').textContent();
		expect(folderLabel).toBeTruthy();

		await folderTile.click();
		await page.waitForURL(
			(url) => url.toString() !== startUrl && /\/s\/.+\/b\/.+/.test(url.pathname)
		);

		// Board title should change
		await expect(page.locator('.board-title')).not.toHaveText(homeTitle!);

		// Back button should be enabled now
		const backBtn = page.locator('.nav-btn[aria-label="חזור"]');
		await expect(backBtn).toBeEnabled();
	});

	test('back and home buttons work', async ({ page }) => {
		const match = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/);
		const setId = match![1];
		const boardId = match![2];
		const homeTitle = await page.locator('.board-title').textContent();

		// Navigate into a folder
		await page.locator('.tile.folder').first().click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));
		await expect(page.locator('.board-title')).not.toHaveText(homeTitle!);

		// Press back
		await page.locator('.nav-btn[aria-label="חזור"]').click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/${boardId}$`));
		await expect(page.locator('.board-title')).toHaveText(homeTitle!);

		// Navigate in again, then press home
		await page.locator('.tile.folder').first().click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));
		await expect(page.locator('.board-title')).not.toHaveText(homeTitle!);

		await page.locator('.nav-btn[aria-label="בית"]').click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/${boardId}$`));
		await expect(page.locator('.board-title')).toHaveText(homeTitle!);
	});

	test('tile edit persists after reload', async ({ page }) => {
		// Enter edit mode (long-press gating)
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Open tile editor via the edit badge (3C: tile body no longer opens editor)
		await page.locator('.tile .tile-edit-btn').first().click();
		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();

		// Change label to a unique marker
		const marker = `בדיקה-${Date.now()}`;
		const labelInput = page.locator('.field-input').first();
		await labelInput.fill(marker);

		// Save
		await page.locator('button', { hasText: 'שמור' }).click();
		await expect(page.locator('.overlay')).not.toBeVisible();

		// Exit edit mode
		await page.locator('.edit-btn').click();

		// Reload
		await page.reload();
		await page.waitForSelector('.tile');

		// The edited label should be visible
		await expect(page.locator('.tile-label', { hasText: marker })).toBeVisible();
	});

	test('theme toggle persists after reload', async ({ page }) => {
		// Go to settings
		await page.goto('/settings');
		await page.waitForSelector('.toggle-group');

		// Give the store time to init and apply the persisted theme
		await page.waitForTimeout(300);
		const initialHasDark = await page.evaluate(() =>
			document.documentElement.classList.contains('dark')
		);

		// Click the OPPOSITE theme button
		const targetBtn = initialHasDark
			? page.locator('.toggle-btn', { hasText: 'בהיר' })
			: page.locator('.toggle-btn', { hasText: 'כהה' });
		await targetBtn.click();

		// Theme should flip immediately
		await page.waitForTimeout(200);
		const afterClickHasDark = await page.evaluate(() =>
			document.documentElement.classList.contains('dark')
		);
		expect(afterClickHasDark).not.toBe(initialHasDark);

		// Reload and verify persistence
		await page.reload();
		await page.waitForTimeout(400);

		const afterReloadHasDark = await page.evaluate(() =>
			document.documentElement.classList.contains('dark')
		);
		expect(afterReloadHasDark).toBe(afterClickHasDark);
	});
});
