import { expect, test } from '@playwright/test';

test.describe('Settings — TTS models', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/settings');
		await page.waitForSelector('.settings-content');
	});

	test('Gemini model selector is shown and persists', async ({ page }) => {
		await page.locator('.toggle-btn', { hasText: 'Gemini' }).click();

		const modelSelect = page.locator('label.field', { hasText: 'מודל' }).locator('select');
		await expect(modelSelect).toBeVisible();
		await expect(modelSelect.locator('option')).toHaveCount(2);
		await expect(modelSelect).toHaveValue('gemini-2.5-flash-preview-tts');

		await modelSelect.selectOption('gemini-2.5-pro-preview-tts');
		await page.reload();
		await page.waitForSelector('.settings-content');

		await expect(page.locator('label.field', { hasText: 'מודל' }).locator('select')).toHaveValue(
			'gemini-2.5-pro-preview-tts'
		);
	});

	test('ElevenLabs model selector includes multilingual default', async ({ page }) => {
		await page.locator('.toggle-btn', { hasText: 'ElevenLabs' }).click();

		const modelSelect = page.locator('label.field', { hasText: 'מודל' }).locator('select');
		await expect(modelSelect).toBeVisible();
		await expect(modelSelect).toHaveValue('eleven_multilingual_v2');
		await expect(modelSelect.locator('option[value="eleven_multilingual_v2"]')).toHaveCount(1);
	});

	test('settings page scrolls to lower data controls', async ({ page }) => {
		const settingsPage = page.locator('.settings-page');
		const resetButton = page.getByRole('button', { name: 'איפוס לברירת מחדל' });

		await expect(settingsPage).toHaveJSProperty('scrollTop', 0);
		await settingsPage.evaluate((el) => el.scrollTo(0, el.scrollHeight));

		await expect(settingsPage).not.toHaveJSProperty('scrollTop', 0);
		await expect(resetButton).toBeInViewport();
	});
});
