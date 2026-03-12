import type { Board, OutputItem, Tile } from '$lib/types/board';
import { boards as defaultBoards, HOME_BOARD_ID } from '$lib/data/boards';
import { saveAllBoards, saveBoard, loadAllBoards, deleteBoard } from '$lib/services/storage';

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
		await saveBoard(board);
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
					await saveAllBoards(allBoards);
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
			if (!target) return;
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
			await saveAllBoards(allBoards);
		},

		/** Replace all boards (for import) */
		async importBoards(boards: Record<string, Board>) {
			allBoards = boards;
			currentBoard = allBoards[HOME_BOARD_ID] ?? Object.values(allBoards)[0];
			navigationStack = [];
			await saveAllBoards(allBoards);
		}
	};
}
