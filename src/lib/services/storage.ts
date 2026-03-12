import { get, set, del, keys } from 'idb-keyval';
import type { Board } from '$lib/types/board';

const BOARDS_PREFIX = 'board:';
const BOARDS_INDEX_KEY = 'boards-index';

/** Save a single board to IndexedDB */
export async function saveBoard(board: Board): Promise<void> {
	await set(BOARDS_PREFIX + board.id, board);
	await updateIndex(board.id, 'add');
}

/** Save all boards to IndexedDB */
export async function saveAllBoards(boards: Record<string, Board>): Promise<void> {
	const ids: string[] = [];
	for (const [id, board] of Object.entries(boards)) {
		await set(BOARDS_PREFIX + id, board);
		ids.push(id);
	}
	await set(BOARDS_INDEX_KEY, ids);
}

/** Load a single board from IndexedDB */
export async function loadBoard(id: string): Promise<Board | undefined> {
	return get<Board>(BOARDS_PREFIX + id);
}

/** Load all boards from IndexedDB */
export async function loadAllBoards(): Promise<Record<string, Board> | null> {
	const index = await get<string[]>(BOARDS_INDEX_KEY);
	if (!index || index.length === 0) return null;

	const boards: Record<string, Board> = {};
	for (const id of index) {
		const board = await get<Board>(BOARDS_PREFIX + id);
		if (board) {
			boards[id] = board;
		}
	}
	return Object.keys(boards).length > 0 ? boards : null;
}

/** Delete a board from IndexedDB */
export async function deleteBoard(id: string): Promise<void> {
	await del(BOARDS_PREFIX + id);
	await updateIndex(id, 'remove');
}

/** Check if any boards are saved */
export async function hasSavedBoards(): Promise<boolean> {
	const index = await get<string[]>(BOARDS_INDEX_KEY);
	return !!index && index.length > 0;
}

/** Export all boards as a JSON string */
export async function exportBoardsJSON(): Promise<string> {
	const boards = await loadAllBoards();
	return JSON.stringify(boards, null, 2);
}

/** Import boards from a JSON string */
export async function importBoardsJSON(json: string): Promise<Record<string, Board>> {
	const boards = JSON.parse(json) as Record<string, Board>;
	await saveAllBoards(boards);
	return boards;
}

/** Clear all saved boards */
export async function clearAllBoards(): Promise<void> {
	const allKeys = await keys();
	for (const key of allKeys) {
		if (typeof key === 'string' && key.startsWith(BOARDS_PREFIX)) {
			await del(key);
		}
	}
	await del(BOARDS_INDEX_KEY);
}

async function updateIndex(id: string, action: 'add' | 'remove'): Promise<void> {
	const index = (await get<string[]>(BOARDS_INDEX_KEY)) ?? [];
	if (action === 'add' && !index.includes(id)) {
		index.push(id);
	} else if (action === 'remove') {
		const i = index.indexOf(id);
		if (i !== -1) index.splice(i, 1);
	}
	await set(BOARDS_INDEX_KEY, index);
}
