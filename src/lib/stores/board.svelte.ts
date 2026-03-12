import type { Board, OutputItem, Tile } from '$lib/types/board';
import { boards, HOME_BOARD_ID } from '$lib/data/boards';

/** Navigation stack for going back */
let navigationStack = $state<string[]>([]);

/** Currently displayed board */
let currentBoard = $state<Board>(boards[HOME_BOARD_ID]);

/** Output bar items (tiles that have been pressed) */
let output = $state<OutputItem[]>([]);

export function boardStore() {
	return {
		get currentBoard() {
			return currentBoard;
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

		/** Navigate to a sub-board (folder) */
		navigateTo(boardId: string) {
			const target = boards[boardId];
			if (!target) return;
			navigationStack.push(currentBoard.id);
			currentBoard = target;
		},

		/** Go back to the previous board */
		goBack() {
			const prevId = navigationStack.pop();
			if (prevId && boards[prevId]) {
				currentBoard = boards[prevId];
			}
		},

		/** Go to the home board, clearing the stack */
		goHome() {
			navigationStack = [];
			currentBoard = boards[HOME_BOARD_ID];
		},

		/** Add a tile to the output bar */
		addToOutput(tile: Tile) {
			output.push({
				id: tile.id,
				label: tile.label,
				image: tile.image
			});
		},

		/** Clear the output bar */
		clearOutput() {
			output = [];
		},

		/** Get all output labels */
		getOutputLabels(): string[] {
			return output.map((item) => item.label);
		}
	};
}
