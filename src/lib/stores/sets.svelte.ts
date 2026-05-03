/**
 * Sets store — manages board collections (אוספים).
 *
 * On first init(), runs migration: wraps all existing boards in a
 * default set ("האוסף שלי") and persists the set ID so future loads
 * skip migration.
 */
import type { BoardSet } from '$lib/types/set';
import { generateId } from '$lib/utils/ids';
import {
	loadAllSets,
	saveSet,
	deleteSet as deleteSetFromDB,
	loadDefaultSetId,
	saveDefaultSetId,
	loadAllBoards,
	saveBoard
} from '$lib/services/storage';
import { HOME_BOARD_ID } from '$lib/data/boards';

let allSets = $state<BoardSet[]>([]);
let defaultSetId = $state<string>('');
let initialized = $state(false);

export function setsStore() {
	return {
		get allSets() {
			return allSets;
		},

		get defaultSetId() {
			return defaultSetId;
		},

		get defaultSet(): BoardSet | undefined {
			return allSets.find((s) => s.id === defaultSetId);
		},

		get initialized() {
			return initialized;
		},

		async init() {
			if (initialized) return;

			try {
				const existingDefaultId = await loadDefaultSetId();

				if (existingDefaultId) {
					// Already migrated — just load
					allSets = await loadAllSets();
					defaultSetId = existingDefaultId;
				} else {
					// First run or pre-sets user — run migration
					await runMigration();
				}
			} catch (e) {
				console.warn('[setsStore] init error:', e);
			}

			initialized = true;
		},

		async createSet(name: string): Promise<string> {
			const now = Date.now();
			const id = generateId();
			const newSet: BoardSet = {
				id,
				name,
				homeBoardId: HOME_BOARD_ID,
				createdAt: now,
				updatedAt: now
			};
			await saveSet(newSet);
			allSets.push(newSet);
			return id;
		},

		async updateSet(id: string, updates: Partial<Pick<BoardSet, 'name' | 'homeBoardId'>>) {
			const idx = allSets.findIndex((s) => s.id === id);
			if (idx === -1) return;
			const updated: BoardSet = {
				...allSets[idx],
				...updates,
				updatedAt: Date.now()
			};
			await saveSet(updated);
			allSets[idx] = updated;
		},

		async deleteSet(id: string) {
			if (allSets.length <= 1) return; // last set cannot be deleted
			await deleteSetFromDB(id);
			allSets = allSets.filter((s) => s.id !== id);
			if (defaultSetId === id) {
				defaultSetId = allSets[0]?.id ?? '';
				await saveDefaultSetId(defaultSetId);
			}
		},

		async setDefault(id: string) {
			defaultSetId = id;
			await saveDefaultSetId(id);
		}
	};
}

/** Create a default set and assign it to all existing boards. */
async function runMigration() {
	const now = Date.now();
	const setId = generateId();

	const defaultSet: BoardSet = {
		id: setId,
		name: 'האוסף שלי',
		homeBoardId: HOME_BOARD_ID,
		createdAt: now,
		updatedAt: now
	};

	// Assign all existing (or default) boards to the new set
	const boards = await loadAllBoards();
	if (boards) {
		for (const board of Object.values(boards)) {
			if (!board.setId) {
				board.setId = setId;
				board.createdAt = board.createdAt || now;
				board.updatedAt = board.updatedAt || now;
				await saveBoard(board);
			}
		}
	}

	await saveSet(defaultSet);
	await saveDefaultSetId(setId);

	allSets = [defaultSet];
	defaultSetId = setId;
}
