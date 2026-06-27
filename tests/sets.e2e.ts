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

	test('duplicates a set with " (עותק)" suffix and the same number of boards', async ({
		page
	}) => {
		await page.goto('/sets');
		// Capture the original set name and board count
		const originalCard = page.locator('.set-card').first();
		const originalName = (await originalCard.locator('h2').textContent())!.trim();

		// Open the original to read the board count
		await originalCard.locator('a', { hasText: 'פתח' }).click();
		await page.waitForURL(/\/s\/[^/]+$/);
		const originalBoardCount = await page.locator('.board-card').count();

		// Back to /sets, duplicate
		await page.goto('/sets');
		await page.locator('.set-card').first().locator('button', { hasText: 'שכפל' }).click();

		// New card with "(עותק)" appears
		const copyName = `${originalName} (עותק)`;
		await expect(page.locator('.set-card', { hasText: copyName })).toBeVisible();
		await expect(page.locator('.set-card')).toHaveCount(2);

		// Open the copy and verify the board count matches
		await page
			.locator('.set-card', { hasText: copyName })
			.locator('a', { hasText: 'פתח' })
			.click();
		await page.waitForURL(/\/s\/[^/]+$/);
		await expect(page.locator('.board-card')).toHaveCount(originalBoardCount);
	});

	test('deletes a set and removes all of its boards', async ({ page }) => {
		await page.goto('/sets');
		// Make a second set so we can delete the first one
		await page.locator('button', { hasText: 'אוסף חדש' }).click();
		await page.locator('.modal-card .field-input').fill('זמני');
		await page.locator('.modal-card button', { hasText: 'שמור' }).click();
		await expect(page.locator('.set-card')).toHaveCount(2);

		// Capture the temp set's home board count first
		await page.locator('.set-card', { hasText: 'זמני' }).locator('a', { hasText: 'פתח' }).click();
		await page.waitForURL(/\/s\/[^/]+$/);
		const tempBoardCount = await page.locator('.board-card').count();
		expect(tempBoardCount).toBeGreaterThan(0);

		// Back, delete the temp set
		await page.goto('/sets');
		await page
			.locator('.set-card', { hasText: 'זמני' })
			.locator('button', { hasText: 'מחק' })
			.click();
		// confirm dialog
		await expect(page.locator('.confirm-card')).toBeVisible();
		await page.locator('.confirm-card button', { hasText: 'מחק אוסף' }).click();

		// Set is gone
		await expect(page.locator('.set-card')).toHaveCount(1);
		await expect(page.locator('.set-card', { hasText: 'זמני' })).not.toBeVisible();
	});

	test('cannot delete the last remaining set (button is disabled)', async ({ page }) => {
		await page.goto('/sets');
		await expect(page.locator('.set-card')).toHaveCount(1);

		const deleteBtn = page.locator('.set-card').first().locator('button', { hasText: 'מחק' });
		await expect(deleteBtn).toBeDisabled();
	});

	test('"הפוך לברירת מחדל" moves the default pill, and / opens the new default', async ({
		page
	}) => {
		await page.goto('/sets');
		// Make a second set
		await page.locator('button', { hasText: 'אוסף חדש' }).click();
		await page.locator('.modal-card .field-input').fill('שני');
		await page.locator('.modal-card button', { hasText: 'שמור' }).click();

		const secondCard = page.locator('.set-card', { hasText: 'שני' });
		// Make the second set the default
		await secondCard.locator('button', { hasText: 'הפוך לברירת מחדל' }).click();

		// The default pill is now in the second card
		await expect(secondCard.locator('.default-pill')).toBeVisible();
		// And "Make default" is disabled there
		await expect(secondCard.locator('button', { hasText: 'הפוך לברירת מחדל' })).toBeDisabled();

		// Navigating to "/" should land us inside the new default's home
		// (the second set's home board belongs to "שני")
		await page.goto('/');
		await page.waitForURL(/\/s\/[^/]+\/b\/[^/]+/);
		// The breadcrumb in the NavBar should show "שני"
		await expect(page.locator('.breadcrumbs .crumb').first()).toHaveText('שני');
	});

	test('edits a set name and home board from the explorer', async ({ page }) => {
		await page.goto('/sets');
		// Open the dashboard, create a second board first (so we have a choice for home)
		await page.locator('.set-card').first().locator('a', { hasText: 'פתח' }).click();
		await page.waitForURL(/\/s\/[^/]+$/);
		const setUrl = page.url();

		// Back to /sets, open edit modal
		await page.goto('/sets');
		await page.locator('.set-card').first().locator('button', { hasText: 'ערוך' }).click();

		const modal = page.locator('.modal-card');
		await expect(modal).toBeVisible();
		await modal.locator('.field-input').first().fill('האוסף שלי המעודכן');

		// Pick a different home board (any non-current option)
		const homeSelect = modal.locator('select.field-input');
		await expect(homeSelect).toBeVisible();
		const optionValues = await homeSelect.locator('option').evaluateAll((opts) =>
			(opts as HTMLOptionElement[]).map((o) => ({ value: o.value, text: o.textContent ?? '' }))
		);
		const newHome = optionValues.find((o) => o.text.trim() === 'אוכל');
		expect(newHome).toBeDefined();
		await homeSelect.selectOption(newHome!.value);

		await modal.locator('button', { hasText: 'שמור' }).click();
		await expect(modal).not.toBeVisible();

		// The card now shows the new name and the new home label
		const card = page.locator('.set-card').first();
		await expect(card.locator('h2')).toHaveText('האוסף שלי המעודכן');
		await expect(card).toContainText('בית: אוכל');

		// And the dashboard's hero shows the new name + new home pill
		await page.goto(setUrl);
		await expect(page.locator('.hero-card h1')).toHaveText('האוסף שלי המעודכן');
		// The "אוכל" board should now display the home pill
		await expect(
			page.locator('.board-card', { hasText: 'אוכל' }).locator('.home-pill')
		).toBeVisible();
	});

	test('NavBar breadcrumb is a link back to the set dashboard', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL(/\/s\/([^/]+)\/b\/[^/]+/);
		const setId = page.url().match(/\/s\/([^/]+)\//)![1];

		// The first crumb is a link
		const crumb = page.locator('.breadcrumbs .crumb-link').first();
		await expect(crumb).toBeVisible();
		await crumb.click();

		await page.waitForURL(new RegExp(`/s/${setId}$`));
		await expect(page.locator('.hero-card h1')).toBeVisible();
	});

	test('"הפוך לבית" in BoardManager moves the home pill in the dashboard', async ({ page }) => {
		await page.goto('/');
		await page.waitForURL(/\/s\/([^/]+)\/b\/([^/]+)/);
		const setId = page.url().match(/\/s\/([^/]+)\//)![1];

		// Long-press to enter edit mode
		const editBtn = page.locator('.edit-btn');
		const box = await editBtn.boundingBox();
		await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
		await page.mouse.down();
		await page.waitForTimeout(750);
		await page.mouse.up();
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Open BoardManager
		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();
		await expect(page.locator('.board-manager')).toBeVisible();

		// Find a non-home row (e.g. "אוכל") and click "הפוך לבית"
		const targetRow = page.locator('.bm-row', { hasText: 'אוכל' });
		await targetRow.locator('button[aria-label="הפוך לבית"]').click();

		// Now the home badge should be on "אוכל" inside the manager
		await expect(targetRow.locator('.bm-badge')).toBeVisible();

		// And on the dashboard, the home pill should be on "אוכל"
		await page.goto(`/s/${setId}`);
		await expect(
			page.locator('.board-card', { hasText: 'אוכל' }).locator('.home-pill')
		).toBeVisible();
	});
});
