import { test, expect } from '@playwright/test';
import { enterEditMode } from './helpers';

/**
 * Board Management — tests for BoardManager modal, CRUD operations,
 * dependents resolution, and TileEditor dropdown.
 *
 * Corresponds to docs/plans/board-management.md §אימות
 */
test.describe('Board Management', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForSelector('.tile');
		// Reset storage between tests
		await page.evaluate(async () => {
			const req = indexedDB.deleteDatabase('keyval-store');
			await new Promise((resolve) => {
				req.onsuccess = resolve;
				req.onerror = resolve;
				req.onblocked = resolve;
			});
		});
		await page.reload();
		await page.waitForSelector('.tile');
	});

	test('opens BoardManager modal from EditToolbar', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const manageBtn = page.locator('.toolbar-btn', { hasText: 'לוחות' });
		await expect(manageBtn).toBeVisible();
		await manageBtn.click();

		// Modal should appear with list view
		await expect(page.locator('.board-manager')).toBeVisible();
		await expect(page.locator('.board-manager-list')).toBeVisible();
	});

	test('creates a new board', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();
		await expect(page.locator('.board-manager')).toBeVisible();

		// Click "לוח חדש"
		await page.locator('button', { hasText: 'לוח חדש' }).click();

		// Fill in name + grid
		await page.locator('.bm-name-input').fill('בדיקה');
		await page.locator('.bm-rows-input').fill('2');
		await page.locator('.bm-cols-input').fill('3');

		// Save
		await page.locator('button', { hasText: 'שמור' }).click();

		// Back to list — the new board should appear
		await expect(page.locator('.bm-row', { hasText: 'בדיקה' })).toBeVisible();
		await expect(page.locator('.bm-row', { hasText: 'בדיקה' })).toContainText('2×3');
	});

	test('duplicates an existing board', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();

		// Find the home board row
		const homeRow = page.locator('.bm-row', { hasText: 'בית' });
		await expect(homeRow).toBeVisible();

		// Click duplicate button
		await homeRow.locator('button[aria-label="שכפל"]').click();

		// A new row with "(עותק)" should appear
		await expect(page.locator('.bm-row', { hasText: /בית.*עותק|עותק.*בית/ })).toBeVisible();
	});

	test('deletes a board without dependents', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();

		// First, create a board to delete (so we don't touch existing ones)
		await page.locator('button', { hasText: 'לוח חדש' }).click();
		await page.locator('.bm-name-input').fill('למחיקה');
		await page.locator('button', { hasText: 'שמור' }).click();

		await expect(page.locator('.bm-row', { hasText: 'למחיקה' })).toBeVisible();

		// Click delete
		const row = page.locator('.bm-row', { hasText: 'למחיקה' });
		await row.locator('button[aria-label="מחק"]').click();

		// Confirm dialog should appear (no dependents)
		await expect(page.locator('.bm-confirm')).toBeVisible();
		await page.locator('.bm-confirm button', { hasText: 'מחק' }).click();

		// Row should be gone
		await expect(page.locator('.bm-row', { hasText: 'למחיקה' })).not.toBeVisible();
	});

	test('cannot delete the home board', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();

		const homeRow = page.locator('.bm-row', { hasText: 'בית' });
		const deleteBtn = homeRow.locator('button[aria-label="מחק"]');
		await expect(deleteBtn).toBeDisabled();
	});

	test('deleting a board with dependents strips references', async ({ page }) => {
		// The home board has a folder tile pointing to 'food'. Delete 'food' and verify.
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();

		const foodRow = page.locator('.bm-row', { hasText: 'אוכל' });
		await expect(foodRow).toBeVisible();

		await foodRow.locator('button[aria-label="מחק"]').click();

		// Confirm dialog mentions dependents
		await expect(page.locator('.bm-confirm')).toBeVisible();
		await expect(page.locator('.bm-confirm')).toContainText(/תלויות|תלויים|1/);

		// Click "מחק ונקה הפניות"
		await page.locator('.bm-confirm button', { hasText: /מחק/ }).click();

		// Board should be gone from the list
		await expect(page.locator('.bm-row', { hasText: 'אוכל' })).not.toBeVisible();

		// Close the manager
		await page.keyboard.press('Escape');

		// The tile that used to be a folder should now be a button (no .folder class)
		const foodTile = page.locator('.tile', { hasText: 'אוכל' }).first();
		if (await foodTile.isVisible()) {
			await expect(foodTile).not.toHaveClass(/folder/);
		}
	});

	test('TileEditor shows dropdown of boards for folder type', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Open a folder tile editor (folder tile already has type='folder')
		const folderTile = page.locator('.tile.folder').first();
		await folderTile.click();

		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();

		// The load-board dropdown should be visible since the tile is already a folder
		const boardSelect = page.locator('.load-board-select');
		await expect(boardSelect).toBeVisible();

		// Should have at least the existing boards as options
		const optionCount = await boardSelect.locator('option').count();
		expect(optionCount).toBeGreaterThan(1);
	});
});
