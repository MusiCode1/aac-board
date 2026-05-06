import { expect, test } from '@playwright/test';

async function resetApp(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.waitForURL(/\/s\/.+\/b\/.+/);
	await page.evaluate(async () => {
		const req = indexedDB.deleteDatabase('keyval-store');
		await new Promise((resolve) => {
			req.onsuccess = resolve;
			req.onerror = resolve;
			req.onblocked = resolve;
		});
	});
	await page.reload();
	await page.waitForURL(/\/s\/.+\/b\/.+/);
}

test.describe('Sets Management', () => {
	test.beforeEach(async ({ page }) => {
		await resetApp(page);
	});

	test('shows the sets explorer with the default set', async ({ page }) => {
		await page.goto('/sets');

		await expect(page.locator('h1')).toHaveText('אוספי לוחות');
		await expect(page.locator('.set-card')).toHaveCount(1);
		await expect(page.locator('.default-pill')).toHaveText('ברירת מחדל');
	});

	test('creates a new set from the explorer and opens its dashboard', async ({ page }) => {
		await page.goto('/sets');
		await page.locator('button', { hasText: 'אוסף חדש' }).click();

		await page.locator('.modal-card .field-input').fill('גן');
		await page.locator('.modal-card button', { hasText: 'שמור' }).click();

		await expect(page.locator('.set-card')).toHaveCount(2);
		await expect(page.locator('.set-card', { hasText: 'גן' })).toBeVisible();

		await page.locator('.set-card', { hasText: 'גן' }).locator('a', { hasText: 'פתח' }).click();
		await page.waitForURL(/\/s\/[^/]+$/);
		await expect(page.locator('.hero-card h1')).toHaveText('גן');
		await expect(page.locator('.board-card')).toHaveCount(1);
	});

	test('creates a board from the set dashboard', async ({ page }) => {
		await page.goto('/sets');
		await page.locator('.set-card').first().locator('a', { hasText: 'פתח' }).click();

		await page.waitForURL(/\/s\/[^/]+$/);
		await page.locator('button', { hasText: 'לוח חדש' }).click();
		await page.locator('.board-manager .bm-name-input').fill('אנשים');
		await page.locator('.board-manager button', { hasText: 'שמור' }).click();

		await page.waitForURL(/\/s\/[^/]+\/b\/[^/]+\/edit$/);
		await expect(page.locator('.board-title')).toHaveText('אנשים');
	});
});
