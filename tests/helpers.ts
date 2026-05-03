import type { Page, Locator } from '@playwright/test';

export async function gotoApp(page: Page): Promise<{ setId: string; boardId: string }> {
	await page.goto('/');
	await page.waitForURL(/\/s\/.+\/b\/.+/);
	await page.waitForSelector('.tile');
	const match = page.url().match(/\/s\/([^/]+)\/b\/([^/]+)/);
	return { setId: match![1], boardId: match![2] };
}

/**
 * Enter edit mode with a long-press on the edit button (required by gating).
 * The button requires a pointer to be held for 600ms.
 */
export async function enterEditMode(page: Page): Promise<void> {
	const editBtn = page.locator('.edit-btn');
	const box = await editBtn.boundingBox();
	if (!box) throw new Error('edit-btn has no bounding box');
	const x = box.x + box.width / 2;
	const y = box.y + box.height / 2;
	await page.mouse.move(x, y);
	await page.mouse.down();
	// Wait for the long-press threshold (600ms) + a small buffer
	await page.waitForTimeout(750);
	await page.mouse.up();
}

/**
 * Exit edit mode — a single click suffices because we're already in edit mode.
 */
export async function exitEditMode(page: Page): Promise<void> {
	await page.locator('.edit-btn').click();
}

/** Click the edit button using the long-press helper. Semantic alias. */
export async function longPressEdit(page: Page): Promise<void> {
	await enterEditMode(page);
}
