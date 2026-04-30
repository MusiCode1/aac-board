import { expect, test } from '@playwright/test';

test.describe('Settings — TTS models and cache', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/settings');
		await page.waitForSelector('.settings-content');
	});

	test('Gemini provider exposes model selector and persists selected model', async ({ page }) => {
		await page.locator('.toggle-btn', { hasText: 'Gemini' }).click();

		const modelSelect = page.locator('select').nth(0);
		await expect(modelSelect).toBeVisible();
		await expect(modelSelect.locator('option')).toHaveCount(3);

		await modelSelect.selectOption('gemini-2.5-pro-preview-tts');
		await page.reload();
		await page.waitForSelector('.settings-content');

		await page.locator('.toggle-btn', { hasText: 'Gemini' }).click();
		await expect(page.locator('select').nth(0)).toHaveValue('gemini-2.5-pro-preview-tts');
	});

	test('audio cache controls are visible and clear action leaves empty cache empty', async ({
		page
	}) => {
		const cacheStats = page.locator('.cache-stat');
		await expect(cacheStats).toHaveCount(2);
		await expect(cacheStats.first()).toContainText('פריטי cache');
		await expect(cacheStats.first()).toContainText('0');

		const clearButton = page.locator('.cache-clear-btn');
		await expect(clearButton).toBeVisible();
		await clearButton.click();

		await expect(cacheStats.first()).toContainText('0');
	});
});
