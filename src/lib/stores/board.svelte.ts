import type { Board, OutputItem, Tile } from '$lib/types/board';
import { boards as defaultBoards, HOME_BOARD_ID } from '$lib/data/boards';
import { saveAllBoards, saveBoard, loadAllBoards, deleteBoard } from '$lib/services/storage';

/**
 * Generate a URL-safe board ID from a name (slug + dedup against existing boards).
 * Falls back to `board-<timestamp>` if the slug is empty.
 */
export function generateBoardId(name: string, existing: Record<string, Board>): string {
	// Slug: keep Unicode letters/digits, replace runs of anything else with '-'
	const base = name
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-+|-+$/g, '');
	const candidate = base || `board-${Date.now()}`;
	if (!existing[candidate]) return candidate;
	let i = 2;
	while (existing[`${candidate}-${i}`]) i++;
	return `${candidate}-${i}`;
}

/** Create a fresh, empty board with a given name and grid size. */
export function createEmptyBoard(
	id: string,
	name: string,
	rows: number = 3,
	columns: number = 4
): Board {
	return {
		id,
		name,
		tiles: [],
		grid: { rows, columns }
	};
}

/** All boards (mutable — loaded from IndexedDB or defaults) */
let allBoards = $state<Record<string, Board>>({ ...defaultBoards });

/** Navigation stack for going back */
let navigationStack = $state<string[]>([]);

/** Currently displayed board */
let currentBoard = $state<Board>(allBoards[HOME_BOARD_ID]);

/** Output bar items (tiles that have been pressed) */
let output = $state<OutputItem[]>([]);

/** Navigation direction for transition animations */
let navDirection = $state<'forward' | 'back' | 'none'>('none');

/** Edit mode state */
let editMode = $state(false);

/** Whether boards have been loaded from storage */
let initialized = $state(false);

/** Auto-save the current board to IndexedDB */
async function persist(board: Board) {
	try {
		await saveBoard($state.snapshot(board) as Board);
	} catch {
		// IndexedDB not available (SSR, private browsing)
	}
}

export function boardStore() {
	return {
		get currentBoard() {
			return currentBoard;
		},

		get allBoards() {
			return allBoards;
		},

		get output() {
			return output;
		},

		get navigationStack() {
			return navigationStack;
		},

		get canGoBack() {
			return navigationStack.length > 0;
		},

		get navDirection() {
			return navDirection;
		},

		get editMode() {
			return editMode;
		},

		get initialized() {
			return initialized;
		},

		/** Get breadcrumb trail (board names in the stack) */
		get breadcrumbs(): string[] {
			return navigationStack.map((id) => allBoards[id]?.name ?? id);
		},

		/** Initialize store — load from IndexedDB or use defaults */
		async init() {
			if (initialized) return;
			try {
				const saved = await loadAllBoards();
				if (saved) {
					allBoards = saved;
					currentBoard = allBoards[HOME_BOARD_ID] ?? Object.values(allBoards)[0];
				} else {
					// First run — save defaults to IndexedDB
					await saveAllBoards($state.snapshot(allBoards) as Record<string, Board>);
				}
			} catch {
				// IndexedDB not available
			}
			initialized = true;
		},

		/** Toggle edit mode */
		toggleEditMode() {
			editMode = !editMode;
		},

		setEditMode(value: boolean) {
			editMode = value;
		},

		// ── Navigation ──

		navigateTo(boardId: string) {
			const target = allBoards[boardId];
			if (!target) {
				console.warn(`[boardStore] navigateTo: board "${boardId}" not found`);
				return;
			}
			navigationStack.push(currentBoard.id);
			navDirection = 'forward';
			currentBoard = target;
		},

		goBack() {
			const prevId = navigationStack.pop();
			if (prevId && allBoards[prevId]) {
				navDirection = 'back';
				currentBoard = allBoards[prevId];
			}
		},

		goHome() {
			navDirection = 'back';
			navigationStack = [];
			currentBoard = allBoards[HOME_BOARD_ID] ?? Object.values(allBoards)[0];
		},

		// ── Output bar ──

		addToOutput(tile: Tile) {
			output.push({
				id: tile.id,
				label: tile.label,
				image: tile.image
			});
		},

		clearOutput() {
			output = [];
		},

		getOutputLabels(): string[] {
			return output.map((item) => item.label);
		},

		// ── CRUD: Tiles ──

		/** Update a tile in the current board */
		updateTile(tileId: string, updates: Partial<Tile>) {
			const idx = currentBoard.tiles.findIndex((t) => t.id === tileId);
			if (idx === -1) return;
			currentBoard.tiles[idx] = { ...currentBoard.tiles[idx], ...updates };
			allBoards[currentBoard.id] = currentBoard;
			persist(currentBoard);
		},

		/** Add a new tile to the current board */
		addTile(tile: Tile) {
			currentBoard.tiles.push(tile);
			allBoards[currentBoard.id] = currentBoard;
			persist(currentBoard);
		},

		/** Remove a tile from the current board */
		removeTile(tileId: string) {
			const idx = currentBoard.tiles.findIndex((t) => t.id === tileId);
			if (idx === -1) return;
			currentBoard.tiles.splice(idx, 1);
			allBoards[currentBoard.id] = currentBoard;
			persist(currentBoard);
		},

		/** Remove tiles that overflow the grid */
		trimTilesToGrid() {
			const max = currentBoard.grid.rows * currentBoard.grid.columns;
			if (currentBoard.tiles.length > max) {
				currentBoard.tiles = currentBoard.tiles.slice(0, max);
				allBoards[currentBoard.id] = currentBoard;
				persist(currentBoard);
			}
		},

		/** Reorder tiles (after drag & drop) */
		reorderTiles(newTiles: Tile[]) {
			currentBoard.tiles = newTiles;
			allBoards[currentBoard.id] = currentBoard;
			persist(currentBoard);
		},

		// ── CRUD: Board ──

		/** Update board properties (name, grid) */
		updateBoard(boardId: string, updates: Partial<Pick<Board, 'name' | 'grid'>>) {
			const board = allBoards[boardId];
			if (!board) return;
			if (updates.name !== undefined) board.name = updates.name;
			if (updates.grid) board.grid = { ...board.grid, ...updates.grid };
			allBoards[boardId] = board;
			if (currentBoard.id === boardId) currentBoard = board;
			persist(board);
		},

		/** Create a new board */
		createBoard(board: Board) {
			allBoards[board.id] = board;
			persist(board);
		},

		/**
		 * Create a new empty board from a name. Generates an ID automatically.
		 * Returns the new board's ID.
		 */
		createBoardFromName(name: string, rows: number = 3, columns: number = 4): string {
			const id = generateBoardId(name, allBoards);
			const board = createEmptyBoard(id, name, rows, columns);
			allBoards[id] = board;
			persist(board);
			return id;
		},

		/**
		 * Duplicate a board (deep clone). Tile IDs are regenerated, `loadBoard` refs
		 * are preserved (no recursive tree clone).
		 * Returns the new board's ID, or null if the source doesn't exist.
		 */
		duplicateBoard(sourceId: string, newName?: string): string | null {
			const source = allBoards[sourceId];
			if (!source) return null;
			const cloned = structuredClone($state.snapshot(source) as Board);
			const displayName = newName ?? `${source.name} (עותק)`;
			const newId = generateBoardId(displayName, allBoards);
			cloned.id = newId;
			cloned.name = displayName;
			cloned.tiles = cloned.tiles.map((t) => ({
				...t,
				id: `tile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
			}));
			allBoards[newId] = cloned;
			persist(cloned);
			return newId;
		},

		/**
		 * Find all boards (and their folder tiles) that reference `boardId` via `loadBoard`.
		 * Read-only; does not mutate anything.
		 */
		findBoardDependents(
			boardId: string
		): { boardId: string; boardName: string; tileIds: string[] }[] {
			const result: { boardId: string; boardName: string; tileIds: string[] }[] = [];
			for (const board of Object.values(allBoards)) {
				const matchingTiles = board.tiles.filter(
					(t) => t.type === 'folder' && t.loadBoard === boardId
				);
				if (matchingTiles.length > 0) {
					result.push({
						boardId: board.id,
						boardName: board.name,
						tileIds: matchingTiles.map((t) => t.id)
					});
				}
			}
			return result;
		},

		/**
		 * Strip all folder references to `boardId`: convert matching tiles to plain buttons
		 * (type='button', loadBoard=undefined). Persists each affected board.
		 */
		async stripBoardReferences(boardId: string): Promise<void> {
			for (const board of Object.values(allBoards)) {
				let changed = false;
				for (const tile of board.tiles) {
					if (tile.type === 'folder' && tile.loadBoard === boardId) {
						tile.type = 'button';
						tile.loadBoard = undefined;
						changed = true;
					}
				}
				if (changed) {
					allBoards[board.id] = board;
					if (currentBoard.id === board.id) currentBoard = board;
					await saveBoard($state.snapshot(board) as Board);
				}
			}
		},

		/** Delete a board */
		async deleteBoard(boardId: string) {
			if (boardId === HOME_BOARD_ID) return; // Can't delete home
			delete allBoards[boardId];
			await deleteBoard(boardId);
			if (currentBoard.id === boardId) {
				this.goHome();
			}
		},

		/** Reset all boards to defaults */
		async resetToDefaults() {
			allBoards = { ...defaultBoards };
			currentBoard = allBoards[HOME_BOARD_ID];
			navigationStack = [];
			await saveAllBoards($state.snapshot(allBoards) as Record<string, Board>);
		},

		/** Replace all boards (for import) */
		async importBoards(boards: Record<string, Board>) {
			allBoards = boards;
			currentBoard = allBoards[HOME_BOARD_ID] ?? Object.values(allBoards)[0];
			navigationStack = [];
			await saveAllBoards($state.snapshot(allBoards) as Record<string, Board>);
		}
	};
}
