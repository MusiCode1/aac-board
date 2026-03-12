import type { Board, OutputItem, Tile } from '$lib/types/board';
import { boards, HOME_BOARD_ID } from '$lib/data/boards';

/** Navigation stack for going back */
let navigationStack = $state<string[]>([]);

/** Currently displayed board */
let currentBoard = $state<Board>(boards[HOME_BOARD_ID]);

/** Output bar items (tiles that have been pressed) */
let output = $state<OutputItem[]>([]);

/** Navigation direction for transition animations */
let navDirection = $state<'forward' | 'back' | 'none'>('none');

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

		get navDirection() {
			return navDirection;
		},

		/** Get breadcrumb trail (board names in the stack) */
		get breadcrumbs(): string[] {
			return navigationStack.map((id) => boards[id]?.name ?? id);
		},

		/** Navigate to a sub-board (folder) */
		navigateTo(boardId: string) {
			const target = boards[boardId];
			if (!target) return;
			navigationStack.push(currentBoard.id);
			navDirection = 'forward';
			currentBoard = target;
		},

		/** Go back to the previous board */
		goBack() {
			const prevId = navigationStack.pop();
			if (prevId && boards[prevId]) {
				navDirection = 'back';
				currentBoard = boards[prevId];
			}
		},

		/** Go to the home board, clearing the stack */
		goHome() {
			navDirection = 'back';
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
