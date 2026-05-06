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
	saveBoard,
	clearAllSets,
	saveAllBoards
} from '$lib/services/storage';
import { boards as defaultBoards, HOME_BOARD_ID } from '$lib/data/boards';
import { boardStore, createEmptyBoard } from '$lib/stores/board.svelte';
import type { Board } from '$lib/types/board';

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
			const boards = boardStore();
			const now = Date.now();
			const id = generateId();
			const homeBoardId = generateId();
			await boards.createBoard(createEmptyBoard(homeBoardId, 'בית', 4, 5, id));
			const newSet: BoardSet = {
				id,
				name,
				homeBoardId,
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
			const boards = boardStore();
			const remainingBoards = Object.fromEntries(
				Object.entries(boards.allBoards).filter(([, board]) => board.setId !== id)
			);
			await deleteSetFromDB(id);
			allSets = allSets.filter((s) => s.id !== id);
			await boards.importBoards(remainingBoards);
			if (defaultSetId === id) {
				defaultSetId = allSets[0]?.id ?? '';
				await saveDefaultSetId(defaultSetId);
			}
		},

		async setDefault(id: string) {
			defaultSetId = id;
			await saveDefaultSetId(id);
		},

		async duplicateSet(sourceSetId: string): Promise<string | null> {
			const sourceSet = allSets.find((set) => set.id === sourceSetId);
			if (!sourceSet) return null;

			const boards = boardStore();
			const sourceBoards = Object.values(boards.allBoards).filter(
				(board) => board.setId === sourceSetId
			);
			if (sourceBoards.length === 0) return null;

			const nextSetId = generateId();
			const boardIdMap = new Map<string, string>();
			for (const sourceBoard of sourceBoards) {
				boardIdMap.set(sourceBoard.id, generateId());
			}

			const now = Date.now();
			for (const sourceBoard of sourceBoards) {
				const cloned = structuredClone($state.snapshot(sourceBoard) as Board);
				cloned.id = boardIdMap.get(sourceBoard.id)!;
				cloned.setId = nextSetId;
				cloned.createdAt = now;
				cloned.updatedAt = now;
				cloned.tiles = cloned.tiles.map((tile) => ({
					...tile,
					id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					loadBoard: tile.loadBoard
						? (boardIdMap.get(tile.loadBoard) ?? tile.loadBoard)
						: tile.loadBoard
				}));
				await boards.createBoard(cloned);
			}

			const duplicatedSet: BoardSet = {
				id: nextSetId,
				name: `${sourceSet.name} (עותק)`,
				homeBoardId: boardIdMap.get(sourceSet.homeBoardId) ?? Array.from(boardIdMap.values())[0],
				createdAt: now,
				updatedAt: now
			};

			await saveSet(duplicatedSet);
			allSets.push(duplicatedSet);
			return nextSetId;
		},

		async resetToDefaults() {
			const boards = boardStore();
			await clearAllSets();
			allSets = [];
			defaultSetId = '';
			initialized = false;
			await boards.resetToDefaults();
			await this.init();
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
	const storedBoards = (await loadAllBoards()) ?? structuredClone(defaultBoards);
	for (const board of Object.values(storedBoards)) {
		if (!board.setId) {
			board.setId = setId;
		}
		board.createdAt = board.createdAt || now;
		board.updatedAt = board.updatedAt || now;
	}
	await saveAllBoards(storedBoards);
	// Sync the in-memory boardStore so allBoards reflects the migrated setIds
	// without requiring a separate boards.init() call.
	boardStore().setAllBoards(storedBoards as Record<string, Board>);

	await saveSet(defaultSet);
	await saveDefaultSetId(setId);

	allSets = [defaultSet];
	defaultSetId = setId;
}
