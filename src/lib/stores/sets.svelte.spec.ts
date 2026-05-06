/**
 * Vitest unit tests for sets.svelte.ts (browser provider — real IndexedDB).
 *
 * The store uses module-level $state, so we must call resetToDefaults() in
 * beforeEach to bring the store back to a known state. We also clear the
 * default idb-keyval store so each test starts from a clean disk.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { clear } from 'idb-keyval';
import { setsStore } from './sets.svelte';
import { boardStore } from './board.svelte';
import {
	loadAllSets,
	loadAllBoards,
	loadDefaultSetId,
	loadSet
} from '$lib/services/storage';
import { boards as defaultBoards, HOME_BOARD_ID } from '$lib/data/boards';

async function freshInit() {
	// Wipe disk
	await clear();
	// Reset in-memory store via the public API.
	// runMigration() now calls boardStore().setAllBoards(storedBoards) so the
	// in-memory state is always in sync with IDB after init().
	const sets = setsStore();
	await sets.resetToDefaults();
	return sets;
}

describe('setsStore', () => {
	beforeEach(async () => {
		await clear();
	});

	describe('init() — first-run migration', () => {
		it('M0 — in-memory boardStore agrees with IDB immediately after migration', async () => {
			// Verifies the fix for the previous bug where runMigration() wrote
			// migrated setIds to IDB but left boardStore.allBoards with setId=''.
			// Now runMigration() calls boardStore().setAllBoards(storedBoards) so
			// in-memory and IDB are always in sync after init(), without needing a
			// separate boards.init() call.
			await clear();
			const sets = setsStore();
			await sets.resetToDefaults();

			const boards = boardStore();
			const inMemorySetIds = new Set(
				Object.values(boards.allBoards).map((b) => b.setId)
			);
			const persisted = await loadAllBoards();
			const persistedSetIds = new Set(
				Object.values(persisted ?? {}).map((b) => b.setId)
			);

			expect(inMemorySetIds, 'in-memory and IDB should agree on setId').toEqual(
				persistedSetIds
			);
			// All boards should have the new setId, not ''
			expect(inMemorySetIds.has('')).toBe(false);
			expect(persistedSetIds.has('')).toBe(false);
		});

		it('M1 — creates a default set with all 5 default boards persisted to IDB', async () => {
			// Force a clean module state by going through resetToDefaults from a
			// freshly cleared disk: that calls boards.resetToDefaults() and then
			// init() which runs the migration.
			const sets = await freshInit();

			// Public state
			expect(sets.allSets).toHaveLength(1);
			expect(sets.defaultSetId).toBe(sets.allSets[0].id);
			expect(sets.allSets[0].name).toBe('האוסף שלי');

			// Persisted to IDB
			const persistedSets = await loadAllSets();
			expect(persistedSets).toHaveLength(1);
			expect(persistedSets[0].id).toBe(sets.defaultSetId);

			const persistedDefaultId = await loadDefaultSetId();
			expect(persistedDefaultId).toBe(sets.defaultSetId);

			// All 5 default boards persisted with the new setId
			const persistedBoards = await loadAllBoards();
			expect(persistedBoards).not.toBeNull();
			const ids = Object.keys(persistedBoards!);
			expect(ids).toEqual(expect.arrayContaining(Object.keys(defaultBoards)));
			for (const id of Object.keys(defaultBoards)) {
				expect(persistedBoards![id].setId).toBe(sets.defaultSetId);
			}
		});
	});

	describe('createSet(name)', () => {
		it('CS1 — adds a new set with a freshly-generated home board (4×5, "בית")', async () => {
			const sets = await freshInit();
			const boards = boardStore();

			const before = sets.allSets.length;
			const newId = await sets.createSet('גן');

			expect(sets.allSets).toHaveLength(before + 1);
			const created = sets.allSets.find((s) => s.id === newId);
			expect(created).toBeDefined();
			expect(created!.name).toBe('גן');

			// home board exists, belongs to the set, has the right shape
			const home = boards.allBoards[created!.homeBoardId];
			expect(home).toBeDefined();
			expect(home.name).toBe('בית');
			expect(home.grid).toEqual({ rows: 4, columns: 5 });
			expect(home.setId).toBe(newId);
			expect(home.tiles).toEqual([]);
		});

		it('CS2 — persists the new set to IDB', async () => {
			const sets = await freshInit();
			const newId = await sets.createSet('גן');

			const persisted = await loadSet(newId);
			expect(persisted).toBeDefined();
			expect(persisted!.name).toBe('גן');
			expect(persisted!.homeBoardId).toBeTruthy();
		});

		it('CS3 — persists the new home board to IDB (so a refresh keeps it)', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const newId = await sets.createSet('גן');
			const created = sets.allSets.find((s) => s.id === newId)!;

			const persistedBoards = await loadAllBoards();
			expect(persistedBoards).not.toBeNull();
			expect(persistedBoards![created.homeBoardId]).toBeDefined();
			expect(persistedBoards![created.homeBoardId].setId).toBe(newId);
		});
	});

	describe('updateSet(id, updates)', () => {
		it('US1 — updates name and persists', async () => {
			const sets = await freshInit();
			const id = sets.defaultSetId;

			await sets.updateSet(id, { name: 'שם חדש' });

			expect(sets.allSets.find((s) => s.id === id)!.name).toBe('שם חדש');
			const persisted = await loadSet(id);
			expect(persisted!.name).toBe('שם חדש');
		});

		it('US2 — updates homeBoardId and persists', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const id = sets.defaultSetId;
			// Pick another existing board in the same set
			const otherBoardId = Object.values(boards.allBoards).find(
				(b) => b.setId === id && b.id !== sets.allSets[0].homeBoardId
			)!.id;

			await sets.updateSet(id, { homeBoardId: otherBoardId });

			expect(sets.allSets.find((s) => s.id === id)!.homeBoardId).toBe(otherBoardId);
			const persisted = await loadSet(id);
			expect(persisted!.homeBoardId).toBe(otherBoardId);
		});

		it('US3 — updates updatedAt timestamp', async () => {
			const sets = await freshInit();
			const id = sets.defaultSetId;
			const before = sets.allSets.find((s) => s.id === id)!.updatedAt;
			await new Promise((r) => setTimeout(r, 5));

			await sets.updateSet(id, { name: 'עוד' });

			const after = sets.allSets.find((s) => s.id === id)!.updatedAt;
			expect(after).toBeGreaterThan(before);
		});

		it('US4 — non-existent id is a no-op (does not throw)', async () => {
			const sets = await freshInit();
			await expect(sets.updateSet('does-not-exist', { name: 'X' })).resolves.toBeUndefined();
		});
	});

	describe('setDefault(id)', () => {
		it('SD1 — changes the default set and persists', async () => {
			const sets = await freshInit();
			const newSetId = await sets.createSet('שני');
			expect(sets.defaultSetId).not.toBe(newSetId);

			await sets.setDefault(newSetId);

			expect(sets.defaultSetId).toBe(newSetId);
			expect(await loadDefaultSetId()).toBe(newSetId);
		});
	});

	describe('deleteSet(id)', () => {
		it('DS1 — refuses to delete when only one set remains', async () => {
			const sets = await freshInit();
			const onlyId = sets.defaultSetId;

			await sets.deleteSet(onlyId);

			expect(sets.allSets).toHaveLength(1);
			expect(sets.allSets[0].id).toBe(onlyId);
		});

		it('DS2 — removes the set and all of its boards from IDB', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const newId = await sets.createSet('שני');
			// Add another board to the new set so we can verify cascade delete
			const created = sets.allSets.find((s) => s.id === newId)!;
			const extraBoardId = boards.createBoardFromName('נוסף', 2, 2, newId);

			await sets.deleteSet(newId);

			// Set gone
			expect(sets.allSets.find((s) => s.id === newId)).toBeUndefined();
			expect(await loadSet(newId)).toBeUndefined();

			// Boards of the deleted set are gone (both home board and extra board)
			const remaining = await loadAllBoards();
			expect(remaining?.[created.homeBoardId]).toBeUndefined();
			expect(remaining?.[extraBoardId]).toBeUndefined();
			// But the original default set's boards are still present
			expect(remaining?.[HOME_BOARD_ID]).toBeDefined();
		});

		it('DS2b — boards belonging to OTHER sets are untouched after delete', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const originalDefaultId = sets.defaultSetId;
			// snapshot the default-set boards before
			const beforeIds = Object.values(boards.allBoards)
				.filter((b) => b.setId === originalDefaultId)
				.map((b) => b.id)
				.sort();

			// Make a second set and delete IT — the original set's boards must
			// remain untouched (no IDs added/removed).
			const otherId = await sets.createSet('זמני');
			await sets.deleteSet(otherId);

			const afterIds = Object.values(boards.allBoards)
				.filter((b) => b.setId === originalDefaultId)
				.map((b) => b.id)
				.sort();
			expect(afterIds).toEqual(beforeIds);
		});

		it('DS3 — when deleting the default set, picks another set as the new default', async () => {
			const sets = await freshInit();
			const originalDefault = sets.defaultSetId;
			const secondId = await sets.createSet('שני');
			await sets.setDefault(originalDefault); // be explicit

			await sets.deleteSet(originalDefault);

			expect(sets.defaultSetId).toBe(secondId);
			expect(await loadDefaultSetId()).toBe(secondId);
		});
	});

	describe('duplicateSet(sourceId)', () => {
		it('DUP1 — creates a clone with " (עותק)" suffix', async () => {
			const sets = await freshInit();
			const sourceId = sets.defaultSetId;
			const sourceName = sets.allSets.find((s) => s.id === sourceId)!.name;

			const newId = await sets.duplicateSet(sourceId);

			expect(newId).not.toBeNull();
			expect(newId).not.toBe(sourceId);
			const copy = sets.allSets.find((s) => s.id === newId)!;
			expect(copy.name).toBe(`${sourceName} (עותק)`);
		});

		it('DUP2 — duplicates every board with a fresh ID and preserves the set membership', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const sourceId = sets.defaultSetId;
			const sourceBoards = Object.values(boards.allBoards).filter(
				(b) => b.setId === sourceId
			);

			const newId = await sets.duplicateSet(sourceId);

			const copyBoards = Object.values(boards.allBoards).filter(
				(b) => b.setId === newId
			);
			expect(copyBoards).toHaveLength(sourceBoards.length);
			// All new IDs are fresh
			for (const cb of copyBoards) {
				expect(sourceBoards.find((sb) => sb.id === cb.id)).toBeUndefined();
			}
		});

		it('DUP3 — folder tiles inside the copy point to copy boards, not source boards', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const sourceId = sets.defaultSetId;
			const sourceBoardIds = new Set(
				Object.values(boards.allBoards)
					.filter((b) => b.setId === sourceId)
					.map((b) => b.id)
			);

			const newId = await sets.duplicateSet(sourceId);

			const copyBoards = Object.values(boards.allBoards).filter(
				(b) => b.setId === newId
			);
			const copyBoardIds = new Set(copyBoards.map((b) => b.id));

			// Find any folder tile in the copy and assert its loadBoard target lives
			// in the copy, not the source.
			let folderCount = 0;
			for (const board of copyBoards) {
				for (const tile of board.tiles) {
					if (tile.type === 'folder' && tile.loadBoard) {
						folderCount++;
						// loadBoard is either remapped to a copy id, OR (if it pointed
						// outside the source set) it stays the same — but for the
						// default set everything is internal, so it must remap.
						if (sourceBoardIds.has(tile.loadBoard)) {
							throw new Error(
								`folder tile ${tile.id} in copy still points to source board ${tile.loadBoard}`
							);
						}
						expect(copyBoardIds.has(tile.loadBoard)).toBe(true);
					}
				}
			}
			// sanity: the default set has folder tiles
			expect(folderCount).toBeGreaterThan(0);
		});

		it('DUP4 — the copy.homeBoardId points to a copy board (not the source home)', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const sourceId = sets.defaultSetId;
			const sourceHomeId = sets.allSets.find((s) => s.id === sourceId)!.homeBoardId;

			const newId = await sets.duplicateSet(sourceId);
			const copy = sets.allSets.find((s) => s.id === newId)!;

			expect(copy.homeBoardId).not.toBe(sourceHomeId);
			const home = boards.allBoards[copy.homeBoardId];
			expect(home).toBeDefined();
			expect(home.setId).toBe(newId);
		});

		it('DUP5 — every duplicated board persists to IDB', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			const sourceId = sets.defaultSetId;

			const newId = await sets.duplicateSet(sourceId);

			const copyBoardIds = Object.values(boards.allBoards)
				.filter((b) => b.setId === newId)
				.map((b) => b.id);

			const persisted = await loadAllBoards();
			for (const id of copyBoardIds) {
				expect(persisted?.[id]).toBeDefined();
				expect(persisted?.[id].setId).toBe(newId);
			}
		});

		it('DUP6 — duplicating an empty set (no boards) returns null', async () => {
			const sets = await freshInit();
			const boards = boardStore();
			// Create a set, then strip all of its boards out of the board store
			const newId = await sets.createSet('ריק');
			const setBoards = Object.values(boards.allBoards).filter((b) => b.setId === newId);
			for (const b of setBoards) {
				await boards.deleteBoard(b.id, { allowHome: true });
			}

			const result = await sets.duplicateSet(newId);
			expect(result).toBeNull();
		});

		it('DUP7 — non-existent source returns null', async () => {
			const sets = await freshInit();
			const result = await sets.duplicateSet('does-not-exist');
			expect(result).toBeNull();
		});
	});

	describe('resetToDefaults()', () => {
		it('R1 — clears all sets+boards and re-runs migration', async () => {
			const sets = await freshInit();
			await sets.createSet('זמני');
			expect(sets.allSets.length).toBeGreaterThan(1);

			await sets.resetToDefaults();

			expect(sets.allSets).toHaveLength(1);
			expect(sets.allSets[0].name).toBe('האוסף שלי');
			// Default boards are back
			const persistedBoards = await loadAllBoards();
			for (const id of Object.keys(defaultBoards)) {
				expect(persistedBoards?.[id]).toBeDefined();
				expect(persistedBoards?.[id].setId).toBe(sets.defaultSetId);
			}
		});
	});
});
