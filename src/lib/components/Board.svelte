<script lang="ts">
	import type { Board, Tile as TileType } from '$lib/types/board';
	import Tile from './Tile.svelte';

	interface Props {
		board: Board;
		ontilepress: (tile: TileType) => void;
		direction: 'forward' | 'back' | 'none';
		editMode: boolean;
	}

	let { board, ontilepress, direction = 'none', editMode = false }: Props = $props();

	let animClass = $derived(
		direction === 'back' ? 'slide-right' : direction === 'forward' ? 'slide-left' : ''
	);
</script>

{#key board.id}
	<div
		class="board-grid {animClass}"
		style="--rows: {board.grid.rows}; --cols: {board.grid.columns}"
		role="grid"
		aria-label={board.name}
	>
		{#each board.tiles as tile, i (tile.id)}
			<Tile {tile} index={i} onpress={ontilepress} {editMode} />
		{/each}
	</div>
{/key}

<style>
	.board-grid {
		display: grid;
		grid-template-rows: repeat(var(--rows, 4), 1fr);
		grid-template-columns: repeat(var(--cols, 5), 1fr);
		gap: 8px;
		padding: 12px;
		flex: 1;
		min-height: 0;
		width: 100%;
		max-width: 100%;
		overflow: hidden;
	}

	/* Board transition animations */
	.board-grid.slide-left {
		animation: slide-in-left 0.3s ease-out;
	}

	.board-grid.slide-right {
		animation: slide-in-right 0.3s ease-out;
	}

	@keyframes slide-in-left {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes slide-in-right {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
