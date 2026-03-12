import { test, expect } from '@playwright/test';

test.describe('Edit Mode', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		// Wait for the board to render
		await page.waitForSelector('.tile');
	});

	test('toggle edit mode shows toolbar and wobble', async ({ page }) => {
		const editBtn = page.locator('.edit-btn');
		await editBtn.click();

		// NavBar should have editing class (orange gradient)
		await expect(page.locator('.nav-bar')).toHaveClass(/editing/);

		// EditToolbar should be visible
		await expect(page.locator('.edit-toolbar')).toBeVisible();

		// Tiles should have editing class
		const firstTile = page.locator('.tile').first();
		await expect(firstTile).toHaveClass(/editing/);

		// Click again to exit edit mode
		await editBtn.click();
		await expect(page.locator('.edit-toolbar')).not.toBeVisible();
		await expect(page.locator('.nav-bar')).not.toHaveClass(/editing/);
	});

	test('clicking tile in edit mode opens TileEditor', async ({ page }) => {
		// Enter edit mode
		await page.locator('.edit-btn').click();

		// Disable wobble animation so Playwright sees stable elements
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Click a tile
		await page.locator('.tile').first().click();

		// TileEditor modal should appear
		await expect(page.locator('.overlay')).toBeVisible();
		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();

		// Close it
		await page.keyboard.press('Escape');
		await expect(page.locator('.overlay')).not.toBeVisible();
	});

	test('grid resize changes tile layout', async ({ page }) => {
		await page.locator('.edit-btn').click();

		// Get initial tile count visible
		const tilesCount = await page.locator('.tile').count();
		expect(tilesCount).toBeGreaterThan(0);

		// Get current grid style
		const grid = page.locator('.board-grid');
		const initialStyle = await grid.getAttribute('style');

		// Click "+" for rows
		const rowPlusBtn = page.locator('.stepper-btn', { hasText: '+' }).first();
		await rowPlusBtn.click();

		// Grid style should have changed
		const newStyle = await grid.getAttribute('style');
		expect(newStyle).not.toBe(initialStyle);
	});

	test('add tile creates a new tile', async ({ page }) => {
		await page.locator('.edit-btn').click();

		// Increase rows to ensure there's room for a new tile
		const rowPlusBtn = page.locator('.stepper-btn', { hasText: '+' }).first();
		await rowPlusBtn.click();

		const initialCount = await page.locator('.tile').count();

		// Click "הוסף" button
		await page.locator('.toolbar-btn', { hasText: 'הוסף' }).click();

		const newCount = await page.locator('.tile').count();
		expect(newCount).toBe(initialCount + 1);
	});

	test('drag and drop reorders tiles (desktop)', async ({ page }) => {
		await page.locator('.edit-btn').click();

		// Disable wobble animation so Playwright sees stable elements
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const tiles = page.locator('.tile');
		const firstTileLabel = await tiles.first().locator('.tile-label').textContent();
		const secondTileLabel = await tiles.nth(1).locator('.tile-label').textContent();

		// Drag the first tile to the second position
		const firstTile = tiles.first();
		const secondTile = tiles.nth(1);

		await firstTile.dragTo(secondTile);

		// After drag, the first position should now have what was the second tile
		const newFirstLabel = await tiles.first().locator('.tile-label').textContent();
		const newSecondLabel = await tiles.nth(1).locator('.tile-label').textContent();

		expect(newFirstLabel).toBe(secondTileLabel);
		expect(newSecondLabel).toBe(firstTileLabel);
	});

	test('export downloads JSON file', async ({ page }) => {
		await page.locator('.edit-btn').click();

		// Listen for download event
		const downloadPromise = page.waitForEvent('download');
		await page.locator('.toolbar-btn', { hasText: 'ייצוא' }).click();
		const download = await downloadPromise;

		expect(download.suggestedFilename()).toMatch(/^aac-boards-.*\.json$/);
	});

	test('reducing grid shows hidden tiles warning and delete overflow works', async ({ page }) => {
		await page.locator('.edit-btn').click();

		// Disable wobble animation
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const initialCount = await page.locator('.tile').count();

		// Reduce rows to 1 — this should hide most tiles
		const rowMinusBtn = page.locator('.stepper-btn').first();
		// Click minus enough times to get to 1 row
		for (let i = 0; i < 5; i++) {
			await rowMinusBtn.click();
		}

		// The grid now shows fewer tiles, but data is preserved
		const grid = page.locator('.board-grid');
		const style = await grid.getAttribute('style');
		expect(style).toContain('--rows: 1');

		// If there are hidden tiles, the overflow warning should be visible
		const visibleTiles = await page.locator('.tile').count();
		if (initialCount > visibleTiles) {
			await expect(page.locator('.overflow-warning')).toBeVisible();
			await expect(page.locator('.overflow-toggle')).toContainText('מוסתרים');

			// Click delete overflow
			await page.locator('.toolbar-btn', { hasText: 'מחק' }).click();

			// Warning should disappear
			await expect(page.locator('.overflow-warning')).not.toBeVisible();
		}
	});

	test('drag and drop reorders tiles (touch — long press)', async ({ browser }) => {
		// Create a touch-enabled browser context
		const context = await browser.newContext({ hasTouch: true });
		const page = await context.newPage();
		await page.goto('/');
		await page.waitForSelector('.tile');

		await page.locator('.edit-btn').click();

		// Disable wobble animation
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const tiles = page.locator('.tile');
		const firstTileLabel = await tiles.first().locator('.tile-label').textContent();
		const secondTileLabel = await tiles.nth(1).locator('.tile-label').textContent();

		// Get bounding boxes of first two tiles
		const firstBox = await tiles.first().boundingBox();
		const secondBox = await tiles.nth(1).boundingBox();
		if (!firstBox || !secondBox) throw new Error('Cannot get tile bounding boxes');

		const firstCenter = { x: firstBox.x + firstBox.width / 2, y: firstBox.y + firstBox.height / 2 };
		const secondCenter = {
			x: secondBox.x + secondBox.width / 2,
			y: secondBox.y + secondBox.height / 2
		};

		// Dispatch touchstart on first tile
		await page.evaluate(
			({ x, y }) => {
				const el = document.elementFromPoint(x, y);
				if (!el) return;
				const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
				el.dispatchEvent(
					new TouchEvent('touchstart', { touches: [touch], bubbles: true, cancelable: true })
				);
			},
			{ x: firstCenter.x, y: firstCenter.y }
		);

		// Wait for long-press timer to fire (400ms + buffer)
		await page.waitForTimeout(500);

		// Verify drag started — first tile should have dragging class
		await expect(tiles.first()).toHaveClass(/dragging/);

		// Simulate touchmove to second tile
		await page.evaluate(
			({ fromX, fromY, toX, toY }) => {
				const el = document.elementFromPoint(fromX, fromY);
				if (!el) return;
				const touch = new Touch({ identifier: 1, target: el, clientX: toX, clientY: toY });
				el.dispatchEvent(
					new TouchEvent('touchmove', { touches: [touch], bubbles: true, cancelable: true })
				);
			},
			{ fromX: firstCenter.x, fromY: firstCenter.y, toX: secondCenter.x, toY: secondCenter.y }
		);

		// Second tile should show drag-over indicator
		await expect(tiles.nth(1)).toHaveClass(/drag-over/);

		// Simulate touchend to complete the drop
		await page.evaluate(
			({ x, y }) => {
				const el = document.elementFromPoint(x, y);
				if (!el) return;
				el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true }));
			},
			{ x: firstCenter.x, y: firstCenter.y }
		);

		// Tiles should have swapped
		const newFirstLabel = await tiles.first().locator('.tile-label').textContent();
		const newSecondLabel = await tiles.nth(1).locator('.tile-label').textContent();

		expect(newFirstLabel).toBe(secondTileLabel);
		expect(newSecondLabel).toBe(firstTileLabel);

		await context.close();
	});
});
