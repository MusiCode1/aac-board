import { test, expect } from '@playwright/test';
import { enterEditMode, gotoApp } from './helpers';

/**
 * Board Management — tests for BoardManager modal, CRUD operations,
 * dependents resolution, and TileEditor dropdown.
 *
 * Corresponds to docs/plans/board-management.md §אימות
 */
test.describe('Board Management', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
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
		await page.waitForURL(/\/s\/.+\/b\/.+/);
		await page.waitForSelector('.tile');
	});

	test('navigates to a board from BoardManager', async ({ page }) => {
		const setId = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/)![1];
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		await page.locator('.toolbar-btn', { hasText: 'לוחות' }).click();
		await page.locator('.bm-row', { hasText: 'אוכל' }).locator('.bm-row-main').click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/food$`));

		await expect(page.locator('.board-title')).toHaveText('אוכל');
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

		// Open a folder tile editor via the edit badge (3C)
		const folderTile = page.locator('.tile.folder').first();
		await folderTile.locator('.tile-edit-btn').click();

		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();

		// The load-board dropdown should be visible since the tile is already a folder
		const boardSelect = page.locator('.load-board-select');
		await expect(boardSelect).toBeVisible();

		// Should have at least the existing boards as options
		const optionCount = await boardSelect.locator('option').count();
		expect(optionCount).toBeGreaterThan(1);
	});
});

/**
 * Stage 3C — Tile edit/delete buttons + "+ לוח" + terminology.
 *
 * New interaction model in edit mode:
 * - Click tile body → normal action (speak / navigate)
 * - Click ✏ badge → open TileEditor
 * - Click ✕ badge → delete tile (with confirm)
 */
test.describe('Edit Mode — New Interaction (3C)', () => {
	test.beforeEach(async ({ page }) => {
		await gotoApp(page);
	});

	test('clicking tile body in edit mode still speaks (adds to output)', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Click the tile body (not the edit/delete badges) of a button tile
		const tileBody = page.locator('.tile:not(.folder) .tile-icon').first();
		await tileBody.click();

		// Should add to output bar (no modal)
		await expect(page.locator('.overlay')).not.toBeVisible();
		const outputItems = page.locator('.output-item');
		await expect(outputItems).toHaveCount(1);
	});

	test('clicking folder tile body in edit mode navigates', async ({ page }) => {
		const setId = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/)![1];
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const homeTitle = await page.locator('.board-title').textContent();

		// Click the body of a folder tile
		const folderBody = page.locator('.tile.folder .tile-icon').first();
		await folderBody.click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));

		// Should navigate (title changes)
		await expect(page.locator('.board-title')).not.toHaveText(homeTitle!);
	});

	test('edit badge opens TileEditor', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Click the edit badge specifically
		const editBadge = page.locator('.tile .tile-edit-btn').first();
		await editBadge.click();

		// TileEditor modal should appear
		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();
	});

	test('delete badge removes tile (with confirm)', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		const initialCount = await page.locator('.tile').count();

		// Accept any native confirm that may be triggered
		page.on('dialog', (dialog) => dialog.accept());

		// Click the delete badge on first tile
		const deleteBadge = page.locator('.tile .tile-delete-btn').first();
		await deleteBadge.click();

		// Tile count should decrease by 1
		await expect(page.locator('.tile')).toHaveCount(initialCount - 1);
	});

	test('"+ לוח" button creates a linked folder tile', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Make sure there's room in the visible grid — add a couple of rows
		const rowPlus = page.locator('.stepper-btn', { hasText: '+' }).first();
		await rowPlus.click();
		await rowPlus.click();

		const initialCount = await page.locator('.tile.folder').count();

		// Click the new "+ לוח" button in EditToolbar
		await page.locator('.toolbar-btn', { hasText: '+ לוח' }).click();

		// A new folder tile should appear
		await expect(page.locator('.tile.folder')).toHaveCount(initialCount + 1);

		// Close any editor that auto-opened
		if (await page.locator('.editor[role="dialog"]').isVisible()) {
			await page.keyboard.press('Escape');
		}
	});

	test('clicking a newly-created board tile navigates to an empty board', async ({ page }) => {
		const setId = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/)![1];
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Make sure there's room in the visible grid
		const rowPlus = page.locator('.stepper-btn', { hasText: '+' }).first();
		await rowPlus.click();
		await rowPlus.click();

		await page.locator('.toolbar-btn', { hasText: '+ לוח' }).click();

		// Close the editor that auto-opened
		if (await page.locator('.editor[role="dialog"]').isVisible()) {
			await page.keyboard.press('Escape');
		}

		// Exit edit mode to navigate normally
		await page.locator('.edit-btn').click();

		// Click the last folder tile (the newly created one) — on its body
		const lastFolderBody = page.locator('.tile.folder').last().locator('.tile-icon');
		await lastFolderBody.click();
		await page.waitForURL(new RegExp(`/s/${setId}/b/[^/]+$`));

		// Should land on an empty board (no tiles, empty-state visible)
		await expect(page.locator('.empty-state')).toBeVisible();
	});

	test('TileEditor shows "לוח" instead of "תיקייה" in type field', async ({ page }) => {
		await enterEditMode(page);
		await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; }' });

		// Open editor via the edit badge
		await page.locator('.tile .tile-edit-btn').first().click();
		await expect(page.locator('.editor[role="dialog"]')).toBeVisible();

		// The type select should say "לוח" (not "תיקייה")
		const typeSelect = page.locator('.editor select').first();
		await expect(typeSelect.locator('option[value="folder"]')).toHaveText('לוח');
	});
});
